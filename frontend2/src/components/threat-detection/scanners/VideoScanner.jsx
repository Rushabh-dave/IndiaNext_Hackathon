import { VideoOff } from 'lucide-react';
import DetectionCard from '../DetectionCard';

export default function VideoScanner() {
  return (
    <DetectionCard
      title="Video Deepfake Detection"
      icon={<VideoOff size={24} />}
      color="#6366f1"
      onAnalyze={() => {}}
      isAnalyzing={false}
      actionText="NOT AVAILABLE"
      disabled
    >
      <div className="flex flex-col items-center justify-center h-48 gap-5 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#6366f1]/10 border border-[#6366f1]/30 flex items-center justify-center">
          <VideoOff className="w-8 h-8 text-[#6366f1]" />
        </div>
        <div>
          <p className="font-orbitron font-bold text-[15px] tracking-widest text-slate-200 uppercase mb-2">
            Coming Soon
          </p>
          <p className="font-jetbrains text-[12px] text-slate-500 max-w-xs leading-relaxed">
            Video deepfake detection is in active development.<br />
            Use <span className="text-[#ec4899]">Image</span> or <span className="text-[#14b8a6]">Audio</span> scanner for media analysis.
          </p>
        </div>
      </div>
    </DetectionCard>
  );
}
