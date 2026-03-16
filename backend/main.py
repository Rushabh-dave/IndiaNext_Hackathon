# main.py
# ─────────────────────────────────────────────────────────────
# AEGIS — Phase 1 + Phase 2 + Phase 3 + Phase 4 + Phase 4b
# v4.4 — Lazy / Background Model Loading
#
# All models load in a background thread AFTER uvicorn starts.
# Server is immediately available at http://localhost:8000.
# Endpoints return HTTP 503 with a clear message if their
# model is still warming up — no hanging, no timeout.
#
# Endpoints:
#   POST /analyze/phishing          — phishing email detection + SHAP
#   POST /analyze/url               — malicious URL detection + SHAP
#   POST /analyze/prompt-injection  — prompt injection detection + SHAP
#   POST /analyze/deepfake          — deepfake IMAGE detection (ViT)
#   POST /analyze/deepfake-audio    — deepfake AUDIO detection (wav2vec2)
#   POST /ingest/alert              — push alert into sliding window
#   POST /analyze/temporal          — temporal fusion analysis
#   GET  /alerts/window             — view current window
#   DELETE /alerts/reset            — clear window
#   GET  /health                    — includes per-model ready status
# ─────────────────────────────────────────────────────────────

from __future__ import annotations

import io
import os
import threading
import time
from contextlib import asynccontextmanager
from typing import Optional
from urllib.parse import urlparse

import librosa
import numpy as np
import torch
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
from pydantic import BaseModel, field_validator
from transformers import (
    AutoModelForSequenceClassification,
    AutoTokenizer,
    ViTForImageClassification,
    ViTImageProcessor,
    Wav2Vec2FeatureExtractor,
    Wav2Vec2ForSequenceClassification,
)

from temporal_fusion import (
    AlertInput,
    TemporalAnalysisRequest,
    alert_window,
    explain_audio_input,
    explain_deepfake_input,
    explain_phishing_input,
    explain_prompt_injection_input,
    explain_url_input,
    get_window_alerts,
    init_audio_explainer,
    init_deepfake_explainer,
    init_phishing_explainer,
    init_prompt_injection_explainer,
    init_url_explainer,
    push_alert,
    run_temporal_analysis,
)


# ─────────────────────────────────────────────────────────────
# MODEL REGISTRY
# ─────────────────────────────────────────────────────────────
# _models  : holds the live tokenizer/model objects after load
# _ready   : per-model boolean flag, flipped True when load + SHAP init done
# _errors  : stores any exception string if a model fails to load

_models: dict = {}
_ready: dict = {
    "phishing":         False,
    "url":              False,
    "prompt_injection": False,
    "deepfake_image":   False,
    "deepfake_audio":   False,
}
_errors: dict = {}


def _all_ready() -> bool:
    return all(_ready.values())


def _check_ready(model_key: str) -> None:
    """Raise HTTP 503 if the requested model hasn't finished loading yet."""
    if not _ready.get(model_key):
        err = _errors.get(model_key)
        detail = (
            f"Model '{model_key}' failed to load: {err}"
            if err else
            f"Model '{model_key}' is still warming up — please retry in a moment."
        )
        raise HTTPException(status_code=503, detail=detail)


# ─────────────────────────────────────────────────────────────
# BACKGROUND MODEL LOADER
# ─────────────────────────────────────────────────────────────

