import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ShieldAlert, Activity, ShieldCheck, Clock, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import CyberGridCanvas from '../components/CyberGridCanvas';
import Sidebar from '../components/Sidebar';
import { getThreatColor, rgba } from '../utils/colors';
import IconButton from '../components/buttons/IconButton';

// Import all 7 Scanners
import EmailScanner from '../components/threat-detection/scanners/EmailScanner';
import MessageScanner from '../components/threat-detection/scanners/MessageScanner';
import URLScanner from '../components/threat-detection/scanners/URLScanner';
import ImageScanner from '../components/threat-detection/scanners/ImageScanner';
import VideoScanner from '../components/threat-detection/scanners/VideoScanner';
import AudioScanner from '../components/threat-detection/scanners/AudioScanner';
import PromptScanner from '../components/threat-detection/scanners/PromptScanner';

const scanners = [
  <EmailScanner key="email" />,
  <MessageScanner key="msg" />,
  <URLScanner key="url" />,
  <ImageScanner key="img" />,
  <VideoScanner key="vid" />,
  <AudioScanner key="aud" />,
  <PromptScanner key="prompt" />
];

const slideVariants = {
  enter: (direction) => ({
    x: direction > 0 ? '100%' : '-100%',
    opacity: 0
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1
  },
  exit: (direction) => ({
    zIndex: 0,
    x: direction < 0 ? '100%' : '-100%',
    opacity: 0
  })
};

const swipeConfidenceThreshold = 10000;
const swipePower = (offset, velocity) => {
  return Math.abs(offset) * velocity;
};

export default function ThreatDetectionPage() {
  const tNorm = 0.15; // Global background state for the hub
  const col = getThreatColor(tNorm);
  const colorStr = `rgb(${col.r}, ${col.g}, ${col.b})`;
  const colAlpha = (a) => rgba(col, a);

  const [[page, direction], setPage] = useState([0, 0]);

  // Wrap around index to create an infinite loop
  const currentIndex = ((page % scanners.length) + scanners.length) % scanners.length;

  const paginate = (newDirection) => {
    setPage([page + newDirection, newDirection]);
  };

  return (
    <div className="relative w-full h-screen overflow-hidden font-inter text-slate-100 bg-[#080514] flex">
      {/* Background Canvas */}
      <div className="absolute inset-0 z-0 opacity-30 pointer-events-none">
        <CyberGridCanvas tNorm={tNorm} threatColor={col} />
      </div>

      {/* Global Sidebar (Left) */}
      <Sidebar currentThreatLevel="SAFE" />

      {/* Main Content (Right Area) */}
      <main className="flex-1 h-screen relative z-10 flex flex-col overflow-hidden">
        {/* Floating Header */}
        <div className="absolute top-0 inset-x-0 h-[70px] border-b border-white/10 bg-[#080514]/70 backdrop-blur-xl flex items-center justify-between px-8 z-50">
        <div className="flex items-center gap-6">
          <IconButton 
            as="Link" 
            to="/" 
            icon={ArrowLeft} 
            aria-label="Back to Home"
          />
          <div className="flex flex-col">
            <div className="flex items-center gap-2 font-jetbrains text-[10px] tracking-widest uppercase mb-1" style={{ color: colorStr }}>
              <div className="w-[5px] h-[5px] rounded-full animate-pulse" style={{ backgroundColor: colorStr }} /> 
              THREAT INTELLIGENCE HUB
            </div>
            <h1 className="font-orbitron font-bold text-[18px] tracking-widest text-white uppercase">Threat Detection Center</h1>
          </div>
        </div>

        <div className="flex items-center gap-8 font-jetbrains text-[11px] tracking-widest text-slate-400 uppercase hidden md:flex">
             <div className="flex items-center gap-2">
               <Activity className="w-3.5 h-3.5" /> {currentIndex + 1} / {scanners.length} MODULES
             </div>
             <div className="flex items-center gap-2">
               <ShieldCheck className="w-3.5 h-3.5" /> API Connected
             </div>
             <div className="px-3 py-1.5 bg-green-500/10 border border-green-500/30 text-green-400 rounded-full flex items-center gap-1.5">
                <div className="w-[5px] h-[5px] bg-green-400 rounded-full" />
                SYSTEM SECURE
             </div>
        </div>
      </div>

      {/* Infinite Carousel Container */}
      <div className="w-full h-full relative z-10 pt-[70px] flex items-center justify-center overflow-hidden">
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={page}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 }
            }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={1}
            onDragEnd={(e, { offset, velocity }) => {
              const swipe = swipePower(offset.x, velocity.x);

              if (swipe < -swipeConfidenceThreshold) {
                paginate(1);
              } else if (swipe > swipeConfidenceThreshold) {
                paginate(-1);
              }
            }}
            className="absolute w-full h-full flex items-center justify-center"
          >
            {scanners[currentIndex]}
          </motion.div>
        </AnimatePresence>

        {/* Carousel Navigation Arrows */}
        <IconButton 
          icon={ChevronLeft}
          className="absolute left-8 z-50 !w-14 !h-14 sm:!w-14 sm:!h-14 backdrop-blur-md hover:scale-110"
          iconClassName="w-8 h-8"
          onClick={() => paginate(-1)}
          aria-label="Previous Module"
        />
        <IconButton 
          icon={ChevronRight}
          className="absolute right-8 z-50 !w-14 !h-14 sm:!w-14 sm:!h-14 backdrop-blur-md hover:scale-110"
          iconClassName="w-8 h-8"
          onClick={() => paginate(1)}
          aria-label="Next Module"
        />

        {/* Swipe Hint */}
        <div className="fixed bottom-8 left-1/2 -translate-x-[50%] pointer-events-none flex flex-col items-center gap-2 opacity-50 z-50" style={{ animation: 'bounceHorizontal 2s infinite' }}>
          <div className="font-jetbrains text-[10px] tracking-widest text-slate-400 uppercase">Swipe or Click Arrows</div>
          <div className="flex gap-2 items-center">
             <div className="w-2 h-2 border-t-2 border-l-2 border-slate-400 rotate-[-45deg]" />
             <div className="w-8 h-[2px] bg-slate-400 rounded-full" />
             <div className="w-2 h-2 border-t-2 border-r-2 border-slate-400 rotate-[45deg]" />
          </div>
        </div>
      </div>
      </main>

      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        @keyframes bounceHorizontal {
          0%, 100% { transform: translateX(-50%); }
          50% { transform: translateX(calc(-50% + 15px)); }
        }
      `}</style>
    </div>
  );
}
