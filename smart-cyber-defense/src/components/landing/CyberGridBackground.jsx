export default function CyberGridBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Grid */}
      <div className="absolute inset-0 grid-bg opacity-60" />

      {/* Radial glow center */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(34,197,94,0.06) 0%, transparent 70%)',
        }}
      />

      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-64 h-64 border-l-2 border-t-2 border-cyber-primary/20 rounded-br-full" />
      <div className="absolute top-0 right-0 w-64 h-64 border-r-2 border-t-2 border-cyan-500/20 rounded-bl-full" />
      <div className="absolute bottom-0 left-0 w-32 h-32 border-l border-b border-cyber-primary/10" />
      <div className="absolute bottom-0 right-0 w-32 h-32 border-r border-b border-cyan-500/10" />

      {/* Horizontal scan line */}
      <div
        className="absolute left-0 right-0 h-px"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(34,197,94,0.4), transparent)',
          animation: 'scanLine 4s linear infinite',
        }}
      />

      {/* Noise overlay */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' opacity=\'1\'/%3E%3C/svg%3E")',
        }}
      />
    </div>
  )
}
