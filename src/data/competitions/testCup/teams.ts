/**
 * Test Cup — 8 fictional teams for engine validation.
 *
 * Each team has a minimal roster generated via buildTeamRoster fallback.
 */

import type { Team } from '../../../types/tournament';
import { buildTeamRoster } from '../../players';

const slugify = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .toLowerCase();

/**
 * 8 fictional teams across 2 groups of 4.
 * Group A: Alpha FC, Bravo FC, Charlie FC, Delta FC
 * Group B: Echo FC, Foxtrot FC, Golf FC, Hotel FC
 */
const TEST_GROUP_DEFINITIONS = [
  {
    id: 'A',
    teams: [
      ['Alpha FC', 82] as const,
      ['Bravo FC', 75] as const,
      ['Charlie FC', 70] as const,
      ['Delta FC', 68] as const,
    ],
  },
  {
    id: 'B',
    teams: [
      ['Echo FC', 80] as const,
      ['Foxtrot FC', 77] as const,
      ['Golf FC', 72] as const,
      ['Hotel FC', 65] as const,
    ],
  },
];

const createTestTeam = (group: string, tuple: readonly [string, number]): Team => {
  const [name, rating] = tuple;
  return {
    id: slugify(name),
    name,
    shortName: name,
    group: group as any,
    rating,
    players: buildTeamRoster(name),
  };
};

export const TEST_CUP_TEAMS: Team[] = TEST_GROUP_DEFINITIONS.flatMap((groupDef) =>
  groupDef.teams.map((tuple) => createTestTeam(groupDef.id, tuple)),
);

export const TEST_CUP_TEAMS_BY_ID = TEST_CUP_TEAMS.reduce<Record<string, Team>>((acc, team) => {
  acc[team.id] = team;
  return acc;
}, {});

export const TEST_CUP_GROUPS = TEST_GROUP_DEFINITIONS.map((groupDef) => ({
  id: groupDef.id,
  label: `Bảng ${groupDef.id}`,
  teams: TEST_CUP_TEAMS.filter((t) => t.group === groupDef.id),
}));

export const TEST_CUP_GROUP_IDS = TEST_GROUP_DEFINITIONS.map((g) => g.id);
