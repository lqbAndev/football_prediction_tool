/**
 * League Engine — Round-Robin tournament logic with Home Advantage.
 */

import { buildRegulationTimeline } from './random';
import { computeLeagueMatchMOTM } from './motm';
import type { Team } from '../types/tournament';
import type { LeagueConfig, LeagueMatch, LeagueStanding, HeadToHeadRecord } from '../types/leagueConfig';

// ═══════════════════════════════════════════════════════════════
//  ROUND-ROBIN FIXTURE GENERATION (Circle Method)
// ═══════════════════════════════════════════════════════════════

export const generateRoundRobinFixtures = (teams: Team[], config: LeagueConfig): LeagueMatch[] => {
  const teamCount = teams.length;
  const fixtures: LeagueMatch[] = [];
  let matchId = 0;

  // Shuffle team order for randomized fixtures each season
  const shuffledIds = [...teams.map((t) => t.id)];
  for (let i = shuffledIds.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledIds[i], shuffledIds[j]] = [shuffledIds[j], shuffledIds[i]];
  }
  const teamIds = shuffledIds;
  const rotatingIds = teamIds.slice(1);

  // Generate first leg (rounds 1 to teamCount-1)
  for (let round = 0; round < teamCount - 1; round++) {
    const matchweek = round + 1;
    const roundPairs: Array<[string, string]> = [];

    const fixedTeamId = teamIds[0];
    const opponentIndex = round % rotatingIds.length;
    const opponentId = rotatingIds[opponentIndex];

    if (round % 2 === 0) {
      roundPairs.push([fixedTeamId, opponentId]);
    } else {
      roundPairs.push([opponentId, fixedTeamId]);
    }

    const remainingCount = rotatingIds.length - 1;
    for (let i = 0; i < Math.floor(remainingCount / 2); i++) {
      const leftIndex = (opponentIndex + 1 + i) % rotatingIds.length;
      const rightIndex = (opponentIndex - 1 - i + rotatingIds.length) % rotatingIds.length;
      const leftTeamId = rotatingIds[leftIndex];
      const rightTeamId = rotatingIds[rightIndex];

      if ((round + i) % 2 === 0) {
        roundPairs.push([leftTeamId, rightTeamId]);
      } else {
        roundPairs.push([rightTeamId, leftTeamId]);
      }
    }

    for (const [homeId, awayId] of roundPairs) {
      fixtures.push({
        id: `match-${matchId++}`,
        matchweek,
        homeTeamId: homeId,
        awayTeamId: awayId,
        homeScore: null,
        awayScore: null,
        status: 'pending',
        predictedAt: null,
      });
    }
  }

  // Generate second leg (reversed home/away)
  const firstLegCount = fixtures.length;
  for (let i = 0; i < firstLegCount; i++) {
    const firstLegMatch = fixtures[i];
    const secondLegMatchweek = firstLegMatch.matchweek + (teamCount - 1);
    fixtures.push({
      id: `match-${matchId++}`,
      matchweek: secondLegMatchweek,
      homeTeamId: firstLegMatch.awayTeamId,
      awayTeamId: firstLegMatch.homeTeamId,
      homeScore: null,
      awayScore: null,
      status: 'pending',
      predictedAt: null,
    });
  }

  return fixtures;
};

// ═══════════════════════════════════════════════════════════════
//  HOME ADVANTAGE & SCORELINE GENERATION
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

const generateLeagueScoreline = (
  homeTeam: Team,
  awayTeam: Team,
  homeAdvantageEnabled: boolean,
): { homeGoals: number; awayGoals: number } => {
  // Home advantage: 5-10% boost (widened from 7-10%)
  const homeBoost = homeAdvantageEnabled ? 1.05 + Math.random() * 0.05 : 1.0;
  const adjustedHomeRating = homeTeam.rating * homeBoost;

  // Simple rating-influenced generation
  const ratingDiff = adjustedHomeRating - awayTeam.rating;
  // Wider tier gap influence: divisor 80 (was 100), clamp ±0.25 (was ±0.15)
  const homeBias = Math.max(-0.25, Math.min(0.25, ratingDiff / 80));

  let homeGoals = sampleGoals();
  let awayGoals = sampleGoals();

  // Apply slight bias based on rating difference
  if (Math.random() < Math.abs(homeBias)) {
    if (homeBias > 0 && homeGoals < awayGoals) {
      [homeGoals, awayGoals] = [awayGoals, homeGoals];
    } else if (homeBias < 0 && awayGoals < homeGoals) {
      [homeGoals, awayGoals] = [awayGoals, homeGoals];
    }
  }

  return { homeGoals, awayGoals };
};

// ═══════════════════════════════════════════════════════════════
//  MATCH SIMULATION
// ═══════════════════════════════════════════════════════════════

