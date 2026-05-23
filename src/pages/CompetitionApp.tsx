  /**
 * CompetitionApp — Generic tournament UI driven by CompetitionDefinition.
 *
 * This page renders the full tournament experience for ANY competition
 * (Test Cup, WC26, etc.) using the dynamic hook and dynamic bracket.
 *
 * For WC26, the app still uses the dedicated WC26App for its premium UI.
 * This component is the minimal-viable generic version used for non-WC26
 * competitions like the Test Cup.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarDays, ChevronDown, Orbit, RotateCcw, Swords, Trophy, Users, Zap, Save } from 'lucide-react';
import { getCompetition } from '../data/competitions/registry';
import { useDynamicTournament } from '../hooks/useDynamicTournament';
import { CompetitionProvider } from '../hooks/CompetitionContext';
import { BackToTopButton } from '../components/BackToTopButton';
import { ChampionModal } from '../components/ChampionModal';
import { Flag } from '../components/Flag';
import { GroupCard } from '../components/GroupCard';
import { DynamicKnockoutBracket } from '../components/DynamicKnockoutBracket';
import { ResetModal } from '../components/ResetModal';
import { TopScorersTable } from '../components/TopScorersTable';
import { SaveModal } from '../components/SaveModal';
import { Toast } from '../components/Toast';
import { saveSimulation } from '../utils/saveManager';

const scrollToId = (id: string) => {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

export default function CompetitionApp() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const competition = id ? getCompetition(id) : undefined;

  if (!competition) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a1120]">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white">Competition not found</h1>
          <p className="mt-3 text-white/60">No competition with ID "{id}" exists.</p>
          <button
            type="button"
            onClick={() => navigate('/hub')}
            className="mt-6 rounded-xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
          >
            ← Back to Hub
          </button>
        </div>
      </div>
    );
  }

  return (
    <CompetitionProvider value={{ teamsById: competition.teamsById }}>
      <CompetitionContent competition={competition} />
    </CompetitionProvider>
  );
}

function CompetitionContent({ competition }: { competition: NonNullable<ReturnType<typeof getCompetition>> }) {
  const navigate = useNavigate();
  const {
    config,
    teams,
    teamsById,
    groups,
    coreState,
    derivedState,
    predictGroupMatch,
    openKnockoutStage,
    predictKnockoutMatch,
    resolvePenalty,
    resetTournament,
    setScenario,
  } = useDynamicTournament(competition);

  const [showResetModal, setShowResetModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleSaveSimulation = (name: string) => {
    const payload = {
      version: 2,
      core: coreState,
      derived: {
        standingsByGroup: derivedState.standingsByGroup,
        thirdPlaceTable: derivedState.thirdPlaceTable,
        topScorers: derivedState.topScorers,
        seasonMOTM: derivedState.seasonMOTM,
        qualifiedTeamIds: derivedState.qualifiedTeamIds,
        groupStageComplete: derivedState.groupStageComplete,
        knockoutReady: derivedState.knockoutReady,
        knockoutTeamOrigins: derivedState.knockoutTeamOrigins,
        championTeamId: derivedState.championTeamId,
        championName: derivedState.championName,
      },
      updatedAt: new Date().toISOString(),
    };
    saveSimulation(name, config.id, 'cup', payload);
    setShowSaveModal(false);
    setToastMessage('Save successful!');
  };
  const [showChampionModal, setShowChampionModal] = useState(false);
  const [scenarioOpen, setScenarioOpen] = useState(false);
  const prevChampionRef = useRef<string | null>(null);
  const scenarioRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (derivedState.championName && !prevChampionRef.current) {
      setTimeout(() => setShowChampionModal(true), 1200);
    }
    prevChampionRef.current = derivedState.championName;
  }, [derivedState.championName]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (scenarioRef.current && !scenarioRef.current.contains(e.target as Node)) {
        setScenarioOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const SCENARIO_OPTIONS = [
    { value: 'standard' as const, label: 'Standard', desc: 'Pure random — ignoring Rating' },
    { value: 'favorites' as const, label: 'Top Team Domination', desc: 'Top-ranked teams dominate' },
    { value: 'underdogs' as const, label: 'Underdogs', desc: 'Dark horses cause upsets' },
  ];
  const activeScenario = coreState.scenario ?? 'standard';
  const currentOption = SCENARIO_OPTIONS.find((o) => o.value === activeScenario) ?? SCENARIO_OPTIONS[0];

  const completedGroupMatches = coreState.groupMatches.filter((m) => m.status === 'completed').length;
  const totalGroupMatches = coreState.groupMatches.length;
  const knockoutMatchesFlat = Object.values(coreState.knockoutMatches).flat();
  const completedKnockoutMatches = knockoutMatchesFlat.filter((m) => m.status === 'completed').length;
  const qualifiedThirdIds = new Set(
    derivedState.thirdPlaceTable.filter((e) => e.qualifies).map((e) => e.teamId),
  );

  const handleOpenKnockout = () => {
    openKnockoutStage();
    setTimeout(() => scrollToId('knockout'), 120);
  };

  const confirmReset = () => {
    resetTournament();
    setShowResetModal(false);
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
  };

  const advancingCount = config.groupsCount * config.advancePerGroup + config.bestThirdsToAdvance;

  return (
    <div className="relative overflow-hidden">
      <div className="mx-auto max-w-[1640px] px-4 py-6 sm:px-6 lg:px-8">
        {/* ── Header ── */}
        <header className="brand-shell overflow-hidden p-6 sm:p-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.18),transparent_28%),radial-gradient(circle_at_left,rgba(16,185,129,0.14),transparent_22%)]" />

          <div className="relative">
            <div className="flex items-center gap-4">
              <div style={{ fontSize: 40, lineHeight: 1 }}>🏆</div>
              <div>
                <p className="field-label">{config.name}</p>
                <h1 className="mt-2 font-display text-3xl font-bold leading-tight text-white sm:text-4xl">
                  Prediction Tool
                </h1>
              </div>
            </div>

            <p className="mt-4 text-sm text-white/60">
              {config.teams} teams · {config.groupsCount} groups · {advancingCount} advancing to knock-out
            </p>

            <div className="mt-6 flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={() => navigate('/hub')}
                className="flex items-center gap-1.5 whitespace-nowrap rounded-xl border border-white/15 bg-white/[0.07] px-3.5 py-2.5 text-xs font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/[0.12] sm:text-sm"
              >
                <ArrowLeft className="h-4 w-4" />
                Hub
              </button>

              <button
                type="button"
                onClick={() => scrollToId('group-stage')}
                className="whitespace-nowrap rounded-xl border border-white/15 bg-white/[0.07] px-3.5 py-2.5 text-xs font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/[0.12] sm:text-sm"
              >
                Group Stage
              </button>

              <button
                type="button"
                onClick={handleOpenKnockout}
                disabled={!derivedState.knockoutReady}
                className={`whitespace-nowrap rounded-xl px-3.5 py-2.5 text-xs font-semibold transition sm:text-sm ${
                  derivedState.knockoutReady
                    ? 'border border-emerald-400/30 bg-emerald-400/12 text-white hover:-translate-y-0.5 hover:bg-emerald-400/20'
                    : 'cursor-not-allowed border border-white/10 bg-white/5 text-white/35'
                }`}
              >
                Knock-out
              </button>

              <button
                type="button"
                onClick={() => setShowSaveModal(true)}
                className="flex items-center gap-1.5 whitespace-nowrap rounded-xl border border-indigo-500/25 bg-indigo-500/10 px-3.5 py-2.5 text-xs font-semibold text-white transition hover:-translate-y-0.5 hover:bg-indigo-500/15 sm:text-sm shadow-[0_0_12px_rgba(99,102,241,0.2)]"
              >
                <Save className="h-4 w-4" /> Save Process
              </button>

              <button
                type="button"
                onClick={() => setShowResetModal(true)}
                className="flex items-center gap-1.5 whitespace-nowrap rounded-xl border border-red-400/25 bg-red-400/10 px-3.5 py-2.5 text-xs font-semibold text-white transition hover:-translate-y-0.5 hover:bg-red-400/15 sm:text-sm"
              >
                <RotateCcw className="h-4 w-4" /> Reset
              </button>
            </div>

            {/* Stats bar */}
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-[20px] border border-white/10 bg-white/[0.04] p-4">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/50">
                  <CalendarDays className="h-4 w-4" /> Group Stage
                </div>
                <div className="mt-2 text-2xl font-bold text-white">
                  {completedGroupMatches}/{totalGroupMatches}
                </div>
                <div className="mt-1 text-xs text-white/45">Matches Predicted</div>
              </div>

              <div className="rounded-[20px] border border-white/10 bg-white/[0.04] p-4">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/50">
                  <Users className="h-4 w-4" /> Qualified
                </div>
                <div className="mt-2 text-2xl font-bold text-white">
                  {derivedState.knockoutReady ? derivedState.qualifiedTeamIds.length : '--'}
                </div>
                <div className="mt-1 text-xs text-white/45">
                  {config.bestThirdsToAdvance > 0
                    ? `Including Best ${config.bestThirdsToAdvance} Third-Place`
                    : `Top ${config.advancePerGroup} per group`}
                </div>
              </div>

              <div className="rounded-[20px] border border-white/10 bg-white/[0.04] p-4">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/50">
                  <Swords className="h-4 w-4" /> Knock-out
                </div>
                <div className="mt-2 text-2xl font-bold text-white">
                  {completedKnockoutMatches}/{knockoutMatchesFlat.length}
                </div>
                <div className="mt-1 text-xs text-white/45">Matches Completed</div>
              </div>

              <div className="rounded-[20px] border border-white/10 bg-white/[0.04] p-4">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/50">
                  <Trophy className="h-4 w-4" /> Champion
                </div>
                <div className="mt-2 flex items-center gap-2 text-xl font-bold text-white">
                  {derivedState.championName ? (
                    <>
                      <span>🏆</span>
                      <span>{derivedState.championName}</span>
                    </>
                  ) : (
                    <span>TBD</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="mt-8 space-y-8">
          {/* ── Group Stage ── */}
          <section id="group-stage">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="field-label">Group Stage</p>
                <h2 className="mt-2 text-3xl font-bold text-white">
                  {config.groupsCount} Groups
                </h2>
              </div>

              {/* Scenario Dropdown */}
              <div ref={scenarioRef} className="relative">
                <button
                  type="button"
                  onClick={() => setScenarioOpen((v) => !v)}
                  className="flex items-center gap-2.5 rounded-2xl border border-amber-400/20 bg-amber-400/8 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur-md transition hover:border-amber-400/35 hover:bg-amber-400/14"
                >
                  <Zap className="h-4 w-4 shrink-0 text-amber-300/80" />
                  <span className="whitespace-nowrap">{currentOption.label}</span>
                  <ChevronDown className={`h-4 w-4 shrink-0 text-white/45 transition-transform duration-200 ${scenarioOpen ? 'rotate-180' : ''}`} />
                </button>

                {scenarioOpen && (
                  <div className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-white/10 bg-[rgba(10,17,32,0.97)] shadow-[0_8px_40px_rgba(0,0,0,0.55)] backdrop-blur-xl">
                    {SCENARIO_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => { setScenario(opt.value); setScenarioOpen(false); }}
                        className={`flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-white/[0.06] ${
                          opt.value === activeScenario ? 'bg-amber-400/[0.07]' : ''
                        }`}
                      >
                        <div className="min-w-0">
                          <div className={`text-sm font-semibold ${opt.value === activeScenario ? 'text-amber-300' : 'text-white'}`}>
                            {opt.label}
                          </div>
                          <div className="mt-0.5 text-[11px] text-white/40">{opt.desc}</div>
                        </div>
                        {opt.value === activeScenario && (
                          <span className="ml-auto mt-1 h-2 w-2 shrink-0 rounded-full bg-amber-400" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              {groups.map((group) => (
                <GroupCard
                  key={group.id}
                  group={group as any}
                  matches={coreState.groupMatches.filter((m) => m.group === group.id)}
                  standings={derivedState.standingsByGroup[group.id as keyof typeof derivedState.standingsByGroup] ?? []}
                  qualifiedThirdIds={qualifiedThirdIds}
                  onPredict={predictGroupMatch}
                  onTeamClick={() => {}}
                />
              ))}
            </div>
          </section>

          {/* ── Top Scorers ── */}
          <section>
            <TopScorersTable scorers={derivedState.topScorers} />
          </section>

          {/* ── Knockout ── */}
          <section id="knockout" className="relative left-1/2 w-screen max-w-none -translate-x-1/2 px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-[1880px]">
              <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="field-label">Knock-out Stage</p>
                  <h2 className="mt-1 text-3xl font-bold text-white">Elimination Bracket</h2>
                </div>
                <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/65">
                  Draw after 120 min goes to penalty shootout
                </div>
              </div>

              {derivedState.knockoutReady ? (
                coreState.knockoutVisible ? (
                  <DynamicKnockoutBracket
                    knockoutMatches={coreState.knockoutMatches}
                    knockoutRounds={competition.knockoutRounds as string[]}
                    roundLabels={competition.roundLabels}
                    teamOrigins={derivedState.knockoutTeamOrigins}
                    championName={derivedState.championName}
                    onPredict={predictKnockoutMatch}
                    onResolvePenalty={resolvePenalty}
                  />
                ) : (
                  <div className="brand-shell p-6 sm:p-8">
                    <div>
                      <p className="field-label">Ready</p>
                      <h3 className="mt-2 text-2xl font-bold text-white">
                        {advancingCount} teams are ready for the bracket
                      </h3>
                      <p className="mt-3 text-sm text-white/66">Open the knockout stage.</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleOpenKnockout}
                      className="mt-5 rounded-2xl border border-emerald-400/30 bg-emerald-400/12 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-emerald-400/20"
                    >
                      Open Knock-out Stage
                    </button>
                  </div>
                )
              ) : (
                <div className="brand-shell p-6 sm:p-8">
                  <p className="field-label">Locked</p>
                  <h3 className="mt-2 text-2xl font-bold text-white">Complete group stage to unlock bracket</h3>
                  <p className="mt-3 max-w-2xl text-sm text-white/66">
                    Requires all {totalGroupMatches} matches to be completed.
                  </p>
                </div>
              )}
            </div>
          </section>
        </main>
      </div>

      <ResetModal isOpen={showResetModal} onClose={() => setShowResetModal(false)} onConfirm={confirmReset} />

      <SaveModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onSave={handleSaveSimulation}
        defaultSaveName={`${config.name} - My Process`}
      />

      {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage(null)} />}

      <ChampionModal
        isOpen={showChampionModal}
        championName={derivedState.championName}
        onClose={() => setShowChampionModal(false)}
        onViewRecap={() => {}}
      />

      <BackToTopButton />
    </div>
  );
}
