import { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Lock, Sparkles } from 'lucide-react';
import type { TwoLegMatch } from '../../types/uclConfig';
import type { Team } from '../../types/tournament';
import { UCLPenaltyModal } from './UCLPenaltyModal';
import uclCupImg from '../../img/CUP COMPETITION/UCL/ucl_cup.png';
import patchUclImg from '../../img/CUP COMPETITION/UCL/patch_ucl.png';

interface UCLKnockoutBracketProps {
  playoffs: TwoLegMatch[];
  roundOf16: TwoLegMatch[];
  quarterfinals: TwoLegMatch[];
  semifinals: TwoLegMatch[];
  finalMatch: TwoLegMatch | null;
  teamsById: Record<string, Team>;
  onSimulateLeg1: (roundKey: string, matchId: string) => void;
  onSimulateLeg2: (roundKey: string, matchId: string) => void;
  onSimulateExtraTime: (roundKey: string, matchId: string) => void;
  onResolvePenalties: (roundKey: string, matchId: string) => void;
  simulationPhase: 'regulation' | 'aet' | 'penalties';
  onSelectTeam?: (teamId: string) => void;
}

type BracketView = 'pathway1' | 'pathway2' | 'finals';

const VIEW_TABS: Array<{ id: BracketView; label: string }> = [
  { id: 'pathway1', label: 'Pathway 1' },
  { id: 'pathway2', label: 'Pathway 2' },
  { id: 'finals', label: 'Final' },
];

const ROUND_LABELS: Record<string, string> = {
  playoffs: 'Play-off',
  roundOf16: 'Round of 16',
  quarterfinals: 'Quarter-final',
  semifinals: 'Semi-final',
  final: 'Madrid 27 Final',
};

