import { motion } from 'framer-motion'
import HeroSection from '../components/landing/HeroSection'
import FeaturesSection from '../components/landing/FeaturesSection'
import CyberGridBackground from '../components/landing/CyberGridBackground'
import CyberNetworkScene from '../components/three/CyberNetworkScene'
import { Link } from 'react-router-dom'
import { Shield } from 'lucide-react'

export default function LandingPage() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="relative min-h-screen bg-cyber-bg overflow-hidden"
    >
      {/* Three.js background */}
      <CyberNetworkScene height="100vh" />

      {/* Grid overlay */}
      <CyberGridBackground />

      {/* Minimal top bar */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-5">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Shield className="w-7 h-7 text-cyber-primary" />
          </div>
          <span className="font-display text-xs font-bold tracking-widest text-white">SMART CYBER DEFENSE</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/scanner">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="cyber-btn-outline text-xs py-2 px-5"
            >
              Launch Platform
            </motion.button>
          </Link>
        </div>
      </div>

      {/* Main content */}
      <HeroSection />

      {/* Features below fold */}
      <div className="relative z-10">
        <FeaturesSection />
      </div>

      {/* Footer */}
      <div className="relative z-10 text-center py-8 border-t border-cyber-primary/10">
        <p className="font-mono text-xs text-cyber-muted">
          SMART CYBER DEFENSE PLATFORM — Hackathon MVP Build
        </p>
      </div>
    </motion.div>
  )
}
