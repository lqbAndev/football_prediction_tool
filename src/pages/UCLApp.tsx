import React, { useState, useMemo, useEffect } from 'react';
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
import { calculateLeagueTable } from '../utils/leagueEngine';
import { computeUclRecapStats } from '../utils/uclRecapStats';
import { loadUCLState, saveUCLState, clearUCLState } from '../utils/uclStorage';
import type { LeagueMatch, LeagueStanding } from '../types/leagueConfig';
import type { TwoLegMatch } from '../types/uclConfig';
import type { Team } from '../types/tournament';

// Components
import { UCLHeroBranding } from '../components/ucl/UCLHeroBranding';
import { UCLMatchCard } from '../components/ucl/UCLMatchCard';
import { UCLStandingsTable } from '../components/ucl/UCLStandingsTable';
import { UCLTopScorersTable } from '../components/ucl/UCLTopScorersTable';
import { UCLMatchdaySlider } from '../components/ucl/UCLMatchdaySlider';
import { UCLKnockoutBracket } from '../components/ucl/UCLKnockoutBracket';
import { UCLChampionModal } from '../components/ucl/UCLChampionModal';
import { UCLTeamModal } from '../components/ucl/UCLTeamModal';
import { UCLPlayerGoalModal } from '../components/ucl/UCLPlayerGoalModal';
import { UCLRecap } from '../components/ucl/UCLRecap';

// Assets & Icons
import {
  RefreshCw,
  RotateCcw,
  ArrowLeft,
  Calendar,
  Layers,
  Sparkles,
  AlertTriangle,
  Play,
  CheckCircle2,
} from 'lucide-react';
import uclBallSideImg from '../img/CUP COMPETITION/UCL/ball/ucl_ball_26-27_side.png';
import uclBallSide2Img from '../img/CUP COMPETITION/UCL/ball/ucl_ball_26-27_side_2.png';
import uclCupImg from '../img/CUP COMPETITION/UCL/ucl_cup.png';

const getCompletedRoundWinners = (
  matches: TwoLegMatch[],
  expectedTieCount: number,
): string[] | null => {
  if (
    expectedTieCount <= 0 ||
    matches.length !== expectedTieCount ||
    !matches.every((match) => match.isCompleted)
  ) {
    return null;
  }

  const winners = matches
    .map((match) => match.winnerId)
    .filter((winnerId): winnerId is string => Boolean(winnerId));

  return winners.length === expectedTieCount ? winners : null;
};

const restoreExtraTimeDetails = (matches: TwoLegMatch[]): TwoLegMatch[] =>
  matches.map((match) => {
    const homeTeam = UCL_TEAMS_BY_ID[match.homeTeamId];
    const awayTeam = UCL_TEAMS_BY_ID[match.awayTeamId];
    return homeTeam && awayTeam
      ? ensureExtraTimeDetails(match, homeTeam, awayTeam)
      : match;
  });

