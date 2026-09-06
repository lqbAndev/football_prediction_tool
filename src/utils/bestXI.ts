import { TEAMS } from '../data/tournament';
import type {
  GroupMatch,
  KnockoutMatch,
  KnockoutRound,
  Team,
  TimelineEvent,
} from '../types/tournament';

type BestXILineupPosition = 'GK' | 'DEF' | 'MID' | 'ATT';

export interface PlayerScoreBreakdown {
  goalPoints: number;
  cleanSheetPoints: number;
  motmPoints: number;
  teamWinPoints: number;
  achievementPoints: number;
}

export interface BestXIPlayer {
  playerId: string;
  playerName: string;
  teamId: string;
  teamName: string;
  teamLogo?: string;
  naturalPosition: BestXILineupPosition;
  lineupPosition: BestXILineupPosition;
  goals: number;
  cleanSheets: number;
  motmCount: number;
  totalScore: number;
  averageRating?: number;
  scoreBreakdown?: PlayerScoreBreakdown;
  knockoutImpact: number;
  semiFinalImpact: number;
  progressScore: number;
}

export interface BestXIResult {
  goalkeeper: BestXIPlayer;
  defenders: BestXIPlayer[];
  midfielders: BestXIPlayer[];
  attackers: BestXIPlayer[];
  bestPlayer: BestXIPlayer;
}

interface MutableBestXIPlayer extends BestXIPlayer {}

const roundHasSemiFinalBonus = (round: KnockoutRound) => round === 'semifinals' || round === 'final';

const mapPositionToLineup = (position: Team['players'][number]['position']): BestXILineupPosition => {
  if (position === 'GK') {
    return 'GK';
  }

  if (position === 'DF') {
    return 'DEF';
  }

  if (position === 'MF') {
    return 'MID';
  }

  return 'ATT';
};

const comparePlayers = (left: MutableBestXIPlayer, right: MutableBestXIPlayer) => {
  if (right.totalScore !== left.totalScore) {
    return right.totalScore - left.totalScore;
  }

  if (right.progressScore !== left.progressScore) {
    return right.progressScore - left.progressScore;
  }

  if (right.motmCount !== left.motmCount) {
    return right.motmCount - left.motmCount;
  }

  if (right.goals !== left.goals) {
    return right.goals - left.goals;
  }

  return left.playerName.localeCompare(right.playerName);
};

const resolveTimeline = (match: GroupMatch | KnockoutMatch): TimelineEvent[] => {
  if (match.timeline?.length) {
    return match.timeline;
  }

  const fallbackTimeline: TimelineEvent[] = [];

  if (match.scorers?.home.length) {
    for (const event of match.scorers.home) {
      const resolvedTeamId = event.teamId || match.homeTeamId;
      if (!resolvedTeamId) {
        continue;
      }

      fallbackTimeline.push({
        sortMinute: event.minute,
        displayMinute: `${event.minute}'`,
        playerName: event.playerName,
        playerId: event.playerId,
        teamId: resolvedTeamId,
        side: 'home',
        isPenalty: !!event.isPenalty,
        isOwnGoal: !!event.isOwnGoal,
        phase: 'regulation',
      });
    }
  }

  if (match.scorers?.away.length) {
    for (const event of match.scorers.away) {
      const resolvedTeamId = event.teamId || match.awayTeamId;
      if (!resolvedTeamId) {
        continue;
      }

      fallbackTimeline.push({
        sortMinute: event.minute,
        displayMinute: `${event.minute}'`,
        playerName: event.playerName,
        playerId: event.playerId,
        teamId: resolvedTeamId,
        side: 'away',
        isPenalty: !!event.isPenalty,
        isOwnGoal: !!event.isOwnGoal,
        phase: 'regulation',
      });
    }
  }

  return fallbackTimeline;
};

const buildPlayerRegistry = () => {
  const registry = new Map<string, MutableBestXIPlayer>();
  const teamByName = new Map<string, Team>();

  for (const team of TEAMS) {
    teamByName.set(team.name, team);

    for (const player of team.players) {
      const key = `${team.id}:${player.id}`;
      registry.set(key, {
        playerId: player.id,
        playerName: player.name,
        teamId: team.id,
        teamName: team.name,
        naturalPosition: mapPositionToLineup(player.position),
        lineupPosition: mapPositionToLineup(player.position),
        goals: 0,
        cleanSheets: 0,
        motmCount: 0,
        totalScore: 0,
        knockoutImpact: 0,
        semiFinalImpact: 0,
        progressScore: 0,
      });
    }
  }

  return {
    registry,
    teamByName,
  };
};

const applyGoalScore = (
  player: MutableBestXIPlayer,
  isKnockout: boolean,
  hasSemiFinalBonus: boolean,
) => {
  player.goals += 1;
  player.totalScore += 2;

  if (isKnockout) {
    player.knockoutImpact += 1;
    player.totalScore += 1;
  }

  if (hasSemiFinalBonus) {
    player.semiFinalImpact += 1;
    player.totalScore += 2;
  }
};