def _load_all_models() -> None:
    """
    Runs in a daemon thread kicked off by the lifespan handler.
    Each model is loaded sequentially. _ready[key] flips to True
    the moment that model + its SHAP explainer are fully initialised,
    so each endpoint becomes available independently.
    """

    # ── 1. Phishing ──────────────────────────────────────────
    try:
        print("[AEGIS] Loading phishing model...")
        t0  = time.time()
        tok = AutoTokenizer.from_pretrained(
            "cybersectony/phishing-email-detection-distilbert_v2.1"
        )
        mdl = AutoModelForSequenceClassification.from_pretrained(
            "cybersectony/phishing-email-detection-distilbert_v2.1"
        )
        mdl.eval()
        _models["phishing_tokenizer"] = tok
        _models["phishing_model"]     = mdl
        init_phishing_explainer(tok, mdl)
        _ready["phishing"] = True
        print(f"[AEGIS] ✅ Phishing ready ({time.time() - t0:.1f}s)")
    except Exception as exc:
        _errors["phishing"] = str(exc)
        print(f"[AEGIS] ❌ Phishing failed: {exc}")

    # ── 2. URL ───────────────────────────────────────────────
    try:
        print("[AEGIS] Loading URL model...")
        t0  = time.time()
        tok = AutoTokenizer.from_pretrained("kmack/malicious-url-detection")
        mdl = AutoModelForSequenceClassification.from_pretrained(
            "kmack/malicious-url-detection"
        )
        mdl.eval()
        _models["url_tokenizer"] = tok
        _models["url_model"]     = mdl
        init_url_explainer(tok, mdl)
        _ready["url"] = True
        print(f"[AEGIS] ✅ URL ready ({time.time() - t0:.1f}s)")
    except Exception as exc:
        _errors["url"] = str(exc)
        print(f"[AEGIS] ❌ URL failed: {exc}")

    # ── 3. Prompt injection ──────────────────────────────────
    try:
        print("[AEGIS] Loading prompt injection model...")
        t0  = time.time()
        tok = AutoTokenizer.from_pretrained(
            "protectai/deberta-v3-base-prompt-injection-v2"
        )
        mdl = AutoModelForSequenceClassification.from_pretrained(
            "protectai/deberta-v3-base-prompt-injection-v2"
        )
        mdl.eval()
        _models["prompt_inj_tokenizer"] = tok
        _models["prompt_inj_model"]     = mdl
        init_prompt_injection_explainer(tok, mdl)
        _ready["prompt_injection"] = True
        print(f"[AEGIS] ✅ Prompt injection ready ({time.time() - t0:.1f}s)")
    except Exception as exc:
        _errors["prompt_injection"] = str(exc)
        print(f"[AEGIS] ❌ Prompt injection failed: {exc}")

    # ── 4. Image deepfake ────────────────────────────────────
    try:
        print("[AEGIS] Loading image deepfake model...")
        t0  = time.time()
        mid = "prithivMLmods/Deep-Fake-Detector-v2-Model"
        prc = ViTImageProcessor.from_pretrained(mid)
        mdl = ViTForImageClassification.from_pretrained(mid)
        mdl.eval()
        _models["deepfake_processor"] = prc
        _models["deepfake_model"]     = mdl
        init_deepfake_explainer(mdl, prc)
        _ready["deepfake_image"] = True
        print(f"[AEGIS] ✅ Image deepfake ready ({time.time() - t0:.1f}s)")
    except Exception as exc:
        _errors["deepfake_image"] = str(exc)
        print(f"[AEGIS] ❌ Image deepfake failed: {exc}")

    # ── 5. Audio deepfake ────────────────────────────────────
    try:
        print("[AEGIS] Loading audio deepfake model...")
        t0  = time.time()
        mid = "Gustking/wav2vec2-large-xlsr-deepfake-audio-classification"
        ext = Wav2Vec2FeatureExtractor.from_pretrained(mid)
        mdl = Wav2Vec2ForSequenceClassification.from_pretrained(mid)
        mdl.eval()
        _models["audio_extractor"]      = ext
        _models["audio_deepfake_model"] = mdl
        init_audio_explainer(mdl, ext)
        _ready["deepfake_audio"] = True
        print(f"[AEGIS] ✅ Audio deepfake ready ({time.time() - t0:.1f}s)")
    except Exception as exc:
        _errors["deepfake_audio"] = str(exc)
        print(f"[AEGIS] ❌ Audio deepfake failed: {exc}")

    if _all_ready():
        print("[AEGIS] 🚀 All models loaded and ready.")
    else:
        print(f"[AEGIS] ⚠️  Finished loading with errors: {list(_errors.keys())}")


# ─────────────────────────────────────────────────────────────
# LIFESPAN — spins up the loader thread, yields, then exits
# ─────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(application: FastAPI):
    loader = threading.Thread(
        target=_load_all_models,
        daemon=True,
        name="aegis-model-loader",
    )
    loader.start()
    print("[AEGIS] Server ready instantly. Models loading in background...")
    yield
    # Daemon thread dies automatically when the process exits