export const UCLApp: React.FC = () => {
  const navigate = useNavigate();

  // ── Persistent State Initialization (Fix F5 reset bug) ──
  const savedState = useMemo(() => loadUCLState(), []);

  const [leagueMatches, setLeagueMatches] = useState<LeagueMatch[]>(() =>
    savedState ? savedState.leagueMatches : generatePresetSwissDraw(UCL_TEAMS)
  );
  const [currentMatchday, setCurrentMatchday] = useState(
    savedState ? savedState.currentMatchday : 1
  );

  // Knockout Bracket State
  const [playoffs, setPlayoffs] = useState<TwoLegMatch[]>(() =>
    savedState ? restoreExtraTimeDetails(savedState.playoffs) : []
  );
  const [roundOf16, setRoundOf16] = useState<TwoLegMatch[]>(() =>
    savedState ? restoreExtraTimeDetails(savedState.roundOf16) : []
  );
  const [quarterfinals, setQuarterfinals] = useState<TwoLegMatch[]>(() =>
    savedState ? restoreExtraTimeDetails(savedState.quarterfinals) : []
  );
  const [semifinals, setSemifinals] = useState<TwoLegMatch[]>(() =>
    savedState ? restoreExtraTimeDetails(savedState.semifinals) : []
  );
  const [finalMatch, setFinalMatch] = useState<TwoLegMatch | null>(() =>
    savedState?.finalMatch ? restoreExtraTimeDetails([savedState.finalMatch])[0] : null
  );
  const [champion, setChampion] = useState<Team | null>(() =>
    savedState ? savedState.champion : null
  );
  const [knockoutSimPhase, setKnockoutSimPhase] = useState<
    'regulation' | 'aet' | 'penalties'
  >('regulation');

  // Modals & Selected Entities
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [selectedPlayerGoal, setSelectedPlayerGoal] = useState<{
    playerId: string;
    playerName: string;
    teamId: string;
    teamName: string;
  } | null>(null);

  const [isChampionModalOpen, setIsChampionModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [drawError, setDrawError] = useState<string | null>(null);

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
  const rawStandings = useMemo(
    () => calculateLeagueTable(leagueMatches, UCL_TEAMS),
    [leagueMatches]
  );

  const standings: LeagueStanding[] = useMemo(() => {
    return rawStandings.map((s, idx) => ({
      position: idx + 1,
      teamId: s.teamId,
      teamName: s.teamName,
      played: s.played,
      wins: s.wins,
      draws: s.draws,
      losses: s.losses,
      goalsFor: s.goalsFor,
      goalsAgainst: s.goalsAgainst,
      goalDifference: s.goalDifference,
      points: s.points,
      form: s.form,
    }));
  }, [rawStandings]);

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
    const fixtures = generatePresetSwissDraw(UCL_TEAMS);
    setLeagueMatches(fixtures);
    setDrawError(null);
    resetKnockout();
  };

  const handleRandomDraw = () => {
    try {
      const fixtures = generateRandomSwissDraw(UCL_TEAMS);
      setLeagueMatches(fixtures);
      setDrawError(null);
      resetKnockout();
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
        } as LeagueMatch;
      });

      const allDone = updated.length === 144 && updated.every((m) => m.status === 'completed');
      if (allDone && playoffs.length === 0) {
        const freshTable = calculateLeagueTable(updated, UCL_TEAMS);
        const freshRows: LeagueStanding[] = freshTable.map((s, idx) => ({
          position: idx + 1,
          teamId: s.teamId,
          teamName: s.teamName,
          played: s.played,
          wins: s.wins,
          draws: s.draws,
          losses: s.losses,
          goalsFor: s.goalsFor,
          goalsAgainst: s.goalsAgainst,
          goalDifference: s.goalDifference,
          points: s.points,
          form: s.form,
        }));
        triggerKnockoutDraw(freshRows);
      }

      return updated;
    });
  };

  const handleSimulateMatchday = (matchday: number) => {
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
        } as LeagueMatch;
      });

      const allDone = updated.length === 144 && updated.every((m) => m.status === 'completed');
      if (allDone && playoffs.length === 0) {
        const freshTable = calculateLeagueTable(updated, UCL_TEAMS);
        const freshRows: LeagueStanding[] = freshTable.map((s, idx) => ({
          position: idx + 1,
          teamId: s.teamId,
          teamName: s.teamName,
          played: s.played,
          wins: s.wins,
          draws: s.draws,
          losses: s.losses,
          goalsFor: s.goalsFor,
          goalsAgainst: s.goalsAgainst,
          goalDifference: s.goalDifference,
          points: s.points,
          form: s.form,
        }));
        triggerKnockoutDraw(freshRows);
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
      setPlayoffs((prev) => {
        const updated = prev.map((m) => {
          if (m.id !== matchId) return m;
          const h = UCL_TEAMS_BY_ID[m.homeTeamId];
          const a = UCL_TEAMS_BY_ID[m.awayTeamId];
          return simulateKnockoutLeg2(m, h, a);
        });

        // Strict: ONLY generate RO16 once ALL 8 Play-off ties are 100% completed!
        const winners = getCompletedRoundWinners(updated, 8);
        if (winners) {
          const top8Ids = standings.slice(0, 8).map((s) => s.teamId);
          if (top8Ids.length === 8) setRoundOf16(generateRoundOf16(top8Ids, winners));
        }

        return updated;
      });
    } else if (roundKey === 'roundOf16') {
      setRoundOf16((prev) => {
        const updated = prev.map((m) => {
          if (m.id !== matchId) return m;
          const h = UCL_TEAMS_BY_ID[m.homeTeamId];
          const a = UCL_TEAMS_BY_ID[m.awayTeamId];
          return simulateKnockoutLeg2(m, h, a);
        });

        const winners = getCompletedRoundWinners(updated, 8);
        if (winners) {
          setQuarterfinals(generateQuarterFinals(winners));
        }

        return updated;
      });
    } else if (roundKey === 'quarterfinals') {
      setQuarterfinals((prev) => {
        const updated = prev.map((m) => {
          if (m.id !== matchId) return m;
          const h = UCL_TEAMS_BY_ID[m.homeTeamId];
          const a = UCL_TEAMS_BY_ID[m.awayTeamId];
          return simulateKnockoutLeg2(m, h, a);
        });

        const winners = getCompletedRoundWinners(updated, 4);
        if (winners) {
          setSemifinals(generateSemiFinals(winners));
        }

        return updated;
      });
    } else if (roundKey === 'semifinals') {
      setSemifinals((prev) => {
        const updated = prev.map((m) => {
          if (m.id !== matchId) return m;
          const h = UCL_TEAMS_BY_ID[m.homeTeamId];
          const a = UCL_TEAMS_BY_ID[m.awayTeamId];
          return simulateKnockoutLeg2(m, h, a);
        });

        const winners = getCompletedRoundWinners(updated, 2);
        if (winners) {
          setFinalMatch(generateFinal(winners));
        }

        return updated;
      });
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
      setter: React.Dispatch<React.SetStateAction<TwoLegMatch[]>>
    ) => {
      setter((previous) => {
        const updated = previous.map(resolveTie);
        advanceCompletedRound(roundKey, updated);
        return updated;
      });
    };

    if (roundKey === 'playoffs') updateRound(setPlayoffs);
    else if (roundKey === 'roundOf16') updateRound(setRoundOf16);
    else if (roundKey === 'quarterfinals') updateRound(setQuarterfinals);
    else if (roundKey === 'semifinals') updateRound(setSemifinals);
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
    return leagueMatches.filter((m) => m.matchweek === currentMatchday);
  }, [leagueMatches, currentMatchday]);

  const currentMatchdayDone =
    currentMatchdayFixtures.length > 0 &&
    currentMatchdayFixtures.every((m) => m.status === 'completed');

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
            <span>Back to Hub</span>
          </button>

          {/* Reset Simulation Button */}
          <button
            onClick={() => setIsResetModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white/5 border border-white/10 hover:bg-rose-500/20 hover:border-rose-500/40 text-white/70 hover:text-rose-300 text-xs font-semibold transition-colors"
            title="Reset simulation"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset Simulation</span>
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
      <div className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-10 py-6 space-y-16 relative z-10">
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

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={handleRealDraw}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-amber-500/20 border border-amber-400/50 hover:bg-amber-500/30 text-amber-300 font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(245,158,11,0.25)]"
              >
                <img src={uclCupImg} alt="" className="h-5 w-5 object-contain" />
                <span>Real Draw</span>
              </button>
              <button
                onClick={handleRandomDraw}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-white/5 border border-white/15 hover:border-cyan-400/40 text-white/80 hover:text-white font-bold text-xs uppercase tracking-wider transition-all"
              >
                <RefreshCw className="w-4 h-4 text-cyan-400" />
                <span>Random Swiss Draw</span>
              </button>
            </div>
          </div>

          {drawError && (
            <div role="alert" className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-200">
              {drawError}
            </div>
          )}

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
              {currentMatchdayDone ? (
                <div className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 font-bold text-xs uppercase tracking-widest">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Matchday {currentMatchday} Completed</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => handleSimulateMatchday(currentMatchday)}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-xs uppercase tracking-widest shadow-[0_0_20px_rgba(0,240,255,0.4)] active:scale-95 transition-all"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Simulate Matchday {currentMatchday}</span>
                </button>
              )}
            </div>
          </div>

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
                  homeTeam={homeTeam}
                  awayTeam={awayTeam}
                  onPredict={simulateSingleLeagueMatch}
                  onSelectTeam={setSelectedTeamId}
                />
              );
            })}
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 2: STANDINGS & LIVE TOP SCORERS (#standings-scorers)
           ═══════════════════════════════════════════════════════════════ */}
        <section id="standings-scorers" className="space-y-8 pt-4 scroll-mt-20">
          <UCLStandingsTable
            standings={standings}
            teamsById={UCL_TEAMS_BY_ID}
            onSelectTeam={setSelectedTeamId}
          />

          <UCLTopScorersTable
            topScorers={recapStats.topScorers}
            penaltyGoalsByPlayer={penaltyGoalsByPlayer}
            onSelectTeam={setSelectedTeamId}
            onSelectPlayer={(playerId, playerName, teamId, teamName) =>
              setSelectedPlayerGoal({ playerId, playerName, teamId, teamName })
            }
          />
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
            />
          )}
        </section>

        <section id="ucl-recap" className="scroll-mt-20 pt-4" aria-label="UCL season recap">
          {champion ? (
            <UCLRecap stats={recapStats} champion={champion} runnerUp={runnerUp} />
          ) : (
            <div className="rounded-3xl border border-dashed border-white/15 bg-[#060d1a]/70 px-6 py-20 text-center">
              <img src={uclBallSideImg} alt="UEFA Champions League starball" className="mx-auto h-20 w-20 object-contain opacity-30" />
              <h2 id="ucl-recap-section-title" className="mt-5 text-2xl font-black text-white">UCL Recap is locked</h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/50">Complete the tournament to unlock the champion podium, season awards, Best XI and competition statistics.</p>
            </div>
          )}
        </section>
      </div>

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

      {/* 3. Player Goal Details Modal (EPL Style) */}
      {selectedPlayerGoal && (
        <UCLPlayerGoalModal
          isOpen={Boolean(selectedPlayerGoal)}
          onClose={() => setSelectedPlayerGoal(null)}
          playerId={selectedPlayerGoal.playerId}
          playerName={selectedPlayerGoal.playerName}
          teamId={selectedPlayerGoal.teamId}
          teamName={selectedPlayerGoal.teamName}
          leagueMatches={leagueMatches}
          knockoutMatches={allKnockoutMatches}
          teamsById={UCL_TEAMS_BY_ID}
        />
      )}

      {/* 4. Reset Confirmation Modal */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-md sm:items-center sm:p-4" onClick={() => setIsResetModalOpen(false)}>
          <div role="dialog" aria-modal="true" aria-labelledby="ucl-reset-title" className="relative max-h-[82dvh] w-full max-w-md overflow-y-auto rounded-t-[28px] border-t border-rose-500/30 bg-[#000E2F] p-4 text-center shadow-2xl sm:rounded-3xl sm:border sm:p-6" onClick={(event) => event.stopPropagation()}>
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/20 sm:hidden" />
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
