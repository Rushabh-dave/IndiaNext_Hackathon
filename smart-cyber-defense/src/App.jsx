import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import LandingPage from './pages/LandingPage'
import ThreatScanner from './pages/ThreatScanner'
import Dashboard from './pages/Dashboard'
import History from './pages/History'

function App() {
  return (
    <Router>
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/scanner" element={<ThreatScanner />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/history" element={<History />} />
        </Routes>
      </AnimatePresence>
    </Router>
  )
}

export default App
