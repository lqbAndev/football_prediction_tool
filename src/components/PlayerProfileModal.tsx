import { useMemo } from 'react';
import { Award, Star, Trophy, User, X, Shield, Check } from 'lucide-react';
import { ROUND_LABELS, TEAMS_BY_ID } from '../data/tournament';
import type {
  GroupMatch,
  KnockoutMatch,
  KnockoutRound,
} from '../types/tournament';
import { Flag } from './Flag';
import { TriondaBall } from './BrandAssets';

interface PlayerProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerId: string;
  teamId: string;
  playerName: string;
  position?: string;
  groupMatches: GroupMatch[];
  knockoutMatches: Record<KnockoutRound, KnockoutMatch[]>;
}

interface TimelineEntry {
  /** e.g. "Scored 2 goals — Quarter Finals vs Brazil" */
  description: string;
  /** Sort key for chronological order */
  sortOrder: number;
  /** Type badge colour */
  type: 'goal' | 'motm' | 'both' | 'cleansheet' | 'cleansheet+motm' | 'win';
  /** Opponent team name */
  opponent: string;
  /** Round display label */
  roundLabel: string;
  ptsBreakdown?: string;
  matchPoints?: number;
}

const getTeamName = (teamId: string | null): string =>
  teamId ? (TEAMS_BY_ID[teamId]?.name ?? teamId) : 'TBD';

/**
 * Build the player's match-by-match timeline from all completed matches.
 *
 * For every completed match we check:
 *   1. How many goals the player scored (via timeline or fallback scorers).
 *   2. Whether the player was awarded MOTM.
 *   3. Team success and clean sheet points.
 */