const applyMotmScore = (
  player: MutableBestXIPlayer,
  isKnockout: boolean,
  hasSemiFinalBonus: boolean,
) => {
  player.motmCount += 1;
  player.totalScore += 3;

  if (isKnockout) {
    player.knockoutImpact += 1;
    player.totalScore += 1;
  }

  if (hasSemiFinalBonus) {
    player.semiFinalImpact += 1;
    player.totalScore += 2;
  }
};

const selectByPosition = (
  sortedPool: MutableBestXIPlayer[],
  selectedIds: Set<string>,
  position: BestXILineupPosition,
  count: number,
) => {
  const selected: BestXIPlayer[] = [];

  for (const candidate of sortedPool) {
    if (selected.length >= count) {
      break;
    }
    if (selectedIds.has(candidate.playerId) || candidate.naturalPosition !== position) {
      continue;
    }

    selectedIds.add(candidate.playerId);
    selected.push({
      ...candidate,
      lineupPosition: position,
    });
  }

  if (selected.length < count) {
    for (const candidate of sortedPool) {
      if (selected.length >= count) {
        break;
      }
      if (selectedIds.has(candidate.playerId)) {
        continue;
      }

      selectedIds.add(candidate.playerId);
      selected.push({
        ...candidate,
        lineupPosition: position,
      });
    }
  }

  return selected;
};

