import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Save, RotateCcw, Trophy, Clock, ChevronDown, Award, Sparkles, X, ChevronUp, Star } from 'lucide-react';
import ReactConfetti from 'react-confetti';

// Import EPL data and configs
import {
  epl2526Config,
  EPL_TEAMS,
  EPL_TEAMS_BY_ID,
  EPL_LOGO_MAP,
  EPL_TIER_MAP,
} from '../data/competitions/epl2526';

// Import engines and helpers
import {
  generateRoundRobinFixtures,
  isMatchweekCompleted,
  getCurrentMatchweek,
} from '../utils/leagueEngine';
import { buildRegulationTimeline } from '../utils/random';
import { SaveModal } from '../components/SaveModal';
import { Toast } from '../components/Toast';
import { saveSimulation } from '../utils/saveManager';
import { computeLeagueMatchMOTM, buildLeagueSeasonMOTM } from '../utils/motm';
import type { LeagueMOTS } from '../utils/motm';
import TitleRaceChart from '../components/league/TitleRaceChart';
import LeagueRecap from '../components/league/LeagueRecap';
import type { LeagueMatch, LeagueStanding } from '../types/leagueConfig';
import type { Team } from '../types/tournament';

// Import Assets
import eplLogo from '../img/LEAGUE COMPETITION/EPL/england_english-premier-league.football-logos.cc.svg';
import eplBall from '../img/LEAGUE COMPETITION/EPL/ball/PUMA-Orbita-Cup-Premier-League-Brilliance-Football---In-Special-Ball-Box-Photoroom.png';
import eplLogoNoTextWhite from '../img/LEAGUE COMPETITION/EPL/england_english-premier-league--no-text-white_64x64.football-logos.cc.png';

// ═══════════════════════════════════════════════════════════════
//  EPL MATCH SIMULATION ENGINE
// ═══════════════════════════════════════════════════════════════

const sampleGoals = (): number => {
  const r = Math.random() * 100;
  if (r < 24) return 0;
  if (r < 54) return 1;
  if (r < 77) return 2;
  if (r < 90) return 3;
  if (r < 94.5) return 4;
  if (r < 97) return 5;
  if (r < 98.2) return 6;
  if (r < 98.9) return 7;
  if (r < 99.35) return 8;
  if (r < 99.45) return 9;
  return 10;
};

const genGoalsForOutcome = (outcome: 'home' | 'draw' | 'away'): { homeGoals: number; awayGoals: number } => {
  let homeGoals = 0;
  let awayGoals = 0;
  let attempts = 0;
  while (attempts < 200) {
    homeGoals = sampleGoals();
    awayGoals = sampleGoals();
    if (outcome === 'home' && homeGoals > awayGoals) return { homeGoals, awayGoals };
    if (outcome === 'draw' && homeGoals === awayGoals) return { homeGoals, awayGoals };
    if (outcome === 'away' && homeGoals < awayGoals) return { homeGoals, awayGoals };
    attempts++;
  }
  // Fallbacks
  if (outcome === 'home') return { homeGoals: 2, awayGoals: 1 };
  if (outcome === 'draw') return { homeGoals: 1, awayGoals: 1 };
  return { homeGoals: 1, awayGoals: 2 };
};

const simulateEPLMatch = (match: LeagueMatch, homeTeam: Team, awayTeam: Team): LeagueMatch => {
  let pHome = 0.40;
  let pDraw = 0.20;
  let pAway = 0.40;

  // 1. Home advantage: 5-10% boost (widened from 5-7%)
  const homeBoost = 0.05 + Math.random() * 0.05;
  pHome += homeBoost;
  pAway -= homeBoost;

  // 2. Tier advantage: +10% per tier gap (widened from flat +5%)
  const tierHome = EPL_TIER_MAP[homeTeam.id] ?? 0;
  const tierAway = EPL_TIER_MAP[awayTeam.id] ?? 0;
  const tierGap = tierHome - tierAway;
  if (tierGap > 0) {
    const boost = Math.min(0.10, tierGap * 0.10);
    pHome += boost;
    pAway -= boost;
  } else if (tierGap < 0) {
    const boost = Math.min(0.10, Math.abs(tierGap) * 0.10);
    pAway += boost;
    pHome -= boost;
  }

  // 3. Clamp and normalize
  pHome = Math.max(0.05, Math.min(0.90, pHome));
  pAway = Math.max(0.05, Math.min(0.90, pAway));
  pDraw = 1.0 - pHome - pAway;

  // 4. Roll outcome
  const r = Math.random();
  let outcome: 'home' | 'draw' | 'away';
  if (r < pHome) {
    outcome = 'home';
  } else if (r < pHome + pDraw) {
    outcome = 'draw';
  } else {
    outcome = 'away';
  }

  // 5. Generate score
  const { homeGoals, awayGoals } = genGoalsForOutcome(outcome);

  // 6. Build scorers and timeline
  const { scorers, timeline } = buildRegulationTimeline(homeTeam, awayTeam, homeGoals, awayGoals);

  const completedMatch: LeagueMatch = {
    ...match,
    homeScore: homeGoals,
    awayScore: awayGoals,
    status: 'completed',
    predictedAt: new Date().toISOString(),
    scorers,
    timeline,
    motm: null,
  };

  completedMatch.motm = computeLeagueMatchMOTM(completedMatch);
  return completedMatch;
};

// ═══════════════════════════════════════════════════════════════
//  EPL LEAGUE TABLE CALCULATION WITH HEAD-TO-HEAD TIEBREAKER
// ═══════════════════════════════════════════════════════════════

const calculateHeadToHeadPoints = (fixtures: LeagueMatch[], teamAId: string, teamBId: string) => {
  const directMatches = fixtures.filter(
    (m) =>
      m.status === 'completed' &&
      ((m.homeTeamId === teamAId && m.awayTeamId === teamBId) ||
        (m.homeTeamId === teamBId && m.awayTeamId === teamAId))
  );

  let pointsA = 0;
  let pointsB = 0;
  let gdA = 0;
  let gdB = 0;
  let gfA = 0;
  let gfB = 0;

  for (const m of directMatches) {
    const isHomeA = m.homeTeamId === teamAId;
    const scoreA = isHomeA ? m.homeScore! : m.awayScore!;
    const scoreB = isHomeA ? m.awayScore! : m.homeScore!;

    gfA += scoreA;
    gfB += scoreB;
    gdA += (scoreA - scoreB);
    gdB += (scoreB - scoreA);

    if (scoreA > scoreB) {
      pointsA += 3;
    } else if (scoreB > scoreA) {
      pointsB += 3;
    } else {
      pointsA += 1;
      pointsB += 1;
    }
  }

  return { pointsA, pointsB, gdA, gdB, gfA, gfB };
};

