import type {
  GroupMatch,
  KnockoutMatch,
  MatchScorers,
  PenaltyShootout,
  PenaltyShootoutKick,
  PlayerProfile,
  Team,
  TimelineEvent,
  TournamentScenario,
} from '../types/tournament';
import { computeMatchMOTM } from './motm';

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(maximum, Math.max(minimum, value));

const randomInt = (minimum: number, maximum: number) =>
  Math.floor(Math.random() * (maximum - minimum + 1)) + minimum;

const shuffleArray = <T,>(items: T[]) => {
  const next = [...items];

  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(0, index);
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }

  return next;
};

const weightedPick = <T,>(choices: Array<{ value: T; weight: number }>) => {
  const totalWeight = choices.reduce((sum, choice) => sum + choice.weight, 0);
  let threshold = Math.random() * totalWeight;

  for (const choice of choices) {
    threshold -= choice.weight;
    if (threshold <= 0) {
      return choice.value;
    }
  }

  return choices[choices.length - 1].value;
};

/**
 * ═══════════════════════════════════════════════════════════════
 *  SCENARIO ENGINE — Outcome-First approach
 *
 *  Standard: Pure random 100%. Both teams draw
 *  independently from base pool. Rating difference ignored.
 *
 *  Favorites: Roll %: 80% strong team wins | 10% Draw
 *  | 10% Weak team wins. Then generate score matching that outcome.
 *
 *  Underdogs: Roll %: 20% strong team wins | 20% Draw
 *  | 60% Weak team wins. Similarly, generate score matching outcome.
 * ═══════════════════════════════════════════════════════════════
 */

type MatchOutcome = 'strong-wins' | 'draw' | 'weak-wins';

/**
 * Rolls an outcome according to the scenario's probability table.
 */
const rollOutcome = (scenario: TournamentScenario): MatchOutcome => {
  const r = Math.random();

  if (scenario === 'favorites') {
    // 80% strong-wins | 10% draw | 10% weak-wins
    if (r < 0.80) return 'strong-wins';
    if (r < 0.90) return 'draw';
    return 'weak-wins';
  }

  if (scenario === 'underdogs') {
    // 20% strong-wins | 20% draw | 60% weak-wins
    if (r < 0.20) return 'strong-wins';
    if (r < 0.40) return 'draw';
    return 'weak-wins';
  }

  return 'draw'; // placeholder — not used in standard path
};

/**
 * Base pool (0–10 goals) — realistic World Cup distribution.
 * 0 bàn (20%), 1 bàn (30%), 2 bàn (25%), 3 bàn (12%), 4 bàn (5%), 5 bàn (4%), 6 bàn (2%), 7 bàn (1.2%), 8 bàn (0.5%), 9 bàn (0.25%), 10 bàn (0.05%)
 */
const sampleBaseGoals = () =>
  weightedPick<number>([
    { value: 0, weight: 20 },
    { value: 1, weight: 30 },
    { value: 2, weight: 25 },
    { value: 3, weight: 12 },
    { value: 4, weight: 5 },
    { value: 5, weight: 4 },
    { value: 6, weight: 2 },
    { value: 7, weight: 1.2 },
    { value: 8, weight: 0.5 },
    { value: 9, weight: 0.25 },
    { value: 10, weight: 0.05 },
  ]);

/**
 * Generates (winnerGoals, loserGoals) where winnerGoals > loserGoals,
 * both sampled from the base pool. Retries until constraint satisfied.
 */
const sampleWinnerLoserGoals = (): { winnerGoals: number; loserGoals: number } => {
  for (;;) {
    const a = sampleBaseGoals();
    const b = sampleBaseGoals();
    if (a !== b) {
      return { winnerGoals: Math.max(a, b), loserGoals: Math.min(a, b) };
    }
  }
};

/**
 * Samples a draw scoreline (both teams same goals).
 * Draws tend to be low-scoring: 0-0 and 1-1 are most common.
 */
const sampleDrawGoals = (): number =>
  weightedPick<number>([
    { value: 0, weight: 25 },
    { value: 1, weight: 30 },
    { value: 2, weight: 20 },
    { value: 3, weight: 10 },
    { value: 4, weight: 5 },
    { value: 5, weight: 5 },
    { value: 6, weight: 3 },
    { value: 7, weight: 1 },
    { value: 8, weight: 0.5 },
    { value: 9, weight: 0.4 },
    { value: 10, weight: 0.1 },
  ]);

