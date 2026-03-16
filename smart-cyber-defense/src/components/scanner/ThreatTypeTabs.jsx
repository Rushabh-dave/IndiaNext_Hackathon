import { motion } from 'framer-motion'
import { Globe, Mail } from 'lucide-react'

export default function ThreatTypeTabs({ activeTab, onTabChange }) {
  const tabs = [
    { id: 'url', label: 'URL Scanner', icon: Globe },
    { id: 'email', label: 'Email Scanner', icon: Mail },
  ]

  return (
    <div className="flex gap-2 p-1 rounded-xl bg-[#0f172a] border border-cyber-primary/10">
      {tabs.map((tab) => {
        const Icon = tab.icon
        const active = activeTab === tab.id
        return (
          <motion.button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            whileHover={{ scale: active ? 1 : 1.02 }}
            whileTap={{ scale: 0.97 }}
            className={`relative flex items-center gap-2.5 px-6 py-3 rounded-lg font-display text-sm tracking-widest uppercase transition-all duration-200 flex-1 justify-center ${
              active ? 'text-[#0f172a]' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {active && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 rounded-lg bg-cyber-primary"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <Icon className={`w-4 h-4 relative z-10 ${active ? 'text-[#0f172a]' : ''}`} />
            <span className="relative z-10 font-bold">{tab.label}</span>
          </motion.button>
        )
      })}
    </div>
  )
}
