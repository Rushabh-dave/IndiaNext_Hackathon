import { Activity, TrendingUp, TrendingDown, Target, Zap } from 'lucide-react';

export default function TemporalMetricsGrid({ features = {} }) {
  const velocity = features.velocity ?? 0;
  const severityTrend = features.severity_trend ?? 0;
  const killChainDepth = (features.kill_chain_depth ?? 0) * 100;
  const uniqueTechniques = Math.round((features.unique_techniques ?? 0) * 6); // Scaling for display

  const metrics = [
    {
      label: 'Threat Velocity',
      value: `${velocity.toFixed(2)}`,
      sub: 'alerts/min',
      icon: Zap,
      color: 'text-yellow-400',
      bg: 'bg-yellow-400/10',
    },
    {
      label: 'Severity Trend',
      value: severityTrend >= 0 ? 'Rising' : 'Stable',
      sub: `${severityTrend >= 0 ? '+' : ''}${(severityTrend * 100).toFixed(0)}%`,
      icon: severityTrend >= 0 ? TrendingUp : TrendingDown,
      color: severityTrend >= 0 ? 'text-red-400' : 'text-green-400',
      bg: severityTrend >= 0 ? 'bg-red-400/10' : 'bg-green-400/10',
    },
    {
      label: 'Kill-Chain Depth',
      value: `${killChainDepth.toFixed(0)}%`,
      sub: 'progression',
      icon: Target,
      color: 'text-[#3b82f6]',
      bg: 'bg-[#3b82f6]/10',
    },
    {
      label: 'Active Targets',
      value: uniqueTechniques,
      sub: 'techniques',
      icon: Activity,
      color: 'text-purple-400',
      bg: 'bg-purple-400/10',
    }
  ];

  return (
    <div className="grid grid-cols-2 gap-4">
      {metrics.map((m, idx) => (
        <div key={idx} className="bg-[#0f0a26]/60 backdrop-blur-xl border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
          <div className={`w-10 h-10 rounded-xl ${m.bg} ${m.color} flex items-center justify-center mb-3`}>
            <m.icon className="w-5 h-5" />
          </div>
          <div className="font-jetbrains text-[9px] text-slate-500 uppercase tracking-widest mb-1">{m.label}</div>
          <div className={`font-orbitron font-bold text-lg ${m.color}`}>{m.value}</div>
          <div className="font-jetbrains text-[9px] text-slate-600 tracking-wider mt-1">{m.sub}</div>
        </div>
      ))}
    </div>
  );
}