# ─────────────────────────────────────────────────────────────
# APP
# ─────────────────────────────────────────────────────────────

app = FastAPI(
    title="AEGIS Threat Detection",
    version="4.4.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


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


# ─────────────────────────────────────────────────────────────
# ENDPOINT 1 — POST /analyze/phishing
# ─────────────────────────────────────────────────────────────

@app.post("/analyze/phishing")
def analyze_phishing(body: PhishingEmailInput):
    _check_ready("phishing")

    tok   = _models["phishing_tokenizer"]
    model = _models["phishing_model"]

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

    result = {
        "verdict":            verdict,
        "severity":           severity,
        "threat_score":       round(phishing_combined, 4),
        "top_label":          top_label,
        "all_scores":         scores,
        "sender_analysis":    check_sender_domain(body.sender) if body.sender else ["Sender address looks clean"],
        "explanation":        explanation,
        "mitre_technique":    "T1566.001 - Spearphishing Attachment" if is_threat else None,
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
            mitre_technique = "T1566.001",
            detail          = {"verdict": verdict, "top_label": top_label, "shap": shap_result},
        ))
        result["ingested_to_window"] = True

    return result


# ─────────────────────────────────────────────────────────────
# ENDPOINT 2 — POST /analyze/url
# ─────────────────────────────────────────────────────────────

@app.post("/analyze/url")
def analyze_url(body: TextInput):
    _check_ready("url")

    tok    = _models["url_tokenizer"]
    model  = _models["url_model"]
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

    result = {
        "verdict":            verdict,
        "severity":           severity,
        "threat_score":       round(threat_score, 4),
        "domain_analyzed":    domain,
        "original_url":       body.text,
        "all_scores":         scores,
        "explanation":        explanation,
        "mitre_technique":    "T1566.002 - Spearphishing Link" if is_threat else None,
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
            mitre_technique = "T1566.002",
            detail          = {"domain": domain, "original_url": body.text, "shap": shap_result},
        ))
        result["ingested_to_window"] = True

    return result


# ─────────────────────────────────────────────────────────────
# ENDPOINT 3 — POST /analyze/prompt-injection
# ─────────────────────────────────────────────────────────────

@app.post("/analyze/prompt-injection")
def analyze_prompt_injection(body: PromptInjectionInput):
    _check_ready("prompt_injection")

    tok   = _models["prompt_inj_tokenizer"]
    model = _models["prompt_inj_model"]

    inputs = tok(body.text, return_tensors="pt", truncation=True, max_length=512, padding=True)
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

    result = {
        "verdict":            verdict,
        "severity":           severity,
        "threat_score":       round(threat_score, 4),
        "all_scores":         scores,
        "explanation":        explanation,
        "mitre_technique":    "T1059.PI - Prompt Injection" if is_threat else None,
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
            mitre_technique = "T1059.PI",
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
    """
    Analyze a single IMAGE for deepfake detection.
    Accepts: jpg, jpeg, png, webp, bmp
    Model: prithivMLmods/Deep-Fake-Detector-v2-Model (ViT)
    Labels: 'Realism' (authentic) | 'Deepfake' (manipulated)
    """
    _check_ready("deepfake_image")

    valid_extensions = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}
    file_ext = os.path.splitext(file.filename or "")[-1].lower()

    if file_ext not in valid_extensions:
        return {
            "error":    f"Invalid file type '{file_ext}'. Supported: {', '.join(valid_extensions)}",
            "filename": file.filename,
        }

    try:
        content = await file.read()
        image   = Image.open(io.BytesIO(content)).convert("RGB")
    except Exception as e:
        return {"error": f"Cannot open image: {str(e)}", "filename": file.filename}

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

    result = {
        "verdict":            verdict,
        "severity":           severity,
        "threat_score":       round(deepfake_score, 4),
        "confidence":         round(confidence, 4),
        "predicted_label":    label,
        "filename":           file.filename,
        "explanation":        explanation,
        "mitre_technique":    "T1656 - Impersonation (Deepfake)" if is_threat else None,
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
                "Indicators may include facial inconsistencies, unnatural textures, or blending artifacts."
            ),
        }
        result["shap"] = shap_result
        push_alert(AlertInput(
            alert_type      = "deepfake",
            threat_score    = round(deepfake_score, 4),
            severity        = severity,
            mitre_technique = "T1656",
            detail          = {"verdict": verdict, "filename": file.filename, "shap": shap_result},
        ))
        result["ingested_to_window"] = True

    return result


