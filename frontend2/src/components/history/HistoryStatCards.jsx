import { rgba } from '../../utils/colors';
import { Clock, Globe, Mail, ShieldAlert } from 'lucide-react';

export default function HistoryStatCards() {
  // Mock Data
  const stats = [
    { label: 'TOTAL SCANS', value: 7, icon: Clock, color: '#1d9e75' }, 
    { label: 'URL SCANS', value: 4, icon: Globe, color: '#0ea5e9' }, 
    { label: 'EMAIL SCANS', value: 3, icon: Mail, color: '#f59e0b' },
    { label: 'HIGH RISK', value: 5, icon: ShieldAlert, color: '#e24b4a' } 
  ];

  const hexToRgb = (hex) => {
    let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : { r: 34, g: 197, b: 94 };
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      {stats.map((stat, idx) => {
        const colObj = hexToRgb(stat.color);
        const colAlpha = (a) => rgba(colObj, a);
        
        return (
          <div 
            key={idx}
            className="bg-[#0f172a]/60 border border-white/10 rounded-xl p-5 backdrop-blur-md flex items-center gap-5 transition-transform duration-300 hover:-translate-y-1 shadow-[0_0_15px_rgba(0,0,0,0.2)] hover:shadow-lg"
          >
            <div 
              className="w-12 h-12 rounded-lg flex flex-shrink-0 items-center justify-center shadow-inner"
              style={{ backgroundColor: colAlpha(0.1), border: `1px solid ${colAlpha(0.25)}` }}
            >
              <stat.icon className="w-6 h-6" style={{ color: stat.color }} />
            </div>
            <div className="flex flex-col justify-center">
              <div 
                className="font-orbitron text-[26px] font-bold leading-none mb-1 shadow-sm"
                style={{ color: stat.color, textShadow: `0 0 10px ${colAlpha(0.3)}` }}
              >
                {stat.value}
              </div>
              <div className="font-jetbrains text-[9px] uppercase tracking-widest text-slate-500 font-bold">
                {stat.label}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
