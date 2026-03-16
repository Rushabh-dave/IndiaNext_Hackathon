import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import HeroSection from '../components/home/HeroSection';
import CyberGridCanvas from '../components/CyberGridCanvas';
import ThreatRadarCanvas from '../components/home/ThreatRadarCanvas';
import Navbar from '../components/Navbar';
import ThreatMeter from '../components/home/ThreatMeter';
import ThreatCards from '../components/home/ThreatCards';
import ThreatControls from '../components/home/ThreatControls';
import HUDOverlay from '../components/home/HUDOverlay';
import LiveTicker from '../components/home/LiveTicker';
import { getThreatColor, lerp } from '../utils/colors';

export default function Home() {
  const [threatLevel, setThreatLevel] = useState(0); // 0 to 100
  const [targetThreat, setTargetThreat] = useState(0);
  const [autoMode, setAutoMode] = useState(false);

  // Smooth interpolation toward target
  useEffect(() => {
    let animationFrameId;
    const updateThreat = () => {
      setThreatLevel(prev => {
        const diff = targetThreat - prev;
        if (Math.abs(diff) < 0.1) return targetThreat;
        return prev + diff * 0.25;
      });
      animationFrameId = requestAnimationFrame(updateThreat);
    };
    updateThreat();
    return () => cancelAnimationFrame(animationFrameId);
  }, [targetThreat]);

  // Handle auto mode
  useEffect(() => {
    let interval;
    if (autoMode) {
      let dir = 1;
      let currentTarget = targetThreat;
      interval = setInterval(() => {
        currentTarget += dir * 1.2;
        if (currentTarget >= 100) dir = -1;
        if (currentTarget <= 0) dir = 1;
        currentTarget = Math.max(0, Math.min(100, currentTarget));
        setTargetThreat(currentTarget);
      }, 60);
    }
    return () => clearInterval(interval);
  }, [autoMode, targetThreat]);

  const tNorm = threatLevel / 100;
  const col = getThreatColor(tNorm);
  const colorStr = `rgb(${col.r}, ${col.g}, ${col.b})`;
  const bgR = Math.round(lerp(8, 15, tNorm));
  const bgG = Math.round(lerp(5, 2, tNorm));
  const bgB = Math.round(lerp(20, 8, tNorm));

  const isCritical = tNorm > 0.9;
  
  // Alert text (7 steps)
  let alertText = '';
  if(tNorm <= 1/6) alertText = 'ALL SYSTEMS SECURE — NO THREATS DETECTED';
  else if(tNorm <= 2/6) alertText = 'ROUTINE MONITORING — SYSTEM SAFE';
  else if(tNorm <= 3/6) alertText = 'GUARDED STATUS — MINOR ANOMALIES DETECTED';
  else if(tNorm <= 4/6) alertText = 'ELEVATED THREAT LEVEL — INCREASED SCANNING ACTIVE';
  else if(tNorm <= 5/6) alertText = 'HIGH RISK — MULTIPLE THREATS DETECTED';
  else if(tNorm <= 5.8/6) alertText = 'SEVERE THREAT — PREPARING DEFENSIVE MEASURES';
  else alertText = 'CRITICAL THREAT LEVEL — IMMEDIATE ACTION REQUIRED';

  // Flash Alpha compute for Critical State
  const [flashAlpha, setFlashAlpha] = useState(0);
  useEffect(() => {
    let af;
    const tick = () => {
      if (tNorm > 0.8) {
        setFlashAlpha(0.04 + 0.03 * Math.sin(Date.now() * 0.002));
      } else {
        setFlashAlpha(0);
      }
      af = requestAnimationFrame(tick);
    }
    tick();
    return () => cancelAnimationFrame(af);
  }, [tNorm]);

  return (
    <div 
      className="relative w-full h-screen overflow-hidden font-inter text-slate-100 transition-colors duration-200"
      style={{ 
        backgroundColor: `rgb(${bgR}, ${bgG}, ${bgB})`,
        animation: isCritical ? 'screenshake 0.3s ease infinite' : 'none'
      }}
    >
      <style>{`
        @keyframes screenshake {
          0%, 100% { transform: translate(0, 0) }
          20% { transform: translate(-2px, 1px) }
          40% { transform: translate(2px, -1px) }
          60% { transform: translate(-1px, 2px) }
          80% { transform: translate(1px, -2px) }
        }
      `}</style>

      {/* 3D and Canvas Backgrounds */}
      <div className="absolute inset-0 z-0">
        <CyberGridCanvas tNorm={tNorm} threatColor={col} />
      </div>
      <div className="absolute inset-0 z-[1] pointer-events-none mix-blend-screen">
        <ThreatRadarCanvas tNorm={tNorm} threatColor={col} />
      </div>

      {/* Critical Flash Overlay */}
      {tNorm > 0.8 && (
        <div 
          className="absolute inset-0 z-10 pointer-events-none"
          style={{ backgroundColor: `rgba(239, 68, 68, ${flashAlpha})` }} 
        />
      )}

      {/* Vignette */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 50% 44%, rgba(${bgR},${bgG},${bgB},0) 0%, rgba(${bgR},${bgG},${bgB},0.38) 45%, rgba(${bgR},${bgG},${bgB},0.97) 100%), linear-gradient(180deg, rgba(${bgR},${bgG},${bgB},0) 72%, rgba(${bgR},${bgG},${bgB},0.99) 100%)`
        }}
      />

      {/* UI Layer */}
      <div className="absolute inset-0 z-20 pointer-events-none flex flex-col">
        {/* Navigation */}
        <div className="pointer-events-auto">
          <Navbar tNorm={tNorm} colorStr={colorStr} col={col} bgR={bgR} bgG={bgG} bgB={bgB} />
        </div>

        {/* Global Alert Banner */}
        <div 
          className="absolute top-0 left-0 right-0 z-50 flex items-center justify-center gap-3 py-2 px-6 font-jetbrains text-[10px] tracking-widest uppercase transition-transform duration-700 ease-out border-b backdrop-blur-sm pointer-events-auto"
          style={{
            transform: tNorm > 0.6 ? 'translateY(0)' : 'translateY(-100%)',
            backgroundColor: `rgba(${col.r}, ${col.g}, ${col.b}, 0.15)`,
            borderBottomColor: `rgba(${col.r}, ${col.g}, ${col.b}, 0.35)`,
            color: colorStr
          }}
        >
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: colorStr, boxShadow: `0 0 8px ${colorStr}` }} />
          <span className="font-medium tracking-[0.15em]">{alertText}</span>
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: colorStr, boxShadow: `0 0 8px ${colorStr}` }} />
        </div>

        {/* Threat Meter */}
        <div className="relative pointer-events-auto mt-3">
          <ThreatMeter tNorm={tNorm} colorStr={colorStr} col={col} />
        </div>

        {/* Hero Section */}
        <div className="absolute top-[66px] left-0 right-0 bottom-0 flex flex-col items-center justify-center text-center px-8 pb-10 pointer-events-auto">
          <HeroSection tNorm={tNorm} colorStr={colorStr} col={col} bgR={bgR} bgG={bgG} bgB={bgB} />
        </div>

        <ThreatCards tNorm={tNorm} col={col} colorStr={colorStr} />
        <HUDOverlay tNorm={tNorm} colorStr={colorStr} col={col} />
        <LiveTicker />
        
        {/* Controls */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 pointer-events-auto">
          <ThreatControls 
            targetThreat={targetThreat} 
            setTargetThreat={setTargetThreat}
            autoMode={autoMode}
            setAutoMode={setAutoMode}
            colorStr={colorStr}
            tNorm={tNorm}
          />
        </div>
      </div>
    </div>
  );
}
