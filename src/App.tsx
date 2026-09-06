import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import CompetitionHub from './pages/CompetitionHub';
import WC26App from './pages/WC26App';
import CompetitionApp from './pages/CompetitionApp';
import LeagueApp from './pages/LeagueApp';
import SavedSimulations from './pages/SavedSimulations';
import { UCLApp } from './pages/UCLApp';
import EPLApp from './pages/EPLApp';

// Favicon assets
import uclFavicon from './img/CUP COMPETITION/UCL/tournaments_uefa-champions-league--no-text-white_64x64.football-logos.cc.png';
import eplFavicon from './img/LEAGUE COMPETITION/EPL/england_english-premier-league--no-text-white_64x64.football-logos.cc.png';
import wc26Favicon from './img/tournaments_fifa-world-cup-2026_64x64.football-logos.cc.png';
import defaultFavicon from './img/icons8-football-96.png';

// ── Register all competitions into the global registry ──
// Each module's side-effect import calls registerCompetition().
import './data/competitions/wc26';

if (import.meta.env.DEV) {
  const cupPath = './data/competitions/testCup';
  const leaguePath = './data/competitions/testLeague';
  import(/* @vite-ignore */ cupPath);
  import(/* @vite-ignore */ leaguePath);
}

const DEFAULT_FAVICON = defaultFavicon;

function App() {
  const location = useLocation();

  // Dynamic Favicon: change browser tab icon based on current route
  useEffect(() => {
    const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement | null;
    if (!link) return;

    if (location.pathname.includes('/competition/epl')) {
      link.href = eplFavicon;
    } else if (location.pathname.includes('/competition/ucl')) {
      link.href = uclFavicon;
    } else if (location.pathname.includes('/competition/wc26')) {
      link.href = wc26Favicon;
    } else {
      link.href = DEFAULT_FAVICON;
    }
  }, [location.pathname]);

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/hub" element={<CompetitionHub />} />
      <Route path="/saves" element={<SavedSimulations />} />
      {/* WC26 keeps its premium dedicated page */}
      <Route path="/competition/wc26/*" element={<WC26App />} />

      {/* Premier League 25/26 - uses dedicated EPLApp */}
      <Route path="/competition/epl" element={<EPLApp />} />

      {/* UEFA Champions League - uses dedicated UCLApp */}
      <Route path="/competition/ucl" element={<UCLApp />} />

      {/* Test League (dev-only) - uses dedicated LeagueApp */}
      {import.meta.env.DEV && <Route path="/competition/test-league" element={<LeagueApp />} />}
      {/* All other competitions use the generic dynamic page */}
      <Route path="/competition/:id/*" element={<CompetitionApp />} />
      {/* fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
