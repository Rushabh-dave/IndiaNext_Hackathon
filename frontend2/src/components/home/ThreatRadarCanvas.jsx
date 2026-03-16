import { useEffect, useRef, useMemo } from 'react';
import { motion, useAnimation } from 'framer-motion';

export default function ThreatRadarCanvas({ tNorm, threatColor }) {
  const controls = useAnimation();
  const speed = 2 + tNorm * 3; // Speeds up with threat

  useEffect(() => {
    controls.start({
      rotate: [0, 360],
      transition: {
        duration: 8 / speed,
        ease: 'linear',
        repeat: Infinity,
      }
    });
  }, [speed, controls]);

  const colorStr = `rgb(${threatColor.r}, ${threatColor.g}, ${threatColor.b})`;
  const colAlpha = (a) => `rgba(${threatColor.r}, ${threatColor.g}, ${threatColor.b}, ${a})`;

  // Pulsing Rings
  const rings = Array.from({ length: 3 }).map((_, i) => (i + 1) * 75);

  return (
    <div className="absolute inset-0 flex items-center justify-center opacity-70">
      <div className="relative w-[440px] h-[440px] mt-[-10%]">
        {/* Sweep Conic Gradient via Framer Motion */}
        <motion.div 
          animate={controls}
          className="absolute inset-0 origin-center rounded-full"
          style={{
            background: `conic-gradient(from 0deg, ${colAlpha(0)} 0deg, ${colAlpha(0)} 260deg, ${colAlpha(0.24)} 360deg)`
          }}
        >
          {/* Sweep Line */}
          <div 
            className="absolute top-0 bottom-1/2 left-1/2 w-[1px] origin-bottom"
            style={{ backgroundColor: colAlpha(0.6) }}
          />
        </motion.div>

        {/* Static Rings */}
        {rings.map((r, i) => (
          <div 
            key={i}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border"
            style={{
              width: r * 2,
              height: r * 2,
              borderColor: colAlpha(0.02 - i * 0.004)
            }}
          />
        ))}

        {/* Center Node */}
        <motion.div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ width: 9, height: 9, backgroundColor: colAlpha(0.8) }}
          animate={{ scale: [1, 1 + tNorm * 0.5, 1], opacity: [0.8, 0.4, 0.8] }}
          transition={{ duration: 1.5 - tNorm * 0.5, repeat: Infinity }}
        />
        <motion.div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ width: 18 + tNorm * 18, height: 18 + tNorm * 18, backgroundColor: colAlpha(0.2) }}
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1.5 - tNorm * 0.5, repeat: Infinity }}
        />
      </div>
    </div>
  );
}