export const UCLKnockoutBracket: React.FC<UCLKnockoutBracketProps> = ({
  playoffs,
  roundOf16,
  quarterfinals,
  semifinals,
  finalMatch,
  teamsById,
  onSimulateLeg1,
  onSimulateLeg2,
  onSimulateExtraTime,
  onResolvePenalties,
  simulationPhase,
  onSelectTeam,
}) => {
  const [activeView, setActiveView] = useState<BracketView>('pathway1');
  const [selectedPenaltyTieId, setSelectedPenaltyTieId] = useState<string | null>(null);
  const [expandedTies, setExpandedTies] = useState<Record<string, boolean>>({});

  const allTies = useMemo(
    () => [...playoffs, ...roundOf16, ...quarterfinals, ...semifinals, ...(finalMatch ? [finalMatch] : [])],
    [playoffs, roundOf16, quarterfinals, semifinals, finalMatch],
  );
  const selectedPenaltyTie = allTies.find((tie) => tie.id === selectedPenaltyTieId) || null;

  const pathways = [
    {
      id: 1,
      playoffs: playoffs.slice(0, 4),
      roundOf16: roundOf16.slice(0, 4),
      quarterfinals: quarterfinals.slice(0, 2),
      semifinals: semifinals.slice(0, 1),
      accent: 'cyan',
    },
    {
      id: 2,
      playoffs: playoffs.slice(4, 8),
      roundOf16: roundOf16.slice(4, 8),
      quarterfinals: quarterfinals.slice(2, 4),
      semifinals: semifinals.slice(1, 2),
      accent: 'blue',
    },
  ] as const;
  const activePathway = activeView === 'pathway2' ? pathways[1] : pathways[0];

  const renderTeamRow = (team: Team, tie: TwoLegMatch, side: 'home' | 'away') => {
    const isWinner = tie.isCompleted && tie.winnerId === team.id;
    const isLoser = tie.isCompleted && tie.winnerId !== team.id;
    const aggregateScore = side === 'home' ? tie.aggregate.homeScore : tie.aggregate.awayScore;

    return (
      <button
        type="button"
        onClick={() => onSelectTeam?.(team.id)}
        className={`grid w-full grid-cols-[32px_1fr_auto] items-center gap-3 rounded-xl px-2 py-2 text-left transition hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 ${
          isLoser ? 'opacity-40 grayscale' : ''
        }`}
      >
        <img src={team.logo} alt={`${team.name} crest`} className="h-8 w-8 object-contain" />
        <span className={`truncate text-base font-bold ${isWinner ? 'text-sky-200' : 'text-white'}`}>{team.name}</span>
        <span className={`font-mono text-xl font-black ${isWinner ? 'text-sky-300' : 'text-white/75'}`}>
          {aggregateScore ?? '–'}
        </span>
      </button>
    );
  };

  const renderLegScorers = (
    tie: TwoLegMatch,
    legKey: 'leg1' | 'leg2',
    side: 'home' | 'away',
  ) => {
    const leg = tie[legKey];
    const timeline = (leg.timeline || []).filter((event) => event.side === side);

    if (timeline.length > 0) {
      return timeline.map((event, index) => (
        <li key={`${event.playerId}-${event.displayMinute}-${index}`} className="flex items-center gap-2 text-xs text-white/70">
          <span className="font-mono font-black text-sky-300">{event.displayMinute}</span>
          <span>{event.playerName}</span>
          {event.isPenalty && <span className="text-[9px] font-black text-amber-300">PEN</span>}
          {event.isOwnGoal && <span className="text-[9px] font-black text-rose-300">OG</span>}
        </li>
      ));
    }

    const scorers = leg.scorers?.[side] || [];
    if (scorers.length > 0) {
      return scorers.map((scorer, index) => (
        <li key={`${scorer.playerId}-${scorer.minute}-${index}`} className="flex items-center gap-2 text-xs text-white/70">
          <span className="font-mono font-black text-sky-300">{scorer.minute}'</span>
          <span>{scorer.playerName}</span>
        </li>
      ));
    }

    return <li className="text-xs italic text-white/30">No goals</li>;
  };

  const renderExtraTimeScorers = (tie: TwoLegMatch, side: 'home' | 'away') => {
    const timeline = (tie.leg2.etTimeline || []).filter((event) => event.side === side);
    if (timeline.length === 0) return <li className="text-xs italic text-white/30">No goals</li>;

    return timeline.map((event, index) => (
      <li key={`et-${event.playerId}-${event.displayMinute}-${index}`} className="flex items-center gap-2 text-xs text-white/75">
        <span className="font-mono font-black text-amber-300">{event.displayMinute}</span>
        <span>{event.playerName}</span>
        {event.isPenalty && <span className="text-[9px] font-black text-amber-200">PEN</span>}
      </li>
    ));
  };

  const renderLegDetails = (
    tie: TwoLegMatch,
    legKey: 'leg1' | 'leg2',
    homeTeam: Team,
    awayTeam: Team,
    label: string,
  ) => {
    const leg = tie[legKey];
    if (leg.status !== 'completed') return null;

    return (
      <section className="rounded-2xl border border-white/10 bg-black/20 p-3" aria-label={`${label} goals`}>
        <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-2">
          <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/45">{label}</h5>
          <span className="font-mono text-sm font-black text-white">{leg.homeScore ?? 0}–{leg.awayScore ?? 0}</span>
        </div>
        <div className="mt-3 space-y-3">
          <div>
            <p className="text-[9px] font-black uppercase tracking-wider text-sky-300">Home · {homeTeam.shortName}</p>
            <ul className="mt-1.5 space-y-1">{renderLegScorers(tie, legKey, 'home')}</ul>
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-wider text-white/45">Away · {awayTeam.shortName}</p>
            <ul className="mt-1.5 space-y-1">{renderLegScorers(tie, legKey, 'away')}</ul>
          </div>
        </div>
      </section>
    );
  };

  const renderAction = (tie: TwoLegMatch, roundKey: string) => {
    const status = tie.tieStatus || (
      tie.isCompleted
        ? 'completed'
        : tie.leg2.status === 'completed'
        ? 'leg2-done'
        : tie.leg1.status === 'completed'
        ? 'leg1-done'
        : 'pending'
    );
    const baseClass = 'w-full rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] transition active:scale-[0.98]';

    if (status === 'pending') {
      return <button type="button" onClick={() => onSimulateLeg1(roundKey, tie.id)} className={`${baseClass} bg-cyan-400 text-[#00081E] hover:bg-cyan-300`}>Predict Leg 1</button>;
    }
    if (status === 'leg1-done') {
      return <button type="button" onClick={() => onSimulateLeg2(roundKey, tie.id)} className={`${baseClass} bg-blue-600 text-white hover:bg-blue-500`}>{roundKey === 'final' ? 'Predict Final' : 'Predict Leg 2'}</button>;
    }
    if (status === 'leg2-done') {
      return <button type="button" onClick={() => onSimulateExtraTime(roundKey, tie.id)} className={`${baseClass} border border-amber-300/40 bg-amber-400/15 text-amber-200 hover:bg-amber-400/25`}>Simulate Extra Time</button>;
    }
    if (status === 'aet') {
      return (
        <button
          type="button"
          onClick={() => {
            setSelectedPenaltyTieId(tie.id);
            onResolvePenalties(roundKey, tie.id);
          }}
          className={`${baseClass} border border-[#FF005A]/50 bg-[#FF005A]/20 text-pink-200 hover:bg-[#FF005A]/30`}
        >
          Resolve Penalties
        </button>
      );
    }
    if (tie.leg2.penalties) {
      return <button type="button" onClick={() => setSelectedPenaltyTieId(tie.id)} className={`${baseClass} border border-cyan-400/30 bg-cyan-400/10 text-cyan-200 hover:bg-cyan-400/20`}>View Penalties</button>;
    }
    return null;
  };

  const renderTieCard = (tie: TwoLegMatch, roundKey: string) => {
    const homeTeam = teamsById[tie.homeTeamId];
    const awayTeam = teamsById[tie.awayTeamId];
    if (!homeTeam || !awayTeam) return null;

    return (
      <article
        key={tie.id}
        className={`relative min-w-0 overflow-hidden rounded-2xl border bg-[#060d1a] p-4 shadow-[0_14px_40px_rgba(0,6,20,0.34)] ${
          tie.isCompleted ? 'border-sky-300/30' : 'border-white/10'
        }`}
      >
        <img src={patchUclImg} alt="" className="absolute right-2 top-2 h-5 w-5 object-contain opacity-30" />
        <div className="mb-2 flex items-center gap-2 pr-6">
          <span className="truncate text-[9px] font-black uppercase tracking-[0.2em] text-white/40">{ROUND_LABELS[roundKey]}</span>
          {tie.leg2.extraTime && <span className="rounded bg-amber-400/15 px-1.5 py-0.5 text-[8px] font-black text-amber-300">AET</span>}
          {tie.leg2.penalties && <span className="rounded bg-rose-400/15 px-1.5 py-0.5 text-[8px] font-black text-rose-200">PEN</span>}
        </div>

        <div className="space-y-0.5">
          {renderTeamRow(homeTeam, tie, 'home')}
          {renderTeamRow(awayTeam, tie, 'away')}
        </div>

        <div className={`mt-2 grid gap-1 text-center font-mono text-[9px] text-white/45 ${roundKey === 'final' ? 'grid-cols-1' : 'grid-cols-2'}`}>
          {roundKey !== 'final' && (
            <span className="rounded-lg bg-white/[0.035] px-1.5 py-1">
              L1 {awayTeam.shortName} {tie.leg1.homeScore ?? '–'}–{tie.leg1.awayScore ?? '–'} {homeTeam.shortName}
            </span>
          )}
          <span className="rounded-lg bg-white/[0.035] px-1.5 py-1">
            {roundKey === 'final' ? '90 MIN' : 'L2'} {homeTeam.shortName} {tie.leg2.homeScore ?? '–'}–{tie.leg2.awayScore ?? '–'} {awayTeam.shortName}
          </span>
        </div>

        {(tie.leg1.status === 'completed' || tie.leg2.status === 'completed') && (
          <div className="mt-3">
            <button
              type="button"
              aria-expanded={Boolean(expandedTies[tie.id])}
              aria-controls={`ucl-tie-details-${tie.id}`}
              onClick={() => setExpandedTies((current) => ({ ...current, [tie.id]: !current[tie.id] }))}
              className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2.5 text-[10px] font-black uppercase tracking-[0.16em] text-white/60 transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:border-sky-300/25 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
            >
              Match Details
              <ChevronDown className={`h-4 w-4 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${expandedTies[tie.id] ? 'rotate-180' : ''}`} />
            </button>
            <div
              id={`ucl-tie-details-${tie.id}`}
              className={`overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${expandedTies[tie.id] ? 'mt-3 max-h-[900px] opacity-100' : 'max-h-0 opacity-0'}`}
            >
              <div className="grid gap-2">
                {roundKey !== 'final' && renderLegDetails(tie, 'leg1', awayTeam, homeTeam, 'Leg 1')}
                {renderLegDetails(tie, 'leg2', homeTeam, awayTeam, roundKey === 'final' ? 'Final' : 'Leg 2')}
                {tie.leg2.extraTime && (
                  <section className="rounded-2xl border border-amber-300/20 bg-amber-300/[0.055] p-3" aria-label="Extra-time goals">
                    <div className="flex items-center justify-between gap-3 border-b border-amber-200/10 pb-2">
                      <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-200">Extra time · 91–120'</h5>
                      <span className="font-mono text-sm font-black text-amber-200">{tie.leg2.etHomeGoals || 0}–{tie.leg2.etAwayGoals || 0}</span>
                    </div>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <div><p className="text-[9px] font-black uppercase tracking-wider text-sky-300">Home · {homeTeam.shortName}</p><ul className="mt-1.5 space-y-1">{renderExtraTimeScorers(tie, 'home')}</ul></div>
                      <div><p className="text-[9px] font-black uppercase tracking-wider text-white/45">Away · {awayTeam.shortName}</p><ul className="mt-1.5 space-y-1">{renderExtraTimeScorers(tie, 'away')}</ul></div>
                    </div>
                  </section>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="mt-3">{renderAction(tie, roundKey)}</div>
      </article>
    );
  };

  const renderStageColumn = (title: string, roundKey: string, matches: TwoLegMatch[]) => {
    const minimumHeight = roundKey === 'playoffs'
      ? 'min-h-[700px]'
      : roundKey === 'roundOf16'
      ? 'min-h-[600px]'
      : roundKey === 'quarterfinals'
      ? 'min-h-[400px]'
      : 'min-h-[300px]';

    return (
    <div className="relative min-w-[260px] self-center">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h4 className="text-[10px] font-black uppercase tracking-[0.22em] text-white/55">{title}</h4>
        <span className="font-mono text-[9px] text-white/30">{matches.filter((tie) => tie.isCompleted).length}/{matches.length || '–'}</span>
      </div>
      <div className={`flex flex-col justify-around gap-4 ${minimumHeight}`}>
        {matches.length > 0 ? matches.map((tie) => renderTieCard(tie, roundKey)) : (
          <div className="flex min-h-28 items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.015] text-center text-[10px] uppercase tracking-wider text-white/25">
            <Lock className="mr-2 h-3.5 w-3.5" /> Awaiting draw
          </div>
        )}
      </div>
    </div>
    );
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-[#000B29] p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="grid w-full grid-cols-3 gap-1.5 sm:w-auto sm:gap-2" role="tablist" aria-label="Knockout pathways">
          {VIEW_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeView === tab.id}
              onClick={() => setActiveView(tab.id)}
              className={`rounded-xl px-2 py-2.5 text-[10px] font-black uppercase tracking-[0.08em] transition duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] sm:rounded-2xl sm:px-6 sm:py-3 sm:text-xs sm:tracking-wider ${activeView === tab.id ? (tab.id === 'finals' ? 'bg-amber-400 text-[#00081E]' : 'bg-sky-300 text-[#00081E]') : 'bg-white/5 text-white/60 hover:text-white'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <span className="w-fit rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.2em] text-white/45">
          Simulation · {simulationPhase === 'aet' ? 'Extra time' : simulationPhase}
        </span>
      </div>

      {activeView !== 'finals' ? (
        <div className="space-y-8">
            <section key={activePathway.id} className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#071329] to-[#020817]">
              <header className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                <div>
                  <p className={`text-[10px] font-black uppercase tracking-[0.3em] ${activePathway.accent === 'cyan' ? 'text-sky-300' : 'text-blue-300'}`}>Road to Madrid</p>
                  <h3 className="text-xl font-black text-white">Pathway {activePathway.id}</h3>
                </div>
                <Sparkles className={`h-5 w-5 ${activePathway.accent === 'cyan' ? 'text-sky-300' : 'text-blue-300'}`} />
              </header>

              <div className="overflow-x-auto overscroll-x-contain p-5">
                <div
                  className="relative mx-auto grid min-w-[1180px] max-w-[1500px] items-center gap-8"
                  style={{ gridTemplateColumns: 'repeat(4, minmax(260px, 1fr))' }}
                >
                  <div className={`pointer-events-none absolute left-[23%] right-[8%] top-12 h-px bg-gradient-to-r ${activePathway.accent === 'cyan' ? 'from-sky-300/60 via-sky-300/20 to-blue-500/45' : 'from-blue-500/55 via-blue-500/20 to-sky-300/45'} shadow-[0_0_12px_currentColor]`} />
                  {renderStageColumn('Play-offs', 'playoffs', activePathway.playoffs)}
                  {renderStageColumn('Round of 16', 'roundOf16', activePathway.roundOf16)}
                  {renderStageColumn('Quarter-finals', 'quarterfinals', activePathway.quarterfinals)}
                  {renderStageColumn('Semi-final', 'semifinals', activePathway.semifinals)}
                </div>
              </div>
            </section>

          <button
            type="button"
            onClick={() => setActiveView('finals')}
            className="group mx-auto flex w-full max-w-2xl items-center justify-center gap-4 rounded-3xl border border-amber-400/30 bg-gradient-to-r from-amber-400/10 via-[#000B29] to-amber-400/10 px-6 py-5 text-center transition hover:border-amber-300/60"
          >
            <img src={uclCupImg} alt="UEFA Champions League trophy" className="h-10 w-10 object-contain" />
            <span>
              <span className="block text-[10px] font-black uppercase tracking-[0.3em] text-amber-300/70">Final destination</span>
              <span className="text-lg font-black text-white">Madrid 27</span>
            </span>
            <ChevronRight className="h-5 w-5 text-white/30 transition group-hover:translate-x-1" />
          </button>
        </div>
      ) : (
        <section className="mx-auto max-w-3xl rounded-[32px] border border-amber-400/30 bg-gradient-to-b from-amber-400/10 via-[#000B29] to-[#00081E] p-5 text-center shadow-[0_0_60px_rgba(245,158,11,0.12)] sm:p-8">
          <img src={uclCupImg} alt="UEFA Champions League trophy" className="mx-auto h-24 w-24 object-contain" />
          <p className="mt-3 text-[10px] font-black uppercase tracking-[0.32em] text-amber-300">Estadio Metropolitano</p>
          <h3 className="mt-1 text-3xl font-black text-white">Madrid 27 Final</h3>
          <p className="mt-2 text-sm text-white/45">One match. Two finalists. One champion of Europe.</p>
          <div className="mt-7 text-left">
            {finalMatch ? renderTieCard(finalMatch, 'final') : (
              <div className="rounded-2xl border border-dashed border-white/15 bg-black/20 py-12 text-center text-sm text-white/35">
                Complete both semi-finals to unlock the final.
              </div>
            )}
          </div>
        </section>
      )}

      <UCLPenaltyModal
        tie={selectedPenaltyTie}
        teamsById={teamsById}
        onClose={() => setSelectedPenaltyTieId(null)}
      />
    </div>
  );
};
