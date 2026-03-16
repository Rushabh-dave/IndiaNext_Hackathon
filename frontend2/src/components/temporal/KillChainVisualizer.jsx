import { Shield, ChevronRight, AlertTriangle, CheckCircle2 } from 'lucide-react';

const STAGES = [
  "Reconnaissance",
  "Weaponization",
  "Delivery",
  "Exploitation",
  "Installation",
  "Command & Control",
  "Actions on Objectives"
];

export default function KillChainVisualizer({ currentIndex = 0, predictedNext = null }) {
  return (
    <div className="bg-[#0f0a26]/60 backdrop-blur-xl border border-white/10 rounded-[20px] p-6 shadow-xl">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-orbitron font-bold text-[14px] text-[#3b82f6] uppercase tracking-[0.2em] flex items-center gap-2">
          <Shield className="w-5 h-5" /> Cyber Kill Chain
        </h3>
        {predictedNext !== null && (
          <div className="font-jetbrains text-[9px] px-2 py-1 rounded bg-red-500/20 text-red-400 border border-red-500/30 uppercase tracking-widest animate-pulse">
            Next: {STAGES[predictedNext] || 'Unknown'}
          </div>
        )}
      </div>

      <div className="relative flex flex-col gap-3">
        {/* Connection Line */}
        <div className="absolute left-[13px] top-4 bottom-4 w-0.5 bg-white/5 z-0" />

        {STAGES.map((stage, idx) => {
          const isCompleted = idx < currentIndex;
          const isCurrent = idx === currentIndex;
          const isFuture = idx > currentIndex;

          return (
            <div key={stage} className={`flex items-center gap-4 relative z-10 transition-all duration-500 ${isFuture ? 'opacity-40' : 'opacity-100'}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center border transition-all duration-500 ${
                isCompleted ? 'bg-[#1d9e75]/20 border-[#1d9e75] text-[#1d9e75]' :
                isCurrent ? 'bg-[#e24b4a]/20 border-[#e24b4a] text-[#e24b4a] shadow-[0_0_15px_rgba(226,75,74,0.3)]' :
                'bg-slate-900 border-white/10 text-slate-500'
              }`}>
                {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : 
                 isCurrent ? <AlertTriangle className="w-4 h-4 animate-pulse" /> : 
                 <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />}
              </div>
              
              <div className="flex-1 flex items-center justify-between">
                <span className={`font-jetbrains text-[12px] tracking-wide transition-colors ${
                  isCurrent ? 'text-white font-bold' : isCompleted ? 'text-slate-300' : 'text-slate-500'
                }`}>
                  {stage}
                </span>
                {isCurrent && (
                  <ChevronRight className="w-4 h-4 text-[#e24b4a] animate-bounce-x" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
