import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import CyberGridCanvas from '../components/CyberGridCanvas';
import HistoryHeader from '../components/history/HistoryHeader';
import HistoryStatCards from '../components/history/HistoryStatCards';
import AverageRiskBar from '../components/history/AverageRiskBar';
import ThreatHistoryTable from '../components/history/ThreatHistoryTable';
import { getThreatColor } from '../utils/colors';
import { apiService } from '../services/apiService';

export default function ThreatHistoryPage() {
  const [mounted, setMounted] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 150);
    return () => clearTimeout(timer);
  }, []);

  // Fetch live alerts from /alerts/window on mount + auto-refresh every 15s
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const data = await apiService.getAlertWindow();
        setAlerts(data.alerts || []);
      } catch (err) {
        let errorMsg = 'Could not reach backend. Please check that the AEGIS server is running.';
        if (err?.detail) {
          errorMsg = err.detail;
        } else if (err?.message) {
          errorMsg = err.message;
        }
        setError(errorMsg);
      } finally {
        setLoading(false);
      }
    };
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 15000);
    return () => clearInterval(interval);
  }, []);

  // Derive stats from live alerts
  const avgScore = alerts.length > 0
    ? Math.round((alerts.reduce((s, a) => s + a.threat_score, 0) / alerts.length) * 100)
    : 0;

  const severityMap = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
  const worstSeverity = alerts.reduce((worst, a) => {
    return (severityMap[a.severity] || 0) > (severityMap[worst] || 0) ? a.severity : worst;
  }, 'LOW');

  const threatLevelStatus = alerts.length === 0 ? 'SAFE' : worstSeverity;
  const targetThreat = avgScore;
  const threatColor = getThreatColor(targetThreat / 100);

  return (
    <div className="flex h-screen bg-[#080514] text-white overflow-hidden selection:bg-cyan-500/30 font-inter">

      <div className="fixed inset-0 z-0 pointer-events-none opacity-40">
        <CyberGridCanvas tNorm={targetThreat / 100} threatColor={threatColor} />
      </div>

      <Sidebar currentThreatLevel={threatLevelStatus} />

      <main className="flex-1 relative z-10 overflow-y-auto hide-scrollbar">
        <div className="max-w-7xl mx-auto px-10 pt-16 pb-20">
          <div
            className="transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
            style={{ opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(15px)' }}
          >
            <HistoryHeader alertCount={alerts.length} loading={loading} onRefresh={async () => {
              setLoading(true);
              try {
                const data = await apiService.getAlertWindow();
                setAlerts(data.alerts || []);
              } catch { /* silent */ }
              setLoading(false);
            }} />

            {error && (
              <div className="mb-6 px-5 py-4 bg-red-950/30 border border-red-500/30 rounded-xl font-jetbrains text-[12px] text-red-400 tracking-wide">
                ⚠ {error}
              </div>
            )}

            <HistoryStatCards alerts={alerts} />
            <AverageRiskBar score={avgScore} />
            <ThreatHistoryTable alerts={alerts} loading={loading} />
          </div>
        </div>
      </main>
    </div>
  );
}
