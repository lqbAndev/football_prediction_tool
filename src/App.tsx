import { Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import CompetitionHub from './pages/CompetitionHub';
import WC26App from './pages/WC26App';
import SavedSimulations from './pages/SavedSimulations';

// Register all competitions into the global registry
import './data/competitions/wc26';

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/hub" element={<CompetitionHub />} />
      <Route path="/saves" element={<SavedSimulations />} />
      {/* WC26 keeps its premium dedicated page */}
      <Route path="/competition/wc26/*" element={<WC26App />} />
      {/* fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