const calculateFormGuide = (fixtures: LeagueMatch[], teamId: string): Array<'W' | 'D' | 'L'> => {
  const teamMatches = fixtures
    .filter((m) => m.status === 'completed' && (m.homeTeamId === teamId || m.awayTeamId === teamId))
    .sort((a, b) => a.matchweek - b.matchweek);

  const form: Array<'W' | 'D' | 'L'> = [];
  for (const match of teamMatches) {
    const isHome = match.homeTeamId === teamId;
    const teamScore = isHome ? match.homeScore! : match.awayScore!;
    const opponentScore = isHome ? match.awayScore! : match.homeScore!;

    if (teamScore > opponentScore) form.push('W');
    else if (teamScore === opponentScore) form.push('D');
    else form.push('L');
  }
  return form.slice(-5);
};

export const calculateEPLTable = (fixtures: LeagueMatch[], teams: Team[]): LeagueStanding[] => {
  const standings: Record<string, LeagueStanding> = {};

  for (const team of teams) {
    standings[team.id] = {
      teamId: team.id,
      teamName: team.name,
      position: 0,
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
      form: [],
    };
  }

  const completedMatches = fixtures.filter((m) => m.status === 'completed');
  for (const match of completedMatches) {
    const homeStanding = standings[match.homeTeamId];
    const awayStanding = standings[match.awayTeamId];

    homeStanding.played++;
    awayStanding.played++;
    homeStanding.goalsFor += match.homeScore!;
    homeStanding.goalsAgainst += match.awayScore!;
    awayStanding.goalsFor += match.awayScore!;
    awayStanding.goalsAgainst += match.homeScore!;

    if (match.homeScore! > match.awayScore!) {
      homeStanding.wins++;
      homeStanding.points += 3;
      awayStanding.losses++;
    } else if (match.homeScore! < match.awayScore!) {
      awayStanding.wins++;
      awayStanding.points += 3;
      homeStanding.losses++;
    } else {
      homeStanding.draws++;
      awayStanding.draws++;
      homeStanding.points++;
      awayStanding.points++;
    }
  }

  for (const standing of Object.values(standings)) {
    standing.goalDifference = standing.goalsFor - standing.goalsAgainst;
  }

  for (const team of teams) {
    standings[team.id].form = calculateFormGuide(fixtures, team.id);
  }

  return Object.values(standings).sort((a, b) => {
    // 1. Points
    if (a.points !== b.points) return b.points - a.points;
    // 2. Goal Difference (GD)
    if (a.goalDifference !== b.goalDifference) return b.goalDifference - a.goalDifference;
    // 3. Goals For (GF)
    if (a.goalsFor !== b.goalsFor) return b.goalsFor - a.goalsFor;

    // 4. Head-to-Head (H2H)
    const h2h = calculateHeadToHeadPoints(fixtures, a.teamId, b.teamId);
    if (h2h.pointsA !== h2h.pointsB) return h2h.pointsB - h2h.pointsA;
    if (h2h.gdA !== h2h.gdB) return h2h.gdB - h2h.gdA;
    if (h2h.gfA !== h2h.gfB) return h2h.gfB - h2h.gfA;

    // Fallback: Alphabetical
    return a.teamName.localeCompare(b.teamName);
  }).map((standing, index) => {
    standing.position = index + 1;
    return standing;
  });
};

