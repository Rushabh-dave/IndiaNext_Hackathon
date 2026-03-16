import { ShieldAlert, ShieldCheck } from 'lucide-react';
import { rgba } from '../utils/colors';
import logo from '../resources/logo.png';
import PrimaryButton from './buttons/PrimaryButton';

export default function Navbar({ col, bgR, bgG, bgB }) {
  const colAlpha = (a) => rgba(col, a);

  return (
    <div className="absolute top-0 left-0 right-0 h-[66px] flex items-center justify-between px-11 z-50">
      <div
        className="absolute inset-0 backdrop-blur-[24px] border-b transition-colors duration-300"
        style={{
          backgroundColor: `rgba(${bgR}, ${bgG}, ${bgB}, 0.55)`,
          borderBottomColor: colAlpha(0.15)
        }}
      />

      <div className="flex items-center gap-2.5 cursor-pointer z-10">
        <div className="relative w-[54px] h-[54px] flex items-center justify-center">
          <div
            className="absolute inset-[-8px] rounded-full pointer-events-none transition-all duration-300"
            style={{ backgroundImage: `radial-gradient(circle, ${colAlpha(0.3)} 0%, transparent 70%)` }}
          />
          <img src={logo} alt="PhishEye Logo" className="w-10 h-10 object-contain drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]" />
        </div>
        <div>
          <div className="font-inter text-[26px] font-bold leading-[1.1]">
            <span className="text-purple-300">Phish</span>
            <span className="text-white">Eye</span>
          </div>
          <div
            className="font-jetbrains text-[7.5px] tracking-[0.28em] uppercase transition-colors duration-300"
            style={{ color: colAlpha(0.6) }}
          >
            Cybersecurity Platform
          </div>
        </div>
      </div>

      <PrimaryButton 
        className="px-[26px] py-[11px] rounded-[11px] text-[10px] font-bold tracking-[0.12em] whitespace-nowrap z-10 sm:w-auto overflow-hidden text-white"
        colAlpha={colAlpha}
        style={{
          background: `linear-gradient(135deg, ${colAlpha(0.9)}, rgba(59,130,246,0.8))`,
          border: `1px solid rgba(167, 139, 250, 0.4)`
        }}
      >
        <ShieldCheck className="w-3.5 h-3.5 relative z-10" />
        <span className="relative z-10">LAUNCH PLATFORM</span>
      </PrimaryButton>

      <style>{`
        @keyframes sweep {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(220%); }
        }
      `}</style>
    </div>
  );
}
