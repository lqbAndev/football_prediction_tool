import type { Team } from '../types/tournament';
import type { LeagueMatch } from '../types/leagueConfig';
import { PRESET_UCL_FIXTURES } from '../data/competitions/ucl2627/presetFixtures';

export const UCL_COUNTRY_MAP: Record<string, string> = {
  bayern: 'GER',
  'real-madrid': 'ESP',
  psg: 'FRA',
  'man-city': 'ENG',
  liverpool: 'ENG',
  inter: 'ITA',
  arsenal: 'ENG',
  barcelona: 'ESP',
  atletico: 'ESP',
  dortmund: 'GER',
  roma: 'ITA',
  sporting: 'POR',
  'aston-villa': 'ENG',
  porto: 'POR',
  'man-united': 'ENG',
  'club-brugge': 'BEL',
  'real-betis': 'ESP',
  psv: 'NED',
  napoli: 'ITA',
  leipzig: 'GER',
  villarreal: 'ESP',
  feyenoord: 'NED',
  lille: 'FRA',
  galatasaray: 'TUR',
  fenerbahce: 'TUR',
  shakhtar: 'UKR',
  'bodo-glimt': 'NOR',
  stuttgart: 'GER',
  lens: 'FRA',
  'slavia-praha': 'CZE',
  como: 'ITA',
  aek: 'GRE',
  lask: 'AUT',
  'slovan-bratislava': 'SVK',
  viking: 'NOR',
  sabah: 'AZE',
};

/**
 * Same directed fixture in both 2024/25 and 2025/26 league phases.
 * UEFA 2026/27 does not allow it for a third consecutive season at the same venue.
 */
export const UCL_THREE_SEASON_HOME_BLOCKLIST = new Set([
  'liverpool|real-madrid',
  'inter|arsenal',
]);

type Venue = 'H' | 'A';
type Pot = 1 | 2 | 3 | 4;

export interface UCLDrawValidation {
  valid: boolean;
  errors: string[];
}

const POTS: Pot[] = [1, 2, 3, 4];
const MATCHDAYS = [1, 2, 3, 4, 5, 6, 7, 8] as const;
const MUTATION_ATTEMPTS = 180;

const shuffle = <T,>(items: readonly T[]): T[] => {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1));
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
};

const maxVenueRun = (venues: Venue[]) => {
  let maximum = 0;
  let current = 0;
  let previous: Venue | null = null;
  venues.forEach((venue) => {
    current = venue === previous ? current + 1 : 1;
    maximum = Math.max(maximum, current);
    previous = venue;
  });
  return maximum;
};

export const validateRandomSwissDraw = (fixtures: LeagueMatch[], teams: Team[]): UCLDrawValidation => {
  const errors: string[] = [];
  const teamMap = new Map(teams.map((team) => [team.id, team]));

  if (teams.length !== 36) errors.push(`Expected 36 teams, received ${teams.length}.`);
  POTS.forEach((pot) => {
    const count = teams.filter((team) => team.pot === pot).length;
    if (count !== 9) errors.push(`Pot ${pot} must contain 9 teams, received ${count}.`);
  });
  teams.forEach((team) => {
    if (!UCL_COUNTRY_MAP[team.id]) errors.push(`Missing association for ${team.id}.`);
  });
  if (fixtures.length !== 144) errors.push(`Expected 144 fixtures, received ${fixtures.length}.`);

  MATCHDAYS.forEach((matchday) => {
    const matches = fixtures.filter((fixture) => fixture.matchweek === matchday);
    const participants = matches.flatMap((fixture) => [fixture.homeTeamId, fixture.awayTeamId]);
    if (matches.length !== 18) errors.push(`Matchday ${matchday} must contain 18 matches.`);
    if (new Set(participants).size !== 36) errors.push(`Matchday ${matchday} does not contain 36 unique teams.`);
  });

  teams.forEach((team) => {
    const matches = fixtures.filter((fixture) => fixture.homeTeamId === team.id || fixture.awayTeamId === team.id);
    const opponents = matches.map((fixture) => fixture.homeTeamId === team.id ? fixture.awayTeamId : fixture.homeTeamId);
    if (matches.length !== 8) errors.push(`${team.id} must play 8 matches.`);
    if (new Set(opponents).size !== 8) errors.push(`${team.id} does not have 8 unique opponents.`);

    const associationCounts: Record<string, number> = {};
    opponents.forEach((opponentId) => {
      const association = UCL_COUNTRY_MAP[opponentId];
      associationCounts[association] = (associationCounts[association] || 0) + 1;
      if (association === UCL_COUNTRY_MAP[team.id]) errors.push(`${team.id} was paired with same-association club ${opponentId}.`);
    });
    Object.entries(associationCounts).forEach(([association, count]) => {
      if (count > 2) errors.push(`${team.id} has ${count} opponents from ${association}.`);
    });

    POTS.forEach((pot) => {
      const homeCount = matches.filter((fixture) => fixture.homeTeamId === team.id && teamMap.get(fixture.awayTeamId)?.pot === pot).length;
      const awayCount = matches.filter((fixture) => fixture.awayTeamId === team.id && teamMap.get(fixture.homeTeamId)?.pot === pot).length;
      if (homeCount !== 1 || awayCount !== 1) errors.push(`${team.id} must play one home and one away match against pot ${pot}.`);
    });

    const venues = [...matches]
      .sort((left, right) => left.matchweek - right.matchweek)
      .map((fixture) => fixture.homeTeamId === team.id ? 'H' : 'A') as Venue[];
    if (venues.length === 8) {
      if (maxVenueRun(venues) > 2) errors.push(`${team.id} has more than two consecutive home/away matches.`);
      if (venues[0] === venues[1]) errors.push(`${team.id} must have one home and one away match in MD1–2.`);
      if (venues[6] === venues[7]) errors.push(`${team.id} must have one home and one away match in MD7–8.`);
    }
  });

  fixtures.forEach((fixture) => {
    if (!teamMap.has(fixture.homeTeamId) || !teamMap.has(fixture.awayTeamId)) {
      errors.push(`Fixture ${fixture.id} contains an unknown team.`);
    }
    if (UCL_THREE_SEASON_HOME_BLOCKLIST.has(`${fixture.homeTeamId}|${fixture.awayTeamId}`)) {
      errors.push(`Fixture ${fixture.homeTeamId} v ${fixture.awayTeamId} repeats at the same venue for a third season.`);
    }
  });

  return { valid: errors.length === 0, errors: [...new Set(errors)] };
};

