import { useMemo } from 'react';
import { Award, Star, X, User } from 'lucide-react';
import type { LeagueMatch } from '../../types/leagueConfig';

interface EPLPlayerGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerId: string;
  playerName: string;
  teamId: string;
  teamName: string;
  fixtures: LeagueMatch[];
  logoMap: Record<string, string>;
  teamsById: Record<string, { name: string; shortName: string }>;
}

interface GoalEntry {
  /** e.g. "45+2'" */
  displayMinute: string;
  /** Sort key */
  sortMinute: number;
  /** Opponent team name */
  opponentName: string;
  /** Opponent team ID (for logo lookup) */
  opponentId: string;
  /** Matchweek number */
  matchweek: number;
  /** Whether this was a penalty */
  isPenalty: boolean;
}

/**
 * Build the player's complete goal list from all completed EPL fixtures.
 * Also counts MOTM awards.
 */
const buildGoalTimeline = (
  playerId: string,
  teamId: string,
  playerName: string,
  fixtures: LeagueMatch[],
): { goals: GoalEntry[]; totalGoals: number; totalMotm: number } => {
  const goals: GoalEntry[] = [];
  let totalMotm = 0;

  for (const match of fixtures) {
    if (match.status !== 'completed') continue;

    const isHome = match.homeTeamId === teamId;
    const isAway = match.awayTeamId === teamId;
    if (!isHome && !isAway) continue;

    // Check MOTM
    if (
      match.motm &&
      match.motm.playerId === playerId &&
      match.motm.teamId === teamId
    ) {
      totalMotm += 1;
    }

    // Extract goals from timeline (primary source)
    if (match.timeline && match.timeline.length > 0) {
      for (const event of match.timeline) {
        if (event.playerId === playerId && event.teamId === teamId) {
          const opponentId = isHome ? match.awayTeamId : match.homeTeamId;
          goals.push({
            displayMinute: event.displayMinute,
            sortMinute: event.sortMinute,
            opponentName: '', // Will be resolved below
            opponentId,
            matchweek: match.matchweek,
            isPenalty: event.isPenalty ?? false,
          });
        }
      }
    }
    // Fallback: use scorers object
    else if (match.scorers) {
      const side = isHome ? match.scorers.home : match.scorers.away;
      for (const event of side) {
        if (event.playerId === playerId) {
          const opponentId = isHome ? match.awayTeamId : match.homeTeamId;
          goals.push({
            displayMinute: `${event.minute}'`,
            sortMinute: event.minute,
            opponentName: '',
            opponentId,
            matchweek: match.matchweek,
            isPenalty: false,
          });
        }
      }
    }
  }

  // Sort by matchweek, then by minute
  goals.sort((a, b) => a.matchweek - b.matchweek || a.sortMinute - b.sortMinute);

  return { goals, totalGoals: goals.length, totalMotm };
};

