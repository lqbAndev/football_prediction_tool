import { useEffect, useMemo, useState } from 'react';
import { ChevronRight, FastForward, Pause, Play, TimerReset } from 'lucide-react';
import type { TwoLegMatch, UCLPenaltyKick } from '../../types/uclConfig';
import type { Team, TimelineEvent } from '../../types/tournament';
import { buildExtraTimeClock, buildRegulationClock, createMatchStoppageTime } from '../../utils/matchClock';
import { simulateExtraTime, simulateKnockoutLeg2, simulatePenalties } from '../../utils/uclKnockout';
import patchUclImg from '../../img/CUP COMPETITION/UCL/patch_ucl.png';
import badgeUclImg from '../../img/CUP COMPETITION/UCL/badge_ucl.png';
import uclBallImg from '../../img/CUP COMPETITION/UCL/ball/ucl_ball_26-27.png';
import uclMvpCupImg from '../../img/CUP COMPETITION/UCL/ucl_mvp_cup.png';

type LivePhase = 'pending' | 'regulation' | 'half-time' | 'awaiting-extra-time' | 'extra-time' | 'extra-time-interval' | 'awaiting-penalties' | 'penalties' | 'completed';

interface Props {
  match: TwoLegMatch;
  homeTeam: Team;
  awayTeam: Team;
  onUpdate: (match: TwoLegMatch) => void;
  onSelectTeam?: (teamId: string) => void;
}

const phaseFromMatch = (match: TwoLegMatch): LivePhase => {
  if (match.isCompleted) return 'completed';
  if (match.tieStatus === 'aet') return 'awaiting-penalties';
  if (match.tieStatus === 'leg2-done') return 'awaiting-extra-time';
  return 'pending';
};

const penaltyLabel = (kick: UCLPenaltyKick) => kick.scored
  ? 'Goal'
  : kick.outcome === 'saved'
  ? 'Saved'
  : kick.outcome === 'off-target'
  ? 'Off target'
  : 'Miss';

