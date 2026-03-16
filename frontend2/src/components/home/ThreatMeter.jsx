import { rgba, C_1, C_2, C_3, C_4, C_5, C_6, C_7 } from '../../utils/colors';

export default function ThreatMeter({ tNorm, col, colorStr }) {
  const colAlpha = (a) => rgba(col, a);

  return (
    <div className="w-[380px] mx-auto animate-[fadein_0.8s_ease_0.4s_both]">
      <div className="flex items-center justify-between mb-2">
        <span className="font-jetbrains text-[9px] tracking-[0.2em] uppercase transition-colors duration-300" style={{ color: colAlpha(0.7) }}>
          Global Threat Index
        </span>
        <span className="font-orbitron text-[14px] font-extrabold transition-colors duration-300" style={{ color: colorStr }}>
          {Math.round(tNorm * 100)} / 100
        </span>
      </div>
      <div className="h-[6px] rounded-full bg-white/5 overflow-hidden border border-white/5">
        <div 
          className="h-full rounded-full transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{
            width: `${tNorm * 100}%`,
            background: `linear-gradient(90deg, rgba(${C_1.r},${C_1.g},${C_1.b},1), rgba(${C_2.r},${C_2.g},${C_2.b},1), rgba(${C_3.r},${C_3.g},${C_3.b},1), rgba(${C_4.r},${C_4.g},${C_4.b},1), rgba(${C_5.r},${C_5.g},${C_5.b},1), rgba(${C_6.r},${C_6.g},${C_6.b},1), rgba(${C_7.r},${C_7.g},${C_7.b},1))`
          }}
        />
      </div>
      <div className="flex justify-between mt-[5px]">
        {['SECURE', 'SAFE', 'GUARDED', 'ELEVATED', 'HIGH', 'SEVERE', 'CRITICAL'].map((label, i) => (
          <span key={i} className="font-jetbrains text-[7.5px] tracking-[0.1em] text-slate-500/60 uppercase">
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
