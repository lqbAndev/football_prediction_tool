import type { Team } from '../types/tournament';
import type {
  UCLMatchMOTM,
  UCLMOTMFinalizedAt,
  UCLMOTMScoreBreakdown,
  UCLPenaltyShootout,
} from '../types/uclConfig';

interface CalculateUCLMOTMInput {
  homeTeam: Team;
  awayTeam: Team;
  homeScore: number;
  awayScore: number;
  timeline?: UCLMOTMTimelineEvent[];
  playerRatings?: Record<string, number>;
  winnerTeamId?: string | null;
  finalizedAt: UCLMOTMFinalizedAt;
  penalties?: UCLPenaltyShootout;
}

interface UCLMOTMTimelineEvent {
  sortMinute: number;
  playerId: string;
  playerName: string;
  teamId: string;
  side: 'home' | 'away';
  isPenalty?: boolean;
  isOwnGoal?: boolean;
  phase?: 'regulation' | 'extra-time';
}

interface CandidateScore {
  playerId: string;
  playerName: string;
  teamId: string;
  teamName: string;
  position: Team['players'][number]['position'];
  rating: number;
  breakdown: UCLMOTMScoreBreakdown;
}

const roundScore = (value: number) => Number(value.toFixed(2));

const getLikelyParticipants = (team: Team) => {
  const selected = new Set<string>();
  const addPosition = (position: Team['players'][number]['position'], count: number) => {
    team.players
      .filter((player) => player.position === position)
      .slice(0, count)
      .forEach((player) => selected.add(player.id));
  };

  addPosition('GK', 1);
  addPosition('DF', 4);
  addPosition('MF', 3);
  addPosition('FW', 3);

  // Keep an eleven-player candidate pool when a squad has an unusual position mix.
  team.players.forEach((player) => {
    if (selected.size < 11) selected.add(player.id);
  });

  return selected;
};

const totalScore = (candidate: CandidateScore) => Object.values(candidate.breakdown)
  .reduce((total, value) => total + value, 0);

/**
 * Deterministic UCL Player of the Match model.
 *
 * The simulated player rating is the base signal. Match events then provide
 * smaller, explainable adjustments. Only likely participants and recorded
 * event contributors are eligible, so an unused reserve cannot win by chance.
 */