export const UCLFinalLive: React.FC<Props> = ({ match, homeTeam, awayTeam, onUpdate, onSelectTeam }) => {
  const [phase, setPhase] = useState<LivePhase>(() => phaseFromMatch(match));
  const [result, setResult] = useState<TwoLegMatch>(() => match);
  const [clockIndex, setClockIndex] = useState(-1);
  const [paused, setPaused] = useState(false);
  const [halfTimePassed, setHalfTimePassed] = useState(() => match.leg2.status === 'completed');
  const [extraTimeHalfPassed, setExtraTimeHalfPassed] = useState(() => Boolean(match.leg2.extraTime));
  const [revealedKicks, setRevealedKicks] = useState(() => match.leg2.penalties?.kicks.length || 0);

  useEffect(() => {
    setResult(match);
    setPhase(phaseFromMatch(match));
    setClockIndex(-1);
    setHalfTimePassed(match.leg2.status === 'completed');
    setExtraTimeHalfPassed(Boolean(match.leg2.extraTime));
    setRevealedKicks(match.leg2.penalties?.kicks.length || 0);
  }, [match.id]);

  const stoppage = result.leg2.stoppageTime || createMatchStoppageTime(result.leg2.extraTime);
  const usesExtraTimeClock = phase === 'extra-time' || phase === 'extra-time-interval' || phase === 'awaiting-penalties';
  const clock = useMemo(
    () => usesExtraTimeClock ? buildExtraTimeClock(stoppage) : buildRegulationClock(stoppage),
    [usesExtraTimeClock, stoppage.firstHalf, stoppage.secondHalf, stoppage.extraTimeFirstHalf, stoppage.extraTimeSecondHalf],
  );
  const currentClock = clock[Math.max(0, clockIndex)];
  const regulationHalfEndIndex = 45 + stoppage.firstHalf - 1;
  const extraTimeHalfEndIndex = 15 + stoppage.extraTimeFirstHalf - 1;
  const clockLimit = clockIndex < 0 ? 0 : currentClock?.sortMinute ?? 0;
  const isActive = phase === 'regulation' || phase === 'extra-time' || phase === 'penalties';

  const completeCurrentPhase = () => {
    if (phase === 'regulation') {
      onUpdate(result);
      setPaused(true);
      setPhase(result.tieStatus === 'leg2-done' ? 'awaiting-extra-time' : 'completed');
    } else if (phase === 'extra-time') {
      onUpdate(result);
      setPaused(true);
      setPhase(result.tieStatus === 'aet' ? 'awaiting-penalties' : 'completed');
    } else if (phase === 'penalties') {
      onUpdate(result);
      setPaused(true);
      setPhase('completed');
    }
  };

  useEffect(() => {
    if (!isActive || paused) return;
    if (phase === 'penalties') {
      const kicks = result.leg2.penalties?.kicks || [];
      if (revealedKicks >= kicks.length) {
        completeCurrentPhase();
        return;
      }
      const timer = window.setTimeout(() => setRevealedKicks((count) => count + 1), 780);
      return () => window.clearTimeout(timer);
    }
    if (phase === 'regulation' && !halfTimePassed && clockIndex >= regulationHalfEndIndex) {
      setHalfTimePassed(true);
      setPaused(true);
      setPhase('half-time');
      return;
    }
    if (phase === 'extra-time' && !extraTimeHalfPassed && clockIndex >= extraTimeHalfEndIndex) {
      setExtraTimeHalfPassed(true);
      setPaused(true);
      setPhase('extra-time-interval');
      return;
    }
    if (clockIndex >= clock.length - 1) {
      completeCurrentPhase();
      return;
    }
    const timer = window.setTimeout(() => setClockIndex((index) => index + 1), 210);
    return () => window.clearTimeout(timer);
  }, [clock.length, clockIndex, extraTimeHalfEndIndex, extraTimeHalfPassed, halfTimePassed, isActive, paused, phase, regulationHalfEndIndex, result, revealedKicks]);

  const startFinal = () => {
    const next = simulateKnockoutLeg2(match, homeTeam, awayTeam);
    setResult(next);
    setPhase('regulation');
    setClockIndex(-1);
    setHalfTimePassed(false);
    setPaused(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  };

  const beginExtraTime = () => {
    const next = simulateExtraTime(result, homeTeam, awayTeam);
    setResult(next);
    setPhase('extra-time');
    setClockIndex(-1);
    setExtraTimeHalfPassed(false);
    setPaused(false);
  };

  const beginSecondHalf = () => {
    setPhase('regulation');
    setPaused(false);
  };

  const beginExtraTimeSecondHalf = () => {
    setPhase('extra-time');
    setPaused(false);
  };

  const beginPenalties = () => {
    const next = simulatePenalties(result, homeTeam, awayTeam);
    setResult(next);
    setPhase('penalties');
    setRevealedKicks(0);
    setPaused(false);
  };

  const finishPhase = () => {
    if (phase === 'regulation' && !halfTimePassed) {
      setClockIndex(regulationHalfEndIndex);
      setHalfTimePassed(true);
      setPaused(true);
      setPhase('half-time');
      return;
    }
    if (phase === 'extra-time' && !extraTimeHalfPassed) {
      setClockIndex(extraTimeHalfEndIndex);
      setExtraTimeHalfPassed(true);
      setPaused(true);
      setPhase('extra-time-interval');
      return;
    }
    if (phase === 'penalties') {
      setRevealedKicks(result.leg2.penalties?.kicks.length || 0);
    } else {
      setClockIndex(clock.length - 1);
    }
    completeCurrentPhase();
  };

  const regulationEvents = result.leg2.timeline || [];
  const extraTimeEvents = result.leg2.etTimeline || [];
  const visibleTimeline = useMemo(() => {
    if (phase === 'pending') return [];
    if (phase === 'regulation' || phase === 'half-time') return regulationEvents.filter((event) => event.sortMinute <= clockLimit);
    if (phase === 'extra-time' || phase === 'extra-time-interval') return [...regulationEvents, ...extraTimeEvents.filter((event) => event.sortMinute <= clockLimit)];
    return [...regulationEvents, ...extraTimeEvents].sort((left, right) => left.sortMinute - right.sortMinute);
  }, [clockLimit, extraTimeEvents, phase, regulationEvents]);

  const score = phase === 'pending'
    ? { home: null, away: null }
    : {
        home: visibleTimeline.filter((event) => event.side === 'home').length,
        away: visibleTimeline.filter((event) => event.side === 'away').length,
      };
  const kicks = result.leg2.penalties?.kicks || [];
  const visibleKicks = kicks.slice(0, phase === 'completed' ? kicks.length : revealedKicks);
  const penaltyScore = visibleKicks.reduce((total, kick) => ({
    home: total.home + (kick.team === 'home' && kick.scored ? 1 : 0),
    away: total.away + (kick.team === 'away' && kick.scored ? 1 : 0),
  }), { home: 0, away: 0 });
  const showPenalties = phase === 'penalties' || (phase === 'completed' && kicks.length > 0);
  const status = phase === 'completed' ? 'FT' : isActive ? (paused ? 'Paused' : 'Live') : phase === 'pending' ? 'Pending' : 'Decision';
  const clockLabel = phase === 'penalties'
    ? `Kick ${Math.min(revealedKicks + 1, kicks.length)} / ${kicks.length}`
    : phase === 'completed'
    ? 'Full time'
    : clockIndex < 0
    ? "0'"
    : currentClock?.displayMinute;
  const progress = phase === 'penalties'
    ? (revealedKicks / Math.max(1, kicks.length)) * 100
    : ((clockIndex + 1) / Math.max(1, clock.length)) * 100;

  const renderTeamTimeline = (team: Team, side: 'home' | 'away', accent: 'amber' | 'cyan') => {
    const events = visibleTimeline.filter((event) => event.side === side);
    return (
      <section className={`rounded-2xl border p-3 sm:p-4 ${accent === 'amber' ? 'border-amber-300/25 bg-amber-300/[0.055]' : 'border-cyan-300/25 bg-cyan-300/[0.055]'}`}>
        <div className={`flex items-center gap-3 border-b pb-3 ${side === 'home' ? 'lg:flex-row-reverse lg:text-right' : ''} ${accent === 'amber' ? 'border-amber-200/10' : 'border-cyan-200/10'}`}>
          <img src={team.logo} alt="" className="h-9 w-9 shrink-0 object-contain" />
          <div className="min-w-0"><p className={`whitespace-normal text-xs font-black leading-4 [overflow-wrap:anywhere] ${accent === 'amber' ? 'text-amber-200' : 'text-cyan-200'}`}>{team.name}</p><p className="mt-1 text-[10px] text-white/40">{side === 'home' ? 'Pathway 1' : 'Pathway 2'} moments</p></div>
        </div>
        <div className="mt-3 space-y-2">
          {events.length ? events.map((event, index) => <TimelineMoment key={`${event.playerId}-${event.sortMinute}-${index}`} event={event} alignRight={side === 'home'} />) : <p className="rounded-xl border border-dashed border-white/10 px-3 py-5 text-center text-xs text-white/30">Waiting for a goal…</p>}
        </div>
      </section>
    );
  };

  return (
    <article className="overflow-hidden rounded-[28px] border border-amber-300/35 bg-[radial-gradient(circle_at_50%_0%,rgba(236,190,64,0.13),transparent_32%),linear-gradient(155deg,#101b34_0%,#061126_52%,#020817_100%)] shadow-[0_28px_90px_rgba(0,0,0,0.55)]">
      <header className="border-b border-amber-200/10 px-4 py-4 sm:px-6">
        <div className="flex items-center justify-between gap-3"><div className="flex min-w-0 items-center gap-3"><img src={patchUclImg} alt="UEFA Champions League" className="h-8 w-8 shrink-0 object-contain" /><div className="min-w-0"><p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-200">Madrid 27 · Final</p><p className="mt-1 whitespace-normal text-sm font-black leading-5 text-white [overflow-wrap:anywhere] sm:text-lg">The European Showpiece</p></div></div><div className="flex shrink-0 items-center gap-2"><span className={`rounded-full border px-2.5 py-1 text-[9px] font-black uppercase ${status === 'Live' ? 'border-rose-300/35 bg-rose-300/10 text-rose-200' : status === 'FT' ? 'border-emerald-300/30 bg-emerald-300/10 text-emerald-200' : 'border-amber-300/30 bg-amber-300/10 text-amber-200'}`}>{status}</span><img src={badgeUclImg} alt="UCL badge" className="h-7 w-7 object-contain" /></div></div>
        <p className="mt-4 rounded-xl border border-amber-300/30 bg-amber-300/[0.08] px-3 py-2 text-[10px] font-bold text-amber-100 sm:text-xs">Estadio Metropolitano, Madrid · Single match · Neutral venue</p>
      </header>

      <div className="px-3 py-6 sm:px-7 sm:py-8">
        <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 sm:gap-7">
          {[homeTeam, awayTeam].map((team, index) => <button key={team.id} type="button" onClick={() => onSelectTeam?.(team.id)} className={`${index === 1 ? 'col-start-3' : ''} min-w-0 rounded-xl text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300`}><img src={team.logo} alt={`${team.name} crest`} className="mx-auto h-14 w-14 object-contain sm:h-24 sm:w-24" /><span className="mt-3 block whitespace-normal text-sm font-black leading-4 [overflow-wrap:anywhere] sm:text-xl sm:leading-6">{team.name}</span><span className="mt-2 block text-[8px] font-bold uppercase tracking-widest text-white/35">Finalist · Pathway {index + 1}</span></button>)}
          <div className="col-start-2 row-start-1 text-center"><p className="mb-2 text-[8px] font-black uppercase tracking-[0.16em] text-amber-200/65">{showPenalties ? 'Penalties' : result.leg2.extraTime ? 'AET' : 'Score'}</p><div className="flex items-baseline justify-center rounded-2xl border border-amber-200/25 bg-black/35 px-2 py-3 font-mono font-black tabular-nums sm:px-5 sm:py-4">{showPenalties && <span className="mr-1 text-xs text-amber-200 sm:text-base">({penaltyScore.home})</span>}<span className="text-3xl sm:text-5xl">{score.home ?? '–'}</span><span className="mx-1 text-xl text-white/25 sm:mx-2 sm:text-3xl">–</span><span className="text-3xl sm:text-5xl">{score.away ?? '–'}</span>{showPenalties && <span className="ml-1 text-xs text-amber-200 sm:text-base">({penaltyScore.away})</span>}</div><p className="mt-2 font-mono text-[10px] font-black text-cyan-200 sm:text-xs">{clockLabel}</p></div>
        </div>

        {phase === 'pending' ? <button type="button" onClick={startFinal} className="mx-auto mt-7 flex min-h-12 w-full max-w-md items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-300 to-yellow-400 px-5 text-sm font-black text-[#211500] shadow-[0_0_24px_rgba(251,191,36,0.2)] transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"><Play className="h-4 w-4" />Start Final Live</button> : (
          <div className="mt-7 rounded-2xl border border-white/10 bg-black/20 p-3 sm:p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-2"><span className={`h-2.5 w-2.5 rounded-full ${status === 'Live' ? 'animate-pulse bg-rose-300 motion-reduce:animate-none' : 'bg-amber-300'}`} /><p className="text-xs font-black uppercase tracking-[0.12em] text-white/80">{phase === 'regulation' ? 'Final live · Regulation' : phase === 'extra-time' ? 'Final live · Extra time' : phase === 'penalties' ? 'Final live · Shootout' : phase === 'completed' ? 'Final complete' : 'Next phase required'}</p></div>{isActive && <div className="grid grid-cols-2 gap-2 sm:flex"><button type="button" onClick={() => setPaused((value) => !value)} aria-pressed={paused} className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.07] px-4 text-xs font-black transition hover:bg-white/10">{paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}{paused ? 'Resume' : 'Pause'}</button><button type="button" onClick={finishPhase} className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-cyan-300 px-4 text-xs font-black text-[#001226]"><FastForward className="h-4 w-4" />Finish phase</button></div>}</div>{isActive && <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-rose-400 via-amber-300 to-cyan-300 transition-[width] duration-300 motion-reduce:transition-none" style={{ width: `${progress}%` }} /></div>}</div>
        )}

        {phase === 'half-time' && <DecisionPanel tone="cyan" title={`${stoppage.firstHalf ? `45+${stoppage.firstHalf}'` : "45'"} complete · Half-time`} body={`First-half score: ${score.home ?? 0}–${score.away ?? 0}. The live clock is paused and the second half will begin at 46′.`} action="Begin Second Half" onClick={beginSecondHalf} />}
        {phase === 'awaiting-extra-time' && <DecisionPanel tone="amber" title={`${stoppage.secondHalf ? `90+${stoppage.secondHalf}'` : "90'"} complete · Level score`} body="The final pauses here. Extra time starts at 91′; only stoppage after 105′ and 120′ uses the + format." action="Begin Extra Time Live" onClick={beginExtraTime} />}
        {phase === 'extra-time-interval' && <DecisionPanel tone="cyan" title={`105+${stoppage.extraTimeFirstHalf}' complete · Extra-time interval`} body={`Extra-time score: ${score.home ?? 0}–${score.away ?? 0}. The clock is paused; the second extra-time period will begin at 106′.`} action="Begin Second Extra-Time Period" onClick={beginExtraTimeSecondHalf} />}
        {phase === 'awaiting-penalties' && <DecisionPanel tone="rose" title={`${stoppage.extraTimeSecondHalf ? `120+${stoppage.extraTimeSecondHalf}'` : "120'"} complete · Still level`} body="The final will now be decided by a live, kick-by-kick shootout inside this match card." action="Begin Penalty Shootout Live" onClick={beginPenalties} />}

        {phase !== 'pending' && <section className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-3 sm:p-5"><div className="flex items-center justify-between gap-3"><p className="text-[10px] font-black uppercase tracking-[0.16em] text-cyan-200">Match timeline · team by team</p><span className="font-mono text-xs font-black text-white/45">{clockLabel}</span></div><div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_120px_minmax(0,1fr)]">{renderTeamTimeline(homeTeam, 'home', 'amber')}<div className="flex min-h-24 flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/[0.035] px-3 py-4 text-center"><span className="rounded-full border border-rose-300/25 bg-rose-300/10 px-2 py-1 text-[9px] font-black uppercase text-rose-200">{status}</span><span className="my-3 h-8 w-px bg-gradient-to-b from-transparent via-white/35 to-transparent" /><p className="font-mono text-xl font-black">{showPenalties ? `${penaltyScore.home}–${penaltyScore.away}` : `${score.home ?? 0}–${score.away ?? 0}`}</p><p className="mt-1 text-[9px] font-black uppercase tracking-wider text-white/35">{clockLabel}</p></div>{renderTeamTimeline(awayTeam, 'away', 'cyan')}</div></section>}

        {showPenalties && <PenaltyInline kicks={kicks} revealed={visibleKicks.length} homeTeam={homeTeam} awayTeam={awayTeam} score={penaltyScore} />}

        {phase === 'completed' && result.leg2.motm && <div className="mt-5 flex items-center gap-3 rounded-2xl border border-amber-300/30 bg-amber-300/[0.08] p-4"><img src={uclMvpCupImg} alt="MVP trophy" className="h-11 w-11 object-contain" /><div className="min-w-0"><p className="text-[9px] font-black uppercase tracking-[0.18em] text-amber-300">Final Man of the Match</p><p className="mt-1 whitespace-normal text-sm font-black [overflow-wrap:anywhere]">{result.leg2.motm.playerName}</p><p className="mt-0.5 text-[10px] text-white/45">{result.leg2.motm.teamName} · Awarded after {result.leg2.motm.finalizedAt === 'penalties' ? 'the shootout' : `${result.leg2.motm.finalizedAt}′`}</p></div></div>}
      </div>
    </article>
  );
};

const TimelineMoment: React.FC<{ event: TimelineEvent; alignRight: boolean }> = ({ event, alignRight }) => <div className={`rounded-xl border border-white/[0.08] bg-black/20 p-3 ${alignRight ? 'lg:text-right' : ''}`}><div className={`flex items-center justify-between gap-2 ${alignRight ? 'lg:flex-row-reverse' : ''}`}><span className="font-mono text-xs font-black text-amber-200">{event.displayMinute}</span><span className="text-[9px] font-black uppercase tracking-wider text-white/35">{event.phase === 'extra-time' ? 'ET' : event.isPenalty ? 'PEN' : 'Goal'}</span></div><p className="mt-2 whitespace-normal text-sm font-black leading-5 [overflow-wrap:anywhere]">{event.playerName}{event.isOwnGoal ? ' (OG)' : ''}</p>{event.assistPlayerName && <p className="mt-1 whitespace-normal text-[10px] leading-4 text-white/45 [overflow-wrap:anywhere]">Assist · {event.assistPlayerName}</p>}</div>;

const DecisionPanel: React.FC<{ tone: 'amber' | 'rose' | 'cyan'; title: string; body: string; action: string; onClick: () => void }> = ({ tone, title, body, action, onClick }) => {
  const panelClass = tone === 'amber' ? 'border-amber-300/35 bg-amber-300/[0.08]' : tone === 'rose' ? 'border-rose-300/35 bg-rose-300/[0.08]' : 'border-cyan-300/35 bg-cyan-300/[0.08]';
  const iconClass = tone === 'amber' ? 'text-amber-200' : tone === 'rose' ? 'text-rose-200' : 'text-cyan-200';
  const buttonClass = tone === 'amber' ? 'bg-amber-300' : tone === 'rose' ? 'bg-rose-300' : 'bg-cyan-300';
  return <div className={`mt-5 rounded-2xl border p-4 text-center sm:p-6 ${panelClass}`}><TimerReset className={`mx-auto h-7 w-7 ${iconClass}`} /><p className="mt-3 text-lg font-black">{title}</p><p className="mx-auto mt-1 max-w-xl text-sm leading-6 text-white/55">{body}</p><button type="button" onClick={onClick} className={`mt-4 inline-flex min-h-12 items-center gap-2 rounded-xl px-5 text-sm font-black text-[#251700] ${buttonClass}`}>{action}<ChevronRight className="h-4 w-4" /></button></div>;
};

const PenaltyInline: React.FC<{ kicks: UCLPenaltyKick[]; revealed: number; homeTeam: Team; awayTeam: Team; score: { home: number; away: number } }> = ({ kicks, revealed, homeTeam, awayTeam, score }) => <section className="mt-5 rounded-2xl border border-rose-300/30 bg-rose-300/[0.055] p-3 sm:p-5"><div className="flex items-center justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-rose-200">Penalty shootout · Live</p><p className="mt-1 text-xs text-white/45">Every kick remains inside the final card.</p></div><span className="rounded-full border border-rose-300/25 bg-rose-300/10 px-3 py-1 font-mono text-sm font-black text-rose-100">{score.home}–{score.away}</span></div><div className="mt-4 grid gap-3 sm:grid-cols-2">{(['home', 'away'] as const).map((side) => { const team = side === 'home' ? homeTeam : awayTeam; const sideKicks = kicks.filter((kick) => kick.team === side); return <div key={side} className="rounded-xl border border-white/10 bg-black/20 p-3"><div className="flex items-center gap-2"><img src={team.logo} alt="" className="h-7 w-7 object-contain" /><p className="whitespace-normal text-sm font-black [overflow-wrap:anywhere]">{team.name}</p></div><div className="mt-3 space-y-2">{sideKicks.map((kick, index) => { const sequenceIndex = kicks.indexOf(kick); const isRevealed = sequenceIndex < revealed; return <div key={`${kick.round}-${sequenceIndex}`} className={`flex min-h-10 items-center gap-2 rounded-lg px-2.5 text-xs ${isRevealed ? 'bg-white/[0.055]' : 'bg-white/[0.02] text-white/25'}`}><span className="w-4 font-mono text-white/40">{index + 1}</span>{isRevealed ? <img src={uclBallImg} alt="" className={`h-5 w-5 object-contain ${kick.scored ? '' : 'grayscale opacity-30'}`} /> : <span className="h-5 w-5 rounded-full border border-white/15" />}<span className="min-w-0 flex-1 whitespace-normal font-bold leading-4 [overflow-wrap:anywhere]">{isRevealed ? kick.playerName : 'Awaiting kick'}</span><span className={isRevealed ? kick.scored ? 'text-emerald-200' : 'text-rose-200' : ''}>{isRevealed ? penaltyLabel(kick) : '—'}</span></div>; })}</div></div>; })}</div></section>;
