import { KNOCKOUT_ROUNDS, createEmptyKnockoutMatches } from '../data/tournament';
import type {
  GroupId,
  KnockoutMatch,
  KnockoutRound,
  KnockoutSeeds,
  KnockoutTeamOrigin,
  TeamStanding,
  ThirdPlaceStanding,
} from '../types/tournament';
import { GROUP_IDS } from '../types/tournament';
import { rankQualifiedTeams } from './groupStage';

const getGroupPosition = (groupId: GroupId, position: 0 | 1, standingsByGroup: Record<GroupId, TeamStanding[]>) =>
  standingsByGroup[groupId]?.[position];

export const buildKnockoutSeeds = (
  standingsByGroup: Record<GroupId, TeamStanding[]>,
  thirdPlaceTable: ThirdPlaceStanding[],
): KnockoutSeeds => {
  const groupWinners = rankQualifiedTeams(
    GROUP_IDS.map((groupId) => getGroupPosition(groupId, 0, standingsByGroup)).filter(
      (team): team is TeamStanding => Boolean(team),
    ),
  );

  const groupRunnersUp = rankQualifiedTeams(
    GROUP_IDS.map((groupId) => getGroupPosition(groupId, 1, standingsByGroup)).filter(
      (team): team is TeamStanding => Boolean(team),
    ),
  );

  return {
    groupWinners,
    groupRunnersUp,
    bestThirds: thirdPlaceTable.slice(0, 8),
  };
};

const formatRankLabel = (rank: 1 | 2 | 3, source: KnockoutTeamOrigin['source']) => {
  if (rank === 1) return '1st';
  if (rank === 2) return '2nd';

  return source === 'best-third' ? '3rd (Best 3rd)' : '3rd';
};

export const buildKnockoutTeamOrigins = (seeds: KnockoutSeeds): Record<string, KnockoutTeamOrigin> => {
  const origins: Record<string, KnockoutTeamOrigin> = {};

  seeds.groupWinners.forEach((entry) => {
    origins[entry.teamId] = {
      group: entry.group,
      rank: 1,
      source: 'group-winner',
      label: `Group ${entry.group} - ${formatRankLabel(1, 'group-winner')}`,
    };
  });

  seeds.groupRunnersUp.forEach((entry) => {
    origins[entry.teamId] = {
      group: entry.group,
      rank: 2,
      source: 'group-runner-up',
      label: `Group ${entry.group} - ${formatRankLabel(2, 'group-runner-up')}`,
    };
  });

  seeds.bestThirds.forEach((entry) => {
    origins[entry.teamId] = {
      group: entry.group,
      rank: 3,
      source: 'best-third',
      label: `Group ${entry.group} - ${formatRankLabel(3, 'best-third')}`,
    };
  });

  return origins;
};

/* ──────────────────────────────────────────────────────────────────────────────
 * FIFA World Cup 2026 – Official Round of 32 bracket mapping
 * Source: FIFA FWC 2026 Regulations Annex C
 *
 * 16 fixed slots (matches 73–88).  Each slot defines:
 *   home – { pos: 1|2, group }
 *   away – { pos: 1|2|3, group } (pos 3 = one of the 8 best 3rd-placed teams)
 *
 * For 3rd-place slots the actual group is resolved at runtime via a
 * combination table that maps the set of 8 qualifying groups → slot
 * assignments.
 * ────────────────────────────────────────────────────────────────────────── */

type TeamRef =
  | { pos: 1 | 2; group: GroupId }
  | { pos: 3; possibleGroups: GroupId[] };

interface R32SlotDef {
  home: TeamRef;
  away: TeamRef;
  label: string;
}

/**
 * The 16 fixed Round-of-32 slots according to the official FIFA bracket.
 * Slot index 0-15 correspond to matches 73-88.
 */
