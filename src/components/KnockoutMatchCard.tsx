import { useState } from 'react';
import { Award, ChevronDown, Clock, Crosshair } from 'lucide-react';
import { ROUND_LABELS } from '../data/tournament';
import { useTeamsById } from '../hooks/CompetitionContext';
import type {
  KnockoutMatch,
  KnockoutRound,
  KnockoutTeamOrigin,
} from '../types/tournament';
import { Flag } from './Flag';
import { PenaltyDetailsModal } from './PenaltyDetailsModal';
import { TriondaBall } from './BrandAssets';

interface KnockoutMatchCardProps {
  match: KnockoutMatch;
  round: KnockoutRound;
  title: string;
  teamOrigins: Record<string, KnockoutTeamOrigin>;
  variant?: 'overview' | 'center' | 'third';
  onPredict: (round: KnockoutRound, matchId: string) => void;
  onResolvePenalty: (round: KnockoutRound, matchId: string) => void;
}

const CARD_VARIANTS = {
  overview: 'border-white/10 bg-[linear-gradient(180deg,rgba(10,18,30,0.9),rgba(9,16,27,0.82))]',
  center: 'border-host-canada/22 bg-[linear-gradient(165deg,rgba(20,35,59,0.96),rgba(10,18,30,0.96))] shadow-brand',
  third: 'border-white/12 bg-white/[0.05]',
} as const;

const NAME_VARIANTS = {
  overview: 'text-[13px]',
  center: 'text-[15px]',
  third: 'text-[13px]',
} as const;

const SCORE_VARIANTS = {
  overview: 'text-lg',
  center: 'text-xl',
  third: 'text-lg',
} as const;

const formatScore = (home: number | null, away: number | null) =>
  home === null || away === null ? '- : -' : `${home} : ${away}`;

const getStatusLabel = (match: KnockoutMatch, hasTeams: boolean) => {
  if (match.status === 'completed') {
    return 'Completed';
  }

  if (match.status === 'awaiting-penalties') {
    return 'Awaiting Penalty';
  }

  return hasTeams ? 'Not Predicted' : 'Awaiting Teams';
};

