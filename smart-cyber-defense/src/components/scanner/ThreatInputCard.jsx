import { motion } from 'framer-motion'

export default function ThreatInputCard({ children, title }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="cyber-card relative overflow-hidden"
    >
      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyber-primary to-transparent" />

      {title && (
        <h3 className="font-display text-sm font-bold tracking-widest text-cyber-primary uppercase mb-6">
          {title}
        </h3>
      )}

      {children}
    </motion.div>
  )
}
