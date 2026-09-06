export interface UclConfig {
  id: string;
  name: string;
  type: 'swiss';
  teams: number;
  rounds: number;
  qualificationZones: Array<{
    id: string;
    label: string;
    startPosition: number;
    endPosition: number;
    color: string;
  }>;
  storageKey: string;
}

import type { MatchScorers, TimelineEvent } from './tournament';
import type { computeLeagueMatchMOTM } from '../utils/motm';

/**
 * Per-kick penalty detail for UCL shootouts.
 * Includes player name, team side, scored/missed, and round number.
 */
export interface UCLPenaltyKick {
  team: 'home' | 'away';
  playerName: string;
  scored: boolean;
  round: number; // 1-5 regulation, 6+ sudden death
}

/**
 * Full UCL penalty shootout result with per-kick timeline.
 */
export interface UCLPenaltyShootout {
  homeScore: number;
  awayScore: number;
  kicks: UCLPenaltyKick[];
}

/**
 * Phased status for knockout ties:
 * - 'pending': No legs played yet
 * - 'leg1-done': Leg 1 completed, Leg 2 pending
 * - 'leg2-done': Leg 2 regulation completed (aggregate tied → needs ET)
 * - 'aet': Extra time completed (still tied → needs penalties)
 * - 'completed': Tie fully resolved
 */
export type TieStatus = 'pending' | 'leg1-done' | 'leg2-done' | 'aet' | 'completed';

export interface TwoLegMatch {
  id: string;
  round: string; // 'playoffs', 'roundOf16', 'quarterfinals', 'semifinals', 'final'
  homeTeamId: string; // The team that plays Home in Leg 2 (or Team 1 in Final)
  awayTeamId: string; // The team that plays Home in Leg 1 (or Team 2 in Final)
  stadium?: string;
  tieStatus?: TieStatus; // Phased simulation status
  leg1: {
    homeScore: number | null;
    awayScore: number | null;
    status: 'pending' | 'completed';
    scorers?: MatchScorers;
    timeline?: TimelineEvent[];
    motm?: ReturnType<typeof computeLeagueMatchMOTM>;
    playerRatings?: Record<string, number>;
  };
  leg2: {
    homeScore: number | null;
    awayScore: number | null;
    status: 'pending' | 'completed';
    extraTime?: boolean;
    etHomeGoals?: number; // Goals scored in extra time only
    etAwayGoals?: number;
    etScorers?: MatchScorers;
    etTimeline?: TimelineEvent[];
    penalties?: UCLPenaltyShootout; // Full per-kick penalty details
    scorers?: MatchScorers;
    timeline?: TimelineEvent[];
    motm?: ReturnType<typeof computeLeagueMatchMOTM>;
    playerRatings?: Record<string, number>;
  };
  aggregate: {
    homeScore: number | null;
    awayScore: number | null;
  };
  winnerId: string | null;
  isCompleted: boolean;
}
