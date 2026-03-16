import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'lucide-react';
import DetectionCard from '../DetectionCard';
import { apiService, normalizeResult } from '../../../services/apiService';

export default function URLScanner() {
  const [url, setUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleAnalyze = async () => {
    setError('');
    if (!url.trim()) {
      setError('This field is required. Please enter a URL.');
      return;
    }
    setIsAnalyzing(true);
    try {
      const raw = await apiService.analyzeUrl(url.trim());
      const result = normalizeResult(raw, 'URL');
      navigate('/dashboard', { state: { result, type: 'Malicious URL', input: url, scanType: 'url' } });
    } catch (err) {
      const errMsg = err?.response?.data?.detail || err.message || 'Connection failed';
      setError(`Analysis failed: ${errMsg}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <DetectionCard
      title="Suspicious URL Scanner"
      icon={<Link size={24} />}
      color="#22c55e"
      onAnalyze={handleAnalyze}
      isAnalyzing={isAnalyzing}
      actionText="SCAN URL"
    >
      <div className="flex flex-col gap-2 h-full flex-grow">
        <input
          type="text"
          placeholder="https://suspicious-login-portal.site/auth"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="w-full bg-[#080514] border border-white/10 rounded-xl py-6 px-6 text-slate-200 font-jetbrains text-[18px] outline-none focus:border-[#22c55e]/50 transition-colors"
        />
        {error && <div className="text-red-400 font-jetbrains text-[12px] animate-pulse">{error}</div>}
      </div>
    </DetectionCard>
  );
}
