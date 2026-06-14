import type { TopScorerEntry } from '../types/tournament';
import { Flag } from './Flag';

interface TopScorersTableProps {
  scorers: TopScorerEntry[];
}

export const TopScorersTable = ({ scorers }: TopScorersTableProps) => {
  const topEntries = scorers.slice(0, 15);

  return (
    <section className="panel p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="field-label">Top Scorers</p>
          <h2 className="mt-2 text-2xl font-bold text-white">Top Scorers Leaderboard</h2>
        </div>
        <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70">
          Penalty shoot-outs not counted
        </div>
      </div>

      {topEntries.length ? (
        <div className="mt-5 overflow-x-auto scrollbar-hide rounded-[28px] border border-white/10 bg-black/15">
          <table className="min-w-full text-sm">
            <thead className="text-xs uppercase tracking-[0.22em] text-white/45">
              <tr>
                <th className="px-4 py-3 text-left">#</th>
                <th className="px-4 py-3 text-left">Player</th>
                <th className="px-4 py-3 text-left">Team</th>
                <th className="px-4 py-3 text-center">Goals</th>
              </tr>
            </thead>
            <tbody>
              {topEntries.map((entry, index) => (
                <tr key={entry.playerId} className="border-t border-white/6">
                  <td className="px-4 py-3 text-left font-semibold text-white">{index + 1}</td>
                  <td className="px-4 py-3 text-left font-semibold text-white">{entry.playerName}</td>
                  <td className="px-4 py-3 text-left text-white/70">
                    <div className="flex items-center gap-3">
                      <Flag teamName={entry.teamName} size={22} />
                      <span>{entry.teamName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 font-semibold text-emerald-50">
                      {entry.goals}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-5 rounded-[28px] border border-dashed border-white/10 bg-black/10 p-6 text-sm leading-6 text-white/65">
          No goals recorded yet. Start predicting group stage matches for the system to generate the scorers list.
        </div>
      )}
    </section>
  );
};
