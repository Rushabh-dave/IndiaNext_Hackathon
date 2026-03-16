import { useState, useEffect } from 'react';
import { rgba } from '../../utils/colors';

export default function HUDOverlay({ tNorm, col, colorStr }) {
  const [pkn, setPkn] = useState(24891);
  const colAlpha = (a) => rgba(col, a);

  useEffect(() => {
    const interval = setInterval(() => {
      setPkn(prev => prev + Math.floor(Math.random() * 14 * (1 + tNorm * 0.08)) + 3);
    }, 1100);
    return () => clearInterval(interval);
  }, [tNorm]);

  const lblColor = `rgba(124, 58, 237, 0.38)`;
  const valColor = `rgba(167, 139, 250, 0.45)`;

  const HUDItem = ({ label, value, css, valueStyle = {} }) => (
    <div className={`absolute z-25 pointer-events-none ${css}`}>
      <div className="font-jetbrains text-[8px] tracking-[0.18em] uppercase leading-[1.9] transition-colors duration-300" style={{ color: lblColor }}>
        {label}
      </div>
      <div className="font-jetbrains text-[8.5px] tracking-[0.12em] transition-colors duration-300" style={{ color: valColor, ...valueStyle }}>
        {value}
      </div>
    </div>
  );

  return (
    <>
      {/* Brackets */}
      <div className="w-5 h-5 absolute top-[72px] left-4 border-t-[1.5px] border-l-[1.5px] transition-colors duration-300" style={{ borderColor: colAlpha(0.42) }} />
      <div className="w-5 h-5 absolute top-[72px] right-4 border-t-[1.5px] border-r-[1.5px] transition-colors duration-300" style={{ borderColor: colAlpha(0.35) }} />
      <div className="w-5 h-5 absolute bottom-12 left-4 border-b-[1.5px] border-l-[1.5px] transition-colors duration-300" style={{ borderColor: colAlpha(0.22) }} />
      <div className="w-5 h-5 absolute bottom-12 right-4 border-b-[1.5px] border-r-[1.5px] transition-colors duration-300" style={{ borderColor: colAlpha(0.18) }} />

      {/* Info Panels */}
      <HUDItem label="Neural Engine" value={`PKT · ${pkn.toLocaleString()}`} css="top-[76px] left-[22px]" />
      <HUDItem 
        label="Threat Level" 
        value={
          tNorm <= 1/6 ? 'SECURE' :
          tNorm <= 2/6 ? 'SAFE' :
          tNorm <= 3/6 ? 'GUARDED' :
          tNorm <= 4/6 ? 'ELEVATED' :
          tNorm <= 5/6 ? 'HIGH' :
          tNorm <= 5.8/6 ? 'SEVERE' : 'CRITICAL'
        } 
        css="top-[76px] right-[22px] text-right" 
        valueStyle={{ color: colorStr, fontWeight: 700 }}
      />
      <HUDItem label="Models · 5 Active" value="BERT / CNN / CLIP" css="bottom-[54px] left-[22px]" />
      <HUDItem label="Uptime · 99.97%" value="v3.0 STABLE" css="bottom-[54px] right-[22px] text-right" />
    </>
  );
}
