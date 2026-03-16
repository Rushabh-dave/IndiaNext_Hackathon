import { rgba } from '../../utils/colors';
import { Target, ScanLine } from 'lucide-react';
import PrimaryButton from '../buttons/PrimaryButton';
import SecondaryButton from '../buttons/SecondaryButton';

export default function HeroSection({ tNorm, col, colorStr, bgR, bgG, bgB }) {
  const colAlpha = (a) => rgba(col, a);

  return (
    <div className="flex flex-col items-center z-20">
      <div
        className="inline-flex items-center gap-2 px-[18px] py-1.5 rounded-full mb-[22px] border transition-all duration-300 animate-[fadein_0.7s_ease_0.1s_both]"
        style={{ background: colAlpha(0.1), borderColor: colAlpha(0.32) }}
      >
        <div className="w-[7px] h-[7px] rounded-full animate-[blink_2s_infinite]" style={{ backgroundColor: colorStr, boxShadow: `0 0 12px ${colorStr}` }} />
        <span className="font-jetbrains text-[10px] tracking-[0.18em] uppercase transition-colors duration-300" style={{ color: colAlpha(0.9) }}>
          AI-Powered Threat Detection
        </span>
        <div className="w-[7px] h-[7px] rounded-full animate-[blink_2s_infinite]" style={{ backgroundColor: colorStr, boxShadow: `0 0 12px ${colorStr}`, animationDelay: '0.9s' }} />
      </div>

      <div className="font-orbitron font-black leading-[1.05] mb-2 tracking-[-0.025em] text-center">
        <span className="block text-[clamp(24px,4vw,54px)] text-slate-50 animate-[revealUp_0.9s_cubic-bezier(0.22,1,0.36,1)_0.15s_both]">SMART CYBER</span>
        <span
          className="block text-[clamp(24px,4vw,54px)] animate-[revealUp_0.9s_cubic-bezier(0.22,1,0.36,1)_0.25s_both] transition-all duration-300 bg-clip-text text-transparent bg-[length:300%]"
          style={{ backgroundImage: `linear-gradient(135deg, ${rgba({ r: 196, g: 181, b: 253 }, 1)} 0%, ${colorStr} 40%, rgba(59,130,246,1) 100%)` }}
        >DEFENSE</span>
        <span className="block text-[clamp(24px,4vw,54px)] text-slate-50 animate-[revealUp_0.9s_cubic-bezier(0.22,1,0.36,1)_0.35s_both]">PLATFORM</span>
      </div>

      <p className="text-[14.5px] text-slate-400/80 max-w-[540px] leading-[1.85] my-4 mb-[26px] animate-[fadein_0.8s_ease_0.55s_both]">
        Detect <em className="not-italic font-medium transition-colors duration-300" style={{ color: colAlpha(0.92) }}>phishing emails</em>,{' '}
        <em className="not-italic font-medium transition-colors duration-300" style={{ color: colAlpha(0.92) }}>malicious URLs</em>,{' '}
        <em className="not-italic font-medium transition-colors duration-300" style={{ color: colAlpha(0.92) }}>deepfakes</em> &amp;{' '}
        <em className="not-italic font-medium transition-colors duration-300" style={{ color: colAlpha(0.92) }}>prompt injection attacks</em><br />
        using advanced AI cybersecurity analysis. Real-time threat intelligence at your fingertips.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center mb-[30px] animate-[fadein_0.8s_ease_0.7s_both] w-full px-6 sm:px-0 z-50 relative">
        <PrimaryButton 
          as="Link"
          to="/threat-detection"
          colorStr={colorStr}
          colAlpha={colAlpha}
        >
          <Target className="w-4 h-4 relative z-10" />
          <span className="relative z-10">START THREAT SCAN</span>
        </PrimaryButton>

        <SecondaryButton 
          as="Link"
          to="/dashboard"
          colAlpha={colAlpha}
        >
          <ScanLine className="w-4 h-4" />
          VIEW DASHBOARD
        </SecondaryButton>
      </div>

      <div
        className="flex rounded-[16px] overflow-hidden backdrop-blur-[20px] transition-all duration-300 border animate-[fadein_0.8s_ease_0.85s_both]"
        style={{ borderColor: colAlpha(0.2), background: `rgba(${bgR}, ${bgG}, ${bgB}, 0.65)`, boxShadow: `0 0 40px ${colAlpha(0.1)}, inset 0 1px 0 ${colAlpha(0.08)}` }}
      >
        <div className="px-[30px] py-4 text-center transition-colors duration-300">
          <div className="font-orbitron text-[22px] font-extrabold leading-none mb-1 transition-colors duration-300" style={{ color: colorStr }}>99.8%</div>
          <div className="font-jetbrains text-[8.5px] tracking-[0.15em] text-slate-500/90 uppercase">Detection Rate</div>
        </div>
        <div className="px-[30px] py-4 text-center transition-colors duration-300 border-l" style={{ borderLeftColor: colAlpha(0.15) }}>
          <div className="font-orbitron text-[22px] font-extrabold leading-none mb-1 text-cyan-400">&lt;2s</div>
          <div className="font-jetbrains text-[8.5px] tracking-[0.15em] text-slate-500/90 uppercase">Scan Speed</div>
        </div>
        <div className="px-[30px] py-4 text-center transition-colors duration-300 border-l" style={{ borderLeftColor: colAlpha(0.15) }}>
          <div className="font-orbitron text-[22px] font-extrabold leading-none mb-1 text-green-400">24/7</div>
          <div className="font-jetbrains text-[8.5px] tracking-[0.15em] text-slate-500/90 uppercase">AI Monitoring</div>
        </div>
      </div>

      <style>{`
        @keyframes fadein {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes revealUp {
          from { opacity: 0; transform: translateY(44px); filter: blur(8px); }
          to { opacity: 1; transform: translateY(0); filter: blur(0); }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.15; }
        }
      `}</style>
    </div>
  );
}
