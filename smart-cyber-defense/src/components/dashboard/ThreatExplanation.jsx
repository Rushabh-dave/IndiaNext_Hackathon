import { motion } from 'framer-motion'
import { AlertCircle, ChevronRight } from 'lucide-react'

export default function ThreatExplanation({ explanations = [] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="cyber-card relative overflow-hidden"
    >
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyber-accent to-transparent" />

      <div className="flex items-center gap-2 mb-5">
        <AlertCircle className="w-4 h-4 text-cyber-accent" />
        <span className="font-display text-sm font-bold tracking-widest text-cyber-accent uppercase">
          Threat Indicators
        </span>
        <div className="ml-auto font-mono text-xs bg-cyber-accent/10 text-cyber-accent border border-cyan-500/20 px-2 py-0.5 rounded">
          {explanations.length} found
        </div>
      </div>

      <div className="space-y-3">
        {explanations.map((explanation, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + i * 0.1 }}
            className="flex items-start gap-3 p-3 rounded-lg bg-cyber-accent/5 border border-cyan-500/10 group hover:border-cyan-500/30 transition-all"
          >
            <div className="w-6 h-6 rounded-full bg-cyber-accent/20 border border-cyan-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="font-mono text-[10px] font-bold text-cyber-accent">{i + 1}</span>
            </div>
            <span className="font-body text-sm text-slate-300 flex-1 leading-snug">{explanation}</span>
            <ChevronRight className="w-3.5 h-3.5 text-cyber-muted opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5" />
          </motion.div>
        ))}

        {explanations.length === 0 && (
          <div className="text-center py-6 font-mono text-xs text-cyber-muted">
            No threat indicators found
          </div>
        )}
      </div>
    </motion.div>
  )
}
