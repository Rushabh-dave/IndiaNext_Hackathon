import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, UploadCloud } from 'lucide-react';
import DetectionCard from '../DetectionCard';
import { apiService, normalizeResult } from '../../../services/apiService';

export default function AudioScanner() {
  const [file, setFile] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    setError('');
    if (e.target.files?.[0]) setFile(e.target.files[0]);
  };

  const handleAnalyze = async () => {
    setError('');
    if (!file) { setError('Please select an audio file.'); return; }
    setIsAnalyzing(true);
    try {
      const raw = await apiService.analyzeDeepfakeAudio(file);
      const result = normalizeResult(raw, 'Audio');
      navigate('/dashboard', { state: { result, type: 'Deepfake Audio', input: file.name } });
    } catch (err) {
      const errMsg = err?.response?.data?.detail || err.message || 'Connection failed';
      setError(`Analysis failed: ${errMsg}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <DetectionCard
      title="Deepfake Audio Detection"
      icon={<Mic size={24} />}
      color="#14b8a6"
      onAnalyze={handleAnalyze}
      isAnalyzing={isAnalyzing}
      actionText="ANALYZE AUDIO"
    >
      <div
        className="w-full h-48 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors bg-[#080514]/50 group"
        style={{ borderColor: file ? '#14b8a6' : 'rgba(255,255,255,0.1)' }}
        onClick={() => fileInputRef.current?.click()}
      >
        <input type="file" ref={fileInputRef} className="hidden" accept=".wav,.mp3,.flac,.ogg,.m4a" onChange={handleFileChange} />
        {file ? (
          <div className="text-center">
            <div className="w-12 h-12 rounded-lg bg-[#14b8a6]/20 flex items-center justify-center mx-auto mb-3">
              <Mic className="text-[#14b8a6] w-6 h-6" />
            </div>
            <p className="font-jetbrains text-[13px] text-slate-200">{file.name}</p>
            <p className="font-jetbrains text-[10px] text-slate-500 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
          </div>
        ) : (
          <div className="text-center group-hover:scale-105 transition-transform">
            <UploadCloud className="w-10 h-10 text-slate-500 mx-auto mb-3" />
            <p className="font-orbitron text-[14px] text-slate-300 font-bold tracking-widest uppercase">Upload Audio Source</p>
            <p className="font-jetbrains text-[11px] text-slate-500 mt-2">WAV, MP3, FLAC, OGG, M4A up to 25MB</p>
          </div>
        )}
      </div>
      {error && <div className="text-red-400 font-jetbrains text-[12px] mt-3 animate-pulse text-center">{error}</div>}
    </DetectionCard>
  );
}
