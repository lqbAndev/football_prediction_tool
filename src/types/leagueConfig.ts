/**
 * LeagueConfig — Configuration interface for league competitions.
 *
 * Defines the structure for round-robin league tournaments with
 * home/away fixtures, qualification zones, and optional home advantage.
 */

import type { Team } from './tournament';

export interface QualificationZone {
  /** Zone identifier (e.g., 'champions-league', 'europa-league', 'relegation') */
  id: string;
  /** Display label (e.g., 'Champions League', 'Relegation Zone') */
  label: string;
  /** Starting position (1-indexed) */
  startPosition: number;
  /** Ending position (1-indexed, inclusive) */
  endPosition: number;
  /** CSS color for zone highlighting */
  color: string;
}

export interface LeagueConfig {
  /** Unique identifier used in routing, e.g. 'test-league' */
  id: string;

  /** Display name of the league */
  name: string;

  /** Competition type - always 'league' for league competitions */
  type: 'league';

  /** Total number of teams in the league */
  teams: number;

  /** Number of rounds (matchweeks) in the season */
  rounds: number;

  /** Enable home advantage (7-10% boost for home team) */
  homeAdvantage: boolean;

  /** Qualification zones for visual highlighting in league table */
  qualificationZones: QualificationZone[];

  /** Storage key for localStorage persistence */
  storageKey: string;
}

export interface LeagueMatch {
  id: string;
  matchweek: number;
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number | null;
  awayScore: number | null;
  status: 'pending' | 'completed';
  predictedAt: string | null;
  scorers?: {
    home: Array<{
      minute: number;
      playerId: string;
      playerName: string;
      teamId: string;
    }>;
    away: Array<{
      minute: number;
      playerId: string;
      playerName: string;
      teamId: string;
    }>;
  };
  timeline?: Array<{
    sortMinute: number;
    displayMinute: string;
    playerName: string;
    playerId: string;
    teamId: string;
    side: 'home' | 'away';
    isPenalty?: boolean;
    isOwnGoal?: boolean;
  }>;
  motm?: {
    playerId: string;
    playerName: string;
    teamId: string;
    teamName: string;
    reason: string;
  } | null;
  /** Per-match player ratings generated from the simulated match performance. */
  playerRatings?: Record<string, number>;
}

/**
 * League Standing — Team's position and statistics in the league table.
 */
export interface LeagueStanding {
  teamId: string;
  teamName: string;
  position: number;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  /** Form guide: last 5 results ['W', 'D', 'L', 'W', 'W'] */
  form: Array<'W' | 'D' | 'L'>;
}

/**
 * Head-to-Head Record — Used for tiebreaker when two teams have equal points.
 */
export interface HeadToHeadRecord {
  teamId: string;
  points: number;
  goalDifference: number;
  goalsFor: number;
}
