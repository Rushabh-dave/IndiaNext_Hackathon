import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate, Link } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import Sidebar from '../components/layout/Sidebar'
import RiskScoreMeter from '../components/dashboard/RiskScoreMeter'
import ThreatSummaryCard from '../components/dashboard/ThreatSummaryCard'
import ThreatExplanation from '../components/dashboard/ThreatExplanation'
import RecommendedAction from '../components/dashboard/RecommendedAction'
import { ArrowLeft, Scan, Globe, Mail, RefreshCw } from 'lucide-react'

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3 } },
}

// Demo data for when no scan result exists
const demoResult = {
  inputType: 'url',
  input: 'http://paypal-login-security.xyz',
  threat_type: 'Phishing URL',
  risk_score: 87,
  confidence: 0.91,
  explanation: [
    'Suspicious domain detected — brand impersonation pattern',
    'Recently registered domain (< 7 days old)',
    'No valid SSL certificate found',
    'Domain mimics a trusted financial brand',
  ],
  recommended_action: 'Do not open this link. Report it to your security team immediately.',
}

export default function Dashboard() {
  const [result, setResult] = useState(null)

  useEffect(() => {
    const stored = sessionStorage.getItem('scanResult')
    if (stored) {
      try {
        setResult(JSON.parse(stored))
      } catch {
        setResult(demoResult)
      }
    } else {
      setResult(demoResult)
    }
  }, [])

  if (!result) return null

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

      <div className="ml-60 pt-16 p-8">
        <div className="max-w-6xl mx-auto">

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between mb-8"
          >
            <div>
              <div className="flex items-center gap-3 mb-1">
                <Link to="/scanner">
                  <motion.button
                    whileHover={{ x: -2 }}
                    className="flex items-center gap-1.5 font-mono text-xs text-cyber-muted hover:text-white transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back to Scanner
                  </motion.button>
                </Link>
              </div>
              <h1 className="font-display text-2xl font-black text-white tracking-tight">
                CYBER RISK <span className="text-cyber-primary">DASHBOARD</span>
              </h1>
              <div className="flex items-center gap-2 mt-1">
                {result.inputType === 'url' ? (
                  <Globe className="w-3.5 h-3.5 text-cyber-accent" />
                ) : (
                  <Mail className="w-3.5 h-3.5 text-cyber-warning" />
                )}
                <span className="font-mono text-xs text-cyber-muted truncate max-w-sm">{result.input}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link to="/scanner">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="cyber-btn-outline flex items-center gap-2 py-2 px-4 text-xs"
                >
                  <Scan className="w-3.5 h-3.5" />
                  New Scan
                </motion.button>
              </Link>
            </div>
          </motion.div>

          {/* Main grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Left: Risk Meter */}
            <div className="space-y-6">
              <RiskScoreMeter score={result.risk_score} />

              {/* Input details card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="cyber-card"
              >
                <div className="font-mono text-xs text-cyber-muted tracking-widest uppercase mb-4">Scan Details</div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-cyber-muted">Input Type</span>
                    <span className="font-mono text-xs text-white uppercase">{result.inputType}</span>
                  </div>
                  <div className="h-px bg-white/5" />
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-cyber-muted">Scan Time</span>
                    <span className="font-mono text-xs text-cyber-primary">1.84s</span>
                  </div>
                  <div className="h-px bg-white/5" />
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-cyber-muted">Model</span>
                    <span className="font-mono text-xs text-white">AI v2.1</span>
                  </div>
                  <div className="h-px bg-white/5" />
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-cyber-muted">Indicators</span>
                    <span className="font-mono text-xs text-cyber-accent">{result.explanation?.length || 0} found</span>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Right: Main panels */}
            <div className="lg:col-span-2 space-y-6">
              <ThreatSummaryCard
                threatType={result.threat_type}
                riskScore={result.risk_score}
                confidence={result.confidence}
              />
              <ThreatExplanation explanations={result.explanation} />
              <RecommendedAction action={result.recommended_action} riskScore={result.risk_score} />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