/**
 * ─── Main Scoreline Generator ────────────────────────────────
 *
 * Standard  : Both teams independently sample from the base pool.
 *             Pure randomness — Rating is ignored.
 *
 * Favorites : Roll outcome (80% strong / 10% draw / 10% weak).
 *             Generate a score that matches the rolled outcome.
 *
 * Underdogs : Roll outcome (20% strong / 20% draw / 60% weak).
 *             Same logic, reversed probabilities.
 */
const generateScoreline = (
  homeTeam: Team,
  awayTeam: Team,
  scenario: TournamentScenario = 'standard',
): { homeGoals: number; awayGoals: number } => {

  // ── Standard: purely random, no rating awareness ──────────
  if (scenario === 'standard') {
    return {
      homeGoals: sampleBaseGoals(),
      awayGoals: sampleBaseGoals(),
    };
  }

  // ── Favorites / Underdogs: outcome-first ──────────────────
  const homeIsStronger = homeTeam.rating > awayTeam.rating || (homeTeam.rating === awayTeam.rating && Math.random() < 0.5);
  const outcome = rollOutcome(scenario);

  if (outcome === 'draw') {
    const g = sampleDrawGoals();
    return { homeGoals: g, awayGoals: g };
  }

  const { winnerGoals, loserGoals } = sampleWinnerLoserGoals();
  const strongWins = outcome === 'strong-wins';
  // Map strong/weak win to home/away
  const homeWins = homeIsStronger ? strongWins : !strongWins;

  return {
    homeGoals: homeWins ? winnerGoals : loserGoals,
    awayGoals: homeWins ? loserGoals : winnerGoals,
  };
};


const playerWeight = (player: PlayerProfile) => {
  switch (player.position) {
    case 'FW':
      return 10;
    case 'MF':
      return 6;
    case 'DF':
      return 3;
    case 'GK':
      return 0;
  }
};

type GoalMinuteBucket = {
  start: number;
  end: number;
  weight: number;
};

const GOAL_MINUTE_BUCKETS_REGULATION: GoalMinuteBucket[] = [
  { start: 4, end: 15, weight: 10 },
  { start: 16, end: 30, weight: 16 },
  { start: 31, end: 45, weight: 15 },
  { start: 46, end: 60, weight: 16 },
  { start: 61, end: 75, weight: 18 },
  { start: 76, end: 90, weight: 20 },
] as const;

const GOAL_MINUTE_BUCKETS_EXTRA_TIME: GoalMinuteBucket[] = [
  { start: 91, end: 100, weight: 14 },
  { start: 101, end: 110, weight: 12 },
  { start: 111, end: 120, weight: 10 },
] as const;

/* ═══════════════════ STOPPAGE TIME FORMATTING ═══════════════════ */

/**
 * Determines whether a minute falls in stoppage time and formats accordingly.
 * - Minutes 45 → "45'"
 * - Minutes 46-52 in first half context → "45+1'" to "45+7'"
 * - Minutes 90 → "90'"
 * - Minutes 91-97 in regulation context → "90+1'" to "90+7'"
 * - ET: 105 → "105'", 106-112 → "105+1'" to "105+7'"
 * - ET: 120 → "120'", 121-127 → "120+1'" to "120+7'"
 *
 * We handle this by checking normal vs stoppage ranges.
 */
interface MinuteInfo {
  sortMinute: number;
  displayMinute: string;
}

const STOPPAGE_CHANCE_FIRST_HALF = 0.12;
const STOPPAGE_CHANCE_SECOND_HALF = 0.18;

const formatMinuteForRegulation = (minute: number): MinuteInfo => {
  // First half stoppage time (minute 46-52 → 45+1' to 45+7')
  if (minute >= 46 && minute <= 52 && Math.random() < STOPPAGE_CHANCE_FIRST_HALF) {
    const added = randomInt(1, 5);
    return { sortMinute: 45 + added * 0.1, displayMinute: `45+${added}'` };
  }

  // Second half stoppage time (minute 91-97 → 90+1' to 90+7')
  if (minute >= 86 && minute <= 90 && Math.random() < STOPPAGE_CHANCE_SECOND_HALF) {
    const added = randomInt(1, 7);
    return { sortMinute: 90 + added * 0.1, displayMinute: `90+${added}'` };
  }

  return { sortMinute: minute, displayMinute: `${minute}'` };
};

