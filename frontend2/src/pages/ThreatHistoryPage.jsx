import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import CyberGridCanvas from '../components/CyberGridCanvas';
import HistoryHeader from '../components/history/HistoryHeader';
import HistoryStatCards from '../components/history/HistoryStatCards';
import AverageRiskBar from '../components/history/AverageRiskBar';
import ThreatHistoryTable from '../components/history/ThreatHistoryTable';
import { getThreatColor } from '../utils/colors';

export default function ThreatHistoryPage() {
  const [mounted, setMounted] = useState(false);
  const targetThreat = 45; // Fixed threat level for History view context
  const threatLevelStatus = 'ELEVATED'; // Used by Sidebar status box
  const threatColor = getThreatColor(targetThreat);
  
  useEffect(() => {
    // Staggered reveal animation
    const timer = setTimeout(() => setMounted(true), 150);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex h-screen bg-[#080514] text-white overflow-hidden selection:bg-cyan-500/30 font-inter">
      
      {/* 3D Background */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-40">
        <CyberGridCanvas tNorm={targetThreat / 100} threatColor={threatColor} />
      </div>

      <Sidebar currentThreatLevel={threatLevelStatus} />

      <main className="flex-1 relative z-10 overflow-y-auto hide-scrollbar">
        <div className="max-w-7xl mx-auto px-10 pt-16 pb-20">
          
          <div 
            className="transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
            style={{ 
              opacity: mounted ? 1 : 0, 
              transform: mounted ? 'translateY(0)' : 'translateY(15px)' 
            }}
          >
            <HistoryHeader />
            <HistoryStatCards />
            <AverageRiskBar score={70} />
            <ThreatHistoryTable />
          </div>

        </div>
      </main>

    </div>
  );
}
