import { rgba } from '../../utils/colors';
import ActionButton from '../buttons/ActionButton';

export default function ThreatControls({ targetThreat, setTargetThreat, autoMode, setAutoMode, colorStr }) {
  return (
    <div className="flex items-center gap-3 px-5 py-2.5 rounded-[14px] bg-[#080514]/75 border border-white/10 backdrop-blur-[16px]">
      <span className="font-jetbrains text-[9px] tracking-[0.15em] text-slate-400/70 uppercase whitespace-nowrap">
        Threat Level
      </span>
      
      <input 
        type="range" 
        min="0" max="100" 
        value={targetThreat}
        onChange={(e) => {
          setTargetThreat(parseInt(e.target.value));
          setAutoMode(false);
        }}
        className="w-[220px] h-1 rounded-full outline-none cursor-pointer appearance-none transition-colors duration-300"
        style={{
          background: `linear-gradient(90deg, rgb(34,197,94), rgb(101,163,13), rgb(163,230,53), rgb(234,179,8), rgb(249,115,22), rgb(239,68,68), rgb(185,28,28))`,
          '--thumb-color': colorStr
        }}
      />
      
      <span 
        className="font-orbitron text-[13px] font-bold min-w-[36px] text-right transition-colors duration-300"
        style={{ color: colorStr }}
      >
        {Math.round(targetThreat)}
      </span>
      
      <ActionButton 
        onClick={() => setAutoMode(!autoMode)}
        className={`px-3.5 py-1.5 rounded-lg text-[9px] ${
          autoMode 
            ? '!text-green-500 !border-green-500/30 !bg-green-500/10' 
            : ''
        }`}
      >
        {autoMode ? 'STOP AUTO' : 'AUTO SIMULATE'}
      </ActionButton>

      <style>{`
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          cursor: pointer;
          border: 2px solid rgba(255,255,255,0.3);
          background: var(--thumb-color);
          transition: background 2s ease;
        }
      `}</style>
    </div>
  );
}
