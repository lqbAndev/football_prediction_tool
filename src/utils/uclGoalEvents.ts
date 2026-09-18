import type { MatchScorers, PlayerProfile, Team, TimelineEvent } from '../types/tournament';

// Simulation tuning, not individual player ability estimates. Role weights are
// shared across that role's players so squad size does not distort rare GK events.
export const UCL_GOAL_ATTRIBUTION = {
  ownGoalChance: 0.01,
  maxOwnGoals: 2,
  assistChance: 0.74,
  ownGoalWeights: { DF: 90, GK: 9, MF: 1, FW: 0 },
  assistWeights: { MF: 55, FW: 30, DF: 14.9, GK: 0.1 },
} as const;

const pickContributor = (
  players: PlayerProfile[],
  weights: Record<PlayerProfile['position'], number>,
): PlayerProfile | undefined => {
  const choices = players.map(player => ({
    player,
    weight: weights[player.position] / players.filter(candidate => candidate.position === player.position).length,
  })).filter(choice => choice.weight > 0);
  let threshold = Math.random() * choices.reduce((sum, choice) => sum + choice.weight, 0);
  for (const choice of choices) {
    threshold -= choice.weight;
    if (threshold < 0) return choice.player;
  }
  return choices[choices.length - 1]?.player;
};

/** Apply UCL attribution after the scoreline is fixed; never add/remove a goal.
 * teamId/side always identify the beneficiary, even when playerId is an opponent.
 * Previous events are regulation events from this leg, not from the other leg.
 */
export const attributeUCLGoals = (
  events: TimelineEvent[],
  homeTeam: Team,
  awayTeam: Team,
  previousEvents: Array<Pick<TimelineEvent, 'isOwnGoal'>> = [],
): { timeline: TimelineEvent[]; scorers: MatchScorers } => {
  let ownGoals = previousEvents.filter(event => event.isOwnGoal).length;
  const timeline = [...events].sort((a, b) => a.sortMinute - b.sortMinute).map(event => {
    const goal = { ...event };
    delete goal.assistPlayerId;
    delete goal.assistPlayerName;
    const scoringTeam = goal.side === 'home' ? homeTeam : awayTeam;
    const defendingTeam = goal.side === 'home' ? awayTeam : homeTeam;
    goal.teamId = scoringTeam.id;
    if (goal.isPenalty) return goal;
    if (ownGoals < UCL_GOAL_ATTRIBUTION.maxOwnGoals && Math.random() < UCL_GOAL_ATTRIBUTION.ownGoalChance) {
      const player = pickContributor(defendingTeam.players, UCL_GOAL_ATTRIBUTION.ownGoalWeights);
      if (player) {
        ownGoals += 1;
        return { ...goal, playerId: player.id, playerName: player.name, isOwnGoal: true };
      }
    }
    if (Math.random() < UCL_GOAL_ATTRIBUTION.assistChance) {
      const assist = pickContributor(scoringTeam.players.filter(player => player.id !== goal.playerId), UCL_GOAL_ATTRIBUTION.assistWeights);
      if (assist) {
        goal.assistPlayerId = assist.id;
        goal.assistPlayerName = assist.name;
      }
    }
    return goal;
  });
  const scorers: MatchScorers = { home: [], away: [] };
  timeline.forEach(event => scorers[event.side].push({
    minute: Math.floor(event.sortMinute), playerId: event.playerId,
    playerName: event.playerName, teamId: event.teamId,
    isOwnGoal: event.isOwnGoal, isPenalty: event.isPenalty,
    assistPlayerId: event.assistPlayerId, assistPlayerName: event.assistPlayerName,
  }));
  return { timeline, scorers };
};
