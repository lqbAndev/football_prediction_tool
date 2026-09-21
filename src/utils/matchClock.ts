import type { MatchStoppageTime } from '../types/tournament';

const randomInt = (minimum: number, maximum: number) =>
  Math.floor(Math.random() * (maximum - minimum + 1)) + minimum;

export const createMatchStoppageTime = (includeExtraTime = false): MatchStoppageTime => ({
  firstHalf: randomInt(1, 5),
  secondHalf: randomInt(3, 8),
  extraTimeFirstHalf: includeExtraTime ? randomInt(0, 2) : 0,
  extraTimeSecondHalf: includeExtraTime ? randomInt(1, 3) : 0,
});

export const stoppageSortMinute = (baseMinute: 45 | 90 | 105 | 120, added: number) =>
  baseMinute + added / 10;

export const formatStoppageMinute = (baseMinute: 45 | 90 | 105 | 120, added: number) =>
  `${baseMinute}+${added}'`;

export interface MatchClockTick {
  sortMinute: number;
  displayMinute: string;
  phase: 'regulation' | 'extra-time';
}

const normalTicks = (start: number, end: number, phase: MatchClockTick['phase']): MatchClockTick[] =>
  Array.from({ length: end - start + 1 }, (_, index) => {
    const minute = start + index;
    return { sortMinute: minute, displayMinute: `${minute}'`, phase };
  });

const stoppageTicks = (
  baseMinute: 45 | 90 | 105 | 120,
  addedTime: number,
  phase: MatchClockTick['phase'],
): MatchClockTick[] => Array.from({ length: addedTime }, (_, index) => ({
  sortMinute: stoppageSortMinute(baseMinute, index + 1),
  displayMinute: formatStoppageMinute(baseMinute, index + 1),
  phase,
}));

export const buildRegulationClock = (stoppage: MatchStoppageTime): MatchClockTick[] => [
  ...normalTicks(1, 45, 'regulation'),
  ...stoppageTicks(45, stoppage.firstHalf, 'regulation'),
  ...normalTicks(46, 90, 'regulation'),
  ...stoppageTicks(90, stoppage.secondHalf, 'regulation'),
];

export const buildExtraTimeClock = (stoppage: MatchStoppageTime): MatchClockTick[] => [
  ...normalTicks(91, 105, 'extra-time'),
  ...stoppageTicks(105, stoppage.extraTimeFirstHalf, 'extra-time'),
  ...normalTicks(106, 120, 'extra-time'),
  ...stoppageTicks(120, stoppage.extraTimeSecondHalf, 'extra-time'),
];
