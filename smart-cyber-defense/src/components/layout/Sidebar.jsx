import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Scan, BarChart3, History, ChevronRight, Shield, Wifi, Mail, Globe } from 'lucide-react'

const menuItems = [
  {
    label: 'Threat Scanner',
    to: '/scanner',
    icon: Scan,
    badge: null,
    sub: ['URL Scanner', 'Email Scanner'],
  },
  {
    label: 'Cyber Risk Dashboard',
    to: '/dashboard',
    icon: BarChart3,
    badge: '3',
    sub: null,
  },
  {
    label: 'Threat History',
    to: '/history',
    icon: History,
    badge: null,
    sub: null,
  },
]

const stats = [
  { label: 'Scans Today', value: '247', icon: Wifi, color: 'text-cyber-primary' },
  { label: 'Threats Blocked', value: '18', icon: Shield, color: 'text-cyber-danger' },
  { label: 'URL Scans', value: '143', icon: Globe, color: 'text-cyber-accent' },
  { label: 'Email Scans', value: '104', icon: Mail, color: 'text-cyber-warning' },
]

export default function Sidebar() {
  const location = useLocation()

  return (
    <motion.aside
      initial={{ x: -260, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="fixed left-0 top-16 bottom-0 w-60 flex flex-col border-r border-cyber-primary/10 z-40"
      style={{ background: 'rgba(15, 23, 42, 0.95)' }}
    >
      {/* Section label */}
      <div className="px-4 py-4">
        <div className="text-[10px] font-mono text-cyber-muted tracking-widest uppercase mb-3 px-2">Navigation</div>
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const active = location.pathname === item.to
            const Icon = item.icon
            return (
              <div key={item.to}>
                <Link to={item.to}>
                  <motion.div
                    whileHover={{ x: 4 }}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                      active
                        ? 'bg-cyber-primary/15 text-cyber-primary border border-cyber-primary/20'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="font-body font-semibold text-sm flex-1 tracking-wide">{item.label}</span>
                    {item.badge && (
                      <span className="text-[10px] font-mono bg-cyber-danger/20 text-cyber-danger border border-cyber-danger/20 rounded px-1.5 py-0.5">
                        {item.badge}
                      </span>
                    )}
                    {active && <ChevronRight className="w-3 h-3" />}
                  </motion.div>
                </Link>
                {active && item.sub && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="ml-7 mt-1 space-y-1 border-l border-cyber-primary/20 pl-3"
                  >
                    {item.sub.map((s) => (
                      <div key={s} className="text-xs text-cyber-muted py-1 font-mono">{s}</div>
                    ))}
                  </motion.div>
                )}
              </div>
            )
          })}
        </nav>
      </div>

      {/* Divider */}
      <div className="mx-4 border-t border-cyber-primary/10" />

      {/* Quick stats */}
      <div className="px-4 py-4 flex-1">
        <div className="text-[10px] font-mono text-cyber-muted tracking-widest uppercase mb-3 px-2">Live Stats</div>
        <div className="space-y-2">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <div key={stat.label} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/3 border border-white/5">
                <Icon className={`w-3.5 h-3.5 ${stat.color}`} />
                <span className="font-body text-xs text-slate-400 flex-1">{stat.label}</span>
                <span className={`font-mono text-sm font-bold ${stat.color}`}>{stat.value}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Bottom threat level */}
      <div className="p-4">
        <div className="rounded-lg p-3 border border-cyber-warning/20 bg-cyber-warning/5">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-cyber-warning animate-pulse" />
            <span className="font-display text-[10px] tracking-widest text-cyber-warning">THREAT LEVEL</span>
          </div>
          <div className="font-display text-lg text-cyber-warning font-bold">ELEVATED</div>
          <div className="font-mono text-[10px] text-cyber-muted mt-1">Updated 2 min ago</div>
        </div>
      </div>
    </motion.aside>
  )
}
