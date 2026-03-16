import { motion } from 'framer-motion'
import { Mail, Globe, Brain } from 'lucide-react'

const features = [
  {
    icon: Mail,
    title: 'Phishing Email Detection',
    desc: 'Analyze suspicious emails for phishing indicators including sender spoofing, urgency language, and malicious link patterns.',
    color: 'text-cyber-warning',
    border: 'border-cyber-warning/20',
    bg: 'bg-cyber-warning/5',
    glow: 'hover:shadow-glow-yellow',
  },
  {
    icon: Globe,
    title: 'Malicious URL Scanner',
    desc: 'Instantly scan URLs for phishing domains, typosquatting, recently registered domains, and malicious redirects.',
    color: 'text-cyber-danger',
    border: 'border-cyber-danger/20',
    bg: 'bg-cyber-danger/5',
    glow: 'hover:shadow-glow-red',
  },
  {
    icon: Brain,
    title: 'AI Explainable Threat Detection',
    desc: 'Get detailed AI-powered explanations for every threat detected, with risk scores and recommended security actions.',
    color: 'text-cyber-accent',
    border: 'border-cyan-500/20',
    bg: 'bg-cyan-500/5',
    glow: 'hover:shadow-glow-cyan',
  },
]

export default function FeaturesSection() {
  return (
    <section className="relative z-10 py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyber-primary/20 bg-cyber-primary/5 mb-4">
            <span className="font-mono text-xs text-cyber-muted tracking-widest">CAPABILITIES</span>
          </div>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-white tracking-tight">
            THREAT DETECTION <span className="text-gradient-cyber">ARSENAL</span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {features.map((f, i) => {
            const Icon = f.icon
            return (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                whileHover={{ y: -8, scale: 1.02 }}
                className={`cyber-card border ${f.border} ${f.bg} ${f.glow} transition-all duration-300 cursor-default group`}
              >
                <div className={`w-12 h-12 rounded-xl border ${f.border} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                  <Icon className={`w-6 h-6 ${f.color}`} />
                </div>
                <h3 className={`font-display text-base font-bold tracking-wide mb-3 ${f.color}`}>
                  {f.title}
                </h3>
                <p className="font-body text-sm text-slate-400 leading-relaxed">{f.desc}</p>

                {/* Decorative corner */}
                <div className={`absolute top-4 right-4 w-6 h-6 border-t border-r ${f.border} opacity-50`} />
                <div className={`absolute bottom-4 left-4 w-4 h-4 border-b border-l ${f.border} opacity-30`} />
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
