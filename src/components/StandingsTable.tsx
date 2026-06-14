import type { TeamStanding } from '../types/tournament';
import { Flag } from './Flag';

interface StandingsTableProps {
  standings: TeamStanding[];
  qualifiedThirdIds: Set<string>;
}

export const StandingsTable = ({ standings, qualifiedThirdIds }: StandingsTableProps) => {
  return (
    <div className="overflow-x-auto scrollbar-hide rounded-[28px] border border-white/10 bg-black/15">
      <table className="min-w-full text-sm">
        <thead className="text-xs uppercase tracking-[0.22em] text-white/45">
          <tr>
            <th className="px-4 py-3 text-left">Team</th>
            <th className="px-2 py-3 text-center">P</th>
            <th className="px-2 py-3 text-center">W</th>
            <th className="px-2 py-3 text-center">D</th>
            <th className="px-2 py-3 text-center">L</th>
            <th className="px-2 py-3 text-center">GF</th>
            <th className="px-2 py-3 text-center">GA</th>
            <th className="px-2 py-3 text-center">GD</th>
            <th className="px-4 py-3 text-center">Pts</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((row) => {
            const isDirectQualified = row.rank <= 2;
            const isBestThird = row.rank === 3 && qualifiedThirdIds.has(row.teamId);
            const isGroupComplete = standings.every((entry) => entry.played === 3);
            const isEliminated = isGroupComplete && !isDirectQualified && !isBestThird;

            let statusText = 'Competing';
            if (isDirectQualified) statusText = 'Qualified';
            else if (isBestThird) statusText = 'Best 3rd (Top 8)';
            else if (isEliminated) statusText = 'Eliminated';

            return (
              <tr
                key={row.teamId}
                className={`border-t border-white/6 ${
                  isDirectQualified
                    ? 'bg-emerald-400/[0.09]'
                    : isBestThird
                      ? 'bg-amber-300/[0.08]'
                      : isEliminated
                        ? 'bg-red-500/[0.05] grayscale'
                        : 'bg-transparent'
                }`}
              >
                <td className="px-4 py-3 text-left">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xs font-semibold text-white/70">
                      {row.rank}
                    </span>
                    <Flag teamName={row.teamName} size={26} />
                    <div>
                      <div className="max-w-[150px] truncate font-semibold text-white sm:max-w-none">
                        {row.teamName}
                      </div>
                      <div className={`text-xs ${isEliminated ? 'text-red-400/60' : 'text-white/45'}`}>
                        {statusText}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-2 py-3 text-center text-white/75">{row.played}</td>
                <td className="px-2 py-3 text-center text-white/75">{row.wins}</td>
                <td className="px-2 py-3 text-center text-white/75">{row.draws}</td>
                <td className="px-2 py-3 text-center text-white/75">{row.losses}</td>
                <td className="px-2 py-3 text-center text-white/75">{row.goalsFor}</td>
                <td className="px-2 py-3 text-center text-white/75">{row.goalsAgainst}</td>
                <td className="px-2 py-3 text-center text-white/75">{row.goalDifference}</td>
                <td className="px-4 py-3 text-center font-semibold text-white">{row.points}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
