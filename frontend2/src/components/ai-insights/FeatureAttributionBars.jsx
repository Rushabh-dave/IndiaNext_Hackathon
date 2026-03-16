import { useState, useEffect } from 'react';

export default function FeatureAttributionBars({ threatFeature = 0, legitFeature = 0 }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 150);
    return () => clearTimeout(timer);
  }, []);

  const maxFeature = Math.max(threatFeature, legitFeature, 0.01);
  const threatWidth = `${(threatFeature / maxFeature) * 100}%`;
  const legitWidth = `${(legitFeature / maxFeature) * 100}%`;

  return (
    <div className="bg-[#0f172a]/60 border border-white/5 rounded-xl p-5 backdrop-blur-md">
       <div className="font-jetbrains text-[12px] text-slate-400 uppercase tracking-widest mb-4">Feature Attribution</div>
       
       <div className="space-y-5">
         {/* Threat Influencers */}
         <div>
           <div className="flex justify-between items-center mb-2 font-jetbrains text-[11px] tracking-wider">
             <span className="text-slate-300 uppercase">Threat Signals</span>
             <span className="text-[#e24b4a] font-bold">+{threatFeature.toFixed(2)}</span>
           </div>
           <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
             <div 
               className="h-full bg-[#e24b4a] transition-all duration-1000 delay-300 ease-out shadow-[0_0_10px_#e24b4a50]"
               style={{ width: mounted ? threatWidth : '0%' }}
             />
           </div>
         </div>

         {/* Legit Influencers */}
         <div>
           <div className="flex justify-between items-center mb-2 font-jetbrains text-[11px] tracking-wider">
             <span className="text-slate-300 uppercase">Legitimate Signals</span>
             <span className="text-[#1d9e75] font-bold">-{legitFeature.toFixed(2)}</span>
           </div>
           <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
             <div 
               className="h-full bg-[#1d9e75] transition-all duration-1000 delay-500 ease-out shadow-[0_0_10px_#1d9e7550]"
               style={{ width: mounted ? legitWidth : '0%' }}
             />
           </div>
         </div>
       </div>
    </div>
  );
}
