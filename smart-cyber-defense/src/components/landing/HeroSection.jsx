import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowRight, Shield, Zap } from 'lucide-react'

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.3 },
  },
}

const item = {
  hidden: { y: 30, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { duration: 0.6, ease: 'easeOut' } },
}

export default function HeroSection() {
  return (
    <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 text-center">
      <motion.div variants={container} initial="hidden" animate="show" className="max-w-4xl">
        {/* Badge */}
        <motion.div variants={item} className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-cyber-primary/30 bg-cyber-primary/10 mb-8">
          <Zap className="w-3.5 h-3.5 text-cyber-primary" />
          <span className="font-mono text-xs text-cyber-primary tracking-widest">AI-POWERED THREAT DETECTION</span>
          <div className="w-1.5 h-1.5 rounded-full bg-cyber-primary animate-pulse" />
        </motion.div>

        {/* Main title */}
        <motion.h1 variants={item} className="font-display text-5xl md:text-7xl font-black mb-6 leading-tight tracking-tight">
          <span className="text-white">SMART</span>
          <br />
          <span className="text-gradient-cyber">CYBER DEFENSE</span>
          <br />
          <span className="text-white">PLATFORM</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p variants={item} className="font-body text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          Detect <span className="text-cyber-primary font-semibold">phishing emails</span> and{' '}
          <span className="text-cyber-accent font-semibold">malicious URLs</span> using AI-powered cybersecurity analysis.
          Real-time threat intelligence at your fingertips.
        </motion.p>

        {/* CTA buttons */}
        <motion.div variants={item} className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/scanner">
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: '0 0 40px rgba(34, 197, 94, 0.5)' }}
              whileTap={{ scale: 0.95 }}
              className="cyber-btn flex items-center gap-3 text-base px-8 py-4"
            >
              <Shield className="w-5 h-5" />
              Start Threat Scan
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          </Link>

          <Link to="/dashboard">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="cyber-btn-outline flex items-center gap-3 text-base px-8 py-4"
            >
              View Dashboard
            </motion.button>
          </Link>
        </motion.div>

        {/* Stats row */}
        <motion.div variants={item} className="mt-16 grid grid-cols-3 gap-6 max-w-lg mx-auto">
          {[
            { value: '99.7%', label: 'Detection Rate' },
            { value: '<2s', label: 'Scan Speed' },
            { value: '24/7', label: 'Monitoring' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="font-display text-2xl font-bold text-cyber-primary">{stat.value}</div>
              <div className="font-mono text-xs text-cyber-muted mt-1">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <div className="font-mono text-xs text-cyber-muted tracking-widest">SCROLL</div>
        <div className="w-px h-8 bg-gradient-to-b from-cyber-primary to-transparent" />
      </motion.div>
    </div>
  )
}
