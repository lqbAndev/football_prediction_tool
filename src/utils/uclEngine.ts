import type { Team, MatchScorers, TimelineEvent } from '../types/tournament';
import type { UCLMatchMOTM } from '../types/uclConfig';
import { buildRegulationTimeline } from './random';
import { calculateUCLMatchMOTM } from './uclMotm';
import { attributeUCLGoals } from './uclGoalEvents';

export interface SimulateUCLMatchOptions {
  isNeutralVenue?: boolean;
  deferMotm?: boolean;
  homeXgModifier?: number;
  awayXgModifier?: number;
  durationFactor?: number;
}

export interface UCLExpectedGoals {
  home: number;
  away: number;
  ratingDelta: number;
}

const clampRating = (rating: number) => Math.max(4, Math.min(10, Number(rating.toFixed(1))));

export const buildUCLPlayerRatings = (
  homeTeam: Team,
  awayTeam: Team,
  homeScore: number,
  awayScore: number,
  timeline: TimelineEvent[],
  previous?: { playerRatings?: Record<string, number>; homeScore: number; awayScore: number; timeline?: TimelineEvent[] },
) => {
  const ratings: Record<string, number> = {};
  const winningTeamId = homeScore === awayScore ? null : homeScore > awayScore ? homeTeam.id : awayTeam.id;
  const previousWinnerId = !previous || previous.homeScore === previous.awayScore
    ? null : previous.homeScore > previous.awayScore ? homeTeam.id : awayTeam.id;
  const resultBoostFor = (winnerId: string | null, teamId: string) => winnerId === null ? 0.1 : winnerId === teamId ? 0.35 : -0.15;

  [homeTeam, awayTeam].forEach((team) => {
    const resultBoost = resultBoostFor(winningTeamId, team.id);
    team.players.forEach((player) => {
      const previousBoost = resultBoostFor(previousWinnerId, team.id);
      const previouslyKeptCleanSheet = previous && (team.id === homeTeam.id ? previous.awayScore : previous.homeScore) === 0;
      const previousCleanSheetBonus = previouslyKeptCleanSheet
        ? player.position === 'GK' && player.id === team.players.find(candidate => candidate.position === 'GK')?.id
          ? 0.8 : player.position === 'DF' ? 0.35 : 0
        : 0;
      ratings[player.id] = previous
        ? (previous.playerRatings?.[player.id] ?? 6.2 + previousBoost + previousCleanSheetBonus) + resultBoost - previousBoost
        : 5.9 + resultBoost + Math.random() * 0.7;
    });
  });

  const assistCounts = new Map<string, number>();
  previous?.timeline?.forEach(event => {
    if (!event.isOwnGoal && !event.isPenalty && event.assistPlayerId && event.assistPlayerId !== event.playerId) {
      assistCounts.set(event.assistPlayerId, (assistCounts.get(event.assistPlayerId) || 0) + 1);
    }
  });
  timeline.forEach((event) => {
    const team = event.teamId === homeTeam.id ? homeTeam : awayTeam;
    const player = event.isOwnGoal
      ? [homeTeam, awayTeam].flatMap(candidate => candidate.players).find(candidate => candidate.id === event.playerId)
      : team.players.find((candidate) => candidate.id === event.playerId);
    if (!player) return;
    if (event.isOwnGoal) {
      ratings[player.id] -= 0.8;
      return;
    }
    const goalBoost = player.position === 'FW' ? 0.85 : player.position === 'MF' ? 1 : 1.2;
    ratings[player.id] += goalBoost - (event.isPenalty ? 0.15 : 0);
    const assist = !event.isPenalty && event.assistPlayerId !== event.playerId
      ? team.players.find(candidate => candidate.id === event.assistPlayerId) : undefined;
    if (assist) {
      const count = assistCounts.get(assist.id) || 0;
      if (count < 2) ratings[assist.id] += 0.35;
      assistCounts.set(assist.id, count + 1);
    }
  });

  const awardCleanSheet = (team: Team, multiplier = 1) => {
    const primaryGoalkeeper = team.players.find((player) => player.position === 'GK');
    if (primaryGoalkeeper) ratings[primaryGoalkeeper.id] += 0.8 * multiplier;
    team.players.filter((player) => player.position === 'DF').forEach((player) => {
      ratings[player.id] += 0.35 * multiplier;
    });
  };
  // Extend the 90-minute ratings without rerolling or retaining a lost clean sheet.
  if (previous?.awayScore === 0) awardCleanSheet(homeTeam, -1);
  if (previous?.homeScore === 0) awardCleanSheet(awayTeam, -1);
  if (awayScore === 0) awardCleanSheet(homeTeam);
  if (homeScore === 0) awardCleanSheet(awayTeam);

  Object.keys(ratings).forEach((playerId) => {
    ratings[playerId] = clampRating(ratings[playerId]);
  });
  return ratings;
};

