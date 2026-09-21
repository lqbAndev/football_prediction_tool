import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { UCL_TEAMS, UCL_TEAMS_BY_ID } from '../data/competitions/ucl2627';
import { generatePresetSwissDraw, generateRandomSwissDraw } from '../utils/swissDraw';
import { simulateUCLMatch } from '../utils/uclEngine';
import {
  simulateKnockoutLeg1,
  simulateKnockoutLeg2,
  simulateExtraTime,
  ensureExtraTimeDetails,
  simulatePenalties,
  generatePlayoffs,
  generateRoundOf16,
  generateQuarterFinals,
  generateSemiFinals,
  generateFinal,
} from '../utils/uclKnockout';
import { calculateUCLStandings, explainUCLRank } from '../utils/uclStandings';
import { computeUclRecapStats } from '../utils/uclRecapStats';
import { calculateUCLMatchMOTM } from '../utils/uclMotm';
import { loadUCLState, saveUCLState, clearUCLState } from '../utils/uclStorage';
import type { UCLSavedState } from '../utils/uclStorage';
import type { LeagueMatch, LeagueStanding } from '../types/leagueConfig';
import type { UCLLeagueStanding } from '../utils/uclStandings';
import type { TwoLegMatch } from '../types/uclConfig';
import type { Team } from '../types/tournament';

// Components
import { UCLHeroBranding } from '../components/ucl/UCLHeroBranding';
import { UCLMatchCard } from '../components/ucl/UCLMatchCard';
import { UCLStandingsTable } from '../components/ucl/UCLStandingsTable';
import { UCLTopScorersTable } from '../components/ucl/UCLTopScorersTable';
import { UCLTopAssistsTable } from '../components/ucl/UCLTopAssistsTable';
import { UCLMatchdaySlider } from '../components/ucl/UCLMatchdaySlider';
import { UCLKnockoutBracket } from '../components/ucl/UCLKnockoutBracket';
import { UCLChampionModal } from '../components/ucl/UCLChampionModal';
import { UCLTeamModal } from '../components/ucl/UCLTeamModal';
import { UCLPlayerGoalModal } from '../components/ucl/UCLPlayerGoalModal';
import { UCLRecap } from '../components/ucl/UCLRecap';
import { UCLPot1DrawTable } from '../components/ucl/UCLPot1DrawTable';
import { UCLCountrySummaryTable } from '../components/ucl/UCLCountrySummaryTable';
import { BackToTopButton } from '../components/BackToTopButton';
import { UCLMorphIcon } from '../components/ucl/UCLMorphIcon';
import { UCLWhyRankModal } from '../components/ucl/UCLWhyRankModal';
import { UCLMatchdayRecap } from '../components/ucl/UCLMatchdayRecap';
import { UCLPathToMadrid } from '../components/ucl/UCLPathToMadrid';
import { UCLFinalMatchdayLive } from '../components/ucl/UCLFinalMatchdayLive';

// Assets & Icons
import {
  RotateCcw,
  ArrowLeft,
  Calendar,
  Layers,
  Sparkles,
  AlertTriangle,
  Lock,
} from 'lucide-react';
import { Check, Play as PlayIcon, RefreshCw as RefreshIcon } from 'lucide';
import uclBallSideImg from '../img/CUP COMPETITION/UCL/ball/ucl_ball_26-27_side.png';
import uclBallSide2Img from '../img/CUP COMPETITION/UCL/ball/ucl_ball_26-27_side_2.png';
import uclCupImg from '../img/CUP COMPETITION/UCL/ucl_cup.png';

const getCompletedRoundWinners = (
  matches: TwoLegMatch[],
  expectedTieCount: number,
): string[] | null => {
  const isFullyResolved = (match: TwoLegMatch) => {
    const status = match.tieStatus || (match.isCompleted ? 'completed' : 'pending');
    const aggregateIsLevel = match.aggregate.homeScore !== null
      && match.aggregate.awayScore !== null
      && match.aggregate.homeScore === match.aggregate.awayScore;

    return (
      match.isCompleted &&
      status === 'completed' &&
      Boolean(match.winnerId) &&
      (!aggregateIsLevel || Boolean(match.leg2.penalties))
    );
  };

  if (
    expectedTieCount <= 0 ||
    matches.length !== expectedTieCount ||
    !matches.every(isFullyResolved)
  ) {
    return null;
  }

  const winners = matches
    .map((match) => match.winnerId)
    .filter((winnerId): winnerId is string => Boolean(winnerId));

  return winners.length === expectedTieCount ? winners : null;
};

const normalizeSavedKnockoutProgress = (state: UCLSavedState | null): UCLSavedState | null => {
  if (!state) return null;

  const playoffsComplete = Boolean(getCompletedRoundWinners(state.playoffs, 8));
  const roundOf16 = playoffsComplete ? state.roundOf16 : [];
  const roundOf16Complete = Boolean(getCompletedRoundWinners(roundOf16, 8));
  const quarterfinals = roundOf16Complete ? state.quarterfinals : [];
  const quarterfinalsComplete = Boolean(getCompletedRoundWinners(quarterfinals, 4));
  const semifinals = quarterfinalsComplete ? state.semifinals : [];
  const semifinalsComplete = Boolean(getCompletedRoundWinners(semifinals, 2));
  const finalMatch = semifinalsComplete ? state.finalMatch : null;
  const champion = finalMatch?.isCompleted && finalMatch.winnerId ? state.champion : null;

  return { ...state, roundOf16, quarterfinals, semifinals, finalMatch, champion };
};

const restoreLeagueMatchMOTM = (matches: LeagueMatch[]): LeagueMatch[] =>
  matches.map((match) => {
    if (match.status !== 'completed' || match.homeScore === null || match.awayScore === null) return match;
    const homeTeam = UCL_TEAMS_BY_ID[match.homeTeamId];
    const awayTeam = UCL_TEAMS_BY_ID[match.awayTeamId];
    if (!homeTeam || !awayTeam) return match;
    const winnerTeamId = match.homeScore === match.awayScore
      ? null
      : match.homeScore > match.awayScore
      ? homeTeam.id
      : awayTeam.id;
    return {
      ...match,
      motm: calculateUCLMatchMOTM({
        homeTeam,
        awayTeam,
        homeScore: match.homeScore,
        awayScore: match.awayScore,
        timeline: match.timeline,
        playerRatings: match.playerRatings,
        winnerTeamId,
        finalizedAt: '90',
      }),
    };
  });