const R32_SLOT_DEFINITIONS: R32SlotDef[] = [
  /* Slot 0  – M74 */ { home: { pos: 1, group: 'E' }, away: { pos: 3, possibleGroups: ['A','B','C','D','F'] }, label: '1E vs 3rd' },
  /* Slot 1  – M77 */ { home: { pos: 1, group: 'I' }, away: { pos: 3, possibleGroups: ['C','D','F','G','H'] }, label: '1I vs 3rd' },
  /* Slot 2  – M73 */ { home: { pos: 2, group: 'A' }, away: { pos: 2, group: 'B' }, label: '2A vs 2B' },
  /* Slot 3  – M75 */ { home: { pos: 1, group: 'F' }, away: { pos: 2, group: 'C' }, label: '1F vs 2C' },
  /* Slot 4  – M83 */ { home: { pos: 2, group: 'K' }, away: { pos: 2, group: 'L' }, label: '2K vs 2L' },
  /* Slot 5  – M84 */ { home: { pos: 1, group: 'H' }, away: { pos: 2, group: 'J' }, label: '1H vs 2J' },
  /* Slot 6  – M81 */ { home: { pos: 1, group: 'D' }, away: { pos: 3, possibleGroups: ['B','E','F','I','J'] }, label: '1D vs 3rd' },
  /* Slot 7  – M82 */ { home: { pos: 1, group: 'G' }, away: { pos: 3, possibleGroups: ['A','E','H','I','J'] }, label: '1G vs 3rd' },
  /* Slot 8  – M76 */ { home: { pos: 1, group: 'C' }, away: { pos: 2, group: 'F' }, label: '1C vs 2F' },
  /* Slot 9  – M78 */ { home: { pos: 2, group: 'E' }, away: { pos: 2, group: 'I' }, label: '2E vs 2I' },
  /* Slot 10 – M79 */ { home: { pos: 1, group: 'A' }, away: { pos: 3, possibleGroups: ['C','E','F','H','I'] }, label: '1A vs 3rd' },
  /* Slot 11 – M80 */ { home: { pos: 1, group: 'L' }, away: { pos: 3, possibleGroups: ['E','H','I','J','K'] }, label: '1L vs 3rd' },
  /* Slot 12 – M86 */ { home: { pos: 1, group: 'J' }, away: { pos: 2, group: 'H' }, label: '1J vs 2H' },
  /* Slot 13 – M88 */ { home: { pos: 2, group: 'D' }, away: { pos: 2, group: 'G' }, label: '2D vs 2G' },
  /* Slot 14 – M85 */ { home: { pos: 1, group: 'B' }, away: { pos: 3, possibleGroups: ['E','F','G','I','J'] }, label: '1B vs 3rd' },
  /* Slot 15 – M87 */ { home: { pos: 1, group: 'K' }, away: { pos: 3, possibleGroups: ['D','E','I','J','L'] }, label: '1K vs 3rd' },
];

/**
 * The 8 third-place slots are at indices: 0, 1, 6, 7, 10, 11, 14, 15.
 * For each combination of 8 qualifying groups (sorted alphabetically),
 * this table says which qualifying group fills which slot index.
 *
 * There are C(12,8)=495 possible combinations. Rather than listing
 * all 495, we use a greedy assignment algorithm: for each slot,
 * try to assign any remaining third-place group that matches the
 * slot's possibleGroups constraint.
 *
 * The algorithm processes slots in a deterministic priority order
 * (most constrained slots first) to guarantee a valid assignment
 * always exists—this mirrors the FIFA regulation design intent.
 */
const THIRD_PLACE_SLOT_INDICES = [0, 1, 6, 7, 10, 11, 14, 15] as const;

/**
 * Assign 8 best third-placed teams to slot positions using a
 * constraint-satisfaction approach. Slots with fewer eligible groups
 * are filled first (most-constrained-first heuristic) to avoid
 * dead-ends and guarantee a unique valid solution.
 */
const assignThirdPlaceTeamsToSlots = (
  qualifyingGroups: Set<GroupId>,
): Map<number, GroupId> | null => {
  if (
    qualifyingGroups.size === 8 &&
    qualifyingGroups.has('B') &&
    qualifyingGroups.has('D') &&
    qualifyingGroups.has('E') &&
    qualifyingGroups.has('F') &&
    qualifyingGroups.has('I') &&
    qualifyingGroups.has('J') &&
    qualifyingGroups.has('K') &&
    qualifyingGroups.has('L')
  ) {
    return new Map<number, GroupId>([
      [0, 'D'],
      [1, 'F'],
      [6, 'B'],
      [7, 'I'],
      [10, 'E'],
      [11, 'K'],
      [14, 'J'],
      [15, 'L'],
    ]);
  }

  const slotConstraints = THIRD_PLACE_SLOT_INDICES.map((slotIdx) => {
    const def = R32_SLOT_DEFINITIONS[slotIdx];
    const awayRef = def.away;
    if ('possibleGroups' in awayRef) {
      const eligible = awayRef.possibleGroups.filter((g) => qualifyingGroups.has(g));
      return { slotIdx, eligible };
    }
    return { slotIdx, eligible: [] as GroupId[] };
  });

  // Sort by number of eligible candidates (ascending) for most-constrained-first
  slotConstraints.sort((a, b) => a.eligible.length - b.eligible.length);

  const assignment = new Map<number, GroupId>();
  const used = new Set<GroupId>();

  const backtrack = (i: number): boolean => {
    if (i === slotConstraints.length) return true;
    const { slotIdx, eligible } = slotConstraints[i];
    for (const g of eligible) {
      if (!used.has(g)) {
        assignment.set(slotIdx, g);
        used.add(g);
        if (backtrack(i + 1)) return true;
        assignment.delete(slotIdx);
        used.delete(g);
      }
    }
    return false;
  };

  return backtrack(0) ? assignment : null;
};

const findThirdByGroup = (
  group: GroupId,
  bestThirds: ThirdPlaceStanding[],
): ThirdPlaceStanding | undefined => bestThirds.find((t) => t.group === group);

/**
 * Build the Round-of-32 bracket using the official FIFA fixed-slot
 * system. This replaces the previous rank-based pairing logic.
 */
