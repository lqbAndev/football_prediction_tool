import { useState } from 'react';
import {
  Trophy,
  Medal,
  Award,
  Target,
  Swords,
  Flame,
  Sparkles,
  Shield,
  Zap,
  TrendingUp,
  Home,
  Plane,
  Skull,
  Calendar,
  Clock,
  ChevronRight,
  Sparkle,
  Smile,
  Heart,
  Star,
  BarChart3
} from 'lucide-react';
import type { LeagueStanding, LeagueMatch } from '../../types/leagueConfig';
import type { LeagueMOTS } from '../../utils/motm';
import type { Team } from '../../types/tournament';

interface LeagueRecapProps {
  standings: LeagueStanding[];
  fixtures: LeagueMatch[];
  logoMap?: Record<string, string>;
  leagueLogo?: string;
  mots?: LeagueMOTS;
  teamsById?: Record<string, Team>;
}

const StatCard = ({
  label,
  value,
  sub,
  accent = 'emerald',
  teamInitials,
  teamId,
  logoMap,
  className = '',
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: 'amber' | 'emerald' | 'rose' | 'sky' | 'violet';
  teamInitials?: string;
  teamId?: string;
  logoMap?: Record<string, string>;
  className?: string;
}) => {
  const borderMap = {
    amber: 'border-amber-400/25',
    emerald: 'border-emerald-400/25',
    rose: 'border-rose-400/25',
    sky: 'border-sky-400/25',
    violet: 'border-violet-400/25',
  };
  const bgMap = {
    amber: 'bg-amber-950/10',
    emerald: 'bg-emerald-950/15',
    rose: 'bg-rose-950/10',
    sky: 'bg-sky-950/10',
    violet: 'bg-violet-950/10',
  };
  const labelColorMap = {
    amber: 'text-amber-400/80',
    emerald: 'text-emerald-400/80',
    rose: 'text-rose-400/80',
    sky: 'text-sky-400/80',
    violet: 'text-violet-400/80',
  };

  return (
    <div
      className={`rounded-2xl border ${borderMap[accent]} ${bgMap[accent]} p-5 transition-all duration-300 hover:scale-[1.02] ${className} backdrop-blur-md`}
    >
      <div className={`text-xs font-bold uppercase tracking-[0.22em] ${labelColorMap[accent]}`}>
        {label}
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {logoMap && teamId && logoMap[teamId] ? (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white border border-slate-200 p-0.5">
              <img src={logoMap[teamId]} alt="" className="h-full w-full object-contain" />
            </div>
          ) : teamInitials ? (
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border font-bold text-xs ${
              accent === 'amber' ? 'bg-amber-950/40 border-amber-400/30 text-amber-200' :
              accent === 'rose' ? 'bg-rose-950/40 border-rose-400/30 text-rose-200' :
              accent === 'sky' ? 'bg-sky-950/40 border-sky-400/30 text-sky-200' :
              accent === 'violet' ? 'bg-violet-950/40 border-violet-400/30 text-violet-200' :
              'bg-emerald-950/40 border-emerald-400/30 text-emerald-200'
            }`}>
              {teamInitials}
            </div>
          ) : null}
          <div className="truncate text-xl font-black text-white">{value}</div>
        </div>
      </div>
      {sub ? <div className="mt-1.5 text-xs text-white/55">{sub}</div> : null}
    </div>
  );
};

const FeaturedMatchCard = ({
  title,
  homeTeam,
  homeTeamId,
  awayTeam,
  awayTeamId,
  homeScore,
  awayScore,
  roundLabel,
  logoMap,
  className = '',
}: {
  title: string;
  homeTeam: string;
  homeTeamId?: string;
  awayTeam: string;
  awayTeamId?: string;
  homeScore: number;
  awayScore: number;
  roundLabel: string;
  logoMap?: Record<string, string>;
  className?: string;
}) => (
  <div
    className={`rounded-2xl border border-amber-400/25 bg-gradient-to-br from-amber-500/10 via-emerald-950/10 to-emerald-950/[0.03] p-5 transition-all duration-300 hover:scale-[1.01] shadow-[0_4px_24px_rgba(245,158,11,0.04)] ${className}`}
  >
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-amber-400/90">
        <Flame className="h-4 w-4 animate-pulse" />
        {title}
      </div>
      <div className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300 font-bold">
        {roundLabel}
      </div>
    </div>

    <div className="flex items-center justify-between gap-3">
      {/* Home */}
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {logoMap && homeTeamId && logoMap[homeTeamId] ? (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white border border-slate-200 p-0.5">
            <img src={logoMap[homeTeamId]} alt="" className="h-full w-full object-contain" />
          </div>
        ) : (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-emerald-500/20 bg-emerald-950/60 font-black text-sm text-emerald-400">
            {homeTeam.slice(0, 2).toUpperCase()}
          </div>
        )}
        <span className="whitespace-nowrap font-bold text-white text-base">
          {homeTeam}
        </span>
      </div>

      {/* Score */}
      <div className="flex flex-col items-center px-4">
        <div className="flex items-center gap-2 text-2xl font-black text-white">
          <span>{homeScore}</span>
          <span className="text-white/30">:</span>
          <span>{awayScore}</span>
        </div>
      </div>

      {/* Away */}
      <div className="flex min-w-0 flex-1 items-center justify-end gap-3">
        <span className="whitespace-nowrap text-right font-bold text-white text-base">
          {awayTeam}
        </span>
        {logoMap && awayTeamId && logoMap[awayTeamId] ? (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white border border-slate-200 p-0.5">
            <img src={logoMap[awayTeamId]} alt="" className="h-full w-full object-contain" />
          </div>
        ) : (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-emerald-500/20 bg-emerald-950/60 font-black text-sm text-emerald-400">
            {awayTeam.slice(0, 2).toUpperCase()}
          </div>
        )}
      </div>
    </div>
  </div>
);

const Podium = ({
  champion,
  championId,
  runnerUp,
  runnerUpId,
  thirdPlace,
  thirdPlaceId,
  logoMap,
}: {
  champion: string;
  championId: string;
  runnerUp: string;
  runnerUpId: string;
  thirdPlace: string;
  thirdPlaceId: string;
  logoMap?: Record<string, string>;
}) => (
  <div className="flex items-end justify-center gap-3 py-6 sm:gap-6 lg:gap-10">
    {/* 2nd Place */}
    <div className="flex w-[100px] flex-col items-center sm:w-[150px] lg:w-[180px]">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white border-2 border-emerald-500/20 shadow-[0_4px_16px_rgba(0,0,0,0.3)] p-1 shrink-0">
        {logoMap && runnerUpId && logoMap[runnerUpId] ? (
          <img src={logoMap[runnerUpId]} alt="" className="w-10 h-10 object-contain" />
        ) : (
          <span className="font-black text-emerald-800 text-lg">{runnerUp.slice(0, 2).toUpperCase()}</span>
        )}
      </div>
      <div className="mt-2 flex items-center gap-1 text-[10px] uppercase tracking-widest text-emerald-300/50 sm:text-xs">
        <Medal className="h-3 w-3 text-slate-300" /> Runner-Up (2nd)
      </div>
      <span className="mt-1 text-center text-sm font-bold text-white/90 truncate w-full">{runnerUp}</span>
      <div className="mt-3 flex h-[64px] w-full items-center justify-center rounded-t-2xl border border-b-0 border-emerald-500/10 bg-gradient-to-t from-emerald-500/[0.02] to-emerald-500/[0.08] sm:h-20 shadow-lg">
        <span className="text-4xl font-black text-emerald-500/10 sm:text-5xl">2</span>
      </div>
    </div>

    {/* 1st Place - Champion */}
    <div className="flex w-[120px] flex-col items-center sm:w-[170px] lg:w-[210px]">
      <div className="relative">
        <div className="absolute -inset-4 animate-pulse rounded-full bg-amber-400/10 blur-2xl" />
        <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-amber-400/20 to-emerald-500/20 blur-sm" />
        <div className="relative flex h-[76px] w-[76px] items-center justify-center rounded-full bg-white border-2 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.4)] p-1 shrink-0">
          {logoMap && championId && logoMap[championId] ? (
            <img src={logoMap[championId]} alt="" className="w-14 h-14 object-contain" />
          ) : (
            <span className="font-black text-amber-600 text-2xl">{champion.slice(0, 2).toUpperCase()}</span>
          )}
        </div>
      </div>
      <div className="mt-2 text-amber-400">
        <Trophy className="h-6 w-6 animate-bounce" />
      </div>
      <div className="mt-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.2em] text-amber-300 sm:text-xs sm:tracking-[0.25em]">
        <Trophy className="h-3.5 w-3.5" /> Champion (1st)
      </div>
      <span className="mt-1 text-center text-base font-black text-white truncate w-full">{champion}</span>
      <div className="mt-3 flex h-[96px] w-full items-center justify-center rounded-t-2xl border border-b-0 border-amber-500/20 bg-gradient-to-t from-amber-500/[0.04] to-amber-500/[0.15] sm:h-28 shadow-xl">
        <span className="text-5xl font-black text-amber-500/10 sm:text-6xl">1</span>
      </div>
    </div>

    {/* 3rd Place */}
    <div className="flex w-[100px] flex-col items-center sm:w-[150px] lg:w-[180px]">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white border-2 border-emerald-500/20 shadow-[0_4px_14px_rgba(0,0,0,0.3)] p-1 shrink-0">
        {logoMap && thirdPlaceId && logoMap[thirdPlaceId] ? (
          <img src={logoMap[thirdPlaceId]} alt="" className="w-8 h-8 object-contain" />
        ) : (
          <span className="font-black text-emerald-800 text-base">{thirdPlace.slice(0, 2).toUpperCase()}</span>
        )}
      </div>
      <div className="mt-2 flex items-center gap-1 text-[10px] uppercase tracking-widest text-emerald-300/50 sm:text-xs">
        <Award className="h-3 w-3 text-amber-600" /> Third Place (3rd)
      </div>
      <span className="mt-1 text-center text-sm font-bold text-white/90 truncate w-full">{thirdPlace}</span>
      <div className="mt-3 flex h-[48px] w-full items-center justify-center rounded-t-2xl border border-b-0 border-emerald-500/10 bg-gradient-to-t from-emerald-500/[0.01] to-emerald-500/[0.06] sm:h-14 shadow-md">
        <span className="text-3xl font-black text-emerald-500/5 sm:text-4xl">3</span>
      </div>
    </div>
  </div>
);

const ZoneList = ({
  title,
  teams,
  accent,
  icon: Icon,
  logoMap,
}: {
  title: string;
  teams: LeagueStanding[];
  accent: 'blue' | 'orange' | 'red' | 'green';
  icon: React.ComponentType<any>;
  logoMap?: Record<string, string>;
}) => {
  const accentColorMap = {
    blue: {
      text: 'text-sky-400',
      border: 'border-sky-500/20',
      bg: 'bg-sky-950/15',
      glow: 'shadow-[0_0_15px_rgba(56,189,248,0.1)]',
      indicator: 'bg-sky-500',
    },
    orange: {
      text: 'text-amber-500',
      border: 'border-amber-500/20',
      bg: 'bg-amber-950/15',
      glow: 'shadow-[0_0_15px_rgba(245,158,11,0.1)]',
      indicator: 'bg-amber-500',
    },
    green: {
      text: 'text-emerald-400',
      border: 'border-emerald-500/20',
      bg: 'bg-emerald-950/15',
      glow: 'shadow-[0_0_15px_rgba(16,185,129,0.1)]',
      indicator: 'bg-emerald-500',
    },
    red: {
      text: 'text-rose-500',
      border: 'border-rose-500/20',
      bg: 'bg-rose-950/15',
      glow: 'shadow-[0_0_15px_rgba(244,63,94,0.1)]',
      indicator: 'bg-rose-500',
    },
  };

  const style = accentColorMap[accent];

  return (
    <div className={`rounded-2xl border ${style.border} ${style.bg} ${style.glow} p-5 backdrop-blur-md flex flex-col justify-between`}>
      <div>
        <div className="flex items-center gap-2 mb-4 border-b border-[#1e1e2e] pb-2">
          <Icon className={`h-5 w-5 ${style.text}`} />
          <h3 className={`text-xs font-black uppercase tracking-widest ${style.text}`}>{title}</h3>
        </div>
        <div className="space-y-3">
          {teams.map((team) => (
            <div
              key={team.teamId}
              className="flex items-center justify-between gap-3 border-b border-[#1e1e2e]/50 pb-2 last:border-0 last:pb-0"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-black text-white ${style.indicator}`}>
                  {team.position}
                </span>
                {logoMap && logoMap[team.teamId] ? (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-white p-0.5 border border-slate-200">
                    <img src={logoMap[team.teamId]} alt="" className="h-full w-full object-contain" />
                  </div>
                ) : null}
                <span className="font-bold text-white truncate text-sm">{team.teamName}</span>
              </div>
              <div className="flex items-center text-xs font-bold text-white shrink-0">
                <span>{team.points} pts</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default function LeagueRecap({ standings, fixtures, logoMap, leagueLogo, mots, teamsById }: LeagueRecapProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'awards' | 'streaks' | 'highlights' | 'stats'>('overview');

  const completedMatches = fixtures.filter((f) => f.status === 'completed');
  const isComplete = completedMatches.length === fixtures.length;

  if (!isComplete || standings.length < 3) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-[#1e1e2e] bg-[#0c0c16]/50 p-6 sm:p-8 backdrop-blur-md">
        <div className="flex items-center gap-3 text-white/40">
          {leagueLogo ? (
            <div className="bg-white/10 p-1.5 rounded-lg flex items-center justify-center h-8 w-8 shrink-0">
              <img src={leagueLogo} alt="" className="h-full w-auto object-contain brightness-0 invert" />
            </div>
          ) : (
            <Trophy className="h-8 w-8" />
          )}
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-slate-500">Season Recap</p>
            <h3 className="mt-1 text-lg font-bold text-white/50">
              Complete all {fixtures.length} matches to view the league recap
            </h3>
          </div>
        </div>
      </div>
    );
  }

  // Team name lookup map from standings
  const teamNameMap = standings.reduce((acc, curr) => {
    acc[curr.teamId] = curr.teamName;
    return acc;
  }, {} as Record<string, string>);

  // 1. Podium teams
  const champion = standings[0];
  const runnerUp = standings[1];
  const thirdPlace = standings[2];

  // 2. Goal Stats
  const totalGoals = completedMatches.reduce((sum, f) => sum + f.homeScore! + f.awayScore!, 0);
  const goalsPerMatch = (totalGoals / completedMatches.length).toFixed(2);

  // 3. Attack & Defence Stats
  let bestAttack = standings[0];
  let worstDefence = standings[0];
  let bestDefence = standings[0];

  for (const s of standings) {
    if (s.goalsFor > bestAttack.goalsFor) bestAttack = s;
    if (s.goalsAgainst > worstDefence.goalsAgainst) worstDefence = s;
    if (s.goalsAgainst < bestDefence.goalsAgainst) bestDefence = s;
  }

  // 4. Home & Away Records
  const homeRecords: Record<string, { wins: number; draws: number; losses: number; goalsFor: number; goalsAgainst: number; points: number }> = {};
  const awayRecords: Record<string, { wins: number; draws: number; losses: number; goalsFor: number; goalsAgainst: number; points: number }> = {};

  standings.forEach((s) => {
    homeRecords[s.teamId] = { wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, points: 0 };
    awayRecords[s.teamId] = { wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, points: 0 };
  });

  completedMatches.forEach((match) => {
    const homeId = match.homeTeamId;
    const awayId = match.awayTeamId;
    const hScore = match.homeScore!;
    const aScore = match.awayScore!;

    const home = homeRecords[homeId];
    if (home) {
      home.goalsFor += hScore;
      home.goalsAgainst += aScore;
      if (hScore > aScore) {
        home.wins += 1;
        home.points += 3;
      } else if (hScore === aScore) {
        home.draws += 1;
        home.points += 1;
      } else {
        home.losses += 1;
      }
    }

    const away = awayRecords[awayId];
    if (away) {
      away.goalsFor += aScore;
      away.goalsAgainst += hScore;
      if (aScore > hScore) {
        away.wins += 1;
        away.points += 3;
      } else if (hScore === aScore) {
        away.draws += 1;
        away.points += 1;
      } else {
        away.losses += 1;
      }
    }
  });

  const getBestRecord = (records: typeof homeRecords) => {
    return Object.entries(records).map(([teamId, stats]) => {
      const standing = standings.find((s) => s.teamId === teamId)!;
      return {
        teamId,
        teamName: standing?.teamName || 'Unknown',
        ...stats,
      };
    }).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      const gdB = b.goalsFor - b.goalsAgainst;
      const gdA = a.goalsFor - a.goalsAgainst;
      if (gdB !== gdA) return gdB - gdA;
      return b.goalsFor - a.goalsFor;
    })[0];
  };

  const bestHome = getBestRecord(homeRecords);
  const bestAway = getBestRecord(awayRecords);

  // 5. Streaks and Milestones
  const teamResults: Record<string, Array<{ matchweek: number; result: 'W' | 'D' | 'L' }>> = {};
  const cleanSheets: Record<string, number> = {};
  const goalMachines: Record<string, number> = {};

  standings.forEach((s) => {
    teamResults[s.teamId] = [];
    cleanSheets[s.teamId] = 0;
    goalMachines[s.teamId] = 0;
  });

  completedMatches.forEach((match) => {
    const homeId = match.homeTeamId;
    const awayId = match.awayTeamId;
    const hScore = match.homeScore!;
    const aScore = match.awayScore!;

    if (hScore > aScore) {
      teamResults[homeId]?.push({ matchweek: match.matchweek, result: 'W' });
      teamResults[awayId]?.push({ matchweek: match.matchweek, result: 'L' });
    } else if (hScore === aScore) {
      teamResults[homeId]?.push({ matchweek: match.matchweek, result: 'D' });
      teamResults[awayId]?.push({ matchweek: match.matchweek, result: 'D' });
    } else {
      teamResults[homeId]?.push({ matchweek: match.matchweek, result: 'L' });
      teamResults[awayId]?.push({ matchweek: match.matchweek, result: 'W' });
    }

    if (hScore === 0) cleanSheets[awayId] = (cleanSheets[awayId] || 0) + 1;
    if (aScore === 0) cleanSheets[homeId] = (cleanSheets[homeId] || 0) + 1;

    if (hScore >= 3) goalMachines[homeId] = (goalMachines[homeId] || 0) + 1;
    if (aScore >= 3) goalMachines[awayId] = (goalMachines[awayId] || 0) + 1;
  });

  let longestWinStreak = { teamId: '', teamName: '', streakLength: 0 };
  let longestUnbeatenStreak = { teamId: '', teamName: '', streakLength: 0 };

  Object.entries(teamResults).forEach(([teamId, results]) => {
    results.sort((a, b) => a.matchweek - b.matchweek);

    let currentWin = 0;
    let maxWin = 0;
    let currentUnbeaten = 0;
    let maxUnbeaten = 0;

    results.forEach((r) => {
      if (r.result === 'W') {
        currentWin += 1;
        currentUnbeaten += 1;
      } else if (r.result === 'D') {
        currentWin = 0;
        currentUnbeaten += 1;
      } else {
        currentWin = 0;
        currentUnbeaten = 0;
      }

      if (currentWin > maxWin) maxWin = currentWin;
      if (currentUnbeaten > maxUnbeaten) maxUnbeaten = currentUnbeaten;
    });

    const teamName = teamNameMap[teamId] || 'Unknown';

    if (maxWin > longestWinStreak.streakLength) {
      longestWinStreak = { teamId, teamName, streakLength: maxWin };
    }
    if (maxUnbeaten > longestUnbeatenStreak.streakLength) {
      longestUnbeatenStreak = { teamId, teamName, streakLength: maxUnbeaten };
    }
  });

  let cleanSheetKing = { teamId: '', teamName: '', count: -1 };
  let goalMachineTeam = { teamId: '', teamName: '', count: -1 };

  Object.entries(cleanSheets).forEach(([teamId, count]) => {
    if (count > cleanSheetKing.count) {
      cleanSheetKing = { teamId, teamName: teamNameMap[teamId] || 'Unknown', count };
    }
  });

  Object.entries(goalMachines).forEach(([teamId, count]) => {
    if (count > goalMachineTeam.count) {
      goalMachineTeam = { teamId, teamName: teamNameMap[teamId] || 'Unknown', count };
    }
  });

  // 6. Highlight Matches
  let highestScoringMatch: LeagueMatch | null = null;
  let maxMatchGoals = -1;

  let biggestWinMatch: LeagueMatch | null = null;
  let maxMargin = -1;
  let maxMarginGoals = -1;

  for (const match of completedMatches) {
    const goals = match.homeScore! + match.awayScore!;
    if (goals > maxMatchGoals) {
      maxMatchGoals = goals;
      highestScoringMatch = match;
    }

    const margin = Math.abs(match.homeScore! - match.awayScore!);
    if (margin > maxMargin) {
      maxMargin = margin;
      maxMarginGoals = goals;
      biggestWinMatch = match;
    } else if (margin === maxMargin && goals > maxMarginGoals) {
      maxMarginGoals = goals;
      biggestWinMatch = match;
    }
  }

  // Biggest Upset: low-rated team beats high-rated team with biggest rating difference
  let biggestUpset: { match: LeagueMatch; ratingDiff: number } | null = null;
  if (teamsById) {
    for (const match of completedMatches) {
      if (match.homeScore === null || match.awayScore === null) continue;
      if (match.homeScore === match.awayScore) continue; // skip draws
      const homeRating = teamsById[match.homeTeamId]?.rating ?? 0;
      const awayRating = teamsById[match.awayTeamId]?.rating ?? 0;
      const winnerIsHome = match.homeScore > match.awayScore;
      const winnerRating = winnerIsHome ? homeRating : awayRating;
      const loserRating = winnerIsHome ? awayRating : homeRating;
      if (winnerRating < loserRating) {
        const diff = loserRating - winnerRating;
        if (!biggestUpset || diff > biggestUpset.ratingDiff) {
          biggestUpset = { match, ratingDiff: diff };
        }
      }
    }
  }

  // Late Drama Kings: team with most 90+ minute goals
  const lateDramaMap: Record<string, number> = {};
  for (const match of completedMatches) {
    if (!match.timeline) continue;
    for (const event of match.timeline) {
      // Check for 90+ goals: displayMinute contains '90+' or sortMinute >= 90
      const is90Plus = event.displayMinute.startsWith('90+') || event.sortMinute >= 90;
      if (is90Plus) {
        lateDramaMap[event.teamId] = (lateDramaMap[event.teamId] || 0) + 1;
      }
    }
  }
  let lateDramaKing: { teamId: string; teamName: string; count: number } | null = null;
  for (const [teamId, count] of Object.entries(lateDramaMap)) {
    if (!lateDramaKing || count > lateDramaKing.count) {
      lateDramaKing = { teamId, teamName: teamNameMap[teamId] || 'Unknown', count };
    }
  }

  // 7. Top goalscorers (Golden Boot)
  const topScorers = (() => {
    const scorerMap: Record<string, { playerName: string; teamId: string; teamName: string; goals: number }> = {};

    fixtures.forEach((match) => {
      if (match.status === 'completed' && match.timeline) {
        match.timeline.forEach((event) => {
          const { playerId, playerName, teamId } = event;
          const teamName = teamNameMap[teamId] || 'Unknown';

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
  })();

  // Partition zones
  const uclTeams = standings.slice(0, 4);
  const uelTeams = standings.slice(4, 6);
  const ueclTeams = standings.slice(6, 7);
  const relegationTeams = standings.slice(17, 20);

  return (
    <div className="space-y-6">
      {/* Ambient header */}
      <div className="relative overflow-hidden rounded-3xl border border-[#1e1e2e] bg-[#111118]/80 p-6 sm:p-8 shadow-[0_8px_32px_rgba(0,0,0,0.37)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.06),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(245,158,11,0.02),transparent_45%)] pointer-events-none" />
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              {leagueLogo ? (
                <div className="bg-white p-1 rounded-xl flex items-center justify-center h-10 w-10 border border-[#1e1e2e] shrink-0">
                  <img
                    src={leagueLogo}
                    alt="League Logo"
                    className="h-8 w-auto object-contain"
                  />
                </div>
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/12 border border-amber-400/20 text-amber-400">
                  <Trophy className="h-5 w-5" />
                </div>
              )}
              <div>
                <p className="text-[10px] uppercase tracking-[0.25em] text-slate-400">Season Summary</p>
                <h2 className="text-2xl font-black text-white sm:text-3xl">League Recap</h2>
              </div>
            </div>

            {/* Quick Stats Banner */}
            <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl px-4 py-2 text-xs font-semibold backdrop-blur-md">
              <div className="text-white/60">
                Goals: <span className="font-black text-white text-sm">{totalGoals}</span>
              </div>
              <div className="h-4 w-px bg-white/20" />
              <div className="text-white/60">
                Avg Goals/Match: <span className="font-black text-white text-sm">{goalsPerMatch}</span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex flex-wrap items-center justify-start gap-2 border-b border-[#1e1e2e] pb-4 mb-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-black uppercase tracking-wider transition-all ${
                activeTab === 'overview'
                  ? 'bg-[#e11d8f]/8 text-slate-100 border border-[#e11d8f]/30 shadow-inner'
                  : 'text-white/50 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <Trophy className="h-4 w-4" /> Overview & Standings
            </button>
            <button
              onClick={() => setActiveTab('awards')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-black uppercase tracking-wider transition-all ${
                activeTab === 'awards'
                  ? 'bg-[#e11d8f]/8 text-slate-100 border border-[#e11d8f]/30 shadow-inner'
                  : 'text-white/50 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <Award className="h-4 w-4" /> Team Awards
            </button>
            <button
              onClick={() => setActiveTab('streaks')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-black uppercase tracking-wider transition-all ${
                activeTab === 'streaks'
                  ? 'bg-[#e11d8f]/8 text-slate-100 border border-[#e11d8f]/30 shadow-inner'
                  : 'text-white/50 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <TrendingUp className="h-4 w-4" /> Streaks & Records
            </button>
            <button
              onClick={() => setActiveTab('highlights')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-black uppercase tracking-wider transition-all ${
                activeTab === 'highlights'
                  ? 'bg-[#e11d8f]/8 text-slate-100 border border-[#e11d8f]/30 shadow-inner'
                  : 'text-white/50 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <Target className="h-4 w-4" /> Golden Boots
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-black uppercase tracking-wider transition-all ${
                activeTab === 'stats'
                  ? 'bg-[#e11d8f]/8 text-slate-100 border border-[#e11d8f]/30 shadow-inner'
                  : 'text-white/50 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <BarChart3 className="h-4 w-4" /> Season Stats
            </button>
          </div>

          {/* Tab 1: Overview & Podium */}
          {activeTab === 'overview' && (
            <div className="space-y-8 animate-fadeIn">
              <div className="flex flex-col lg:flex-row gap-6 items-center justify-center">
                <div className="flex-1 w-full">
                  <Podium
                    champion={champion.teamName}
                    championId={champion.teamId}
                    runnerUp={runnerUp.teamName}
                    runnerUpId={runnerUp.teamId}
                    thirdPlace={thirdPlace.teamName}
                    thirdPlaceId={thirdPlace.teamId}
                    logoMap={logoMap}
                  />
                </div>
              </div>

              {/* Zones Layout */}
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <ZoneList
                  title="Champions League (Top 4)"
                  teams={uclTeams}
                  accent="blue"
                  icon={Shield}
                  logoMap={logoMap}
                />
                <ZoneList
                  title="Europa League (5th & 6th)"
                  teams={uelTeams}
                  accent="orange"
                  icon={Trophy}
                  logoMap={logoMap}
                />
                <ZoneList
                  title="Conference League (7th)"
                  teams={ueclTeams}
                  accent="green"
                  icon={Medal}
                  logoMap={logoMap}
                />
                <ZoneList
                  title="Relegated Teams"
                  teams={relegationTeams}
                  accent="red"
                  icon={Skull}
                  logoMap={logoMap}
                />
              </div>
            </div>
          )}

          {/* Tab 2: Team Awards */}
          {activeTab === 'awards' && (
            <div className="space-y-6 animate-fadeIn">
              {mots && (
                <div className="rounded-2xl border border-amber-400/20 bg-amber-950/10 p-5 transition-all duration-300 hover:scale-[1.02] backdrop-blur-md sm:col-span-2 lg:col-span-3">
                  <div className="text-xs font-bold uppercase tracking-[0.22em] text-amber-400/80">
                    Player of the Season
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-950/40 border border-amber-400/30">
                        <Star className="h-4 w-4 text-amber-300" />
                      </div>
                      <div className="truncate text-xl font-black text-white">{mots.playerName}</div>
                    </div>
                    <div className="shrink-0 flex items-center gap-3">
                      <div className="flex items-center gap-1.5 text-sm text-white/60 font-semibold">
                        {logoMap && mots.teamId && logoMap[mots.teamId] && (
                          <img src={logoMap[mots.teamId]} alt="" className="h-5 w-5 object-contain bg-white rounded p-0.5 shrink-0" />
                        )}
                        <span className="truncate">{mots.teamName}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-black text-amber-300">
                          <span>{(mots as any).points ?? (mots.motmCount * 3)} pts</span>
                        </div>
                        <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold text-white/60">
                          <span>{mots.motmCount} MOTM</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <StatCard
                  label="Best Attack"
                  value={bestAttack.teamName}
                  sub={`Scored ${bestAttack.goalsFor} goals`}
                  accent="amber"
                  teamInitials={bestAttack.teamName.slice(0, 2).toUpperCase()}
                  teamId={bestAttack.teamId}
                  logoMap={logoMap}
                />
                <StatCard
                  label="Best Defense"
                  value={bestDefence.teamName}
                  sub={`Conceded only ${bestDefence.goalsAgainst} goals`}
                  accent="emerald"
                  teamInitials={bestDefence.teamName.slice(0, 2).toUpperCase()}
                  teamId={bestDefence.teamId}
                  logoMap={logoMap}
                />
                <StatCard
                  label="Worst Defense"
                  value={worstDefence.teamName}
                  sub={`Conceded ${worstDefence.goalsAgainst} goals`}
                  accent="rose"
                  teamInitials={worstDefence.teamName.slice(0, 2).toUpperCase()}
                  teamId={worstDefence.teamId}
                  logoMap={logoMap}
                />
                <StatCard
                  label="Home Fortress"
                  value={bestHome.teamName}
                  sub={`Best home record: ${bestHome.points} Pts (${bestHome.wins}W - ${bestHome.draws}D - ${bestHome.losses}L)`}
                  accent="sky"
                  teamInitials={bestHome.teamName.slice(0, 2).toUpperCase()}
                  teamId={bestHome.teamId}
                  logoMap={logoMap}
                />
                <StatCard
                  label="Road Warriors"
                  value={bestAway.teamName}
                  sub={`Best away record: ${bestAway.points} Pts (${bestAway.wins}W - ${bestAway.draws}D - ${bestAway.losses}L)`}
                  accent="violet"
                  teamInitials={bestAway.teamName.slice(0, 2).toUpperCase()}
                  teamId={bestAway.teamId}
                  logoMap={logoMap}
                />
                <StatCard
                  label="Champion's Record"
                  value={`${champion.wins} W - ${champion.draws} D - ${champion.losses} L`}
                  sub={`Total of ${champion.points} points with GD ${champion.goalDifference > 0 ? '+' : ''}${champion.goalDifference}`}
                  accent="amber"
                  teamInitials={champion.teamName.slice(0, 2).toUpperCase()}
                  teamId={champion.teamId}
                  logoMap={logoMap}
                />
              </div>
            </div>
          )}

          {/* Tab 3: Streaks & Records */}
          {activeTab === 'streaks' && (
            <div className="grid gap-4 sm:grid-cols-2 animate-fadeIn">
              <StatCard
                label="Longest Winning Streak"
                value={longestWinStreak.teamName}
                sub={`${longestWinStreak.streakLength} consecutive wins in the league`}
                accent="emerald"
                teamInitials={longestWinStreak.teamName.slice(0, 2).toUpperCase()}
                teamId={longestWinStreak.teamId}
                logoMap={logoMap}
              />
              <StatCard
                label="Longest Unbeaten Streak"
                value={longestUnbeatenStreak.teamName}
                sub={`${longestUnbeatenStreak.streakLength} games unbeaten streak`}
                accent="sky"
                teamInitials={longestUnbeatenStreak.teamName.slice(0, 2).toUpperCase()}
                teamId={longestUnbeatenStreak.teamId}
                logoMap={logoMap}
              />
              <StatCard
                label="Clean Sheet King"
                value={cleanSheetKing.teamName}
                sub={`${cleanSheetKing.count} clean sheets throughout the season`}
                accent="violet"
                teamInitials={cleanSheetKing.teamName.slice(0, 2).toUpperCase()}
                teamId={cleanSheetKing.teamId}
                logoMap={logoMap}
              />
              <StatCard
                label="Goal Machine"
                value={goalMachineTeam.teamName}
                sub={`${goalMachineTeam.count} matches scoring 3+ goals`}
                accent="amber"
                teamInitials={goalMachineTeam.teamName.slice(0, 2).toUpperCase()}
                teamId={goalMachineTeam.teamId}
                logoMap={logoMap}
              />
            </div>
          )}

          {/* Tab 4: Top Scorers (Golden Boots) */}
          {activeTab === 'highlights' && (
            <div className="space-y-8 animate-fadeIn">
              {/* Hero: Golden Boot #1 */}
              {topScorers[0] && (
                <div className="relative overflow-hidden rounded-3xl border border-amber-400/30 bg-gradient-to-br from-amber-500/15 via-[#111118] to-amber-900/10 p-8 shadow-[0_0_60px_rgba(245,158,11,0.08)]">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.08),transparent_50%)] pointer-events-none" />
                  <div className="relative z-10 flex flex-col items-center text-center">
                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.3em] text-amber-400/80 mb-4">
                      <Trophy className="h-5 w-5 animate-bounce" />
                      <span>Golden Boot Winner</span>
                      <Trophy className="h-5 w-5 animate-bounce" />
                    </div>
                    <div className="relative mb-4">
                      <div className="absolute -inset-4 animate-pulse rounded-full bg-amber-400/10 blur-2xl" />
                      {logoMap && logoMap[topScorers[0].teamId] ? (
                        <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-white border-2 border-amber-400 shadow-[0_0_24px_rgba(245,158,11,0.4)] p-2">
                          <img src={logoMap[topScorers[0].teamId]} alt="" className="h-full w-full object-contain" />
                        </div>
                      ) : null}
                    </div>
                    <h3 className="text-3xl sm:text-4xl font-black text-white mb-1">{topScorers[0].playerName}</h3>
                    <p className="text-sm text-white/50 font-bold">{topScorers[0].teamName}</p>
                    <div className="mt-4 flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/15 px-6 py-3 text-2xl font-black text-amber-300 shadow-lg">
                      <Target className="h-6 w-6" />
                      <span>{topScorers[0].goals} Goals</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Podium: #2 and #3 */}
              {topScorers.length >= 2 && (
                <div className="grid gap-4 sm:grid-cols-2">
                  {topScorers.slice(1, 3).map((scorer, idx) => (
                    <div
                      key={idx}
                      className="relative overflow-hidden rounded-2xl border border-slate-500/20 bg-gradient-to-br from-slate-500/10 via-[#111118] to-transparent p-6 transition-all duration-300 hover:scale-[1.02] hover:border-slate-400/30"
                    >
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className={`flex h-10 w-10 items-center justify-center rounded-full font-black text-lg ${
                            idx === 0 ? 'bg-slate-300/20 text-slate-300 border border-slate-300/30' : 'bg-amber-700/20 text-amber-600 border border-amber-600/30'
                          }`}>
                            {idx + 2}
                          </div>
                        </div>
                        {logoMap && logoMap[scorer.teamId] ? (
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white p-1 border border-slate-200 shadow-md">
                            <img src={logoMap[scorer.teamId]} alt="" className="h-full w-full object-contain" />
                          </div>
                        ) : null}
                        <div className="flex-1 min-w-0">
                          <p className="font-black text-white text-lg truncate">{scorer.playerName}</p>
                          <p className="text-xs text-white/40 font-semibold">{scorer.teamName}</p>
                        </div>
                        <div className="flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-4 py-2 text-base font-black text-amber-300 shrink-0">
                          <Target className="h-4 w-4" />
                          <span>{scorer.goals}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Rest of Top Scorers Table: #4 to #10 */}
              {topScorers.length > 3 && (
                <div className="rounded-2xl border border-[#1e1e2e]/50 bg-[#0c0c16]/50 overflow-hidden backdrop-blur-md">
                  <div className="flex items-center gap-2 px-5 py-3 border-b border-[#1e1e2e]/30 bg-[#0a0a12]/60">
                    <Award className="h-4 w-4 text-amber-400/70" />
                    <span className="text-xs font-black uppercase tracking-widest text-amber-400/70">Top Scorers</span>
                  </div>
                  <div className="divide-y divide-[#1e1e2e]/30">
                    {topScorers.slice(3, 10).map((scorer, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.03] transition-colors"
                      >
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/5 border border-white/10 text-xs font-black text-slate-400">
                          {idx + 4}
                        </span>
                        {logoMap && logoMap[scorer.teamId] ? (
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white p-0.5 border border-slate-200">
                            <img src={logoMap[scorer.teamId]} alt="" className="h-full w-full object-contain" />
                          </div>
                        ) : null}
                        <div className="flex-1 min-w-0">
                          <span className="font-bold text-white text-sm">{scorer.playerName}</span>
                          <span className="text-xs text-white/40 ml-2">{scorer.teamName}</span>
                        </div>
                        <span className="text-base font-black text-slate-200">{scorer.goals}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab 5: Season Stats */}
          {activeTab === 'stats' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Featured Matches moved here from Boot & Matches */}
              <div className="grid gap-4 sm:grid-cols-2">
                {highestScoringMatch && (
                  <FeaturedMatchCard
                    title="Highest Scoring Match"
                    homeTeam={teamNameMap[highestScoringMatch.homeTeamId] || 'Home Team'}
                    homeTeamId={highestScoringMatch.homeTeamId}
                    awayTeam={teamNameMap[highestScoringMatch.awayTeamId] || 'Away Team'}
                    awayTeamId={highestScoringMatch.awayTeamId}
                    homeScore={highestScoringMatch.homeScore!}
                    awayScore={highestScoringMatch.awayScore!}
                    roundLabel={`Matchweek ${highestScoringMatch.matchweek}`}
                    logoMap={logoMap}
                  />
                )}
                {biggestWinMatch && (
                  <FeaturedMatchCard
                    title="Most Dominant Win"
                    homeTeam={teamNameMap[biggestWinMatch.homeTeamId] || 'Home Team'}
                    homeTeamId={biggestWinMatch.homeTeamId}
                    awayTeam={teamNameMap[biggestWinMatch.awayTeamId] || 'Away Team'}
                    awayTeamId={biggestWinMatch.awayTeamId}
                    homeScore={biggestWinMatch.homeScore!}
                    awayScore={biggestWinMatch.awayScore!}
                    roundLabel={`Matchweek ${biggestWinMatch.matchweek}`}
                    logoMap={logoMap}
                  />
                )}
              </div>

              {/* Biggest Upset */}
              {biggestUpset && (
                <FeaturedMatchCard
                  title="Biggest Upset"
                  homeTeam={teamNameMap[biggestUpset.match.homeTeamId] || 'Home Team'}
                  homeTeamId={biggestUpset.match.homeTeamId}
                  awayTeam={teamNameMap[biggestUpset.match.awayTeamId] || 'Away Team'}
                  awayTeamId={biggestUpset.match.awayTeamId}
                  homeScore={biggestUpset.match.homeScore!}
                  awayScore={biggestUpset.match.awayScore!}
                  roundLabel={`Matchweek ${biggestUpset.match.matchweek} · Rating gap: ${biggestUpset.ratingDiff.toFixed(0)}`}
                  logoMap={logoMap}
                />
              )}

              {/* Stat cards row */}
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Late Drama Kings */}
                {lateDramaKing && (
                  <StatCard
                    label="Late Drama Kings"
                    value={lateDramaKing.teamName}
                    sub={`${lateDramaKing.count} goals scored in 90+ minutes`}
                    accent="rose"
                    teamInitials={lateDramaKing.teamName.slice(0, 2).toUpperCase()}
                    teamId={lateDramaKing.teamId}
                    logoMap={logoMap}
                  />
                )}

                {(() => {
                  let drawsKing = standings[0];
                  for (const s of standings) {
                    if (s.draws > drawsKing.draws) drawsKing = s;
                  }
                  let highestGPM = standings[0];
                  let highestGPMValue = standings[0].played > 0 ? standings[0].goalsFor / standings[0].played : 0;
                  for (const s of standings) {
                    const avg = s.played > 0 ? s.goalsFor / s.played : 0;
                    if (avg > highestGPMValue) {
                      highestGPM = s;
                      highestGPMValue = avg;
                    }
                  }
                  return (
                    <>
                      <StatCard
                        label="Draws King"
                        value={drawsKing.teamName}
                        sub={`${drawsKing.draws} draws throughout the season`}
                        accent="violet"
                        teamInitials={drawsKing.teamName.slice(0, 2).toUpperCase()}
                        teamId={drawsKing.teamId}
                        logoMap={logoMap}
                      />
                      <StatCard
                        label="Highest Goals Per Match"
                        value={highestGPM.teamName}
                        sub={`${highestGPMValue.toFixed(2)} goals scored per match on average`}
                        accent="amber"
                        teamInitials={highestGPM.teamName.slice(0, 2).toUpperCase()}
                        teamId={highestGPM.teamId}
                        logoMap={logoMap}
                      />
                    </>
                  );
                })()}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