const simulateLeagueFixture = (match: LeagueMatch): LeagueMatch => {
  if (match.status === 'completed') return match;
  const homeTeam = UCL_TEAMS_BY_ID[match.homeTeamId];
  const awayTeam = UCL_TEAMS_BY_ID[match.awayTeamId];
  if (!homeTeam || !awayTeam) return match;
  const sim = simulateUCLMatch(homeTeam, awayTeam);
  return {
    ...match,
    homeScore: sim.homeScore,
    awayScore: sim.awayScore,
    status: 'completed',
    predictedAt: new Date().toISOString(),
    scorers: sim.scorers,
    timeline: sim.timeline,
    motm: sim.motm,
    playerRatings: sim.playerRatings,
    stoppageTime: sim.stoppageTime,
  };
};

const restoreKnockoutMOTM = (matches: TwoLegMatch[]): TwoLegMatch[] =>
  matches.map((match) => {
    const homeTeam = UCL_TEAMS_BY_ID[match.homeTeamId];
    const awayTeam = UCL_TEAMS_BY_ID[match.awayTeamId];
    if (!homeTeam || !awayTeam) return match;

    const restored = ensureExtraTimeDetails(match, homeTeam, awayTeam);
    const leg1WinnerId = restored.leg1.homeScore === restored.leg1.awayScore
      ? null
      : (restored.leg1.homeScore || 0) > (restored.leg1.awayScore || 0)
      ? awayTeam.id
      : homeTeam.id;
    const leg1Motm = restored.leg1.status === 'completed' && restored.leg1.homeScore !== null && restored.leg1.awayScore !== null
      ? calculateUCLMatchMOTM({
          homeTeam: awayTeam,
          awayTeam: homeTeam,
          homeScore: restored.leg1.homeScore,
          awayScore: restored.leg1.awayScore,
          timeline: restored.leg1.timeline,
          playerRatings: restored.leg1.playerRatings,
          winnerTeamId: leg1WinnerId,
          finalizedAt: '90',
        })
      : restored.leg1.motm;

    let leg2Motm = restored.leg2.motm;
    if (restored.leg2.status === 'completed') {
      if (!restored.isCompleted) {
        leg2Motm = null;
      } else {
        const finalizedAt = restored.leg2.penalties
          ? 'penalties'
          : restored.leg2.extraTime
          ? '120'
          : '90';
        leg2Motm = calculateUCLMatchMOTM({
          homeTeam,
          awayTeam,
          homeScore: (restored.leg2.homeScore || 0) + (restored.leg2.etHomeGoals || 0),
          awayScore: (restored.leg2.awayScore || 0) + (restored.leg2.etAwayGoals || 0),
          timeline: [...(restored.leg2.timeline || []), ...(restored.leg2.etTimeline || [])],
          playerRatings: restored.leg2.playerRatings,
          winnerTeamId: restored.winnerId,
          finalizedAt,
          penalties: restored.leg2.penalties,
        });
      }
    }

    return {
      ...restored,
      leg1: { ...restored.leg1, motm: leg1Motm },
      leg2: { ...restored.leg2, motm: leg2Motm },
    };
  });

