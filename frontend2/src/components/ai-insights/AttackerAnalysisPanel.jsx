import { AlertOctagon, Cpu, ShieldAlert } from 'lucide-react';

export default function AttackerAnalysisPanel({ data }) {
  if (!data) return null;

  // Derive mock attack signals from the feature attribution score
  const threatLevel = data.shap_feature_threat;
  const attackSignals = [];
  
  if (threatLevel > 4) attackSignals.push('Urgent Language Pattern');
  if (threatLevel > 2) attackSignals.push('Suspicious URL Domain');
  if (threatLevel > 3) attackSignals.push('Credential Request Pattern');
  if (threatLevel > 1) attackSignals.push('Spoofed Sender Behavior');

  let classification = "Unknown Payload Delivery";
  if (threatLevel > 4) classification = "Credential Harvesting Attempt";
  else if (threatLevel > 2.5) classification = "Account Verification Scam";
  
  return (
    <div className="flex flex-col gap-6 w-full animate-[fadein_0.5s_ease_both]">
       
       {/* Attack Signals Detected */}
       <div className="bg-[#0f172a]/60 border border-[#e24b4a]/30 rounded-xl p-6 backdrop-blur-md relative overflow-hidden shadow-[0_0_20px_rgba(226,75,74,0.05)]">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#e24b4a]/10 blur-[40px] pointer-events-none" />
          
          <h3 className="font-orbitron font-bold text-[14px] text-[#e24b4a] uppercase tracking-widest mb-4 flex items-center gap-2">
            <AlertOctagon className="w-5 h-5" /> Attack Signals Detected
          </h3>

          <div className="flex flex-wrap gap-3">
             {attackSignals.map((signal, idx) => (
                <div key={idx} className="bg-[#e24b4a]/10 border border-[#e24b4a]/20 text-[#e24b4a] font-jetbrains text-[11px] tracking-wider px-3 py-1.5 rounded-md uppercase">
                  {signal}
                </div>
             ))}
             {attackSignals.length === 0 && (
                <span className="text-slate-500 font-jetbrains text-[12px] italic">No explicit signals extracted.</span>
             )}
          </div>
       </div>

       {/* Why This Works */}
       <div className="bg-black/40 border border-[#ef9f27]/30 rounded-xl p-6 relative">
          <h3 className="font-orbitron font-bold text-[14px] text-[#ef9f27] uppercase tracking-widest mb-3 flex items-center gap-2">
            <Cpu className="w-5 h-5" /> Why This Payload Is Effective
          </h3>
          <p className="font-inter text-slate-300 text-[14px] leading-relaxed">
            The attacker successfully minimized <span className="text-[#1d9e75]">legitimate signals ({data.shap_feature_legit.toFixed(1)})</span> while heavily utilizing 
            high-converting <span className="text-[#e24b4a]">threat features ({data.shap_feature_threat.toFixed(1)})</span>. 
            This drove a massive <span className="text-white font-bold">{data.prediction_deviation}</span> deviation from baseline expectations, bypassing traditional static filters.
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
