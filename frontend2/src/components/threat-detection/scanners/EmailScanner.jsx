import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail } from 'lucide-react';
import DetectionCard from '../DetectionCard';
import { apiService } from '../../../services/apiService';

export default function EmailScanner() {
  const [sender, setSender] = useState('');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const validateEmail = (email) => {
    return String(email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );
  };

  const handleAnalyze = async () => {
    setError('');
    if (!sender || !subject || !content) {
      setError('All fields are necessary. Please enter sender, subject, and content.');
      return;
    }
    if (sender && !validateEmail(sender)) {
      setError('Please enter a valid email address format.');
      return;
    }

    setIsAnalyzing(true);
    try {
      const res = await apiService.scanEmail({ sender, subject, content });
      navigate('/dashboard', { state: { result: res, type: 'Email', input: subject || sender } });
    } catch (err) {
      navigate('/dashboard', { state: { result: { error: 'Failed' }, type: 'Email', input: subject || sender } });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <DetectionCard
      title="Phishing Email Detection"
      icon={<Mail size={24} />}
      color="#3b82f6" // Blue
      onAnalyze={handleAnalyze}
      isAnalyzing={isAnalyzing}
      actionText="ANALYZE EMAIL"
    >
      <div className="space-y-4">
        <input
          type="text"
          placeholder="Sender Email (e.g., admin@paypal-verify.com)"
          value={sender}
          onChange={(e) => setSender(e.target.value)}
          className="w-full bg-[#080514] border border-white/10 rounded-xl py-4 px-5 text-slate-200 font-jetbrains text-[13px] outline-none focus:border-[#3b82f6]/50 transition-colors"
        />
        <input
          type="text"
          placeholder="Subject Line"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="w-full bg-[#080514] border border-white/10 rounded-xl py-4 px-5 text-slate-200 font-jetbrains text-[13px] outline-none focus:border-[#3b82f6]/50 transition-colors"
        />
        <textarea
          placeholder="Paste full email body content..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={6}
          className="w-full bg-[#080514] border border-white/10 rounded-xl py-4 px-5 text-slate-200 font-jetbrains text-[13px] outline-none focus:border-[#3b82f6]/50 transition-colors resize-none"
        />
        {error && <div className="text-red-500 font-jetbrains text-[12px] mt-2 animate-pulse">{error}</div>}
      </div>
    </DetectionCard>
  );
}
