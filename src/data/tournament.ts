import { buildTeamRoster } from './players';
import type {
  GroupId,
  GroupMatch,
  MatchScorers,
  KnockoutMatch,
  KnockoutRound,
  Team,
  TournamentCoreState,
} from '../types/tournament';
import { GROUP_IDS, KNOCKOUT_ROUNDS } from '../types/tournament';

const slugify = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .toLowerCase();

const SHORT_NAME_OVERRIDES: Record<string, string> = {
  'Bosnia & Herzegovina': 'Bosnia',
  'Czech Republic': 'Czechia',
  'United States': 'USA',
  'Ivory Coast': "C. d'Ivoire",
  'South Africa': 'South Africa',
  'South Korea': 'South Korea',
  'Cape Verde': 'Cape Verde',
  'DR Congo': 'DR Congo',
};

const GROUP_DEFINITIONS = [
  {
    id: 'A',
    teams: [
      ['Mexico', 84],
      ['South Africa', 71],
      ['South Korea', 79],
      ['Czech Republic', 74],
    ],
  },
  {
    id: 'B',
    teams: [
      ['Canada', 76],
      ['Bosnia & Herzegovina', 69],
      ['Qatar', 72],
      ['Switzerland', 82],
    ],
  },
  {
    id: 'C',
    teams: [
      ['Brazil', 88],
      ['Morocco', 87],
      ['Haiti', 67],
      ['Scotland', 74],
    ],
  },
  {
    id: 'D',
    teams: [
      ['United States', 83],
      ['Paraguay', 78],
      ['Australia', 78],
      ['Turkey', 81],
    ],
  },
  {
    id: 'E',
    teams: [
      ['Germany', 86],
      ['Curacao', 68],
      ['Ivory Coast', 75],
      ['Ecuador', 80],
    ],
  },
  {
    id: 'F',
    teams: [
      ['Netherlands', 87],
      ['Japan', 82],
      ['Sweden', 80],
      ['Tunisia', 73],
    ],
  },
  {
    id: 'G',
    teams: [
      ['Belgium', 86],
      ['Egypt', 77],
      ['Iran', 81],
      ['New Zealand', 67],
    ],
  },
  {
    id: 'H',
    teams: [
      ['Spain', 90],
      ['Cape Verde', 69],
      ['Saudi Arabia', 70],
      ['Uruguay', 83],
    ],
  },
  {
    id: 'I',
    teams: [
      ['France', 91],
      ['Senegal', 84],
      ['Iraq', 71],
      ['Norway', 76],
    ],
  },
  {
    id: 'J',
    teams: [
      ['Argentina', 90],
      ['Algeria', 77],
      ['Austria', 79],
      ['Jordan', 70],
    ],
  },
  {
    id: 'K',
    teams: [
      ['Portugal', 88],
      ['DR Congo', 73],
      ['Uzbekistan', 72],
      ['Colombia', 85],
    ],
  },
  {
    id: 'L',
    teams: [
      ['England', 89],
      ['Croatia', 85],
      ['Ghana', 68],
      ['Panama', 75],
    ],
  },
] as const;

type TeamTuple = (typeof GROUP_DEFINITIONS)[number]['teams'][number];

const createTeam = (group: GroupId, tuple: TeamTuple): Team => {
  const [name, rating] = tuple;

  return {
    id: slugify(name),
    name,
    shortName: SHORT_NAME_OVERRIDES[name] ?? name,
    group,
    rating,
    players: buildTeamRoster(name),
  };
};

export const TEAMS: Team[] = GROUP_DEFINITIONS.flatMap((groupDefinition) =>
  groupDefinition.teams.map((teamTuple) => createTeam(groupDefinition.id, teamTuple)),
);

export const TEAMS_BY_ID = TEAMS.reduce<Record<string, Team>>((accumulator, team) => {
  accumulator[team.id] = team;
  return accumulator;
}, {});

export const GROUPS = GROUP_IDS.map((groupId) => ({
  id: groupId,
  label: `Group ${groupId}`,
  teams: TEAMS.filter((team) => team.group === groupId),
}));

const GROUP_MATCHUPS = [
  { matchday: 1, homeIndex: 0, awayIndex: 1 },
  { matchday: 1, homeIndex: 2, awayIndex: 3 },
  { matchday: 2, homeIndex: 0, awayIndex: 2 },
  { matchday: 2, homeIndex: 3, awayIndex: 1 },
  { matchday: 3, homeIndex: 3, awayIndex: 0 },
  { matchday: 3, homeIndex: 1, awayIndex: 2 },
] as const;