// ═══════════════════════════════════════════════════════════════
//  EPL APP MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function EPLApp() {
  const [fixtures, setFixtures] = useState<LeagueMatch[]>([]);
  const [selectedMatchweek, setSelectedMatchweek] = useState(1);
  const [isInitialized, setIsInitialized] = useState(false);

  // Modal states
  const [isChampionModalOpen, setIsChampionModalOpen] = useState(false);
  const [hasShownChampionModal, setHasShownChampionModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedTeamForRoster, setSelectedTeamForRoster] = useState<Team | null>(null);
  const [expandedMatches, setExpandedMatches] = useState<Record<string, boolean>>({});
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Initialize fixtures (read from auto-save first)
  useEffect(() => {
    if (!isInitialized) {
      try {
        const raw = window.localStorage.getItem('epl-prediction:v1');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && Array.isArray(parsed.fixtures)) {
            setFixtures(parsed.fixtures);
            setSelectedMatchweek(parsed.selectedMatchweek || 1);
            setIsInitialized(true);
            return;
          }
        }
      } catch (e) {
        console.error("Failed to load EPL auto-save", e);
      }

      const initialFixtures = generateRoundRobinFixtures(EPL_TEAMS, epl2526Config);
      setFixtures(initialFixtures);
      setIsInitialized(true);
    }
  }, [isInitialized]);

  // Auto-save on state changes
  useEffect(() => {
    if (isInitialized && fixtures.length > 0) {
      const payload = {
        version: 2,
        fixtures,
        selectedMatchweek,
        updatedAt: new Date().toISOString(),
      };
      window.localStorage.setItem('epl-prediction:v1', JSON.stringify(payload));
    }
  }, [fixtures, selectedMatchweek, isInitialized]);

  const handleSaveSimulation = (name: string) => {
    const payload = {
      version: 2,
      fixtures,
      selectedMatchweek,
      updatedAt: new Date().toISOString(),
    };
    saveSimulation(name, 'epl', 'league', payload);
    setShowSaveModal(false);
    setToastMessage('Save successful!');
  };

  const standings = useMemo(() => {
    if (fixtures.length === 0) return [];
    return calculateEPLTable(fixtures, EPL_TEAMS);
  }, [fixtures]);

  const mots = useMemo(() => {
    if (fixtures.length === 0) return null;
    return buildLeagueSeasonMOTM(fixtures);
  }, [fixtures]);

  const completedMatchweeksCount = useMemo(() => {
    let count = 0;
    for (let mw = 1; mw <= epl2526Config.rounds; mw++) {
      if (isMatchweekCompleted(fixtures, mw)) {
        count++;
      }
    }
    return count;
  }, [fixtures]);

  const topScorers = useMemo(() => {
    const scorerMap: Record<string, { playerName: string; teamId: string; teamName: string; goals: number }> = {};

    fixtures.forEach((match) => {
      if (match.status === 'completed' && match.timeline) {
        match.timeline.forEach((event) => {
          const { playerId, playerName, teamId } = event;
          const team = EPL_TEAMS_BY_ID[teamId];
          const teamName = team ? team.name : 'Unknown';

          if (!scorerMap[playerId]) {
            scorerMap[playerId] = {
              playerName,
              teamId,
              teamName,
              goals: 0,
            };
          }
          scorerMap[playerId].goals += 1;
        });
      }
    });

    return Object.values(scorerMap)
      .sort((a, b) => b.goals - a.goals || a.playerName.localeCompare(b.playerName))
      .slice(0, 10);
  }, [fixtures]);

  const currentMatchweek = useMemo(() => {
    if (fixtures.length === 0) return 1;
    return getCurrentMatchweek(fixtures, epl2526Config.rounds);
  }, [fixtures]);

  const isSelectedMatchweekCompleted = useMemo(() => {
    if (fixtures.length === 0) return false;
    return isMatchweekCompleted(fixtures, selectedMatchweek);
  }, [fixtures, selectedMatchweek]);

  const isSeasonFinished = useMemo(() => {
    if (fixtures.length === 0) return false;
    return fixtures.every((f) => f.status === 'completed');
  }, [fixtures]);

  useEffect(() => {
    if (isSeasonFinished && !hasShownChampionModal) {
      setIsChampionModalOpen(true);
      setHasShownChampionModal(true);
    }
  }, [isSeasonFinished, hasShownChampionModal]);

  const handleSimulateMatchweek = () => {
    const updatedFixtures = fixtures.map((match) => {
      if (match.matchweek === selectedMatchweek && match.status === 'pending') {
        const homeTeam = EPL_TEAMS_BY_ID[match.homeTeamId];
        const awayTeam = EPL_TEAMS_BY_ID[match.awayTeamId];
        return simulateEPLMatch(match, homeTeam, awayTeam);
      }
      return match;
    });
    setFixtures(updatedFixtures);
  };

  const handlePredictMatch = (matchId: string) => {
    const updatedFixtures = fixtures.map((match) => {
      if (match.id === matchId && match.status === 'pending') {
        const homeTeam = EPL_TEAMS_BY_ID[match.homeTeamId];
        const awayTeam = EPL_TEAMS_BY_ID[match.awayTeamId];
        return simulateEPLMatch(match, homeTeam, awayTeam);
      }
      return match;
    });
    setFixtures(updatedFixtures);
  };

  const handleReset = () => {
    window.localStorage.removeItem('epl-prediction:v1');
    const initialFixtures = generateRoundRobinFixtures(EPL_TEAMS, epl2526Config);
    setFixtures(initialFixtures);
    setSelectedMatchweek(1);
    setIsChampionModalOpen(false);
    setHasShownChampionModal(false);
    setShowResetModal(false);
    setToastMessage('League progress has been reset.');
  };

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-[#15001a] flex items-center justify-center">
        <div className="text-[#e11d8f] text-xl font-bold animate-pulse">Loading Premier League...</div>
      </div>
    );
  }

  const leaderTeam = standings[0] || null;
  const matchweekFixtures = fixtures.filter((m) => m.matchweek === selectedMatchweek);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1b0024] via-[#0b0010] to-[#020005] text-white relative font-sans">
      {/* EPL Ball Floating Watermark */}
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '600px',
        height: '600px',
        opacity: 0.04,
        pointerEvents: 'none',
        zIndex: 0
      }}>
        <img
          src={eplBall}
          alt=""
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          className="animate-[spin_180s_linear_infinite]"
        />
      </div>

      {/* Header */}
      <header className="relative z-10 bg-[#15001a]/85 border-b border-[#38003c] shadow-2xl">
        <div className="container mx-auto px-4 py-[22px] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* White rounded container to make the colored SVG logo pop! */}
            <div className="bg-white p-2 rounded-2xl shadow-[0_8px_32px_rgba(255,255,255,0.15)] flex items-center justify-center h-16 w-16 border border-[#e11d8f]/30 shrink-0">
              <img
                src={eplLogo}
                alt="EPL Logo"
                className="h-16 w-auto object-contain"
              />
            </div>
            <div>
              <h1 className="text-5xl font-black bg-gradient-to-r from-white via-slate-50 to-[#e11d8f] bg-clip-text text-transparent leading-none flex items-center gap-2">
                English Premier League
              </h1>
              <p className="text-[#e11d8f] text-base font-black tracking-wider uppercase mt-1.5">
                Official Season 2025/2026 Simulation
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowSaveModal(true)}
              className="px-4 py-2 bg-indigo-500/10 text-indigo-300 font-extrabold rounded-xl hover:bg-indigo-500/20 border border-indigo-500/25 transition-all text-base flex items-center gap-1.5 shadow-[0_0_12px_rgba(99,102,241,0.15)]"
            >
              <Save className="h-5 w-5" /> Save Process
            </button>
            <button
              onClick={() => setShowResetModal(true)}
              className="px-4 py-2 bg-rose-500/10 text-rose-300 font-extrabold rounded-xl hover:bg-rose-500/20 border border-rose-500/25 transition-all text-base"
            >
              Reset League
            </button>
            <Link
              to="/hub"
              className="px-4 py-2 bg-white/5 text-slate-200 font-extrabold rounded-xl hover:bg-white/10 border border-white/10 transition-all text-base flex items-center"
            >
              ← Back to Hub
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-[1600px] mx-auto px-4 py-8 relative z-10 space-y-8">
        {/* Matchweeks Section */}
        <section className="bg-[#15001a]/70 backdrop-blur-xl rounded-[32px] p-6 border border-[#38003c]/40 shadow-2xl w-full mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h2 className="text-4xl font-black text-white flex items-center gap-2">
              <img src={eplLogoNoTextWhite} className="w-10 h-10 object-contain" alt="" />
              Matchweek {selectedMatchweek}
            </h2>
            {!isSelectedMatchweekCompleted && (
              <button
                onClick={handleSimulateMatchweek}
                className="px-6 py-4 bg-[#e11d8f] text-black font-black rounded-2xl hover:brightness-110 transition-all shadow-lg shadow-[#e11d8f]/15 active:scale-95 text-lg uppercase tracking-wider"
              >
                Simulate Matchweek {selectedMatchweek}
              </button>
            )}
            {isSelectedMatchweekCompleted && (
              <span className="px-4 py-2 bg-[#e11d8f]/10 text-[#e11d8f] font-black rounded-2xl border border-[#e11d8f]/20 text-base uppercase tracking-widest">
                Matchweek Completed
              </span>
            )}
          </div>

          {/* Slider Pagination (Gom thành 2 hàng cố định, co giãn tối đa chiều ngang card) */}
          <div className="w-full flex items-center justify-between gap-4 mb-6 bg-[#15001a]/40 p-4 rounded-3xl border border-[#38003c]/20">
            <button
              onClick={() => setSelectedMatchweek(Math.max(1, selectedMatchweek - 1))}
              disabled={selectedMatchweek === 1}
              className="px-4 py-3 bg-white/5 hover:bg-white/10 text-slate-200 text-xl rounded-2xl disabled:opacity-20 disabled:cursor-not-allowed border border-white/5 font-extrabold transition-all shrink-0"
              title="Previous Matchweek"
            >
              ←
            </button>

            <div className="flex-1 flex flex-col gap-3 min-w-0">
              {/* Row 1: Matchweek 1 -> 19 */}
              <div className="flex gap-1.5 sm:gap-2 justify-between w-full">
                {Array.from({ length: 19 }, (_, i) => i + 1).map((mw) => {
                  const isCompleted = fixtures
                    .filter((f) => f.matchweek === mw)
                    .every((f) => f.status === 'completed');
                  const isCurrent = mw === selectedMatchweek;

                  return (
                    <button
                      key={mw}
                      onClick={() => setSelectedMatchweek(mw)}
                      className={`flex-1 py-2 rounded-xl font-black text-xs sm:text-base shrink border transition-all text-center cursor-pointer ${isCurrent
                        ? 'bg-[#e11d8f] text-black border-[#e11d8f] scale-105 shadow-md shadow-[#e11d8f]/15'
                        : isCompleted
                          ? 'bg-[#15001a]/90 text-[#e11d8f] border-[#38003c]/40 hover:bg-[#38003c]/40'
                          : 'bg-white/5 text-slate-300 border-white/5 hover:bg-white/10 hover:text-white'
                        }`}
                    >
                      {mw}
                    </button>
                  );
                })}
              </div>

              {/* Row 2: Matchweek 20 -> 38 */}
              <div className="flex gap-1.5 sm:gap-2 justify-between w-full">
                {Array.from({ length: 19 }, (_, i) => i + 20).map((mw) => {
                  const isCompleted = fixtures
                    .filter((f) => f.matchweek === mw)
                    .every((f) => f.status === 'completed');
                  const isCurrent = mw === selectedMatchweek;

                  return (
                    <button
                      key={mw}
                      onClick={() => setSelectedMatchweek(mw)}
                      className={`flex-1 py-2 rounded-xl font-black text-xs sm:text-base shrink border transition-all text-center cursor-pointer ${isCurrent
                        ? 'bg-[#e11d8f] text-black border-[#e11d8f] scale-105 shadow-md shadow-[#e11d8f]/15'
                        : isCompleted
                          ? 'bg-[#15001a]/90 text-[#e11d8f] border-[#38003c]/40 hover:bg-[#38003c]/40'
                          : 'bg-white/5 text-slate-300 border-white/5 hover:bg-white/10 hover:text-white'
                        }`}
                    >
                      {mw}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={() => setSelectedMatchweek(Math.min(epl2526Config.rounds, selectedMatchweek + 1))}
              disabled={selectedMatchweek === epl2526Config.rounds}
              className="px-4 py-3 bg-white/5 hover:bg-white/10 text-slate-200 text-xl rounded-2xl disabled:opacity-20 disabled:cursor-not-allowed border border-white/5 font-extrabold transition-all shrink-0"
              title="Next Matchweek"
            >
              →
            </button>
          </div>

          {/* Expanded Match Cards Grid - 2 columns on medium+ screens */}
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
            {matchweekFixtures.map((match) => {
              const homeTeam = EPL_TEAMS_BY_ID[match.homeTeamId];
              const awayTeam = EPL_TEAMS_BY_ID[match.awayTeamId];
              const isCompleted = match.status === 'completed';
              const hasTimeline = match.timeline && match.timeline.length > 0;
              const homeEvents = match.timeline?.filter((e) => e.side === 'home') ?? [];
              const awayEvents = match.timeline?.filter((e) => e.side === 'away') ?? [];

              return (
                <div
                  key={match.id}
                  className="bg-[#15001a]/30 rounded-[28px] p-6 border border-[#38003c]/35 hover:border-[#e11d8f]/40 transition-all duration-300 flex flex-col gap-5 shadow-xl hover:shadow-2xl"
                >
                  {/* Horizontal Match Layout */}
                  <div className="flex items-center justify-between gap-3 py-2">
                    {/* Home Team (Left Side - occupies ~40% width) */}
                    <button
                      onClick={() => setSelectedTeamForRoster(homeTeam)}
                      className="flex-1 flex items-center justify-end gap-2.5 sm:gap-4 text-right hover:text-[#e11d8f] transition-colors group cursor-pointer min-w-0"
                    >
                      <span className="font-black text-sm sm:text-base md:text-sm lg:text-base xl:text-lg text-slate-100 group-hover:text-[#e11d8f] transition-colors leading-tight text-right whitespace-normal break-words">
                        {homeTeam.name}
                      </span>
                      <img
                        src={EPL_LOGO_MAP[homeTeam.id]}
                        alt=""
                        className="w-8 h-8 sm:w-10 sm:h-10 md:w-8 md:h-8 lg:w-10 lg:h-10 xl:w-12 xl:h-12 object-contain shrink-0 group-hover:scale-110 transition-transform"
                      />
                    </button>

                    {/* Score / VS Center (occupies ~20% width) */}
                    <div className="min-w-[80px] sm:min-w-[100px] md:min-w-[80px] lg:min-w-[100px] xl:min-w-[110px] text-center flex flex-col items-center shrink-0">
                      {isCompleted ? (
                        <div className="flex items-center justify-center gap-2 sm:gap-3 bg-[#15001a] px-3 py-2 sm:px-5 sm:py-2.5 rounded-2xl border border-[#38003c]/60 font-mono shadow-inner w-full">
                          <span className="text-2xl sm:text-4xl lg:text-5xl font-black text-[#e11d8f]">{match.homeScore}</span>
                          <span className="text-slate-500 font-black text-base sm:text-xl">:</span>
                          <span className="text-2xl sm:text-4xl lg:text-5xl font-black text-[#e11d8f]">{match.awayScore}</span>
                        </div>
                      ) : (
                        <span className="text-xs sm:text-base lg:text-lg font-black text-slate-300 bg-[#15001a] px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl border border-[#38003c]/40 uppercase tracking-widest w-full">
                          VS
                        </span>
                      )}
                    </div>

                    {/* Away Team (Right Side - occupies ~40% width) */}
                    <button
                      onClick={() => setSelectedTeamForRoster(awayTeam)}
                      className="flex-1 flex items-center justify-start gap-2.5 sm:gap-4 text-left hover:text-[#e11d8f] transition-colors group cursor-pointer min-w-0"
                    >
                      <img
                        src={EPL_LOGO_MAP[awayTeam.id]}
                        alt=""
                        className="w-8 h-8 sm:w-10 sm:h-10 md:w-8 md:h-8 lg:w-10 lg:h-10 xl:w-12 xl:h-12 object-contain shrink-0 group-hover:scale-110 transition-transform"
                      />
                      <span className="font-black text-sm sm:text-base md:text-sm lg:text-base xl:text-lg text-slate-100 group-hover:text-[#e11d8f] transition-colors leading-tight text-left whitespace-normal break-words">
                        {awayTeam.name}
                      </span>
                    </button>
                  </div>

                  {/* Predict Match Button */}
                  {!isCompleted && (
                    <button
                      onClick={() => handlePredictMatch(match.id)}
                      className="w-full py-4 bg-[#e11d8f] text-black rounded-2xl text-lg font-black uppercase tracking-wider hover:brightness-110 active:scale-[0.98] transition-all shadow-lg shadow-[#e11d8f]/15"
                    >
                      Predict Match
                    </button>
                  )}

                  {/* Scorers / Timeline (Two Columns Horizontal Layout since card is very wide!) */}
                  {isCompleted && hasTimeline && (
                    <div className="border-t border-[#38003c]/30 pt-4 space-y-2">
                      <button
                        onClick={() => setExpandedMatches((prev) => ({ ...prev, [match.id]: !prev[match.id] }))}
                        className="w-full flex items-center justify-between gap-1.5 px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-base font-bold uppercase transition-all cursor-pointer"
                      >
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-4 w-4 text-[#e11d8f]" />
                          <span>Timeline</span>
                        </span>
                        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${expandedMatches[match.id] ? 'rotate-180' : ''}`} />
                      </button>

                      {expandedMatches[match.id] && (
                        <div className="grid grid-cols-2 gap-6 text-sm mt-2 transition-all">
                          {/* Home goals */}
                          <div className="bg-[#15001a]/60 p-4 rounded-2xl border border-[#38003c]/20 space-y-2.5">
                            <span className="text-sm text-[#e11d8f] font-black uppercase tracking-wider block border-b border-[#38003c]/40 pb-1">{homeTeam.shortName} Goals</span>
                            {homeEvents.length > 0 ? (
                              homeEvents.map((ev, i) => (
                                <div key={i} className="text-slate-100 flex items-center gap-2 truncate">
                                  <img src={eplBall} className="w-3.5 h-3.5 object-contain shrink-0" alt="" />
                                  <span className="font-mono text-sm text-[#e11d8f] font-bold">{ev.displayMinute}</span>
                                  <span className="truncate font-bold">{ev.playerName}</span>
                                </div>
                              ))
                            ) : (
                              <span className="text-slate-500 italic block py-1">No goals scored</span>
                            )}
                          </div>
                          {/* Away goals */}
                          <div className="bg-[#15001a]/60 p-4 rounded-2xl border border-[#38003c]/20 space-y-2.5">
                            <span className="text-sm text-[#e11d8f] font-black uppercase tracking-wider block border-b border-[#38003c]/40 pb-1">{awayTeam.shortName} Goals</span>
                            {awayEvents.length > 0 ? (
                              awayEvents.map((ev, i) => (
                                <div key={i} className="text-slate-100 flex items-center gap-2 truncate">
                                  <img src={eplBall} className="w-3.5 h-3.5 object-contain shrink-0" alt="" />
                                  <span className="font-mono text-sm text-[#e11d8f] font-bold">{ev.displayMinute}</span>
                                  <span className="truncate font-bold">{ev.playerName}</span>
                                </div>
                              ))
                            ) : (
                              <span className="text-slate-500 italic block py-1">No goals scored</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Bảng Xếp Hạng & Vua Phá Lưới (Centered Stack Layout) */}
        <div className="w-full mx-auto space-y-8">
          {/* League Table Card */}
          <div className="bg-[#15001a]/70 backdrop-blur-xl rounded-[32px] p-8 border border-[#38003c]/40 shadow-2xl">
            <h2 className="text-4xl font-black text-white mb-6 flex items-center gap-2.5">
              <img src={eplLogoNoTextWhite} className="w-9 h-9 object-contain" alt="" />
              League Table
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#38003c]/50 text-slate-100 text-base uppercase tracking-wider font-extrabold">
                    <th className="py-3 px-2 w-16 text-center">Pos</th>
                    <th className="py-3 px-4">Club</th>
                    <th className="py-3 px-2 text-center w-16">P</th>
                    <th className="py-3 px-2 text-center w-16">W</th>
                    <th className="py-3 px-2 text-center w-16">D</th>
                    <th className="py-3 px-2 text-center w-16">L</th>
                    <th className="py-3 px-2 text-center w-16">GF</th>
                    <th className="py-3 px-2 text-center w-16">GA</th>
                    <th className="py-3 px-2 text-center w-20">GD</th>
                    <th className="py-3 px-2 text-center font-bold text-[#e11d8f] w-20">Pts</th>
                    <th className="py-3 px-4 text-center w-44">Form</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#38003c]/15 text-lg">
                  {standings.map((standing) => {
                    const isLeader = standing.position === 1;
                    const zone = epl2526Config.qualificationZones.find(
                      (z) => standing.position >= z.startPosition && standing.position <= z.endPosition
                    );
                    const leftBorderColor = isLeader ? '#fbbf24' : (zone ? zone.color : 'transparent');

                    return (
                      <tr
                        key={standing.teamId}
                        style={{ borderLeft: `4px solid ${leftBorderColor}` }}
                        className={`hover:bg-white/5 transition-colors border-b border-[#38003c]/15 ${isLeader ? 'bg-amber-400/5 font-extrabold text-amber-200' : ''
                          }`}
                      >
                        <td className="py-4 px-2 text-center font-black text-slate-100 text-lg">
                          {isLeader ? '🏆 1' : standing.position}
                        </td>
                        <td className="py-4 px-4">
                          <button
                            onClick={() => setSelectedTeamForRoster(EPL_TEAMS_BY_ID[standing.teamId])}
                            className="flex items-center gap-3 font-black text-slate-100 hover:text-[#e11d8f] transition-all cursor-pointer text-left text-lg"
                          >
                            {/* Adjusted logo size (smaller: w-7 h-7 object-contain) */}
                            <img src={EPL_LOGO_MAP[standing.teamId]} alt="" className="w-7 h-7 object-contain shrink-0" />
                            <span>{standing.teamName}</span>
                          </button>
                        </td>
                        <td className="py-4 px-2 text-center text-slate-200 font-bold text-lg">{standing.played}</td>
                        <td className="py-4 px-2 text-center text-slate-200 font-bold text-lg">{standing.wins}</td>
                        <td className="py-4 px-2 text-center text-slate-200 font-bold text-lg">{standing.draws}</td>
                        <td className="py-4 px-2 text-center text-slate-200 font-bold text-lg">{standing.losses}</td>
                        <td className="py-4 px-2 text-center text-slate-300 text-lg">{standing.goalsFor}</td>
                        <td className="py-4 px-2 text-center text-slate-300 text-lg">{standing.goalsAgainst}</td>
                        <td className="py-4 px-2 text-center text-slate-100 font-mono font-bold text-lg">
                          {standing.goalDifference > 0 ? `+${standing.goalDifference}` : standing.goalDifference}
                        </td>
                        <td className="py-4 px-2 text-center font-black text-[#e11d8f] text-xl">{standing.points}</td>
                        <td className="py-4 px-4">
                          <div className="flex gap-1.5 justify-center">
                            {standing.form.map((res, i) => (
                              <span
                                key={i}
                                className={`w-7 h-7 rounded flex items-center justify-center text-xs font-black ${res === 'W'
                                  ? 'bg-[#e11d8f] text-black shadow-sm shadow-[#e11d8f]/20'
                                  : res === 'D'
                                    ? 'bg-slate-600 text-white'
                                    : 'bg-rose-600 text-white'
                                  }`}
                              >
                                {res}
                              </span>
                            ))}
                            {standing.form.length === 0 && <span className="text-slate-500 text-base italic">N/A</span>}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Zone Legend */}
            <div className="mt-6 flex flex-wrap gap-4 border-t border-[#38003c]/20 pt-4">
              {epl2526Config.qualificationZones.map((zone) => (
                <div key={zone.id} className="flex items-center gap-2 bg-[#15001a]/90 px-3.5 py-1.5 rounded-2xl border border-[#38003c]/40 shadow-sm">
                  <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: zone.color }} />
                  <span className="text-base text-slate-100 font-bold">{zone.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Scorers Card (Placed directly under Standings table as requested) */}
          <div className="bg-[#15001a]/70 backdrop-blur-xl rounded-[32px] p-8 border border-[#38003c]/40 shadow-2xl">
            <h2 className="text-4xl font-black text-white mb-6 flex items-center gap-2.5">
              <img src={eplBall} className="w-9 h-9 object-contain" alt="" />
              Top Scorers
            </h2>
            {topScorers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center bg-[#15001a]/40 rounded-3xl border border-[#38003c]/20">
                <img src={eplLogoNoTextWhite} className="w-12 h-12 object-contain mb-2" />
                <p className="text-slate-400 font-black text-lg">Race hasn't started yet</p>
                <p className="text-slate-500 text-base mt-1.5 px-4">
                  Simulate or predict matches to see the Golden Boot leaderboard.
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-[#38003c]/35 bg-[#15001a]/50 shadow-lg">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#38003c]/30 bg-[#15001a]/85 text-base font-black uppercase tracking-wider text-slate-100">
                      <th className="py-3 px-5 w-16 text-center">Rank</th>
                      <th className="py-3 px-4">Player</th>
                      <th className="py-3 px-4">Club</th>
                      <th className="py-3 px-6 text-right">Goals</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#38003c]/15 text-lg">
                    {topScorers.map((scorer, idx) => (
                      <tr key={idx} className="hover:bg-white/5 transition-colors">
                        <td className="py-3.5 px-5 text-center">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full font-black text-base">
                            {idx + 1}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-black text-white text-lg">{scorer.playerName}</td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2 font-bold text-slate-200 text-lg">
                            <img src={EPL_LOGO_MAP[scorer.teamId]} alt="" className="w-7 h-7 object-contain shrink-0" />
                            <span>{scorer.teamName}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-6 text-right font-black text-[#e11d8f] text-xl">{scorer.goals}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Title Race Chart Card */}
        <section className="bg-[#15001a]/70 backdrop-blur-xl rounded-[32px] p-6 border border-[#38003c]/40 shadow-2xl w-full mx-auto">
          <TitleRaceChart standings={standings} fixtures={fixtures} totalRounds={epl2526Config.rounds} logoMap={EPL_LOGO_MAP} />
        </section>

        {/* Season Recap Card */}
        <section id="league-recap-section" className="bg-[#15001a]/70 backdrop-blur-xl rounded-[32px] p-6 border border-[#38003c]/40 shadow-2xl w-full mx-auto">
          <LeagueRecap standings={standings} fixtures={fixtures} logoMap={EPL_LOGO_MAP} leagueLogo={eplLogo} mots={mots || undefined} />
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[#15001a]/95 backdrop-blur-xl border-t border-[#38003c] mt-16 py-8 relative z-10">
        <div className="container mx-auto px-4 text-center text-slate-400 text-xs font-black uppercase tracking-widest">
          <p>Premier League Simulation Engine</p>
        </div>
      </footer>

      {/* Roster Modal */}
      {selectedTeamForRoster && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md" onClick={() => setSelectedTeamForRoster(null)} />
          <div className="relative z-10 w-full max-w-3xl bg-[#15001a] border border-[#38003c] rounded-[32px] overflow-hidden shadow-2xl p-0">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#38003c] bg-[#15001a]/85 backdrop-blur-md">
              <div className="flex items-center gap-4">
                <div className="bg-white p-1.5 rounded-2xl border border-[#38003c]/40">
                  <img src={EPL_LOGO_MAP[selectedTeamForRoster.id]} alt="" className="w-10 h-10 object-contain" />
                </div>
                <div>
                  <h3 className="font-black text-3xl text-white flex items-center gap-1.5">{selectedTeamForRoster.name}</h3>
                  <p className="text-slate-300 text-base font-bold uppercase tracking-wider mt-0.5">
                    Rating: <span className="text-[#e11d8f]">{selectedTeamForRoster.rating}</span> · Tier {EPL_TIER_MAP[selectedTeamForRoster.id] === 3 ? 'S' : EPL_TIER_MAP[selectedTeamForRoster.id] === 2 ? 'A' : EPL_TIER_MAP[selectedTeamForRoster.id] === 1 ? 'B' : 'C'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedTeamForRoster(null)}
                className="text-slate-400 hover:text-white p-2 bg-white/5 rounded-full hover:bg-white/10 border border-white/5"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-h-[60vh] overflow-y-auto bg-[#0a000f]/40">
              {/* GK + DF */}
              <div className="space-y-6">
                {/* GK */}
                <div className="space-y-3">
                  <h4 className="text-sm font-black text-[#e11d8f] uppercase tracking-widest border-b border-[#38003c] pb-1.5 flex items-center gap-1">
                    <span>🧤</span> GK
                  </h4>
                  <ul className="space-y-1.5">
                    {selectedTeamForRoster.players.filter((p) => p.position === 'GK').map((p) => (
                      <li key={p.id} className="text-base font-bold text-slate-100 bg-[#15001a]/80 py-2.5 px-3.5 rounded-xl border border-[#38003c]/20 hover:border-[#e11d8f]/30 transition-colors whitespace-normal break-words" title={p.name}>{p.name}</li>
                    ))}
                  </ul>
                </div>
                {/* DF */}
                <div className="space-y-3">
                  <h4 className="text-sm font-black text-[#e11d8f] uppercase tracking-widest border-b border-[#38003c] pb-1.5 flex items-center gap-1">
                    <span>🛡️</span> DF
                  </h4>
                  <ul className="space-y-1.5">
                    {selectedTeamForRoster.players.filter((p) => p.position === 'DF').map((p) => (
                      <li key={p.id} className="text-base font-bold text-slate-100 bg-[#15001a]/80 py-2.5 px-3.5 rounded-xl border border-[#38003c]/20 hover:border-[#e11d8f]/30 transition-colors whitespace-normal break-words" title={p.name}>{p.name}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* MF */}
              <div className="space-y-3">
                <h4 className="text-sm font-black text-[#e11d8f] uppercase tracking-widest border-b border-[#38003c] pb-1.5 flex items-center gap-1">
                  <span>⚙️</span> MF
                </h4>
                <ul className="space-y-1.5">
                  {selectedTeamForRoster.players.filter((p) => p.position === 'MF').map((p) => (
                    <li key={p.id} className="text-base font-bold text-slate-100 bg-[#15001a]/80 py-2.5 px-3.5 rounded-xl border border-[#38003c]/20 hover:border-[#e11d8f]/30 transition-colors whitespace-normal break-words" title={p.name}>{p.name}</li>
                  ))}
                </ul>
              </div>

              {/* FW */}
              <div className="space-y-3">
                <h4 className="text-sm font-black text-[#e11d8f] uppercase tracking-widest border-b border-[#38003c] pb-1.5 flex items-center gap-1">
                  <span>🎯</span> FW
                </h4>
                <ul className="space-y-1.5">
                  {selectedTeamForRoster.players.filter((p) => p.position === 'FW').map((p) => (
                    <li key={p.id} className="text-base font-bold text-slate-100 bg-[#15001a]/80 py-2.5 px-3.5 rounded-xl border border-[#38003c]/20 hover:border-[#e11d8f]/30 transition-colors whitespace-normal break-words" title={p.name}>{p.name}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowResetModal(false)} />
          <div className="relative z-10 w-full max-w-md bg-[#15001a] border border-rose-500/30 rounded-[28px] overflow-hidden shadow-2xl p-6 text-center">
            <h3 className="text-xl font-black text-rose-300 mb-3">Reset EPL Simulation?</h3>
            <p className="text-slate-300 text-sm mb-6">
              Are you sure you want to reset the league simulation? This will wipe your current season progress and reload the initial fixtures.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={handleReset}
                className="px-5 py-2.5 bg-rose-500 text-white font-extrabold rounded-xl hover:bg-rose-600 transition-colors active:scale-95 text-xs uppercase"
              >
                Yes, Reset
              </button>
              <button
                onClick={() => setShowResetModal(false)}
                className="px-5 py-2.5 bg-white/5 text-slate-200 border border-white/15 font-bold rounded-xl hover:bg-white/10 transition-colors text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Champion Celebration Modal */}
      {leaderTeam && isChampionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Confetti */}
          <div className="pointer-events-none absolute inset-0 z-0">
            <ReactConfetti width={window.innerWidth} height={window.innerHeight} recycle={true} numberOfPieces={280} />
          </div>

          {/* Backdrop */}
          <div className="fixed inset-0 z-10 bg-black/85 backdrop-blur-md transition-opacity" onClick={() => setIsChampionModalOpen(false)} />

          {/* Modal Card */}
          <div className="relative z-20 w-full max-w-xl overflow-hidden rounded-[32px] border border-[#e11d8f]/20 bg-[linear-gradient(165deg,#1a0025_0%,#0d001a_40%,#030008_100%)] p-0 text-center shadow-[0_0_60px_rgba(225,29,143,0.12),0_0_120px_rgba(56,0,60,0.4)]">

            {/* Radial ambient glow overlays */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_center,rgba(225,29,143,0.12),transparent_40%)] pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(56,0,60,0.35),transparent_45%)] pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(245,158,11,0.08),transparent_40%)] pointer-events-none" />

            {/* Floating EPL Ball watermark behind content */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] h-[320px] opacity-[0.04] pointer-events-none">
              <img src={eplBall} alt="" className="w-full h-full object-contain animate-[spin_120s_linear_infinite]" />
            </div>

            {/* Close Button */}
            <button
              onClick={() => setIsChampionModalOpen(false)}
              aria-label="Close"
              className="absolute right-5 top-5 z-30 rounded-full bg-white/6 p-2 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Content */}
            <div className="relative z-20 px-8 pt-10 pb-8">

              {/* Brand Assets Row: EPL Logo + Trophy + Club Badge */}
              <div className="flex items-center justify-center gap-5">
                {/* EPL League Logo */}
                <div className="bg-white p-2 rounded-2xl shadow-[0_4px_24px_rgba(255,255,255,0.12)] flex items-center justify-center h-[72px] w-[72px] border border-[#e11d8f]/20 shrink-0">
                  <img src={eplLogo} alt="EPL" className="h-14 w-auto object-contain" />
                </div>

                {/* Golden Trophy */}
                <div className="relative">
                  <div className="absolute -inset-3 animate-pulse rounded-full bg-amber-400/15 blur-xl" />
                  <div className="relative flex h-[88px] w-[88px] items-center justify-center rounded-full border-2 border-amber-400/60 bg-gradient-to-br from-[#2b0036] to-[#15001a] shadow-[0_0_32px_rgba(245,158,11,0.35)]">
                    <Trophy className="h-11 w-11 text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]" />
                  </div>
                </div>

                {/* Champion Club Badge */}
                <div className="bg-white p-2 rounded-2xl shadow-[0_4px_24px_rgba(255,255,255,0.12)] flex items-center justify-center h-[72px] w-[72px] border border-amber-400/20 shrink-0">
                  <img src={EPL_LOGO_MAP[leaderTeam.teamId]} alt="" className="h-14 w-14 object-contain" />
                </div>
              </div>

              {/* "Premier League Champion" Label */}
              <p className="mt-7 text-sm font-semibold uppercase tracking-[0.3em] text-[#e11d8f]/60">
                <Sparkles className="inline h-4 w-4 animate-pulse text-amber-400 mr-2" />
                Premier League Champion
                <Sparkles className="inline h-4 w-4 animate-pulse text-amber-400 ml-2" />
              </p>

              {/* Season Badge */}
              <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-[#e11d8f]/15 bg-[#e11d8f]/5 px-4 py-1">
                <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#e11d8f]/70">Season 2025/2026</span>
              </div>

              {/* Champion Team Name */}
              <h3 className="mt-5 text-yellow-400 text-4xl font-black sm:text-5xl drop-shadow-[0_0_20px_rgba(250,204,21,0.4)] leading-tight">
                {leaderTeam.teamName}
              </h3>

              {/* Stats Summary */}
              <div className="mt-6 mx-auto max-w-xs grid grid-cols-3 gap-3">
                <div className="bg-white/5 rounded-xl border border-white/8 px-3 py-2.5">
                  <div className="text-[#e11d8f] text-xl font-black">{leaderTeam.points}</div>
                  <div className="text-[10px] text-white/40 font-bold uppercase tracking-wider mt-0.5">Points</div>
                </div>
                <div className="bg-white/5 rounded-xl border border-white/8 px-3 py-2.5">
                  <div className="text-white text-xl font-black">{leaderTeam.wins}</div>
                  <div className="text-[10px] text-white/40 font-bold uppercase tracking-wider mt-0.5">Wins</div>
                </div>
                <div className="bg-white/5 rounded-xl border border-white/8 px-3 py-2.5">
                  <div className="text-white text-xl font-black">{leaderTeam.goalDifference > 0 ? `+${leaderTeam.goalDifference}` : leaderTeam.goalDifference}</div>
                  <div className="text-[10px] text-white/40 font-bold uppercase tracking-wider mt-0.5">GD</div>
                </div>
              </div>

              {/* Congratulations Text */}
              <p className="mx-auto mt-5 max-w-md text-sm leading-7 text-white/60">
                Congratulations to <span className="text-yellow-400 font-bold">{leaderTeam.teamName}</span> for reaching the pinnacle of the English Premier League in this simulation.
              </p>

              {/* Action Button */}
              <button
                type="button"
                onClick={() => {
                  setIsChampionModalOpen(false);
                  const el = document.getElementById('league-recap-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="mt-8 w-full rounded-2xl border border-[#e11d8f]/25 bg-[#e11d8f]/12 px-5 py-4 text-sm font-bold text-[#e11d8f] transition-all hover:scale-[1.02] hover:bg-[#e11d8f]/18 active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <Award className="h-4 w-4" /> Close and View Season Recap
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save Modal */}
      <SaveModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onSave={handleSaveSimulation}
        defaultSaveName="Premier League - My Season"
      />

      {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage(null)} />}

      {/* Back to Top Button */}
      {showBackToTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 z-[70] inline-flex items-center justify-center gap-1.5 rounded-full border border-[#e11d8f]/30 bg-[#15001a]/95 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-[#e11d8f] shadow-lg shadow-[#e11d8f]/15 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
          aria-label="Back to top"
        >
          <ChevronUp className="h-4 w-4" />
          Top
        </button>
      )}
    </div>
  );
}