const buildPlayerTimeline = (
  playerId: string,
  teamId: string,
  playerName: string,
  position: string | undefined,
  groupMatches: GroupMatch[],
  knockoutMatches: Record<KnockoutRound, KnockoutMatch[]>,
): { totalGoalsOrCleanSheets: number; totalMotm: number; totalPoints: number; timeline: TimelineEntry[], isGK: boolean } => {
  const isGK = position === 'GK';
  const isDF = position === 'DF' || position === 'DEF';
  const isMF = position === 'MF' || position === 'MID';
  const isFW = position === 'FW' || position === 'ATT';
  
  let totalGoalsOrCleanSheets = 0;
  let totalMotm = 0;
  let totalPoints = 0;
  const timeline: TimelineEntry[] = [];

  // Identify if player is Goalkeeper #1
  const teamData = TEAMS_BY_ID[teamId];
  const gks = teamData?.players.filter(p => p.position === 'GK') || [];
  const isPrimaryGK = gks.length > 0 && gks[0].id === playerId;

  const processMatch = (
    match: GroupMatch | KnockoutMatch,
    roundLabel: string,
    sortOrder: number,
  ) => {
    if (match.status !== 'completed') return;

    const homeScore = match.homeScore ?? 0;
    const awayScore = match.awayScore ?? 0;
    const isKnockout = match.stage === 'knockout';
    const round = isKnockout ? (match as KnockoutMatch).round : null;

    // --- Check MOTM ---
    const teamName = getTeamName(teamId);
    const isMotm =
      match.motm?.playerName === playerName &&
      match.motm?.teamName === teamName;

    // --- Build opponent label ---
    const opponentId =
      match.homeTeamId === teamId ? match.awayTeamId : match.homeTeamId;
    const opponentName = getTeamName(opponentId);

    if (isMotm) totalMotm += 1;

    // --- Count goals ---
    let goalsInMatch = 0;
    if (match.timeline?.length) {
      for (const event of match.timeline) {
        if (event.playerId === playerId && event.teamId === teamId) {
          goalsInMatch += 1;
        }
      }
    } else if (match.scorers) {
      const side =
        match.homeTeamId === teamId
          ? match.scorers.home
          : match.awayTeamId === teamId
            ? match.scorers.away
            : [];

      for (const event of side) {
        if (event.playerId === playerId) {
          goalsInMatch += 1;
        }
      }
    }

    // --- Check Clean Sheet ---
    const opponentScore = match.homeTeamId === teamId ? awayScore : homeScore;
    const isCleanSheet = opponentScore === 0;
    const cleanSheetApplies = isCleanSheet && (isPrimaryGK || isDF);

    // --- Check Team Outcome (Win) ---
    let winnerTeamId: string | null = null;
    if (isKnockout && 'winnerTeamId' in match && match.winnerTeamId) {
      winnerTeamId = match.winnerTeamId;
    } else if (homeScore > awayScore) {
      winnerTeamId = match.homeTeamId;
    } else if (awayScore > homeScore) {
      winnerTeamId = match.awayTeamId;
    }
    const hasWon = winnerTeamId === teamId;

    // Filter relevant matches: must have goals, MOTM, clean sheet, or winner points
    if (goalsInMatch === 0 && !isMotm && !cleanSheetApplies && !hasWon) return;

    if (isGK && isCleanSheet) {
      totalGoalsOrCleanSheets += 1;
    } else if (!isGK) {
      totalGoalsOrCleanSheets += goalsInMatch;
    }

    // --- Points Breakdown calculation ---
    const details: string[] = [];
    let matchPoints = 0;

    // Bàn thắng: FW: +2đ, MF: +3đ, DF/GK: +5đ
    if (goalsInMatch > 0) {
      let goalVal = 2;
      if (isMF) goalVal = 3;
      else if (isDF || isGK) goalVal = 5;
      
      const pts = goalsInMatch * goalVal;
      matchPoints += pts;
      details.push(`+${pts} pts (Goal${goalsInMatch > 1 ? 's' : ''})`);
    }

    // Sạch lưới: GK số 1 và DF: +2đ
    if (cleanSheetApplies) {
      matchPoints += 2;
      details.push("+2 pts (Clean Sheet)");
    }

    // MOTM: +5đ
    if (isMotm) {
      matchPoints += 5;
      details.push("+5 pts (MOTM)");
    }

    // Điểm tập thể: Thắng vòng bảng (+0.5đ), Thắng Knockout (+1đ, ko tính CK/tranh Hạng 3), Bán kết (+1đ)
    if (hasWon) {
      let winPts = 0;
      if (!isKnockout) {
        winPts = 0.5;
      } else if (round === 'semifinals') {
        winPts = 1;
      } else if (round === 'roundOf32' || round === 'roundOf16' || round === 'quarterfinals') {
        winPts = 1;
      }
      
      if (winPts > 0) {
        matchPoints += winPts;
        details.push(`+${winPts} pts (Team Win)`);
      }
    }

    totalPoints += matchPoints;

    // --- Create description ---
    const parts: string[] = [];
    if (isGK && isCleanSheet) {
      parts.push('Clean sheet');
    } else if (goalsInMatch > 0) {
      parts.push(`Scored ${goalsInMatch} goal${goalsInMatch > 1 ? 's' : ''}`);
    }
    if (isMotm) {
      parts.push('MOTM');
    }
    if (parts.length === 0 && hasWon) {
      parts.push('Team Win');
    }

    const type: TimelineEntry['type'] = isMotm
      ? (goalsInMatch > 0 ? 'both' : (cleanSheetApplies ? 'cleansheet+motm' : 'motm'))
      : (goalsInMatch > 0 ? 'goal' : (cleanSheetApplies ? 'cleansheet' : 'win'));

    timeline.push({
      description: `${parts.join(' + ')} — ${roundLabel} vs ${opponentName}`,
      sortOrder,
      type,
      opponent: opponentName,
      roundLabel,
      ptsBreakdown: details.join(', '),
      matchPoints,
    });
  };

  // Group matches
  let sortCounter = 0;
  for (const match of groupMatches) {
    if (match.homeTeamId !== teamId && match.awayTeamId !== teamId) continue;
    processMatch(match, `Group Stage ${match.group}`, sortCounter++);
  }

  // Knockout matches (in progression order)
  const knockoutOrder: KnockoutRound[] = [
    'roundOf32',
    'roundOf16',
    'quarterfinals',
    'semifinals',
    'thirdPlace',
    'final',
  ];

  for (const round of knockoutOrder) {
    for (const match of knockoutMatches[round]) {
      if (match.homeTeamId !== teamId && match.awayTeamId !== teamId) continue;
      processMatch(match, ROUND_LABELS[round], sortCounter++);
    }
  }

  // Achievement points (Champion +3, Runner-up +2, Hạng 3 +1.5)
  const finalMatch = knockoutMatches.final[0];
  const thirdPlaceMatch = knockoutMatches.thirdPlace[0];
  let achievementPoints = 0;
  let achievementDesc = "";

  if (finalMatch && finalMatch.status === 'completed') {
    if (finalMatch.winnerTeamId === teamId) {
      achievementPoints = 3;
      achievementDesc = "Tournament Champion — +3 pts";
    } else if (finalMatch.loserTeamId === teamId) {
      achievementPoints = 2;
      achievementDesc = "Tournament Runner-up — +2 pts";
    }
  }
  
  if (thirdPlaceMatch && thirdPlaceMatch.status === 'completed') {
    if (thirdPlaceMatch.winnerTeamId === teamId) {
      achievementPoints = 1.5;
      achievementDesc = "Third Place Match Winner — +1.5 pts";
    }
  }

  if (achievementPoints > 0) {
    totalPoints += achievementPoints;
    timeline.push({
      description: achievementDesc,
      sortOrder: 999, // Place at the very end
      type: 'both',
      opponent: '',
      roundLabel: 'Achievement',
      ptsBreakdown: `+${achievementPoints} pts (Final Standing)`,
      matchPoints: achievementPoints,
    });
  }

  timeline.sort((a, b) => a.sortOrder - b.sortOrder);
  return { totalGoalsOrCleanSheets, totalMotm, totalPoints, timeline, isGK };
};

