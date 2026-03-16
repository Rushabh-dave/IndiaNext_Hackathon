import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Video, UploadCloud } from 'lucide-react';
import DetectionCard from '../DetectionCard';
import { apiService } from '../../../services/apiService';

export default function VideoScanner() {
  const [file, setFile] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    setError('');
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleAnalyze = async () => {
    setError('');
    if (!file) {
      setError('This field is necessary. Please select a video.');
      return;
    }
    setIsAnalyzing(true);
    try {
      const res = await apiService.scanVideo(file);
      navigate('/dashboard', { state: { result: res, type: 'Video', input: file.name } });
    } catch (err) {
      navigate('/dashboard', { state: { result: { error: 'Failed' }, type: 'Video', input: file.name } });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <DetectionCard
      title="Deepfake Video Detection"
      icon={<Video size={24} />}
      color="#8b5cf6" // Purple
      onAnalyze={handleAnalyze}
      isAnalyzing={isAnalyzing}
      actionText="ANALYZE VIDEO"
    >
      <div
        className="w-full h-48 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors bg-[#080514]/50 group"
        style={{ borderColor: file ? '#8b5cf6' : 'rgba(255,255,255,0.1)' }}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="video/*"
          onChange={handleFileChange}
        />
        {file ? (
          <div className="text-center">
            <div className="w-12 h-12 rounded-lg bg-[#8b5cf6]/20 flex items-center justify-center mx-auto mb-3">
              <Video className="text-[#8b5cf6] w-6 h-6" />
            </div>
            <p className="font-jetbrains text-[13px] text-slate-200">{file.name}</p>
            <p className="font-jetbrains text-[10px] text-slate-500 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
          </div>
        ) : (
          <div className="text-center group-hover:scale-105 transition-transform">
            <UploadCloud className="w-10 h-10 text-slate-500 mx-auto mb-3" />
            <p className="font-orbitron text-[14px] text-slate-300 font-bold tracking-widest uppercase">Upload Video File</p>
            <p className="font-jetbrains text-[11px] text-slate-500 mt-2">MP4, MOV up to 100MB</p>
          </div>
        )}
      </div>
      {error && <div className="text-red-500 font-jetbrains text-[12px] mt-3 animate-pulse text-center w-full">{error}</div>}
    </DetectionCard>
  );
}
