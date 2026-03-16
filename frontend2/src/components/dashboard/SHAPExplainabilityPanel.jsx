import { useEffect, useState } from 'react';
import { Target, Activity, Cpu, AlertTriangle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import ActionButton from '../buttons/ActionButton';

export default function SHAPExplainabilityPanel({ data }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Trigger animations after mount
    const timer = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  if (!data) return null;

  const {
    model_phishing_prob = 0.99,
    base_value = 0.25,
    prediction_deviation = "+74%",
    shap_feature_threat = 4.2,
    shap_feature_legit = 1.1,
    top_contrastive_samples = []
  } = data;

  // Colors based on threat level
  const probPercent = model_phishing_prob * 100;
  let statusColor = '#1d9e75'; // Safe Green
  if (probPercent > 75) statusColor = '#e24b4a'; // Threat Red
  else if (probPercent > 40) statusColor = '#ef9f27'; // Warning Orange

  // Normalize feature bars to 100% max width container
  const maxFeature = Math.max(shap_feature_threat, shap_feature_legit);
  const threatWidth = `${(shap_feature_threat / maxFeature) * 100}%`;
  const legitWidth = `${(shap_feature_legit / maxFeature) * 100}%`;

  return (
    <div className="w-full min-w-[320px] max-w-[420px] max-h-[320px] bg-[#0f172a]/90 backdrop-blur-xl border border-white/10 rounded-xl p-4 flex flex-col font-inter shadow-2xl overflow-hidden relative">
      
      {/* Background Glow */}
      <div 
        className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-[40px] opacity-10 pointer-events-none" 
        style={{ backgroundColor: statusColor }}
      />

      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <h3 className="font-orbitron font-bold text-[12px] tracking-widest text-slate-200 uppercase flex items-center gap-2">
          <Activity className="w-4 h-4 text-slate-400" /> AI EXPLAINABILITY
        </h3>
        <span className="font-jetbrains text-[10px] bg-white/5 border border-white/10 px-2 py-0.5 rounded text-slate-400 tracking-wider">
          SHAP Analysis
        </span>
      </div>

      <div className="flex-1 overflow-y-auto hide-scrollbar flex flex-col gap-5 pb-2">
        
        {/* SECTION 1: RISK DEVIATION */}
        <div className="bg-black/30 border border-white/5 rounded-lg p-3">
          <div className="flex justify-between items-end mb-2">
            <span className="font-jetbrains text-[10px] text-slate-500 uppercase tracking-widest">Risk Deviation</span>
            <span className="font-jetbrains text-[11px] font-bold" style={{ color: statusColor }}>
              {prediction_deviation}
            </span>
          </div>

          <div className="relative h-2 w-full bg-slate-800 rounded-full overflow-hidden mt-2">
            {/* Base Value Marker */}
            <div 
              className="absolute top-0 bottom-0 w-0.5 bg-slate-400 z-10"
              style={{ left: `${base_value * 100}%` }}
            />
            {/* Probability Progress Bar */}
            <div 
              className="h-full rounded-full transition-all duration-1000 ease-out relative z-0"
              style={{ 
                width: mounted ? `${probPercent}%` : '0%', 
                backgroundColor: statusColor,
                boxShadow: `0 0 10px ${statusColor}40`
              }}
            />
          </div>
          <div className="flex justify-between text-[9px] font-jetbrains text-slate-500 mt-1.5 uppercase">
            <span>Base: {Math.round(base_value * 100)}%</span>
            <span>Prediction: {Math.round(probPercent)}%</span>
          </div>
        </div>

        {/* SECTION 2: FEATURE ATTRIBUTION */}
        <div className="bg-black/30 border border-white/5 rounded-lg p-3">
          <div className="font-jetbrains text-[10px] text-slate-500 uppercase tracking-widest mb-3">Feature Attribution</div>
          
          <div className="space-y-3">
            {/* Threat Influencers */}
            <div>
              <div className="flex justify-between items-center mb-1 font-jetbrains text-[10px]">
                <span className="text-slate-300">Threat Signals</span>
                <span className="text-[#e24b4a] font-bold">+{shap_feature_threat.toFixed(2)}</span>
              </div>
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#e24b4a] transition-all duration-1000 delay-300 ease-out"
                  style={{ width: mounted ? threatWidth : '0%' }}
                />
              </div>
            </div>

            {/* Legit Influencers */}
            <div>
              <div className="flex justify-between items-center mb-1 font-jetbrains text-[10px]">
                <span className="text-slate-300">Legitimate Signals</span>
                <span className="text-[#1d9e75] font-bold">-{shap_feature_legit.toFixed(2)}</span>
              </div>
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#1d9e75] transition-all duration-1000 delay-500 ease-out"
                  style={{ width: mounted ? legitWidth : '0%' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3: CONTRASTIVE SAMPLES (Scrollable if > 2) */}
        {top_contrastive_samples.length > 0 && (
          <div className="bg-black/30 border border-white/5 rounded-lg p-3">
             <div className="font-jetbrains text-[10px] text-slate-500 uppercase tracking-widest mb-3">Contrastive Samples</div>
             <div className="space-y-2">
               {top_contrastive_samples.map((sample, idx) => {
                 const isThreat = sample.direction === "higher risk";
                 const borderColor = isThreat ? "border-[#e24b4a]" : "border-[#1d9e75]";
                 const textColor = isThreat ? "text-[#e24b4a]" : "text-[#1d9e75]";

                 return (
                   <div 
                    key={idx}
                    className={`bg-white/5 border-l-2 ${borderColor} rounded-r-md p-2 flex flex-col gap-1.5 transition-all duration-500`}
                    style={{ opacity: mounted ? 1 : 0, transform: mounted ? 'translateX(0)' : 'translateX(-10px)', transitionDelay: `${700 + (idx * 200)}ms` }}
                   >
                     <div className="flex justify-between items-start">
                        <span className="font-jetbrains text-[9px] text-slate-400 capitalize flex items-center gap-1">
                          {isThreat ? <AlertTriangle className="w-3 h-3" /> : <Target className="w-3 h-3" />}
                          {sample.direction}
                        </span>
                        <span className={`font-jetbrains text-[10px] font-bold ${textColor}`}>
                           {sample.delta > 0 ? '+' : ''}{sample.delta.toFixed(1)}
                        </span>
                     </div>
                     <p className="font-inter text-slate-300 text-[11px] leading-tight line-clamp-2 italic opacity-80">
                       "{sample.background_text}"
                     </p>
                   </div>
                 )
               })}
             </div>
          </div>
        )}

        <div className="flex bg-[#0f172a] rounded-lg">
          <ActionButton 
            as="Link"
            to="/ai-insights" 
            state={{ shapData: data }}
            className="w-full relative uppercase flex justify-center items-center gap-2"
          >
            <span className="relative z-10 flex items-center justify-center gap-1.5 w-full">View Full Analysis <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" /></span>
          </ActionButton>
        </div>

      </div>
    </div>
  );
}
