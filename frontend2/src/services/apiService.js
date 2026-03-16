import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Raw API calls ───────────────────────────────────────────────────────────

export const apiService = {

  // POST /analyze/phishing  { body, sender?, subject? }
  analyzePhishing: async ({ body, sender = '', subject = '' }) => {
    const response = await api.post('/analyze/phishing', { body, sender, subject });
    return response.data;
  },

  // POST /analyze/url  { text: <url string> }
  analyzeUrl: async (url) => {
    const response = await api.post('/analyze/url', { text: url });
    return response.data;
  },

  // POST /analyze/deepfake  (multipart/form-data, field: file)
  analyzeDeepfakeImage: async (imageFile) => {
    const formData = new FormData();
    formData.append('file', imageFile);
    const response = await api.post('/analyze/deepfake', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // POST /analyze/deepfake-audio  (multipart/form-data, field: file)
  analyzeDeepfakeAudio: async (audioFile) => {
    const formData = new FormData();
    formData.append('file', audioFile);
    const response = await api.post('/analyze/deepfake-audio', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // POST /analyze/prompt-injection  { text }
  analyzePromptInjection: async (text) => {
    const response = await api.post('/analyze/prompt-injection', { text });
    return response.data;
  },

  // POST /analyze/temporal  {}
  runTemporalAnalysis: async (windowSeconds = 300) => {
    const response = await api.post('/analyze/temporal', { window_seconds: windowSeconds });
    return response.data;
  },

  // GET /alerts/window
  getAlertWindow: async () => {
    const response = await api.get('/alerts/window');
    return response.data;
  },

  // DELETE /alerts/reset
  resetAlerts: async () => {
    const response = await api.delete('/alerts/reset');
    return response.data;
  },

  // GET /health
  getHealth: async () => {
    const response = await api.get('/health');
    return response.data;
  },
};

// ─── Response Normalizer ─────────────────────────────────────────────────────
// Converts any raw backend response into a consistent shape used by ThreatDashboard

export function normalizeResult(raw, scanType) {
  if (!raw || raw.error) {
    return {
      verdict: 'ERROR',
      severity: 'UNKNOWN',
      threat_score: 0,
      score: 0,
      confidence: 0,
      threatName: 'Connection Error',
      isSafe: false,
      indicators: ['Could not reach the analysis server. Is it running on port 8000?'],
      recommendations: 'Check that the AEGIS backend is running: uvicorn main:app --port 8000',
      mitre_technique: null,
      shap: null,
      raw,
    };
  }

  // ── Common fields ──
  const verdict = raw.verdict || 'UNKNOWN';
  const isSafe = verdict === 'SAFE' || verdict === 'AUTHENTIC' || verdict === 'AUTHENTIC_AUDIO';
  const severity = raw.severity || (isSafe ? 'LOW' : 'HIGH');
  const rawScore = raw.threat_score ?? 0;
  const score = Math.round(rawScore * 100); // 0→1 float to 0→100 int
  const confidence = Math.round((raw.confidence ?? rawScore) * 100);
  const mitre = raw.mitre_technique || null;

  // ── Human-readable threat name ──
  const threatNameMap = {
    THREAT: 'Phishing / Malicious Threat Detected',
    SAFE: 'No Threat Detected',
    DEEPFAKE_DETECTED: 'AI-Generated Deepfake Detected',
    AUTHENTIC: 'Authentic Image',
    FAKE_AUDIO_DETECTED: 'AI-Generated / Voice-Cloned Audio Detected',
    AUTHENTIC_AUDIO: 'Authentic Audio',
  };
  const threatName = threatNameMap[verdict] || raw.predicted_label || verdict;

  // ── Build indicators list ──
  const indicators = [];

  if (raw.explanation) indicators.push(raw.explanation);

  // Phishing/URL: all_scores breakdown
  if (raw.all_scores) {
    Object.entries(raw.all_scores).forEach(([label, prob]) => {
      if (typeof prob === 'number' && prob > 0.05) {
        indicators.push(`${label.replace(/_/g, ' ')}: ${(prob * 100).toFixed(1)}% probability`);
      }
    });
  }

  // Phishing: sender analysis
  if (raw.sender_analysis && Array.isArray(raw.sender_analysis)) {
    raw.sender_analysis.forEach(s => { if (s && s !== 'Sender address looks clean') indicators.push(s); });
  }

  // MITRE technique indicator
  if (mitre) indicators.push(`MITRE ATT&CK: ${mitre}`);

  // Deepfake: predicted label + confidence
  if (raw.predicted_label) indicators.push(`Model label: ${raw.predicted_label}`);
  if (raw.duration_seconds) indicators.push(`Audio duration analyzed: ${raw.duration_seconds}s @ ${raw.sample_rate_used || 16000} Hz`);
  if (raw.domain_analyzed) indicators.push(`Domain analyzed: ${raw.domain_analyzed}`);

  // Prompt injection: detected tactics
  if (raw.shap?.detected_tactics?.length > 0) {
    raw.shap.detected_tactics.forEach(t => {
      indicators.push(`Injection tactic: ${t.tactic.replace(/_/g, ' ')} ("${t.matched_phrase}")`);
    });
  }

  if (indicators.length === 0) {
    indicators.push(isSafe ? 'No malicious patterns detected.' : 'Anomalous patterns detected by AI model.');
  }

  // ── Normalize SHAP into component-ready shape ─────────────────────────────
  // Backend returns: prediction_deviation as float (e.g. 0.7438), direction as
  // 'more suspicious'/'more malicious', URL uses background_domain not background_text.
  // Components expect: deviation as "+74.4%" string, direction as 'higher risk'/'lower risk',
  // top_contrastive_samples with background_text.
  let shapNormalized = null;
  if (raw.shap && !raw.shap.error) {
    const s = raw.shap;

    // Convert float deviation → percentage string
    let deviationStr = s.prediction_deviation;
    if (typeof deviationStr === 'number') {
      deviationStr = (deviationStr >= 0 ? '+' : '') + (deviationStr * 100).toFixed(1) + '%';
    }

    // Pick the probability field (varies per scan type)
    const modelProb =
      s.model_phishing_prob ??
      s.model_malicious_prob ??
      s.model_injection_prob ??
      s.model_deepfake_prob ??
      rawScore;

    // URL uses shap_feature_benign instead of shap_feature_legit
    const shapLegit  = s.shap_feature_legit  ?? s.shap_feature_benign ?? 0;
    const shapThreat = s.shap_feature_threat  ?? 0;

    // Normalize contrastive samples
    const normalizedSamples = (s.top_contrastive_samples || []).map(sample => ({
      background_text: sample.background_text || sample.background_domain || sample.background_prompt || '(no text)',
      delta: sample.delta ?? 0,
      direction: (() => {
        const d = (sample.direction || '').toLowerCase();
        if (d.includes('more') || d.includes('suspicious') || d.includes('malicious') || d.includes('injection')) {
          return 'higher risk';
        }
        return 'lower risk';
      })(),
    }));

    shapNormalized = {
      model_phishing_prob:      modelProb,
      base_value:               s.base_value ?? 0.15,
      prediction_deviation:     deviationStr || '—',
      shap_feature_threat:      shapThreat,
      shap_feature_legit:       shapLegit,
      interpretation:           s.interpretation || '',
      top_contrastive_samples:  normalizedSamples,
      detected_tactics:         s.detected_tactics || [],
    };
  }

  return {
    verdict,
    severity,
    threat_score: rawScore,
    score,
    confidence,
    threatName,
    isSafe,
    indicators,
    recommendations: raw.recommended_action || (isSafe ? 'No action required.' : 'Review immediately and take the recommended steps.'),
    mitre_technique: mitre,
    shap: shapNormalized,
    raw,
  };
}

