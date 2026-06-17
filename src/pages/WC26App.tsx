import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CalendarDays, ChevronDown, Orbit, RotateCcw, Swords, Trophy, Users, Zap, Save } from 'lucide-react';
import { BackToTopButton } from '../components/BackToTopButton';
import { BestThirdTable } from '../components/BestThirdTable';
import { ChampionCup, TriondaBall, WorldCupLogo } from '../components/BrandAssets';
import { ChampionModal } from '../components/ChampionModal';
import { Flag } from '../components/Flag';
import { GroupCard } from '../components/GroupCard';

import { HeroBranding } from '../components/HeroBranding';
import { KnockoutBracket } from '../components/KnockoutBracket';
import { ResetModal } from '../components/ResetModal';
import { TeamRosterModal } from '../components/TeamRosterModal';
import { TopScorersTable } from '../components/TopScorersTable';
import { TournamentRecap } from '../components/TournamentRecap';
import { GROUPS, TEAMS, TEAMS_BY_ID } from '../data/tournament';
import { CompetitionProvider } from '../hooks/CompetitionContext';
import { useTournament } from '../hooks/useTournament';

import { calculateTournamentStats } from '../utils/recapStats';
import { SaveModal } from '../components/SaveModal';
import { Toast } from '../components/Toast';
import { saveSimulation } from '../utils/saveManager';

const SLOGAN = 'WE ARE 26';