const formatMinuteForExtraTime = (minute: number): MinuteInfo => {
  // ET first half stoppage (minute ~105 → 105+1' etc.)
  if (minute >= 104 && minute <= 106 && Math.random() < 0.1) {
    const added = randomInt(1, 3);
    return { sortMinute: 105 + added * 0.1, displayMinute: `105+${added}'` };
  }

  // ET second half stoppage (minute ~119-120 → 120+1' etc.)
  if (minute >= 118 && minute <= 120 && Math.random() < 0.15) {
    const added = randomInt(1, 4);
    return { sortMinute: 120 + added * 0.1, displayMinute: `120+${added}'` };
  }

  return { sortMinute: minute, displayMinute: `${minute}'` };
};

/* ═══════════════════ PENALTY (in-play) DETECTION ═══════════════════ */

/**
 * Random chance that a goal is scored via in-play penalty (not shootout).
 * ~12% of goals are penalties in World Cup history.
 */
const isPenaltyGoal = (): boolean => Math.random() < 0.12;

/* ═══════════════════ GOAL MINUTE GENERATION ═══════════════════ */

const generateMatchGoalMinutes = (goalCount: number, buckets: GoalMinuteBucket[]) => {
  if (goalCount === 0) {
    return [];
  }

  const uniqueMinutes = new Set<number>();

  while (uniqueMinutes.size < goalCount) {
    const bucket = weightedPick(
      buckets.map((entry) => ({
        value: entry,
        weight: entry.weight,
      })),
    );

    uniqueMinutes.add(randomInt(bucket.start, bucket.end));
  }

  return Array.from(uniqueMinutes).sort((left, right) => left - right);
};

const allocateGoalMinutes = (
  homeGoals: number,
  awayGoals: number,
  minuteBuckets: GoalMinuteBucket[],
) => {
  const timeline = generateMatchGoalMinutes(homeGoals + awayGoals, minuteBuckets);
  const sides = shuffleArray([
    ...Array.from({ length: homeGoals }, () => 'home' as const),
    ...Array.from({ length: awayGoals }, () => 'away' as const),
  ]);

  const homeMinutes: number[] = [];
  const awayMinutes: number[] = [];

  timeline.forEach((minute, index) => {
    if (sides[index] === 'home') {
      homeMinutes.push(minute);
      return;
    }

    awayMinutes.push(minute);
  });

  return {
    homeMinutes,
    awayMinutes,
    combinedTimeline: timeline.map((minute, index) => ({
      minute,
      side: sides[index],
    })),
  };
};

const generateScorersForTeam = (team: Team, minutes: number[]) => {
  if (!minutes.length) {
    return [];
  }

  // Filter out goalkeepers — GKs cannot score in simulation
  const outfieldPlayers = team.players.filter((p) => p.position !== 'GK');
  const candidates = outfieldPlayers.length > 0 ? outfieldPlayers : team.players;

  return minutes.map((minute) => {
    const player = weightedPick(
      candidates.map((candidate) => ({
        value: candidate,
        weight: playerWeight(candidate),
      })),
    );

    return {
      minute,
      playerId: player.id,
      playerName: player.name,
      teamId: team.id,
    };
  });
};

/* ═══════════════════ TIMELINE BUILDERS ═══════════════════ */

/**
 * Deduplicate displayMinute values in a timeline.
 * If two events share the same displayMinute, shift the later one forward.
 * E.g. two goals at "45+2'" → first stays "45+2'", second becomes "45+3'".
 */
