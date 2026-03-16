import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:8000',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error)
    return Promise.reject(error)
  }
)

export const scanURL = async (url) => {
  const response = await api.post('/scan-url', { url })
  return response.data
}

export const scanEmail = async (sender, subject, body) => {
  const response = await api.post('/scan-email', { sender, subject, body })
  return response.data
}

export const getThreatHistory = async () => {
  const response = await api.get('/threat-history')
  return response.data
}

// Mock responses for demo when backend not available
export const mockScanURL = async (url) => {
  await new Promise(r => setTimeout(r, 2000))
  const isPhishing = url.includes('paypal') || url.includes('login') || url.includes('verify') || url.includes('secure')
  return {
    threat_type: isPhishing ? 'Phishing URL' : 'Malicious URL',
    risk_score: isPhishing ? 87 : 45,
    confidence: isPhishing ? 0.91 : 0.67,
    explanation: isPhishing
      ? ['Suspicious domain detected', 'Recently registered domain', 'Brand impersonation attempt', 'No HTTPS detected']
      : ['Unusual port usage', 'Domain reputation low', 'Suspicious URL patterns'],
    recommended_action: isPhishing ? 'Do not open the link. Report it immediately.' : 'Exercise caution before visiting this URL.',
  }
}

export const mockScanEmail = async (sender, subject, body) => {
  await new Promise(r => setTimeout(r, 2000))
  return {
    threat_type: 'Phishing Email',
    risk_score: 92,
    confidence: 0.95,
    explanation: [
      'Sender domain resembles known brand',
      'Urgency language detected',
      'External login link present',
      'Mismatched reply-to address',
    ],
    recommended_action: 'Report the email and avoid clicking any links. Block the sender.',
  }
}

export const mockGetHistory = async () => {
  await new Promise(r => setTimeout(r, 500))
  return [
    { id: 1, input_type: 'url', threat_type: 'Phishing URL', risk_score: 87, confidence: 0.91, timestamp: '2026-03-16T10:22:00' },
    { id: 2, input_type: 'email', threat_type: 'Phishing Email', risk_score: 92, confidence: 0.95, timestamp: '2026-03-16T09:45:00' },
    { id: 3, input_type: 'url', threat_type: 'Malicious URL', risk_score: 64, confidence: 0.78, timestamp: '2026-03-16T08:30:00' },
    { id: 4, input_type: 'email', threat_type: 'Phishing Email', risk_score: 78, confidence: 0.88, timestamp: '2026-03-15T17:15:00' },
    { id: 5, input_type: 'url', threat_type: 'Phishing URL', risk_score: 95, confidence: 0.97, timestamp: '2026-03-15T14:00:00' },
    { id: 6, input_type: 'email', threat_type: 'Phishing Email', risk_score: 43, confidence: 0.62, timestamp: '2026-03-15T11:20:00' },
    { id: 7, input_type: 'url', threat_type: 'Malicious URL', risk_score: 31, confidence: 0.55, timestamp: '2026-03-14T16:40:00' },
  ]
}

export default api
