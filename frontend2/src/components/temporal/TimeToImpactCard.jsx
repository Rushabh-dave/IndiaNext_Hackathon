import { Hourglass, Zap, ShieldQuestion } from 'lucide-react';

export default function TimeToImpactCard({ data = {} }) {
  const { estimate_minutes = null, confidence = 'low', basis = 'insufficient data' } = data;

  const isLowConfidence = confidence === 'low';
  
  return (
    <div className="bg-[#0f0a26]/60 backdrop-blur-xl border border-white/10 rounded-[20px] p-6 shadow-xl overflow-hidden relative group">
      <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-red-500/5 blur-2xl group-hover:bg-red-500/10 transition-all" />
      
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-orbitron font-bold text-[13px] text-red-400 uppercase tracking-[0.2em] flex items-center gap-2">
          <Hourglass className="w-5 h-5" /> Time to Impact
        </h3>
        <div className={`font-jetbrains text-[9px] px-2 py-0.5 rounded border uppercase tracking-widest ${
          isLowConfidence ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'
        }`}>
          {confidence} Confidence
        </div>
      </div>

      <div className="flex items-baseline gap-2 mb-2">
        <span className="font-orbitron font-bold text-3xl text-white">
          {estimate_minutes !== null ? estimate_minutes : '??'}
        </span>
        <span className="font-jetbrains text-slate-500 text-[12px] uppercase tracking-widest">
          {estimate_minutes === 1 ? 'Minute' : 'Minutes'}
        </span>
      </div>

      <div className="flex items-start gap-2 mt-4 pt-4 border-t border-white/5">
        <ShieldQuestion className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
        <p className="font-inter text-[11px] text-slate-400 leading-relaxed italic">
          Basis: {basis}
        </p>
      </div>

      {estimate_minutes !== null && (
        <div className="absolute top-0 right-0 p-2">
           <Zap className="w-4 h-4 text-yellow-400 animate-pulse" />
        </div>
      )}
    </div>
  );
}
