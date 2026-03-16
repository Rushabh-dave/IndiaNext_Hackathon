import { motion } from 'framer-motion'
import { Shield, ShieldAlert, ShieldX, Activity } from 'lucide-react'

function getConfig(riskScore) {
  if (riskScore < 30) return {
    icon: Shield,
    color: 'text-cyber-primary',
    border: 'border-cyber-primary/30',
    bg: 'bg-cyber-primary/5',
    label: 'Low Risk',
  }
  if (riskScore < 60) return {
    icon: ShieldAlert,
    color: 'text-cyber-warning',
    border: 'border-cyber-warning/30',
    bg: 'bg-cyber-warning/5',
    label: 'Medium Risk',
  }
  return {
    icon: ShieldX,
    color: 'text-cyber-danger',
    border: 'border-cyber-danger/30',
    bg: 'bg-cyber-danger/5',
    label: 'High Risk',
  }
}

export default function ThreatSummaryCard({ threatType, riskScore, confidence }) {
  const config = getConfig(riskScore)
  const Icon = config.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className={`cyber-card border ${config.border} ${config.bg} relative overflow-hidden`}
    >
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, currentColor, transparent)` }} />

      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-xl border ${config.border} ${config.bg}`}>
          <Icon className={`w-6 h-6 ${config.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-mono text-xs text-cyber-muted tracking-widest uppercase mb-1">Threat Detected</div>
          <div className={`font-display text-lg font-bold ${config.color} tracking-wide`}>{threatType}</div>
          <div className={`inline-flex items-center gap-1.5 mt-1 px-2 py-0.5 rounded text-xs font-mono border ${config.border}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${config.color} animate-pulse`} style={{ background: 'currentColor' }} />
            <span className={config.color}>{config.label}</span>
          </div>
        </div>
      </div>

      {/* Confidence meter */}
      <div className="mt-5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-cyber-muted" />
            <span className="font-mono text-xs text-cyber-muted">AI Confidence</span>
          </div>
          <span className={`font-display text-sm font-bold ${config.color}`}>
            {Math.round(confidence * 100)}%
          </span>
        </div>
        <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${confidence * 100}%` }}
            transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
            className="h-full rounded-full"
            style={{ background: config.color === 'text-cyber-primary' ? '#22c55e' : config.color === 'text-cyber-warning' ? '#facc15' : '#ef4444' }}
          />
        </div>
      </div>
    </motion.div>
  )
}