/**
 * ═══════════════════════════════════════════════════════════════
 *  UCL MATCH ENGINE (Poisson-based)
 * ═══════════════════════════════════════════════════════════════
 */

// Simple Poisson sampler
const samplePoisson = (lambda: number): number => {
  const L = Math.exp(-lambda);
  let k = 0;
  let p = 1;
  do {
    k++;
    p *= Math.random();
  } while (p > L);
  return k - 1;
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const RATING_GAP_CURVE = [
  { gap: 0, stronger: 1.3, weaker: 1.3 },
  { gap: 3, stronger: 1.45, weaker: 1.17 },
  { gap: 6, stronger: 1.63, weaker: 1.02 },
  { gap: 10, stronger: 1.95, weaker: 0.78 },
  { gap: 15, stronger: 2.25, weaker: 0.62 },
  { gap: 20, stronger: 2.45, weaker: 0.52 },
  { gap: 25, stronger: 2.6, weaker: 0.45 },
] as const;

const interpolateRatingGap = (ratingGap: number) => {
  const gap = clamp(Math.abs(ratingGap), 0, RATING_GAP_CURVE[RATING_GAP_CURVE.length - 1].gap);
  const upperIndex = RATING_GAP_CURVE.findIndex((point) => point.gap >= gap);
  if (upperIndex <= 0) return RATING_GAP_CURVE[0];
  const lower = RATING_GAP_CURVE[upperIndex - 1];
  const upper = RATING_GAP_CURVE[upperIndex];
  const progress = (gap - lower.gap) / (upper.gap - lower.gap);
  return {
    gap,
    stronger: lower.stronger + (upper.stronger - lower.stronger) * progress,
    weaker: lower.weaker + (upper.weaker - lower.weaker) * progress,
  };
};

/**
 * Converts team strength into symmetric expected goals. Pot is deliberately not
 * part of this model: it controls the draw, while rating controls performance.
 */
export const calculateUCLExpectedGoals = (
  homeTeam: Team,
  awayTeam: Team,
  options: SimulateUCLMatchOptions = {},
): UCLExpectedGoals => {
  const ratingDelta = homeTeam.rating - awayTeam.rating;
  const curve = interpolateRatingGap(ratingDelta);
  let home = ratingDelta >= 0 ? curve.stronger : curve.weaker;
  let away = ratingDelta >= 0 ? curve.weaker : curve.stronger;

  if (!options.isNeutralVenue) {
    home += 0.18;
    away -= 0.05;
  }

  const durationFactor = options.durationFactor ?? 1;
  home = clamp((home + (options.homeXgModifier || 0)) * durationFactor, 0.12, 3.2);
  away = clamp((away + (options.awayXgModifier || 0)) * durationFactor, 0.12, 3.2);

  return {
    home: Number(home.toFixed(3)),
    away: Number(away.toFixed(3)),
    ratingDelta,
  };
};

export const sampleUCLScoreline = (
  homeTeam: Team,
  awayTeam: Team,
  options: SimulateUCLMatchOptions = {},
) => {
  const expectedGoals = calculateUCLExpectedGoals(homeTeam, awayTeam, options);
  return {
    homeScore: Math.min(8, samplePoisson(expectedGoals.home)),
    awayScore: Math.min(8, samplePoisson(expectedGoals.away)),
    expectedGoals,
  };
};

export const simulateUCLMatch = (
  homeTeam: Team,
  awayTeam: Team,
  options?: SimulateUCLMatchOptions
): {
  homeScore: number;
  awayScore: number;
  scorers: MatchScorers;
  timeline: TimelineEvent[];
  motm: UCLMatchMOTM | null;
  playerRatings: Record<string, number>;
} => {
  const { homeScore: hScore, awayScore: aScore } = sampleUCLScoreline(homeTeam, awayTeam, options);

  // Build timeline and events
  const generated = buildRegulationTimeline(
    homeTeam,
    awayTeam,
    hScore,
    aScore
  );
  const { timeline, scorers } = attributeUCLGoals(generated.timeline, homeTeam, awayTeam);

  const playerRatings = buildUCLPlayerRatings(homeTeam, awayTeam, hScore, aScore, timeline);
  const winnerTeamId = hScore === aScore ? null : hScore > aScore ? homeTeam.id : awayTeam.id;
  const motm = options?.deferMotm
    ? null
    : calculateUCLMatchMOTM({
        homeTeam,
        awayTeam,
        homeScore: hScore,
        awayScore: aScore,
        timeline,
        playerRatings,
        winnerTeamId,
        finalizedAt: '90',
      });

  return { homeScore: hScore, awayScore: aScore, scorers, timeline, motm, playerRatings };
};
