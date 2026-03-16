import { useEffect, useRef } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { Chart as ChartJS, ArcElement, Tooltip } from 'chart.js'
import { Doughnut } from 'react-chartjs-2'

ChartJS.register(ArcElement, Tooltip)

function getColor(score) {
  if (score < 30) return { main: '#22c55e', glow: 'rgba(34,197,94,0.4)', label: 'SAFE', bg: 'bg-cyber-primary/10', border: 'border-cyber-primary/30' }
  if (score < 60) return { main: '#facc15', glow: 'rgba(250,204,21,0.4)', label: 'SUSPICIOUS', bg: 'bg-cyber-warning/10', border: 'border-cyber-warning/30' }
  return { main: '#ef4444', glow: 'rgba(239,68,68,0.4)', label: 'DANGEROUS', bg: 'bg-cyber-danger/10', border: 'border-cyber-danger/30' }
}

export default function RiskScoreMeter({ score = 0 }) {
  const colors = getColor(score)

  const chartData = {
    datasets: [
      {
        data: [score, 100 - score],
        backgroundColor: [colors.main, 'rgba(255,255,255,0.05)'],
        borderColor: ['transparent', 'transparent'],
        borderWidth: 0,
        circumference: 240,
        rotation: -120,
      },
    ],
  }

  const chartOptions = {
    cutout: '78%',
    plugins: { tooltip: { enabled: false } },
    animation: { duration: 1500, easing: 'easeOutQuart' },
    responsive: true,
    maintainAspectRatio: true,
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className={`cyber-card border ${colors.border} ${colors.bg} text-center`}
    >
      {/* Top accent */}
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${colors.main}, transparent)` }} />

      <div className="font-mono text-xs text-cyber-muted tracking-widest uppercase mb-4">Risk Score</div>

      {/* Chart container */}
      <div className="relative w-48 mx-auto">
        <Doughnut data={chartData} options={chartOptions} />

        {/* Center score */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <div className="font-display text-5xl font-black" style={{ color: colors.main }}>
              {score}
            </div>
            <div className="font-mono text-xs text-cyber-muted text-center">/100</div>
          </motion.div>
        </div>
      </div>

      {/* Label */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className={`inline-flex items-center gap-2 mt-4 px-4 py-1.5 rounded-full border ${colors.border} ${colors.bg}`}
      >
        <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: colors.main }} />
        <span className="font-display text-xs tracking-widest font-bold" style={{ color: colors.main }}>
          {colors.label}
        </span>
      </motion.div>

      {/* Scale */}
      <div className="flex justify-between mt-4 px-2">
        <span className="font-mono text-[10px] text-cyber-primary">0 SAFE</span>
        <span className="font-mono text-[10px] text-cyber-warning">50</span>
        <span className="font-mono text-[10px] text-cyber-danger">100 CRITICAL</span>
      </div>
    </motion.div>
  )
}
