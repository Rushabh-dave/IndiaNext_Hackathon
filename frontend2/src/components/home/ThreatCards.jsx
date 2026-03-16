import { useState, useEffect } from 'react';
import { rgba } from '../../utils/colors';
import { ShieldAlert, TerminalSquare, EyeOff, Globe, ShieldBan, BrainCircuit } from 'lucide-react';

export default function ThreatCards({ tNorm, col, colorStr }) {
  const [vals, setVals] = useState([2847, 312, 891, 38412, 14293]);

  useEffect(() => {
    const rate = 1 + tNorm * 0.08;
    const interval = setInterval(() => {
      setVals(prev => prev.map((v, i) => v + Math.floor(Math.random() * rate * (i < 3 ? 3 : 8))));
    }, 800);
    return () => clearInterval(interval);
  }, [tNorm]);

  const cards = [
    { id: 'phish', icon: ShieldAlert, label: 'Phishing', val: vals[0], style: { top: '148px', left: '22px' }, n: 1 },
    { id: 'inject', icon: TerminalSquare, label: 'Prompt Inj.', val: vals[1], style: { top: '228px', left: '22px' }, n: 2 },
    { id: 'deep', icon: EyeOff, label: 'Deepfake', val: vals[2], style: { top: '308px', left: '22px' }, n: 3 },
    { id: 'url', icon: Globe, label: 'URLs Scanned', val: vals[3], style: { top: '148px', right: '22px' }, n: 4 },
    { id: 'blocked', icon: ShieldBan, label: 'Blocked', val: vals[4], style: { top: '228px', right: '22px' }, n: 5 },
    { id: 'acc', icon: BrainCircuit, label: 'AI Accuracy', val: '99.8%', style: { top: '308px', right: '22px' }, n: 6 }
  ];

  const getCardColor = (n) => col;

  return (
    <>
      {cards.map(({ id, icon: Icon, label, val, style, n }) => {
        const cardCol = getCardColor(n);
        const cc = `rgb(${cardCol.r},${cardCol.g},${cardCol.b})`;
        const cca = (a) => rgba(cardCol, a);

        return (
          <div 
            key={id}
            className="absolute z-30 px-3.5 py-2.5 rounded-xl backdrop-blur-md flex items-center gap-2.5 pointer-events-none transition-all duration-300 border"
            style={{
              ...style,
              backgroundColor: cca(0.1),
              borderColor: cca(0.28),
              boxShadow: `0 0 ${Math.round(8 + tNorm * 20)}px ${cca(tNorm * 0.25)}`
            }}
          >
            <div 
              className="w-8 h-8 rounded-[9px] flex items-center justify-center shrink-0 transition-all duration-300 border"
              style={{ backgroundColor: cca(0.14), borderColor: cca(0.3) }}
            >
              <Icon className="w-4 h-4" style={{ color: cc }} />
            </div>
            <div>
              <div 
                className="font-jetbrains text-[9px] tracking-[0.1em] uppercase mb-0.5 transition-colors duration-300"
                style={{ color: cca(0.75) }}
              >
                {label}
              </div>
              <div 
                className="font-orbitron text-[14px] font-bold transition-colors duration-300"
                style={{ color: cc }}
              >
                {typeof val === 'number' ? val.toLocaleString() : val}
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
}
