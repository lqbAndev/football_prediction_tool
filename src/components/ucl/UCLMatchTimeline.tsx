import { useState } from 'react';
import { Clock } from 'lucide-react';
import { ChevronDown as ChevronDownIcon, ChevronUp as ChevronUpIcon } from 'lucide';
import type { MatchScorers, Team, TimelineEvent } from '../../types/tournament';
import type { UCLMatchMOTM } from '../../types/uclConfig';
import uclMvpCupImg from '../../img/CUP COMPETITION/UCL/ucl_mvp_cup.png';
import { UCLMorphIcon } from './UCLMorphIcon';
import { UCLGoalLine, type UCLGoalLineEvent } from './UCLGoalLine';

interface UCLMatchTimelineProps {
  matchId: string;
  homeTeam: Team;
  awayTeam: Team;
  timeline?: TimelineGoal[];
  scorers?: MatchScorers;
  extraTimeTimeline?: TimelineGoal[];
  extraTimeScorers?: MatchScorers;
  motm?: Pick<UCLMatchMOTM, 'playerName' | 'teamName'> & Partial<Pick<UCLMatchMOTM, 'finalizedAt'>> | null;
  motmPending?: boolean;
  pendingPhase?: string;
  showFinalizedAt?: boolean;
}

type GoalLineEvent = UCLGoalLineEvent;
type TimelineGoal = Pick<TimelineEvent, 'sortMinute' | 'displayMinute' | 'playerName' | 'side'> &
  Partial<Pick<TimelineEvent, 'isPenalty' | 'isOwnGoal' | 'phase' | 'assistPlayerName'>>;

export const UCLMatchTimeline: React.FC<UCLMatchTimelineProps> = ({
  matchId, homeTeam, awayTeam, timeline = [], scorers,
  extraTimeTimeline = [], extraTimeScorers, motm, motmPending = false,
  pendingPhase, showFinalizedAt = false,
}) => {
  const [expanded, setExpanded] = useState(false);
  const resolveEvents = (
    events: TimelineGoal[], fallback: MatchScorers | undefined,
    side: 'home' | 'away', phase: TimelineEvent['phase'],
  ): GoalLineEvent[] => {
    const goals = events.filter(event => event.side === side).sort((a, b) => a.sortMinute - b.sortMinute);
    return goals.length > 0 ? goals.map(goal => ({ ...goal, isPenalty: goal.isPenalty ?? false, phase: goal.phase ?? phase })) : (fallback?.[side] || []).map(goal => ({
      displayMinute: `${goal.minute}'`, playerName: goal.playerName,
      isPenalty: goal.isPenalty ?? false, isOwnGoal: goal.isOwnGoal, phase,
      assistPlayerName: goal.assistPlayerName,
    }));
  };

  return (
    <div>
      {motm ? (
        <div className="mb-3 flex items-center gap-3 rounded-2xl border border-amber-300/25 bg-amber-300/[0.08] px-3 py-2.5">
          <img src={uclMvpCupImg} alt="MVP trophy" className="h-9 w-9 shrink-0 object-contain drop-shadow-[0_0_10px_rgba(251,191,36,0.35)] sm:h-10 sm:w-10" />
          <div className="min-w-0">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-300">Man of the Match</p>
            <p className="truncate text-sm font-black text-white">{motm.playerName}</p>
          </div>
          <div className="ml-auto hidden min-w-0 text-right sm:block">
            <p className="truncate text-[10px] font-semibold text-white/45">{motm.teamName}</p>
            {showFinalizedAt && motm.finalizedAt && <p className="text-[8px] font-black uppercase tracking-wider text-amber-200/60">{motm.finalizedAt === 'penalties' ? 'After penalties' : `After ${motm.finalizedAt}′`}</p>}
          </div>
        </div>
      ) : motmPending ? (
        <div className="mb-3 rounded-2xl border border-sky-300/20 bg-sky-300/[0.06] px-3 py-2 text-center">
          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-sky-200/65">MOTM pending</p>
          <p className="mt-0.5 text-xs font-semibold text-white/55">{pendingPhase}</p>
        </div>
      ) : null}
      <button
        type="button" aria-expanded={expanded} aria-controls={`ucl-timeline-${matchId}`}
        onClick={() => setExpanded(current => !current)}
        className="flex w-full items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3 text-left text-sm font-bold text-white/70 transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:border-sky-300/25 hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
      >
        <span className="flex items-center gap-2"><Clock className="h-4 w-4 text-sky-300" />Match Timeline</span>
        <UCLMorphIcon icon={expanded ? ChevronUpIcon : ChevronDownIcon} size={16} strokeWidth={2} />
      </button>
      <div id={`ucl-timeline-${matchId}`} hidden={!expanded} className="mt-3">
        <div className="grid gap-3 rounded-2xl bg-black/15 p-3 sm:grid-cols-2 sm:gap-4">
          {(['home', 'away'] as const).map(side => {
            const team = side === 'home' ? homeTeam : awayTeam;
            const goals = [...resolveEvents(timeline, scorers, side, 'regulation'), ...resolveEvents(extraTimeTimeline, extraTimeScorers, side, 'extra-time')];
            return (
              <section key={side} aria-label={`${team.name} goals`} className={`min-w-0 space-y-2 ${side === 'home' ? 'border-b border-white/10 pb-3 sm:border-b-0 sm:border-r sm:pb-0 sm:pr-2' : 'text-right sm:pl-2'}`}>
                {goals.length > 0 ? goals.map((event, index) => (
                  <UCLGoalLine key={index} event={event} alignRight={side === 'away'} />
                )) : <span className="text-xs italic text-white/25">No goals</span>}
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
};
