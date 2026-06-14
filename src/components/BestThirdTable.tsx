import type { ThirdPlaceStanding } from '../types/tournament';
import { Flag } from './Flag';

interface BestThirdTableProps {
  entries: ThirdPlaceStanding[];
  groupStageComplete: boolean;
}

const STATUS_LABELS: Record<ThirdPlaceStanding['status'], string> = {
  qualified: 'Qualified',
  provisional: 'Provisional',
  eliminated: 'Eliminated',
};

export const BestThirdTable = ({ entries, groupStageComplete }: BestThirdTableProps) => {
  return (
    <section className="panel p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="field-label">Best 3rd Place</p>
          <h2 className="mt-2 text-2xl font-bold text-white">12 Third-Place Teams</h2>
        </div>
        <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70">
          {groupStageComplete ? 'Top 8 confirmed' : 'Temporarily calculating'}
        </div>
      </div>

      <p className="mt-4 text-sm leading-6 text-white/70">
        Top 8 third-place teams are highlighted to advance to knockout. When group stage is incomplete, this is a provisional ranking based on current data.
      </p>

      <div className="mt-5 overflow-x-auto scrollbar-hide rounded-[28px] border border-white/10 bg-black/15">
        <table className="min-w-full text-sm">
          <thead className="text-xs uppercase tracking-[0.22em] text-white/45">
            <tr>
              <th className="px-4 py-3 text-left">#</th>
              <th className="px-4 py-3 text-left">Team</th>
              <th className="px-3 py-3 text-center">Group</th>
              <th className="px-3 py-3 text-center">Pts</th>
              <th className="px-3 py-3 text-center">GD</th>
              <th className="px-3 py-3 text-center">GF</th>
              <th className="px-3 py-3 text-center">GA</th>
              <th className="px-4 py-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr
                key={entry.teamId}
                className={`border-t border-white/6 ${
                  entry.qualifies
                    ? 'bg-amber-300/[0.08]'
                    : entry.status === 'eliminated'
                      ? 'bg-red-500/[0.05] grayscale'
                      : 'bg-transparent'
                }`}
              >
                <td className="px-4 py-3 text-left font-semibold text-white">{entry.position}</td>
                <td className="px-4 py-3 text-left">
                  <div className="flex items-center gap-3">
                    <Flag teamName={entry.teamName} size={24} />
                    <span className="font-semibold text-white">{entry.teamName}</span>
                  </div>
                </td>
                <td className="px-3 py-3 text-center text-white/70">{entry.group}</td>
                <td className="px-3 py-3 text-center text-white/70">{entry.points}</td>
                <td className="px-3 py-3 text-center text-white/70">{entry.goalDifference}</td>
                <td className="px-3 py-3 text-center text-white/70">{entry.goalsFor}</td>
                <td className="px-3 py-3 text-center text-white/70">{entry.goalsAgainst}</td>
                <td className="px-4 py-3 text-center">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${
                      entry.qualifies
                        ? 'border border-amber-300/20 bg-amber-300/10 text-amber-100'
                        : entry.status === 'eliminated'
                          ? 'border border-red-500/20 bg-red-500/10 text-red-200'
                          : 'border border-white/10 bg-white/5 text-white/55'
                    }`}
                  >
                    {STATUS_LABELS[entry.status]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};
