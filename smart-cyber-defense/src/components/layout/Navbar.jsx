import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Shield, Activity, Clock, Scan } from 'lucide-react'

export default function Navbar() {
  const location = useLocation()

  const links = [
    { to: '/dashboard', label: 'Dashboard', icon: Activity },
    { to: '/scanner', label: 'Scanner', icon: Scan },
    { to: '/history', label: 'History', icon: Clock },
  ]

  return (
    <motion.nav
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center px-6 border-b border-cyber-primary/10"
      style={{
        background: 'rgba(15, 23, 42, 0.9)',
        backdropFilter: 'blur(20px)',
      }}
    >
      {/* Logo */}
      <Link to="/" className="flex items-center gap-3 mr-10">
        <div className="relative">
          <Shield className="w-8 h-8 text-cyber-primary" />
          <div className="absolute inset-0 animate-ping opacity-30">
            <Shield className="w-8 h-8 text-cyber-primary" />
          </div>
        </div>
        <div>
          <span className="font-display text-sm font-bold tracking-widest text-white">SMART CYBER</span>
          <div className="text-[10px] font-mono text-cyber-primary tracking-widest">DEFENSE PLATFORM</div>
        </div>
      </Link>

      {/* Status indicator */}
      <div className="flex items-center gap-2 mr-auto">
        <div className="w-2 h-2 rounded-full bg-cyber-primary animate-pulse" />
        <span className="font-mono text-xs text-cyber-muted">SYSTEM ONLINE</span>
      </div>

      {/* Nav Links */}
      <div className="flex items-center gap-1">
        {links.map(({ to, label, icon: Icon }) => {
          const active = location.pathname === to
          return (
            <Link key={to} to={to}>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-display text-xs tracking-widest uppercase transition-all duration-200 ${
                  active
                    ? 'bg-cyber-primary/20 text-cyber-primary border border-cyber-primary/30'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </motion.div>
            </Link>
          )
        })}
      </div>

      {/* Alert count */}
      <div className="ml-6 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyber-danger/10 border border-cyber-danger/20">
        <div className="w-2 h-2 rounded-full bg-cyber-danger animate-pulse" />
        <span className="font-mono text-xs text-cyber-danger">3 ALERTS</span>
      </div>
    </motion.nav>
  )
}
