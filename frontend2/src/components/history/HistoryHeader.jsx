import { RefreshCw } from 'lucide-react';
import ActionButton from '../buttons/ActionButton';

export default function HistoryHeader() {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 pb-6 border-b border-white/5 space-y-4 md:space-y-0">
      <div>
        <h1 className="font-orbitron font-bold text-[28px] tracking-wide text-white flex items-center gap-3 uppercase">
          Threat <span className="text-[#1d9e75]">History</span>
        </h1>
        <p className="font-jetbrains text-[11px] text-slate-500 uppercase tracking-widest mt-1">
          Complete audit log of all threat scans
        </p>
      </div>
      <div>
        <ActionButton 
          className="px-5 py-2.5 rounded-lg text-[11px] text-[#1d9e75] border border-[#1d9e75]/30 bg-[#1d9e75]/10 hover:bg-[#1d9e75]/20 hover:border-[#1d9e75]/50 flex items-center gap-2"
          onClick={() => window.location.reload()}
        >
          <RefreshCw className="w-3.5 h-3.5" /> REFRESH
        </ActionButton>
      </div>
    </div>
  );
}