export const simulateLeagueMatch = (
  match: LeagueMatch,
  homeTeam: Team,
  awayTeam: Team,
  homeAdvantageEnabled: boolean,
): LeagueMatch => {
  const { homeGoals, awayGoals } = generateLeagueScoreline(homeTeam, awayTeam, homeAdvantageEnabled);
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

  // Compute MOTM for the completed league match
  completedMatch.motm = computeLeagueMatchMOTM(completedMatch);
  return completedMatch;
};

export const simulateMatchweek = (
  fixtures: LeagueMatch[],
  matchweek: number,
  teamsById: Record<string, Team>,
  homeAdvantageEnabled: boolean,
): LeagueMatch[] => {
  return fixtures.map((match) => {
    if (match.matchweek === matchweek && match.status === 'pending') {
      const homeTeam = teamsById[match.homeTeamId];
      const awayTeam = teamsById[match.awayTeamId];
      return simulateLeagueMatch(match, homeTeam, awayTeam, homeAdvantageEnabled);
    }
    return match;
  });
};

// ═══════════════════════════════════════════════════════════════
//  LEAGUE TABLE CALCULATION
// ═══════════════════════════════════════════════════════════════

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

const calculateHeadToHead = (
  fixtures: LeagueMatch[],
  teamId: string,
  opponentId: string,
): HeadToHeadRecord => {
  const h2hMatches = fixtures.filter(
    (m) =>
      m.status === 'completed' &&
      ((m.homeTeamId === teamId && m.awayTeamId === opponentId) ||
        (m.homeTeamId === opponentId && m.awayTeamId === teamId)),
  );

  let points = 0;
  let goalsFor = 0;
  let goalsAgainst = 0;

  for (const match of h2hMatches) {
    const isHome = match.homeTeamId === teamId;
    const teamScore = isHome ? match.homeScore! : match.awayScore!;
    const opponentScore = isHome ? match.awayScore! : match.homeScore!;

    goalsFor += teamScore;
    goalsAgainst += opponentScore;

    if (teamScore > opponentScore) points += 3;
    else if (teamScore === opponentScore) points += 1;
  }

  return { teamId, points, goalDifference: goalsFor - goalsAgainst, goalsFor };
};

const applyHeadToHeadTiebreaker = (
  standings: LeagueStanding[],
  fixtures: LeagueMatch[],
): LeagueStanding[] => {
  const result = [...standings];

  for (let i = 0; i < result.length - 1; i++) {
    const teamA = result[i];
    const teamB = result[i + 1];

    if (teamA.points !== teamB.points) continue;

    const hasThirdTeam =
      (i > 0 && result[i - 1].points === teamA.points) ||
      (i < result.length - 2 && result[i + 2].points === teamA.points);

    if (hasThirdTeam) continue;

    const h2hA = calculateHeadToHead(fixtures, teamA.teamId, teamB.teamId);
    const h2hB = calculateHeadToHead(fixtures, teamB.teamId, teamA.teamId);

    if (h2hA.points !== h2hB.points) {
      if (h2hA.points < h2hB.points) [result[i], result[i + 1]] = [result[i + 1], result[i]];
      continue;
    }

    if (h2hA.goalDifference !== h2hB.goalDifference) {
      if (h2hA.goalDifference < h2hB.goalDifference) [result[i], result[i + 1]] = [result[i + 1], result[i]];
      continue;
    }

    if (h2hA.goalsFor !== h2hB.goalsFor) {
      if (h2hA.goalsFor < h2hB.goalsFor) [result[i], result[i + 1]] = [result[i + 1], result[i]];
    }
  }

  return result;
};

export const calculateLeagueTable = (fixtures: LeagueMatch[], teams: Team[]): LeagueStanding[] => {
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

  const sortedStandings = Object.values(standings).sort((a, b) => {
    if (a.points !== b.points) return b.points - a.points;
    if (a.goalDifference !== b.goalDifference) return b.goalDifference - a.goalDifference;
    if (a.goalsFor !== b.goalsFor) return b.goalsFor - a.goalsFor;
    return a.teamName.localeCompare(b.teamName);
  });

  const finalStandings = applyHeadToHeadTiebreaker(sortedStandings, fixtures);
  finalStandings.forEach((standing, index) => {
    standing.position = index + 1;
  });

  return finalStandings;
};

// ═══════════════════════════════════════════════════════════════
//  UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════

export const getMatchweekFixtures = (fixtures: LeagueMatch[], matchweek: number): LeagueMatch[] => {
  return fixtures.filter((m) => m.matchweek === matchweek);
};

export const isMatchweekCompleted = (fixtures: LeagueMatch[], matchweek: number): boolean => {
  const matchweekFixtures = getMatchweekFixtures(fixtures, matchweek);
  return matchweekFixtures.every((m) => m.status === 'completed');
};

export const getCurrentMatchweek = (fixtures: LeagueMatch[], totalRounds: number): number => {
  for (let mw = 1; mw <= totalRounds; mw++) {
    if (!isMatchweekCompleted(fixtures, mw)) return mw;
  }
  return totalRounds;
};