# ─────────────────────────────────────────────────────────────
# ENDPOINT 4b — POST /analyze/deepfake-audio  (AUDIO)
# ─────────────────────────────────────────────────────────────

@app.post("/analyze/deepfake-audio")
async def analyze_deepfake_audio(file: UploadFile = File(...)):
    """
    Analyze an AUDIO file for AI-generated / cloned speech detection.
    Accepts : wav, mp3, flac, ogg, m4a
    Model   : Gustking/wav2vec2-large-xlsr-deepfake-audio-classification
    Labels  : 'Real' (authentic) | 'Fake' (AI-generated / voice-cloned)
    Notes   : Audio is resampled to 16 kHz mono. Files >30 s are truncated.
    """
    _check_ready("deepfake_audio")

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
        content  = await file.read()
        wav_buf  = io.BytesIO(content)
        waveform, _ = librosa.load(wav_buf, sr=TARGET_SR, mono=True)
    except Exception as e:
        return {"error": f"Cannot decode audio: {str(e)}", "filename": file.filename}

    max_samples = TARGET_SR * MAX_SECS
    if len(waveform) > max_samples:
        waveform = waveform[:max_samples]

    duration_secs = round(len(waveform) / TARGET_SR, 2)

    try:
        deepfake_score, confidence, label = explain_audio_input(waveform)
    except Exception as e:
        return {"error": f"Model inference failed: {str(e)}", "filename": file.filename}

    is_threat = label == "Fake"
    verdict   = "FAKE_AUDIO_DETECTED" if is_threat else "AUTHENTIC_AUDIO"
    severity  = severity_from_score(deepfake_score)

    explanation = (
        f"Audio classified as AI-GENERATED / VOICE-CLONED ({deepfake_score * 100:.1f}% confidence). "
        "Synthetic speech patterns detected — this audio may be a voice clone or TTS output."
        if is_threat else
        f"Audio appears AUTHENTIC ({(1 - deepfake_score) * 100:.1f}% confidence). "
        "No synthetic speech indicators detected."
    )

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
        "mitre_technique":    "T1656 - Impersonation (Audio Deepfake)" if is_threat else None,
        "recommended_action": (
            "Do not trust or act on this audio. Verify via a live call to the claimed speaker. "
            "Preserve as evidence and escalate to your fraud/security team."
            if is_threat else "Audio appears authentic."
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
            mitre_technique = "T1656",
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
        _audio_base_value,
        _deepfake_base_value,
        _phishing_base_value,
        _prompt_inj_base_value,
        _url_base_value,
    )
    return {
        "status":       "ok" if _all_ready() else "warming_up",
        "version":      "4.4.0",
        "models_ready": _ready,
        "load_errors":  _errors or None,
        "models": {
            "phishing":         "cybersectony/phishing-email-detection-distilbert_v2.1",
            "url":              "kmack/malicious-url-detection",
            "prompt_injection": "protectai/deberta-v3-base-prompt-injection-v2",
            "deepfake_image":   "prithivMLmods/Deep-Fake-Detector-v2-Model (ViT, image-only)",
            "deepfake_audio":   "Gustking/wav2vec2-large-xlsr-deepfake-audio-classification",
        },
        "shap": {
            "method":                "KernelExplainer on output-probability space",
            "phishing_base_value":   round(_phishing_base_value, 4)   if _phishing_base_value   else None,
            "url_base_value":        round(_url_base_value, 4)         if _url_base_value         else None,
            "prompt_inj_base_value": round(_prompt_inj_base_value, 4) if _prompt_inj_base_value else None,
            "deepfake_base_value":   round(_deepfake_base_value, 4)   if _deepfake_base_value   else None,
            "audio_base_value":      round(_audio_base_value, 4)       if _audio_base_value       else None,
            "background_size":       10,
            "nsamples":              100,
        },
        "temporal_window": {
            "active_alerts":  len(get_window_alerts()),
            "window_seconds": 300,
        },
    }