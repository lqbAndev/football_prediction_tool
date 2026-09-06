import type { Team, MatchScorers, TimelineEvent } from '../types/tournament';
import type { LeagueMatch } from '../types/leagueConfig';
import { buildRegulationTimeline } from './random';
import { computeLeagueMatchMOTM } from './motm';

export interface SimulateUCLMatchOptions {
  isNeutralVenue?: boolean;
}

const clampRating = (rating: number) => Math.max(4, Math.min(10, Number(rating.toFixed(1))));

const buildPlayerRatings = (
  homeTeam: Team,
  awayTeam: Team,
  homeScore: number,
  awayScore: number,
  timeline: TimelineEvent[],
  motm: ReturnType<typeof computeLeagueMatchMOTM>,
) => {
  const ratings: Record<string, number> = {};
  const winningTeamId = homeScore === awayScore ? null : homeScore > awayScore ? homeTeam.id : awayTeam.id;

  [homeTeam, awayTeam].forEach((team) => {
    const resultBoost = winningTeamId === null ? 0.1 : winningTeamId === team.id ? 0.35 : -0.15;
    team.players.forEach((player) => {
      ratings[player.id] = 5.9 + resultBoost + Math.random() * 0.7;
    });
  });

  timeline.forEach((event) => {
    const team = event.teamId === homeTeam.id ? homeTeam : awayTeam;
    const player = team.players.find((candidate) => candidate.id === event.playerId);
    if (!player) return;
    if (event.isOwnGoal) {
      ratings[player.id] -= 0.8;
      return;
    }
    const goalBoost = player.position === 'FW' ? 0.85 : player.position === 'MF' ? 1 : 1.2;
    ratings[player.id] += goalBoost - (event.isPenalty ? 0.15 : 0);
  });

  const awardCleanSheet = (team: Team) => {
    const primaryGoalkeeper = team.players.find((player) => player.position === 'GK');
    if (primaryGoalkeeper) ratings[primaryGoalkeeper.id] += 0.8;
    team.players.filter((player) => player.position === 'DF').forEach((player) => {
      ratings[player.id] += 0.35;
    });
  };
  if (awayScore === 0) awardCleanSheet(homeTeam);
  if (homeScore === 0) awardCleanSheet(awayTeam);

  if (motm) ratings[motm.playerId] = Math.max(ratings[motm.playerId] || 0, 8.5 + Math.random() * 0.8);

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

export const simulateUCLMatch = (
  homeTeam: Team,
  awayTeam: Team,
  options?: SimulateUCLMatchOptions
): {
  homeScore: number;
  awayScore: number;
  scorers: MatchScorers;
  timeline: TimelineEvent[];
  motm: ReturnType<typeof computeLeagueMatchMOTM>;
  playerRatings: Record<string, number>;
} => {
  const isNeutral = options?.isNeutralVenue ?? false;

  // Apply rating delta
  const ratingDelta = homeTeam.rating - awayTeam.rating;

  // Base Win Probabilities
  let homeWinProb = isNeutral ? 40 : 45;
  let drawProb = isNeutral ? 20 : 25;
  let awayWinProb = isNeutral ? 40 : 30;

  if (isNeutral) {
    const clampedDelta = Math.max(-15, Math.min(15, ratingDelta));
    const shift = clampedDelta * 1.5;
    homeWinProb += shift;
    awayWinProb -= shift;
  } else {
    const shift = ratingDelta * 1.5;
    homeWinProb += shift;
    awayWinProb -= shift;
  }

  homeWinProb = Math.max(10, Math.min(80, homeWinProb));
  awayWinProb = Math.max(10, Math.min(80, awayWinProb));
  drawProb = 100 - homeWinProb - awayWinProb;

  if (drawProb < 10) {
    drawProb = 10;
    const totalWin = homeWinProb + awayWinProb;
    if (totalWin > 0) {
      homeWinProb = (homeWinProb / totalWin) * 90;
      awayWinProb = (awayWinProb / totalWin) * 90;
    }
  }

  // Roll match outcome
  const roll = Math.random() * 100;
  let outcome: 'home-win' | 'away-win' | 'draw';

  if (roll < homeWinProb) {
    outcome = 'home-win';
  } else if (roll < homeWinProb + drawProb) {
    outcome = 'draw';
  } else {
    outcome = 'away-win';
  }

  // Calculate Lambdas for Poisson
  const baseLambdaHome = isNeutral ? 1.2 : 1.4;
  const baseLambdaAway = isNeutral ? 1.2 : 1.0;

  const lambdaHome = Math.max(0.5, baseLambdaHome + (ratingDelta > 0 ? ratingDelta * 0.02 : 0));
  const lambdaAway = Math.max(0.5, baseLambdaAway + (ratingDelta < 0 ? Math.abs(ratingDelta) * 0.02 : 0));

  // Generate Scoreline with Resampling
  let hScore = 0;
  let aScore = 0;
  let valid = false;

  for (let attempt = 0; attempt < 10; attempt++) {
    hScore = samplePoisson(lambdaHome);
    aScore = samplePoisson(lambdaAway);

    if (outcome === 'home-win' && hScore > aScore) { valid = true; break; }
    if (outcome === 'away-win' && aScore > hScore) { valid = true; break; }
    if (outcome === 'draw' && hScore === aScore) { valid = true; break; }
  }

  // Fallback clamp if 10 resamples failed to match outcome
  if (!valid) {
    if (outcome === 'home-win') {
      if (hScore <= aScore) aScore = Math.max(0, hScore - 1);
      if (hScore === 0 && aScore === 0) hScore = 1;
    } else if (outcome === 'away-win') {
      if (aScore <= hScore) hScore = Math.max(0, aScore - 1);
      if (aScore === 0 && hScore === 0) aScore = 1;
    } else {
      aScore = hScore;
    }
  }

  // Build timeline and events
  const { timeline, scorers } = buildRegulationTimeline(
    homeTeam,
    awayTeam,
    hScore,
    aScore
  );

  // Compute MOTM
  const dummyMatch: LeagueMatch = {
    id: 'ucl-temp',
    matchweek: 1,
    homeTeamId: homeTeam.id,
    awayTeamId: awayTeam.id,
    homeScore: hScore,
    awayScore: aScore,
    status: 'completed',
    predictedAt: new Date().toISOString(),
    scorers,
    timeline,
  };
  const motm = computeLeagueMatchMOTM(dummyMatch, homeTeam, awayTeam);
  const playerRatings = buildPlayerRatings(homeTeam, awayTeam, hScore, aScore, timeline, motm);

  return { homeScore: hScore, awayScore: aScore, scorers, timeline, motm, playerRatings };
};
