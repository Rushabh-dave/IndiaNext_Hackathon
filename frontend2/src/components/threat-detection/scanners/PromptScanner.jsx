import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, Terminal } from 'lucide-react';
import DetectionCard from '../DetectionCard';
import { apiService } from '../../../services/apiService';

export default function PromptScanner() {
  const [prompt, setPrompt] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleAnalyze = async () => {
    setError('');
    if (!prompt) {
      setError('This field is necessary. Please enter a prompt.');
      return;
    }
    setIsAnalyzing(true);
    try {
      const res = await apiService.scanPrompt(prompt);
      navigate('/dashboard', { state: { result: res, type: 'Prompt Injection', input: prompt } });
    } catch (err) {
      navigate('/dashboard', { state: { result: { error: 'Failed' }, type: 'Prompt Injection', input: prompt } });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <DetectionCard
      title="Prompt Injection Detection"
      icon={<Bot size={24} />}
      color="#d946ef" // Fuchsia
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
        {error && <div className="text-red-500 font-jetbrains text-[12px] mt-2 animate-pulse">{error}</div>}
      </div>
    </DetectionCard>
  );
}
