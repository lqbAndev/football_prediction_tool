export const GROUP_IDS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'] as const;
export type GroupId = (typeof GROUP_IDS)[number];

export const KNOCKOUT_ROUNDS = [
  'roundOf32',
  'roundOf16',
  'quarterfinals',
  'semifinals',
  'thirdPlace',
  'final',
] as const;
export type KnockoutRound = (typeof KNOCKOUT_ROUNDS)[number];

export type PlayerPosition = 'GK' | 'DF' | 'MF' | 'FW';
export type TournamentScenario = 'standard' | 'favorites' | 'underdogs';
export type KnockoutMatchStatus = 'pending' | 'awaiting-penalties' | 'completed';

export interface PlayerProfile {
  id: string;
  name: string;
  position: PlayerPosition;
}

export interface Team {
  id: string;
  name: string;
  shortName: string;
  group: GroupId;
  rating: number;
  tier?: string;
  pot?: number;
  manager?: string;
  stadium?: string;
  logo?: string;
  players: PlayerProfile[];
}

export interface GoalEvent {
  minute: number;
  playerId: string;
  playerName: string;
  teamId: string;
  isOwnGoal?: boolean;
  isPenalty?: boolean;
}

export interface MatchScorers {
  home: GoalEvent[];
  away: GoalEvent[];
}

/** A single event in the match timeline, sorted chronologically */
export interface TimelineEvent {
  /** Actual minute for sorting (e.g. 45 for 45', 46 for 45+1', 91 for 90+1') */
  sortMinute: number;
  /** Display string such as "23'", "45+2'", "90+1'" */
  displayMinute: string;
  /** Player who scored */
  playerName: string;
  playerId: string;
  /** Team that scored */
  teamId: string;
  /** 'home' or 'away' */
  side: 'home' | 'away';
  /** Whether this goal was from a penalty kick during play (not shootout) */
  isPenalty: boolean;
  /** Whether this is an own goal */
  isOwnGoal?: boolean;
  /** Phase: 'regulation' | 'extra-time' */
  phase: 'regulation' | 'extra-time';
}

/** Penalty shootout detail for each kick */
export interface PenaltyShootoutKick {
  teamId: string;
  playerName: string;
  scored: boolean;
  side: 'home' | 'away';
}

export type MatchMOTMReason =
  | 'top-goals'
  | 'decisive-goal'
  | 'winner-priority'
  | 'controlled-random'
  | 'performance-points';

export interface MatchMOTM {
  playerName: string;
  teamName: string;
  reason: MatchMOTMReason;
}

export interface SeasonMOTM {
  playerName: string;
  teamName: string;
  motmCount: number;
  motmScore: number;
}

export interface GroupMatch {
  id: string;
  stage: 'group';
  group: GroupId;
  matchday: number;
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number | null;
  awayScore: number | null;
  scorers: MatchScorers | null;
  timeline: TimelineEvent[] | null;
  motm: MatchMOTM | null;
  status: 'pending' | 'completed';
  predictedAt: string | null;
}

export interface PenaltyShootout {
  home: number;
  away: number;
}

export interface KnockoutTeamOrigin {
  group: GroupId;
  rank: 1 | 2 | 3;
  source: 'group-winner' | 'group-runner-up' | 'best-third';
  label: string;
}

export interface KnockoutMatch {
  id: string;
  stage: 'knockout';
  round: KnockoutRound;
  slot: number;
  homeTeamId: string | null;
  awayTeamId: string | null;
  homeSeedLabel: string | null;
  awaySeedLabel: string | null;
  regulationHomeScore: number | null;
  regulationAwayScore: number | null;
  extraTimeHomeScore: number | null;
  extraTimeAwayScore: number | null;
  homeScore: number | null;
  awayScore: number | null;
  scorers: MatchScorers | null;
  timeline: TimelineEvent[] | null;
  motm: MatchMOTM | null;
  penalty: PenaltyShootout | null;
  penaltyTimeline?: PenaltyShootoutKick[];
  status: KnockoutMatchStatus;
  winnerTeamId: string | null;
  loserTeamId: string | null;
  predictedAt: string | null;
}

export interface TeamStanding {
  teamId: string;
  teamName: string;
  group: GroupId;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  rank: number;
}

export interface ThirdPlaceStanding extends TeamStanding {
  position: number;
  qualifies: boolean;
  status: 'qualified' | 'provisional' | 'eliminated';
}

export interface TopScorerEntry {
  playerId: string;
  playerName: string;
  teamId: string;
  teamName: string;
  goals: number;
}

export interface KnockoutSeeds {
  groupWinners: TeamStanding[];
  groupRunnersUp: TeamStanding[];
  bestThirds: ThirdPlaceStanding[];
}

export interface TournamentCoreState {
  groupMatches: GroupMatch[];
  knockoutVisible: boolean;
  knockoutMatches: Record<KnockoutRound, KnockoutMatch[]>;
  scenario: TournamentScenario;
}

export interface TournamentDerivedState {
  standingsByGroup: Record<GroupId, TeamStanding[]>;
  thirdPlaceTable: ThirdPlaceStanding[];
  topScorers: TopScorerEntry[];
  seasonMOTM: SeasonMOTM | null;
  qualifiedTeamIds: string[];
  groupStageComplete: boolean;
  knockoutReady: boolean;
  knockoutSeeds: KnockoutSeeds;
  knockoutTeamOrigins: Record<string, KnockoutTeamOrigin>;
  championTeamId: string | null;
  championName: string | null;
}

export interface PersistedTournamentState {
  version: number;
  core: TournamentCoreState;
  derived: Omit<TournamentDerivedState, 'knockoutSeeds'>;
  updatedAt: string;
}