export const EPLPlayerGoalModal = ({
  isOpen,
  onClose,
  playerId,
  playerName,
  teamId,
  teamName,
  fixtures,
  logoMap,
  teamsById,
}: EPLPlayerGoalModalProps) => {
  const { goals, totalGoals, totalMotm } = useMemo(
    () => buildGoalTimeline(playerId, teamId, playerName, fixtures),
    [playerId, teamId, playerName, fixtures],
  );

  // Resolve opponent names
  const resolvedGoals = useMemo(
    () =>
      goals.map((g) => ({
        ...g,
        opponentName: teamsById[g.opponentId]?.name ?? g.opponentId,
      })),
    [goals, teamsById],
  );

  if (!isOpen) return null;

  const teamLogo = logoMap[teamId];

  return (
    <div className="fixed inset-0 z-[100] flex flex-col justify-end sm:items-center sm:justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal — bottom-sheet on mobile, centered on desktop */}
      <div className="relative mx-auto flex max-h-[85dvh] w-full flex-col overflow-hidden rounded-t-[32px] border-t border-white/10 bg-[#0c0c16] shadow-[0_-12px_40px_rgba(0,0,0,0.5)] sm:max-h-[80vh] sm:w-[min(560px,92vw)] sm:rounded-[28px] sm:border sm:border-white/15 sm:shadow-[0_20px_60px_rgba(0,0,0,0.55)]">
        {/* Decorative gradient */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(225,29,143,0.06),transparent_40%),radial-gradient(circle_at_bottom_right,rgba(245,158,11,0.05),transparent_50%)]" />

        {/* Mobile drag handle */}
        <div className="flex shrink-0 justify-center pt-3 pb-1 sm:hidden">
          <div className="h-1.5 w-12 rounded-full bg-white/20" />
        </div>

        {/* Header */}
        <div className="relative flex shrink-0 items-start justify-between gap-3 px-5 pb-4 pt-2 sm:px-6 sm:pt-6">
          <div className="flex items-center gap-3">
            {teamLogo ? (
              <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center overflow-hidden rounded-full border border-white/12 bg-white p-1">
                <img src={teamLogo} alt="" className="h-full w-full object-contain" />
              </div>
            ) : (
              <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center overflow-hidden rounded-full border border-white/12 bg-white/[0.06]">
                <User className="h-6 w-6 text-white/40" />
              </div>
            )}
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-white leading-tight">{playerName}</h3>
              <div className="mt-0.5 text-[13px] sm:text-sm text-white/60">
                {teamName}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-full sm:rounded-xl border border-white/10 bg-white/[0.04] p-2 sm:p-2.5 text-white/70 transition hover:bg-white/[0.08] hover:text-white"
            aria-label="Close player profile"
          >
            <X className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        </div>

        {/* Stat badges */}
        <div className="relative flex gap-3 px-5 sm:px-6">
          <div className="flex-1 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-3 py-3 sm:px-4 text-center">
            <div className="text-[10px] uppercase tracking-[0.2em] text-emerald-300/70">
              Goals
            </div>
            <div className="mt-1 text-2xl sm:text-3xl font-black text-white">{totalGoals}</div>
          </div>
          <div className="flex-1 rounded-2xl border border-amber-400/20 bg-amber-500/10 px-3 py-3 sm:px-4 text-center">
            <div className="text-[10px] uppercase tracking-[0.2em] text-amber-300/70">
              MOTM
            </div>
            <div className="mt-1 text-2xl sm:text-3xl font-black text-white">{totalMotm}</div>
          </div>
        </div>

        {/* Goal Timeline */}
        <div className="relative mt-4 flex-1 overflow-y-auto px-5 pb-8 sm:px-6 sm:pb-6 overscroll-contain">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#e11d8f]/55">
            <Award className="h-4 w-4" />
            Season Goal Log
          </div>

          {resolvedGoals.length > 0 ? (
            <div className="relative mt-3 space-y-2">
              {resolvedGoals.map((goal, index) => {
                const opponentLogo = logoMap[goal.opponentId];
                return (
                  <div
                    key={`${goal.matchweek}-${goal.sortMinute}-${index}`}
                    className="relative flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2.5 transition hover:bg-white/[0.06]"
                  >
                    {/* Minute badge */}
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-emerald-400/20 bg-emerald-500/10 text-xs font-black text-emerald-300">
                      {goal.displayMinute}
                    </div>

                    {/* Goal info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {/* vs Opponent */}
                        <span className="text-xs sm:text-[13px] font-bold text-white/85">
                          vs
                        </span>
                        {opponentLogo && (
                          <img src={opponentLogo} alt="" className="h-4 w-4 object-contain shrink-0" />
                        )}
                        <span className="text-xs sm:text-[13px] font-bold text-white/85 truncate">
                          {goal.opponentName}
                        </span>
                      </div>
                      <div className="mt-0.5 flex items-center gap-1.5">
                        <span className="text-[10px] sm:text-[11px] text-white/40">
                          Matchweek {goal.matchweek}
                        </span>
                        {goal.isPenalty && (
                          <span className="inline-flex items-center gap-0.5 rounded-full border border-amber-400/30 bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-amber-300">
                            PEN
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Goal icon */}
                    <div className="shrink-0 text-emerald-400/60">
                      <Star className="h-3.5 w-3.5" />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Empty state */
            <div className="mt-4 flex flex-col items-center rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-8 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/[0.06]">
                <User className="h-7 w-7 text-white/30" />
              </div>
              <p className="mt-4 text-sm font-semibold text-white/55">
                No goals scored this season
              </p>
              <p className="mt-1 max-w-[260px] text-xs text-white/35">
                But contributing greatly to team play and spirit
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
