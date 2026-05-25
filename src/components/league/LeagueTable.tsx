import type { LeagueStanding, QualificationZone } from '../../types/leagueConfig';

interface LeagueTableProps {
  standings: LeagueStanding[];
  qualificationZones: QualificationZone[];
  showAllZones?: boolean;
}

export default function LeagueTable({ standings, qualificationZones, showAllZones = false }: LeagueTableProps) {
  // Filter out Champions League and Europa League zones as requested for test league
  const activeZones = showAllZones
    ? qualificationZones
    : qualificationZones.filter(
        (zone) => zone.id !== 'champions-league' && zone.id !== 'europa-league'
      );

  const getZoneForPosition = (position: number): QualificationZone | undefined => {
    return activeZones.find(
      (zone) => position >= zone.startPosition && position <= zone.endPosition,
    );
  };

  const getFormColor = (result: 'W' | 'D' | 'L'): string => {
    switch (result) {
      case 'W':
        return 'bg-emerald-500 text-white';
      case 'D':
        return 'bg-zinc-500 text-zinc-100';
      case 'L':
        return 'bg-rose-500 text-white';
    }
  };

  return (
    <div className="bg-emerald-950/20 backdrop-blur-md rounded-2xl p-6 border border-emerald-500/15 shadow-[0_8px_32px_rgba(0,0,0,0.37)]">
      <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
        <span>📊</span> League Table
      </h2>

      <div className="overflow-x-auto">
        <table className="w-full text-white">
          <thead>
            <tr className="border-b border-emerald-500/20">
              <th className="text-left py-3 px-2 text-sm font-semibold text-emerald-400">Pos</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-emerald-400">Team</th>
              <th className="text-center py-3 px-2 text-sm font-semibold text-emerald-400">P</th>
              <th className="text-center py-3 px-2 text-sm font-semibold text-emerald-400">W</th>
              <th className="text-center py-3 px-2 text-sm font-semibold text-emerald-400">D</th>
              <th className="text-center py-3 px-2 text-sm font-semibold text-emerald-400">L</th>
              <th className="text-center py-3 px-2 text-sm font-semibold text-emerald-400">GF</th>
              <th className="text-center py-3 px-2 text-sm font-semibold text-emerald-400">GA</th>
              <th className="text-center py-3 px-2 text-sm font-semibold text-emerald-400">GD</th>
              <th className="text-center py-3 px-2 text-sm font-semibold text-emerald-400">Pts</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-emerald-400">Form</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((standing) => {
              const isChampion = standing.position === 1;
              const zone = getZoneForPosition(standing.position);
              const borderColor = isChampion ? '#fbbf24' : (zone ? zone.color : 'transparent');

              return (
                <tr
                  key={standing.teamId}
                  className={`transition-colors border-b ${
                    isChampion
                      ? 'bg-amber-400/10 text-amber-200 font-bold border-emerald-500/10 hover:bg-amber-400/15'
                      : 'border-emerald-500/10 hover:bg-white/5'
                  }`}
                  style={{
                    borderLeftWidth: '4px',
                    borderLeftColor: borderColor,
                  }}
                >
                  <td className="py-3 px-2 text-sm font-medium">
                    {isChampion ? '🏆 1' : standing.position}
                  </td>
                  <td className="py-3 px-4 text-sm font-semibold">{standing.teamName}</td>
                  <td className="py-3 px-2 text-sm text-center">{standing.played}</td>
                  <td className="py-3 px-2 text-sm text-center">{standing.wins}</td>
                  <td className="py-3 px-2 text-sm text-center">{standing.draws}</td>
                  <td className="py-3 px-2 text-sm text-center">{standing.losses}</td>
                  <td className="py-3 px-2 text-sm text-center">{standing.goalsFor}</td>
                  <td className="py-3 px-2 text-sm text-center">{standing.goalsAgainst}</td>
                  <td className="py-3 px-2 text-sm text-center font-medium">
                    {standing.goalDifference > 0 ? '+' : ''}
                    {standing.goalDifference}
                  </td>
                  <td className="py-3 px-2 text-sm text-center font-bold text-base">{standing.points}</td>
                  <td className="py-3 px-4">
                    <div className="flex gap-1">
                      {standing.form.map((result, index) => (
                        <div
                          key={index}
                          className={`w-6 h-6 rounded flex items-center justify-center text-xs font-black ${getFormColor(
                            result,
                          )}`}
                          title={result === 'W' ? 'Win' : result === 'D' ? 'Draw' : 'Loss'}
                        >
                          {result}
                        </div>
                      ))}
                      {standing.form.length === 0 && (
                        <span className="text-xs text-zinc-400">No matches</span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Zone Legend */}
      {activeZones.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-4 border-t border-emerald-500/10 pt-4">
          {activeZones.map((zone) => (
            <div key={zone.id} className="flex items-center gap-2">
              <div
                className="w-3.5 h-3.5 rounded"
                style={{ backgroundColor: zone.color }}
              />
              <span className="text-xs text-white/70 font-semibold">{zone.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
