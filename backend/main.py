# main.py
# ─────────────────────────────────────────────────────────────
# AEGIS — Phase 1 + Phase 2 + Phase 3 + Phase 4 + Phase 4b
# v4.4 — Phishing + URL + Prompt Injection + Image Deepfake + Audio Deepfake
#         (lighter wav2vec2-base audio model for deployment)
#
# Endpoints:
#   POST /analyze/phishing          — phishing email detection + SHAP
#   POST /analyze/url               — malicious URL detection + SHAP
#   POST /analyze/prompt-injection  — prompt injection detection + SHAP
#   POST /analyze/deepfake          — deepfake IMAGE detection (ViT)
#   POST /analyze/deepfake-audio    — deepfake AUDIO detection (wav2vec2-base)
#   POST /ingest/alert              — push alert into sliding window
#   POST /analyze/temporal          — temporal fusion analysis
#   GET  /alerts/window             — view current window
#   DELETE /alerts/reset            — clear window
#   GET  /health
# ─────────────────────────────────────────────────────────────

from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, field_validator
from transformers import (
    AutoTokenizer,
    AutoModelForSequenceClassification,
    ViTForImageClassification,
    ViTImageProcessor,
    Wav2Vec2ForSequenceClassification,
    Wav2Vec2FeatureExtractor,
)
from urllib.parse import urlparse
from typing import Optional
from PIL import Image
import torch
import io
import os
import librosa
import numpy as np

from temporal_fusion import (
    AlertInput,
    TemporalAnalysisRequest,
    push_alert,
    get_window_alerts,
    run_temporal_analysis,
    alert_window,
    init_phishing_explainer,
    init_url_explainer,
    init_prompt_injection_explainer,
    init_deepfake_explainer,
    init_audio_explainer,
    explain_phishing_input,
    explain_url_input,
    explain_prompt_injection_input,
    explain_deepfake_input,
    explain_audio_input,
)

