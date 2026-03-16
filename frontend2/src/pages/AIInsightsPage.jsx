import { useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ArrowLeft, BrainCircuit } from 'lucide-react';
import CyberGridCanvas from '../components/CyberGridCanvas';
import Sidebar from '../components/Sidebar';
import { getThreatColor } from '../utils/colors';

// Import Insight Components
import InsightsToggleTabs from '../components/ai-insights/InsightsToggleTabs';
import SHAPDeviationBar from '../components/ai-insights/SHAPDeviationBar';
import FeatureAttributionBars from '../components/ai-insights/FeatureAttributionBars';
import ContrastiveComparisonList from '../components/ai-insights/ContrastiveComparisonList';
import AttackerAnalysisPanel from '../components/ai-insights/AttackerAnalysisPanel';
import DefenderRecommendations from '../components/ai-insights/DefenderRecommendations';

// Temporal Components
import TemporalNarrative from '../components/temporal/TemporalNarrative';
import TemporalTimeline from '../components/temporal/TemporalTimeline';
import KillChainVisualizer from '../components/temporal/KillChainVisualizer';
import TemporalMetricsGrid from '../components/temporal/TemporalMetricsGrid';
import TimeToImpactCard from '../components/temporal/TimeToImpactCard';
import { History, Clock } from 'lucide-react';

