import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Globe, AlertTriangle } from 'lucide-react'
import AnalyzeButton from './AnalyzeButton'
import { mockScanURL } from '../../services/api'

export default function URLScanner() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleScan = async () => {
    if (!url.trim()) {
      setError('Please enter a URL to scan')
      return
    }
    setError('')
    setLoading(true)
    try {
      const result = await mockScanURL(url)
      sessionStorage.setItem('scanResult', JSON.stringify({ ...result, input: url, inputType: 'url' }))
      navigate('/dashboard')
    } catch (err) {
      setError('Failed to analyze URL. Please check the backend connection.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
      className="space-y-5"
    >
      <div>
        <label className="font-mono text-xs text-cyber-muted tracking-widest uppercase block mb-2">
          Suspicious URL
        </label>
        <div className="relative">
          <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-cyber-muted" />
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleScan()}
            placeholder="http://paypal-login-security.xyz"
            className="cyber-input pl-11"
          />
        </div>
      </div>

      {/* Quick examples */}
      <div>
        <div className="font-mono text-xs text-cyber-muted mb-2">Quick examples:</div>
        <div className="flex flex-wrap gap-2">
          {[
            'http://paypal-login-security.xyz',
            'https://verify-account-now.tk/login',
            'http://amazon-prize.win/claim',
          ].map((example) => (
            <motion.button
              key={example}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setUrl(example)}
              className="text-xs font-mono text-cyber-primary/70 border border-cyber-primary/20 px-3 py-1.5 rounded-lg hover:border-cyber-primary/50 hover:text-cyber-primary transition-all"
            >
              {example}
            </motion.button>
          ))}
        </div>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2 text-cyber-danger text-sm font-mono bg-cyber-danger/10 border border-cyber-danger/20 px-4 py-3 rounded-lg"
        >
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {error}
        </motion.div>
      )}

      <AnalyzeButton onClick={handleScan} loading={loading} label="Analyze URL" />

      {/* Info note */}
      <p className="font-mono text-xs text-cyber-muted text-center">
        Scans against threat intelligence databases and AI models
      </p>
    </motion.div>
  )
}
