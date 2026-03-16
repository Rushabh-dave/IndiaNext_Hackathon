import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Navbar from '../components/layout/Navbar'
import Sidebar from '../components/layout/Sidebar'
import ThreatTypeTabs from '../components/scanner/ThreatTypeTabs'
import URLScanner from '../components/scanner/URLScanner'
import EmailScanner from '../components/scanner/EmailScanner'
import ThreatInputCard from '../components/scanner/ThreatInputCard'
import CyberNetworkScene from '../components/three/CyberNetworkScene'
import { Shield, Zap, Activity, Lock } from 'lucide-react'

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3 } },
}

const stats = [
  { icon: Activity, label: 'Threats Detected', value: '1,247', color: 'text-cyber-danger' },
  { icon: Shield, label: 'URLs Scanned', value: '8,432', color: 'text-cyber-primary' },
  { icon: Zap, label: 'Avg Scan Time', value: '1.8s', color: 'text-cyber-accent' },
  { icon: Lock, label: 'Accuracy Rate', value: '99.7%', color: 'text-cyber-warning' },
]

export default function ThreatScanner() {
  const [activeTab, setActiveTab] = useState('url')

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="min-h-screen bg-cyber-bg"
    >
      <Navbar />
      <Sidebar />

      {/* Main content */}
      <div className="ml-60 pt-16">
        {/* Header with Three.js */}
        <div className="relative h-48 overflow-hidden border-b border-cyber-primary/10">
          <CyberNetworkScene height="100%" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-cyber-bg" />
          <div className="relative z-10 flex items-end pb-6 px-8 h-full">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full bg-cyber-primary animate-pulse" />
                <span className="font-mono text-xs text-cyber-muted tracking-widest">SCANNING SYSTEM ACTIVE</span>
              </div>
              <h1 className="font-display text-2xl font-black text-white tracking-tight">
                THREAT <span className="text-cyber-primary">SCANNER</span>
              </h1>
            </div>

            {/* Live stats row */}
            <div className="ml-auto flex items-center gap-4">
              {stats.map((s) => {
                const Icon = s.icon
                return (
                  <div key={s.label} className="text-right hidden lg:block">
                    <div className={`font-display text-lg font-bold ${s.color}`}>{s.value}</div>
                    <div className="font-mono text-[10px] text-cyber-muted">{s.label}</div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Scanner area */}
        <div className="p-8">
          <div className="max-w-2xl mx-auto space-y-6">
            {/* Tabs */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <ThreatTypeTabs activeTab={activeTab} onTabChange={setActiveTab} />
            </motion.div>

            {/* Scanner card */}
            <ThreatInputCard>
              <AnimatePresence mode="wait">
                {activeTab === 'url' ? (
                  <URLScanner key="url" />
                ) : (
                  <EmailScanner key="email" />
                )}
              </AnimatePresence>
            </ThreatInputCard>

            {/* Security notice */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex items-center gap-3 px-4 py-3 rounded-lg bg-cyber-primary/5 border border-cyber-primary/10"
            >
              <Lock className="w-4 h-4 text-cyber-primary flex-shrink-0" />
              <p className="font-mono text-xs text-cyber-muted">
                All scans are processed securely. No data is stored without your consent.
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
