import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Image as ImageIcon, UploadCloud } from 'lucide-react';
import DetectionCard from '../DetectionCard';
import { apiService, normalizeResult } from '../../../services/apiService';

export default function ImageScanner() {
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
    if (!file) { setError('Please select an image file.'); return; }
    setIsAnalyzing(true);
    try {
      const raw = await apiService.analyzeDeepfakeImage(file);
      const result = normalizeResult(raw, 'Image');
      navigate('/dashboard', { state: { result, type: 'Deepfake Image', input: file.name } });
    } catch (err) {
      const errMsg = err?.response?.data?.detail || err.message || 'Connection failed';
      setError(`Analysis failed: ${errMsg}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <DetectionCard
      title="Fake Image Detection"
      icon={<ImageIcon size={24} />}
      color="#ec4899"
      onAnalyze={handleAnalyze}
      isAnalyzing={isAnalyzing}
      actionText="ANALYZE IMAGE"
    >
      <div
        className="w-full h-48 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors bg-[#080514]/50 group"
        style={{ borderColor: file ? '#ec4899' : 'rgba(255,255,255,0.1)' }}
        onClick={() => fileInputRef.current?.click()}
      >
        <input type="file" ref={fileInputRef} className="hidden" accept=".jpg,.jpeg,.png,.webp,.bmp" onChange={handleFileChange} />
        {file ? (
          <div className="text-center">
            <div className="w-12 h-12 rounded-lg bg-[#ec4899]/20 flex items-center justify-center mx-auto mb-3">
              <ImageIcon className="text-[#ec4899] w-6 h-6" />
            </div>
            <p className="font-jetbrains text-[13px] text-slate-200">{file.name}</p>
            <p className="font-jetbrains text-[10px] text-slate-500 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
          </div>
        ) : (
          <div className="text-center group-hover:scale-105 transition-transform">
            <UploadCloud className="w-10 h-10 text-slate-500 mx-auto mb-3" />
            <p className="font-orbitron text-[14px] text-slate-300 font-bold tracking-widest uppercase">Select Image to Scan</p>
            <p className="font-jetbrains text-[11px] text-slate-500 mt-2">JPG, PNG, WEBP, BMP up to 10MB</p>
          </div>
        )}
      </div>
      {error && <div className="text-red-400 font-jetbrains text-[12px] mt-3 animate-pulse text-center">{error}</div>}
    </DetectionCard>
  );
}
