import { UCL_TEAMS_BY_ID } from '../data/competitions/ucl2627';
import type { LeagueMatch } from '../types/leagueConfig';
import type { TwoLegMatch, UCLPenaltyKick, UCLPenaltyShootout } from '../types/uclConfig';
import type { GoalEvent, MatchScorers, TimelineEvent } from '../types/tournament';
import type { UCLSavedState } from './uclStorage';

export const UCL_STORAGE_VERSION = 1 as const;
export const MAX_UCL_STORAGE_CHARS = 2_500_000;

const MAX_SCORE = 30;
const MAX_PENALTY_SCORE = 50;
const MAX_TEXT_LENGTH = 180;
const MAX_TIMELINE_EVENTS = 40;
const MAX_PENALTY_KICKS = 60;
const MAX_PLAYER_RATINGS = 96;

type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isSafeString = (value: unknown, maxLength = MAX_TEXT_LENGTH): value is string =>
  typeof value === 'string' && value.length > 0 && value.length <= maxLength;

const isOptionalSafeString = (value: unknown, maxLength = MAX_TEXT_LENGTH) =>
  value === undefined || isSafeString(value, maxLength);

const isIntegerBetween = (value: unknown, min: number, max: number): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max;

const isScore = (value: unknown): value is number | null =>
  value === null || isIntegerBetween(value, 0, MAX_SCORE);

const isKnownTeamId = (value: unknown): value is string =>
  typeof value === 'string' && Object.prototype.hasOwnProperty.call(UCL_TEAMS_BY_ID, value);

const isOptionalBoolean = (value: unknown) => value === undefined || typeof value === 'boolean';

const isOptionalNumber = (value: unknown, min: number, max: number) =>
  value === undefined || isIntegerBetween(value, min, max);

const isGoalEvent = (value: unknown): value is GoalEvent => {
  if (!isRecord(value)) return false;
  return (
    isIntegerBetween(value.minute, 0, 150) &&
    isSafeString(value.playerId) &&
    isSafeString(value.playerName) &&
    isKnownTeamId(value.teamId) &&
    isOptionalBoolean(value.isOwnGoal) &&
    isOptionalBoolean(value.isPenalty) &&
    isOptionalSafeString(value.assistPlayerId) &&
    isOptionalSafeString(value.assistPlayerName)
  );
};

const isMatchScorers = (value: unknown): value is MatchScorers => {
  if (!isRecord(value) || !Array.isArray(value.home) || !Array.isArray(value.away)) return false;
  if (value.home.length > MAX_SCORE || value.away.length > MAX_SCORE) return false;
  return value.home.every(isGoalEvent) && value.away.every(isGoalEvent);
};

const isTimelineEvent = (value: unknown): value is TimelineEvent => {
  if (!isRecord(value)) return false;
  return (
    isIntegerBetween(value.sortMinute, 0, 150) &&
    isSafeString(value.displayMinute, 16) &&
    isSafeString(value.playerName) &&
    isSafeString(value.playerId) &&
    isKnownTeamId(value.teamId) &&
    (value.side === 'home' || value.side === 'away') &&
    isOptionalBoolean(value.isPenalty) &&
    isOptionalBoolean(value.isOwnGoal) &&
    isOptionalSafeString(value.assistPlayerId) &&
    isOptionalSafeString(value.assistPlayerName) &&
    (value.phase === undefined || value.phase === 'regulation' || value.phase === 'extra-time')
  );
};

const isTimeline = (value: unknown) =>
  Array.isArray(value) && value.length <= MAX_TIMELINE_EVENTS && value.every(isTimelineEvent);

const isPlayerRatings = (value: unknown) => {
  if (!isRecord(value)) return false;
  const entries = Object.entries(value);
  return (
    entries.length <= MAX_PLAYER_RATINGS &&
    entries.every(
      ([playerId, rating]) =>
        isSafeString(playerId) && typeof rating === 'number' && Number.isFinite(rating) && rating >= 0 && rating <= 20,
    )
  );
};

const isMotm = (value: unknown) => {
  if (value === null) return true;
  if (!isRecord(value)) return false;
  return (
    isSafeString(value.playerId) &&
    isSafeString(value.playerName) &&
    isKnownTeamId(value.teamId) &&
    isSafeString(value.teamName) &&
    isSafeString(value.reason)
  );
};

const hasValidOptionalMatchDetails = (value: UnknownRecord) =>
  (value.scorers === undefined || isMatchScorers(value.scorers)) &&
  (value.timeline === undefined || isTimeline(value.timeline)) &&
  (value.motm === undefined || isMotm(value.motm)) &&
  (value.playerRatings === undefined || isPlayerRatings(value.playerRatings));

const isLeagueMatch = (value: unknown): value is LeagueMatch => {
  if (!isRecord(value)) return false;
  if (
    !isSafeString(value.id) ||
    !isIntegerBetween(value.matchweek, 1, 8) ||
    !isKnownTeamId(value.homeTeamId) ||
    !isKnownTeamId(value.awayTeamId) ||
    value.homeTeamId === value.awayTeamId ||
    (value.status !== 'pending' && value.status !== 'completed') ||
    !isScore(value.homeScore) ||
    !isScore(value.awayScore) ||
    !(value.predictedAt === null || isSafeString(value.predictedAt, 64)) ||
    !hasValidOptionalMatchDetails(value)
  ) {
    return false;
  }

  return value.status !== 'completed' || (value.homeScore !== null && value.awayScore !== null);
};