const TypeBadge = ({ type }: { type: TimelineEntry['type'] }) => {
  const config = {
    goal: {
      bg: 'bg-emerald-500/20 border-emerald-400/30 text-emerald-300',
      label: 'Goal',
    },
    motm: {
      bg: 'bg-amber-500/20 border-amber-400/30 text-amber-300',
      icon: <Star className="h-3 w-3" />,
      label: 'MOTM',
    },
    both: {
      bg: 'bg-host-mexico/20 border-host-mexico/30 text-host-ice',
      icon: <Trophy className="h-3 w-3" />,
      label: 'Goal & MOTM',
    },
    cleansheet: {
      bg: 'bg-sky-500/20 border-sky-400/30 text-sky-300',
      icon: <Shield className="h-3 w-3" />,
      label: 'Clean Sheet',
    },
    'cleansheet+motm': {
      bg: 'bg-host-mexico/20 border-host-mexico/30 text-host-ice',
      icon: <Trophy className="h-3 w-3" />,
      label: 'Clean Sheet + MOTM',
    },
    win: {
      bg: 'bg-indigo-500/20 border-indigo-400/30 text-indigo-300',
      icon: <Check className="h-3.5 w-3.5" />,
      label: 'Team Win',
    },
  }[type];

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${config.bg}`}
    >
      {config.icon}
      {config.label}
    </span>
  );
};

export const PlayerProfileModal = ({
  isOpen,
  onClose,
  playerId,
  teamId,
  playerName,
  position,
  groupMatches,
  knockoutMatches,
}: PlayerProfileModalProps) => {
  const { totalGoalsOrCleanSheets, totalMotm, totalPoints, timeline, isGK } = useMemo(
    () => buildPlayerTimeline(playerId, teamId, playerName, position, groupMatches, knockoutMatches),
    [playerId, teamId, playerName, position, groupMatches, knockoutMatches],
  );

  if (!isOpen) return null;

  const teamName = getTeamName(teamId);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col justify-end sm:items-center sm:justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal — bottom-sheet on mobile, centered on desktop */}
      <div className="relative mx-auto flex max-h-[85dvh] w-full flex-col overflow-hidden rounded-t-[32px] border-t border-white/10 bg-[#08131f] shadow-[0_-12px_40px_rgba(0,0,0,0.5)] sm:max-h-[80vh] sm:w-[min(520px,92vw)] sm:rounded-[28px] sm:border sm:border-white/15 sm:shadow-[0_20px_60px_rgba(0,0,0,0.55)]">
        {/* Decorative gradient */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,197,94,0.08),transparent_40%),radial-gradient(circle_at_bottom_right,rgba(245,158,11,0.06),transparent_50%)]" />

        {/* Mobile drag handle */}
        <div className="flex shrink-0 justify-center pt-3 pb-1 sm:hidden">
          <div className="h-1.5 w-12 rounded-full bg-white/20" />
        </div>

        {/* Header */}
        <div className="relative flex shrink-0 items-start justify-between gap-3 px-5 pb-4 pt-2 sm:px-6 sm:pt-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center overflow-hidden rounded-full border border-white/12 bg-white/[0.06]">
              <Flag teamName={teamName} size={48} />
            </div>
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

        {/* Stat badges - 3 Column Layout */}
        <div className="relative flex gap-2.5 px-5 sm:px-6">
          <div className={`flex-1 rounded-2xl border px-2 py-3 text-center ${isGK ? 'border-sky-400/20 bg-sky-500/10' : 'border-emerald-400/20 bg-emerald-500/10'}`}>
            <div className={`text-[9px] sm:text-[10px] uppercase tracking-[0.15em] ${isGK ? 'text-sky-300/70' : 'text-emerald-300/70'}`}>
              {isGK ? 'Clean Sheets' : 'Goals'}
            </div>
            <div className="mt-1 text-xl sm:text-2xl font-black text-white">{totalGoalsOrCleanSheets}</div>
          </div>
          <div className="flex-1 rounded-2xl border border-amber-400/20 bg-amber-500/10 px-2 py-3 text-center">
            <div className="text-[9px] sm:text-[10px] uppercase tracking-[0.15em] text-amber-300/70">
              MOTM
            </div>
            <div className="mt-1 text-xl sm:text-2xl font-black text-white">{totalMotm}</div>
          </div>
          <div className="flex-1 rounded-2xl border border-pink-500/25 bg-pink-500/10 px-2 py-3 text-center shadow-[0_0_12px_rgba(236,72,153,0.1)]">
            <div className="text-[9px] sm:text-[10px] uppercase tracking-[0.15em] text-pink-300/70">
              Points
            </div>
            <div className="mt-1 text-xl sm:text-2xl font-black text-pink-200">{totalPoints}</div>
          </div>
        </div>

        {/* Timeline */}
        <div className="relative mt-4 flex-1 overflow-y-auto px-5 pb-8 sm:px-6 sm:pb-6 overscroll-contain">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-host-ice/55">
            <Award className="h-4 w-4" />
            Tournament Journey
          </div>

          {timeline.length > 0 ? (
            <div className="relative mt-3 space-y-2.5">

              {timeline.map((entry, index) => (
                <div
                  key={`${entry.roundLabel}-${entry.opponent}-${index}`}
                  className="relative flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2.5 transition hover:bg-white/[0.06]"
                >
                  {/* Dot */}
                  <div className="relative z-10 mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/15 bg-[#0b1a2a]">
                    {entry.type === 'goal' ? (
                      <TriondaBall size={14} />
                    ) : entry.type === 'cleansheet' ? (
                      <Shield className="h-3 w-3 text-sky-400" />
                    ) : entry.type === 'motm' ? (
                      <Star className="h-3 w-3 text-amber-400" />
                    ) : entry.type === 'win' ? (
                      <Check className="h-3.5 w-3.5 text-indigo-400" />
                    ) : (
                      <Trophy className="h-3 w-3 text-host-mexico" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-1.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <TypeBadge type={entry.type} />
                        <span className="text-[10px] sm:text-[11px] text-white/40">{entry.roundLabel}</span>
                      </div>
                      {entry.matchPoints !== undefined && entry.matchPoints > 0 && (
                        <span className="rounded-full bg-pink-500/10 border border-pink-500/20 px-2 py-0.5 text-[9px] font-black text-pink-300">
                          +{entry.matchPoints} pts
                        </span>
                      )}
                    </div>
                    <p className="mt-1.5 text-xs sm:text-[13px] font-medium text-white/85 leading-relaxed">
                      {entry.description}
                    </p>
                    {entry.ptsBreakdown && (
                      <p className="mt-1 text-[10px] text-white/45 font-mono italic">
                        Breakdown: {entry.ptsBreakdown}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Empty state */
            <div className="mt-4 flex flex-col items-center rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-8 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/[0.06]">
                <User className="h-7 w-7 text-white/30" />
              </div>
              <p className="mt-4 text-sm font-semibold text-white/55">
                {isGK ? 'No clean sheets yet' : 'No goals scored in tournament'}
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