export const KnockoutMatchCard = ({
  match,
  round,
  title,
  teamOrigins,
  variant = 'overview',
  onPredict,
  onResolvePenalty,
}: KnockoutMatchCardProps) => {
  const teamsById = useTeamsById();
  const homeTeam = match.homeTeamId ? teamsById[match.homeTeamId] : null;
  const awayTeam = match.awayTeamId ? teamsById[match.awayTeamId] : null;
  const hasTeams = Boolean(match.homeTeamId && match.awayTeamId);
  const isCompleted = match.status === 'completed';
  const waitingPenalty = match.status === 'awaiting-penalties';
  const canPredict = match.status === 'pending' && hasTeams;
  const totalGoals = (match.scorers?.home.length ?? 0) + (match.scorers?.away.length ?? 0);
  const hasRegulationScore = match.regulationHomeScore !== null && match.regulationAwayScore !== null;
  const hasExtraTimeScore = match.extraTimeHomeScore !== null && match.extraTimeAwayScore !== null;

  const homeWinner = Boolean(match.winnerTeamId && match.winnerTeamId === match.homeTeamId);
  const awayWinner = Boolean(match.winnerTeamId && match.winnerTeamId === match.awayTeamId);
  const statusLabel = getStatusLabel(match, hasTeams);
  const statusClass = isCompleted
    ? 'border-host-mexico/28 bg-host-mexico/12 text-host-ice'
    : waitingPenalty
      ? 'border-host-canada/28 bg-host-canada/12 text-host-ice'
      : 'border-white/10 bg-white/[0.04] text-host-ice/62';

  const homeOriginLabel = match.homeTeamId ? teamOrigins[match.homeTeamId]?.label ?? null : null;
  const awayOriginLabel = match.awayTeamId ? teamOrigins[match.awayTeamId]?.label ?? null : null;
  const homeDisplayScore =
    match.extraTimeHomeScore ?? match.regulationHomeScore ?? match.homeScore;
  const awayDisplayScore =
    match.extraTimeAwayScore ?? match.regulationAwayScore ?? match.awayScore;

  const actionLabel = waitingPenalty
    ? 'Penalty Shootout'
    : canPredict
      ? 'Predict'
      : isCompleted
        ? 'Match Completed'
        : 'Awaiting Teams';

  const handleAction = () => {
    if (waitingPenalty) {
      onResolvePenalty(round, match.id);
      return;
    }

    if (canPredict) {
      onPredict(round, match.id);
    }
  };

  // Scorer/timeline state
  const [timelineExpanded, setTimelineExpanded] = useState(false);
  const [showPenaltyModal, setShowPenaltyModal] = useState(false);
  const hasTimeline = match.timeline && match.timeline.length > 0;
  const homeTimelineEvents = match.timeline?.filter((e) => e.side === 'home') ?? [];
  const awayTimelineEvents = match.timeline?.filter((e) => e.side === 'away') ?? [];

  const renderTeamRow = (
    teamName: string | null,
    seedLabel: string | null,
    score: number | null,
    originLabel: string | null,
    showOrigin: boolean,
    winner: boolean,
  ) => (
    <div className={`flex items-start justify-between gap-3 px-3 py-2 ${winner ? 'bg-host-mexico/[0.08]' : ''}`}>
      <div className="min-w-0 flex items-start gap-2">
        <Flag teamName={teamName} size={18} />
        <div className="min-w-0">
          <span
            className={`block whitespace-normal break-words font-semibold leading-5 text-white ${NAME_VARIANTS[variant]} ${!teamName ? 'text-white/62' : ''
              }`}
          >
            {teamName ?? seedLabel ?? 'TBD'}
          </span>

          {teamName && showOrigin ? (
            <span className="mt-0.5 block text-[10px] uppercase tracking-[0.12em] text-host-ice/58">
              {originLabel ?? 'Determining Source'}
            </span>
          ) : null}
        </div>
      </div>

      <span
        className={`shrink-0 font-bold ${SCORE_VARIANTS[variant]} ${winner ? 'text-host-mexico' : 'text-white'}`}
      >
        {score ?? '-'}
      </span>
    </div>
  );

  return (
    <article className={`rounded-[20px] border p-2.5 ${CARD_VARIANTS[variant]}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-host-ice/45">{ROUND_LABELS[round]}</div>
          <div className="mt-1 text-[10px] uppercase tracking-[0.16em] text-host-ice/32">{title}</div>
        </div>

        <span className={`rounded-full border px-2 py-1 text-[10px] uppercase tracking-[0.18em] ${statusClass}`}>
          {statusLabel}
        </span>
      </div>

      <div className="mt-2 overflow-hidden rounded-[16px] border border-white/8 bg-black/15">
        {renderTeamRow(
          homeTeam?.name ?? null,
          match.homeSeedLabel,
          homeDisplayScore,
          homeOriginLabel,
          round === 'roundOf32',
          homeWinner,
        )}
        <div className="h-px bg-white/8" />
        {renderTeamRow(
          awayTeam?.name ?? null,
          match.awaySeedLabel,
          awayDisplayScore,
          awayOriginLabel,
          round === 'roundOf32',
          awayWinner,
        )}
      </div>

      {/* Score badges (regulation / extra time / penalty) */}
      {hasRegulationScore || hasExtraTimeScore || match.penalty || (isCompleted && totalGoals === 0) ? (
        <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.18em]">
          {hasRegulationScore ? (
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-host-ice/78">
              90p {formatScore(match.regulationHomeScore, match.regulationAwayScore)}
            </span>
          ) : null}

          {hasExtraTimeScore ? (
            <span className="rounded-full border border-host-canada/24 bg-host-canada/10 px-2.5 py-1 text-host-ice">
              120p {formatScore(match.extraTimeHomeScore, match.extraTimeAwayScore)}
            </span>
          ) : null}

          {match.penalty ? (
            <span
              role="button"
              tabIndex={0}
              onClick={() => setShowPenaltyModal(true)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setShowPenaltyModal(true); }}
              title="View penalty shootout details"
              className="cursor-pointer rounded-full border border-host-mexico/24 bg-host-mexico/10 px-2.5 py-1 text-host-ice transition hover:border-host-mexico/50 hover:bg-host-mexico/20 hover:underline"
            >
              Penalty {match.penalty.home}-{match.penalty.away} ↗
            </span>
          ) : null}

          {isCompleted && totalGoals === 0 ? (
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-host-ice/62">
              No goals
            </span>
          ) : null}
        </div>
      ) : null}

      {isCompleted && match.motm ? (
        <div className="mt-2 flex items-center gap-2 rounded-[14px] border border-host-mexico/20 bg-host-mexico/10 px-3 py-2">
          <span className="text-[10px] uppercase tracking-[0.2em] text-host-ice/62">MOTM:</span>
          <Flag teamName={match.motm.teamName} size={16} />
          <span className="text-host-ice/45">-</span>
          <span className="text-sm font-bold text-host-ice">{match.motm.playerName}</span>
        </div>
      ) : null}

      {/* Expandable Scorers for knockout */}
      {(isCompleted || waitingPenalty) && (hasTimeline || match.penalty) ? (
        <div className="mt-2">
          <button
            type="button"
            onClick={() => setTimelineExpanded(!timelineExpanded)}
            className="inline-flex w-full items-center justify-between gap-2 rounded-[14px] border border-white/8 bg-white/[0.03] px-3 py-2 text-left text-sm text-white/70 transition hover:bg-white/[0.06]"
          >
            <span className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-host-mexico/60" />
              <span className="text-[10px] uppercase tracking-[0.18em]">Match Timeline</span>
            </span>
            <ChevronDown
              className={`h-4 w-4 text-white/40 transition-transform duration-200 ${timelineExpanded ? 'rotate-180' : ''
                }`}
            />
          </button>

          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${timelineExpanded ? 'mt-2 max-h-[800px] opacity-100' : 'max-h-0 opacity-0'
              }`}
          >
            {/* Per-team scorers */}
            {hasTimeline && (
              <div className="grid gap-2 md:grid-cols-2">
                <div className="rounded-[14px] border border-white/8 bg-white/[0.03] p-2.5">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-emerald-200/50">
                    {homeTeam?.shortName ?? 'Home'}
                  </p>
                  <div className="mt-1.5 space-y-0.5">
                    {homeTimelineEvents.length > 0 ? (
                      homeTimelineEvents.map((event, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 text-[12px] text-white/75">
                          <TriondaBall size={12} />
                          <span className="shrink-0 font-mono text-[10px] text-emerald-300/45">
                            {event.displayMinute}
                          </span>
                          <span>
                            {event.playerName}
                            {event.isPenalty && (
                              <span className="ml-0.5 text-[9px] font-bold text-amber-300/70">PEN</span>
                            )}
                            {event.isOwnGoal && (
                              <span className="ml-0.5 text-[9px] font-bold text-red-400/80">OG</span>
                            )}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-[11px] text-white/35">No goals</p>
                    )}
                  </div>
                </div>
                <div className="rounded-[14px] border border-white/8 bg-white/[0.03] p-2.5">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-cyan-200/50">
                    {awayTeam?.shortName ?? 'Away'}
                  </p>
                  <div className="mt-1.5 space-y-0.5">
                    {awayTimelineEvents.length > 0 ? (
                      awayTimelineEvents.map((event, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 text-[12px] text-white/75">
                          <TriondaBall size={12} />
                          <span className="shrink-0 font-mono text-[10px] text-cyan-300/45">
                            {event.displayMinute}
                          </span>
                          <span>
                            {event.playerName}
                            {event.isPenalty && (
                              <span className="ml-0.5 text-[9px] font-bold text-amber-300/70">PEN</span>
                            )}
                            {event.isOwnGoal && (
                              <span className="ml-0.5 text-[9px] font-bold text-red-400/80">OG</span>
                            )}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-[11px] text-white/35">No goals</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Penalty shootout separate section */}
            {match.penalty && (
              <div className={`${hasTimeline ? 'mt-2' : ''} rounded-[14px] border border-host-canada/20 bg-host-canada/8 p-2.5`}>
                <p className="text-[10px] uppercase tracking-[0.22em] text-host-canada/70 mb-1.5 flex items-center gap-1.5">
                  <Award className="h-3 w-3" />
                  Penalty Shootout (after 120')
                </p>
                <div className="flex items-center gap-3 text-sm font-semibold">
                  <div className="flex items-center gap-2">
                    <Flag teamName={homeTeam?.name ?? null} size={16} />
                    <span className="text-white">{homeTeam?.shortName ?? 'Home'}</span>
                    <span className={`text-lg font-bold ${match.penalty.home > match.penalty.away ? 'text-host-mexico' : 'text-white/60'}`}>
                      {match.penalty.home}
                    </span>
                  </div>
                  <span className="text-white/30">-</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-lg font-bold ${match.penalty.away > match.penalty.home ? 'text-host-mexico' : 'text-white/60'}`}>
                      {match.penalty.away}
                    </span>
                    <span className="text-white">{awayTeam?.shortName ?? 'Away'}</span>
                    <Flag teamName={awayTeam?.name ?? null} size={16} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : /* Legacy fallback: scorers without timeline */
        totalGoals > 0 && !hasTimeline ? (
          <div className="mt-2 rounded-[14px] border border-white/8 bg-white/[0.04] px-3 py-3 text-[13px] leading-6 text-white/82">
            <div className="break-words">
              {homeTeam?.name ?? match.homeSeedLabel ?? 'TBD'}:{' '}
              {match.scorers?.home.length
                ? match.scorers.home.map((e) => `${e.playerName} ${e.minute}'`).join(', ')
                : 'No goals'}
            </div>
            <div className="mt-1 break-words">
              {awayTeam?.name ?? match.awaySeedLabel ?? 'TBD'}:{' '}
              {match.scorers?.away.length
                ? match.scorers.away.map((e) => `${e.playerName} ${e.minute}'`).join(', ')
                : 'No goals'}
            </div>
          </div>
        ) : null}

      {canPredict || waitingPenalty ? (
        <button
          type="button"
          disabled={!canPredict && !waitingPenalty}
          onClick={handleAction}
          className={`mt-2 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-3 py-2 text-sm font-semibold transition ${waitingPenalty
              ? 'border border-host-canada/35 bg-host-canada/16 text-host-ice hover:-translate-y-0.5 hover:bg-host-canada/22'
              : canPredict
                ? 'border border-host-mexico/35 bg-host-mexico/16 text-host-ice hover:-translate-y-0.5 hover:bg-host-mexico/22'
                : 'cursor-not-allowed border border-white/10 bg-white/5 text-white/35'
            }`}
        >
          {waitingPenalty ? <Award className="h-4 w-4" /> : <Crosshair className="h-4 w-4" />}
          {actionLabel}
        </button>
      ) : null}

      {showPenaltyModal && (
        <PenaltyDetailsModal
          match={match}
          isOpen={showPenaltyModal}
          onClose={() => setShowPenaltyModal(false)}
        />
      )}
    </article>
  );
};
