import { Activity } from 'lucide-react';
import { rgba } from '../../utils/colors';
import ActionButton from '../buttons/ActionButton';

/**
 * 
 * @param {Object} props
 * @param {string} props.title - Card title, e.g. "Phishing Email Detection"
 * @param {React.ReactNode} props.icon - Lucide icon component, e.g. <Mail />
 * @param {string} props.color - Theme color string like '#22c55e'
 * @param {React.ReactNode} props.children - Input elements
 * @param {Function} props.onAnalyze - Handle action (API dispatch)
 * @param {boolean} props.isAnalyzing - Loading state
 * @param {string} props.actionText - Button text e.g. "Analyze Email"
 */
export default function DetectionCard({ 
  title, 
  icon, 
  color = '#22c55e', 
  children, 
  onAnalyze, 
  isAnalyzing, 
  actionText = "ANALYZE"
}) {
  const hexToRgb = (hex) => {
    let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 34, g: 197, b: 94 };
  };

  const colObj = hexToRgb(color);
  const colAlpha = (a) => rgba(colObj, a);

  return (
    <div className="min-w-full h-full flex-shrink-0 flex items-center justify-center snap-center p-8 relative">
      <div 
        className="w-full max-w-4xl h-[560px] flex flex-col bg-[#0f0a26]/80 backdrop-blur-xl border rounded-[24px] p-10 shadow-[0_0_60px_rgba(0,0,0,0.5)] transition-all relative overflow-hidden"
        style={{ borderColor: colAlpha(0.2) }}
      >
        {/* Subtle glow behind card */}
        <div 
          className="absolute -top-32 -right-32 w-64 h-64 rounded-full blur-[100px] pointer-events-none opacity-20"
          style={{ backgroundColor: color }}
        />

        {/* Header */}
        <div className="flex items-center gap-4 mb-8 relative z-10">
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center border"
            style={{ backgroundColor: colAlpha(0.1), borderColor: colAlpha(0.3), color: color }}
          >
            {icon ? icon : <Activity className="w-6 h-6" />}
          </div>
          <div>
            <div className="flex items-center gap-2 font-jetbrains text-[10px] tracking-widest uppercase mb-1" style={{ color: color }}>
              <div className="w-[5px] h-[5px] rounded-full animate-pulse" style={{ backgroundColor: color }} /> 
              THREAT DETECTION MODULE
            </div>
            <h2 className="font-orbitron font-bold text-2xl tracking-wide text-white">{title}</h2>
          </div>
        </div>

        {/* Input Section */}
        <div className="relative z-10 space-y-5 flex-grow flex flex-col justify-center">
          {children}
        </div>

        {/* Action Button */}
        <ActionButton
          onClick={onAnalyze}
          disabled={isAnalyzing}
          className="w-full mt-auto py-4 rounded-xl text-[14px] gap-3 flex-shrink-0"
          style={{ 
            backgroundColor: isAnalyzing ? colAlpha(0.2) : colAlpha(0.1), 
            borderColor: colAlpha(0.4),
            color: color
          }}
        >
          {isAnalyzing ? (
            <>
              <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: color, borderTopColor: 'transparent' }} />
              PROCESSING...
            </>
          ) : (
             <>{actionText}</>
          )}
        </ActionButton>
      </div>
    </div>
  );
}
