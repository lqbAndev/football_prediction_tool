import type { LeagueMatch, LeagueStanding } from '../types/leagueConfig';
import type { Team } from '../types/tournament';

export type UCLTiebreakKey =
  | 'points'
  | 'goalDifference'
  | 'goalsFor'
  | 'awayGoals'
  | 'wins'
  | 'awayWins'
  | 'opponentPoints'
  | 'opponentGoalDifference'
  | 'opponentGoalsFor'
  | 'disciplinaryPoints'
  | 'clubCoefficientRank'
  | 'shortName';

export interface UCLLeagueStanding extends LeagueStanding {
  shortName: string;
  awayGoals: number;
  awayWins: number;
  opponentPoints: number;
  opponentGoalDifference: number;
  opponentGoalsFor: number;
  disciplinaryPoints: number;
  clubCoefficientRank: number;
  rankingPhase: 'provisional' | 'final';
}

export interface UCLRankCriterion {
  key: UCLTiebreakKey;
  label: string;
  teamValue: string;
  rivalValue: string;
  decisive: boolean;
  applied: boolean;
}

export interface UCLRankExplanation {
  team: UCLLeagueStanding;
  rival: UCLLeagueStanding | null;
  criteria: UCLRankCriterion[];
  summary: string;
}

// Official 2026/27 draw order is a stable, competition-owned fallback for the
// final coefficient criterion. It intentionally does not use simulation rating.
const COEFFICIENT_SEED_ORDER = [
  'man-city', 'bayern', 'real-madrid', 'psg', 'liverpool', 'inter', 'arsenal',
  'barcelona', 'atletico', 'dortmund', 'roma', 'sporting', 'aston-villa',
  'porto', 'man-united', 'club-brugge', 'real-betis', 'psv', 'feyenoord',
  'lille', 'bodo-glimt', 'napoli', 'leipzig', 'villarreal', 'fenerbahce',
  'shakhtar', 'galatasaray', 'slavia-praha', 'slovan-bratislava', 'stuttgart',
  'aek', 'lask', 'como', 'lens', 'viking', 'sabah',
] as const;

const coefficientRank = new Map<string, number>(
  COEFFICIENT_SEED_ORDER.map((teamId, index) => [teamId, index + 1]),
);

const completed = (match: LeagueMatch) =>
  match.status === 'completed' && match.homeScore !== null && match.awayScore !== null;

const calculateForm = (fixtures: LeagueMatch[], teamId: string): Array<'W' | 'D' | 'L'> =>
  fixtures
    .filter((match) => completed(match) && (match.homeTeamId === teamId || match.awayTeamId === teamId))
    .sort((a, b) => a.matchweek - b.matchweek)
    .slice(-5)
    .map((match) => {
      const isHome = match.homeTeamId === teamId;
      const own = isHome ? match.homeScore! : match.awayScore!;
      const other = isHome ? match.awayScore! : match.homeScore!;
      return own > other ? 'W' : own < other ? 'L' : 'D';
    });

const compareNumber = (left: number, right: number, ascending = false) =>
  ascending ? left - right : right - left;

const interimKeys: UCLTiebreakKey[] = [
  'points', 'goalDifference', 'goalsFor', 'awayGoals', 'wins', 'awayWins', 'shortName',
];

// UEFA Champions League Regulations 2026/27, Article 18.01. During MD1–7
// criteria a–f are used; opponent-strength, discipline and coefficient only
// enter once every club has completed all eight league-phase matches.
const finalKeys: UCLTiebreakKey[] = [
  'points', 'goalDifference', 'goalsFor', 'awayGoals', 'wins', 'awayWins',
  'opponentPoints', 'opponentGoalDifference', 'opponentGoalsFor',
  'disciplinaryPoints', 'clubCoefficientRank', 'shortName',
];

const compareByKey = (a: UCLLeagueStanding, b: UCLLeagueStanding, key: UCLTiebreakKey) => {
  if (key === 'shortName') return a.shortName.localeCompare(b.shortName);
  if (key === 'disciplinaryPoints' || key === 'clubCoefficientRank') {
    return compareNumber(a[key], b[key], true);
  }
  return compareNumber(a[key], b[key]);
};