const scrollToId = (id: string) => {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

export default function WC26App() {
  const navigate = useNavigate();
  const {
    coreState,
    derivedState,
    predictGroupMatch,
    applyRealResult,
    openKnockoutStage,
    predictKnockoutMatch,
    resolvePenalty,
    resetTournament,
    setScenario,
  } = useTournament();

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
    saveSimulation(name, 'wc26', 'cup', payload);
    setShowSaveModal(false);
    setToastMessage('Save successful!');
  };
  const [showChampionModal, setShowChampionModal] = useState(false);
  const [scenarioOpen, setScenarioOpen] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
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
    {
      value: 'standard' as const,
      label: 'Standard',
      desc: 'Pure random — ignoring Rating',
      badge: '50 / 0 / 50',
      color: 'text-white/55',
    },
    {
      value: 'favorites' as const,
      label: 'Top Team Domination',
      desc: 'Top-ranked teams dominate',
      badge: 'Active',
      color: 'text-amber-300/80',
    },
    {
      value: 'underdogs' as const,
      label: 'Underdogs',
      desc: 'Dark horses cause upsets',
      badge: 'Active',
      color: 'text-emerald-300/80',
    },
  ];
  const activeScenario = coreState.scenario ?? 'standard';
  const currentOption = SCENARIO_OPTIONS.find((o) => o.value === activeScenario) ?? SCENARIO_OPTIONS[0];

  const completedGroupMatches = coreState.groupMatches.filter((match) => match.status === 'completed').length;
  const totalGroupMatches = coreState.groupMatches.length;
  const knockoutMatches = Object.values(coreState.knockoutMatches).flat();
  const completedKnockoutMatches = knockoutMatches.filter((match) => match.status === 'completed').length;
  const qualifiedThirdIds = new Set(
    derivedState.thirdPlaceTable.filter((entry) => entry.qualifies).map((entry) => entry.teamId),
  );

  const recapStats = useMemo(
    () =>
      calculateTournamentStats(
        coreState.groupMatches,
        coreState.knockoutMatches,
        derivedState.topScorers,
        TEAMS,
      ),
    [coreState.groupMatches, coreState.knockoutMatches, derivedState.topScorers],
  );



  const handleOpenKnockout = () => {
    openKnockoutStage();
    setTimeout(() => scrollToId('knockout'), 120);
  };

  const handleViewRecap = () => {
    setTimeout(() => scrollToId('recap'), 200);
  };

  const confirmReset = () => {
    resetTournament();
    setShowResetModal(false);
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
  };



  return (
    <CompetitionProvider value={{ teamsById: TEAMS_BY_ID }}>
    <div className="relative overflow-hidden w-full">
      <div className="pointer-events-none absolute left-[-120px] top-[140px] hidden opacity-30 lg:block">
        <TriondaBall size={260} className="animate-ball-float" />
      </div>

      <div className="mx-auto max-w-[1640px] px-2 py-4 sm:px-6 lg:px-8">
        <header className="brand-shell overflow-hidden p-4 sm:p-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(19,78,74,0.22),transparent_28%),radial-gradient(circle_at_left,rgba(30,64,175,0.18),transparent_22%),radial-gradient(circle_at_bottom_right,rgba(165,52,72,0.16),transparent_28%)]" />

          <div className="relative">
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] xl:items-start">
              <div className="w-full max-w-3xl min-w-0">
                <div className="flex items-center gap-4">
                  <div className="block sm:hidden">
                    <WorldCupLogo size={44} />
                  </div>
                  <div className="hidden sm:block">
                    <WorldCupLogo size={56} />
                  </div>
                  <div>
                    <p className="field-label">World Cup 2026</p>
                    <h1 className="mt-2 font-display text-2xl font-bold leading-tight text-white sm:text-5xl xl:text-[3.7rem]">
                      Prediction Tool
                    </h1>
                  </div>
                </div>

                <p className="mt-5 text-lg font-medium text-host-ice/80 sm:text-xl">{SLOGAN}</p>

                <div className="mt-6 overflow-x-auto scrollbar-hide pb-1">
                  <div className="flex w-max min-w-full flex-nowrap gap-2.5">
                    {/* Back to Hub button */}
                    <button
                      type="button"
                      onClick={() => navigate('/hub')}
                      className="flex items-center gap-1.5 whitespace-nowrap rounded-xl border border-white/15 bg-white/[0.07] px-3.5 py-2.5 text-xs font-semibold text-host-ice transition hover:-translate-y-0.5 hover:bg-white/[0.12] sm:text-sm"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Hub
                    </button>

                    <button
                      type="button"
                      onClick={() => scrollToId('group-stage')}
                      className="whitespace-nowrap rounded-xl border border-host-ice/15 bg-host-usa/16 px-3.5 py-2.5 text-xs font-semibold text-host-ice transition hover:-translate-y-0.5 hover:bg-host-usa/24 sm:text-sm"
                    >
                      Group Stage
                    </button>

                    <button
                      type="button"
                      onClick={() => scrollToId('best-third')}
                      className="whitespace-nowrap rounded-xl border border-host-ice/15 bg-host-canada/14 px-3.5 py-2.5 text-xs font-semibold text-host-ice transition hover:-translate-y-0.5 hover:bg-host-canada/22 sm:text-sm"
                    >
                      Best 3rd Place
                    </button>

                    <button
                      type="button"
                      onClick={handleOpenKnockout}
                      disabled={!derivedState.knockoutReady}
                      className={`whitespace-nowrap rounded-xl px-3.5 py-2.5 text-xs font-semibold transition sm:text-sm ${derivedState.knockoutReady
                        ? 'border border-host-mexico/35 bg-host-mexico/18 text-host-ice hover:-translate-y-0.5 hover:bg-host-mexico/24'
                        : 'cursor-not-allowed border border-white/10 bg-white/5 text-white/35'
                        }`}
                    >
                      Knock-out
                    </button>

                    {recapStats.isComplete ? (
                      <button
                        type="button"
                        onClick={handleViewRecap}
                        className="flex items-center gap-1.5 whitespace-nowrap rounded-xl border border-amber-400/30 bg-amber-400/12 px-3.5 py-2.5 text-xs font-semibold text-amber-200 transition hover:-translate-y-0.5 hover:bg-amber-400/20 sm:text-sm"
                      >
                        <Trophy className="h-4 w-4" />WC26 Recap
                      </button>
                    ) : null}



                    {/* Hide Save Process button
                    <button
                      type="button"
                      onClick={() => setShowSaveModal(true)}
                      className="flex items-center gap-1.5 whitespace-nowrap rounded-xl border border-indigo-500/25 bg-indigo-500/10 px-3.5 py-2.5 text-xs font-semibold text-host-ice transition hover:-translate-y-0.5 hover:bg-indigo-500/15 sm:text-sm shadow-[0_0_12px_rgba(99,102,241,0.2)]"
                    >
                      <Save className="h-4 w-4" /> Save Process
                    </button>
                    */}

                    <button
                      type="button"
                      onClick={() => setShowResetModal(true)}
                      className="flex items-center gap-1.5 whitespace-nowrap rounded-xl border border-host-canada/28 bg-host-canada/14 px-3.5 py-2.5 text-xs font-semibold text-host-ice transition hover:-translate-y-0.5 hover:bg-host-canada/18 sm:text-sm"
                    >
                      <RotateCcw className="h-4 w-4" /> Reset
                    </button>
                  </div>
                </div>
              </div>

              <HeroBranding />
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-[28px] border border-host-usa/22 bg-host-usa/12 p-4">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-host-ice/55">
                  <CalendarDays className="h-4 w-4" /> Group Stage
                </div>
                <div className="mt-2 text-3xl font-bold text-white">
                  {completedGroupMatches}/{totalGroupMatches}
                </div>
                <div className="mt-2 text-sm text-white/60">Matches Predicted</div>
              </div>

              <div className="rounded-[28px] border border-host-mexico/24 bg-host-mexico/12 p-4">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-host-ice/55">
                  <Users className="h-4 w-4" /> Qualified
                </div>
                <div className="mt-2 text-3xl font-bold text-white">
                  {derivedState.knockoutReady ? derivedState.qualifiedTeamIds.length : '--'}
                </div>
                <div className="mt-2 text-sm text-white/60">Including Best 8 Third-Place</div>
              </div>

              <div className="rounded-[28px] border border-host-canada/24 bg-host-canada/12 p-4">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-host-ice/55">
                  <Swords className="h-4 w-4" /> Knock-out
                </div>
                <div className="mt-2 text-3xl font-bold text-white">
                  {completedKnockoutMatches}/{knockoutMatches.length}
                </div>
                <div className="mt-2 text-sm text-white/60">Matches Completed</div>
              </div>

              <div className="rounded-[28px] border border-white/12 bg-white/[0.06] p-4">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-host-ice/55">
                  <Orbit className="h-4 w-4" /> Champion
                </div>
                <div className="mt-3 flex items-center gap-2 sm:gap-3 text-base sm:text-xl font-bold text-white">
                  {derivedState.championName ? (
                    <>
                      <div className="block sm:hidden">
                        <ChampionCup size={32} />
                      </div>
                      <div className="hidden sm:block">
                        <ChampionCup size={48} />
                      </div>
                      <Flag teamName={derivedState.championName} size={20} className="sm:h-[20px]" />
                    </>
                  ) : (
                    <WorldCupLogo size={24} />
                  )}
                  <span className="truncate">{derivedState.championName ?? 'TBD'}</span>
                </div>
                <div className="mt-2 text-sm text-white/60">Champion</div>
              </div>
            </div>
          </div>
        </header>

        <main className="mt-8 space-y-8">
          <section id="group-stage">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="field-label">Group Stage</p>
                <h2 className="mt-2 text-3xl font-bold text-white">12 Groups from A to L</h2>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Scenario Dropdown */}
                <div ref={scenarioRef} className="relative">
                  <button
                    type="button"
                    id="scenario-trigger"
                    onClick={() => setScenarioOpen((v) => !v)}
                    className="flex items-center gap-2.5 rounded-2xl border border-amber-400/20 bg-amber-400/8 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur-md transition hover:border-amber-400/35 hover:bg-amber-400/14 active:scale-[0.98]"
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
                            <div className={`text-sm font-semibold ${
                              opt.value === activeScenario ? 'text-amber-300' : 'text-white'
                            }`}>{opt.label}</div>
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

                {/* Active Scenario Banner */}
                {activeScenario !== 'standard' && (
                  <div className={`flex flex-wrap items-center gap-2 rounded-2xl sm:rounded-full border px-4 py-1.5 text-xs font-semibold ${
                    activeScenario === 'favorites'
                      ? 'border-amber-400/30 bg-amber-400/10 text-amber-200'
                      : 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200'
                  }`}>
                    <Zap className="h-3 w-3 shrink-0" />
                    <span>{currentOption.label} — </span>
                    <span className="opacity-70">{currentOption.desc}</span>
                  </div>
                )}
                {activeScenario === 'standard' && (
                  <div className="flex flex-wrap items-center gap-2 rounded-2xl sm:rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs text-white/50">
                    <Zap className="h-3 w-3 shrink-0" />
                    <span>Standard — </span>
                    <span className="opacity-70">pure random, ignoring Rating</span>
                  </div>
                )}
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              {GROUPS.map((group) => (
                <GroupCard
                  key={group.id}
                  group={group}
                  matches={coreState.groupMatches.filter((match) => match.group === group.id)}
                  standings={derivedState.standingsByGroup[group.id]}
                  qualifiedThirdIds={qualifiedThirdIds}
                  onPredict={predictGroupMatch}
                  onTeamClick={(teamId) => setSelectedTeamId(teamId)}
                  onApplyRealResult={applyRealResult}
                  onShowToast={setToastMessage}
                />
              ))}
            </div>
          </section>

          <section id="best-third" className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <BestThirdTable
              entries={derivedState.thirdPlaceTable}
              groupStageComplete={derivedState.groupStageComplete}
            />
            <TopScorersTable scorers={derivedState.topScorers} />
          </section>

          <section id="knockout" className="w-full">
            <div className="mx-auto max-w-[1880px]">
              <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                <div className="flex items-center gap-3">
                  <WorldCupLogo size={42} />
                  <div>
                    <p className="field-label">Knock-out Stage</p>
                    <h2 className="mt-1 text-3xl font-bold text-white">Elimination Bracket</h2>
                  </div>
                </div>

                <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/65">
                  Draw after 120 min goes to penalty shootout
                </div>
              </div>

              {derivedState.knockoutReady ? (
                coreState.knockoutVisible ? (
                  <KnockoutBracket
                    knockoutMatches={coreState.knockoutMatches}
                    teamOrigins={derivedState.knockoutTeamOrigins}
                    championName={derivedState.championName}
                    onPredict={predictKnockoutMatch}
                    onResolvePenalty={resolvePenalty}
                  />
                ) : (
                  <div className="brand-shell p-6 sm:p-8">
                    <div className="flex flex-wrap items-start justify-between gap-5">
                      <div>
                        <p className="field-label">Ready</p>
                        <h3 className="mt-2 text-2xl font-bold text-white">32 teams are ready for the bracket</h3>
                        <p className="mt-3 text-sm text-white/66">Open the knockout stage.</p>
                      </div>
                      <TriondaBall size={86} className="animate-ball-float" />
                    </div>

                    <button
                      type="button"
                      onClick={handleOpenKnockout}
                      className="mt-5 rounded-2xl border border-host-mexico/35 bg-host-mexico/18 px-5 py-3 text-sm font-semibold text-host-ice transition hover:-translate-y-0.5 hover:bg-host-mexico/24"
                    >
                      Open Knock-out Stage
                    </button>
                  </div>
                )
              ) : (
                <div className="brand-shell p-6 sm:p-8">
                  <p className="field-label">Locked</p>
                  <h3 className="mt-2 text-2xl font-bold text-white">Complete group stage to unlock bracket</h3>
                  <p className="mt-3 max-w-2xl text-sm text-white/66">Requires all 72 matches and Top 8 third-place teams.</p>
                </div>
              )}
            </div>
          </section>

          <section id="recap" className="w-full">
            <div className="mx-auto max-w-[1640px]">
              <TournamentRecap stats={recapStats} groupMatches={coreState.groupMatches} knockoutMatches={coreState.knockoutMatches} />
            </div>
          </section>
        </main>
      </div>

      <ResetModal isOpen={showResetModal} onClose={() => setShowResetModal(false)} onConfirm={confirmReset} />

      <SaveModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onSave={handleSaveSimulation}
        defaultSaveName="WC26 - Ngựa ô lên ngôi"
      />

      {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage(null)} />}

      <ChampionModal
        isOpen={showChampionModal}
        championName={derivedState.championName}
        onClose={() => setShowChampionModal(false)}
        onViewRecap={handleViewRecap}
      />

      <TeamRosterModal
        isOpen={selectedTeamId !== null}
        team={selectedTeamId ? TEAMS_BY_ID[selectedTeamId] ?? null : null}
        onClose={() => setSelectedTeamId(null)}
      />



      <BackToTopButton />
    </div>
    </CompetitionProvider>
  );
}