const isPenaltyKick = (value: unknown): value is UCLPenaltyKick => {
  if (!isRecord(value)) return false;
  return (
    (value.team === 'home' || value.team === 'away') &&
    isOptionalSafeString(value.playerId) &&
    isSafeString(value.playerName) &&
    typeof value.scored === 'boolean' &&
    (value.outcome === undefined || value.outcome === 'goal' || value.outcome === 'saved' || value.outcome === 'off-target') &&
    isIntegerBetween(value.round, 1, 30)
  );
};

const isPenaltyShootout = (value: unknown): value is UCLPenaltyShootout => {
  if (!isRecord(value) || !Array.isArray(value.kicks)) return false;
  return (
    isIntegerBetween(value.homeScore, 0, MAX_PENALTY_SCORE) &&
    isIntegerBetween(value.awayScore, 0, MAX_PENALTY_SCORE) &&
    value.kicks.length <= MAX_PENALTY_KICKS &&
    value.kicks.every(isPenaltyKick)
  );
};

const isLeg = (value: unknown) => {
  if (!isRecord(value)) return false;
  if (
    !isScore(value.homeScore) ||
    !isScore(value.awayScore) ||
    (value.status !== 'pending' && value.status !== 'completed') ||
    !isOptionalBoolean(value.extraTime) ||
    !isOptionalNumber(value.etHomeGoals, 0, MAX_SCORE) ||
    !isOptionalNumber(value.etAwayGoals, 0, MAX_SCORE) ||
    !isOptionalBoolean(value.ratingsIncludeExtraTime) ||
    (value.etScorers !== undefined && !isMatchScorers(value.etScorers)) ||
    (value.etTimeline !== undefined && !isTimeline(value.etTimeline)) ||
    (value.penalties !== undefined && !isPenaltyShootout(value.penalties)) ||
    !hasValidOptionalMatchDetails(value)
  ) {
    return false;
  }

  return value.status !== 'completed' || (value.homeScore !== null && value.awayScore !== null);
};

const VALID_TIE_STATUSES = new Set(['pending', 'leg1-done', 'leg2-done', 'aet', 'completed']);

const isTwoLegMatch = (value: unknown, expectedRound: TwoLegMatch['round']): value is TwoLegMatch => {
  if (!isRecord(value) || !isRecord(value.aggregate)) return false;
  if (
    !isSafeString(value.id) ||
    value.round !== expectedRound ||
    !isKnownTeamId(value.homeTeamId) ||
    !isKnownTeamId(value.awayTeamId) ||
    value.homeTeamId === value.awayTeamId ||
    !isOptionalSafeString(value.stadium) ||
    (value.tieStatus !== undefined && !VALID_TIE_STATUSES.has(value.tieStatus as string)) ||
    !isLeg(value.leg1) ||
    !isLeg(value.leg2) ||
    !isScore(value.aggregate.homeScore) ||
    !isScore(value.aggregate.awayScore) ||
    !(value.winnerId === null || value.winnerId === value.homeTeamId || value.winnerId === value.awayTeamId) ||
    typeof value.isCompleted !== 'boolean'
  ) {
    return false;
  }

  return !value.isCompleted || value.winnerId !== null;
};

const isUniqueMatchArray = (
  value: unknown,
  round: TwoLegMatch['round'],
  maxMatches: number,
): value is TwoLegMatch[] => {
  if (!Array.isArray(value) || value.length > maxMatches || !value.every((match) => isTwoLegMatch(match, round))) {
    return false;
  }
  return new Set(value.map((match) => match.id)).size === value.length;
};

export const validateAndNormalizeUCLState = (value: unknown): UCLSavedState | null => {
  if (!isRecord(value)) return null;
  if (value.version !== undefined && value.version !== UCL_STORAGE_VERSION) return null;
  if (!Array.isArray(value.leagueMatches) || value.leagueMatches.length !== 144) return null;
  if (!value.leagueMatches.every(isLeagueMatch)) return null;
  if (new Set(value.leagueMatches.map((match) => match.id)).size !== value.leagueMatches.length) return null;
  if (!isIntegerBetween(value.currentMatchday, 1, 8)) return null;
  if (!isUniqueMatchArray(value.playoffs, 'playoffs', 8)) return null;
  if (!isUniqueMatchArray(value.roundOf16, 'roundOf16', 8)) return null;
  if (!isUniqueMatchArray(value.quarterfinals, 'quarterfinals', 4)) return null;
  if (!isUniqueMatchArray(value.semifinals, 'semifinals', 2)) return null;
  if (!(value.finalMatch === null || isTwoLegMatch(value.finalMatch, 'final'))) return null;
  if (!(value.champion === null || (isRecord(value.champion) && isKnownTeamId(value.champion.id)))) return null;
  if (!isSafeString(value.updatedAt, 64)) return null;

  return {
    version: UCL_STORAGE_VERSION,
    leagueMatches: value.leagueMatches,
    currentMatchday: value.currentMatchday,
    playoffs: value.playoffs,
    roundOf16: value.roundOf16,
    quarterfinals: value.quarterfinals,
    semifinals: value.semifinals,
    finalMatch: value.finalMatch,
    champion: value.champion === null ? null : UCL_TEAMS_BY_ID[value.champion.id as string],
    updatedAt: value.updatedAt,
  };
};
