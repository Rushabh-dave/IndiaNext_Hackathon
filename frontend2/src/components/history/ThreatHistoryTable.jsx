import { Globe, Mail, ShieldAlert } from 'lucide-react';

export default function ThreatHistoryTable() {
  const historyData = [
    { type: 'URL', icon: Globe, threat: 'Phishing URL', risk: 87, confidence: 91, timestamp: 'Mar 16, 10:22 AM', color: '#0ea5e9' },
    { type: 'EMAIL', icon: Mail, threat: 'Phishing Email', risk: 92, confidence: 95, timestamp: 'Mar 16, 09:45 AM', color: '#f59e0b' },
    { type: 'URL', icon: Globe, threat: 'Malicious URL', risk: 64, confidence: 78, timestamp: 'Mar 16, 08:30 AM', color: '#0ea5e9' },
    { type: 'EMAIL', icon: Mail, threat: 'Phishing Email', risk: 78, confidence: 88, timestamp: 'Mar 15, 05:15 PM', color: '#f59e0b' },
    { type: 'URL', icon: Globe, threat: 'Phishing URL', risk: 95, confidence: 97, timestamp: 'Mar 15, 02:08 PM', color: '#0ea5e9' },
    { type: 'EMAIL', icon: Mail, threat: 'Phishing Email', risk: 43, confidence: 62, timestamp: 'Mar 15, 11:28 AM', color: '#f59e0b' },
  ];

  return (
    <div className="w-full bg-[#0f172a]/60 backdrop-blur-lg border border-white/10 rounded-xl overflow-hidden shadow-2xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10 uppercase font-jetbrains text-[9px] tracking-[0.2em] text-slate-500 bg-white/5">
              <th className="px-6 py-4 font-bold">TYPE</th>
              <th className="px-6 py-4 font-bold">THREAT</th>
              <th className="px-6 py-4 font-bold text-center">RISK</th>
              <th className="px-6 py-4 font-bold">CONFIDENCE</th>
              <th className="px-6 py-4 font-bold text-right">TIMESTAMP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {historyData.map((row, idx) => {
               // Risk styling
               let riskColor = '#22c55e'; // green
               let riskBg = 'bg-green-500/10 border-green-500/20';
               if (row.risk > 75) { riskColor = '#ef4444'; riskBg = 'bg-red-500/10 border-red-500/20'; } // red
               else if (row.risk > 40) { riskColor = '#f59e0b'; riskBg = 'bg-yellow-500/10 border-yellow-500/20'; } // yellow

               return (
                 <tr key={idx} className="hover:bg-white/5 transition-colors group">
                   
                   {/* Column: TYPE */}
                   <td className="px-6 py-4 whitespace-nowrap">
                     <span 
                       className="font-jetbrains text-[10px] tracking-widest font-bold uppercase flex items-center gap-2"
                       style={{ color: row.color }}
                     >
                        <row.icon className="w-3.5 h-3.5" />
                        {row.type}
                     </span>
                   </td>

                   {/* Column: THREAT */}
                   <td className="px-6 py-4 whitespace-nowrap">
                     <span className="font-inter text-[13px] text-slate-200 font-medium tracking-wide">
                        {row.threat}
                     </span>
                   </td>

                   {/* Column: RISK BADGE */}
                   <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className={`inline-flex items-center justify-center border rounded px-2.5 py-1 ${riskBg}`}>
                         <div className="w-1.5 h-1.5 rounded-full mr-2" style={{ backgroundColor: riskColor, boxShadow: `0 0 6px ${riskColor}` }} />
                         <span className="font-jetbrains text-[10px] font-bold" style={{ color: riskColor }}>
                            {row.risk}
                         </span>
                      </div>
                   </td>

                   {/* Column: CONFIDENCE */}
                   <td className="px-6 py-4 whitespace-nowrap w-48">
                      <div className="flex items-center gap-3">
                         <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-[#0ea5e9] transition-all" style={{ width: `${row.confidence}%` }} />
                         </div>
                         <span className="font-jetbrains text-[10px] text-slate-400 min-w-[32px]">{row.confidence}%</span>
                      </div>
                   </td>

                   {/* Column: TIMESTAMP */}
                   <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className="font-jetbrains text-[11px] text-slate-500 tracking-wider group-hover:text-slate-400 transition-colors">
                         {row.timestamp}
                      </span>
                   </td>

                 </tr>
               )
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
