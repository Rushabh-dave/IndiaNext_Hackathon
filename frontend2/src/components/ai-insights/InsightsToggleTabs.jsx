export default function InsightsToggleTabs({ activeTab, setActiveTab }) {
  return (
    <div className="flex bg-[#0f172a] border border-white/10 p-1.5 rounded-xl w-full max-w-md mx-auto relative z-10 shadow-lg mb-8">
      <button
        onClick={() => setActiveTab('user')}
        className={`flex-1 relative rounded-lg py-2.5 text-[12px] font-jetbrains uppercase tracking-widest font-bold transition-colors ${
          activeTab === 'user' ? 'text-white' : 'text-slate-500 hover:text-slate-300'
        }`}
      >
        {activeTab === 'user' && (
          <div className="absolute inset-0 bg-[#7c3aed]/20 border border-[#7c3aed]/40 rounded-lg shadow-[0_0_15px_rgba(124,58,237,0.2)]" />
        )}
        <span className="relative z-10 hidden sm:inline">Defensive Explanation</span>
        <span className="relative z-10 sm:hidden">User View</span>
      </button>

      <button
        onClick={() => setActiveTab('attacker')}
        className={`flex-1 relative rounded-lg py-2.5 text-[12px] font-jetbrains uppercase tracking-widest font-bold transition-colors ${
          activeTab === 'attacker' ? 'text-[#e24b4a]' : 'text-slate-500 hover:text-slate-300'
        }`}
      >
        {activeTab === 'attacker' && (
          <div className="absolute inset-0 bg-[#e24b4a]/10 border border-[#e24b4a]/40 rounded-lg shadow-[0_0_15px_rgba(226,75,74,0.15)]" />
        )}
        <span className="relative z-10 hidden sm:inline">Attacker Intelligence</span>
        <span className="relative z-10 sm:hidden">Threat Intel</span>
      </button>
    </div>
  );
}
