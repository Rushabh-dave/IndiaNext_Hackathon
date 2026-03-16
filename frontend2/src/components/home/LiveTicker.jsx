import { useState, useEffect } from 'react';

const MESSAGES = [
  'LIVE · Phishing URL blocked · 2s ago',
  'LIVE · Deepfake image detected · 9s ago',
  'LIVE · Prompt injection blocked · 16s ago',
  'LIVE · Malicious email quarantined · 24s ago',
  'LIVE · Suspicious domain flagged · 33s ago'
];

export default function LiveTicker() {
  const [index, setIndex] = useState(0);
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    const interval = setInterval(() => {
      setOpacity(0);
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % MESSAGES.length);
        setOpacity(1);
      }, 350);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div 
      className="absolute top-[80px] left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 px-3.5 py-1 rounded-full whitespace-nowrap font-jetbrains text-[9px] tracking-[0.1em] pointer-events-none bg-red-500/10 border border-red-500/20 text-red-300/80 transition-opacity duration-300"
      style={{ opacity }}
    >
      <span>●</span>
      <span>{MESSAGES[index]}</span>
    </div>
  );
}
