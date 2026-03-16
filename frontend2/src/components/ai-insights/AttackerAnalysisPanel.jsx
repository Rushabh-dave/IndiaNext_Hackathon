import { AlertOctagon, Cpu, ShieldAlert, Zap, Target, Globe, Mail, Radio, Lock } from 'lucide-react';

export default function AttackerAnalysisPanel({ data, scanType = 'url' }) {
  if (!data) return null;

  // SHAP values are 0.0–1.0 floats
  const threatLevel = data.shap_feature_threat ?? 0;  // 0.0–1.0
  const legitLevel  = data.shap_feature_legit ?? 0;
  const deviation   = data.prediction_deviation ?? '—';

  // Build attack signals from the real threat score (0-1 range)
  const attackSignals = [];
  if (threatLevel > 0.85) attackSignals.push('Extreme Malicious Signal');
  if (threatLevel > 0.60) attackSignals.push('High-Confidence Threat Pattern');
  if (threatLevel > 0.40) attackSignals.push('Suspicious Behavior Detected');
  if (legitLevel  < 0.10) attackSignals.push('Near-Zero Legitimate Signals');
  if (legitLevel  < 0.30) attackSignals.push('Minimal Legitimate Content');

  // Also pull detected tactics from SHAP if available
  const detectedTactics = data.detected_tactics || [];
  detectedTactics.forEach(t => {
    if (t?.tactic) attackSignals.push(t.tactic.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()));
  });

  // Attack classification based on score range
  let classification = 'Anomalous Payload Delivery';
  if (threatLevel > 0.90) classification = 'Credential Harvesting Attempt';
  else if (threatLevel > 0.75) classification = 'Spearphishing / Malicious Link';
  else if (threatLevel > 0.55) classification = 'Account Verification Scam';
  else if (threatLevel > 0.35) classification = 'Social Engineering Attempt';

  // Determine attack vector icon
  const vectorMap = {
    url: { label: 'Malicious URL', icon: Globe, color: '#22c55e' },
    email: { label: 'Phishing Email', icon: Mail, color: '#3b82f6' },
    'prompt-injection': { label: 'Prompt Injection', icon: Radio, color: '#a855f7' },
    deepfake: { label: 'Deepfake Media', icon: Lock, color: '#ec4899' },
  };
  const vector = vectorMap[scanType?.toLowerCase()] || { label: 'Unknown Vector', icon: Target, color: '#64748b' };
  const VectorIcon = vector.icon;

  return (
    <div className="flex flex-col gap-6 w-full animate-[fadein_0.5s_ease_both]">

      {/* Attack Vector */}
      <div className="flex items-center gap-4 bg-black/30 border border-white/5 rounded-xl p-4">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${vector.color}15`, color: vector.color }}>
          <VectorIcon className="w-5 h-5" />
        </div>
        <div>
          <div className="font-jetbrains text-[10px] text-slate-500 uppercase tracking-widest">Attack Vector</div>
          <div className="font-orbitron font-bold text-[15px] text-white">{vector.label}</div>
        </div>
        <div className="ml-auto text-right">
          <div className="font-jetbrains text-[10px] text-slate-500 uppercase tracking-widest">Confidence</div>
          <div className="font-orbitron font-bold text-[15px]" style={{ color: vector.color }}>
            {(threatLevel * 100).toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Attack Signals Detected */}
      <div className="bg-[#0f172a]/60 border border-[#e24b4a]/30 rounded-xl p-6 backdrop-blur-md relative overflow-hidden shadow-[0_0_20px_rgba(226,75,74,0.05)]">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#e24b4a]/10 blur-[40px] pointer-events-none" />

        <h3 className="font-orbitron font-bold text-[14px] text-[#e24b4a] uppercase tracking-widest mb-4 flex items-center gap-2">
          <AlertOctagon className="w-5 h-5" /> Attack Signals Detected
        </h3>

        <div className="flex flex-wrap gap-3">
          {attackSignals.map((signal, idx) => (
            <div key={idx} className="bg-[#e24b4a]/10 border border-[#e24b4a]/20 text-[#e24b4a] font-jetbrains text-[11px] tracking-wider px-3 py-1.5 rounded-md uppercase flex items-center gap-1.5">
              <Zap className="w-3 h-3" /> {signal}
            </div>
          ))}
          {attackSignals.length === 0 && (
            <span className="text-slate-500 font-jetbrains text-[12px] italic">Signal below detection threshold.</span>
          )}
        </div>
      </div>

      {/* Why This Works */}
      <div className="bg-black/40 border border-[#ef9f27]/30 rounded-xl p-6 relative">
        <h3 className="font-orbitron font-bold text-[14px] text-[#ef9f27] uppercase tracking-widest mb-3 flex items-center gap-2">
          <Cpu className="w-5 h-5" /> Why This Payload Is Effective
        </h3>
        <p className="font-inter text-slate-300 text-[14px] leading-relaxed">
          The attacker successfully minimized <span className="text-[#1d9e75]">legitimate signals ({(legitLevel * 100).toFixed(1)}%)</span> while 
          heavily utilizing high-converting <span className="text-[#e24b4a]">threat features ({(threatLevel * 100).toFixed(1)}%)</span>.{' '}
          This drove a massive <span className="text-white font-bold">{deviation}</span> deviation from baseline expectations, 
          bypassing traditional static filters.
        </p>
      </div>

      {/* Attack Pattern Classification */}
      <div className="bg-[#0f172a] border-l-4 border-r border-t border-b border-l-[#7c3aed] border-white/5 rounded-xl p-6 shadow-lg">
        <div className="font-jetbrains text-[11px] text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-[#7c3aed]" /> ATTACK PATTERN CLASSIFICATION
        </div>
        <div className="font-orbitron text-[20px] font-bold text-white uppercase tracking-wider">
          {classification}
        </div>
      </div>

    </div>
  );
}
