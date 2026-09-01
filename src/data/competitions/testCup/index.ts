/**
 * Test Cup — Competition module entry point.
 *
 * Registers the Test Cup (8 teams, 2 groups) into the competition registry.
 * This module uses the dynamic engine for all generation — proving the
 * decoupled architecture works for non-WC26 formats.
 *
 * NOTE: For local testing only — not deployed to GitHub.
 */

import { registerCompetition } from '../registry';
import type { CompetitionDefinition } from '../registry';
import { testCupConfig } from './config';
import { TEST_CUP_TEAMS, TEST_CUP_TEAMS_BY_ID, TEST_CUP_GROUPS, TEST_CUP_GROUP_IDS } from './teams';
import {
  createDynamicGroupMatches,
  createDynamicKnockoutMatches,
  buildDynamicRoundLabels,
  buildDynamicKnockoutRounds,
} from '../dynamicEngine';

const testCupDefinition: CompetitionDefinition = {
  config: testCupConfig,
  teams: TEST_CUP_TEAMS,
  teamsById: TEST_CUP_TEAMS_BY_ID,
  groups: TEST_CUP_GROUPS,
  groupIds: TEST_CUP_GROUP_IDS,
  createInitialGroupMatches: () => createDynamicGroupMatches(TEST_CUP_GROUPS),
  createEmptyKnockoutMatches: () => createDynamicKnockoutMatches(testCupConfig),
  knockoutRounds: buildDynamicKnockoutRounds(testCupConfig),
  roundLabels: buildDynamicRoundLabels(testCupConfig),
};

registerCompetition(testCupDefinition);

export { testCupConfig } from './config';
export { testCupDefinition };
