import { motion } from 'framer-motion'
import { ShieldOff, Ban, Flag, CheckCircle2 } from 'lucide-react'

const actionIcons = {
  'do not': ShieldOff,
  'block': Ban,
  'report': Flag,
  'default': CheckCircle2,
}

function getIcon(action) {
  const lower = action.toLowerCase()
  for (const [key, Icon] of Object.entries(actionIcons)) {
    if (lower.includes(key)) return Icon
  }
  return actionIcons.default
}

export default function RecommendedAction({ action, riskScore }) {
  const Icon = getIcon(action || '')
  const isHigh = riskScore >= 60
  const isMed = riskScore >= 30 && riskScore < 60

  const color = isHigh ? 'text-cyber-danger' : isMed ? 'text-cyber-warning' : 'text-cyber-primary'
  const border = isHigh ? 'border-cyber-danger/30' : isMed ? 'border-cyber-warning/30' : 'border-cyber-primary/30'
  const bg = isHigh ? 'bg-cyber-danger/5' : isMed ? 'bg-cyber-warning/5' : 'bg-cyber-primary/5'
  const gradFrom = isHigh ? 'rgba(239,68,68,0.15)' : isMed ? 'rgba(250,204,21,0.15)' : 'rgba(34,197,94,0.15)'

  const quickActions = isHigh
    ? ['Do not click the link', 'Block sender', 'Report phishing attempt', 'Alert IT security team']
    : isMed
    ? ['Verify sender identity', 'Avoid clicking links', 'Check URL manually']
    : ['Proceed with caution', 'Verify before interacting']

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className={`cyber-card border ${border} ${bg} relative overflow-hidden`}
    >
      {/* Glow bg */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at top left, ${gradFrom}, transparent 70%)` }}
      />

      <div className="relative">
        <div className="flex items-center gap-2 mb-4">
          <Icon className={`w-4 h-4 ${color}`} />
          <span className={`font-display text-sm font-bold tracking-widest uppercase ${color}`}>
            Recommended Action
          </span>
        </div>

        {/* Main action */}
        <div className={`p-4 rounded-xl border ${border} ${bg} mb-4`}>
          <p className="font-body text-base text-white font-semibold leading-snug">{action}</p>
        </div>

        {/* Quick action checklist */}
        <div className="space-y-2">
          <div className="font-mono text-xs text-cyber-muted uppercase tracking-widest mb-3">Action Checklist</div>
          {quickActions.map((a, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + i * 0.08 }}
              className="flex items-center gap-3"
            >
              <div className={`w-4 h-4 rounded border ${border} flex items-center justify-center flex-shrink-0`}>
                <div className={`w-2 h-2 rounded-sm ${isHigh ? 'bg-cyber-danger' : isMed ? 'bg-cyber-warning' : 'bg-cyber-primary'}`} />
              </div>
              <span className="font-body text-sm text-slate-300">{a}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
