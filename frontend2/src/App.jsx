import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import ThreatDetectionPage from './pages/ThreatDetectionPage';
import ThreatDashboard from './pages/ThreatDashboard';
import AIInsightsPage from './pages/AIInsightsPage';
import ThreatHistoryPage from './pages/ThreatHistoryPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/threat-detection" element={<ThreatDetectionPage />} />
      <Route path="/dashboard" element={<ThreatDashboard />} />
      <Route path="/ai-insights" element={<AIInsightsPage />} />
      <Route path="/history" element={<ThreatHistoryPage />} />
    </Routes>
  );
}

export default App;
