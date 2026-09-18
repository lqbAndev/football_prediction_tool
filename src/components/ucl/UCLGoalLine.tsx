import type { TimelineEvent } from '../../types/tournament';
import uclBallImg from '../../img/CUP COMPETITION/UCL/ball/ucl_ball_26-27.png';

export type UCLGoalLineEvent = Pick<TimelineEvent, 'displayMinute' | 'playerName'> &
  Partial<Pick<TimelineEvent, 'isPenalty' | 'isOwnGoal' | 'phase' | 'assistPlayerName'>>;

/** Shared attribution row for league, both knockout legs and extra time. */
export const UCLGoalLine = ({ event, alignRight = false }: { event: UCLGoalLineEvent; alignRight?: boolean }) => (
  <div className={`min-w-0 text-xs ${alignRight ? 'text-right' : 'text-left'}`}>
    <div className={`flex min-w-0 items-start gap-1.5 ${alignRight ? 'flex-row-reverse' : ''}`}>
      <img src={uclBallImg} alt="Goal" className="h-5 w-5 shrink-0 object-contain" />
      <span className={`shrink-0 pt-0.5 font-mono font-black ${event.phase === 'extra-time' ? 'text-amber-300' : 'text-sky-300'}`}>{event.displayMinute}</span>
      <div className={`flex min-w-0 flex-wrap items-baseline gap-x-1.5 gap-y-1 pt-0.5 ${alignRight ? 'justify-end' : ''}`}>
        <span className="min-w-0 break-words font-semibold text-white/90">{event.playerName}</span>
        {event.phase === 'extra-time' && <span className="rounded bg-amber-400/15 px-1 py-0.5 text-[8px] font-black text-amber-300">ET</span>}
        {event.isPenalty && <span className="rounded bg-amber-400/15 px-1 py-0.5 text-[8px] font-black text-amber-300">PEN</span>}
        {event.isOwnGoal && <span className="rounded bg-rose-400/15 px-1.5 py-0.5 text-[8px] font-black tracking-wide text-rose-200">OWN GOAL</span>}
      </div>
    </div>
    {!event.isOwnGoal && !event.isPenalty && event.assistPlayerName && (
      <p className={`mt-0.5 break-words text-[10px] leading-relaxed text-sky-100/70 ${alignRight ? 'pr-6' : 'pl-6'}`}>
        <span className="font-semibold text-sky-300/85">Assist · </span>{event.assistPlayerName}
      </p>
    )}
  </div>
);
