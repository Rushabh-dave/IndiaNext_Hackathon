import { Link, useLocation } from 'react-router-dom';
import { Scan, LayoutDashboard, History, Wifi, ShieldOff, Globe, Mail, CirclePower, Activity } from 'lucide-react';
import logo from '../resources/logo.png';

export default function Sidebar({ currentThreatLevel = 'ELEVATED' }) {
  const location = useLocation();

  const navItems = [
    { name: 'Threat Scanner', path: '/threat-detection', icon: Scan },
    { name: 'Cyber Risk Dashboard', path: '/dashboard', icon: LayoutDashboard, badge: '3' },
    { name: 'Threat History', path: '/history', icon: History }
  ];

  const liveStats = [
    { label: 'Scans Today', value: '247', icon: Wifi, color: 'text-green-500' },
    { label: 'Threats Blocked', value: '18', icon: ShieldOff, color: 'text-red-500' },
    { label: 'URL Scans', value: '143', icon: Globe, color: 'text-cyan-500' },
    { label: 'Email Scans', value: '104', icon: Mail, color: 'text-yellow-500' }
  ];

  // Map simulated threat level to matching global color variables
  let threatColor = '#f59e0b'; // Yellow (Elevated)
  if (currentThreatLevel === 'CRITICAL') threatColor = '#ef4444'; // Red
  else if (currentThreatLevel === 'SAFE') threatColor = '#22c55e'; // Green

  return (
    <aside className="w-72 h-screen flex flex-col bg-[#0f0a26]/90 border-r border-white/5 backdrop-blur-xl relative z-40 flex-shrink-0">

      {/* Brand Header */}
      <div className="p-6 border-b border-white/5 pb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg border border-green-500/30 flex items-center justify-center bg-green-500/10 p-1">
              <img src={logo} alt="Smart Cyber Logo" className="w-full h-full object-contain drop-shadow-[0_0_5px_rgba(255,255,255,0.2)]" />
            </div>
            <div>
              <h1 className="font-orbitron font-bold text-[14px] text-white tracking-widest leading-tight">SMART CYBER</h1>
              <div className="font-jetbrains text-[9px] text-green-500 tracking-[0.2em] uppercase">Defense Platform</div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 font-jetbrains text-[10px] text-slate-400 uppercase tracking-widest mt-4">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e] animate-pulse" />
          SYSTEM ONLINE
        </div>
      </div>

      <div className="flex-1 overflow-y-auto hide-scrollbar p-6 space-y-10">

        {/* Navigation */}
        <div>
          <div className="font-jetbrains text-[10px] tracking-[0.2em] text-slate-500 uppercase mb-4">NAVIGATION</div>
          <nav className="space-y-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all font-inter text-[14px] ${isActive
                    ? 'bg-green-500/10 border border-green-500/30 text-green-400 shadow-[inset_0_0_20px_rgba(34,197,94,0.05)]'
                    : 'border border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className={`w-4 h-4 ${isActive ? 'text-green-400' : 'text-slate-500'}`} />
                    <span className="font-medium tracking-wide">{item.name}</span>
                  </div>

                  {item.badge && (
                    <div className={`px-2 py-0.5 rounded text-[10px] font-jetbrains border ${isActive ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-white/5 text-slate-500 border-white/10'
                      }`}>
                      {item.badge}
                    </div>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Live Stats */}
        <div>
          <div className="font-jetbrains text-[10px] tracking-[0.2em] text-slate-500 uppercase mb-4">LIVE STATS</div>
          <div className="space-y-3">
            {liveStats.map((stat, idx) => (
              <div key={idx} className="flex items-center justify-between px-4 py-3 rounded-xl bg-black/20 border border-white/5">
                <div className="flex items-center gap-3 text-slate-400">
                  <stat.icon className={`w-4 h-4 ${stat.color} opacity-80`} />
                  <span className="font-inter text-[13px]">{stat.label}</span>
                </div>
                <div className={`font-jetbrains font-bold text-[14px] ${stat.color}`}>
                  {stat.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Threat Widget */}
      <div className="p-6 border-t border-white/5 bg-black/20">
        <div className="bg-[#1a142e] border border-white/10 rounded-xl p-5 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-[50px] opacity-10 pointer-events-none" style={{ backgroundColor: threatColor }} />

          <div className="flex items-center gap-2 font-jetbrains text-[10px] tracking-widest text-slate-400 uppercase mb-3">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: threatColor, boxShadow: `0 0 8px ${threatColor}` }} />
            THREAT LEVEL
          </div>

          <h3 className="font-orbitron font-bold text-2xl tracking-widest uppercase mb-4" style={{ color: threatColor }}>
            {currentThreatLevel}
          </h3>

          <div className="font-jetbrains text-[10px] text-slate-500 tracking-wider flex items-center gap-1.5 opacity-80">
            <Activity className="w-3.5 h-3.5" />
            Updated 2 min ago
          </div>
        </div>
      </div>

    </aside>
  );
}
