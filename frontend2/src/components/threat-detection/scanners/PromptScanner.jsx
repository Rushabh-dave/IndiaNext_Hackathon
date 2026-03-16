import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, Terminal } from 'lucide-react';
import DetectionCard from '../DetectionCard';
import { apiService, normalizeResult } from '../../../services/apiService';

export default function PromptScanner() {
  const [prompt, setPrompt] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleAnalyze = async () => {
    setError('');
    if (!prompt.trim()) {
      setError('Please enter a prompt to analyze.');
      return;
    }
    setIsAnalyzing(true);
    try {
      const raw = await apiService.analyzePromptInjection(prompt.trim());
      const result = normalizeResult(raw, 'Prompt Injection');
      navigate('/dashboard', { state: { result, type: 'Prompt Injection', input: prompt.slice(0, 80) } });
    } catch (err) {
      const errMsg = err?.response?.data?.detail || err.message || 'Connection failed';
      setError(`Analysis failed: ${errMsg}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <DetectionCard
      title="Prompt Injection Detection"
      icon={<Bot size={24} />}
      color="#d946ef"
      onAnalyze={handleAnalyze}
      isAnalyzing={isAnalyzing}
      actionText="CHECK PROMPT"
    >
      <div className="relative">
        <div className="absolute left-4 top-5 text-slate-500">
          <Terminal size={18} />
        </div>
        <textarea
          placeholder="Paste input prompt designed for an LLM..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={5}
          className="w-full bg-[#080514] border border-white/10 rounded-xl py-5 pl-12 pr-5 text-slate-200 font-jetbrains text-[14px] outline-none focus:border-[#d946ef]/50 transition-colors resize-none"
        />
        {error && <div className="text-red-400 font-jetbrains text-[12px] mt-2 animate-pulse">{error}</div>}
      </div>
    </DetectionCard>
  );
}