export default function AIInsightsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(location.state?.initialTab || 'defensive'); // 'defensive' | 'attacker' | 'temporal'

  // Restore state from sessionStorage (survives back-navigation)
  const savedState = (() => {
    try {
      const saved = sessionStorage.getItem('aegis_last_scan');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  })();

  const routerState = location.state || {};
  const shapData    = routerState.shapData    || savedState?.result?.shap || null;
  const temporalData = routerState.temporalData || null;
  const scanType    = routerState.scanType    || savedState?.scanType || 'url';

  // Navigate away if no data — use useEffect to avoid render-time side effects
  useEffect(() => {
    if (!shapData && !temporalData) {
      navigate('/threat-detection');
    }
  }, [shapData, temporalData, navigate]);

  if (!shapData && !temporalData) return null;

  // Use fused score if available for the global gauge
  const probPercent = (temporalData?.fused_score !== undefined ? temporalData.fused_score : (shapData?.model_phishing_prob ?? 0.5)) * 100;
  let statusColor = '#1d9e75';
  let severity = 'SAFE';
  let shadowGlow = 'rgba(29, 158, 117, 0.4)';
  if (probPercent > 75) {
    statusColor = '#e24b4a';
    severity = 'CRITICAL';
    shadowGlow = 'rgba(226, 75, 74, 0.4)';
  } else if (probPercent > 40) {
    statusColor = '#ef9f27';
    severity = 'ELEVATED';
    shadowGlow = 'rgba(239, 159, 39, 0.4)';
  }

  const tNorm = probPercent / 100;

  return (
    <div className="relative w-full h-screen font-inter text-slate-100 bg-[#080514] flex overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <CyberGridCanvas tNorm={tNorm} threatColor={getThreatColor(tNorm)} />
      </div>

      <Sidebar currentThreatLevel={severity} />

      <main className="flex-1 h-screen overflow-y-auto relative z-10 pb-20">
        <div className="max-w-5xl mx-auto px-6 pt-12">

          {/* Header */}
          <div className="mb-10">
            <button onClick={() => navigate(-1)} className="flex items-center justify-center sm:justify-start gap-2 text-slate-400 hover:text-white transition-colors uppercase font-jetbrains text-[13px] sm:text-[11px] tracking-widest mb-6 w-full sm:w-auto h-[44px] sm:h-auto border border-white/10 sm:border-transparent rounded-lg sm:rounded-none">
              <ArrowLeft className="w-4 h-4" /> Back to Analysis
            </button>
            <h1 className="font-orbitron font-bold text-4xl tracking-widest text-white uppercase flex items-center gap-4 mb-3">
              <BrainCircuit className="w-10 h-10" style={{ color: statusColor, filter: `drop-shadow(0 0 10px ${shadowGlow})` }} />
              AI <span style={{ color: statusColor }}>INSIGHTS</span>
            </h1>
            <p className="font-jetbrains text-[13px] tracking-wider text-slate-400 uppercase">
              Understand why the neural engine classified this content.
            </p>
          </div>

          {/* Toggle Switch */}
          <InsightsToggleTabs activeTab={activeTab} setActiveTab={setActiveTab} />

          {/* Tab Content Area */}
          <div className="mt-8 transition-all duration-500">
            {activeTab === 'defensive' && shapData && (
              // DEFENSIVE PERSPECTIVE
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-[fadein_0.5s_ease_both]">
                <div className="space-y-6">
                  <SHAPDeviationBar
                    baseValue={shapData.base_value}
                    probPercent={probPercent}
                    deviationText={shapData.prediction_deviation}
                    statusColor={statusColor}
                  />
                  <FeatureAttributionBars
                    threatFeature={shapData.shap_feature_threat}
                    legitFeature={shapData.shap_feature_legit}
                  />
                  <div className="bg-[#7c3aed]/10 border border-[#7c3aed]/30 rounded-xl p-6 shadow-[0_0_15px_rgba(124,58,237,0.1)]">
                    <div className="font-jetbrains text-[11px] text-[#7c3aed] uppercase tracking-widest mb-2 font-bold">Interpretability Engine</div>
                    <p className="font-inter text-slate-200 text-[15px] leading-relaxed italic">
                      "{shapData.interpretation}"
                    </p>
                  </div>
                </div>
                <div className="space-y-6">
                  <ContrastiveComparisonList samples={shapData.top_contrastive_samples} />
                  <DefenderRecommendations />
                </div>
              </div>
            )}

            {activeTab === 'attacker' && shapData && (
              // ATTACKER PERSPECTIVE
              <div className="max-w-3xl mx-auto animate-[fadein_0.5s_ease_both]">
                <AttackerAnalysisPanel data={shapData} scanType={scanType} />
              </div>
            )}

            {activeTab === 'temporal' && (
              // TEMPORAL PERSPECTIVE
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-[fadein_0.5s_ease_both]">
                <div className="lg:col-span-5 space-y-8">
                   <KillChainVisualizer 
                      currentIndex={temporalData?.kill_chain?.current_stage_index ?? 0}
                      predictedNext={temporalData?.kill_chain?.predicted_next_index}
                   />
                   <TimeToImpactCard data={temporalData?.time_to_impact} />
                   <TemporalMetricsGrid features={temporalData?.temporal_features} />
                   <TemporalTimeline timeline={temporalData?.recent_timeline} />
                </div>
                <div className="lg:col-span-7 space-y-8">
                   <div className="bg-black/40 border border-white/5 rounded-[20px] p-8 shadow-xl">
                      <div className="flex items-center justify-between mb-8">
                         <h3 className="font-orbitron font-bold text-[18px] text-white uppercase tracking-widest flex items-center gap-3">
                            <History className="w-6 h-6 text-purple-400" /> EVENT NARRATIVE
                         </h3>
                         <div className="flex items-center gap-2 font-jetbrains text-[10px] text-slate-500">
                            <Clock className="w-4 h-4" /> RECENT SCAN WINDOW
                         </div>
                      </div>
                      <TemporalNarrative narrative={temporalData?.ai_narrative} temporalData={temporalData} />
                      
                      <div className="mt-12 pt-8 border-t border-white/10">
                        <div className="font-jetbrains text-[10px] text-slate-500 uppercase tracking-[0.2em] mb-4">SYSTEM INTERPRETATION</div>
                        <p className="font-inter text-slate-400 text-[14px] leading-relaxed">
                          The AEGIS temporal fusion engine analyzes alert proximity, technique variety, and kill-chain depth to synthesize these insights. 
                        </p>
                      </div>
                   </div>
                </div>
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
