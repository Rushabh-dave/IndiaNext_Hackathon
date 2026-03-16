import { useLocation, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShieldAlert, Activity, ShieldCheck, CheckSquare, Square, AlertTriangle, AlertOctagon } from 'lucide-react';
import { useState } from 'react';
import CyberGridCanvas from '../components/CyberGridCanvas';
import Sidebar from '../components/Sidebar';
import SHAPExplainabilityPanel from '../components/dashboard/SHAPExplainabilityPanel';
import { getThreatColor } from '../utils/colors';
import ActionButton from '../components/buttons/ActionButton';

export default function ThreatDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  // Safe extraction or mock data
  const { result = {}, type = 'Threat Scan', input = 'Unknown' } = location.state || {};

  // Parse result to populate UI (assuming typical response shapes or generating mocks for the demo)
  const isSafe = result.is_safe ?? false;
  const score = result.risk_score || (isSafe ? 15 : 92);
  const confidence = result.confidence || 95;
  const severity = isSafe ? 'SAFE' : (score > 80 ? 'CRITICAL' : (score > 50 ? 'ELEVATED' : 'SAFE'));
  const threatName = result.threat_type || (isSafe ? 'No Threat Detected' : 'Potentially Malicious Activity');

  const indicators = result.indicators || (isSafe ? ['No malicious patterns identified'] : [
    'Suspicious domain origin detected',
    'Urgency language heuristics triggered',
    'Known malicious payload signatures matched',
    'Unusual structural anomalies found'
  ]);

  const recommendations = result.recommendations || (isSafe ? 'No action required.' : 'Quarantine the input and do not open any attached links or files. Report to IT security.');

  const [checklist, setChecklist] = useState([
    { id: 1, text: 'Do not interact with the payload', done: false },
    { id: 2, text: 'Block the source address/domain', done: false },
    { id: 3, text: 'Alert IT Security team', done: false },
    { id: 4, text: 'Report phishing attempt locally', done: false },
  ]);

  const toggleCheck = (id) => {
    setChecklist(checklist.map(item => item.id === id ? { ...item, done: !item.done } : item));
  };

  const threatColor = isSafe ? '#22c55e' : (score > 80 ? '#ef4444' : '#f59e0b');
  const tNorm = isSafe ? 0.0 : (score / 100);

  // SVG Circular  // Derived Values
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  // Mock SHAP data for demonstration
  const mockShapData = {
    model_phishing_prob: (score / 100),
    base_value: 0.15,
    prediction_deviation: severity === 'SAFE' ? "-12%" : "+84%",
    shap_feature_threat: severity === 'SAFE' ? 0.8 : 5.4,
    shap_feature_legit: severity === 'SAFE' ? 3.2 : 0.4,
    interpretation: "Model strongly correlates anomalous sender domain with historical phishing campaigns.",
    top_contrastive_samples: [
      { background_text: "Verify your recent login attempt", delta: +2.1, direction: "higher risk" },
      { background_text: "Weekly team sync agenda", delta: -1.5, direction: "lower risk" }
    ]
  };

  return (
    <div className="relative w-full h-screen font-inter text-slate-100 bg-[#080514] flex overflow-hidden">
      
      {/* Background Canvas pinned to document */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <CyberGridCanvas tNorm={tNorm} threatColor={getThreatColor(tNorm)} />
      </div>

      {/* Global Sidebar (Left) */}
      <Sidebar currentThreatLevel={severity} />

      {/* Main Content (Right Area, Scrollable) */}
      <main className="flex-1 h-screen overflow-y-auto relative z-10 pb-20">
        <div className="max-w-7xl mx-auto px-6 pt-12">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-10 gap-6">
            <div>
              <button onClick={() => navigate(-1)} className="flex items-center justify-center sm:justify-start gap-2 text-slate-400 hover:text-white transition-colors uppercase font-jetbrains text-[13px] sm:text-[11px] tracking-widest mb-4 w-full sm:w-auto h-[44px] sm:h-auto border border-white/10 sm:border-transparent rounded-lg sm:rounded-none">
                <ArrowLeft className="w-4 h-4" /> Back to Scanner
              </button>
              <h1 className="font-orbitron font-bold text-3xl tracking-widest text-white uppercase flex items-center gap-4">
                CYBER RISK <span style={{ color: threatColor }}>DASHBOARD</span>
              </h1>
              <div className="font-jetbrains text-[12px] tracking-wider text-slate-500 mt-2 flex items-center gap-2">
                <Activity className="w-4 h-4" /> Analyzed Input: <span className="text-slate-300 truncate max-w-md block">{typeof input === 'string' ? input : 'File Target'}</span>
              </div>
            </div>
            <ActionButton as="Link" to="/threat-detection" className="w-full sm:w-auto mt-4 sm:mt-0">
              <span className="w-2 h-2 border-t-2 border-r-2 border-slate-400 rotate-45 transform" /> NEW SCAN
            </ActionButton>
          </div>

          {/* Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

            {/* Left Column: Score & Details */}
            <div className="lg:col-span-4 space-y-8">

              {/* Risk Score Card */}
              <div className="bg-[#0f0a26]/80 backdrop-blur-xl border border-white/10 rounded-[20px] p-8 shadow-xl relative overflow-hidden flex flex-col items-center">
                <div className="font-jetbrains text-[10px] tracking-[0.2em] text-slate-500 uppercase mb-8 w-full text-center">RISK SCORE</div>

                <div className="relative flex items-center justify-center mb-6">
                  {/* Background Circle */}
                  <svg className="transform -rotate-90 w-48 h-48">
                    <circle
                      stroke="rgba(255,255,255,0.05)"
                      strokeWidth="12"
                      fill="transparent"
                      r={radius}
                      cx="96"
                      cy="96"
                    />
                    {/* Foreground Circle */}
                    <circle
                      stroke={threatColor}
                      strokeWidth="12"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      fill="transparent"
                      r={radius}
                      cx="96"
                      cy="96"
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

              {/* SHAP Explainability Panel */}
              <div className="w-full flex justify-center">
                <SHAPExplainabilityPanel data={mockShapData} />
              </div>

              {/* Scan Details */}
              <div className="bg-[#0f0a26]/80 backdrop-blur-xl border border-white/10 rounded-[20px] p-8 shadow-xl">
                <div className="font-jetbrains text-[10px] tracking-[0.2em] text-slate-500 uppercase mb-6">SCAN DETAILS</div>

                <div className="space-y-4 font-jetbrains text-[12px]">
                  <div className="flex justify-between items-center border-b border-white/5 pb-4">
                    <span className="text-slate-500">Input Type</span>
                    <span className="text-slate-300 font-bold tracking-widest uppercase">{type}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-white/5 pb-4">
                    <span className="text-slate-500">Scan Time</span>
                    <span className="text-slate-300 text-[#22c55e]">1.84s</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-white/5 pb-4">
                    <span className="text-slate-500">Model</span>
                    <span className="text-slate-300">AI v2.1</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Indicators</span>
                    <span className="text-[#3b82f6]">{indicators.length} found</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Threats & Actions */}
            <div className="lg:col-span-8 flex flex-col gap-8">

              {/* Threat Detected Header */}
              <div className="bg-[#0f0a26]/80 backdrop-blur-xl border border-white/10 rounded-[20px] p-8 shadow-xl flex flex-col justify-center relative overflow-hidden">
                <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full blur-[100px] opacity-10 pointer-events-none" style={{ backgroundColor: threatColor }} />

                <div className="flex items-center gap-6 mb-8">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center border bg-black/40" style={{ borderColor: threatColor, color: threatColor }}>
                    {isSafe ? <ShieldCheck className="w-8 h-8" /> : <AlertOctagon className="w-8 h-8" />}
                  </div>
                  <div>
                    <div className="font-jetbrains text-[10px] tracking-[0.2em] text-slate-500 uppercase mb-2">THREAT DETECTED</div>
                    <h2 className="font-orbitron font-bold text-3xl tracking-wide text-white mb-2">{threatName}</h2>
                    {!isSafe && <span className="font-jetbrains text-[10px] tracking-widest px-3 py-1 rounded full border bg-red-900/20 text-red-400 border-red-500/30 uppercase">• High Risk</span>}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between font-jetbrains text-[11px] tracking-widest text-slate-400 uppercase mb-3">
                    <span className="flex items-center gap-2"><Activity className="w-3.5 h-3.5" /> AI Confidence</span>
                    <span style={{ color: threatColor }}>{confidence}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${confidence}%`, backgroundColor: threatColor, filter: `drop-shadow(0 0 8px ${threatColor})` }} />
                  </div>
                </div>
              </div>

              {/* Threat Indicators List */}
              <div className="bg-[#0f0a26]/80 backdrop-blur-xl border border-white/10 rounded-[20px] p-8 shadow-xl">
                <div className="flex justify-between items-center mb-6">
                  <div className="font-orbitron text-[14px] font-bold tracking-[0.2em] text-[#3b82f6] uppercase flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" /> THREAT INDICATORS
                  </div>
                  <div className="font-jetbrains text-[10px] px-3 py-1 rounded-full bg-[#3b82f6]/10 text-[#3b82f6] border border-[#3b82f6]/30 uppercase tracking-widest">
                    {indicators.length} found
                  </div>
                </div>

                <div className="space-y-4">
                  {indicators.map((indicator, idx) => (
                    <div key={idx} className="flex items-center gap-4 bg-black/40 border border-white/5 rounded-xl p-4 transition-colors hover:border-white/10">
                      <div className="w-6 h-6 rounded-full bg-[#3b82f6]/20 text-[#3b82f6] flex items-center justify-center font-jetbrains text-[10px] font-bold">
                        {idx + 1}
                      </div>
                      <span className="font-inter text-slate-300 text-[14px]">{indicator}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommended Action & Checklist */}
              <div className="bg-[#0f0a26]/80 backdrop-blur-xl border border-white/10 rounded-[20px] p-8 shadow-xl">
                <div className="font-orbitron font-bold text-[14px] tracking-[0.2em] text-[#ef4444] uppercase flex items-center gap-2 mb-6">
                  <ShieldAlert className="w-5 h-5" /> RECOMMENDED ACTION
                </div>

                <div className="bg-red-950/20 border border-red-500/20 rounded-xl p-5 mb-8">
                  <p className="font-inter text-red-200 leading-relaxed text-[15px]">{recommendations}</p>
                </div>

                <div className="font-jetbrains text-[10px] tracking-[0.2em] text-slate-500 uppercase mb-4">ACTION CHECKLIST</div>
                <div className="space-y-3">
                  {checklist.map(item => (
                    <div
                      key={item.id}
                      onClick={() => toggleCheck(item.id)}
                      className={`flex items-center gap-3 cursor-pointer group transition-colors ${item.done ? 'opacity-50' : 'opacity-100'}`}
                    >
                      {item.done
                        ? <CheckSquare className="w-5 h-5 text-green-500" />
                        : <Square className="w-5 h-5 text-slate-600 group-hover:text-red-400 transition-colors" />
                      }
                      <span className={`font-inter text-[14px] ${item.done ? 'text-slate-500 line-through' : 'text-slate-300'}`}>
                        {item.text}
                      </span>
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
