import { ShieldAlert, Globe, Mail, Mic, Image as ImageIcon, Bot, Shield } from 'lucide-react';

// Map alert_type from backend → display label + icon + color
const TYPE_META = {
  phishing:         { label: 'EMAIL',   Icon: Mail,       color: '#f59e0b' },
  url:              { label: 'URL',     Icon: Globe,      color: '#0ea5e9' },
  deepfake:         { label: 'IMAGE',   Icon: ImageIcon,  color: '#ec4899' },
  audio_deepfake:   { label: 'AUDIO',   Icon: Mic,        color: '#14b8a6' },
  prompt_injection: { label: 'PROMPT',  Icon: Bot,        color: '#d946ef' },
};

const SEVERITY_COLORS = {
  CRITICAL: { color: '#ef4444', bg: 'bg-red-500/10 border-red-500/20' },
  HIGH:     { color: '#f97316', bg: 'bg-orange-500/10 border-orange-500/20' },
  MEDIUM:   { color: '#f59e0b', bg: 'bg-yellow-500/10 border-yellow-500/20' },
  LOW:      { color: '#22c55e', bg: 'bg-green-500/10 border-green-500/20' },
};

function formatTime(isoString) {
  try {
    return new Date(isoString).toLocaleString('en-IN', {
      month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return isoString || '—'; }
}

export default function ThreatHistoryTable({ alerts = [], loading = false }) {
  if (loading) {
    return (
      <div className="w-full bg-[#0f172a]/60 backdrop-blur-lg border border-white/10 rounded-xl p-12 text-center">
        <div className="font-jetbrains text-[12px] text-slate-500 tracking-widest animate-pulse uppercase">
          Loading alerts from AEGIS backend…
        </div>
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="w-full bg-[#0f172a]/60 backdrop-blur-lg border border-white/10 rounded-xl p-12 text-center">
        <Shield className="w-12 h-12 text-slate-600 mx-auto mb-4" />
        <div className="font-orbitron text-[14px] text-slate-400 tracking-widest uppercase mb-2">No Alerts Yet</div>
        <div className="font-jetbrains text-[11px] text-slate-600 tracking-wide">
          Run a scan from the Threat Detection page — threats will appear here automatically.
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#0f172a]/60 backdrop-blur-lg border border-white/10 rounded-xl overflow-hidden shadow-2xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10 uppercase font-jetbrains text-[9px] tracking-[0.2em] text-slate-500 bg-white/5">
              <th className="px-6 py-4 font-bold">#</th>
              <th className="px-6 py-4 font-bold">TYPE</th>
              <th className="px-6 py-4 font-bold">THREAT / MITRE</th>
              <th className="px-6 py-4 font-bold text-center">RISK SCORE</th>
              <th className="px-6 py-4 font-bold">SEVERITY</th>
              <th className="px-6 py-4 font-bold text-right">TIMESTAMP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {[...alerts].reverse().map((alert) => {
              const meta = TYPE_META[alert.alert_type] || { label: alert.alert_type?.toUpperCase(), Icon: ShieldAlert, color: '#64748b' };
              const sev  = SEVERITY_COLORS[alert.severity] || SEVERITY_COLORS.LOW;
              const riskPct = Math.round((alert.threat_score ?? 0) * 100);

              return (
                <tr key={alert.id} className="hover:bg-white/5 transition-colors group">
                  {/* ID */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-jetbrains text-[10px] text-slate-600">#{alert.id}</span>
                  </td>

                  {/* TYPE */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-jetbrains text-[10px] tracking-widest font-bold uppercase flex items-center gap-2" style={{ color: meta.color }}>
                      <meta.Icon className="w-3.5 h-3.5" />
                      {meta.label}
                    </span>
                  </td>

                  {/* THREAT */}
                  <td className="px-6 py-4">
                    <div className="font-inter text-[13px] text-slate-200 font-medium tracking-wide">
                      {alert.alert_type?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} Detected
                    </div>
                    {alert.mitre_technique && (
                      <div className="font-jetbrains text-[9px] text-orange-400/70 mt-0.5 tracking-wide">{alert.mitre_technique}</div>
                    )}
                  </td>

                  {/* RISK SCORE */}
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className={`inline-flex items-center justify-center border rounded px-2.5 py-1 ${sev.bg}`}>
                      <div className="w-1.5 h-1.5 rounded-full mr-2" style={{ backgroundColor: sev.color, boxShadow: `0 0 6px ${sev.color}` }} />
                      <span className="font-jetbrains text-[10px] font-bold" style={{ color: sev.color }}>{riskPct}</span>
                    </div>
                  </td>

                  {/* SEVERITY */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-jetbrains text-[10px] uppercase tracking-widest font-bold" style={{ color: sev.color }}>
                      {alert.severity}
                    </span>
                  </td>

                  {/* TIMESTAMP */}
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <span className="font-jetbrains text-[11px] text-slate-500 tracking-wider group-hover:text-slate-400 transition-colors">
                      {formatTime(alert.timestamp_iso)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