export const calculateUCLMatchMOTM = ({
  homeTeam,
  awayTeam,
  homeScore,
  awayScore,
  timeline = [],
  playerRatings = {},
  winnerTeamId = null,
  finalizedAt,
  penalties,
}: CalculateUCLMOTMInput): UCLMatchMOTM | null => {
  const teams = [homeTeam, awayTeam];
  const teamById = new Map(teams.map((team) => [team.id, team]));
  const eligibleByTeam = new Map(teams.map((team) => [team.id, getLikelyParticipants(team)]));

  timeline.forEach((event) => eligibleByTeam.get(event.teamId)?.add(event.playerId));
  penalties?.kicks.forEach((kick) => {
    const team = kick.team === 'home' ? homeTeam : awayTeam;
    const player = kick.playerId
      ? team.players.find((candidate) => candidate.id === kick.playerId)
      : team.players.find((candidate) => candidate.name === kick.playerName);
    if (player) eligibleByTeam.get(team.id)?.add(player.id);
  });

  const candidates = new Map<string, CandidateScore>();
  teams.forEach((team) => {
    const eligibleIds = eligibleByTeam.get(team.id) || new Set<string>();
    team.players.forEach((player) => {
      if (!eligibleIds.has(player.id)) return;
      const rating = playerRatings[player.id] ?? 6;
      candidates.set(`${team.id}:${player.id}`, {
        playerId: player.id,
        playerName: player.name,
        teamId: team.id,
        teamName: team.name,
        position: player.position,
        rating,
        breakdown: {
          ratingPoints: roundScore(rating * 10),
          goalPoints: 0,
          decisivePoints: 0,
          cleanSheetPoints: 0,
          winnerPoints: 0,
          shootoutPoints: 0,
        },
      });
    });
  });

  const getCandidate = (teamId: string, playerId: string) =>
    candidates.get(`${teamId}:${playerId}`);

  const validGoals = timeline
    .filter((event) => !event.isOwnGoal)
    .sort((left, right) => left.sortMinute - right.sortMinute);

  validGoals.forEach((event) => {
    const candidate = getCandidate(event.teamId, event.playerId);
    if (!candidate) return;
    const positionBonus = candidate.position === 'DF' || candidate.position === 'GK'
      ? 1.5
      : candidate.position === 'MF'
      ? 0.75
      : 0;
    const penaltyAdjustment = event.isPenalty ? -0.75 : 0;
    const extraTimeBonus = event.phase === 'extra-time' ? 2 : 0;
    candidate.breakdown.goalPoints += 6 + positionBonus + penaltyAdjustment + extraTimeBonus;
  });

  if (winnerTeamId && homeScore !== awayScore) {
    const losingScore = Math.min(homeScore, awayScore);
    let winnerGoalCount = 0;
    const decisiveGoal = validGoals.find((event) => {
      if (event.teamId !== winnerTeamId) return false;
      winnerGoalCount += 1;
      return winnerGoalCount === losingScore + 1;
    });
    if (decisiveGoal) {
      const candidate = getCandidate(decisiveGoal.teamId, decisiveGoal.playerId);
      if (candidate) candidate.breakdown.decisivePoints += 2;
    }
  }

  const awardCleanSheet = (team: Team) => {
    const primaryGoalkeeper = team.players.find((player) => player.position === 'GK');
    if (primaryGoalkeeper) {
      const goalkeeper = getCandidate(team.id, primaryGoalkeeper.id);
      if (goalkeeper) goalkeeper.breakdown.cleanSheetPoints += 5;
    }
    team.players
      .filter((player) => player.position === 'DF')
      .slice(0, 4)
      .forEach((player) => {
        const defender = getCandidate(team.id, player.id);
        if (defender) defender.breakdown.cleanSheetPoints += 3;
      });
  };
  if (awayScore === 0) awardCleanSheet(homeTeam);
  if (homeScore === 0) awardCleanSheet(awayTeam);

  if (winnerTeamId) {
    candidates.forEach((candidate) => {
      if (candidate.teamId === winnerTeamId) candidate.breakdown.winnerPoints += 1;
    });
  }

  if (penalties) {
    const shootoutWinnerId = penalties.homeScore > penalties.awayScore ? homeTeam.id : awayTeam.id;
    penalties.kicks.forEach((kick) => {
      const kickingTeam = kick.team === 'home' ? homeTeam : awayTeam;
      const defendingTeam = kick.team === 'home' ? awayTeam : homeTeam;
      const taker = kick.playerId
        ? getCandidate(kickingTeam.id, kick.playerId)
        : [...candidates.values()].find((candidate) =>
            candidate.teamId === kickingTeam.id && candidate.playerName === kick.playerName,
          );

      if (taker) taker.breakdown.shootoutPoints += kick.scored ? 0.75 : -0.75;

      if (!kick.scored && kick.outcome === 'saved') {
        const goalkeeper = defendingTeam.players.find((player) => player.position === 'GK');
        if (goalkeeper) {
          const keeperCandidate = getCandidate(defendingTeam.id, goalkeeper.id);
          if (keeperCandidate) keeperCandidate.breakdown.shootoutPoints += 4;
        }
      }
    });

    const finalKick = penalties.kicks[penalties.kicks.length - 1];
    if (finalKick?.scored) {
      const finalKickTeam = finalKick.team === 'home' ? homeTeam : awayTeam;
      if (finalKickTeam.id === shootoutWinnerId) {
        const scorer = finalKick.playerId
          ? getCandidate(finalKickTeam.id, finalKick.playerId)
          : [...candidates.values()].find((candidate) =>
              candidate.teamId === finalKickTeam.id && candidate.playerName === finalKick.playerName,
            );
        if (scorer) scorer.breakdown.decisivePoints += 2;
      }
    }
  }

  const ranked = [...candidates.values()].sort((left, right) =>
    totalScore(right) - totalScore(left) ||
    right.rating - left.rating ||
    right.breakdown.decisivePoints - left.breakdown.decisivePoints ||
    right.breakdown.goalPoints - left.breakdown.goalPoints ||
    right.breakdown.shootoutPoints - left.breakdown.shootoutPoints ||
    left.playerId.localeCompare(right.playerId),
  );
  const winner = ranked[0];
  if (!winner || !teamById.has(winner.teamId)) return null;
  const breakdown: UCLMOTMScoreBreakdown = {
    ratingPoints: roundScore(winner.breakdown.ratingPoints),
    goalPoints: roundScore(winner.breakdown.goalPoints),
    decisivePoints: roundScore(winner.breakdown.decisivePoints),
    cleanSheetPoints: roundScore(winner.breakdown.cleanSheetPoints),
    winnerPoints: roundScore(winner.breakdown.winnerPoints),
    shootoutPoints: roundScore(winner.breakdown.shootoutPoints),
  };

  return {
    playerId: winner.playerId,
    playerName: winner.playerName,
    teamId: winner.teamId,
    teamName: winner.teamName,
    reason: 'ucl-performance',
    performanceScore: roundScore(totalScore(winner)),
    finalizedAt,
    breakdown,
  };
};
