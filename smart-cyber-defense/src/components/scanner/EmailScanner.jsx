import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Mail, User, Type, FileText, AlertTriangle } from 'lucide-react'
import AnalyzeButton from './AnalyzeButton'
import { mockScanEmail } from '../../services/api'

export default function EmailScanner() {
  const [form, setForm] = useState({ sender: '', subject: '', body: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }))
    setError('')
  }

  const fillExample = () => {
    setForm({
      sender: 'support@paypa1.com',
      subject: 'Urgent: Account verification required',
      body: 'Dear valued customer,\n\nYour account has been suspended due to suspicious activity. Please click the link below to verify your identity immediately or your account will be permanently deleted.\n\nVerify Now: http://paypa1-secure-login.xyz/verify\n\nPayPal Security Team',
    })
  }

  const handleScan = async () => {
    if (!form.sender || !form.subject || !form.body) {
      setError('Please fill in all fields before analyzing.')
      return
    }
    setError('')
    setLoading(true)
    try {
      const result = await mockScanEmail(form.sender, form.subject, form.body)
      sessionStorage.setItem('scanResult', JSON.stringify({ ...result, input: form.sender, inputType: 'email', emailData: form }))
      navigate('/dashboard')
    } catch (err) {
      setError('Failed to analyze email. Please check the backend connection.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      {/* Sender */}
      <div>
        <label className="font-mono text-xs text-cyber-muted tracking-widest uppercase block mb-2">
          Sender Email
        </label>
        <div className="relative">
          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-cyber-muted" />
          <input
            type="email"
            value={form.sender}
            onChange={handleChange('sender')}
            placeholder="support@paypa1.com"
            className="cyber-input pl-11"
          />
        </div>
      </div>

      {/* Subject */}
      <div>
        <label className="font-mono text-xs text-cyber-muted tracking-widest uppercase block mb-2">
          Subject
        </label>
        <div className="relative">
          <Type className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-cyber-muted" />
          <input
            type="text"
            value={form.subject}
            onChange={handleChange('subject')}
            placeholder="Account verification required"
            className="cyber-input pl-11"
          />
        </div>
      </div>

      {/* Body */}
      <div>
        <label className="font-mono text-xs text-cyber-muted tracking-widest uppercase block mb-2">
          Email Body
        </label>
        <div className="relative">
          <FileText className="absolute left-4 top-4 w-4 h-4 text-cyber-muted" />
          <textarea
            value={form.body}
            onChange={handleChange('body')}
            placeholder="Paste the full email body here..."
            rows={5}
            className="cyber-input pl-11 resize-none"
          />
        </div>
      </div>

      {/* Fill example button */}
      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={fillExample}
        className="w-full text-xs font-mono text-cyber-accent border border-cyan-500/20 px-4 py-2.5 rounded-lg hover:border-cyan-500/40 hover:bg-cyan-500/5 transition-all text-left"
      >
        ⚡ Load example phishing email
      </motion.button>

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

      <AnalyzeButton onClick={handleScan} loading={loading} label="Analyze Email" />
    </motion.div>
  )
}
