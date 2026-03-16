import { TrendingUp } from 'lucide-react';

export default function AverageRiskBar({ score = 70 }) {
  // Map risk level 70 => Red/Yellow gradient
  let barGradient = 'linear-gradient(90deg, #f59e0b 0%, #ef4444 100%)';
  if (score < 40) barGradient = 'linear-gradient(90deg, #10b981 0%, #1d9e75 100%)';
  else if (score < 60) barGradient = 'linear-gradient(90deg, #eab308 0%, #f59e0b 100%)';

  return (
    <div className="bg-[#0f172a]/80 border border-white/5 rounded-xl p-5 mb-8 flex flex-col justify-center relative overflow-hidden shadow-xl backdrop-blur-md">
      <div className="flex justify-between items-center w-full mb-3">
        <h3 className="font-jetbrains text-[10px] uppercase text-slate-400 tracking-[0.2em] flex items-center gap-2">
          <TrendingUp className="w-3.5 h-3.5" /> AVERAGE RISK SCORE
        </h3>
        <span className="font-orbitron font-bold text-[16px] text-[#facc15] tracking-widest">{score}/100</span>
      </div>

      <div className="relative w-full h-2.5 bg-[#0f0a26] rounded-full overflow-hidden shadow-inner border border-white/5">
        <div 
          className="absolute top-0 left-0 bottom-0 rounded-full transition-all duration-[1200ms] shadow-[0_0_15px_#ef444450]"
          style={{ width: `${score}%`, background: barGradient }}
        />
      </div>
    </div>
  );
}
