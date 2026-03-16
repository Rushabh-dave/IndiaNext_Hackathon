import { useState, useEffect } from 'react';
import { Target, AlertTriangle } from 'lucide-react';

export default function ContrastiveComparisonList({ samples = [] }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 200);
    return () => clearTimeout(timer);
  }, []);

  if (!samples || samples.length === 0) return null;

  return (
    <div className="bg-[#0f172a]/60 border border-white/5 rounded-xl p-5 backdrop-blur-md">
      <div className="font-jetbrains text-[12px] text-slate-400 uppercase tracking-widest mb-1">Contrastive Reference</div>
      <div className="font-inter text-[13px] text-slate-300 mb-5">Comparison with known behavioral baselines</div>
      
      <div className="space-y-3 max-h-[300px] overflow-y-auto hide-scrollbar pr-1">
        {samples.map((sample, idx) => {
          const isThreat = sample.direction === "higher risk";
          const borderColor = isThreat ? "border-[#e24b4a]" : "border-[#1d9e75]";
          const textColor = isThreat ? "text-[#e24b4a]" : "text-[#1d9e75]";
          const bgHover = isThreat ? "hover:bg-[#e24b4a]/5" : "hover:bg-[#1d9e75]/5";

          return (
            <div 
            key={idx}
            className={`bg-black/30 border border-white/5 border-l-4 ${borderColor} ${bgHover} rounded-r-lg rounded-l-sm p-4 flex flex-col gap-2 transition-all duration-500 transform`}
            style={{ 
              opacity: mounted ? 1 : 0, 
              transform: mounted ? 'translateX(0)' : 'translateX(-20px)', 
              transitionDelay: `${300 + (idx * 150)}ms` 
            }}
            >
              <div className="flex justify-between items-center">
                <span className={`font-jetbrains text-[10px] uppercase tracking-widest flex items-center gap-1.5 ${textColor}`}>
                  {isThreat ? <AlertTriangle className="w-3.5 h-3.5" /> : <Target className="w-3.5 h-3.5" />}
                  {sample.direction}
                </span>
                <span className={`font-jetbrains text-[12px] font-bold ${textColor}`}>
                    {sample.delta > 0 ? '+' : ''}{sample.delta.toFixed(2)} Δ
                </span>
              </div>
              <p className="font-inter text-slate-300 text-[13px] leading-relaxed italic opacity-90 border-l px-3 border-white/10 mt-1">
                "{sample.background_text}"
              </p>
            </div>
          )
        })}
      </div>
    </div>
  );
}
