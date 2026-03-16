import { Clock, ExternalLink, ShieldAlert, Globe, Mail } from 'lucide-react';

export default function TemporalTimeline({ timeline = [] }) {
  if (!timeline || timeline.length === 0) {
    return (
      <div className="bg-black/20 border border-white/5 rounded-xl p-8 text-center">
        <Clock className="w-8 h-8 text-slate-700 mx-auto mb-3 opacity-50" />
        <p className="font-jetbrains text-[11px] text-slate-500 uppercase tracking-widest">No alerts in window</p>
      </div>
    );
  }

  const getTypeIcon = (type) => {
    if (type?.toLowerCase().includes('url')) return Globe;
    if (type?.toLowerCase().includes('phish')) return Mail;
    return ShieldAlert;
  };

  return (
    <div className="bg-[#0f0a26]/60 backdrop-blur-xl border border-white/10 rounded-[20px] p-6 shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-orbitron font-bold text-[14px] text-purple-400 uppercase tracking-[0.2em] flex items-center gap-2">
          <Clock className="w-5 h-5" /> Temporal Timeline
        </h3>
        <span className="font-jetbrains text-[10px] text-slate-500 uppercase tracking-widest">Last 300s</span>
      </div>

      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
        {timeline.map((alert, idx) => {
          const Icon = getTypeIcon(alert.alert_type);
          const timeStr = new Date(alert.timestamp_iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

          return (
            <div key={alert.id || idx} className="bg-black/40 border border-white/5 rounded-xl p-4 hover:border-purple-500/30 transition-all group flex items-start gap-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                alert.severity === 'CRITICAL' ? 'bg-red-500/10 text-red-400' :
                alert.severity === 'HIGH' ? 'bg-orange-500/10 text-orange-400' :
                'bg-blue-500/10 text-blue-400'
              }`}>
                <Icon className="w-5 h-5" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1">
                  <span className="font-jetbrains text-[10px] text-slate-500 uppercase tracking-widest">{timeStr}</span>
                  <span className={`font-jetbrains text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                    alert.severity === 'CRITICAL' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                    'bg-slate-800 text-slate-400 border-white/5'
                  }`}>
                    {alert.severity}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-inter text-[13px] text-slate-200 font-medium truncate uppercase tracking-tight">
                    {alert.alert_type.replace('_', ' ')} Detected
                  </span>
                  <span className="text-slate-600 font-jetbrains text-[10px]">({(alert.threat_score * 100).toFixed(0)}%)</span>
                </div>
                <p className="font-inter text-[11px] text-slate-500 mt-1 line-clamp-1 italic opacity-0 group-hover:opacity-100 transition-opacity">
                  {alert.mitre ? `MITRE: ${alert.mitre}` : 'Anomalous behavior detected'}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
