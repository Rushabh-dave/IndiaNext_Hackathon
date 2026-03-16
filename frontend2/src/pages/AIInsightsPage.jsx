import { useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
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

export default function AIInsightsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('user'); // 'user' | 'attacker'

  // Extract SHAP data from router state, or fallback to mock data for demonstration/direct navigation
  const shapData = location.state?.shapData || {
    model_phishing_prob: 0.9998,
    base_value: 0.2534,
    prediction_deviation: "+74.6%",
    shap_feature_threat: 5.4,
    shap_feature_legit: 0.8,
    interpretation: "Model output 0.9998 vs baseline 0.2534. Strong phishing signal above baseline.",
    top_contrastive_samples: [
      { background_text: "Verify your recent login attempt", delta: +2.1, direction: "higher risk" },
      { background_text: "Weekly team sync agenda", delta: -1.5, direction: "lower risk" }
    ]
  };

  const probPercent = shapData.model_phishing_prob * 100;
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
            {activeTab === 'user' ? (
              // USER PERSPECTIVE (Defensive)
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-[fadein_0.5s_ease_both]">
                 
                 {/* Left Column */}
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

                 {/* Right Column */}
                 <div className="space-y-6">
                    <ContrastiveComparisonList samples={shapData.top_contrastive_samples} />
                    <DefenderRecommendations />
                 </div>

              </div>
            ) : (
              // ATTACKER PERSPECTIVE (Threat Intel)
              <div className="max-w-3xl mx-auto">
                 <AttackerAnalysisPanel data={shapData} />
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
