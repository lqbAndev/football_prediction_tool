import { startTransition, useEffect, useState } from 'react';
import {
  TEAMS_BY_ID,
  createInitialTournamentCoreState,
  normalizeGroupMatches,
  normalizeKnockoutMatches,
} from '../data/tournament';
import type {
  KnockoutRound,
  PersistedTournamentState,
  TournamentCoreState,
  TournamentDerivedState,
  TournamentScenario,
} from '../types/tournament';
import {
  STORAGE_VERSION,
  clearPersistedTournament,
  readPersistedTournament,
  writePersistedTournament,
} from '../utils/storage';
import {
  computeStandingsByGroup,
  computeThirdPlaceTable,
  findChampionName,
  getQualifiedTeamIds,
  isGroupStageComplete,
} from '../utils/groupStage';
import {
  advanceWinnerToNextRound,
  buildKnockoutBracket,
  buildKnockoutSeeds,
  buildKnockoutTeamOrigins,
} from '../utils/knockout';
import { buildSeasonMOTM, computeMatchMOTM } from '../utils/motm';
import { simulateGroupMatch, simulateKnockoutRegulation, simulatePenaltyShootout } from '../utils/random';
import { buildTopScorers } from '../utils/topScorers';

const deriveTournamentState = (core: TournamentCoreState): TournamentDerivedState => {
  const standingsByGroup = computeStandingsByGroup(core.groupMatches);
  const groupStageComplete = isGroupStageComplete(core.groupMatches);
  const thirdPlaceTable = computeThirdPlaceTable(standingsByGroup, groupStageComplete);
  const knockoutSeeds = buildKnockoutSeeds(standingsByGroup, thirdPlaceTable);
  const knockoutReady =
    groupStageComplete &&
    knockoutSeeds.groupWinners.length === 12 &&
    knockoutSeeds.groupRunnersUp.length === 12 &&
    knockoutSeeds.bestThirds.length === 8;
  const knockoutTeamOrigins = knockoutReady ? buildKnockoutTeamOrigins(knockoutSeeds) : {};
  const qualifiedTeamIds = knockoutReady ? getQualifiedTeamIds(standingsByGroup, thirdPlaceTable) : [];
  const topScorers = buildTopScorers(core.groupMatches, core.knockoutMatches);
  const seasonMOTM = buildSeasonMOTM(core.groupMatches, core.knockoutMatches);
  const championTeamId = core.knockoutMatches.final[0]?.winnerTeamId ?? null;

  return {
    standingsByGroup,
    thirdPlaceTable,
    topScorers,
    seasonMOTM,
    qualifiedTeamIds,
    groupStageComplete,
    knockoutReady,
    knockoutSeeds,
    knockoutTeamOrigins,
    championTeamId,
    championName: findChampionName(championTeamId),
  };
};

const normalizeCoreState = (state: TournamentCoreState): TournamentCoreState => ({
  ...state,
  groupMatches: normalizeGroupMatches(state.groupMatches),
  knockoutMatches: normalizeKnockoutMatches(state.knockoutMatches),
});

const getInitialCoreState = (): TournamentCoreState => {
  const persisted = readPersistedTournament();

  if (!persisted?.core) {
    return createInitialTournamentCoreState();
  }

  const base = normalizeCoreState(persisted.core);
  return { ...base, scenario: base.scenario ?? 'standard' };
};

const hasInitializedKnockout = (state: TournamentCoreState) =>
  Object.values(state.knockoutMatches).some((matches) =>
    matches.some(
      (match) =>
        match.homeTeamId !== null ||
        match.awayTeamId !== null ||
        match.status !== 'pending' ||
        match.winnerTeamId !== null,
    ),
  );

