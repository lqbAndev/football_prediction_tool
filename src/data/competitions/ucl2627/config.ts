import type { UclConfig } from '../../../types/uclConfig';

export const ucl2627Config: UclConfig = {
  id: 'ucl',
  name: 'UEFA Champions League 2026/27',
  type: 'swiss',
  teams: 36,
  rounds: 8,
  qualificationZones: [
    {
      id: 'round-of-16',
      label: 'Direct Round of 16 Qualification',
      startPosition: 1,
      endPosition: 8,
      color: '#00F0FF', // Cyan
    },
    {
      id: 'play-offs',
      label: 'Knockout Phase Play-offs',
      startPosition: 9,
      endPosition: 24,
      color: '#F59E0B', // Gold
    },
    {
      id: 'eliminated',
      label: 'Eliminated from Europe',
      startPosition: 25,
      endPosition: 36,
      color: '#4B5563', // Gray
    },
  ],
  storageKey: 'vibe-ucl2627-state',
};
