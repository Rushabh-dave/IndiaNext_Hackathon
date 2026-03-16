import { ShieldCheck, AlertTriangle, Eye, ShieldAlert } from 'lucide-react';

export default function DefenderRecommendations() {
  const recommendations = [
    { icon: AlertTriangle, text: "Do not click any embedded links or download attachments.", color: "text-[#ef9f27]" },
    { icon: Eye, text: "Verify the sender domain matches official organizational records.", color: "text-[#3b82f6]" },
    { icon: ShieldAlert, text: "Report this attempt directly to the Security Operations Center (SOC).", color: "text-[#e24b4a]" },
  ];

  return (
    <div className="bg-[#0f172a]/80 border border-[#1d9e75]/30 rounded-xl p-6 shadow-[0_0_20px_rgba(29,158,117,0.05)] relative overflow-hidden">
      <div className="absolute top-0 right-0 w-40 h-40 bg-[#1d9e75]/10 blur-[50px] pointer-events-none" />

      <h3 className="font-orbitron font-bold text-[14px] text-[#1d9e75] uppercase tracking-widest mb-5 flex items-center gap-2">
        <ShieldCheck className="w-5 h-5" /> Defender Recommendations
      </h3>

      <div className="space-y-4">
        {recommendations.map((rec, idx) => (
          <div key={idx} className="flex gap-4 items-start bg-black/30 border border-white/5 p-4 rounded-lg">
            <rec.icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${rec.color}`} />
            <p className="font-inter text-slate-300 text-[14px] leading-relaxed">
              {rec.text}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