export const useTournament = () => {
  const [coreState, setCoreState] = useState<TournamentCoreState>(() => getInitialCoreState());
  const derivedState = deriveTournamentState(coreState);

  useEffect(() => {
    const payload: PersistedTournamentState = {
      version: STORAGE_VERSION,
      core: coreState,
      derived: {
        standingsByGroup: derivedState.standingsByGroup,
        thirdPlaceTable: derivedState.thirdPlaceTable,
        topScorers: derivedState.topScorers,
        seasonMOTM: derivedState.seasonMOTM,
        qualifiedTeamIds: derivedState.qualifiedTeamIds,
        groupStageComplete: derivedState.groupStageComplete,
        knockoutReady: derivedState.knockoutReady,
        knockoutTeamOrigins: derivedState.knockoutTeamOrigins,
        championTeamId: derivedState.championTeamId,
        championName: derivedState.championName,
      },
      updatedAt: new Date().toISOString(),
    };

    writePersistedTournament(payload);
  }, [coreState, derivedState]);

  const predictGroupMatch = (matchId: string) => {
    setCoreState((currentState) => ({
      ...currentState,
      groupMatches: currentState.groupMatches.map((match) => {
        if (match.id !== matchId || match.status === 'completed') {
          return match;
        }

        return simulateGroupMatch(
          match,
          TEAMS_BY_ID[match.homeTeamId],
          TEAMS_BY_ID[match.awayTeamId],
          currentState.scenario ?? 'standard',
        );
      }),
    }));
  };

  const applyRealResult = (matchId: string, data: any) => {
    setCoreState((currentState) => {
      const groupMatchIndex = currentState.groupMatches.findIndex(m => m.id === matchId);
      if (groupMatchIndex !== -1) {
        const match = currentState.groupMatches[groupMatchIndex];
        if (match.status === 'completed') {
          return currentState;
        }

        const homeTeam = TEAMS_BY_ID[match.homeTeamId];
        const awayTeam = TEAMS_BY_ID[match.awayTeamId];

        const timeline: import('../types/tournament').TimelineEvent[] = [];
        const scorers: import('../types/tournament').MatchScorers = { home: [], away: [] };

        if (data.scorers && Array.isArray(data.scorers)) {
          data.scorers.forEach((s: any) => {
            const side = s.side;
            const teamId = side === 'home' ? match.homeTeamId : match.awayTeamId;
            const team = side === 'home' ? homeTeam : awayTeam;

            const queryName = s.playerName.trim().toUpperCase();
            let matchedPlayer = team.players.find(p => p.name.toUpperCase() === queryName);
            if (!matchedPlayer) {
              matchedPlayer = team.players.find(p => p.name.toUpperCase().includes(queryName) || queryName.includes(p.name.toUpperCase()));
            }
            if (!matchedPlayer) {
              matchedPlayer = team.players[0];
            }

            const goalEvent: import('../types/tournament').GoalEvent = {
              minute: s.minute,
              playerId: matchedPlayer.id,
              playerName: matchedPlayer.name,
              teamId: teamId
            };

            if (side === 'home') {
              scorers.home.push(goalEvent);
            } else {
              scorers.away.push(goalEvent);
            }

            timeline.push({
              sortMinute: s.minute,
              displayMinute: `${s.minute}'`,
              playerName: matchedPlayer.name,
              playerId: matchedPlayer.id,
              teamId: teamId,
              side: side,
              isPenalty: !!s.isPenalty,
              phase: 'regulation'
            });
          });
        }

        timeline.sort((a, b) => a.sortMinute - b.sortMinute);

        let motm: import('../types/tournament').MatchMOTM | null = null;
        if (data.motm && data.motm.playerName) {
          const motmTeamName = data.motm.teamName;
          let motmTeamId = match.homeTeamId;
          if (motmTeamName.toLowerCase() === awayTeam.name.toLowerCase() || motmTeamName.toLowerCase() === awayTeam.shortName.toLowerCase()) {
            motmTeamId = match.awayTeamId;
          }
          const motmTeam = TEAMS_BY_ID[motmTeamId];
          const queryMotmName = data.motm.playerName.trim().toUpperCase();
          let matchedMotmPlayer = motmTeam.players.find(p => p.name.toUpperCase() === queryMotmName);
          if (!matchedMotmPlayer) {
            matchedMotmPlayer = motmTeam.players.find(p => p.name.toUpperCase().includes(queryMotmName) || queryMotmName.includes(p.name.toUpperCase()));
          }
          if (!matchedMotmPlayer) {
            matchedMotmPlayer = motmTeam.players[0];
          }

          motm = {
            playerName: matchedMotmPlayer.name,
            teamName: motmTeam.name,
            reason: 'performance-points'
          };
        }

        const updatedMatch: import('../types/tournament').GroupMatch = {
          ...match,
          homeScore: data.homeScore,
          awayScore: data.awayScore,
          scorers,
          timeline,
          motm,
          status: 'completed',
          predictedAt: new Date().toISOString()
        };

        const nextGroupMatches = currentState.groupMatches.map((m) => (m.id === matchId ? updatedMatch : m));

        return {
          ...currentState,
          groupMatches: nextGroupMatches
        };
      }

      return currentState;
    });
  };

  const openKnockoutStage = () => {
    startTransition(() => {
      setCoreState((currentState) => {
        const normalizedState = normalizeCoreState(currentState);
        const currentDerivedState = deriveTournamentState(normalizedState);

        if (!currentDerivedState.knockoutReady) {
          return normalizedState;
        }

        const knockoutMatches = hasInitializedKnockout(normalizedState)
          ? normalizedState.knockoutMatches
          : buildKnockoutBracket(currentDerivedState.knockoutSeeds, currentDerivedState.standingsByGroup);

        return {
          ...normalizedState,
          knockoutVisible: true,
          knockoutMatches,
        };
      });
    });
  };

  const predictKnockoutMatch = (round: KnockoutRound, matchId: string) => {
    setCoreState((currentState) => {
      const roundMatches = currentState.knockoutMatches[round];
      const targetMatch = roundMatches.find((match) => match.id === matchId);

      if (
        !targetMatch ||
        targetMatch.status !== 'pending' ||
        !targetMatch.homeTeamId ||
        !targetMatch.awayTeamId
      ) {
        return currentState;
      }

      const updatedMatch = simulateKnockoutRegulation(
        targetMatch,
        TEAMS_BY_ID[targetMatch.homeTeamId],
        TEAMS_BY_ID[targetMatch.awayTeamId],
        // Knockout stage always uses 'standard' (pure 50/50) — no rating bias
        'standard',
      );

      let nextKnockoutState: TournamentCoreState['knockoutMatches'] = {
        ...currentState.knockoutMatches,
        [round]: roundMatches.map((match) => (match.id === matchId ? updatedMatch : match)),
      };

      if (updatedMatch.status === 'completed' && updatedMatch.winnerTeamId) {
        nextKnockoutState = advanceWinnerToNextRound(
          nextKnockoutState,
          round,
          updatedMatch.slot,
          updatedMatch.winnerTeamId,
          updatedMatch.loserTeamId,
        );
      }

      return {
        ...currentState,
        knockoutMatches: nextKnockoutState,
      };
    });
  };

  const resolvePenalty = (round: KnockoutRound, matchId: string) => {
    setCoreState((currentState) => {
      const roundMatches = currentState.knockoutMatches[round];
      const targetMatch = roundMatches.find((match) => match.id === matchId);

      if (
        !targetMatch ||
        targetMatch.status !== 'awaiting-penalties' ||
        !targetMatch.homeTeamId ||
        !targetMatch.awayTeamId
      ) {
        return currentState;
      }

      const penaltyResult = simulatePenaltyShootout(
        TEAMS_BY_ID[targetMatch.homeTeamId],
        TEAMS_BY_ID[targetMatch.awayTeamId],
      );
      const penalty: import('../types/tournament').PenaltyShootout = { home: penaltyResult.home, away: penaltyResult.away };
      const winnerTeamId = penalty.home > penalty.away ? targetMatch.homeTeamId : targetMatch.awayTeamId;
      const loserTeamId = winnerTeamId === targetMatch.homeTeamId ? targetMatch.awayTeamId : targetMatch.homeTeamId;
      const completedMatch: typeof targetMatch = {
        ...targetMatch,
        penalty,
        penaltyTimeline: penaltyResult.timeline,
        motm: null,
        status: 'completed' as const,
        winnerTeamId,
        loserTeamId,
      };
      const updatedMatch: typeof targetMatch = {
        ...completedMatch,
        motm: computeMatchMOTM(completedMatch),
      };

      let nextKnockoutState: TournamentCoreState['knockoutMatches'] = {
        ...currentState.knockoutMatches,
        [round]: roundMatches.map((match) => (match.id === matchId ? updatedMatch : match)),
      };

      nextKnockoutState = advanceWinnerToNextRound(
        nextKnockoutState,
        round,
        updatedMatch.slot,
        winnerTeamId,
        loserTeamId,
      );

      return {
        ...currentState,
        knockoutMatches: nextKnockoutState,
      };
    });
  };

  const resetTournament = () => {
    clearPersistedTournament();
    startTransition(() => {
      setCoreState(createInitialTournamentCoreState());
    });
  };

  const setScenario = (scenario: TournamentScenario) => {
    setCoreState((prev) => ({ ...prev, scenario }));
  };

  return {
    coreState,
    derivedState,
    predictGroupMatch,
    applyRealResult,
    openKnockoutStage,
    predictKnockoutMatch,
    resolvePenalty,
    resetTournament,
    setScenario,
  };
};