export const buildBestXI = (
  groupMatches: GroupMatch[],
  knockoutMatches: Record<KnockoutRound, KnockoutMatch[]>,
) => {
  const { registry, teamByName } = buildPlayerRegistry();

  // 1. Calculate progressScore for each team
  const teamProgress = new Map<string, number>();
  for (const team of TEAMS) {
    teamProgress.set(team.id, 0); // Default: eliminated in group stage
  }

  const processLoserProgress = (round: KnockoutRound, progressVal: number) => {
    for (const match of knockoutMatches[round]) {
      if (match.status === 'completed') {
        if (match.loserTeamId) {
          teamProgress.set(match.loserTeamId, progressVal);
        }
        if (match.winnerTeamId) {
          teamProgress.set(match.winnerTeamId, progressVal + 1);
        }
      }
    }
  };

  processLoserProgress('roundOf32', 1);
  processLoserProgress('roundOf16', 2);
  processLoserProgress('quarterfinals', 3);

  const thirdPlaceMatch = knockoutMatches.thirdPlace[0];
  if (thirdPlaceMatch && thirdPlaceMatch.status === 'completed') {
    if (thirdPlaceMatch.loserTeamId) teamProgress.set(thirdPlaceMatch.loserTeamId, 4); // 4th place
    if (thirdPlaceMatch.winnerTeamId) teamProgress.set(thirdPlaceMatch.winnerTeamId, 5); // 3rd place
  }

  const finalMatch = knockoutMatches.final[0];
  if (finalMatch && finalMatch.status === 'completed') {
    if (finalMatch.loserTeamId) teamProgress.set(finalMatch.loserTeamId, 6); // Runner-up
    if (finalMatch.winnerTeamId) teamProgress.set(finalMatch.winnerTeamId, 7); // Champion
  }

  // Update progressScore for all players
  for (const player of registry.values()) {
    player.progressScore = teamProgress.get(player.teamId) || 0;
  }

  // 2. Process all matches to calculate total score
  const processMatchScores = (match: GroupMatch | KnockoutMatch, round: KnockoutRound | null) => {
    if (match.status !== 'completed') return;

    const homeScore = match.homeScore ?? 0;
    const awayScore = match.awayScore ?? 0;
    const isKnockout = round !== null;

    // --- A. Team Points ---
    let winnerTeamId: string | null = null;
    if (isKnockout && 'winnerTeamId' in match && match.winnerTeamId) {
      winnerTeamId = match.winnerTeamId;
    } else if (homeScore > awayScore) {
      winnerTeamId = match.homeTeamId;
    } else if (awayScore > homeScore) {
      winnerTeamId = match.awayTeamId;
    }

    if (winnerTeamId) {
      const winTeam = teamByName.get(TEAMS.find((t) => t.id === winnerTeamId)?.name ?? '');
      if (winTeam) {
        let teamPts = 0;
        if (!isKnockout) {
          teamPts = 0.5; // Group win
        } else if (round === 'semifinals') {
          teamPts = 1; // Semifinal win
        } else if (round === 'roundOf32' || round === 'roundOf16' || round === 'quarterfinals') {
          teamPts = 1; // Knockout win
        }

        if (teamPts > 0) {
          for (const p of winTeam.players) {
            const player = registry.get(`${winTeam.id}:${p.id}`);
            if (player) player.totalScore += teamPts;
          }
        }
      }
    }

    // --- B. Individual Goal Points ---
    const timeline = resolveTimeline(match);
    for (const event of timeline) {
      if (event.isOwnGoal) continue;
      if (!event.teamId) continue;
      const key = `${event.teamId}:${event.playerId}`;
      const player = registry.get(key);
      if (player) {
        player.goals += 1;
        const pos = player.naturalPosition;
        let goalPts = 0;
        if (pos === 'ATT') goalPts = 2;
        else if (pos === 'MID') goalPts = 3;
        else if (pos === 'DEF' || pos === 'GK') goalPts = 5;
        player.totalScore += goalPts;
      }
    }

    // --- C. Clean Sheet Points: GK #1 and DF get +2 pts ---
    const awardCleanSheet = (teamId: string) => {
      const team = teamByName.get(TEAMS.find((t) => t.id === teamId)?.name ?? '');
      if (team) {
        // Goalkeeper #1 only (index 0 in GK array)
        const gks = team.players.filter((p) => p.position === 'GK');
        if (gks.length > 0) {
          const player = registry.get(`${team.id}:${gks[0].id}`);
          if (player) {
            player.cleanSheets += 1;
            player.totalScore += 2;
          }
        }
        // All Defenders (DF)
        for (const p of team.players) {
          if (p.position === 'DF') {
            const player = registry.get(`${team.id}:${p.id}`);
            if (player) {
              player.cleanSheets += 1;
              player.totalScore += 2;
            }
          }
        }
      }
    };

    if (awayScore === 0 && match.homeTeamId) {
      awardCleanSheet(match.homeTeamId);
    }
    if (homeScore === 0 && match.awayTeamId) {
      awardCleanSheet(match.awayTeamId);
    }

    // --- D. MOTM Points: +5 pts ---
    if (match.motm) {
      const motmTeam = teamByName.get(match.motm.teamName);
      if (motmTeam) {
        const motmPlayer = motmTeam.players.find((p) => p.name === match.motm?.playerName);
        if (motmPlayer) {
          const player = registry.get(`${motmTeam.id}:${motmPlayer.id}`);
          if (player) {
            player.motmCount += 1;
            player.totalScore += 5;
          }
        }
      }
    }
  };

  for (const match of groupMatches) {
    processMatchScores(match, null);
  }

  for (const [round, matches] of Object.entries(knockoutMatches) as [KnockoutRound, KnockoutMatch[]][]) {
    for (const match of matches) {
      processMatchScores(match, round);
    }
  }

  // --- E. Champion/Runner-up/Third-place Final Points ---
  if (finalMatch && finalMatch.status === 'completed') {
    const championId = finalMatch.winnerTeamId;
    const runnerUpId = finalMatch.loserTeamId;
    if (championId) {
      const team = teamByName.get(TEAMS.find((t) => t.id === championId)?.name ?? '');
      if (team) {
        for (const p of team.players) {
          const player = registry.get(`${championId}:${p.id}`);
          if (player) player.totalScore += 3;
        }
      }
    }
    if (runnerUpId) {
      const team = teamByName.get(TEAMS.find((t) => t.id === runnerUpId)?.name ?? '');
      if (team) {
        for (const p of team.players) {
          const player = registry.get(`${runnerUpId}:${p.id}`);
          if (player) player.totalScore += 2;
        }
      }
    }
  }

  if (thirdPlaceMatch && thirdPlaceMatch.status === 'completed') {
    const thirdPlaceId = thirdPlaceMatch.winnerTeamId;
    if (thirdPlaceId) {
      const team = teamByName.get(TEAMS.find((t) => t.id === thirdPlaceId)?.name ?? '');
      if (team) {
        for (const p of team.players) {
          const player = registry.get(`${thirdPlaceId}:${p.id}`);
          if (player) player.totalScore += 1.5;
        }
      }
    }
  }

  // 3. Selection of Best XI (4-3-3)
  const sortedPool = Array.from(registry.values()).sort(comparePlayers);
  if (!sortedPool.length) {
    return null;
  }

  const selectedIds = new Set<string>();

  const [goalkeeper] = selectByPosition(sortedPool, selectedIds, 'GK', 1);
  const defenders = selectByPosition(sortedPool, selectedIds, 'DEF', 4);
  const midfielders = selectByPosition(sortedPool, selectedIds, 'MID', 3);
  const attackers = selectByPosition(sortedPool, selectedIds, 'ATT', 3);

  if (!goalkeeper || defenders.length !== 4 || midfielders.length !== 3 || attackers.length !== 3) {
    return null;
  }

  const bestPlayer = sortedPool[0];

  return {
    goalkeeper,
    defenders,
    midfielders,
    attackers,
    bestPlayer,
  } satisfies BestXIResult;
};