app = FastAPI(title="AEGIS Threat Detection", version="4.4.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─────────────────────────────────────────────────────────────
# LAZY MODEL REGISTRY
# Models load on first request, not at startup.
# ─────────────────────────────────────────────────────────────

import threading

_PHISHING_MODEL_ID  = "cybersectony/phishing-email-detection-distilbert_v2.1"
_URL_MODEL_ID       = "kmack/malicious-url-detection"
_PROMPT_INJ_ID      = "protectai/deberta-v3-base-prompt-injection-v2"
_DEEPFAKE_IMAGE_ID  = "prithivMLmods/Deep-Fake-Detector-v2-Model"
_DEEPFAKE_AUDIO_ID  = "motheecreator/Deepfake-audio-detection"  # wav2vec2-base ~360MB (was xlsr ~1.2GB)

_phishing_lock    = threading.Lock()
_url_lock         = threading.Lock()
_prompt_inj_lock  = threading.Lock()
_deepfake_lock    = threading.Lock()
_audio_lock       = threading.Lock()

_phishing_tokenizer    = None
_phishing_model        = None
_url_tokenizer         = None
_url_model             = None
_prompt_inj_tokenizer  = None
_prompt_inj_model      = None
_deepfake_processor    = None
_deepfake_model        = None
_audio_extractor       = None
_audio_deepfake_model  = None


def _get_phishing():
    global _phishing_tokenizer, _phishing_model
    if _phishing_model is None:
        with _phishing_lock:
            if _phishing_model is None:
                print("Lazy-loading phishing model...")
                _phishing_tokenizer = AutoTokenizer.from_pretrained(_PHISHING_MODEL_ID)
                _phishing_model = AutoModelForSequenceClassification.from_pretrained(_PHISHING_MODEL_ID)
                _phishing_model.eval()
                init_phishing_explainer(_phishing_tokenizer, _phishing_model)
                print("Phishing model ready.")
    return _phishing_tokenizer, _phishing_model


def _get_url():
    global _url_tokenizer, _url_model
    if _url_model is None:
        with _url_lock:
            if _url_model is None:
                print("Lazy-loading URL model...")
                _url_tokenizer = AutoTokenizer.from_pretrained(_URL_MODEL_ID)
                _url_model = AutoModelForSequenceClassification.from_pretrained(_URL_MODEL_ID)
                _url_model.eval()
                init_url_explainer(_url_tokenizer, _url_model)
                print("URL model ready.")
    return _url_tokenizer, _url_model


def _get_prompt_inj():
    global _prompt_inj_tokenizer, _prompt_inj_model
    if _prompt_inj_model is None:
        with _prompt_inj_lock:
            if _prompt_inj_model is None:
                print("Lazy-loading prompt injection model...")
                _prompt_inj_tokenizer = AutoTokenizer.from_pretrained(_PROMPT_INJ_ID)
                _prompt_inj_model = AutoModelForSequenceClassification.from_pretrained(_PROMPT_INJ_ID)
                _prompt_inj_model.eval()
                init_prompt_injection_explainer(_prompt_inj_tokenizer, _prompt_inj_model)
                print("Prompt injection model ready.")
    return _prompt_inj_tokenizer, _prompt_inj_model


def _get_deepfake():
    global _deepfake_processor, _deepfake_model
    if _deepfake_model is None:
        with _deepfake_lock:
            if _deepfake_model is None:
                print("Lazy-loading image deepfake model...")
                _deepfake_processor = ViTImageProcessor.from_pretrained(_DEEPFAKE_IMAGE_ID)
                _deepfake_model = ViTForImageClassification.from_pretrained(_DEEPFAKE_IMAGE_ID)
                _deepfake_model.eval()
                init_deepfake_explainer(_deepfake_model, _deepfake_processor)
                print("Image deepfake model ready.")
    return _deepfake_processor, _deepfake_model


def _get_audio():
    global _audio_extractor, _audio_deepfake_model
    if _audio_deepfake_model is None:
        with _audio_lock:
            if _audio_deepfake_model is None:
                print("Lazy-loading audio deepfake model...")
                _audio_extractor = Wav2Vec2FeatureExtractor.from_pretrained(_DEEPFAKE_AUDIO_ID)
                _audio_deepfake_model = Wav2Vec2ForSequenceClassification.from_pretrained(_DEEPFAKE_AUDIO_ID)
                _audio_deepfake_model.eval()
                init_audio_explainer(_audio_deepfake_model, _audio_extractor)
                print("Audio deepfake model ready.")
    return _audio_extractor, _audio_deepfake_model


print("✅ AEGIS v4.4 server starting (all 5 detectors, models load on first use)...")


# ─────────────────────────────────────────────────────────────
# REQUEST SCHEMAS
# ─────────────────────────────────────────────────────────────

class TextInput(BaseModel):
    text: str


class PhishingEmailInput(BaseModel):
    body:    str
    sender:  Optional[str] = None
    subject: Optional[str] = None

    @field_validator("body")
    @classmethod
    def body_not_empty(cls, v):
        if not v.strip():
            raise ValueError("Email body cannot be empty")
        if len(v.strip()) < 10:
            raise ValueError("Email body too short to analyze")
        return v.strip()


class PromptInjectionInput(BaseModel):
    text: str

    @field_validator("text")
    @classmethod
    def text_not_empty(cls, v):
        if not v.strip():
            raise ValueError("text cannot be empty")
        if len(v.strip()) < 3:
            raise ValueError("text too short to analyze")
        return v.strip()


# ─────────────────────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────────────────────

def extract_domain(url: str) -> str:
    try:
        parsed = urlparse(url)
        if not parsed.scheme:
            parsed = urlparse("http://" + url)
        domain = parsed.netloc or parsed.path
        if domain.startswith("www."):
            domain = domain[4:]
        return domain.lower().strip()
    except Exception:
        return url.strip()


PHISHING_KEYWORDS = [
    "urgent", "verify", "suspended", "account", "click here",
    "confirm", "password", "login", "immediately", "security alert",
    "unusual activity", "limited time", "update your", "validate",
]

URL_SUSPICIOUS_PATTERNS = [
    "login", "verify", "secure", "account", "update", "confirm",
    "banking", "paypal", "amazon", "apple", ".xyz", ".tk", ".ml",
    "-secure", "-login", "-verify", "token=", "redirect",
]

LOOKALIKE_CHARS = [("0", "o"), ("1", "l"), ("rn", "m"), ("vv", "w")]

PHISHING_LABEL_MAP = {
    0: "legitimate_email",
    1: "phishing_url",
    2: "legitimate_url",
    3: "phishing_url_alt",
}


def check_sender_domain(sender: str) -> list:
    if not sender or "@" not in sender:
        return []
    domain = sender.split("@")[-1].lower()
    return [
        f"Lookalike character '{f}→{r}' detected in sender domain '{domain}'"
        for f, r in LOOKALIKE_CHARS if f in domain
    ]


def severity_from_score(score: float) -> str:
    if score >= 0.85: return "CRITICAL"
    if score >= 0.65: return "HIGH"
    if score >= 0.40: return "MEDIUM"
    return "LOW"


def _window_alert_types() -> set:
    return {a["alert_type"] for a in get_window_alerts()}


def _window_max_stage() -> int:
    from temporal_fusion import MITRE_STAGE_ORDER
    stages = []
    for a in get_window_alerts():
        mt = a.get("mitre_technique")
        if mt:
            s = MITRE_STAGE_ORDER.get(mt) or MITRE_STAGE_ORDER.get(mt.split(".")[0])
            if s is not None:
                stages.append(s)
    return max(stages) if stages else -1


# ─────────────────────────────────────────────────────────────
# DYNAMIC MITRE TECHNIQUE ASSIGNMENT
# ─────────────────────────────────────────────────────────────

def mitre_for_phishing(threat_score: float) -> str:
    max_stage = _window_max_stage()
    if max_stage >= 1 and threat_score >= 0.85:
        return "T1078"
    return "T1566.001"


def mitre_for_url(threat_score: float) -> str:
    max_stage = _window_max_stage()
    if max_stage >= 3 and threat_score >= 0.65:
        return "T1021"
    if max_stage >= 2 and threat_score >= 0.65:
        return "T1055"
    if max_stage >= 1 and threat_score >= 0.85:
        return "T1059"
    return "T1566.002"


def mitre_for_prompt_injection(threat_score: float) -> str:
    max_stage = _window_max_stage()
    if max_stage >= 4 and threat_score >= 0.65:
        return "T1005"
    if max_stage >= 3 and threat_score >= 0.65:
        return "T1547"
    return "T1059.PI"


def mitre_for_deepfake_image(threat_score: float) -> str:
    max_stage = _window_max_stage()
    if max_stage >= 3 and threat_score >= 0.75:
        return "T1548"
    if max_stage >= 2 and threat_score >= 0.65:
        return "T1078"
    return "T1656"


def mitre_for_deepfake_audio(threat_score: float) -> str:
    max_stage = _window_max_stage()
    if max_stage >= 5 and threat_score >= 0.75:
        return "T1041"
    if max_stage >= 4 and threat_score >= 0.65:
        return "T1534"
    if max_stage >= 2 and threat_score >= 0.65:
        return "T1548"
    return "T1656"


# ─────────────────────────────────────────────────────────────
# ENDPOINT 1 — POST /analyze/phishing
# ─────────────────────────────────────────────────────────────

@app.post("/analyze/phishing")
def analyze_phishing(body: PhishingEmailInput):
    tok, model = _get_phishing()
    full_text = (f"Subject: {body.subject}\n\n" if body.subject else "") + body.body

    inputs = tok(full_text, return_tensors="pt", truncation=True, max_length=512)
    with torch.no_grad():
        probs = torch.nn.functional.softmax(model(**inputs).logits, dim=-1)

    scores = {PHISHING_LABEL_MAP[i]: round(p, 4) for i, p in enumerate(probs[0].tolist())}
    phishing_combined           = scores["phishing_url"] + scores["phishing_url_alt"]
    scores["phishing_combined"] = round(phishing_combined, 4)

    top_label = max(
        ["legitimate_email", "phishing_url", "legitimate_url", "phishing_url_alt"],
        key=lambda l: scores[l],
    )
    is_threat = top_label in ("phishing_url", "phishing_url_alt")
    verdict   = "THREAT" if is_threat else "SAFE"
    severity  = severity_from_score(phishing_combined)

    found_keywords = [kw for kw in PHISHING_KEYWORDS if kw.lower() in full_text.lower()]
    explanation = (
        f"Flagged as phishing ({phishing_combined * 100:.1f}% confidence). "
        + (f"Patterns found: {', '.join(repr(k) for k in found_keywords[:5])}. " if found_keywords else "")
        + "Do not click any links."
        if is_threat else
        f"Appears legitimate ({scores['legitimate_email'] * 100:.1f}% confidence). No phishing patterns detected."
    )

    mitre = mitre_for_phishing(phishing_combined) if is_threat else None
    result = {
        "verdict":            verdict,
        "severity":           severity,
        "threat_score":       round(phishing_combined, 4),
        "top_label":          top_label,
        "all_scores":         scores,
        "sender_analysis":    check_sender_domain(body.sender) if body.sender else ["Sender address looks clean"],
        "explanation":        explanation,
        "mitre_technique":    f"{mitre} - Spearphishing Attachment" if mitre else None,
        "recommended_action": (
            "Do not click any links. Report to your security team. Delete the email immediately."
            if is_threat else "No action required."
        ),
    }

    if is_threat:
        shap_result = explain_phishing_input(full_text)
        result["shap"] = shap_result
        push_alert(AlertInput(
            alert_type      = "phishing",
            threat_score    = round(phishing_combined, 4),
            severity        = severity,
            mitre_technique = mitre,
            detail          = {"verdict": verdict, "top_label": top_label, "shap": shap_result},
        ))
        result["ingested_to_window"] = True

    return result


# ─────────────────────────────────────────────────────────────
# ENDPOINT 2 — POST /analyze/url
# ─────────────────────────────────────────────────────────────

@app.post("/analyze/url")
def analyze_url(body: TextInput):
    tok, model = _get_url()
    domain = extract_domain(body.text)

    inputs = tok(domain, return_tensors="pt", truncation=True, padding=True, max_length=128)
    with torch.no_grad():
        probs = torch.nn.functional.softmax(model(**inputs).logits, dim=-1)

    raw    = probs[0].tolist()
    scores = {"benign": round(raw[0], 4), "malicious": round(raw[1], 4)}

    is_threat    = scores["malicious"] > scores["benign"]
    verdict      = "THREAT" if is_threat else "SAFE"
    threat_score = scores["malicious"]
    severity     = severity_from_score(threat_score)

    found_patterns = [p for p in URL_SUSPICIOUS_PATTERNS if p.lower() in body.text.lower()]
    explanation = (
        f"Domain '{domain}' classified malicious ({threat_score * 100:.1f}% confidence). "
        + (f"Suspicious patterns: {', '.join(repr(p) for p in found_patterns[:4])}. " if found_patterns else "")
        + "Do not visit this URL."
        if is_threat else
        f"Domain '{domain}' appears benign ({scores['benign'] * 100:.1f}% confidence). No malicious patterns detected."
    )

    mitre = mitre_for_url(threat_score) if is_threat else None
    result = {
        "verdict":            verdict,
        "severity":           severity,
        "threat_score":       round(threat_score, 4),
        "domain_analyzed":    domain,
        "original_url":       body.text,
        "all_scores":         scores,
        "explanation":        explanation,
        "mitre_technique":    f"{mitre} - Spearphishing Link" if mitre else None,
        "recommended_action": (
            "Do not visit this URL. Block the domain in your firewall. Report to your security team."
            if is_threat else "URL appears safe to visit."
        ),
    }

    if is_threat:
        shap_result = explain_url_input(domain)
        result["shap"] = shap_result
        push_alert(AlertInput(
            alert_type      = "url",
            threat_score    = round(threat_score, 4),
            severity        = severity,
            mitre_technique = mitre,
            detail          = {"domain": domain, "original_url": body.text, "shap": shap_result},
        ))
        result["ingested_to_window"] = True

    return result


# ─────────────────────────────────────────────────────────────
# ENDPOINT 3 — POST /analyze/prompt-injection
# ─────────────────────────────────────────────────────────────

@app.post("/analyze/prompt-injection")
def analyze_prompt_injection(body: PromptInjectionInput):
    tok, model = _get_prompt_inj()
    inputs = tok(
        body.text, return_tensors="pt", truncation=True, max_length=512, padding=True
    )
    with torch.no_grad():
        probs = torch.nn.functional.softmax(model(**inputs).logits, dim=-1)

    raw_probs = probs[0].tolist()
    scores = {
        "injection":  round(raw_probs[1], 4),
        "legitimate": round(raw_probs[0], 4),
    }

    is_threat    = scores["injection"] > scores["legitimate"]
    verdict      = "THREAT" if is_threat else "SAFE"
    threat_score = scores["injection"]
    severity     = severity_from_score(threat_score)

    explanation = (
        f"Prompt injection detected ({threat_score * 100:.1f}% confidence). "
        "This input appears designed to override, hijack, or manipulate LLM instructions."
        if is_threat else
        f"Input appears legitimate ({scores['legitimate'] * 100:.1f}% confidence). "
        "No injection patterns detected."
    )

    mitre = mitre_for_prompt_injection(threat_score) if is_threat else None
    result = {
        "verdict":            verdict,
        "severity":           severity,
        "threat_score":       round(threat_score, 4),
        "all_scores":         scores,
        "explanation":        explanation,
        "mitre_technique":    f"{mitre} - Prompt Injection" if mitre else None,
        "recommended_action": (
            "Block this input. Do NOT pass it to an LLM. Log the source and escalate to your AI security team."
            if is_threat else "Input appears safe to pass to the LLM."
        ),
    }

    if is_threat:
        shap_result = explain_prompt_injection_input(body.text)
        result["shap"] = shap_result
        push_alert(AlertInput(
            alert_type      = "prompt_injection",
            threat_score    = round(threat_score, 4),
            severity        = severity,
            mitre_technique = mitre,
            detail          = {
                "detected_tactics": shap_result.get("detected_tactics", []),
                "shap":             shap_result,
            },
        ))
        result["ingested_to_window"] = True

    return result


# ─────────────────────────────────────────────────────────────
# ENDPOINT 4 — POST /analyze/deepfake  (IMAGE)
# ─────────────────────────────────────────────────────────────

@app.post("/analyze/deepfake")
async def analyze_deepfake(file: UploadFile = File(...)):
    valid_extensions = {'.jpg', '.jpeg', '.png', '.webp', '.bmp'}
    file_ext = os.path.splitext(file.filename or "")[-1].lower()

    if file_ext not in valid_extensions:
        return {
            "error": f"Invalid file type '{file_ext}'. Supported: {', '.join(valid_extensions)}",
            "filename": file.filename,
        }

    try:
        content = await file.read()
        image   = Image.open(io.BytesIO(content)).convert("RGB")
    except Exception as e:
        return {"error": f"Cannot open image: {str(e)}", "filename": file.filename}

    _get_deepfake()
    deepfake_score, confidence, label = explain_deepfake_input(image)

    is_threat = label == "Deepfake"
    verdict   = "DEEPFAKE_DETECTED" if is_threat else "AUTHENTIC"
    severity  = severity_from_score(deepfake_score)

    explanation = (
        f"Image classified as DEEPFAKE ({deepfake_score * 100:.1f}% confidence). "
        "Signs of AI-based facial manipulation detected."
        if is_threat else
        f"Image appears AUTHENTIC ({(1 - deepfake_score) * 100:.1f}% confidence). "
        "No deepfake indicators detected."
    )

    mitre = mitre_for_deepfake_image(deepfake_score) if is_threat else None
    result = {
        "verdict":            verdict,
        "severity":           severity,
        "threat_score":       round(deepfake_score, 4),
        "confidence":         round(confidence, 4),
        "predicted_label":    label,
        "filename":           file.filename,
        "explanation":        explanation,
        "mitre_technique":    f"{mitre} - Impersonation (Deepfake)" if mitre else None,
        "recommended_action": (
            "Do not share or use this image. Verify from original sources."
            if is_threat else "Image appears to be authentic."
        ),
    }

    if is_threat:
        shap_result = {
            "type":                "deepfake",
            "model_deepfake_prob": round(deepfake_score, 4),
            "confidence":          round(confidence, 4),
            "predicted_label":     label,
            "interpretation": (
                f"ViT model detected {deepfake_score * 100:.1f}% probability of deepfake. "
                "Indicators may include facial inconsistencies, unnatural textures, "
                "or blending artifacts."
            ),
        }
        result["shap"] = shap_result
        push_alert(AlertInput(
            alert_type      = "deepfake",
            threat_score    = round(deepfake_score, 4),
            severity        = severity,
            mitre_technique = mitre,
            detail          = {"verdict": verdict, "filename": file.filename, "shap": shap_result},
        ))
        result["ingested_to_window"] = True

    return result


# ─────────────────────────────────────────────────────────────
# ENDPOINT 4b — POST /analyze/deepfake-audio  (AUDIO)
# ─────────────────────────────────────────────────────────────

@app.post("/analyze/deepfake-audio")
async def analyze_deepfake_audio(file: UploadFile = File(...)):
    TARGET_SR = 16_000
    MAX_SECS  = 30

    valid_extensions = {".wav", ".mp3", ".flac", ".ogg", ".m4a"}
    file_ext = os.path.splitext(file.filename or "")[-1].lower()

    if file_ext not in valid_extensions:
        return {
            "error":    f"Invalid file type '{file_ext}'. Supported: {', '.join(valid_extensions)}",
            "filename": file.filename,
        }

    try:
        content = await file.read()
        wav_buf = io.BytesIO(content)
        waveform, sr = librosa.load(wav_buf, sr=TARGET_SR, mono=True)
    except Exception as e:
        return {"error": f"Cannot decode audio: {str(e)}", "filename": file.filename}

    max_samples = TARGET_SR * MAX_SECS
    if len(waveform) > max_samples:
        waveform = waveform[:max_samples]

    duration_secs = round(len(waveform) / TARGET_SR, 2)

    try:
        _get_audio()
        deepfake_score, confidence, label = explain_audio_input(waveform)
    except Exception as e:
        return {"error": f"Model inference failed: {str(e)}", "filename": file.filename}

    is_threat = label == "Fake"
    verdict   = "FAKE_AUDIO_DETECTED" if is_threat else "AUTHENTIC_AUDIO"
    severity  = severity_from_score(deepfake_score)

    explanation = (
        f"Audio classified as AI-GENERATED / VOICE-CLONED ({deepfake_score * 100:.1f}% confidence). "
        "Synthetic speech patterns detected."
        if is_threat else
        f"Audio appears AUTHENTIC ({(1 - deepfake_score) * 100:.1f}% confidence). "
        "No synthetic speech indicators detected."
    )

    mitre = mitre_for_deepfake_audio(deepfake_score) if is_threat else None
    result = {
        "verdict":            verdict,
        "severity":           severity,
        "threat_score":       round(deepfake_score, 4),
        "confidence":         round(confidence, 4),
        "predicted_label":    label,
        "filename":           file.filename,
        "duration_seconds":   duration_secs,
        "sample_rate_used":   TARGET_SR,
        "explanation":        explanation,
        "mitre_technique":    f"{mitre} - Impersonation (Audio Deepfake)" if mitre else None,
        "recommended_action": (
            "Do not trust or act on this audio. Verify via a live call to the claimed speaker. "
            "Preserve as evidence and escalate to your fraud/security team."
            if is_threat else
            "Audio appears authentic."
        ),
    }

    if is_threat:
        shap_result = {
            "type":                "audio_deepfake",
            "model_deepfake_prob": round(deepfake_score, 4),
            "confidence":          round(confidence, 4),
            "predicted_label":     label,
            "duration_seconds":    duration_secs,
            "interpretation": (
                f"wav2vec2 model detected {deepfake_score * 100:.1f}% probability of synthetic speech. "
                "Indicators may include unnatural prosody, spectral artefacts, or TTS/VC fingerprints."
            ),
        }
        result["shap"] = shap_result
        push_alert(AlertInput(
            alert_type      = "audio_deepfake",
            threat_score    = round(deepfake_score, 4),
            severity        = severity,
            mitre_technique = mitre,
            detail          = {
                "verdict":          verdict,
                "filename":         file.filename,
                "duration_seconds": duration_secs,
                "shap":             shap_result,
            },
        ))
        result["ingested_to_window"] = True

    return result


# ─────────────────────────────────────────────────────────────
# ENDPOINT 5 — POST /ingest/alert
# ─────────────────────────────────────────────────────────────

@app.post("/ingest/alert")
def ingest_alert(alert: AlertInput):
    entry       = push_alert(alert)
    window_size = len(list(alert_window))
    return {
        "status":      "ingested",
        "alert_id":    entry["id"],
        "window_size": window_size,
        "message":     f"Alert #{entry['id']} added. Window now has {window_size} alert(s).",
    }


# ─────────────────────────────────────────────────────────────
# ENDPOINT 6 — POST /analyze/temporal
# ─────────────────────────────────────────────────────────────

@app.post("/analyze/temporal")
def analyze_temporal(req: TemporalAnalysisRequest = None):
    window_secs = req.window_seconds if req else 300
    return run_temporal_analysis(window_secs)


# ─────────────────────────────────────────────────────────────
# ENDPOINT 7 — GET /alerts/window
# ─────────────────────────────────────────────────────────────

@app.get("/alerts/window")
def get_window():
    alerts = get_window_alerts()
    return {"alert_count": len(alerts), "alerts": alerts}


# ─────────────────────────────────────────────────────────────
# ENDPOINT 8 — DELETE /alerts/reset
# ─────────────────────────────────────────────────────────────

@app.delete("/alerts/reset")
def reset_window():
    alert_window.clear()
    return {"status": "cleared", "message": "Alert window has been reset."}


# ─────────────────────────────────────────────────────────────
# ENDPOINT 9 — GET /health
# ─────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    from temporal_fusion import (
        _phishing_base_value,
        _url_base_value,
        _prompt_inj_base_value,
        _deepfake_base_value,
        _audio_base_value,
    )
    return {
        "status":  "ok",
        "version": "4.4.0",
        "models": {
            "phishing":         _PHISHING_MODEL_ID,
            "url":              _URL_MODEL_ID,
            "prompt_injection": _PROMPT_INJ_ID,
            "deepfake_image":   _DEEPFAKE_IMAGE_ID,
            "deepfake_audio":   _DEEPFAKE_AUDIO_ID,
        },
        "shap": {
            "phishing_base_value":   round(_phishing_base_value, 4)   if _phishing_base_value   else None,
            "url_base_value":        round(_url_base_value, 4)         if _url_base_value         else None,
            "prompt_inj_base_value": round(_prompt_inj_base_value, 4) if _prompt_inj_base_value else None,
            "deepfake_base_value":   round(_deepfake_base_value, 4)   if _deepfake_base_value   else None,
            "audio_base_value":      round(_audio_base_value, 4)       if _audio_base_value       else None,
        },
        "temporal_window": {
            "active_alerts":  len(get_window_alerts()),
            "window_seconds": 300,
        },
        "models_loaded": {
            "phishing":         _phishing_model is not None,
            "url":              _url_model is not None,
            "prompt_injection": _prompt_inj_model is not None,
            "deepfake_image":   _deepfake_model is not None,
            "deepfake_audio":   _audio_deepfake_model is not None,
        },
    }