export const UCLApp: React.FC = () => {
  const navigate = useNavigate();

  // ── Persistent State Initialization (Fix F5 reset bug) ──
  const savedState = useMemo(() => normalizeSavedKnockoutProgress(loadUCLState()), []);

  const [leagueMatches, setLeagueMatches] = useState<LeagueMatch[]>(() =>
    savedState ? restoreLeagueMatchMOTM(savedState.leagueMatches) : generatePresetSwissDraw(UCL_TEAMS)
  );
  const [currentMatchday, setCurrentMatchday] = useState(
    savedState ? savedState.currentMatchday : 1
  );

  // Knockout Bracket State
  const [playoffs, setPlayoffs] = useState<TwoLegMatch[]>(() =>
    savedState ? restoreKnockoutMOTM(savedState.playoffs) : []
  );
  const [roundOf16, setRoundOf16] = useState<TwoLegMatch[]>(() =>
    savedState ? restoreKnockoutMOTM(savedState.roundOf16) : []
  );
  const [quarterfinals, setQuarterfinals] = useState<TwoLegMatch[]>(() =>
    savedState ? restoreKnockoutMOTM(savedState.quarterfinals) : []
  );
  const [semifinals, setSemifinals] = useState<TwoLegMatch[]>(() =>
    savedState ? restoreKnockoutMOTM(savedState.semifinals) : []
  );
  const [finalMatch, setFinalMatch] = useState<TwoLegMatch | null>(() =>
    savedState?.finalMatch ? restoreKnockoutMOTM([savedState.finalMatch])[0] : null
  );
  const [champion, setChampion] = useState<Team | null>(() =>
    savedState ? savedState.champion : null
  );
  const [knockoutSimPhase, setKnockoutSimPhase] = useState<
    'regulation' | 'aet' | 'penalties'
  >('regulation');

  // Modals & Selected Entities
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [rankExplanationTeamId, setRankExplanationTeamId] = useState<string | null>(null);
  const [selectedPlayerGoal, setSelectedPlayerGoal] = useState<{
    playerId: string;
    playerName: string;
    teamId: string;
    teamName: string;
    stat?: 'goals' | 'assists';
  } | null>(null);

  const [isChampionModalOpen, setIsChampionModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [drawError, setDrawError] = useState<string | null>(null);
  const [drawFeedback, setDrawFeedback] = useState<'real' | 'random' | null>(null);
  const [finalMatchdayLive, setFinalMatchdayLive] = useState<{
    finalMatches: LeagueMatch[];
    minute: number;
    paused: boolean;
  } | null>(null);
  const drawFeedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showDrawFeedback = (type: 'real' | 'random') => {
    if (drawFeedbackTimer.current) clearTimeout(drawFeedbackTimer.current);
    setDrawFeedback(type);
    drawFeedbackTimer.current = setTimeout(() => setDrawFeedback(null), 1400);
  };

  useEffect(() => () => {
    if (drawFeedbackTimer.current) clearTimeout(drawFeedbackTimer.current);
  }, []);

  // Keep downstream rounds locked if a restored or transitional state contains
  // an unresolved upstream tie (especially an aggregate draw awaiting penalties).
  useEffect(() => {
    if (!getCompletedRoundWinners(playoffs, 8)) {
      if (roundOf16.length) setRoundOf16([]);
      if (quarterfinals.length) setQuarterfinals([]);
      if (semifinals.length) setSemifinals([]);
      if (finalMatch) setFinalMatch(null);
      if (champion) setChampion(null);
      return;
    }
    if (!getCompletedRoundWinners(roundOf16, 8)) {
      if (quarterfinals.length) setQuarterfinals([]);
      if (semifinals.length) setSemifinals([]);
      if (finalMatch) setFinalMatch(null);
      if (champion) setChampion(null);
      return;
    }
    if (!getCompletedRoundWinners(quarterfinals, 4)) {
      if (semifinals.length) setSemifinals([]);
      if (finalMatch) setFinalMatch(null);
      if (champion) setChampion(null);
      return;
    }
    if (!getCompletedRoundWinners(semifinals, 2)) {
      if (finalMatch) setFinalMatch(null);
      if (champion) setChampion(null);
    }
  }, [champion, finalMatch, playoffs, quarterfinals, roundOf16, semifinals]);

  // Save state to localStorage whenever simulation progresses
  useEffect(() => {
    saveUCLState({
      leagueMatches,
      currentMatchday,
      playoffs,
      roundOf16,
      quarterfinals,
      semifinals,
      finalMatch,
      champion,
    });
  }, [
    leagueMatches,
    currentMatchday,
    playoffs,
    roundOf16,
    quarterfinals,
    semifinals,
    finalMatch,
    champion,
  ]);

  // A restored champion must trigger the same celebration as a newly crowned one.
  useEffect(() => {
    if (!champion) return;

    const timeoutId = window.setTimeout(() => setIsChampionModalOpen(true), 600);
    return () => window.clearTimeout(timeoutId);
  }, [champion?.id]);

  useEffect(() => {
    if (!isResetModalOpen) return;
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsResetModalOpen(false);
    };
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isResetModalOpen]);

  // ── Computed League Standings ──
  const visibleLeagueMatches = useMemo(() => {
    if (!finalMatchdayLive) return leagueMatches;
    const liveById = new Map(finalMatchdayLive.finalMatches.map((match) => [match.id, match]));
    const liveSortMinute = finalMatchdayLive.minute <= 90
      ? finalMatchdayLive.minute
      : 90 + (finalMatchdayLive.minute - 90) / 10;
    return leagueMatches.map((match) => {
      const final = liveById.get(match.id);
      if (!final) return match;
      const timeline = (final.timeline ?? []).filter((event) => event.sortMinute <= liveSortMinute);
      return {
        ...final,
        homeScore: timeline.filter((event) => event.side === 'home').length,
        awayScore: timeline.filter((event) => event.side === 'away').length,
        timeline,
        scorers: undefined,
        motm: null,
      };
    });
  }, [finalMatchdayLive, leagueMatches]);

  const standings: UCLLeagueStanding[] = useMemo(
    () => calculateUCLStandings(visibleLeagueMatches, UCL_TEAMS, Boolean(finalMatchdayLive)),
    [finalMatchdayLive, visibleLeagueMatches],
  );

  const rankExplanation = useMemo(
    () => rankExplanationTeamId ? explainUCLRank(rankExplanationTeamId, standings) : null,
    [rankExplanationTeamId, standings],
  );

  // All completed knockout matches for statistics
  const allKnockoutMatches = useMemo(() => {
    return [
      ...playoffs,
      ...roundOf16,
      ...quarterfinals,
      ...semifinals,
      ...(finalMatch ? [finalMatch] : []),
    ];
  }, [playoffs, roundOf16, quarterfinals, semifinals, finalMatch]);

  // Unified Recap Stats & Live Top Scorers (Counts ALL League Phase AND Knockout goals)
  const recapStats = useMemo(() => {
    return computeUclRecapStats(leagueMatches, allKnockoutMatches, UCL_TEAMS);
  }, [leagueMatches, allKnockoutMatches]);

  const penaltyGoalsByPlayer = useMemo(() => {
    const totals: Record<string, number> = {};
    const addTimeline = (timeline?: Array<{ playerId: string; isPenalty?: boolean }>) => {
      timeline?.forEach((event) => {
        if (event.isPenalty) totals[event.playerId] = (totals[event.playerId] || 0) + 1;
      });
    };

    leagueMatches.forEach((match) => addTimeline(match.timeline));
    allKnockoutMatches.forEach((tie) => {
      addTimeline(tie.leg1.timeline);
      addTimeline(tie.leg2.timeline);
      addTimeline(tie.leg2.etTimeline);
    });
    return totals;
  }, [leagueMatches, allKnockoutMatches]);

  // Progress counters
  const completedLeagueMatches = useMemo(() => {
    return leagueMatches.filter((m) => m.status === 'completed').length;
  }, [leagueMatches]);

  const completedKnockoutMatches = useMemo(() => {
    return allKnockoutMatches.filter((m) => m.isCompleted).length;
  }, [allKnockoutMatches]);

  const isLeaguePhaseComplete = useMemo(() => {
    return leagueMatches.length === 144 && completedLeagueMatches === 144;
  }, [leagueMatches, completedLeagueMatches]);

  const isKnockoutUnlocked = isLeaguePhaseComplete || playoffs.length > 0;
  const isTournamentComplete = Boolean(champion);
  const isDrawLocked = Boolean(finalMatchdayLive) || (completedLeagueMatches > 0 && !isTournamentComplete);

  const eliminatedTeamIds = useMemo(() => {
    const eliminated = new Set<string>();

    if (isLeaguePhaseComplete) {
      standings.slice(24).forEach((standing) => eliminated.add(standing.teamId));
    }

    allKnockoutMatches.forEach((tie) => {
      if (!tie.isCompleted || !tie.winnerId) return;
      eliminated.add(tie.winnerId === tie.homeTeamId ? tie.awayTeamId : tie.homeTeamId);
    });

    return eliminated;
  }, [allKnockoutMatches, isLeaguePhaseComplete, standings]);

  // ── Auto-initialize Play-offs after League Phase completes ──
  const triggerKnockoutDraw = (currentStandings: LeagueStanding[]) => {
    const poMatches = generatePlayoffs(currentStandings);
    setPlayoffs(poMatches);
    setRoundOf16([]);
    setQuarterfinals([]);
    setSemifinals([]);
    setFinalMatch(null);
  };

  // ── Handlers for Draws & Resets ──
  const handleRealDraw = () => {
    if (isDrawLocked) return;
    const fixtures = generatePresetSwissDraw(UCL_TEAMS);
    setLeagueMatches(fixtures);
    setCurrentMatchday(1);
    setDrawError(null);
    setFinalMatchdayLive(null);
    resetKnockout();
    showDrawFeedback('real');
  };

  const handleRandomDraw = () => {
    if (isDrawLocked) return;
    try {
      const fixtures = generateRandomSwissDraw(UCL_TEAMS);
      setLeagueMatches(fixtures);
      setCurrentMatchday(1);
      setDrawError(null);
      setFinalMatchdayLive(null);
      resetKnockout();
      showDrawFeedback('random');
    } catch (error) {
      console.error('Random Swiss Draw failed validation', error);
      setDrawError('Unable to create a valid UEFA draw. Your current fixtures were kept unchanged.');
    }
  };

  const resetKnockout = () => {
    setPlayoffs([]);
    setRoundOf16([]);
    setQuarterfinals([]);
    setSemifinals([]);
    setFinalMatch(null);
    setChampion(null);
    setKnockoutSimPhase('regulation');
    setIsChampionModalOpen(false);
  };

  const handleResetAll = () => {
    clearUCLState();
    handleRealDraw();
    setCurrentMatchday(1);
    setIsResetModalOpen(false);
  };

  const finishFinalMatchdayLive = () => {
    if (!finalMatchdayLive) return;
    const byId = new Map(finalMatchdayLive.finalMatches.map((match) => [match.id, match]));
    const updated = leagueMatches.map((match) => byId.get(match.id) ?? match);
    setLeagueMatches(updated);
    setFinalMatchdayLive(null);
    if (updated.length === 144 && updated.every((match) => match.status === 'completed') && playoffs.length === 0) {
      triggerKnockoutDraw(calculateUCLStandings(updated, UCL_TEAMS));
    }
  };

  useEffect(() => {
    if (!finalMatchdayLive || finalMatchdayLive.paused) return;
    const finalMinute = 90 + Math.max(0, ...finalMatchdayLive.finalMatches.map((match) => match.stoppageTime?.secondHalf || 0));
    if (finalMatchdayLive.minute >= finalMinute) {
      finishFinalMatchdayLive();
      return;
    }
    const timer = window.setTimeout(() => {
      setFinalMatchdayLive((live) => live ? {
        ...live,
        minute: Math.min(finalMinute, live.minute < 90 ? Math.min(90, live.minute + 5) : live.minute + 1),
      } : null);
    }, 900);
    return () => window.clearTimeout(timer);
  }, [finalMatchdayLive]);

  // ── Match Simulation Handlers ──
  const simulateSingleLeagueMatch = (matchId: string) => {
    setLeagueMatches((prev) => {
      const updated = prev.map((m) => {
        if (m.id !== matchId || m.status === 'completed') return m;
        const homeTeam = UCL_TEAMS_BY_ID[m.homeTeamId];
        const awayTeam = UCL_TEAMS_BY_ID[m.awayTeamId];
        if (!homeTeam || !awayTeam) return m;

        const sim = simulateUCLMatch(homeTeam, awayTeam);
        return {
          ...m,
          homeScore: sim.homeScore,
          awayScore: sim.awayScore,
          status: 'completed',
          predictedAt: new Date().toISOString(),
          scorers: sim.scorers,
          timeline: sim.timeline,
          motm: sim.motm,
          playerRatings: sim.playerRatings,
          stoppageTime: sim.stoppageTime,
        } as LeagueMatch;
      });

      const allDone = updated.length === 144 && updated.every((m) => m.status === 'completed');
      if (allDone && playoffs.length === 0) {
        triggerKnockoutDraw(calculateUCLStandings(updated, UCL_TEAMS));
      }

      return updated;
    });
  };

  const handleSimulateMatchday = (matchday: number) => {
    const canRunLiveFinale = matchday === 8 && leagueMatches
      .filter((match) => match.matchweek < 8)
      .every((match) => match.status === 'completed');
    if (canRunLiveFinale) {
      const finalMatches = leagueMatches
        .filter((match) => match.matchweek === 8)
        .map(simulateLeagueFixture);
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      setCurrentMatchday(8);
      setFinalMatchdayLive({ finalMatches, minute: 0, paused: prefersReducedMotion });
      return;
    }
    setLeagueMatches((prev) => {
      const updated = prev.map((m) => {
        if (m.matchweek !== matchday || m.status === 'completed') return m;
        const homeTeam = UCL_TEAMS_BY_ID[m.homeTeamId];
        const awayTeam = UCL_TEAMS_BY_ID[m.awayTeamId];
        if (!homeTeam || !awayTeam) return m;

        const sim = simulateUCLMatch(homeTeam, awayTeam);
        return {
          ...m,
          homeScore: sim.homeScore,
          awayScore: sim.awayScore,
          status: 'completed',
          predictedAt: new Date().toISOString(),
          scorers: sim.scorers,
          timeline: sim.timeline,
          motm: sim.motm,
          playerRatings: sim.playerRatings,
          stoppageTime: sim.stoppageTime,
        } as LeagueMatch;
      });

      const allDone = updated.length === 144 && updated.every((m) => m.status === 'completed');
      if (allDone && playoffs.length === 0) {
        triggerKnockoutDraw(calculateUCLStandings(updated, UCL_TEAMS));
      }

      return updated;
    });
  };

  // ── Knockout Individual Leg Simulation Handlers ──
  const handleSimulateLeg1 = (roundKey: string, matchId: string) => {
    setKnockoutSimPhase('regulation');
    if (roundKey === 'playoffs') {
      setPlayoffs((prev) =>
        prev.map((m) => {
          if (m.id !== matchId) return m;
          const h = UCL_TEAMS_BY_ID[m.homeTeamId];
          const a = UCL_TEAMS_BY_ID[m.awayTeamId];
          return simulateKnockoutLeg1(m, h, a);
        })
      );
    } else if (roundKey === 'roundOf16') {
      setRoundOf16((prev) =>
        prev.map((m) => {
          if (m.id !== matchId) return m;
          const h = UCL_TEAMS_BY_ID[m.homeTeamId];
          const a = UCL_TEAMS_BY_ID[m.awayTeamId];
          return simulateKnockoutLeg1(m, h, a);
        })
      );
    } else if (roundKey === 'quarterfinals') {
      setQuarterfinals((prev) =>
        prev.map((m) => {
          if (m.id !== matchId) return m;
          const h = UCL_TEAMS_BY_ID[m.homeTeamId];
          const a = UCL_TEAMS_BY_ID[m.awayTeamId];
          return simulateKnockoutLeg1(m, h, a);
        })
      );
    } else if (roundKey === 'semifinals') {
      setSemifinals((prev) =>
        prev.map((m) => {
          if (m.id !== matchId) return m;
          const h = UCL_TEAMS_BY_ID[m.homeTeamId];
          const a = UCL_TEAMS_BY_ID[m.awayTeamId];
          return simulateKnockoutLeg1(m, h, a);
        })
      );
    }
  };

  const handleSimulateLeg2 = (roundKey: string, matchId: string) => {
    setKnockoutSimPhase('regulation');
    if (roundKey === 'playoffs') {
      const updated = playoffs.map((m) => {
        if (m.id !== matchId) return m;
        const h = UCL_TEAMS_BY_ID[m.homeTeamId];
        const a = UCL_TEAMS_BY_ID[m.awayTeamId];
        return simulateKnockoutLeg2(m, h, a);
      });
      setPlayoffs(updated);
      advanceCompletedRound(roundKey, updated);
    } else if (roundKey === 'roundOf16') {
      const updated = roundOf16.map((m) => {
        if (m.id !== matchId) return m;
        const h = UCL_TEAMS_BY_ID[m.homeTeamId];
        const a = UCL_TEAMS_BY_ID[m.awayTeamId];
        return simulateKnockoutLeg2(m, h, a);
      });
      setRoundOf16(updated);
      advanceCompletedRound(roundKey, updated);
    } else if (roundKey === 'quarterfinals') {
      const updated = quarterfinals.map((m) => {
        if (m.id !== matchId) return m;
        const h = UCL_TEAMS_BY_ID[m.homeTeamId];
        const a = UCL_TEAMS_BY_ID[m.awayTeamId];
        return simulateKnockoutLeg2(m, h, a);
      });
      setQuarterfinals(updated);
      advanceCompletedRound(roundKey, updated);
    } else if (roundKey === 'semifinals') {
      const updated = semifinals.map((m) => {
        if (m.id !== matchId) return m;
        const h = UCL_TEAMS_BY_ID[m.homeTeamId];
        const a = UCL_TEAMS_BY_ID[m.awayTeamId];
        return simulateKnockoutLeg2(m, h, a);
      });
      setSemifinals(updated);
      advanceCompletedRound(roundKey, updated);
    } else if (roundKey === 'final') {
      if (!finalMatch) return;
      const h = UCL_TEAMS_BY_ID[finalMatch.homeTeamId];
      const a = UCL_TEAMS_BY_ID[finalMatch.awayTeamId];
      const simFinal = simulateKnockoutLeg2(finalMatch, h, a);
      setFinalMatch(simFinal);

      if (simFinal.winnerId) {
        const champTeam = UCL_TEAMS_BY_ID[simFinal.winnerId];
        setChampion(champTeam || null);
      }
    }
  };

  const advanceCompletedRound = (roundKey: string, matches: TwoLegMatch[]) => {
    const expectedTieCount = roundKey === 'playoffs' || roundKey === 'roundOf16'
      ? 8
      : roundKey === 'quarterfinals'
      ? 4
      : roundKey === 'semifinals'
      ? 2
      : 0;
    const winners = getCompletedRoundWinners(matches, expectedTieCount);
    if (!winners) return;

    if (roundKey === 'playoffs') {
      const top8Ids = standings.slice(0, 8).map((standing) => standing.teamId);
      if (top8Ids.length === 8) setRoundOf16(generateRoundOf16(top8Ids, winners));
    } else if (roundKey === 'roundOf16') {
      setQuarterfinals(generateQuarterFinals(winners));
    } else if (roundKey === 'quarterfinals') {
      setSemifinals(generateSemiFinals(winners));
    } else if (roundKey === 'semifinals') {
      setFinalMatch(generateFinal(winners));
    }
  };

  const handleTieResolution = (
    roundKey: string,
    matchId: string,
    phase: 'aet' | 'penalties'
  ) => {
    setKnockoutSimPhase(phase);

    const resolveTie = (match: TwoLegMatch) => {
      if (match.id !== matchId) return match;
      const homeTeam = UCL_TEAMS_BY_ID[match.homeTeamId];
      const awayTeam = UCL_TEAMS_BY_ID[match.awayTeamId];
      return phase === 'aet'
        ? simulateExtraTime(match, homeTeam, awayTeam)
        : simulatePenalties(match, homeTeam, awayTeam);
    };

    const updateRound = (
      matches: TwoLegMatch[],
      setter: React.Dispatch<React.SetStateAction<TwoLegMatch[]>>
    ) => {
      const updated = matches.map(resolveTie);
      setter(updated);
      advanceCompletedRound(roundKey, updated);
    };

    if (roundKey === 'playoffs') updateRound(playoffs, setPlayoffs);
    else if (roundKey === 'roundOf16') updateRound(roundOf16, setRoundOf16);
    else if (roundKey === 'quarterfinals') updateRound(quarterfinals, setQuarterfinals);
    else if (roundKey === 'semifinals') updateRound(semifinals, setSemifinals);
    else if (roundKey === 'final' && finalMatch) {
      const resolvedFinal = resolveTie(finalMatch);
      setFinalMatch(resolvedFinal);
      if (resolvedFinal.winnerId) {
        setChampion(UCL_TEAMS_BY_ID[resolvedFinal.winnerId] || null);
      }
    }
  };

  // Scroll to section helper (WC26 Style)
  const scrollToSection = (sectionId: 'league-phase' | 'standings-scorers' | 'knockout-stage' | 'ucl-recap') => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Current Matchday fixtures
  const currentMatchdayFixtures = useMemo(() => {
    return visibleLeagueMatches.filter((m) => m.matchweek === currentMatchday);
  }, [visibleLeagueMatches, currentMatchday]);

  const currentMatchdayDone =
    currentMatchdayFixtures.length > 0 &&
    !finalMatchdayLive && currentMatchdayFixtures.every((m) => m.status === 'completed');
  const canReplayFinalMatchday = currentMatchday === 8 && currentMatchdayDone && isLeaguePhaseComplete;

  const currentSelectedTeam = useMemo(() => {
    return selectedTeamId ? UCL_TEAMS_BY_ID[selectedTeamId] || null : null;
  }, [selectedTeamId]);

  const runnerUp = useMemo(() => {
    if (!finalMatch?.winnerId) return null;
    const runnerUpId = finalMatch.winnerId === finalMatch.homeTeamId
      ? finalMatch.awayTeamId
      : finalMatch.homeTeamId;
    return UCL_TEAMS_BY_ID[runnerUpId] || null;
  }, [finalMatch]);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-gradient-to-br from-[#000810] via-[#00061a] to-[#000610] font-sans text-white selection:bg-sky-300 selection:text-[#000810]">
      {/* ── Background Atmospheric Lights & Floating Watermarks ── */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div className="absolute -top-[15%] -left-[10%] h-[900px] w-[900px] rounded-full bg-radial from-sky-500/10 to-transparent blur-3xl" />
        <div className="absolute -bottom-[20%] -right-[10%] h-[900px] w-[900px] rounded-full bg-radial from-blue-700/10 to-transparent blur-3xl" />
      </div>

      {/* Floating Ball Watermarks across the page */}
      <img
        src={uclBallSideImg}
        alt=""
        className="fixed top-1/3 -left-32 w-96 h-96 object-contain opacity-5 pointer-events-none rotate-12 blur-[1px]"
      />
      <img
        src={uclBallSide2Img}
        alt=""
        className="fixed bottom-10 -right-32 w-96 h-96 object-contain opacity-5 pointer-events-none -rotate-12 blur-[1px]"
      />

      {/* ── TOP NAV BAR ── */}
      <nav className="sticky top-0 z-30 border-b border-white/10 bg-[#020817]/95 backdrop-blur-xl">
        <div className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-10 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate('/hub')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-white/80 hover:text-white text-xs font-bold tracking-wider uppercase transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden min-[390px]:inline">Back to Hub</span><span className="min-[390px]:hidden">Hub</span>
          </button>

          {/* Reset Simulation Button */}
          <button
            onClick={() => setIsResetModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white/5 border border-white/10 hover:bg-rose-500/20 hover:border-rose-500/40 text-white/70 hover:text-rose-300 text-xs font-semibold transition-colors"
            title="Reset simulation"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="hidden min-[390px]:inline">Reset Simulation</span><span className="min-[390px]:hidden">Reset</span>
          </button>
        </div>
      </nav>

      {/* ── TOURNAMENT COMPLETE BANNER (Shows only when champion is crowned, like WC26 & EPL) ── */}
      {isTournamentComplete && (
        <div className="relative z-20 bg-gradient-to-r from-amber-500/20 via-cyan-500/20 to-amber-500/20 border-b border-amber-400/40 py-3.5">
          <div className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-10 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <img src={uclCupImg} alt="UEFA Champions League trophy" className="h-7 w-7 object-contain" />
              <span className="text-sm sm:text-base font-black uppercase tracking-wider text-amber-300">
                UEFA Champions League 2026/27 Complete · Winner: {champion?.name}
              </span>
            </div>

            <button
              onClick={() => setIsChampionModalOpen(true)}
              className="rounded-xl bg-amber-400 px-5 py-2 text-xs font-black uppercase tracking-wider text-black shadow-[0_0_15px_rgba(245,158,11,0.35)] transition-all hover:bg-amber-300 active:scale-[0.98]"
            >
              Celebration
            </button>
          </div>
        </div>
      )}

      {/* ── MAIN CONTAINER (FULL WIDTH, UP TO 1700PX, CONTINUOUS SCROLL ARCHITECTURE) ── */}
      <div className="relative z-10 mx-auto max-w-[1700px] space-y-10 px-4 py-6 sm:space-y-16 sm:px-6 lg:px-10">
        {/* ── HERO BRANDING (Modeled after WC26) ── */}
        <UCLHeroBranding
          completedLeagueMatches={completedLeagueMatches}
          totalLeagueMatches={144}
          completedKnockoutMatches={completedKnockoutMatches}
          isRecapUnlocked={isTournamentComplete}
          onNavigateSection={scrollToSection}
        />

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 1: LEAGUE PHASE (#league-phase)
           ═══════════════════════════════════════════════════════════════ */}
        <section id="league-phase" className="space-y-6 pt-4 scroll-mt-20">
          {/* Section Heading & Draw Actions Bar */}
          <div className="flex flex-col items-center justify-between gap-4 rounded-3xl border border-white/10 bg-[#060d1a]/70 p-5 shadow-[0_20px_55px_rgba(0,6,20,0.32)] sm:flex-row">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/15 text-cyan-300 text-xs font-bold uppercase tracking-wider mb-1">
                <span>Phase 1</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2.5">
                <Calendar className="w-6 h-6 text-cyan-400" />
                <span>Swiss League Matches</span>
              </h2>
              <p className="text-xs sm:text-sm text-white/50 mt-0.5">
                144 Fixtures across 8 Matchdays · Switch draw or simulate individual fixtures
              </p>
            </div>

            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:gap-3">
              <button
                onClick={handleRealDraw}
                disabled={isDrawLocked}
                title={isDrawLocked ? 'Draw is locked while the tournament is in progress' : 'Apply the official league phase draw'}
                className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl border border-amber-400/50 bg-amber-500/20 px-6 py-3 text-xs font-bold uppercase tracking-wider text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.25)] transition-all hover:bg-amber-500/30 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/[0.035] disabled:text-white/30 disabled:shadow-none sm:flex-initial"
              >
                {isDrawLocked ? <Lock className="h-[18px] w-[18px]" /> : <UCLMorphIcon icon={drawFeedback === 'real' ? Check : PlayIcon} size={18} strokeWidth={2.2} />}
                <span>{isDrawLocked ? 'Draw Locked' : drawFeedback === 'real' ? 'Draw Applied' : 'Real Draw'}</span>
              </button>
              <button
                onClick={handleRandomDraw}
                disabled={isDrawLocked}
                title={isDrawLocked ? 'Draw is locked while the tournament is in progress' : 'Generate a valid random UEFA draw'}
                className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-6 py-3 text-xs font-bold uppercase tracking-wider text-white/80 transition-all hover:border-cyan-400/40 hover:text-white disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/[0.035] disabled:text-white/30 sm:flex-initial"
              >
                {isDrawLocked ? <Lock className="h-[17px] w-[17px]" /> : <UCLMorphIcon icon={drawFeedback === 'random' ? Check : RefreshIcon} size={17} strokeWidth={2.2} className="text-cyan-400" />}
                <span>{isDrawLocked ? 'Random Locked' : drawFeedback === 'random' ? 'Valid Draw Ready' : 'Random Swiss Draw'}</span>
              </button>
            </div>
          </div>

          {drawError && (
            <div role="alert" className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-200">
              {drawError}
            </div>
          )}

          <UCLPot1DrawTable leagueMatches={leagueMatches} teams={UCL_TEAMS} />

          {/* Roomy Matchday Slider */}
          <UCLMatchdaySlider
            currentMatchday={currentMatchday}
            totalMatchdays={8}
            fixtures={leagueMatches}
            onSelectMatchday={setCurrentMatchday}
          />

          {/* Matchday Fixtures Header with Simulate Matchday Button */}
          <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#060d1a]/70 p-4 sm:flex-row sm:p-5">
            <div>
              <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-cyan-400" />
                <span>Matchday {currentMatchday} Fixtures (18 Matches)</span>
              </h3>
              <p className="text-xs text-white/50 mt-0.5">
                Click any team crest to inspect squad details
              </p>
            </div>

            {/* Simulate Matchday button placed cleanly here as requested! */}
            <div className="shrink-0 w-full sm:w-auto">
              <button
                type="button"
                disabled={(currentMatchdayDone && !canReplayFinalMatchday) || Boolean(finalMatchdayLive)}
                onClick={() => handleSimulateMatchday(currentMatchday)}
                className={`flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border px-6 py-3 text-xs font-black uppercase tracking-widest transition-all sm:w-auto ${currentMatchdayDone && !canReplayFinalMatchday ? 'cursor-default border-emerald-500/40 bg-emerald-500/15 text-emerald-300' : finalMatchdayLive ? 'cursor-wait border-rose-300/25 bg-rose-300/10 text-rose-200' : 'border-transparent bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white shadow-[0_0_20px_rgba(0,240,255,0.4)] hover:from-cyan-400 hover:to-blue-500 active:scale-95'}`}
              >
                <UCLMorphIcon icon={canReplayFinalMatchday ? RefreshIcon : currentMatchdayDone ? Check : PlayIcon} size={17} strokeWidth={2.2} />
                <span>{finalMatchdayLive ? `Matchday 8 Live · ${finalMatchdayLive.minute > 90 ? `90+${finalMatchdayLive.minute - 90}` : finalMatchdayLive.minute}'` : canReplayFinalMatchday ? 'Replay Final Matchday Live' : currentMatchdayDone ? `Matchday ${currentMatchday} Completed` : currentMatchday === 8 && leagueMatches.filter((match) => match.matchweek < 8).every((match) => match.status === 'completed') ? 'Launch Final Matchday Live' : `Simulate Matchday ${currentMatchday}`}</span>
              </button>
            </div>
          </div>

          {finalMatchdayLive && (
            <UCLFinalMatchdayLive
              minute={finalMatchdayLive.minute}
              paused={finalMatchdayLive.paused}
              standings={standings}
              matches={visibleLeagueMatches.filter((match) => match.matchweek === 8)}
              teamsById={UCL_TEAMS_BY_ID}
              onTogglePause={() => setFinalMatchdayLive((live) => live ? { ...live, paused: !live.paused } : null)}
              onFinish={finishFinalMatchdayLive}
            />
          )}

          {/* ── 18 MATCH CARDS GRID (MAX 2 CARDS PER ROW, items-start to prevent vertical stretching) ── */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
            {currentMatchdayFixtures.map((match) => {
              const homeTeam = UCL_TEAMS_BY_ID[match.homeTeamId];
              const awayTeam = UCL_TEAMS_BY_ID[match.awayTeamId];
              if (!homeTeam || !awayTeam) return null;

              return (
                <UCLMatchCard
                  key={match.id}
                  match={match}
                  matchday={match.matchweek}
                  homeTeam={homeTeam}
                  awayTeam={awayTeam}
                  onPredict={simulateSingleLeagueMatch}
                  onSelectTeam={setSelectedTeamId}
                  liveMinute={finalMatchdayLive && match.matchweek === 8 ? finalMatchdayLive.minute : undefined}
                />
              );
            })}
          </div>

          {!finalMatchdayLive && <UCLMatchdayRecap matchday={currentMatchday} matches={leagueMatches} teams={UCL_TEAMS} teamsById={UCL_TEAMS_BY_ID} />}
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 2: STANDINGS & LIVE TOP SCORERS (#standings-scorers)
           ═══════════════════════════════════════════════════════════════ */}
        <section id="standings-scorers" className="space-y-8 pt-4 scroll-mt-20">
          <UCLStandingsTable
            standings={standings}
            teamsById={UCL_TEAMS_BY_ID}
            onSelectTeam={setSelectedTeamId}
            onExplainRank={setRankExplanationTeamId}
          />

          <UCLCountrySummaryTable teams={UCL_TEAMS} eliminatedTeamIds={eliminatedTeamIds} />

          <UCLTopScorersTable
            topScorers={recapStats.topScorers}
            penaltyGoalsByPlayer={penaltyGoalsByPlayer}
            onSelectTeam={setSelectedTeamId}
            onSelectPlayer={(playerId, playerName, teamId, teamName) =>
              setSelectedPlayerGoal({ playerId, playerName, teamId, teamName })
            }
          />
          <UCLTopAssistsTable topAssists={recapStats.topAssists} onSelectTeam={setSelectedTeamId} onSelectPlayer={(playerId, playerName, teamId, teamName) => setSelectedPlayerGoal({ playerId, playerName, teamId, teamName, stat: 'assists' })} />
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 3: KNOCKOUT STAGE (#knockout-stage)
           ═══════════════════════════════════════════════════════════════ */}
        <section id="knockout-stage" className="space-y-6 pt-4 scroll-mt-20">
          <div className="rounded-3xl border border-white/10 bg-[#060d1a]/70 p-6 shadow-[0_20px_55px_rgba(0,6,20,0.32)]">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/15 text-pink-300 text-xs font-bold uppercase tracking-wider mb-1">
              <span>Phase 2</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2.5">
              <img src={uclCupImg} alt="" className="h-8 w-8 object-contain" />
              <span>Knockout Stage & Road to Madrid 27</span>
            </h2>
            <p className="text-xs sm:text-sm text-white/50 mt-0.5">
              Two-leg aggregate ties from Play-offs through Semi-Finals · Single Final at Estadio Metropolitano
            </p>
          </div>

          {(isKnockoutUnlocked || Boolean(finalMatchdayLive)) && <UCLPathToMadrid standings={standings} teamsById={UCL_TEAMS_BY_ID} playoffs={playoffs} roundOf16={roundOf16} quarterfinals={quarterfinals} semifinals={semifinals} finalMatch={finalMatch} />}

          {!isKnockoutUnlocked ? (
            <div className="py-24 text-center rounded-3xl border-2 border-dashed border-white/15 bg-[#000E2F]/40 p-8">
              <img src={uclCupImg} alt="UEFA Champions League trophy" className="mx-auto mb-4 h-20 w-20 object-contain opacity-35" />
              <h3 className="text-2xl font-bold text-white">Knockout Stage is Locked</h3>
              <p className="text-sm text-white/50 mt-2 max-w-md mx-auto">
                Complete all 144 fixtures in the League Phase to lock in the Top 24 standings and kick off the Play-offs!
              </p>
              <button
                type="button"
                onClick={() => scrollToSection('league-phase')}
                className="mt-6 px-7 py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xs tracking-wider uppercase transition-all shadow-[0_0_20px_rgba(0,240,255,0.4)]"
              >
                Go to League Phase
              </button>
            </div>
          ) : (
            <UCLKnockoutBracket
              playoffs={playoffs}
              roundOf16={roundOf16}
              quarterfinals={quarterfinals}
              semifinals={semifinals}
              finalMatch={finalMatch}
              teamsById={UCL_TEAMS_BY_ID}
              onSimulateLeg1={handleSimulateLeg1}
              onSimulateLeg2={handleSimulateLeg2}
              onSimulateExtraTime={(roundKey, matchId) =>
                handleTieResolution(roundKey, matchId, 'aet')
              }
              onResolvePenalties={(roundKey, matchId) =>
                handleTieResolution(roundKey, matchId, 'penalties')
              }
              simulationPhase={knockoutSimPhase}
              onSelectTeam={setSelectedTeamId}
              onUpdateFinal={(updatedFinal) => {
                setFinalMatch(updatedFinal);
                setKnockoutSimPhase(updatedFinal.leg2.penalties ? 'penalties' : updatedFinal.leg2.extraTime ? 'aet' : 'regulation');
                if (updatedFinal.winnerId) {
                  setChampion(UCL_TEAMS_BY_ID[updatedFinal.winnerId] || null);
                }
              }}
            />
          )}
        </section>

        <section id="ucl-recap" className="scroll-mt-20 pt-4" aria-label="UCL season recap">
          {champion ? (
            <UCLRecap stats={recapStats} champion={champion} runnerUp={runnerUp} knockoutMatches={allKnockoutMatches} teamsById={UCL_TEAMS_BY_ID} />
          ) : (
            <div className="rounded-3xl border border-dashed border-white/15 bg-[#060d1a]/70 px-6 py-20 text-center">
              <img src={uclBallSideImg} alt="UEFA Champions League starball" className="mx-auto h-20 w-20 object-contain opacity-30" />
              <h2 id="ucl-recap-section-title" className="mt-5 text-2xl font-black text-white">UCL Recap is locked</h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/50">Complete the tournament to unlock the champion podium, season awards, Best XI and competition statistics.</p>
            </div>
          )}
        </section>
      </div>

      <BackToTopButton />

      {/* ═══════════════════════════════════════════════════════════════
          MODALS
         ═══════════════════════════════════════════════════════════════ */}
      {/* 1. Champion Celebration Modal (Compact max-w-xl like WC26) */}
      <UCLChampionModal
        champion={champion}
        isOpen={isChampionModalOpen}
        onClose={() => setIsChampionModalOpen(false)}
        onViewRecap={() => {
          setIsChampionModalOpen(false);
          window.requestAnimationFrame(() => scrollToSection('ucl-recap'));
        }}
      />

      {/* 2. Team Detail Modal */}
      <UCLTeamModal
        isOpen={Boolean(selectedTeamId)}
        team={currentSelectedTeam}
        onClose={() => setSelectedTeamId(null)}
      />

      <UCLWhyRankModal explanation={rankExplanation} teamsById={UCL_TEAMS_BY_ID} onClose={() => setRankExplanationTeamId(null)} />

      {/* 3. Player Goal Details Modal (EPL Style) */}
      {selectedPlayerGoal && (
        <UCLPlayerGoalModal
          isOpen={Boolean(selectedPlayerGoal)}
          onClose={() => setSelectedPlayerGoal(null)}
          playerId={selectedPlayerGoal.playerId}
          playerName={selectedPlayerGoal.playerName}
          stat={selectedPlayerGoal.stat}
          teamId={selectedPlayerGoal.teamId}
          teamName={selectedPlayerGoal.teamName}
          leagueMatches={leagueMatches}
          knockoutMatches={allKnockoutMatches}
          teamsById={UCL_TEAMS_BY_ID}
        />
      )}

      {/* 4. Reset Confirmation Modal */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/80 p-4 backdrop-blur-md [padding-bottom:max(1rem,env(safe-area-inset-bottom))] [padding-top:max(1rem,env(safe-area-inset-top))]" onClick={() => setIsResetModalOpen(false)}>
          <div role="dialog" aria-modal="true" aria-labelledby="ucl-reset-title" className="relative max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-[28px] border border-rose-500/30 bg-[#000E2F] p-4 text-center shadow-2xl sm:rounded-3xl sm:p-6" onClick={(event) => event.stopPropagation()}>
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-rose-500/30 bg-rose-500/15 sm:mb-4 sm:h-12 sm:w-12 sm:rounded-2xl">
              <AlertTriangle className="w-6 h-6 text-rose-400" />
            </div>
            <h3 id="ucl-reset-title" className="text-lg font-bold text-white sm:text-xl">Reset Simulation?</h3>
            <p className="text-xs text-white/60 mt-2 leading-relaxed">
              This will erase all match results, standings, top scorers and tournament progress. The 144 fixtures will be restored to the initial schedule.
            </p>

            <div className="mt-5 flex gap-3 sm:mt-6">
              <button
                type="button"
                onClick={() => setIsResetModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetAll}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white shadow-[0_0_15px_rgba(225,29,72,0.4)] transition-colors"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
