import { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { testLeagueConfig, TEST_LEAGUE_TEAMS, TEST_LEAGUE_TEAMS_BY_ID } from '../data/competitions/testLeague';
import {
  generateRoundRobinFixtures,
  calculateLeagueTable,
  simulateMatchweek,
  simulateLeagueMatch,
  getCurrentMatchweek,
  isMatchweekCompleted,
} from '../utils/leagueEngine';
import LeagueTable from '../components/league/LeagueTable';
import MatchweekSlider from '../components/league/MatchweekSlider';
import TitleRaceChart from '../components/league/TitleRaceChart';
import LeagueRecap from '../components/league/LeagueRecap';
import LeagueChampionModal from '../components/league/LeagueChampionModal';
import type { LeagueMatch } from '../types/leagueConfig';
import { Save } from 'lucide-react';
import { SaveModal } from '../components/SaveModal';
import { Toast } from '../components/Toast';
import { saveSimulation } from '../utils/saveManager';

export default function LeagueApp() {
  const [fixtures, setFixtures] = useState<LeagueMatch[]>([]);
  const [selectedMatchweek, setSelectedMatchweek] = useState(1);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Champion Modal State
  const [isChampionModalOpen, setIsChampionModalOpen] = useState(false);
  const [hasShownChampionModal, setHasShownChampionModal] = useState(false);

  // Manual save state
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Initialize fixtures on mount (read from auto-save first)
  useEffect(() => {
    if (!isInitialized) {
      try {
        const raw = window.localStorage.getItem('vibe-test-league-state');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && Array.isArray(parsed.fixtures)) {
            const isValid = parsed.fixtures.every((match: any) => 
              match && match.homeTeamId && match.awayTeamId &&
              TEST_LEAGUE_TEAMS_BY_ID[match.homeTeamId] && TEST_LEAGUE_TEAMS_BY_ID[match.awayTeamId] &&
              (!match.motm || (match.motm.playerId && match.motm.teamId))
            );
            if (isValid) {
              setFixtures(parsed.fixtures);
              setSelectedMatchweek(parsed.selectedMatchweek || 1);
              setHasShownChampionModal(parsed.hasShownChampionModal || false);
              setIsInitialized(true);
              return;
            } else {
              console.warn("Test league auto-save contains invalid or outdated team IDs. Resetting fixtures.");
            }
          }
        }
      } catch (e) {
        console.error("Failed to load league auto-save", e);
      }

      const initialFixtures = generateRoundRobinFixtures(TEST_LEAGUE_TEAMS, testLeagueConfig);
      setFixtures(initialFixtures);
      setIsInitialized(true);
    }
  }, [isInitialized]);

  // Auto-save state changes
  useEffect(() => {
    if (isInitialized && fixtures.length > 0) {
      const payload = {
        version: 2,
        fixtures,
        selectedMatchweek,
        hasShownChampionModal,
        updatedAt: new Date().toISOString(),
      };
      window.localStorage.setItem('vibe-test-league-state', JSON.stringify(payload));
    }
  }, [fixtures, selectedMatchweek, hasShownChampionModal, isInitialized]);

  const handleSaveSimulation = (name: string) => {
    const payload = {
      version: 2,
      fixtures,
      selectedMatchweek,
      hasShownChampionModal,
      updatedAt: new Date().toISOString(),
    };
    saveSimulation(name, 'test-league', 'league', payload);
    setShowSaveModal(false);
    setToastMessage('Save successful!');
  };

  // Calculate standings
  const standings = useMemo(() => {
    if (fixtures.length === 0) return [];
    return calculateLeagueTable(fixtures, TEST_LEAGUE_TEAMS);
  }, [fixtures]);

  // Calculate actual completed matchweeks count
  const completedMatchweeksCount = useMemo(() => {
    let count = 0;
    for (let mw = 1; mw <= testLeagueConfig.rounds; mw++) {
      if (isMatchweekCompleted(fixtures, mw)) {
        count++;
      }
    }
    return count;
  }, [fixtures]);

  // Calculate top scorers leaderboard
  const topScorers = useMemo(() => {
    const scorerMap: Record<string, { playerName: string; teamId: string; teamName: string; goals: number }> = {};

    fixtures.forEach((match) => {
      if (match.status === 'completed' && match.timeline) {
        match.timeline.forEach((event) => {
          const { playerId, playerName, teamId } = event;
          const team = TEST_LEAGUE_TEAMS_BY_ID[teamId];
          const teamName = team ? team.name : 'Unknown';

          if (!scorerMap[playerId]) {
            scorerMap[playerId] = {
              playerName,
              teamId,
              teamName,
              goals: 0,
            };
          }
          scorerMap[playerId].goals += 1;
        });
      }
    });

    return Object.values(scorerMap)
      .sort((a, b) => b.goals - a.goals || a.playerName.localeCompare(b.playerName))
      .slice(0, 10); // Show top 10 scorers
  }, [fixtures]);

  // Get current matchweek
  const currentMatchweek = useMemo(() => {
    if (fixtures.length === 0) return 1;
    return getCurrentMatchweek(fixtures, testLeagueConfig.rounds);
  }, [fixtures]);

  // Check if selected matchweek is completed
  const isSelectedMatchweekCompleted = useMemo(() => {
    if (fixtures.length === 0) return false;
    return isMatchweekCompleted(fixtures, selectedMatchweek);
  }, [fixtures, selectedMatchweek]);

  // Check if season is completely finished
  const isSeasonFinished = useMemo(() => {
    if (fixtures.length === 0) return false;
    return fixtures.every((f) => f.status === 'completed');
  }, [fixtures]);

  // Automatically trigger champion celebration once completed
  useEffect(() => {
    if (isSeasonFinished && !hasShownChampionModal) {
      setIsChampionModalOpen(true);
      setHasShownChampionModal(true);
    }
  }, [isSeasonFinished, hasShownChampionModal]);

  // Handle simulate matchweek
  const handleSimulateMatchweek = () => {
    const updatedFixtures = simulateMatchweek(
      fixtures,
      selectedMatchweek,
      TEST_LEAGUE_TEAMS_BY_ID,
      testLeagueConfig.homeAdvantage,
    );
    setFixtures(updatedFixtures);
  };

  // Handle single match prediction
  const handlePredictMatch = (matchId: string) => {
    const updatedFixtures = fixtures.map((match) => {
      if (match.id === matchId && match.status === 'pending') {
        const homeTeam = TEST_LEAGUE_TEAMS_BY_ID[match.homeTeamId];
        const awayTeam = TEST_LEAGUE_TEAMS_BY_ID[match.awayTeamId];
        if (!homeTeam || !awayTeam) return match;
        return simulateLeagueMatch(
          match,
          homeTeam,
          awayTeam,
          testLeagueConfig.homeAdvantage,
        );
      }
      return match;
    });
    setFixtures(updatedFixtures);
  };

  // Handle reset
  const handleReset = () => {
    window.localStorage.removeItem('vibe-test-league-state');
    const initialFixtures = generateRoundRobinFixtures(TEST_LEAGUE_TEAMS, testLeagueConfig);
    setFixtures(initialFixtures);
    setSelectedMatchweek(1);
    setIsChampionModalOpen(false);
    setHasShownChampionModal(false);
  };

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#020a05] via-[#051c0e] to-[#010603] flex items-center justify-center">
        <div className="text-emerald-400 text-xl font-bold animate-pulse">Loading Stadium...</div>
      </div>
    );
  }

  const leaderTeam = standings[0] || null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#020a05] via-[#051c0e] to-[#010603] text-white">
      {/* Header */}
      <header className="bg-[#020a05]/60 backdrop-blur-md border-b border-emerald-500/15 sticky top-0 z-50 shadow-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black bg-gradient-to-r from-emerald-400 to-teal-200 bg-clip-text text-transparent flex items-center gap-2">
                <span>🏆</span> {testLeagueConfig.name}
              </h1>
              <p className="text-emerald-400/60 text-xs font-semibold tracking-wider uppercase mt-1">
                {testLeagueConfig.teams} Teams • {testLeagueConfig.rounds} Rounds
                {testLeagueConfig.homeAdvantage && ' • Home Advantage Enabled'}
              </p>
            </div>
            <div className="flex gap-3">
              {/* Hide Save Process button
              <button
                onClick={() => setShowSaveModal(true)}
                className="px-4 py-2 bg-indigo-500/20 text-white font-bold rounded-xl hover:bg-indigo-500/35 border border-indigo-500/30 transition-all active:scale-95 text-sm flex items-center gap-1.5 shadow-[0_0_12px_rgba(99,102,241,0.25)]"
              >
                <Save className="h-4 w-4" /> Save Process
              </button>
              */}
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-rose-500/10 text-rose-300 font-bold rounded-xl hover:bg-rose-500/20 border border-rose-500/25 transition-all active:scale-95 text-sm"
              >
                Reset League
              </button>
              <Link
                to="/hub"
                className="px-4 py-2 bg-emerald-500/10 text-emerald-300 font-bold rounded-xl hover:bg-emerald-500/20 border border-emerald-500/25 transition-all text-sm active:scale-95"
              >
                ← Back to Hub
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Matchweek Slider */}
          <MatchweekSlider
            currentMatchweek={selectedMatchweek}
            totalRounds={testLeagueConfig.rounds}
            fixtures={fixtures}
            teamsById={TEST_LEAGUE_TEAMS_BY_ID}
            onMatchweekChange={setSelectedMatchweek}
            onSimulateMatchweek={handleSimulateMatchweek}
            onPredictMatch={handlePredictMatch}
            isMatchweekCompleted={isSelectedMatchweekCompleted}
          />

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* League Table */}
            <div>
              <LeagueTable
                standings={standings}
                qualificationZones={testLeagueConfig.qualificationZones}
              />
            </div>

            {/* Side Column: Top Scorers & Season Progress */}
            <div className="space-y-8">
              {/* Top Scorers (Emerald Themed) */}
              <div className="bg-emerald-950/20 backdrop-blur-md rounded-2xl p-6 border border-emerald-500/15 shadow-[0_8px_32px_rgba(0,0,0,0.37)] flex flex-col">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                  <span>⚽</span> Top Scorers
                </h2>
                {topScorers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center bg-emerald-950/30 rounded-xl border border-emerald-500/10 flex-1">
                    <span className="text-4xl mb-2">👟</span>
                    <p className="text-emerald-300/80 font-bold text-sm">No scorers yet</p>
                    <p className="text-emerald-400/50 text-xs mt-1 px-4">
                      Simulate or predict matches to populate the golden boot race!
                    </p>
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-xl border border-emerald-500/10 bg-emerald-950/30 flex-1">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-emerald-500/10 bg-emerald-950/45 text-[10px] font-bold uppercase tracking-wider text-emerald-400/60">
                          <th className="py-3 px-4 w-12 text-center">Rank</th>
                          <th className="py-3 px-2">Player</th>
                          <th className="py-3 px-2">Club</th>
                          <th className="py-3 px-4 text-right">Goals</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-emerald-500/5 text-sm">
                        {topScorers.map((scorer, index) => {
                          const isTop3 = index < 3;
                          const rankColors = [
                            'text-amber-300 bg-amber-500/10 border border-amber-500/20',
                            'text-slate-300 bg-slate-500/10 border border-slate-500/20',
                            'text-amber-600 bg-amber-700/10 border border-amber-700/20',
                          ];
                          return (
                            <tr key={scorer.playerName + index} className="hover:bg-emerald-500/[0.02] transition-colors">
                              <td className="py-2.5 px-4 text-center">
                                <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-black ${
                                  isTop3 ? rankColors[index] : 'text-emerald-400/60 bg-emerald-950/40 border border-emerald-500/5'
                                }`}>
                                  {index + 1}
                                </span>
                              </td>
                              <td className="py-2.5 px-2 font-semibold text-white">
                                {scorer.playerName}
                              </td>
                              <td className="py-2.5 px-2 text-xs font-medium text-emerald-300/70">
                                {scorer.teamName}
                              </td>
                              <td className="py-2.5 px-4 text-right font-black text-emerald-300 text-base">
                                {scorer.goals}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Season Progress */}
              <div className="bg-emerald-950/20 backdrop-blur-md rounded-2xl p-6 border border-emerald-500/15 shadow-[0_8px_32px_rgba(0,0,0,0.37)]">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                  <span>📈</span> Season Progress
                </h2>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-emerald-400/80 mb-2">
                      <span>Matchweeks Completed</span>
                      <span>
                        {completedMatchweeksCount} / {testLeagueConfig.rounds}
                      </span>
                    </div>
                    <div className="w-full bg-emerald-950/40 rounded-full h-3 overflow-hidden p-[2px] border border-emerald-500/10">
                      <div
                        className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                        style={{
                          width: `${(completedMatchweeksCount / testLeagueConfig.rounds) * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mt-6">
                    <div className="bg-emerald-950/30 rounded-xl p-4 text-center border border-emerald-500/10">
                      <div className="text-2xl font-black text-white">
                        {fixtures.filter((f) => f.status === 'completed').length}
                      </div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400/60 mt-1">
                        Matches Played
                      </div>
                    </div>
                    <div className="bg-emerald-950/30 rounded-xl p-4 text-center border border-emerald-500/10">
                      <div className="text-2xl font-black text-white">
                        {fixtures.reduce(
                          (sum, f) =>
                            f.status === 'completed' ? sum + f.homeScore! + f.awayScore! : sum,
                          0,
                        )}
                      </div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400/60 mt-1">
                        Total Goals
                      </div>
                    </div>
                    <div className="bg-emerald-950/30 rounded-xl p-4 text-center border border-emerald-500/10 truncate">
                      <div className="text-xl font-black text-amber-300 truncate">
                        {leaderTeam ? leaderTeam.teamName : '-'}
                      </div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400/60 mt-1 truncate">
                        Current Leader
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Title Race Chart */}
          <TitleRaceChart
            standings={standings}
            fixtures={fixtures}
            totalRounds={testLeagueConfig.rounds}
          />

          {/* League Recap Section */}
          <div id="league-recap-section" className="pt-4">
            <LeagueRecap standings={standings} fixtures={fixtures} />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#020a05]/60 backdrop-blur-md border-t border-emerald-500/15 mt-16 py-8">
        <div className="container mx-auto px-4">
          <div className="text-center text-emerald-400/60 text-xs font-semibold uppercase tracking-wider space-y-2">
            <p>
              Test League • Dev Mode Only • Round-Robin Algorithm with Home Advantage
            </p>
            <p className="text-emerald-500/40 text-[10px]">
              Built with React + TypeScript • Phase 3: League Engine MVP
            </p>
          </div>
        </div>
      </footer>

      {/* League Champion Celebration Modal */}
      {leaderTeam && (
        <LeagueChampionModal
          championName={leaderTeam.teamName}
          isOpen={isChampionModalOpen}
          onClose={() => setIsChampionModalOpen(false)}
          points={leaderTeam.points}
          stats={{
            wins: leaderTeam.wins,
            draws: leaderTeam.draws,
            losses: leaderTeam.losses,
            goalsFor: leaderTeam.goalsFor,
            goalsAgainst: leaderTeam.goalsAgainst,
          }}
          onViewRecap={() => {
            const el = document.getElementById('league-recap-section');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
        />
      )}

      <SaveModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onSave={handleSaveSimulation}
        defaultSaveName="Vibe League - My Season"
      />

      {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage(null)} />}
    </div>
  );
}
