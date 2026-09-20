import patchUclImg from '../../img/CUP COMPETITION/UCL/patch_ucl.png';
import type { UCLTopAssistEntry } from '../../utils/uclRecapStats';

interface UCLTopAssistsTableProps {
  topAssists: UCLTopAssistEntry[];
  onSelectTeam?: (teamId: string) => void;
  onSelectPlayer?: (playerId: string, playerName: string, teamId: string, teamName: string) => void;
}

const rankStyle = (rank: number) => rank === 1
  ? 'border-sky-300/60 bg-sky-300 text-[#030815]'
  : rank <= 3 ? 'border-sky-300/25 bg-sky-300/10 text-sky-200' : 'border-white/15 bg-white/5 text-white/55';

export const UCLTopAssistsTable = ({ topAssists, onSelectTeam, onSelectPlayer }: UCLTopAssistsTableProps) => {
  const entries = topAssists.slice(0, 15);
  return (
    <section id="ucl-top-assists" aria-labelledby="ucl-top-assists-title" className="scroll-mt-20 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-[#071329] via-[#050d1d] to-[#020817] p-4 shadow-[0_24px_70px_rgba(0,6,20,0.38)] sm:p-8">
      <header className="flex items-center gap-3 border-b border-white/10 pb-5">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-sky-300/20 bg-white/[0.04]"><img src={patchUclImg} alt="UEFA Champions League patch" className="h-9 w-9 object-contain" /></div>
        <div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-[0.28em] text-sky-300">Live tournament ranking</p><h3 id="ucl-top-assists-title" className="text-2xl font-black text-white sm:text-3xl">Top assists</h3></div>
      </header>
      {entries.length === 0 ? (
        <p className="py-16 text-center text-sm text-white/40">Simulate fixtures to record the first assists.</p>
      ) : (
        <>
          <p className="mt-4 text-[10px] leading-5 text-white/45">League phase + knockout, including extra time. Tap a player to view assist details.</p>
          <ol className="mt-4 space-y-2 md:hidden">
            {entries.map((entry, index) => (
              <li key={`${entry.teamId}:${entry.playerId}`}>
              <button type="button" onClick={() => onSelectPlayer?.(entry.playerId, entry.playerName, entry.teamId, entry.teamName)} className={`flex w-full min-w-0 items-center gap-3 rounded-2xl border border-white/[0.08] px-3 py-3 text-left transition hover:bg-white/[0.065] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 ${index === 0 ? 'bg-sky-300/[0.07]' : ''}`}>
                <span className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border font-mono text-sm font-black ${rankStyle(index + 1)}`}>{index + 1}</span>
                <div className="min-w-0 flex-1">
                  <span className="block whitespace-normal text-sm font-black leading-5 text-white [overflow-wrap:anywhere]">{entry.playerName}</span>
                  <span className="mt-1 flex max-w-full items-center gap-1.5 text-[10px] text-white/55">
                    {entry.teamLogo && <img src={entry.teamLogo} alt="" className="h-4 w-4 shrink-0 object-contain" />}<span className="whitespace-normal leading-4 [overflow-wrap:anywhere]">{entry.teamName}</span>
                  </span>
                </div>
                <span className="shrink-0 text-right"><span className="block font-mono text-2xl font-black text-sky-300">{entry.assists}</span><span className="block text-[8px] uppercase tracking-wider text-white/45">Assists</span></span>
              </button>
              </li>
            ))}
          </ol>
          <div className="mt-4 hidden overflow-x-auto overscroll-x-contain md:block">
            <table className="w-full min-w-[720px] border-collapse text-left" aria-label="UEFA Champions League top assists">
              <thead><tr className="border-b border-white/10 text-sm font-extrabold uppercase tracking-wider text-white/45"><th className="w-24 px-4 py-3 text-center">Rank</th><th className="px-4 py-3">Player</th><th className="px-4 py-3">Club</th><th className="w-28 px-4 py-3 text-center">Assists</th></tr></thead>
              <tbody className="divide-y divide-white/[0.07]">
                {entries.map((entry, index) => (
                  <tr key={`${entry.teamId}:${entry.playerId}`} tabIndex={0} onClick={() => onSelectPlayer?.(entry.playerId, entry.playerName, entry.teamId, entry.teamName)} onKeyDown={event => {
                    if (event.target !== event.currentTarget) return;
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      onSelectPlayer?.(entry.playerId, entry.playerName, entry.teamId, entry.teamName);
                    }
                  }} className={`group cursor-pointer transition hover:bg-white/[0.065] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-300 ${index === 0 ? 'bg-sky-300/[0.07]' : ''}`}>
                    <td className="px-4 py-4 text-center"><span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border font-mono text-base font-black ${rankStyle(index + 1)}`}>{index + 1}</span></td>
                    <td className="px-4 py-4 text-lg font-black text-white">{entry.playerName}</td>
                    <td className="px-4 py-4"><button type="button" onClick={event => { event.stopPropagation(); onSelectTeam?.(entry.teamId); }} className="flex items-center gap-3 rounded text-left text-base font-bold text-white/65 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300">{entry.teamLogo && <img src={entry.teamLogo} alt="" className="h-8 w-8 shrink-0 object-contain" />}<span>{entry.teamName}</span></button></td>
                    <td className="px-4 py-4 text-center font-mono text-2xl font-black text-sky-300">{entry.assists}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
};
