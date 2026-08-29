import type { LeagueConfig } from '../../../types/leagueConfig';

export const epl2627Config: LeagueConfig = {
  id: 'epl',
  name: 'Premier League',
  type: 'league',
  teams: 20,
  rounds: 38,
  homeAdvantage: true,
  qualificationZones: [
    {
      id: 'champion',
      label: 'Premier League Champion',
      startPosition: 1,
      endPosition: 1,
      color: '#fbbf24', // Gold
    },
    {
      id: 'champions-league',
      label: 'UEFA Champions League',
      startPosition: 2,
      endPosition: 4,
      color: '#1e40af', // Dark Blue
    },
    {
      id: 'europa-league',
      label: 'UEFA Europa League',
      startPosition: 5,
      endPosition: 6,
      color: '#ea580c', // Orange
    },
    {
      id: 'conference-league',
      label: 'UEFA Conference League',
      startPosition: 7,
      endPosition: 7,
      color: '#22c55e', // Light Green
    },
    {
      id: 'relegation',
      label: 'Relegation',
      startPosition: 18,
      endPosition: 20,
      color: '#ef4444', // Red
    },
  ],
  storageKey: 'vibe-epl2627-state',
};
