import type { TopScorerEntry } from '../../types/tournament';
import { UCL_TEAMS_BY_ID } from '../../data/competitions/ucl2627';
import uclBallImg from '../../img/CUP COMPETITION/UCL/ball/ucl_ball_26-27.png';

interface UCLTopScorersTableProps {
  topScorers: TopScorerEntry[];
  penaltyGoalsByPlayer?: Record<string, number>;
  onSelectTeam?: (teamId: string) => void;
  onSelectPlayer?: (playerId: string, playerName: string, teamId: string, teamName: string) => void;
}

const rankStyle = (rank: number) => {
  if (rank === 1) return 'border-amber-300/60 bg-amber-300 text-[#030815]';
  if (rank === 2) return 'border-slate-200/60 bg-slate-200 text-[#030815]';
  if (rank === 3) return 'border-amber-700/60 bg-amber-700 text-white';
  return 'border-white/15 bg-white/5 text-white/55';
};

const rowStyle = (rank: number) => {
  if (rank === 1) return 'bg-amber-300/[0.07]';
  if (rank === 2) return 'bg-slate-200/[0.045]';
  if (rank === 3) return 'bg-amber-700/[0.055]';
  return 'bg-transparent';
};

export const UCLTopScorersTable: React.FC<UCLTopScorersTableProps> = ({
  topScorers,
  penaltyGoalsByPlayer = {},
  onSelectTeam,
  onSelectPlayer,
}) => {
  const displayScorers = topScorers.slice(0, 15);

  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-[#071329] via-[#050d1d] to-[#020817] p-4 shadow-[0_24px_70px_rgba(0,6,20,0.38)] sm:p-8">
      <header className="flex items-center gap-3 border-b border-white/10 pb-5">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-sky-300/20 bg-white/[0.04]">
          <img src={uclBallImg} alt="UEFA Champions League starball" className="h-8 w-8 object-contain" />
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-sky-300">Live tournament ranking</p>
          <h3 className="text-2xl font-black text-white sm:text-3xl">Top goalscorers</h3>
        </div>
      </header>

      {displayScorers.length === 0 ? (
        <div className="py-16 text-center text-sm text-white/40">Simulate fixtures to begin the Golden Boot race.</div>
      ) : (
        <div className="mt-5 overflow-x-auto overscroll-x-contain">
          <table className="w-full min-w-[720px] border-collapse text-left" aria-label="UEFA Champions League top goalscorers">
            <thead>
              <tr className="border-b border-white/10 text-sm font-extrabold uppercase tracking-wider text-white/45">
                <th className="w-24 px-4 py-3 text-center">Rank</th>
                <th className="px-4 py-3">Player</th>
                <th className="px-4 py-3">Club</th>
                <th className="w-28 px-4 py-3 text-center">Goals</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.07]">
              {displayScorers.map((entry, index) => {
                const team = UCL_TEAMS_BY_ID[entry.teamId];
                const rank = index + 1;
                const penaltyGoals = penaltyGoalsByPlayer[entry.playerId] || 0;
                const openPlayer = () => onSelectPlayer?.(entry.playerId, entry.playerName, entry.teamId, entry.teamName);

                return (
                  <tr
                    key={entry.playerId}
                    tabIndex={0}
                    onClick={openPlayer}
                    onKeyDown={(event) => {
                      if (event.target !== event.currentTarget) return;
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        openPlayer();
                      }
                    }}
                    className={`group cursor-pointer transition duration-300 hover:bg-white/[0.065] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-300 ${rowStyle(rank)}`}
                  >
                    <td className="px-4 py-4 text-center">
                      <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border font-mono text-base font-black ${rankStyle(rank)}`}>{rank}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-lg font-black text-white transition-colors group-hover:text-sky-200">{entry.playerName}</span>
                      {penaltyGoals > 0 && <span className="ml-2 text-[10px] font-bold uppercase tracking-wider text-amber-300/70">{penaltyGoals} pen</span>}
                    </td>
                    <td className="px-4 py-4">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          onSelectTeam?.(entry.teamId);
                        }}
                        className="flex items-center gap-3 text-left text-base font-bold text-white/65 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
                      >
                        {team?.logo && <img src={team.logo} alt={`${entry.teamName} crest`} className="h-8 w-8 shrink-0 object-contain" />}
                        <span>{entry.teamName}</span>
                      </button>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="font-mono text-2xl font-black text-amber-300">{entry.goals}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};
