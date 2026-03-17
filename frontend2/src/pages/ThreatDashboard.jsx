import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import CyberGridCanvas from '../components/CyberGridCanvas';
import Sidebar from '../components/Sidebar';
import SHAPExplainabilityPanel from '../components/dashboard/SHAPExplainabilityPanel';
import { getThreatColor } from '../utils/colors';
import ActionButton from '../components/buttons/ActionButton';
import { apiService } from '../services/apiService';

// Temporal Components
import KillChainVisualizer from '../components/temporal/KillChainVisualizer';
import TemporalMetricsGrid from '../components/temporal/TemporalMetricsGrid';

// Icons
import {
  ArrowLeft, Activity, BrainCircuit, Brain,
  ShieldCheck, ShieldAlert, AlertOctagon,
  ExternalLink, AlertTriangle, CheckSquare, Square
} from 'lucide-react';

// Severity → tailwind color map
const SEVERITY_COLORS = {
  CRITICAL: '#ef4444',
  HIGH: '#f97316',
  MEDIUM: '#f59e0b',
  LOW: '#22c55e',
  SAFE: '#22c55e',
  UNKNOWN: '#64748b',
  ERROR: '#64748b',
};

export default function ThreatDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const [temporalData, setTemporalData] = useState(null);
  const [isTemporalLoading, setIsTemporalLoading] = useState(true);

  // ── Persist state so navigating back doesn't reset to zero ──
  // On first load with data, save to sessionStorage. On reloads, restore from there.
  const stateFromRouter = location.state;
  useEffect(() => {
    if (stateFromRouter?.result) {
      sessionStorage.setItem('aegis_last_scan', JSON.stringify(stateFromRouter));
    }
  }, [stateFromRouter]);

  const savedState = (() => {
    try {
      const saved = sessionStorage.getItem('aegis_last_scan');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  })();

  const activeState = stateFromRouter || savedState || {};

  // ── Receive normalized result from scanner ──
  const {
    result = {},
    type = 'Threat Scan',
    input = 'Unknown',
    scanType = 'url',
  } = activeState;

  // ── Fetch temporal analysis on mount ──
  useEffect(() => {
    const fetchTemporal = async () => {
      try {
        setIsTemporalLoading(true);
        const data = await apiService.runTemporalAnalysis(300);
        setTemporalData(data);
      } catch (err) {
        console.error("Failed to fetch temporal analysis:", err);
        // Set default temporal data on error instead of completely failing
        setTemporalData(null);
      } finally {
        setIsTemporalLoading(false);
      }
    };
    fetchTemporal();
  }, []);

  // ── Real API fields (from normalizeResult helper) ──
  const isSafe = result.isSafe ?? true;
  const score = result.score ?? 0;              // 0-100
  const severity = result.severity ?? 'UNKNOWN';
  const threatName = result.threatName ?? 'Unknown Scan Result';
  const confidence = result.confidence ?? 0;       // 0-100
  const indicators = result.indicators ?? ['No analysis data available.'];
  const recommendations = result.recommendations ?? 'No recommendation.';
  const mitre = result.mitre_technique ?? null;
  const shap = result.shap ?? null;

  const threatColor = SEVERITY_COLORS[severity] || SEVERITY_COLORS.UNKNOWN;
  const tNorm = score / 100;

  // ── Circular gauge ──
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  // ── Action checklist ──
  const defaultChecklist = isSafe
    ? [{ id: 1, text: 'Log the scan result for audit purposes', done: false }]
    : [
      { id: 1, text: 'Do not interact with the detected payload', done: false },
      { id: 2, text: 'Block the source address / domain in firewall', done: false },
      { id: 3, text: 'Alert IT Security team immediately', done: false },
      { id: 4, text: 'Preserve evidence and file an incident report', done: false },
    ];
  const [checklist, setChecklist] = useState(defaultChecklist);
  const toggleCheck = (id) =>
    setChecklist(checklist.map((item) => (item.id === id ? { ...item, done: !item.done } : item)));

  // ── SHAP panel data (already normalized by normalizeResult in apiService.js) ──
  // result.shap has all correct field names ready for components
  const shapPanel = shap ?? null;


  return (
    <div className="relative w-full h-screen font-inter text-slate-100 bg-[#080514] flex overflow-hidden">
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <CyberGridCanvas tNorm={tNorm} threatColor={getThreatColor(tNorm)} />
      </div>

      <Sidebar currentThreatLevel={severity} />

      <main className="flex-1 h-screen overflow-y-auto relative z-10 pb-20">
        <div className="max-w-7xl mx-auto px-6 pt-12">

          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-10 gap-6">
            <div>
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors uppercase font-jetbrains text-[11px] tracking-widest mb-4"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Scanner
              </button>
              <h1 className="font-orbitron font-bold text-3xl tracking-widest text-white uppercase flex items-center gap-4">
                CYBER RISK <span style={{ color: threatColor }}>DASHBOARD</span>
              </h1>
              <div className="font-jetbrains text-[12px] tracking-wider text-slate-500 mt-2 flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Analyzed: <span className="text-slate-300 truncate max-w-md">{typeof input === 'string' ? input : 'File Target'}</span>
              </div>
            </div>
            <div className="flex gap-3 flex-wrap">
              {shap && (
                <button
                  onClick={() => navigate('/ai-insights', { state: { shapData: shapPanel, temporalData: temporalData, scanType: scanType, initialTab: 'defensive' } })}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[#7c3aed]/40 bg-[#7c3aed]/10 text-[#a78bfa] font-jetbrains text-[11px] tracking-widest uppercase hover:bg-[#7c3aed]/20 transition-colors"
                >
                  <BrainCircuit className="w-4 h-4" /> AI Insights
                </button>
              )}
              <ActionButton as="Link" to="/threat-detection" className="w-full sm:w-auto mt-0">
                <span className="w-2 h-2 border-t-2 border-r-2 border-slate-400 rotate-45 transform" /> NEW SCAN
              </ActionButton>
            </div>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

            {/* Left Column */}
            <div className="lg:col-span-4 space-y-8">

              {/* Risk Score gauge */}
              <div className="bg-[#0f0a26]/80 backdrop-blur-xl border border-white/10 rounded-[20px] p-8 shadow-xl flex flex-col items-center">
                <div className="font-jetbrains text-[10px] tracking-[0.2em] text-slate-500 uppercase mb-8 w-full text-center">RISK SCORE</div>
                <div className="relative flex items-center justify-center mb-6">
                  <svg className="transform -rotate-90 w-48 h-48">
                    <circle stroke="rgba(255,255,255,0.05)" strokeWidth="12" fill="transparent" r={radius} cx="96" cy="96" />
                    <circle
                      stroke={threatColor}
                      strokeWidth="12"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      fill="transparent"
                      r={radius} cx="96" cy="96"
                      className="transition-all duration-1000 ease-out"
                      style={{ filter: `drop-shadow(0 0 10px ${threatColor})` }}
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center">
                    <div className="font-orbitron text-5xl font-bold" style={{ color: threatColor }}>{score}</div>
                    <div className="font-jetbrains text-slate-500 text-[10px] tracking-widest">/100</div>
                  </div>
                </div>
                <div className="px-6 py-2 rounded-full border bg-black/40 text-[11px] font-orbitron font-bold tracking-widest uppercase flex items-center gap-2" style={{ borderColor: threatColor, color: threatColor }}>
                  {isSafe ? <ShieldCheck className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
                  {severity}
                </div>
                <div className="w-full flex justify-between mt-8 text-[9px] font-jetbrains text-slate-600 font-bold uppercase tracking-widest px-4">
                  <span className="text-green-500/50">0 SAFE</span>
                  <span className="text-yellow-500/50">50</span>
                  <span className="text-red-500/50">100 CRITICAL</span>
                </div>
              </div>

              {/* SHAP Panel (only if backend returned SHAP data) */}
              {shapPanel && (
                <div className="w-full flex justify-center">
                  <SHAPExplainabilityPanel data={shapPanel} />
                </div>
              )}

              {/* Scan Details */}
              <div className="bg-[#0f0a26]/80 backdrop-blur-xl border border-white/10 rounded-[20px] p-8 shadow-xl">
                <div className="font-jetbrains text-[10px] tracking-[0.2em] text-slate-500 uppercase mb-6">SCAN DETAILS</div>
                <div className="space-y-4 font-jetbrains text-[12px]">
                  <div className="flex justify-between items-center border-b border-white/5 pb-4">
                    <span className="text-slate-500">Input Type</span>
                    <span className="text-slate-300 font-bold tracking-widest uppercase">{type}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-white/5 pb-4">
                    <span className="text-slate-500">Confidence</span>
                    <span style={{ color: threatColor }}>{confidence}%</span>
                  </div>
                  {mitre && (
                    <div className="flex justify-between items-center border-b border-white/5 pb-4">
                      <span className="text-slate-500">MITRE</span>
                      <span className="text-orange-400 text-[10px]">{mitre}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Indicators</span>
                    <span className="text-[#3b82f6]">{indicators.length} found</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="lg:col-span-8 flex flex-col gap-8">

              {/* Threat Header Card */}
              <div className="bg-[#0f0a26]/80 backdrop-blur-xl border border-white/10 rounded-[20px] p-8 shadow-xl relative overflow-hidden">
                <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full blur-[100px] opacity-10 pointer-events-none" style={{ backgroundColor: threatColor }} />
                <div className="flex items-center gap-6 mb-8">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center border bg-black/40" style={{ borderColor: threatColor, color: threatColor }}>
                    {isSafe ? <ShieldCheck className="w-8 h-8" /> : <AlertOctagon className="w-8 h-8" />}
                  </div>
                  <div>
                    <div className="font-jetbrains text-[10px] tracking-[0.2em] text-slate-500 uppercase mb-2">DETECTION RESULT</div>
                    <h2 className="font-orbitron font-bold text-2xl tracking-wide text-white mb-2">{threatName}</h2>
                    {!isSafe && (
                      <span className="font-jetbrains text-[10px] tracking-widest px-3 py-1 rounded-full border bg-red-900/20 text-red-400 border-red-500/30 uppercase">
                        • {severity} Risk
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <div className="flex justify-between font-jetbrains text-[11px] tracking-widest text-slate-400 uppercase mb-3">
                    <span className="flex items-center gap-2">
                       <Activity className="w-3.5 h-3.5" /> 
                       {temporalData?.fused_score !== undefined ? 'Temporal Fused Score' : 'AI Confidence'}
                    </span>
                    <span style={{ color: threatColor }}>
                       {temporalData?.fused_score !== undefined ? Math.round(temporalData.fused_score * 100) : confidence}%
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-1000 ease-out" 
                      style={{ 
                        width: `${temporalData?.fused_score !== undefined ? temporalData.fused_score * 100 : confidence}%`, 
                        backgroundColor: threatColor, 
                        filter: `drop-shadow(0 0 8px ${threatColor})` 
                      }} 
                    />
                  </div>
                </div>
              </div>

              {/* Temporal Context Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <KillChainVisualizer 
                  currentIndex={temporalData?.kill_chain?.current_stage_index ?? 0}
                  predictedNext={temporalData?.kill_chain?.predicted_next_index}
                />
                <div className="space-y-8">
                  <TemporalMetricsGrid features={temporalData?.temporal_features} />
                  
                  {/* Dashboard AI Brief */}
                  <div className="bg-[#0f0a26]/60 backdrop-blur-xl border border-white/10 rounded-[20px] p-6 shadow-xl">
                    <div className="font-orbitron font-bold text-[14px] text-green-400 uppercase tracking-[0.2em] flex items-center gap-2 mb-4">
                      <Brain className="w-5 h-5" /> AI Narrative
                    </div>
                    <p className="font-inter text-slate-300 text-[13px] leading-relaxed italic opacity-80 line-clamp-4">
                      {temporalData?.ai_narrative?.defender_brief || "Accumulating temporal signal for narrative generation..."}
                    </p>
                    {shap && (
                      <button 
                        onClick={() => navigate('/ai-insights', { 
                          state: { 
                            shapData: shapPanel,
                            temporalData: temporalData,
                            initialTab: 'defensive'
                          } 
                        })}
                        className="mt-4 flex items-center gap-2 text-[#7c3aed] font-jetbrains text-[10px] uppercase tracking-widest hover:text-[#a78bfa] transition-colors"
                      >
                        Read Full AI Story <ExternalLink className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Indicators */}
              <div className="bg-[#0f0a26]/80 backdrop-blur-xl border border-white/10 rounded-[20px] p-8 shadow-xl">
                <div className="flex justify-between items-center mb-6">
                  <div className="font-orbitron text-[14px] font-bold tracking-[0.2em] text-[#3b82f6] uppercase flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" /> THREAT INDICATORS
                  </div>
                  <div className="font-jetbrains text-[10px] px-3 py-1 rounded-full bg-[#3b82f6]/10 text-[#3b82f6] border border-[#3b82f6]/30 uppercase tracking-widest">
                    {indicators.length} found
                  </div>
                </div>
                <div className="space-y-3">
                  {indicators.map((indicator, idx) => (
                    <div key={idx} className="flex items-start gap-4 bg-black/40 border border-white/5 rounded-xl p-4 hover:border-white/10 transition-colors">
                      <div className="w-6 h-6 rounded-full bg-[#3b82f6]/20 text-[#3b82f6] flex items-center justify-center font-jetbrains text-[10px] font-bold shrink-0 mt-0.5">
                        {idx + 1}
                      </div>
                      <span className="font-inter text-slate-300 text-[13px] leading-relaxed">{indicator}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommended Action + Checklist */}
              <div className="bg-[#0f0a26]/80 backdrop-blur-xl border border-white/10 rounded-[20px] p-8 shadow-xl">
                <div className="font-orbitron font-bold text-[14px] tracking-[0.2em] text-[#ef4444] uppercase flex items-center gap-2 mb-6">
                  <ShieldAlert className="w-5 h-5" /> RECOMMENDED ACTION
                </div>
                <div className={`border rounded-xl p-5 mb-8 ${isSafe ? 'bg-green-950/20 border-green-500/20' : 'bg-red-950/20 border-red-500/20'}`}>
                  <p className={`font-inter leading-relaxed text-[15px] ${isSafe ? 'text-green-200' : 'text-red-200'}`}>{recommendations}</p>
                </div>
                <div className="font-jetbrains text-[10px] tracking-[0.2em] text-slate-500 uppercase mb-4">ACTION CHECKLIST</div>
                <div className="space-y-3">
                  {checklist.map((item) => (
                    <div key={item.id} onClick={() => toggleCheck(item.id)} className={`flex items-center gap-3 cursor-pointer group transition-colors ${item.done ? 'opacity-50' : 'opacity-100'}`}>
                      {item.done
                        ? <CheckSquare className="w-5 h-5 text-green-500" />
                        : <Square className="w-5 h-5 text-slate-600 group-hover:text-red-400 transition-colors" />
                      }
                      <span className={`font-inter text-[14px] ${item.done ? 'text-slate-500 line-through' : 'text-slate-300'}`}>{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