export const ROUND_LABELS: Record<KnockoutRound, string> = {
  roundOf32: 'Round of 32',
  roundOf16: 'Round of 16',
  quarterfinals: 'Quarter Finals',
  semifinals: 'Semi Finals',
  thirdPlace: 'Third Place Match',
  final: 'Final',
};

export const createInitialGroupMatches = (): GroupMatch[] =>
  GROUPS.flatMap((group) =>
    GROUP_MATCHUPS.map((matchup, index) => ({
      id: `group-${group.id}-${index + 1}`,
      stage: 'group' as const,
      group: group.id,
      matchday: matchup.matchday,
      homeTeamId: group.teams[matchup.homeIndex].id,
      awayTeamId: group.teams[matchup.awayIndex].id,
      homeScore: null,
      awayScore: null,
      scorers: null,
      timeline: null,
      motm: null,
      status: 'pending' as const,
      predictedAt: null,
    })),
  );

const sameTeamPair = (left: GroupMatch, right: GroupMatch) =>
  (left.homeTeamId === right.homeTeamId && left.awayTeamId === right.awayTeamId) ||
  (left.homeTeamId === right.awayTeamId && left.awayTeamId === right.homeTeamId);

const swapScorersSides = (scorers: MatchScorers | null): MatchScorers | null => {
  if (!scorers) {
    return null;
  }

  return {
    home: scorers.away,
    away: scorers.home,
  };
};

export const normalizeGroupMatches = (incomingMatches?: GroupMatch[]): GroupMatch[] => {
  const canonicalMatches = createInitialGroupMatches();

  if (!incomingMatches?.length) {
    return canonicalMatches;
  }

  return canonicalMatches.map((canonicalMatch) => {
    const persistedMatch =
      incomingMatches.find((match) => match.id === canonicalMatch.id) ??
      incomingMatches.find((match) => sameTeamPair(match, canonicalMatch));

    if (!persistedMatch) {
      return canonicalMatch;
    }

    const sameOrientation =
      persistedMatch.homeTeamId === canonicalMatch.homeTeamId &&
      persistedMatch.awayTeamId === canonicalMatch.awayTeamId;
    const reversedOrientation =
      persistedMatch.homeTeamId === canonicalMatch.awayTeamId &&
      persistedMatch.awayTeamId === canonicalMatch.homeTeamId;

    if (sameOrientation) {
      return {
        ...canonicalMatch,
        homeScore: persistedMatch.homeScore,
        awayScore: persistedMatch.awayScore,
        scorers: persistedMatch.scorers,
        timeline: persistedMatch.timeline ?? null,
        motm: persistedMatch.motm ?? null,
        status: persistedMatch.status,
        predictedAt: persistedMatch.predictedAt,
      };
    }

    if (reversedOrientation) {
      return {
        ...canonicalMatch,
        homeScore: persistedMatch.awayScore,
        awayScore: persistedMatch.homeScore,
        scorers: swapScorersSides(persistedMatch.scorers),
        timeline: persistedMatch.timeline
          ? persistedMatch.timeline.map((e) => ({ ...e, side: e.side === 'home' ? 'away' as const : 'home' as const }))
          : null,
        motm: persistedMatch.motm ?? null,
        status: persistedMatch.status,
        predictedAt: persistedMatch.predictedAt,
      };
    }

    return canonicalMatch;
  });
};

export const R32_MATCH_NUMBERS = [74, 77, 73, 75, 83, 84, 81, 82, 76, 78, 79, 80, 86, 88, 85, 87] as const;
export const R16_MATCH_NUMBERS = [89, 90, 93, 94, 91, 92, 95, 96] as const;
export const QF_MATCH_NUMBERS = [97, 98, 99, 100] as const;
export const SF_MATCH_NUMBERS = [101, 102] as const;

const getDefaultSeedLabels = (round: KnockoutRound, slot: number) => {
  switch (round) {
    case 'roundOf16':
      return {
        homeSeedLabel: `Winner M${R32_MATCH_NUMBERS[slot * 2]}`,
        awaySeedLabel: `Winner M${R32_MATCH_NUMBERS[slot * 2 + 1]}`,
      };
    case 'quarterfinals':
      return {
        homeSeedLabel: `Winner M${R16_MATCH_NUMBERS[slot * 2]}`,
        awaySeedLabel: `Winner M${R16_MATCH_NUMBERS[slot * 2 + 1]}`,
      };
    case 'semifinals':
      return {
        homeSeedLabel: `Winner M${QF_MATCH_NUMBERS[slot * 2]}`,
        awaySeedLabel: `Winner M${QF_MATCH_NUMBERS[slot * 2 + 1]}`,
      };
    case 'thirdPlace':
      return {
        homeSeedLabel: 'Loser M101',
        awaySeedLabel: 'Loser M102',
      };
    case 'final':
      return {
        homeSeedLabel: 'Winner M101',
        awaySeedLabel: 'Winner M102',
      };
    default:
      return {
        homeSeedLabel: null,
        awaySeedLabel: null,
      };
  }
};

