# 🛡️ PhishEye — AI-Powered Cyber Threat Detection Platform

PhishEye is a full-stack cybersecurity intelligence platform built for the IndiaNext Hackathon. It uses state-of-the-art AI models to detect phishing emails, malicious URLs, prompt injection attacks, deepfake images, and AI-generated audio — all in real time from a single, premium web interface.

---

## 🚀 Live Demo

| Service | URL |
|---|---|
| **Frontend** | Deployed on Vercel |
| **Backend API** | [https://indianext-hackathon.onrender.com](https://indianext-hackathon.onrender.com) |
| **API Health** | [https://indianext-hackathon.onrender.com/health](https://indianext-hackathon.onrender.com/health) |

> ⚠️ The backend runs on Render's free tier. The first request after 15 minutes of inactivity may take **30–60 seconds** to respond (cold start). Subsequent requests are fast.

---

## ✨ Features

### 🔍 Threat Detection Modules
- **Phishing Email Detection** — Analyzes email body, sender, and subject line using a fine-tuned DistilBERT model
- **Malicious URL Scanner** — Classifies URLs as benign or malicious using domain-level NLP analysis
- **Prompt Injection Detection** — Identifies adversarial prompts designed to hijack LLM behavior (DeBERTa-v3)
- **Deepfake Image Detection** — Uses a Vision Transformer (ViT) to detect AI-generated or manipulated faces
- **Deepfake Audio Detection** — Detects AI-generated / voice-cloned audio using wav2vec2-base
- **Video Scanner** *(Coming Soon)* — Placeholder for future video deepfake detection

### 📊 Intelligence Dashboard
- Real-time **Cyber Risk Score** gauge (0–100) with animated SVG
- MITRE ATT&CK technique attribution for every detected threat
- SHAP explainability panel showing what features drove the AI decision
- Temporal fusion analysis — detects multi-stage attack kill chains over a sliding 5-minute window
- AI-generated attacker/defender narrative summaries

### 📜 Threat History
- Live alert window feed auto-refreshed every 15 seconds
- Average risk score bar and worst-severity card
- Full alert history table with timestamps, types, and scores

### 🧠 AI Insights Page
- Defender perspective: SHAP feature attribution bars and contrastive samples
- Attacker perspective: detected MITRE tactics and adversarial analysis
- Temporal perspective: kill chain visualization, timeline, and time-to-impact card

---

## 🧰 Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| **React 18** | UI framework with hooks |
| **Vite 7** | Build tooling with HMR |
| **Tailwind CSS v4** | Utility-first styling |
| **Framer Motion** | Animated transitions and carousel |
| **Axios** | HTTP client with interceptors |
| **React Router v6** | SPA routing |
| **Lucide React** | Icon library |
| **Three.js / Canvas** | 3D shield hero + cyber grid backgrounds |

### Backend
| Technology | Purpose |
|---|---|
| **FastAPI** | High-performance Python API |
| **HuggingFace Transformers** | DistilBERT, DeBERTa, ViT, wav2vec2 models |
| **PyTorch** | Model inference |
| **librosa** | Audio pre-processing |
| **Pillow** | Image pre-processing |
| **SHAP** | Model explainability |
| **Docker** | Containerized deployment |

---

## 📁 Project Structure

```
frontend2/
├── public/                  # Static assets (icons, favicon)
├── src/
│   ├── components/
│   │   ├── threat-detection/
│   │   │   └── scanners/    # EmailScanner, URLScanner, ImageScanner, AudioScanner, PromptScanner, VideoScanner
│   │   ├── dashboard/       # SHAPExplainabilityPanel
│   │   ├── ai-insights/     # SHAP bars, contrastive comparison, attacker/defender panels
│   │   ├── temporal/        # KillChainVisualizer, TemporalMetricsGrid, TemporalNarrative
│   │   ├── history/         # ThreatHistoryTable, HistoryStatCards, AverageRiskBar
│   │   ├── home/            # HeroSection, ThreatMeter, ThreatCards, LiveTicker
│   │   ├── Sidebar.jsx      # Global navigation sidebar
│   │   └── Navbar.jsx       # Top navigation bar
│   ├── pages/
│   │   ├── Home.jsx                # Landing page with live threat meter
│   │   ├── ThreatDetectionPage.jsx # Multi-scanner carousel hub
│   │   ├── ThreatDashboard.jsx     # Post-scan results dashboard
│   │   ├── AIInsightsPage.jsx      # SHAP & temporal insights
│   │   └── ThreatHistoryPage.jsx   # Alert history feed
│   ├── services/
│   │   ├── apiService.js    # Centralized Axios client — reads VITE_API_BASE_URL
│   │   └── healthCheck.js   # Backend connectivity polling with retry logic
│   └── utils/
│       └── colors.js        # Threat color gradient utilities
├── .env                     # Local environment variables (NOT committed)
├── vercel.json              # Vercel SPA rewrite rules
└── vite.config.js           # Vite configuration
```

---

## ⚙️ Environment Variables

All API connections are configured through environment variables. **Never hardcode backend URLs.**

### `.env` (local development)
```env
VITE_API_BASE_URL=https://indianext-hackathon.onrender.com
```

### Vercel (production deployment)
1. Go to Vercel Dashboard → your project → **Settings → Environment Variables**
2. Add:

| Name | Value |
|---|---|
| `VITE_API_BASE_URL` | `https://indianext-hackathon.onrender.com` |

3. Set it for **Production**, **Preview**, and **Development**
4. **Redeploy** — the env var is baked in at build time by Vite

> If `VITE_API_BASE_URL` is missing on Vercel, all API calls will fail with a **Network Error** since `import.meta.env.VITE_API_BASE_URL` resolves to `undefined`.

---

## 🏁 Local Development Setup

### Prerequisites
- Node.js 18+
- npm or pnpm
- Python 3.10+ (for backend)

### 1. Clone the repository
```bash
git clone https://github.com/your-org/IndiaNext_Hackathon.git
cd IndiaNext_Hackathon
```

### 2. Set up the frontend
```bash
cd frontend2
npm install
```

Create a `.env` file:
```env
VITE_API_BASE_URL=https://indianext-hackathon.onrender.com
```

Start the dev server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### 3. Set up the backend (optional — for local inference)
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Then update `.env`:
```env
VITE_API_BASE_URL=http://localhost:8000
```

---

## 🌐 Backend API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/analyze/phishing` | Phishing email detection (body, sender, subject) |
| `POST` | `/analyze/url` | Malicious URL detection |
| `POST` | `/analyze/prompt-injection` | Prompt injection detection |
| `POST` | `/analyze/deepfake` | Deepfake image detection (multipart file) |
| `POST` | `/analyze/deepfake-audio` | Deepfake audio detection (multipart file) |
| `POST` | `/analyze/temporal` | Temporal fusion kill-chain analysis |
| `GET` | `/alerts/window` | Fetch current alert sliding window |
| `DELETE` | `/alerts/reset` | Clear the alert window |
| `GET` | `/health` | Server health + model load status |

---

## 🤖 AI Models Used

| Detector | Model | Source |
|---|---|---|
| Phishing Email | `cybersectony/phishing-email-detection-distilbert_v2.1` | HuggingFace |
| Malicious URL | `kmack/malicious-url-detection` | HuggingFace |
| Prompt Injection | `protectai/deberta-v3-base-prompt-injection-v2` | HuggingFace |
| Deepfake Image | `prithivMLmods/Deep-Fake-Detector-v2-Model` | HuggingFace |
| Deepfake Audio | `motheecreator/Deepfake-audio-detection` | HuggingFace |

---

## 🚢 Deployment

### Frontend → Vercel
- **Framework**: Vite
- **Build command**: `npm run build`
- **Output directory**: `dist`
- **Required env var**: `VITE_API_BASE_URL`
- `vercel.json` handles SPA routing with a catch-all rewrite to `index.html`

### Backend → Render
- **Runtime**: Python 3.10
- **Start command**: `uvicorn main:app --host 0.0.0.0 --port 10000`
- CORS is open (`allow_origins=["*"]`) so any frontend origin can connect
- Models load **lazily** on first request to keep startup fast
- Free tier spins down after 15 min of inactivity — first cold-start takes ~60s

---

## 👥 Team

Built for the **IndiaNext Hackathon** — a cybersecurity AI challenge to build real-time threat detection systems using modern AI/ML techniques.

---

## 📄 License

This project is built for hackathon demonstration purposes.

