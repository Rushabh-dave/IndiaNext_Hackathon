import { useState, useEffect } from 'react';

export default function SHAPDeviationBar({ baseValue = 0.25, probPercent = 99, deviationText = "+74%", statusColor = "#e24b4a" }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="bg-[#0f172a]/60 border border-white/5 rounded-xl p-5 backdrop-blur-md">
      <div className="flex justify-between items-end mb-4">
        <div>
          <div className="font-jetbrains text-[12px] text-slate-400 uppercase tracking-widest mb-1">Risk Score Explanation</div>
          <div className="font-inter text-[13px] text-slate-300">Baseline deviation triggering classification</div>
        </div>
        <div className="font-jetbrains text-[16px] font-bold" style={{ color: statusColor }}>
          {deviationText}
        </div>
      </div>

      <div className="relative h-4 w-full bg-slate-800 rounded-full overflow-hidden mt-4 shadow-inner">
        {/* Base Value Marker */}
        <div 
          className="absolute top-0 bottom-0 w-[3px] bg-slate-300 z-10"
          style={{ left: `${baseValue * 100}%` }}
        />
        {/* Probability Progress Bar */}
        <div 
          className="h-full rounded-full transition-all duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] relative z-0"
          style={{ 
            width: mounted ? `${probPercent}%` : '0%', 
            backgroundColor: statusColor,
            boxShadow: `0 0 15px ${statusColor}60`
          }}
        />
      </div>
      
      <div className="flex justify-between text-[11px] font-jetbrains text-slate-500 mt-3 uppercase tracking-wider px-1">
        <span>Baseline: {(baseValue * 100).toFixed(1)}%</span>
        <span>Model Output: {probPercent.toFixed(1)}%</span>
      </div>
    </div>
  );
}