const deduplicateDisplayMinutes = (timeline: TimelineEvent[]): void => {
  const seen = new Map<string, number>();
  for (const event of timeline) {
    const key = event.displayMinute;
    const count = seen.get(key) || 0;
    if (count > 0) {
      // Parse and increment the display minute
      const stoppageMatch = key.match(/^(\d+)\+(\d+)'$/);
      if (stoppageMatch) {
        // Stoppage time format: "45+2'" → "45+3'", "45+4'", etc.
        const base = parseInt(stoppageMatch[1], 10);
        const added = parseInt(stoppageMatch[2], 10);
        event.displayMinute = `${base}+${added + count}'`;
      } else {
        // Normal format: "67'" → "68'", "69'", etc.
        const normalMatch = key.match(/^(\d+)'$/);
        if (normalMatch) {
          const minute = parseInt(normalMatch[1], 10);
          event.displayMinute = `${minute + count}'`;
        }
      }
    }
    seen.set(key, count + 1);
  }
};

export const buildRegulationTimeline = (
  homeTeam: Team,
  awayTeam: Team,
  homeGoals: number,
  awayGoals: number,
): { scorers: MatchScorers; timeline: TimelineEvent[] } => {
  const { homeMinutes, awayMinutes, combinedTimeline } = allocateGoalMinutes(
    homeGoals,
    awayGoals,
    GOAL_MINUTE_BUCKETS_REGULATION,
  );

  const homeScorers = generateScorersForTeam(homeTeam, homeMinutes);
  const awayScorers = generateScorersForTeam(awayTeam, awayMinutes);

  // Build scorers map for quick lookup by minute+side
  const scorerLookup = new Map<string, { playerId: string; playerName: string; teamId: string }>();
  for (const s of homeScorers) {
    scorerLookup.set(`home-${s.minute}`, s);
  }
  for (const s of awayScorers) {
    scorerLookup.set(`away-${s.minute}`, s);
  }

  const timeline: TimelineEvent[] = combinedTimeline.map(({ minute, side }) => {
    const scorer = scorerLookup.get(`${side}-${minute}`)!;
    const minuteInfo = formatMinuteForRegulation(minute);
    const penalty = isPenaltyGoal();

    return {
      sortMinute: minuteInfo.sortMinute,
      displayMinute: minuteInfo.displayMinute,
      playerName: scorer.playerName,
      playerId: scorer.playerId,
      teamId: scorer.teamId,
      side,
      isPenalty: penalty,
      phase: 'regulation' as const,
    };
  });

  timeline.sort((a, b) => a.sortMinute - b.sortMinute);
  deduplicateDisplayMinutes(timeline);

  return {
    scorers: { home: homeScorers, away: awayScorers },
    timeline,
  };
};

const buildKnockoutTimeline = (
  homeTeam: Team,
  awayTeam: Team,
  regulationHomeGoals: number,
  regulationAwayGoals: number,
  extraTimeHomeGoals: number,
  extraTimeAwayGoals: number,
): { scorers: MatchScorers; timeline: TimelineEvent[] } => {
  // Regulation portion
  const regAlloc = allocateGoalMinutes(
    regulationHomeGoals,
    regulationAwayGoals,
    GOAL_MINUTE_BUCKETS_REGULATION,
  );

  const regHomeScorers = generateScorersForTeam(homeTeam, regAlloc.homeMinutes);
  const regAwayScorers = generateScorersForTeam(awayTeam, regAlloc.awayMinutes);

  // Extra time portion
  const etAlloc = allocateGoalMinutes(
    extraTimeHomeGoals,
    extraTimeAwayGoals,
    GOAL_MINUTE_BUCKETS_EXTRA_TIME,
  );

  const etHomeScorers = generateScorersForTeam(homeTeam, etAlloc.homeMinutes);
  const etAwayScorers = generateScorersForTeam(awayTeam, etAlloc.awayMinutes);

  // Merge scorers
  const homeScorers = [...regHomeScorers, ...etHomeScorers].sort((a, b) => a.minute - b.minute);
  const awayScorers = [...regAwayScorers, ...etAwayScorers].sort((a, b) => a.minute - b.minute);

  // Build regulation timeline events
  const regLookup = new Map<string, { playerId: string; playerName: string; teamId: string }>();
  for (const s of regHomeScorers) regLookup.set(`home-${s.minute}`, s);
  for (const s of regAwayScorers) regLookup.set(`away-${s.minute}`, s);

  const regTimeline: TimelineEvent[] = regAlloc.combinedTimeline.map(({ minute, side }) => {
    const scorer = regLookup.get(`${side}-${minute}`)!;
    const minuteInfo = formatMinuteForRegulation(minute);
    return {
      sortMinute: minuteInfo.sortMinute,
      displayMinute: minuteInfo.displayMinute,
      playerName: scorer.playerName,
      playerId: scorer.playerId,
      teamId: scorer.teamId,
      side,
      isPenalty: isPenaltyGoal(),
      phase: 'regulation' as const,
    };
  });

  // Build extra time timeline events
  const etLookup = new Map<string, { playerId: string; playerName: string; teamId: string }>();
  for (const s of etHomeScorers) etLookup.set(`home-${s.minute}`, s);
  for (const s of etAwayScorers) etLookup.set(`away-${s.minute}`, s);

  const etTimeline: TimelineEvent[] = etAlloc.combinedTimeline.map(({ minute, side }) => {
    const scorer = etLookup.get(`${side}-${minute}`)!;
    const minuteInfo = formatMinuteForExtraTime(minute);
    return {
      sortMinute: minuteInfo.sortMinute,
      displayMinute: minuteInfo.displayMinute,
      playerName: scorer.playerName,
      playerId: scorer.playerId,
      teamId: scorer.teamId,
      side,
      isPenalty: isPenaltyGoal(),
      phase: 'extra-time' as const,
    };
  });

  const allTimeline = [...regTimeline, ...etTimeline].sort((a, b) => a.sortMinute - b.sortMinute);
  deduplicateDisplayMinutes(allTimeline);

  return {
    scorers: { home: homeScorers, away: awayScorers },
    timeline: allTimeline,
  };
};

/* ═══════════════════ PUBLIC SIMULATORS ═══════════════════ */

export const simulateGroupMatch = (
  match: GroupMatch,
  homeTeam: Team,
  awayTeam: Team,
  scenario: TournamentScenario = 'standard',
): GroupMatch => {
  const { homeGoals, awayGoals } = generateScoreline(homeTeam, awayTeam, scenario);
  const { scorers, timeline } = buildRegulationTimeline(homeTeam, awayTeam, homeGoals, awayGoals);

  const completedMatch: GroupMatch = {
    ...match,
    homeScore: homeGoals,
    awayScore: awayGoals,
    scorers,
    timeline,
    status: 'completed',
    predictedAt: new Date().toISOString(),
    motm: null,
  };

  return {
    ...completedMatch,
    motm: computeMatchMOTM(completedMatch),
  };
};

export const simulateKnockoutRegulation = (
  match: KnockoutMatch,
  homeTeam: Team,
  awayTeam: Team,
  scenario: TournamentScenario = 'standard',
): KnockoutMatch => {
  const regulation = generateScoreline(homeTeam, awayTeam, scenario);
  let extraTimeHomeGoals = 0;
  let extraTimeAwayGoals = 0;
  let extraTimeHomeScore: number | null = null;
  let extraTimeAwayScore: number | null = null;

  if (regulation.homeGoals === regulation.awayGoals) {
    const extraTime = generateExtraTimeScoreline(homeTeam, awayTeam);
    extraTimeHomeGoals = extraTime.homeGoals;
    extraTimeAwayGoals = extraTime.awayGoals;
    extraTimeHomeScore = regulation.homeGoals + extraTimeHomeGoals;
    extraTimeAwayScore = regulation.awayGoals + extraTimeAwayGoals;
  }

  const finalHomeScore =
    extraTimeHomeScore !== null ? extraTimeHomeScore : regulation.homeGoals;
  const finalAwayScore =
    extraTimeAwayScore !== null ? extraTimeAwayScore : regulation.awayGoals;

  const { scorers, timeline } = buildKnockoutTimeline(
    homeTeam,
    awayTeam,
    regulation.homeGoals,
    regulation.awayGoals,
    extraTimeHomeGoals,
    extraTimeAwayGoals,
  );

  const isDrawAfter120 = finalHomeScore === finalAwayScore;
  const winnerTeamId = isDrawAfter120 ? null : finalHomeScore > finalAwayScore ? homeTeam.id : awayTeam.id;
  const loserTeamId = isDrawAfter120 ? null : finalHomeScore > finalAwayScore ? awayTeam.id : homeTeam.id;

  const nextMatch: KnockoutMatch = {
    ...match,
    regulationHomeScore: regulation.homeGoals,
    regulationAwayScore: regulation.awayGoals,
    extraTimeHomeScore,
    extraTimeAwayScore,
    homeScore: finalHomeScore,
    awayScore: finalAwayScore,
    scorers,
    timeline,
    motm: null,
    status: isDrawAfter120 ? 'awaiting-penalties' : 'completed',
    winnerTeamId,
    loserTeamId,
    predictedAt: new Date().toISOString(),
  };

  return {
    ...nextMatch,
    motm: nextMatch.status === 'completed' ? computeMatchMOTM(nextMatch) : null,
  };
};

const sampleExtraTimeBaseGoals = () =>
  weightedPick<number>([
    { value: 0, weight: 66 },
    { value: 1, weight: 27 },
    { value: 2, weight: 7 },
  ]);

const applyExtraTimeBias = (goals: number, ratingDifference: number) => {
  let adjusted = goals;
  const magnitude = Math.abs(ratingDifference);

  if (ratingDifference >= 10 && Math.random() < Math.min(0.32, magnitude / 52)) {
    adjusted += 1;
  }

  if (ratingDifference <= -10 && adjusted > 0 && Math.random() < Math.min(0.28, magnitude / 58)) {
    adjusted -= 1;
  }

  return clamp(adjusted, 0, 2);
};

const generateExtraTimeScoreline = (homeTeam: Team, awayTeam: Team) => ({
  homeGoals: applyExtraTimeBias(sampleExtraTimeBaseGoals(), homeTeam.rating - awayTeam.rating),
  awayGoals: applyExtraTimeBias(sampleExtraTimeBaseGoals(), awayTeam.rating - homeTeam.rating),
});

export interface PenaltyShootoutResult {
  home: number;
  away: number;
  timeline: PenaltyShootoutKick[];
}

/**
 * Penalty Shootout — Flat 72% conversion rate, no rating influence.
 *
 * Every player on both sides has exactly 72% chance to score.
 * Result is entirely random (50/50 per-kick fairness).
 */
export const simulatePenaltyShootout = (homeTeam: Team, awayTeam: Team): PenaltyShootoutResult => {
  // Prefer FW/MF kickers; fall back to full squad if too few
  const homePool = homeTeam.players.filter((p) => p.position === 'FW' || p.position === 'MF').length >= 3
    ? homeTeam.players.filter((p) => p.position === 'FW' || p.position === 'MF')
    : homeTeam.players;
  const awayPool = awayTeam.players.filter((p) => p.position === 'FW' || p.position === 'MF').length >= 3
    ? awayTeam.players.filter((p) => p.position === 'FW' || p.position === 'MF')
    : awayTeam.players;

  /** Fixed 72% conversion rate — no rating bias */
  const CONVERSION_RATE = 0.72;

  const hasDecisiveLead = (home: number, away: number, homeKicks: number, awayKicks: number) => {
    const remainingHome = Math.max(0, 5 - homeKicks);
    const remainingAway = Math.max(0, 5 - awayKicks);
    return home > away + remainingAway || away > home + remainingHome;
  };

  const simulateSingleShootout = (): PenaltyShootoutResult | null => {
    let home = 0;
    let away = 0;
    let homeKicks = 0;
    let awayKicks = 0;
    const homeFirst = Math.random() < 0.5;
    const kicks: PenaltyShootoutKick[] = [];

    const takeKick = (side: 'home' | 'away') => {
      const team = side === 'home' ? homeTeam : awayTeam;
      const pool = side === 'home' ? homePool : awayPool;
      const kickIndex = side === 'home' ? homeKicks : awayKicks;
      const player = pool[kickIndex % pool.length];
      // Flat 72% for everyone — pure luck, no rating
      const scored = Math.random() < CONVERSION_RATE;

      kicks.push({ teamId: team.id, playerName: player.name, scored, side });

      if (side === 'home') {
        homeKicks += 1;
        if (scored) home += 1;
      } else {
        awayKicks += 1;
        if (scored) away += 1;
      }
    };

    // 5-kick regulation
    for (let round = 0; round < 5; round += 1) {
      takeKick(homeFirst ? 'home' : 'away');
      if (hasDecisiveLead(home, away, homeKicks, awayKicks)) {
        return { home, away, timeline: kicks };
      }
      takeKick(homeFirst ? 'away' : 'home');
      if (hasDecisiveLead(home, away, homeKicks, awayKicks)) {
        return { home, away, timeline: kicks };
      }
    }

    if (home !== away) return { home, away, timeline: kicks };

    // Sudden death — up to 15 extra rounds
    for (let sd = 0; sd < 15; sd += 1) {
      takeKick(homeFirst ? 'home' : 'away');
      takeKick(homeFirst ? 'away' : 'home');
      if (home !== away) return { home, away, timeline: kicks };
    }

    return null;
  };

  // Retry loop (very unlikely to need >5 tries at 72% balanced conversion)
  for (let attempt = 0; attempt < 200; attempt += 1) {
    const result = simulateSingleShootout();
    if (result && result.home !== result.away) return result;
  }

  // Pure-random fallback — coin flip winner, common shootout scoreline
  const homeWins = Math.random() < 0.5;
  const fallback = weightedPick([
    { value: { win: 4, lose: 2 }, weight: 20 },
    { value: { win: 4, lose: 3 }, weight: 35 },
    { value: { win: 5, lose: 3 }, weight: 20 },
    { value: { win: 5, lose: 4 }, weight: 25 },
  ]);
  return homeWins
    ? { home: fallback.win, away: fallback.lose, timeline: [] }
    : { home: fallback.lose, away: fallback.win, timeline: [] };
};