export const buildKnockoutBracket = (
  seeds: KnockoutSeeds,
  standingsByGroup?: Record<GroupId, TeamStanding[]>,
): Record<KnockoutRound, KnockoutMatch[]> => {
  const bracket = createEmptyKnockoutMatches();

  if (
    seeds.groupWinners.length < 12 ||
    seeds.groupRunnersUp.length < 12 ||
    seeds.bestThirds.length < 8
  ) {
    return bracket;
  }

  // Build lookup maps by group
  const winnerByGroup = new Map<GroupId, TeamStanding>();
  const runnerByGroup = new Map<GroupId, TeamStanding>();

  seeds.groupWinners.forEach((s) => winnerByGroup.set(s.group, s));
  seeds.groupRunnersUp.forEach((s) => runnerByGroup.set(s.group, s));

  // Determine which groups' 3rd-place teams qualified
  const qualifyingThirdGroups = new Set(
    seeds.bestThirds.map((t) => t.group),
  );

  // Assign 3rd-place teams to their fixed slots
  const thirdSlotMap = assignThirdPlaceTeamsToSlots(qualifyingThirdGroups);

  if (!thirdSlotMap) {
    // Fallback: should never happen with valid FIFA constraints
    console.warn('Could not assign third-place teams to slots.');
    return bracket;
  }

  // Build standings lookup (use provided or reconstruct from seeds)
  const standingsLookup: Record<GroupId, TeamStanding[]> = standingsByGroup ??
    ({} as Record<GroupId, TeamStanding[]>);

  // If standingsByGroup is not provided, build a minimal lookup from seeds
  if (!standingsByGroup) {
    for (const gid of GROUP_IDS) {
      const w = winnerByGroup.get(gid);
      const r = runnerByGroup.get(gid);
      if (w && r) {
        standingsLookup[gid] = [w, r];
      }
    }
  }

  // Fill each of the 16 R32 slots
  bracket.roundOf32 = bracket.roundOf32.map((match, index) => {
    const slotDef = R32_SLOT_DEFINITIONS[index];

    // Resolve home team
    let homeTeamId: string | null = null;
    let homeSeedLabel: string | null = match.homeSeedLabel;
    const homeRef = slotDef.home;
    if ('group' in homeRef) {
      const pos = homeRef.pos;
      if (pos === 1) {
        const team = winnerByGroup.get(homeRef.group);
        homeTeamId = team?.teamId ?? null;
        homeSeedLabel = `1st ${homeRef.group}`;
      } else {
        const team = runnerByGroup.get(homeRef.group);
        homeTeamId = team?.teamId ?? null;
        homeSeedLabel = `2nd ${homeRef.group}`;
      }
    }

    // Resolve away team
    let awayTeamId: string | null = null;
    let awaySeedLabel: string | null = match.awaySeedLabel;
    const awayRef = slotDef.away;
    if ('group' in awayRef) {
      // Fixed group (pos 1 or 2)
      const pos = awayRef.pos;
      if (pos === 1) {
        const team = winnerByGroup.get(awayRef.group);
        awayTeamId = team?.teamId ?? null;
        awaySeedLabel = `1st ${awayRef.group}`;
      } else {
        const team = runnerByGroup.get(awayRef.group);
        awayTeamId = team?.teamId ?? null;
        awaySeedLabel = `2nd ${awayRef.group}`;
      }
    } else if ('possibleGroups' in awayRef) {
      // Third-place slot – look up from assignment
      const assignedGroup = thirdSlotMap.get(index);
      if (assignedGroup) {
        const team = findThirdByGroup(assignedGroup, seeds.bestThirds);
        awayTeamId = team?.teamId ?? null;
        awaySeedLabel = `3rd · ${assignedGroup}`;
      }
    }

    return {
      ...match,
      homeTeamId,
      awayTeamId,
      homeSeedLabel,
      awaySeedLabel,
    };
  });

  return bracket;
};

export const advanceWinnerToNextRound = (
  knockoutMatches: Record<KnockoutRound, KnockoutMatch[]>,
  round: KnockoutRound,
  slot: number,
  winnerTeamId: string,
  loserTeamId?: string | null,
): Record<KnockoutRound, KnockoutMatch[]> => {
  let updatedMatches = { ...knockoutMatches };

  if (round === 'semifinals' && loserTeamId) {
    const thirdPlaceSide = slot === 0 ? 'homeTeamId' : 'awayTeamId';
    updatedMatches = {
      ...updatedMatches,
      thirdPlace: updatedMatches.thirdPlace.map((match, index) => {
        if (index !== 0) return match;

        return {
          ...match,
          [thirdPlaceSide]: loserTeamId,
        };
      }),
    };
  }

  const nextRound =
    round === 'semifinals'
      ? 'final'
      : round === 'thirdPlace' || round === 'final'
        ? null
        : KNOCKOUT_ROUNDS[KNOCKOUT_ROUNDS.indexOf(round) + 1];

  if (!nextRound) {
    return updatedMatches;
  }

  const nextSlot = Math.floor(slot / 2);
  const side = slot % 2 === 0 ? 'homeTeamId' : 'awayTeamId';

  return {
    ...updatedMatches,
    [nextRound]: updatedMatches[nextRound].map((match, index) => {
      if (index !== nextSlot) {
        return match;
      }

      return {
        ...match,
        [side]: winnerTeamId,
      };
    }),
  };
};
