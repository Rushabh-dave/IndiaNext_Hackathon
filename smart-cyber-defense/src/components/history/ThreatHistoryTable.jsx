import { motion } from 'framer-motion'
import { Globe, Mail, ChevronUp, ChevronDown, Minus } from 'lucide-react'

function RiskBadge({ score }) {
  if (score >= 60) return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono font-bold bg-cyber-danger/15 text-cyber-danger border border-cyber-danger/20">
      <span className="w-1.5 h-1.5 rounded-full bg-cyber-danger animate-pulse inline-block" />
      {score}
    </span>
  )
  if (score >= 30) return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono font-bold bg-cyber-warning/15 text-cyber-warning border border-cyber-warning/20">
      <span className="w-1.5 h-1.5 rounded-full bg-cyber-warning inline-block" />
      {score}
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono font-bold bg-cyber-primary/15 text-cyber-primary border border-cyber-primary/20">
      <span className="w-1.5 h-1.5 rounded-full bg-cyber-primary inline-block" />
      {score}
    </span>
  )
}

function TypeIcon({ type }) {
  return type === 'url'
    ? <Globe className="w-3.5 h-3.5 text-cyber-accent" />
    : <Mail className="w-3.5 h-3.5 text-cyber-warning" />
}

function formatDate(ts) {
  const d = new Date(ts)
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function ThreatHistoryTable({ data = [], loading }) {
  if (loading) {
    return (
      <div className="cyber-card">
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 rounded-lg bg-white/5 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="cyber-card overflow-hidden"
    >
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyber-primary to-transparent" />

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              <th className="text-left py-3 px-4 font-mono text-[10px] text-cyber-muted tracking-widest uppercase">Type</th>
              <th className="text-left py-3 px-4 font-mono text-[10px] text-cyber-muted tracking-widest uppercase">Threat</th>
              <th className="text-left py-3 px-4 font-mono text-[10px] text-cyber-muted tracking-widest uppercase">Risk</th>
              <th className="text-left py-3 px-4 font-mono text-[10px] text-cyber-muted tracking-widest uppercase">Confidence</th>
              <th className="text-left py-3 px-4 font-mono text-[10px] text-cyber-muted tracking-widest uppercase">Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <motion.tr
                key={row.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.07 }}
                className="border-b border-white/3 hover:bg-white/3 transition-colors group"
              >
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-2">
                    <TypeIcon type={row.input_type} />
                    <span className="font-mono text-xs text-slate-400 uppercase">{row.input_type}</span>
                  </div>
                </td>
                <td className="py-3.5 px-4">
                  <span className="font-body text-sm text-white font-semibold">{row.threat_type}</span>
                </td>
                <td className="py-3.5 px-4">
                  <RiskBadge score={row.risk_score} />
                </td>
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-cyber-accent"
                        style={{ width: `${(row.confidence || 0) * 100}%` }}
                      />
                    </div>
                    <span className="font-mono text-xs text-slate-400">
                      {row.confidence ? `${Math.round(row.confidence * 100)}%` : 'N/A'}
                    </span>
                  </div>
                </td>
                <td className="py-3.5 px-4">
                  <span className="font-mono text-xs text-cyber-muted">{formatDate(row.timestamp)}</span>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>

        {data.length === 0 && (
          <div className="text-center py-12 font-mono text-xs text-cyber-muted">
            No threat history found
          </div>
        )}
      </div>
    </motion.div>
  )
}