export const generatePresetSwissDraw = (_teams?: Team[]): LeagueMatch[] => JSON.parse(JSON.stringify(PRESET_UCL_FIXTURES));

export const generateRandomSwissDraw = (teams: Team[]): LeagueMatch[] => {
  const inputErrors: string[] = [];
  if (teams.length !== 36) inputErrors.push(`Expected 36 teams, received ${teams.length}.`);
  POTS.forEach((pot) => {
    const count = teams.filter((team) => team.pot === pot).length;
    if (count !== 9) inputErrors.push(`Pot ${pot} must contain 9 teams, received ${count}.`);
  });
  teams.forEach((team) => {
    if (!UCL_COUNTRY_MAP[team.id]) inputErrors.push(`Missing association for ${team.id}.`);
  });
  if (inputErrors.length) throw new Error(inputErrors.join(' '));

  const teamMap = new Map(teams.map((team) => [team.id, team]));
  const teamsByPot = new Map<Pot, Team[]>(POTS.map((pot) => [pot, teams.filter((team) => team.pot === pot)]));
  let fixtures = generatePresetSwissDraw().map((fixture) => ({ ...fixture }));
  let acceptedMutations = 0;

  const tryTeamIdentitySwap = () => {
    const pot = POTS[Math.floor(Math.random() * POTS.length)];
    const [first, second] = shuffle(teamsByPot.get(pot)!).slice(0, 2);
    const candidate = fixtures.map((fixture) => ({
      ...fixture,
      homeTeamId: fixture.homeTeamId === first.id ? second.id : fixture.homeTeamId === second.id ? first.id : fixture.homeTeamId,
      awayTeamId: fixture.awayTeamId === first.id ? second.id : fixture.awayTeamId === second.id ? first.id : fixture.awayTeamId,
    }));
    if (validateRandomSwissDraw(candidate, teams).valid) {
      fixtures = candidate;
      acceptedMutations += 1;
    }
  };

  const tryOpponentSwap = () => {
    const matchday = MATCHDAYS[Math.floor(Math.random() * MATCHDAYS.length)];
    const matchdayIndexes = fixtures
      .map((fixture, index) => ({ fixture, index }))
      .filter(({ fixture }) => fixture.matchweek === matchday);
    const first = shuffle(matchdayIndexes)[0];
    const firstHomePot = teamMap.get(first.fixture.homeTeamId)?.pot;
    const firstAwayPot = teamMap.get(first.fixture.awayTeamId)?.pot;
    const compatible = matchdayIndexes.filter(({ fixture, index }) =>
      index !== first.index
      && teamMap.get(fixture.homeTeamId)?.pot === firstHomePot
      && teamMap.get(fixture.awayTeamId)?.pot === firstAwayPot,
    );
    if (!compatible.length) return;
    const second = shuffle(compatible)[0];
    const candidate = fixtures.map((fixture) => ({ ...fixture }));
    candidate[first.index].awayTeamId = second.fixture.awayTeamId;
    candidate[second.index].awayTeamId = first.fixture.awayTeamId;
    if (validateRandomSwissDraw(candidate, teams).valid) {
      fixtures = candidate;
      acceptedMutations += 1;
    }
  };

  for (let attempt = 0; attempt < MUTATION_ATTEMPTS; attempt += 1) {
    if (Math.random() < 0.72) tryTeamIdentitySwap();
    else tryOpponentSwap();
  }

  const validation = validateRandomSwissDraw(fixtures, teams);
  if (!validation.valid || acceptedMutations === 0) {
    throw new Error(`Unable to produce a valid UEFA league-phase draw: ${validation.errors.join(' ')}`);
  }

  return shuffle(fixtures)
    .sort((left, right) => left.matchweek - right.matchweek)
    .map((fixture, index) => ({
      ...fixture,
      id: `ucl-random-${index + 1}`,
    }));
};
