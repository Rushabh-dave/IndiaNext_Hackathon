import { ShieldCheck, Crosshair, AlertCircle, Info } from 'lucide-react';

export default function TemporalNarrative({ narrative = {}, temporalData = null }) {
  // The backend provides both `ai_narrative` (may be rule-based) and
  // top-level `defender_view` / `attacker_view` which are always populated.
  const {
    defender_brief,
    attacker_narrative,
    immediate_actions = [],
    status,
    model_used,
  } = narrative;

  // Use top-level views from temporalData if the AI brief was skipped
  const defenderText = defender_brief
    || temporalData?.defender_view
    || 'No threat activity detected in the current observation window.';

  const attackerText = attacker_narrative
    || temporalData?.attacker_view
    || 'No attacker pattern detected yet. Insufficient signal in window.';

  const isRuleBased = model_used === 'rule-based fallback' || status === 'skipped';

  return (
    <div className="space-y-6">
      {/* Status Badge */}
      {isRuleBased && (
        <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-4 py-2 text-yellow-400 font-jetbrains text-[10px] uppercase tracking-widest">
          <Info className="w-4 h-4 shrink-0" />
          Rule-based fallback — AI narrative requires more alerts in window
        </div>
      )}

      {/* Defender Perspective */}
      <div className="bg-[#0f172a]/80 border border-[#1d9e75]/30 rounded-[20px] p-6 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#1d9e75]/5 blur-[60px] pointer-events-none group-hover:bg-[#1d9e75]/10 transition-colors" />
        
        <h3 className="font-orbitron font-bold text-[14px] text-[#1d9e75] uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5" /> Defender Context
        </h3>
        
        <p className="font-inter text-slate-300 text-[14px] leading-relaxed italic opacity-90 border-l-2 border-[#1d9e75]/40 pl-4 py-1">
          {defenderText}
        </p>

        {immediate_actions.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2">
            {immediate_actions.map((action, idx) => (
              <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-[#1d9e75]/10 text-[#1d9e75] border border-[#1d9e75]/20 font-jetbrains text-[9px] uppercase tracking-widest">
                <AlertCircle className="w-3 h-3" /> {action}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Attacker Perspective */}
      <div className="bg-[#0f172a]/80 border border-[#e24b4a]/30 rounded-[20px] p-6 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#e24b4a]/5 blur-[60px] pointer-events-none group-hover:bg-[#e24b4a]/10 transition-colors" />
        
        <h3 className="font-orbitron font-bold text-[14px] text-[#e24b4a] uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
          <Crosshair className="w-5 h-5" /> Attacker Objective
        </h3>
        
        <p className="font-inter text-slate-300 text-[14px] leading-relaxed italic opacity-90 border-l-2 border-[#e24b4a]/40 pl-4 py-1">
          {attackerText}
        </p>
      </div>
    </div>
  );
}
