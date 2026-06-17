import { TEAMS_BY_ID } from '../data/tournament';
import type {
  GoalEvent,
  GroupMatch,
  KnockoutMatch,
  KnockoutRound,
  TopScorerEntry,
} from '../types/tournament';

const registerGoals = (scorersMap: Map<string, TopScorerEntry>, events: GoalEvent[]) => {
  for (const event of events) {
    if (event.isOwnGoal) continue;
    const existing = scorersMap.get(event.playerId);
    const teamName = TEAMS_BY_ID[event.teamId]?.name ?? event.teamId;

    if (existing) {
      existing.goals += 1;
      continue;
    }

    scorersMap.set(event.playerId, {
      playerId: event.playerId,
      playerName: event.playerName,
      teamId: event.teamId,
      teamName,
      goals: 1,
    });
  }
};

export const buildTopScorers = (
  groupMatches: GroupMatch[],
  knockoutMatches: Record<KnockoutRound, KnockoutMatch[]>,
): TopScorerEntry[] => {
  const scorersMap = new Map<string, TopScorerEntry>();

  for (const match of groupMatches) {
    if (!match.scorers) {
      continue;
    }

    registerGoals(scorersMap, [...match.scorers.home, ...match.scorers.away]);
  }

  for (const matches of Object.values(knockoutMatches)) {
    for (const match of matches) {
      if (!match.scorers) {
        continue;
      }

      registerGoals(scorersMap, [...match.scorers.home, ...match.scorers.away]);
    }
  }

  return Array.from(scorersMap.values()).sort(
    (left, right) =>
      right.goals - left.goals ||
      left.playerName.localeCompare(right.playerName, 'vi') ||
      left.teamName.localeCompare(right.teamName, 'vi'),
  );
};