const createEmptyKnockoutMatch = (round: KnockoutRound, slot: number): KnockoutMatch => {
  const defaultSeeds = getDefaultSeedLabels(round, slot);

  return {
    id: `${round}-${slot + 1}`,
    stage: 'knockout',
    round,
    slot,
    homeTeamId: null,
    awayTeamId: null,
    homeSeedLabel: defaultSeeds.homeSeedLabel,
    awaySeedLabel: defaultSeeds.awaySeedLabel,
    regulationHomeScore: null,
    regulationAwayScore: null,
    extraTimeHomeScore: null,
    extraTimeAwayScore: null,
    homeScore: null,
    awayScore: null,
    scorers: null,
    timeline: null,
    motm: null,
    penalty: null,
    status: 'pending',
    winnerTeamId: null,
    loserTeamId: null,
    predictedAt: null,
  };
};

export const createEmptyKnockoutMatches = (): Record<KnockoutRound, KnockoutMatch[]> => ({
  roundOf32: Array.from({ length: 16 }, (_, index) => createEmptyKnockoutMatch('roundOf32', index)),
  roundOf16: Array.from({ length: 8 }, (_, index) => createEmptyKnockoutMatch('roundOf16', index)),
  quarterfinals: Array.from({ length: 4 }, (_, index) => createEmptyKnockoutMatch('quarterfinals', index)),
  semifinals: Array.from({ length: 2 }, (_, index) => createEmptyKnockoutMatch('semifinals', index)),
  thirdPlace: [createEmptyKnockoutMatch('thirdPlace', 0)],
  final: [createEmptyKnockoutMatch('final', 0)],
});

export const normalizeKnockoutMatches = (
  incomingMatches?: Partial<Record<KnockoutRound, KnockoutMatch[]>>,
): Record<KnockoutRound, KnockoutMatch[]> => {
  const baseMatches = createEmptyKnockoutMatches();

  return KNOCKOUT_ROUNDS.reduce((accumulator, round) => {
    const incomingRound = incomingMatches?.[round] ?? [];

    accumulator[round] = baseMatches[round].map((baseMatch, index) => {
      const persistedMatch = incomingRound[index];

      if (!persistedMatch) {
        return baseMatch;
      }

      const regulationHomeScore = persistedMatch.regulationHomeScore ?? persistedMatch.homeScore ?? null;
      const regulationAwayScore = persistedMatch.regulationAwayScore ?? persistedMatch.awayScore ?? null;
      const shouldMirrorFinalToExtraTime =
        (persistedMatch.status === 'awaiting-penalties' || Boolean(persistedMatch.penalty)) &&
        persistedMatch.extraTimeHomeScore == null &&
        persistedMatch.extraTimeAwayScore == null;

      return {
        ...baseMatch,
        ...persistedMatch,
        homeSeedLabel: persistedMatch.homeSeedLabel ?? baseMatch.homeSeedLabel,
        awaySeedLabel: persistedMatch.awaySeedLabel ?? baseMatch.awaySeedLabel,
        regulationHomeScore,
        regulationAwayScore,
        extraTimeHomeScore: shouldMirrorFinalToExtraTime
          ? persistedMatch.homeScore ?? null
          : persistedMatch.extraTimeHomeScore ?? baseMatch.extraTimeHomeScore,
        extraTimeAwayScore: shouldMirrorFinalToExtraTime
          ? persistedMatch.awayScore ?? null
          : persistedMatch.extraTimeAwayScore ?? baseMatch.extraTimeAwayScore,
      };
    });

    return accumulator;
  }, {} as Record<KnockoutRound, KnockoutMatch[]>);
};

export const createInitialTournamentCoreState = (): TournamentCoreState => ({
  groupMatches: createInitialGroupMatches(),
  knockoutVisible: false,
  knockoutMatches: createEmptyKnockoutMatches(),
  scenario: 'standard',
});

export { GROUP_IDS, KNOCKOUT_ROUNDS };