export const calculateUCLStandings = (
  fixtures: LeagueMatch[],
  teams: Team[],
  forceProvisional = false,
): UCLLeagueStanding[] => {
  const rows = new Map<string, UCLLeagueStanding>();
  teams.forEach((team) => rows.set(team.id, {
    teamId: team.id,
    teamName: team.name,
    shortName: team.shortName,
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
    awayGoals: 0,
    awayWins: 0,
    opponentPoints: 0,
    opponentGoalDifference: 0,
    opponentGoalsFor: 0,
    disciplinaryPoints: 0,
    clubCoefficientRank: coefficientRank.get(team.id) ?? 99,
    rankingPhase: 'provisional',
  }));

  const playedFixtures = fixtures.filter(completed);
  playedFixtures.forEach((match) => {
    const home = rows.get(match.homeTeamId);
    const away = rows.get(match.awayTeamId);
    if (!home || !away) return;
    const homeScore = match.homeScore!;
    const awayScore = match.awayScore!;
    home.played += 1;
    away.played += 1;
    home.goalsFor += homeScore;
    home.goalsAgainst += awayScore;
    away.goalsFor += awayScore;
    away.goalsAgainst += homeScore;
    away.awayGoals += awayScore;
    if (homeScore > awayScore) {
      home.wins += 1;
      home.points += 3;
      away.losses += 1;
    } else if (awayScore > homeScore) {
      away.wins += 1;
      away.awayWins += 1;
      away.points += 3;
      home.losses += 1;
    } else {
      home.draws += 1;
      away.draws += 1;
      home.points += 1;
      away.points += 1;
    }
  });

  const isFinal = !forceProvisional && fixtures.length === 144 && playedFixtures.length === fixtures.length;
  rows.forEach((row) => {
    row.goalDifference = row.goalsFor - row.goalsAgainst;
    row.form = calculateForm(playedFixtures, row.teamId);
    row.rankingPhase = isFinal ? 'final' : 'provisional';
  });

  if (isFinal) {
    const opponents = new Map<string, Set<string>>();
    teams.forEach((team) => opponents.set(team.id, new Set()));
    playedFixtures.forEach((match) => {
      opponents.get(match.homeTeamId)?.add(match.awayTeamId);
      opponents.get(match.awayTeamId)?.add(match.homeTeamId);
    });
    rows.forEach((row) => {
      opponents.get(row.teamId)?.forEach((opponentId) => {
        const opponent = rows.get(opponentId);
        if (!opponent) return;
        row.opponentPoints += opponent.points;
        row.opponentGoalDifference += opponent.goalDifference;
        row.opponentGoalsFor += opponent.goalsFor;
      });
    });
  }

  const keys = isFinal ? finalKeys : interimKeys;
  const sorted = [...rows.values()].sort((a, b) => {
    for (const key of keys) {
      const result = compareByKey(a, b, key);
      if (result !== 0) return result;
    }
    return 0;
  });
  sorted.forEach((row, index) => { row.position = index + 1; });
  return sorted;
};

const labels: Record<UCLTiebreakKey, string> = {
  points: 'Points',
  goalDifference: 'Goal difference',
  goalsFor: 'Goals scored',
  awayGoals: 'Away goals',
  wins: 'Wins',
  awayWins: 'Away wins',
  opponentPoints: 'Opponents’ collective points',
  opponentGoalDifference: 'Opponents’ collective goal difference',
  opponentGoalsFor: 'Opponents’ collective goals',
  disciplinaryPoints: 'Lower disciplinary points',
  clubCoefficientRank: 'UEFA coefficient seed',
  shortName: 'Alphabetical short name',
};

const valueFor = (row: UCLLeagueStanding, key: UCLTiebreakKey) => {
  if (key === 'shortName') return row.shortName;
  const value = row[key];
  if ((key === 'goalDifference' || key === 'opponentGoalDifference') && value > 0) return `+${value}`;
  if (key === 'clubCoefficientRank') return `#${value}`;
  return String(value);
};

export const explainUCLRank = (
  teamId: string,
  standings: UCLLeagueStanding[],
): UCLRankExplanation | null => {
  const team = standings.find((row) => row.teamId === teamId);
  if (!team) return null;
  const equalPoints = standings.filter((row) => row.teamId !== teamId && row.points === team.points);
  const rival = equalPoints.sort((a, b) => Math.abs(a.position - team.position) - Math.abs(b.position - team.position))[0] ?? null;
  if (!rival) return {
    team,
    rival: null,
    criteria: [],
    summary: `No tie-break is active: no other club has ${team.points} points.`,
  };

  const keys = team.rankingPhase === 'final' ? finalKeys : interimKeys;
  let decisionFound = false;
  const criteria = keys.map((key) => {
    const difference = compareByKey(team, rival, key);
    const decisive = !decisionFound && difference !== 0;
    const applied = !decisionFound;
    if (decisive) decisionFound = true;
    return {
      key,
      label: labels[key],
      teamValue: valueFor(team, key),
      rivalValue: valueFor(rival, key),
      decisive,
      applied,
    };
  });
  const decisive = criteria.find((criterion) => criterion.decisive);
  return {
    team,
    rival,
    criteria,
    summary: decisive
      ? `${decisive.label} is the first criterion separating the two clubs.`
      : 'The clubs remain level on every active criterion.',
  };
};
