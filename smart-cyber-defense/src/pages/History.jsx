import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Navbar from '../components/layout/Navbar'
import Sidebar from '../components/layout/Sidebar'
import ThreatHistoryTable from '../components/history/ThreatHistoryTable'
import { mockGetHistory } from '../services/api'
import { Clock, RefreshCw, ShieldAlert, Globe, Mail, TrendingUp } from 'lucide-react'

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  exit: { opacity: 0, y: -20 },
}

export default function History() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchHistory = async () => {
    setLoading(true)
    setError('')
    try {
      const result = await mockGetHistory()
      setData(result)
    } catch {
      setError('Failed to load threat history.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchHistory() }, [])

  const urlCount = data.filter(d => d.input_type === 'url').length
  const emailCount = data.filter(d => d.input_type === 'email').length
  const highRisk = data.filter(d => d.risk_score >= 60).length
  const avgRisk = data.length ? Math.round(data.reduce((s, d) => s + d.risk_score, 0) / data.length) : 0

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
              <h1 className="font-display text-2xl font-black text-white tracking-tight">
                THREAT <span className="text-cyber-primary">HISTORY</span>
              </h1>
              <p className="font-mono text-xs text-cyber-muted mt-1">Complete audit log of all threat scans</p>
            </div>
            <motion.button
              onClick={fetchHistory}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="cyber-btn-outline flex items-center gap-2 py-2 px-4 text-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </motion.button>
          </motion.div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total Scans', value: data.length, icon: Clock, color: 'text-cyber-primary', border: 'border-cyber-primary/20' },
              { label: 'URL Scans', value: urlCount, icon: Globe, color: 'text-cyber-accent', border: 'border-cyan-500/20' },
              { label: 'Email Scans', value: emailCount, icon: Mail, color: 'text-cyber-warning', border: 'border-cyber-warning/20' },
              { label: 'High Risk', value: highRisk, icon: ShieldAlert, color: 'text-cyber-danger', border: 'border-cyber-danger/20' },
            ].map((card, i) => {
              const Icon = card.icon
              return (
                <motion.div
                  key={card.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className={`cyber-card border ${card.border} flex items-center gap-4`}
                >
                  <div className={`p-2 rounded-lg border ${card.border} bg-white/3`}>
                    <Icon className={`w-4 h-4 ${card.color}`} />
                  </div>
                  <div>
                    <div className={`font-display text-2xl font-bold ${card.color}`}>{card.value}</div>
                    <div className="font-mono text-[10px] text-cyber-muted uppercase tracking-wide">{card.label}</div>
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* Avg risk bar */}
          {data.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="cyber-card mb-6"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-cyber-muted" />
                  <span className="font-mono text-xs text-cyber-muted tracking-widest uppercase">Average Risk Score</span>
                </div>
                <span className="font-display text-lg font-bold text-cyber-warning">{avgRisk}/100</span>
              </div>
              <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${avgRisk}%` }}
                  transition={{ duration: 1, ease: 'easeOut', delay: 0.4 }}
                  className="h-full rounded-full"
                  style={{
                    background: avgRisk >= 60 ? '#ef4444' : avgRisk >= 30 ? '#facc15' : '#22c55e'
                  }}
                />
              </div>
            </motion.div>
          )}

          {/* Error */}
          {error && (
            <div className="mb-6 px-4 py-3 rounded-lg bg-cyber-danger/10 border border-cyber-danger/20 font-mono text-sm text-cyber-danger">
              {error}
            </div>
          )}

          {/* Table */}
          <ThreatHistoryTable data={data} loading={loading} />
        </div>
      </div>
    </motion.div>
  )
}
