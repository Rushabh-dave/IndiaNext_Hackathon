import { motion } from 'framer-motion'
import { Loader2, Search, ShieldCheck } from 'lucide-react'

export default function AnalyzeButton({ onClick, loading, label = 'Analyze', disabled }) {
  return (
    <motion.button
      onClick={onClick}
      disabled={loading || disabled}
      whileHover={!loading && !disabled ? { scale: 1.02, boxShadow: '0 0 40px rgba(34, 197, 94, 0.5)' } : {}}
      whileTap={!loading && !disabled ? { scale: 0.97 } : {}}
      className={`w-full flex items-center justify-center gap-3 py-4 rounded-xl font-display text-sm tracking-widest uppercase font-bold transition-all duration-300 ${
        loading || disabled
          ? 'bg-cyber-primary/30 text-cyber-primary/50 cursor-not-allowed'
          : 'bg-cyber-primary text-[#0f172a] cursor-pointer'
      }`}
    >
      {loading ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          Analyzing...
        </>
      ) : (
        <>
          <Search className="w-5 h-5" />
          {label}
        </>
      )}
    </motion.button>
  )
}
