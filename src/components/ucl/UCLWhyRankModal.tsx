import React, { useEffect, useRef } from 'react';
import { Check, Equal, Info, X } from 'lucide-react';
import type { UCLRankExplanation } from '../../utils/uclStandings';
import type { Team } from '../../types/tournament';

interface Props {
  explanation: UCLRankExplanation | null;
  teamsById: Record<string, Team>;
  onClose: () => void;
}

export const UCLWhyRankModal: React.FC<Props> = ({ explanation, teamsById, onClose }) => {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!explanation) return;
    const previousOverflow = document.body.style.overflow;
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeyDown);
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [explanation, onClose]);

  if (!explanation) return null;
  const team = teamsById[explanation.team.teamId];
  const rival = explanation.rival ? teamsById[explanation.rival.teamId] : null;

  return (
    <div className="fixed inset-0 z-[9999] grid place-items-center overflow-y-auto bg-black/80 p-4 backdrop-blur-md [padding-bottom:max(1rem,env(safe-area-inset-bottom))] [padding-top:max(1rem,env(safe-area-inset-top))]" onClick={onClose}>
      <section role="dialog" aria-modal="true" aria-labelledby="why-rank-title" className="relative flex max-h-[calc(100dvh-2rem)] w-full max-w-lg flex-col overflow-hidden rounded-[28px] border border-cyan-300/20 bg-gradient-to-b from-[#071a38] to-[#020817] shadow-[0_28px_100px_rgba(0,0,0,0.72)]" onClick={(event) => event.stopPropagation()}>
        <header className="flex items-center gap-3 border-b border-white/10 px-4 py-4 sm:px-6">
          {team?.logo && <img src={team.logo} alt="" className="h-10 w-10 object-contain" />}
          <div className="min-w-0 flex-1">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">UEFA ranking audit</p>
            <h2 id="why-rank-title" className="whitespace-normal text-2xl font-black leading-tight text-white">Why #{explanation.team.position}?</h2>
          </div>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Close rank explanation" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/65 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"><X className="h-5 w-5" /></button>
        </header>

        <div className="overflow-y-auto px-4 py-5 sm:px-6">
          <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.07] p-4">
            <div className="flex items-start gap-2 text-base font-black leading-6 text-cyan-100"><Info className="mt-1 h-5 w-5 shrink-0" />{explanation.summary}</div>
            <p className="mt-2 text-sm leading-6 text-white/60">{explanation.team.rankingPhase === 'final' ? 'Final MD8 rules: opponent-strength, discipline and coefficient criteria are active.' : 'Provisional MD1–7 rules: the opponent-strength criteria activate only after Matchday 8.'}</p>
          </div>

          {explanation.rival ? (
            <>
              <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-center">
                <div>{team?.logo && <img src={team.logo} alt="" className="mx-auto h-12 w-12 object-contain" />}<p className="mt-2 whitespace-normal text-sm font-black">{team?.name}</p></div>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-black text-white/45">VS</span>
                <div>{rival?.logo && <img src={rival.logo} alt="" className="mx-auto h-12 w-12 object-contain" />}<p className="mt-2 whitespace-normal text-sm font-black">{rival?.name}</p></div>
              </div>
              <ol className="mt-5 space-y-2">
                {explanation.criteria.map((criterion, index) => (
                  <li key={criterion.key} className={`grid grid-cols-[32px_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border px-3 py-3.5 ${criterion.decisive ? 'border-emerald-300/35 bg-emerald-300/[0.09]' : criterion.applied ? 'border-white/10 bg-white/[0.035]' : 'border-white/[0.06] bg-black/10 opacity-50'}`}>
                    <span className={`flex h-8 w-8 items-center justify-center rounded-lg font-mono text-xs font-black ${criterion.decisive ? 'bg-emerald-300 text-[#02150e]' : 'bg-white/5 text-white/45'}`}>{criterion.decisive ? <Check className="h-4 w-4" /> : index + 1}</span>
                    <div><p className="text-sm font-bold leading-5 text-white/90">{criterion.label}</p><p className="mt-0.5 text-[11px] uppercase tracking-wider text-white/40">{criterion.decisive ? 'First decisive criterion' : criterion.applied ? 'Level — continue' : 'Not needed'}</p></div>
                    <div className="flex items-center gap-2 font-mono text-sm font-black"><span className="text-cyan-200">{criterion.teamValue}</span>{criterion.decisive ? <span className="text-emerald-300" aria-label="different">≠</span> : <Equal className="h-4 w-4 text-white/25" aria-hidden="true" />}<span className="text-white/60">{criterion.rivalValue}</span></div>
                  </li>
                ))}
              </ol>
            </>
          ) : <p className="py-8 text-center text-base leading-6 text-white/55">This club is clear on points, so no tie-break comparison is required.</p>}

          <p className="mt-5 text-xs leading-5 text-white/45">Disciplinary points remain equal at 0 because card events are not simulated in this version. The final fallback uses the official competition seed order, never team rating.</p>
        </div>
      </section>
    </div>
  );
};
