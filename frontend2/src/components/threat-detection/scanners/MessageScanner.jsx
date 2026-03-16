import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquareWarning } from 'lucide-react';
import DetectionCard from '../DetectionCard';
import { apiService, normalizeResult } from '../../../services/apiService';

export default function MessageScanner() {
  const [message, setMessage] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleAnalyze = async () => {
    setError('');
    if (!message.trim()) {
      setError('This field is required. Please enter a message.');
      return;
    }
    setIsAnalyzing(true);
    try {
      // Messages go through the phishing model (body-only mode)
      const raw = await apiService.analyzePhishing({ body: message });
      const result = normalizeResult(raw, 'Message');
      navigate('/dashboard', { state: { result, type: 'Malicious Message', input: message.slice(0, 80) } });
    } catch (err) {
      const errMsg = err?.response?.data?.detail || err.message || 'Connection failed';
      setError(`Analysis failed: ${errMsg}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <DetectionCard
      title="Malicious Message Detection"
      icon={<MessageSquareWarning size={24} />}
      color="#f59e0b"
      onAnalyze={handleAnalyze}
      isAnalyzing={isAnalyzing}
      actionText="ANALYZE MESSAGE"
    >
      <div className="flex flex-col gap-2 h-full flex-grow">
        <textarea
          placeholder="Paste suspicious SMS, Telegram, or WhatsApp message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={6}
          className="w-full bg-[#080514] border border-white/10 rounded-xl py-4 px-5 text-slate-200 font-jetbrains text-[14px] outline-none focus:border-[#f59e0b]/50 transition-colors resize-none"
        />
        {error && <div className="text-red-400 font-jetbrains text-[12px] animate-pulse">{error}</div>}
      </div>
    </DetectionCard>
  );
}
