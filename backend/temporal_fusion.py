# temporal_fusion.py (v4.3 - Full Merge, Lazy-Loaded)
# ─────────────────────────────────────────────────────────────
# Combines:
#   - v3.2: Prompt injection SHAP + tactic detection + Groq narrative
#           Fixed temporal weights (peak_score=0.30, velocity=0.05)
#   - v4.1: Image deepfake detection (ViT classifier)
#   - v4.3: Audio deepfake detection (wav2vec2-large-xlsr)
#
# All 5 explainers: phishing, url, prompt_injection, image deepfake, audio deepfake
#
# LAZY LOADING: Heavy deps (torch, transformers, shap, librosa, PIL)
# are imported inside the functions that need them, NOT at module level.
# This eliminates deployment timeout caused by eager model loading.
# ─────────────────────────────────────────────────────────────

import os
import json
import time
import math
from dotenv import load_dotenv
from collections import deque
from datetime import datetime
from typing import Optional, List, Dict, Any, Tuple
from pydantic import BaseModel, field_validator

load_dotenv()

WINDOW_SECONDS       = 300
MAX_ALERTS           = 50
ESCALATION_THRESHOLD = 3

# Groq client — lazy init to avoid import cost at startup
_groq_client = None

def _get_groq_client():
    global _groq_client
    if _groq_client is None:
        from groq import Groq
        _groq_client = Groq(api_key=os.environ.get("API_KEY"))
    return _groq_client


MITRE_STAGE_ORDER = {
    "T1595": 0, "T1592": 0,
    "T1566": 1, "T1566.001": 1, "T1566.002": 1, "T1656": 1,
    "T1059": 2, "T1078": 2, "T1053": 2, "T1059.PI": 2,
    "T1547": 3, "T1055": 3,
    "T1548": 4,
    "T1021": 5, "T1534": 5,
    "T1005": 6,
    "T1041": 7, "T1486": 7,
}
MITRE_STAGE_NAMES = [
    "Recon", "Initial Access", "Execution",
    "Persistence", "Privilege Escalation",
    "Lateral Movement", "Collection", "Exfiltration/Impact"
]

alert_window: deque = deque(maxlen=MAX_ALERTS)


# ─────────────────────────────────────────────────────────────
# SCHEMAS
# ─────────────────────────────────────────────────────────────

class AlertInput(BaseModel):
    alert_type:      str
    threat_score:    float
    severity:        str
    mitre_technique: Optional[str]            = None
    source_ip:       Optional[str]            = None
    detail:          Optional[Dict[str, Any]] = None

    @field_validator("threat_score")
    @classmethod
    def validate_score(cls, v):
        if not (0.0 <= v <= 1.0):
            raise ValueError("threat_score must be 0.0–1.0")
        return round(v, 4)

    @field_validator("severity")
    @classmethod
    def validate_severity(cls, v):
        if v.upper() not in ("LOW", "MEDIUM", "HIGH", "CRITICAL"):
            raise ValueError("severity must be LOW|MEDIUM|HIGH|CRITICAL")
        return v.upper()


class TemporalAnalysisRequest(BaseModel):
    window_seconds: Optional[int] = WINDOW_SECONDS


# ─────────────────────────────────────────────────────────────
# SHAP — global state (populated lazily on first use)
# ─────────────────────────────────────────────────────────────

_phishing_predict_fn   = None
_url_predict_fn        = None
_prompt_inj_predict_fn = None
_deepfake_predict_fn   = None
_audio_predict_fn      = None

_phishing_base_value   = None
_url_base_value        = None
_prompt_inj_base_value = None
_deepfake_base_value   = None
_audio_base_value      = None

PHISHING_BACKGROUND = [
    "Hello, please find attached the meeting notes.",
    "Your invoice is ready for download.",
    "Team lunch is scheduled for Friday at noon.",
    "Please review the attached quarterly report.",
    "The project deadline has been moved to next week.",
    "Thank you for your order confirmation.",
    "Your subscription has been renewed successfully.",
    "Reminder: submit your timesheet by end of day.",
    "The conference call is at 3pm today.",
    "Welcome to our newsletter. You can unsubscribe anytime.",
]

URL_BACKGROUND = [
    "github.com", "google.com", "stackoverflow.com", "docs.python.org",
    "wikipedia.org", "npmjs.com", "pypi.org", "linkedin.com",
    "microsoft.com", "amazon.com",
]

PROMPT_INJECTION_BACKGROUND = [
    "Summarize this document for me.",
    "What is the capital of France?",
    "Translate the following text to Spanish.",
    "Write a haiku about autumn.",
    "Explain how photosynthesis works.",
    "List the top five programming languages.",
    "What are the health benefits of exercise?",
    "Can you help me draft a professional email?",
    "How do I make pasta carbonara?",
    "What is the difference between Python 2 and Python 3?",
]

_AUDIO_TARGET_SR = 16_000
_AUDIO_BG_CLIPS  = 5


# ─────────────────────────────────────────────────────────────
# PREDICT FUNCTIONS  (import heavy deps only when called)
# ─────────────────────────────────────────────────────────────

def _make_phishing_predict(tokenizer, model):
    def predict(texts):
        import torch
        import numpy as np
        results = []
        for t in texts:
            enc = tokenizer(str(t), return_tensors="pt", truncation=True, max_length=512, padding=True)
            with torch.no_grad():
                p = torch.nn.functional.softmax(model(**enc).logits, dim=-1)[0].tolist()
            results.append([p[0] + p[2], p[1] + p[3]])
        return np.array(results, dtype=float)
    return predict


def _make_url_predict(tokenizer, model):
    def predict(domains):
        import torch
        import numpy as np
        results = []
        for d in domains:
            enc = tokenizer(str(d), return_tensors="pt", truncation=True, padding=True, max_length=128)
            with torch.no_grad():
                p = torch.nn.functional.softmax(model(**enc).logits, dim=-1)[0].tolist()
            results.append([p[0], p[1]])
        return np.array(results, dtype=float)
    return predict


def _make_prompt_inj_predict(tokenizer, model):
    def predict(texts):
        import torch
        import numpy as np
        results = []
        for t in texts:
            enc = tokenizer(str(t), return_tensors="pt", truncation=True, max_length=512, padding=True)
            with torch.no_grad():
                p = torch.nn.functional.softmax(model(**enc).logits, dim=-1)[0].tolist()
            results.append([p[0], p[1]])
        return np.array(results, dtype=float)
    return predict


def _make_deepfake_predict(model, processor):
    deepfake_idx = 0
    realism_idx  = 1

    def predict(images):
        import torch
        import numpy as np
        from PIL import Image
        results = []
        with torch.no_grad():
            for img in images:
                if not isinstance(img, Image.Image):
                    img = Image.fromarray(np.array(img, dtype=np.uint8))
                inputs = processor(images=img, return_tensors="pt")
                probs  = torch.softmax(model(**inputs).logits[0], dim=0)
                results.append([probs[realism_idx].item(), probs[deepfake_idx].item()])
        return np.array(results, dtype=float)

    return predict


def _make_audio_predict(model, extractor, target_sr: int = _AUDIO_TARGET_SR):
    def predict(waveforms):
        import torch
        import numpy as np
        results = []
        with torch.no_grad():
            for wav in waveforms:
                if not isinstance(wav, np.ndarray):
                    wav = np.array(wav, dtype=np.float32)
                inputs = extractor(
                    wav,
                    sampling_rate=target_sr,
                    return_tensors="pt",
                    padding=True,
                )
                logits = model(**inputs).logits
                probs  = torch.softmax(logits[0], dim=0).tolist()
                results.append([probs[0], probs[1]])
        return np.array(results, dtype=float)

    return predict


# ─────────────────────────────────────────────────────────────
# INIT FUNCTIONS  (lazy: each runs only on first call)
# ─────────────────────────────────────────────────────────────

def init_phishing_explainer(tokenizer, model):
    global _phishing_predict_fn, _phishing_base_value
    if _phishing_predict_fn is not None:
        return
    import numpy as np
    print("Initializing phishing SHAP explainer...")
    _phishing_predict_fn = _make_phishing_predict(tokenizer, model)
    bg_preds = _phishing_predict_fn(PHISHING_BACKGROUND)
    _phishing_base_value = float(np.mean(bg_preds[:, 1]))
    print(f"Phishing SHAP ready. Base value: {_phishing_base_value:.4f}")


def init_url_explainer(tokenizer, model):
    global _url_predict_fn, _url_base_value
    if _url_predict_fn is not None:
        return
    import numpy as np
    print("Initializing URL SHAP explainer...")
    _url_predict_fn = _make_url_predict(tokenizer, model)
    bg_preds = _url_predict_fn(URL_BACKGROUND)
    _url_base_value = float(np.mean(bg_preds[:, 1]))
    print(f"URL SHAP ready. Base value: {_url_base_value:.4f}")


def init_prompt_injection_explainer(tokenizer, model):
    global _prompt_inj_predict_fn, _prompt_inj_base_value
    if _prompt_inj_predict_fn is not None:
        return
    import numpy as np
    print("Initializing prompt injection SHAP explainer...")
    _prompt_inj_predict_fn = _make_prompt_inj_predict(tokenizer, model)
    bg_preds = _prompt_inj_predict_fn(PROMPT_INJECTION_BACKGROUND)
    _prompt_inj_base_value = float(np.mean(bg_preds[:, 1]))
    print(f"Prompt injection SHAP ready. Base value: {_prompt_inj_base_value:.4f}")


def init_deepfake_explainer(model, processor):
    global _deepfake_predict_fn, _deepfake_base_value
    if _deepfake_predict_fn is not None:
        return
    import numpy as np
    from PIL import Image
    print("Initializing image deepfake SHAP explainer...")
    _deepfake_predict_fn = _make_deepfake_predict(model, processor)
    bg_images = [
        Image.fromarray(np.random.randint(0, 256, (224, 224, 3), dtype=np.uint8))
        for _ in range(5)
    ]
    bg_preds = _deepfake_predict_fn(bg_images)
    _deepfake_base_value = float(np.mean(bg_preds[:, 1]))
    print(f"Image deepfake SHAP ready. Base value: {_deepfake_base_value:.4f}")


def init_audio_explainer(model, extractor, target_sr: int = _AUDIO_TARGET_SR):
    global _audio_predict_fn, _audio_base_value
    if _audio_predict_fn is not None:
        return
    import numpy as np
    print("Initializing audio deepfake SHAP explainer...")
    _audio_predict_fn = _make_audio_predict(model, extractor, target_sr)
    bg_clips = [np.zeros(target_sr * 2, dtype=np.float32) for _ in range(_AUDIO_BG_CLIPS)]
    bg_preds = _audio_predict_fn(bg_clips)
    _audio_base_value = float(np.mean(bg_preds[:, 1]))
    print(f"Audio deepfake SHAP ready. Base value: {_audio_base_value:.4f}")


# ─────────────────────────────────────────────────────────────
# SHAP SHAPE NORMALIZER
# ─────────────────────────────────────────────────────────────

def _extract_class1_shap(shap_vals: any, class_idx: int = 1):
    import numpy as np
    sv = np.array(shap_vals)
    if sv.ndim == 3 and sv.shape[0] == 1:   return sv[0, :, class_idx]
    elif sv.ndim == 3:                        return sv[class_idx].flatten()
    elif sv.ndim == 2 and sv.shape[0] == 1:  return sv[0]
    elif sv.ndim == 2 and sv.shape[1] == 2:  return sv[:, class_idx]
    else:                                     return sv.flatten()


# ─────────────────────────────────────────────────────────────
# SHAP EXPLANATIONS
# ─────────────────────────────────────────────────────────────

def explain_phishing_input(text: str) -> dict:
    if _phishing_predict_fn is None or _phishing_base_value is None:
        return {"error": "Phishing SHAP explainer not initialized."}
    try:
        import shap
        import numpy as np
        bg_preds      = _phishing_predict_fn(PHISHING_BACKGROUND)
        input_pred    = _phishing_predict_fn([text])
        prob_phishing = float(input_pred[0, 1])

        explainer = shap.KernelExplainer(lambda x: x, bg_preds, silent=True)
        shap_vals = explainer.shap_values(input_pred, nsamples=100, silent=True)
        sv        = _extract_class1_shap(shap_vals, class_idx=1)
        shap_legit  = float(sv[0]) if len(sv) > 0 else 0.0
        shap_threat = float(sv[1]) if len(sv) > 1 else 0.0

        deviation        = prob_phishing - _phishing_base_value
        bg_phishing_probs = bg_preds[:, 1]
        top_idx = np.argsort(np.abs(bg_phishing_probs - prob_phishing))[::-1][:3]
        top_contrasts = [
            {
                "background_text":  PHISHING_BACKGROUND[i],
                "bg_phishing_prob": round(float(bg_phishing_probs[i]), 4),
                "delta":            round(float(prob_phishing - bg_phishing_probs[i]), 4),
                "direction":        "more suspicious" if prob_phishing > bg_phishing_probs[i] else "less suspicious",
            }
            for i in top_idx
        ]
        return {
            "type":                    "phishing",
            "model_phishing_prob":     round(prob_phishing, 4),
            "base_value":              round(_phishing_base_value, 4),
            "mean_shap_value":         round(deviation, 4),
            "prediction_deviation":    round(deviation, 4),
            "shap_feature_legit":      round(shap_legit, 4),
            "shap_feature_threat":     round(shap_threat, 4),
            "interpretation": (
                "This email looks very likely to be a phishing attempt. "
                "Do not click any links or open attachments — report it to IT immediately."
                if deviation > 0.20 else
                "This email has some suspicious characteristics. "
                "Treat it with caution and verify the sender through a separate channel before taking any action."
                if deviation > 0.05 else
                "This email looks mostly normal, but stay cautious. "
                "If anything feels off, confirm with the sender directly."
            ),
            "top_contrastive_samples": top_contrasts,
        }
    except Exception as e:
        return {"type": "phishing", "error": str(e), "mean_shap_value": None,
                "base_value": round(_phishing_base_value, 4), "prediction_deviation": None,
                "interpretation": "The phishing check could not be completed. Treat this email as suspicious until verified."}


def explain_url_input(domain: str) -> dict:
    if _url_predict_fn is None or _url_base_value is None:
        return {"error": "URL SHAP explainer not initialized."}
    try:
        import shap
        import numpy as np
        bg_preds   = _url_predict_fn(URL_BACKGROUND)
        input_pred = _url_predict_fn([domain])
        prob_mal   = float(input_pred[0, 1])

        explainer = shap.KernelExplainer(lambda x: x, bg_preds, silent=True)
        shap_vals = explainer.shap_values(input_pred, nsamples=100, silent=True)
        sv        = _extract_class1_shap(shap_vals, class_idx=1)
        shap_benign = float(sv[0]) if len(sv) > 0 else 0.0
        shap_threat = float(sv[1]) if len(sv) > 1 else 0.0

        deviation    = prob_mal - _url_base_value
        bg_mal_probs = bg_preds[:, 1]
        top_idx = np.argsort(np.abs(bg_mal_probs - prob_mal))[::-1][:3]
        top_contrasts = [
            {
                "background_domain": URL_BACKGROUND[i],
                "bg_malicious_prob": round(float(bg_mal_probs[i]), 4),
                "delta":             round(float(prob_mal - bg_mal_probs[i]), 4),
                "direction":         "more malicious" if prob_mal > bg_mal_probs[i] else "less malicious",
            }
            for i in top_idx
        ]
        return {
            "type":                    "url",
            "model_malicious_prob":    round(prob_mal, 4),
            "base_value":              round(_url_base_value, 4),
            "mean_shap_value":         round(deviation, 4),
            "prediction_deviation":    round(deviation, 4),
            "shap_feature_benign":     round(shap_benign, 4),
            "shap_feature_threat":     round(shap_threat, 4),
            "interpretation": (
                "This link is highly likely to be dangerous — it may lead to a fake login page "
                "or trigger a malware download. Do not visit it, and block it in your firewall immediately."
                if deviation > 0.20 else
                "This link looks suspicious. Avoid clicking it until your IT or security team has verified it."
                if deviation > 0.05 else
                "This link appears mostly safe, but double-check the destination before visiting, "
                "especially if it arrived unexpectedly."
            ),
            "top_contrastive_samples": top_contrasts,
        }
    except Exception as e:
        return {"type": "url", "error": str(e), "mean_shap_value": None,
                "base_value": round(_url_base_value, 4), "prediction_deviation": None,
                "interpretation": "The link check could not be completed. Do not visit this URL until it has been verified."}


def explain_prompt_injection_input(text: str) -> dict:
    if _prompt_inj_predict_fn is None or _prompt_inj_base_value is None:
        return {"error": "Prompt injection SHAP explainer not initialized."}
    try:
        import shap
        import numpy as np
        bg_preds   = _prompt_inj_predict_fn(PROMPT_INJECTION_BACKGROUND)
        input_pred = _prompt_inj_predict_fn([text])
        prob_inj   = float(input_pred[0, 1])

        explainer = shap.KernelExplainer(lambda x: x, bg_preds, silent=True)
        shap_vals = explainer.shap_values(input_pred, nsamples=100, silent=True)
        sv        = _extract_class1_shap(shap_vals, class_idx=1)
        shap_legit  = float(sv[0]) if len(sv) > 0 else 0.0
        shap_threat = float(sv[1]) if len(sv) > 1 else 0.0

        deviation    = prob_inj - _prompt_inj_base_value
        bg_inj_probs = bg_preds[:, 1]
        top_idx = np.argsort(np.abs(bg_inj_probs - prob_inj))[::-1][:3]
        top_contrasts = [
            {
                "background_text":   PROMPT_INJECTION_BACKGROUND[i],
                "bg_injection_prob": round(float(bg_inj_probs[i]), 4),
                "delta":             round(float(prob_inj - bg_inj_probs[i]), 4),
                "direction":         "more injection-like" if prob_inj > bg_inj_probs[i] else "less injection-like",
            }
            for i in top_idx
        ]
        injection_tactics = _detect_injection_tactics(text)
        return {
            "type":                    "prompt_injection",
            "model_injection_prob":    round(prob_inj, 4),
            "base_value":              round(_prompt_inj_base_value, 4),
            "mean_shap_value":         round(deviation, 4),
            "prediction_deviation":    round(deviation, 4),
            "shap_feature_legit":      round(shap_legit, 4),
            "shap_feature_threat":     round(shap_threat, 4),
            "detected_tactics":        injection_tactics,
            "interpretation": (
                "This input appears to be a deliberate attempt to hijack your AI system. "
                "It contains hidden instructions designed to override normal behaviour — block it immediately."
                if deviation > 0.20 else
                "This input has patterns that look like an attempt to manipulate the AI. "
                "Review it carefully before letting it reach any AI system."
                if deviation > 0.05 else
                "This input looks like a normal request, but monitor for any unusual AI responses that follow."
            ),
            "top_contrastive_samples": top_contrasts,
        }
    except Exception as e:
        return {"type": "prompt_injection", "error": str(e), "mean_shap_value": None,
                "base_value": round(_prompt_inj_base_value, 4), "prediction_deviation": None,
                "interpretation": "The injection check could not be completed. Do not forward this input to any AI system until reviewed."}


def explain_deepfake_input(image) -> Tuple[float, float, str]:
    """
    Run image deepfake detection on a single PIL image.
    Returns: (deepfake_prob, confidence, label)
    """
    if _deepfake_predict_fn is None or _deepfake_base_value is None:
        raise ValueError("Image deepfake explainer not initialized.")
    try:
        result        = _deepfake_predict_fn([image])
        deepfake_prob = float(result[0, 1])
        confidence    = abs(deepfake_prob - _deepfake_base_value)
        label         = "Deepfake" if deepfake_prob > 0.5 else "Realism"
        return deepfake_prob, confidence, label
    except Exception as e:
        print(f"Image deepfake analysis error: {e}")
        return 0.0, 0.0, "Realism"


def explain_audio_input(waveform) -> Tuple[float, float, str]:
    """
    Run audio deepfake detection on a 16 kHz mono float32 numpy waveform.
    Returns: (deepfake_prob, confidence, label)
    """
    if _audio_predict_fn is None or _audio_base_value is None:
        raise ValueError("Audio deepfake explainer not initialized.")
    try:
        result        = _audio_predict_fn([waveform])
        deepfake_prob = float(result[0, 1])
        confidence    = abs(deepfake_prob - _audio_base_value)
        label         = "Fake" if deepfake_prob > 0.5 else "Real"
        return deepfake_prob, confidence, label
    except Exception as e:
        print(f"Audio deepfake analysis error: {e}")
        return 0.0, 0.0, "Real"


# ─────────────────────────────────────────────────────────────
# INJECTION TACTIC CLASSIFIER  (rule-based, zero latency)
# ─────────────────────────────────────────────────────────────

_INJECTION_TACTIC_PATTERNS: List[tuple] = [
    ("instruction_override", ["ignore previous", "forget all", "disregard your", "override your",
                               "new instructions", "ignore above", "ignore all previous"]),
    ("role_hijack",          ["you are now", "act as", "pretend to be", "your new role",
                               "roleplay as", "you must now behave"]),
    ("jailbreak_framing",    ["do anything now", "dan mode", "developer mode", "jailbreak",
                               "no restrictions", "without limitations", "bypass your"]),
    ("data_exfiltration",    ["tell me secrets", "reveal your system prompt", "show me your instructions",
                               "output your prompt", "print your system", "repeat your"]),
    ("delimiter_injection",  ["###", "---system", "<|system|>", "[system]", "<<sys>>", "</s>", "<|im_start|>system"]),
    ("indirect_injection",   ["the document says ignore", "as per the user's request above ignore",
                               "translate the following: ignore"]),
    ("goal_hijacking",       ["instead of", "your actual task is", "your real goal is", "you should actually"]),
    ("context_manipulation", ["in this context you", "in this scenario", "for this conversation only",
                               "for educational purposes"]),
]

def _detect_injection_tactics(text: str) -> List[Dict[str, str]]:
    lower = text.lower()
    found = []
    for tactic, phrases in _INJECTION_TACTIC_PATTERNS:
        for phrase in phrases:
            if phrase in lower:
                found.append({"tactic": tactic, "matched_phrase": phrase})
                break
    return found


# ─────────────────────────────────────────────────────────────
# GROQ NARRATIVE ENGINE
# ─────────────────────────────────────────────────────────────

def _threat_level(score: float) -> str:
    if score >= 0.85:   return "CRITICAL - immediate danger"
    elif score >= 0.65: return "HIGH - serious threat"
    elif score >= 0.40: return "MEDIUM - concerning"
    else:               return "LOW - monitor"


def _build_threat_context(alert_types: list, timeline: list) -> str:
    blocks = []

    phishing_details       = [t for t in timeline if t.get("alert_type") == "phishing"]
    url_details            = [t for t in timeline if t.get("alert_type") == "url"]
    injection_details      = [t for t in timeline if t.get("alert_type") == "prompt_injection"]
    deepfake_details       = [t for t in timeline if t.get("alert_type") == "deepfake"]
    audio_deepfake_details = [t for t in timeline if t.get("alert_type") == "audio_deepfake"]

    if phishing_details:
        top   = max(phishing_details, key=lambda x: x["threat_score"])
        shap  = top.get("shap_note", "")
        brand_hint = ""
        for brand in ["paypal", "amazon", "apple", "microsoft", "google", "bank",
                      "netflix", "facebook", "instagram", "linkedin", "dropbox", "docusign"]:
            if brand in shap.lower():
                brand_hint = f" impersonating {brand.title()}"
                break
        blocks.append(
            f"PHISHING ATTACK DETECTED{brand_hint}:\n"
            f"- Deceptive email designed to steal login credentials or install malware.\n"
            f"- Attacker goal: capture username/password for financial accounts or corporate systems.\n"
            f"- SHAP analysis: {shap if shap else 'High deviation from legitimate email baseline.'}\n"
            f"- Specific risk: credential theft leading to unauthorized account access or financial fraud.\n"
            f"- Required actions: Do NOT click any links. Report to IT immediately.\n"
            f"  Reset passwords for any accounts mentioned in the email.\n"
            f"  Enable multi-factor authentication (MFA) on all affected accounts.\n"
            f"  Check if colleagues received the same email."
        )

    if url_details:
        top   = max(url_details, key=lambda x: x["threat_score"])
        shap  = top.get("shap_note", "")
        domain_hint = ""
        for kw in ["paypal", "amazon", "apple", "microsoft", "google", "bank",
                   "login", "secure", "verify", "account", "update", "confirm"]:
            if kw in shap.lower():
                domain_hint = f" ('{kw}' pattern in URL)"
                break
        blocks.append(
            f"MALICIOUS URL DETECTED{domain_hint}:\n"
            f"- Link leads to a fake login page, malware download, or scam site.\n"
            f"- Attacker goal: capture credentials in real time or silently install malware.\n"
            f"- SHAP analysis: {shap if shap else 'URL structure deviates strongly from known-safe domains.'}\n"
            f"- Specific risk: anyone who visits this URL may have their credentials stolen instantly.\n"
            f"- Required actions: Block this domain in your firewall immediately.\n"
            f"  Warn all staff not to visit the URL. Check browser history across the team.\n"
            f"  If anyone visited it: force-reset their passwords and scan that device for malware."
        )

    if injection_details:
        top     = max(injection_details, key=lambda x: x["threat_score"])
        shap    = top.get("shap_note", "")
        tactics = top.get("detail", {}).get("detected_tactics", [])
        tactic_names = ", ".join(t["tactic"].replace("_", " ") for t in tactics) if tactics else "unknown tactic"
        blocks.append(
            f"PROMPT INJECTION ATTACK DETECTED:\n"
            f"- Someone is injecting hidden instructions into your AI system to override its safety rules.\n"
            f"- Tactic used: {tactic_names}\n"
            f"- Attacker goal: make the AI leak confidential data, bypass security filters, or act as a tool for the attacker.\n"
            f"- SHAP analysis: {shap if shap else 'Input deviates strongly from normal user queries.'}\n"
            f"- Specific risk: AI features could be weaponized to expose internal system prompts or sensitive business data.\n"
            f"- Required actions: Block this input — do NOT pass it to any AI model.\n"
            f"  Log the source IP and user session immediately.\n"
            f"  Audit recent AI interactions for signs of successful data extraction.\n"
            f"  Add input validation and output filtering to all AI-powered endpoints."
        )

    if deepfake_details:
        top  = max(deepfake_details, key=lambda x: x["threat_score"])
        shap = top.get("shap_note", "")
        blocks.append(
            f"DEEPFAKE IMAGE DETECTED:\n"
            f"- An AI-generated or manipulated face image was submitted — likely to impersonate a real person.\n"
            f"- Attacker goal: bypass identity verification (KYC), commit account fraud, or spread disinformation.\n"
            f"- SHAP analysis: {shap if shap else 'Visual features are inconsistent with authentic photographs.'}\n"
            f"- Specific risk: if accepted, attacker gains access under a false identity enabling financial fraud or data theft.\n"
            f"- Required actions: Reject and quarantine this image immediately.\n"
            f"  Flag the submitting account for manual review — do not approve any pending requests from it.\n"
            f"  Preserve the image as evidence and escalate to your fraud team.\n"
            f"  Implement liveness detection or video verification in your identity pipeline."
        )

    if audio_deepfake_details:
        top  = max(audio_deepfake_details, key=lambda x: x["threat_score"])
        shap = top.get("shap_note", "")
        blocks.append(
            f"DEEPFAKE AUDIO DETECTED:\n"
            f"- An AI-generated or voice-cloned audio clip was submitted — likely impersonating a trusted person.\n"
            f"- Attacker goal: bypass voice authentication, authorize fraudulent transactions, or conduct social engineering.\n"
            f"- SHAP analysis: {shap if shap else 'Audio features deviate from authentic human speech patterns.'}\n"
            f"- Specific risk: if trusted, attacker can impersonate executives or customers to authorize actions (e.g. wire transfers, account changes).\n"
            f"- Required actions: Do NOT act on instructions from this audio clip.\n"
            f"  Verify via a live callback to the claimed speaker using a known-good number.\n"
            f"  Preserve the audio as forensic evidence and escalate to your fraud team.\n"
            f"  Disable or add liveness checks to any voice-authenticated workflows."
        )

    for atype in alert_types:
        if atype not in ("phishing", "url", "prompt_injection", "deepfake", "audio_deepfake"):
            blocks.append(
                f"THREAT TYPE: {atype.upper()}\n"
                f"- Suspicious activity detected. Review logs and investigate the source."
            )

    return "\n\n".join(blocks) if blocks else "Multiple threat signals detected — see timeline for details."


def generate_narrative(analysis: dict) -> dict:
    fused_score   = analysis.get("fused_score", 0)
    severity      = analysis.get("severity", "UNKNOWN")
    alert_count   = analysis.get("alert_count", 0)
    kill_chain    = analysis.get("kill_chain", {})
    tti           = analysis.get("time_to_impact", {})
    features      = analysis.get("temporal_features", {})
    timeline      = analysis.get("recent_timeline", [])

    current_stage = kill_chain.get("current_stage_name", "Unknown")
    next_stage    = kill_chain.get("predicted_next_name", "Unknown")
    stages_done   = kill_chain.get("stages_traversed", [])
    eta_minutes   = tti.get("estimate_minutes")
    alert_types   = list(set(t["alert_type"] for t in timeline))

    threat_context = _build_threat_context(alert_types, timeline)

    stage_descriptions = {
        "Recon":                "gathering information about your organization",
        "Initial Access":       "trying to break in via phishing or malicious links",
        "Execution":            "trying to run malicious code on your systems",
        "Persistence":          "trying to maintain hidden long-term access",
        "Privilege Escalation": "trying to gain administrator-level control",
        "Lateral Movement":     "trying to spread to other systems in your network",
        "Collection":           "actively stealing data from your systems",
        "Exfiltration/Impact":  "removing stolen data or causing direct damage",
    }
    current_stage_desc = stage_descriptions.get(current_stage, current_stage)
    next_stage_desc    = stage_descriptions.get(next_stage, next_stage)
    threat_level = (
        "CRITICAL" if fused_score >= 0.85 else
        "HIGH"     if fused_score >= 0.65 else
        "MEDIUM"   if fused_score >= 0.40 else "LOW"
    )
    is_multi_vector = len(alert_types) > 1
    time_window = f"~{eta_minutes} minutes" if eta_minutes else "the next short window"

    prompt = (
        "You are a cybersecurity analyst explaining a SPECIFIC, ACTIVE threat to a business executive.\n"
        "The executive is NOT technical. Use plain language. Name the exact threat. Give concrete steps.\n\n"
        "ACTIVE THREAT SUMMARY\n"
        "=====================\n"
        f"Threat level  : {threat_level} ({fused_score:.0%} confidence)\n"
        f"Severity      : {severity}\n"
        f"Alerts        : {alert_count} detected\n"
        f"Attack stage  : {current_stage} — {current_stage_desc}\n"
        f"Next stage    : {next_stage} — {next_stage_desc}\n"
        f"Time to next  : {time_window}\n"
        f"Multi-vector  : {'YES — attacker using multiple attack methods simultaneously' if is_multi_vector else 'No — single attack type'}\n"
        f"Escalating    : {'YES — severity increasing' if features.get('severity_trend', 0) > 0.5 else 'Stable'}\n\n"
        "SPECIFIC THREAT DETAILS — use these exact details in your response:\n"
        "=================================================================\n"
        f"{threat_context}\n\n"
        "YOUR TASK\n"
        "=========\n"
        "1. Name the SPECIFIC attack (e.g. 'PayPal phishing', 'deepfake KYC fraud', 'AI prompt injection', 'voice-cloned CEO fraud')\n"
        "   — NEVER say 'cyber attack' or 'suspicious activity' generically\n"
        "2. Say in one sentence what the attacker is after (money, credentials, data, AI access)\n"
        "3. Give 3 CONCRETE actions — not generic advice\n"
        "   GOOD: 'Reset all PayPal-linked passwords immediately'\n"
        "   GOOD: 'Block domain paypa1.com in your firewall right now'\n"
        "   GOOD: 'Flag the KYC submission from account ID in question for manual fraud review'\n"
        "   GOOD: 'Call the CFO back on their personal mobile to verify the wire transfer request'\n"
        "   BAD:  'Monitor the situation' / 'Contact IT' / 'Stay vigilant'\n"
        f"4. Scale urgency: CRITICAL = act in minutes, MEDIUM = act today\n\n"
        "Respond ONLY in this exact JSON (no markdown, no code fences):\n"
        '{"defender_brief": "2-3 sentences. Name the specific attack. What attacker wants. What happens if we do not act in ' + time_window + '.","attacker_narrative": "2-3 sentences from attacker POV. What we sent/deployed. What we are trying to steal. Our next move.","risk_summary": "One sentence. Specific worst case — name the exact data/money/system at risk.","immediate_actions": ["specific action 1","specific action 2","specific action 3"]}'
    )

    try:
        groq_client = _get_groq_client()
        response = groq_client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
            max_tokens=700,
        )
        raw = response.choices[0].message.content.strip()
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        narrative = json.loads(raw.strip())
        return {
            "status":             "ok",
            "model_used":         "llama-3.1-8b-instant (Groq)",
            "threat_types":       alert_types,
            "defender_brief":     narrative.get("defender_brief", ""),
            "attacker_narrative": narrative.get("attacker_narrative", ""),
            "risk_summary":       narrative.get("risk_summary", ""),
            "immediate_actions":  narrative.get("immediate_actions", []),
        }
    except json.JSONDecodeError as e:
        return {"status": "json_parse_error", "error": str(e),
                "raw_response": raw if "raw" in dir() else "no response",
                "model_used": "fallback"}
    except Exception as e:
        return {"status": "error", "error": str(e), "model_used": "fallback"}


def get_window_alerts(window_seconds: int = WINDOW_SECONDS) -> List[dict]:
    cutoff = time.time() - window_seconds
    return [a for a in alert_window if a["timestamp"] >= cutoff]


def push_alert(alert: AlertInput) -> dict:
    entry = {
        "id":              len(alert_window) + 1,
        "timestamp":       time.time(),
        "timestamp_iso":   datetime.utcnow().isoformat() + "Z",
        "alert_type":      alert.alert_type,
        "threat_score":    alert.threat_score,
        "severity":        alert.severity,
        "mitre_technique": alert.mitre_technique,
        "source_ip":       alert.source_ip,
        "detail":          alert.detail or {},
    }
    alert_window.append(entry)
    return entry


# ─────────────────────────────────────────────────────────────
# TEMPORAL FEATURES  (weights from v3.2 — tested & fixed)
# ─────────────────────────────────────────────────────────────

FEATURE_WEIGHTS = {
    "velocity":          0.05,
    "severity_trend":    0.10,
    "kill_chain_depth":  0.15,
    "kill_chain_prog":   0.15,
    "unique_techniques": 0.10,
    "recency_weight":    0.15,
    "peak_score":        0.30,
}

SEV_NUM = {"LOW": 0.2, "MEDIUM": 0.45, "HIGH": 0.75, "CRITICAL": 1.0}


def _get_stage(mitre: Optional[str]) -> Optional[int]:
    if not mitre:
        return None
    result = MITRE_STAGE_ORDER.get(mitre)
    if result is not None:
        return result
    return MITRE_STAGE_ORDER.get(mitre.split(".")[0])


def compute_temporal_features(alerts: List[dict], window_seconds: int) -> Dict[str, float]:
    n = len(alerts)
    if n == 0:
        return {k: 0.0 for k in FEATURE_WEIGHTS}

    now      = time.time()
    elapsed  = max(now - alerts[0]["timestamp"], 1.0)
    velocity = min((n / elapsed) * 10.0, 1.0)

    sev_nums = [SEV_NUM.get(a["severity"], 0.2) for a in alerts]
    mid = max(n // 2, 1)
    s1  = sum(sev_nums[:mid]) / mid
    s2  = sum(sev_nums[mid:]) / max(n - mid, 1)
    severity_trend = min(max(s2 - s1 + 0.5, 0.0), 1.0)

    stages           = [s for a in alerts for s in [_get_stage(a.get("mitre_technique"))] if s is not None]
    kill_chain_depth = max(stages) / 7.0 if stages else 0.0
    advances         = sum(1 for i in range(1, len(stages)) if stages[i] > stages[i - 1])
    kill_chain_prog  = advances / (len(stages) - 1) if len(stages) >= 2 else 0.0

    unique_techniques = min(
        len(set(a["mitre_technique"] for a in alerts if a.get("mitre_technique"))) / 6.0, 1.0
    )
    recency_weight = min(
        sum(
            a["threat_score"] * math.exp(-(now - a["timestamp"]) / (window_seconds / 2))
            for a in alerts
        ) / n, 1.0
    )
    peak_score = max(a["threat_score"] for a in alerts)

    return {k: round(v, 4) for k, v in {
        "velocity":          velocity,
        "severity_trend":    severity_trend,
        "kill_chain_depth":  kill_chain_depth,
        "kill_chain_prog":   kill_chain_prog,
        "unique_techniques": unique_techniques,
        "recency_weight":    recency_weight,
        "peak_score":        peak_score,
    }.items()}


def compute_fused_score(features: Dict[str, float]) -> float:
    return round(min(sum(features[k] * FEATURE_WEIGHTS[k] for k in FEATURE_WEIGHTS), 1.0), 4)


def detect_kill_chain_stage(alerts: List[dict]) -> dict:
    stages = [s for a in alerts for s in [_get_stage(a.get("mitre_technique"))] if s is not None]
    if not stages:
        return {
            "current_stage_index":  0,
            "current_stage_name":   MITRE_STAGE_NAMES[0],
            "predicted_next_index": 1,
            "predicted_next_name":  MITRE_STAGE_NAMES[1],
            "stage_path":           [],
            "stages_traversed":     [],
        }
    current   = stages[-1]
    predicted = min(current + 1, 7)
    return {
        "current_stage_index":  current,
        "current_stage_name":   MITRE_STAGE_NAMES[current],
        "predicted_next_index": predicted,
        "predicted_next_name":  MITRE_STAGE_NAMES[predicted],
        "stage_path":           sorted(set(stages)),
        "stages_traversed":     [MITRE_STAGE_NAMES[s] for s in sorted(set(stages))],
        "highest_stage_reached": max(stages),
    }


def estimate_time_to_impact(alerts: List[dict], kill_chain: dict) -> dict:
    if len(alerts) < 2:
        return {"estimate_minutes": None, "confidence": "low", "basis": "insufficient data"}
    elapsed = time.time() - alerts[0]["timestamp"]
    done    = len(set(kill_chain.get("stage_path", [])))
    left    = max(0, 7 - kill_chain["current_stage_index"])
    if done == 0:
        return {"estimate_minutes": None, "confidence": "low", "basis": "no stage progression"}
    return {
        "estimate_minutes": round((elapsed / done) * left / 60, 1),
        "confidence":       "high" if done >= 3 else "medium" if done >= 2 else "low",
        "basis":            f"{done} stage(s) in {elapsed:.0f}s, {left} remaining",
    }


# ─────────────────────────────────────────────────────────────
# MAIN TEMPORAL ANALYSIS
# ─────────────────────────────────────────────────────────────

def run_temporal_analysis(window_seconds: int = WINDOW_SECONDS) -> dict:
    alerts = get_window_alerts(window_seconds)
    n      = len(alerts)

    if n == 0:
        return {"status": "NO_DATA", "message": "No alerts in window.",
                "fused_score": 0.0, "alert_count": 0}

    features    = compute_temporal_features(alerts, window_seconds)
    fused_score = compute_fused_score(features)
    kill_chain  = detect_kill_chain_stage(alerts)
    tti         = estimate_time_to_impact(alerts, kill_chain)

    sev = (
        "CRITICAL" if fused_score >= .85 else
        "HIGH"     if fused_score >= .65 else
        "MEDIUM"   if fused_score >= .40 else "LOW"
    )
    verdict = (
        "ATTACK_CAMPAIGN"    if fused_score >= .65 else
        "SUSPICIOUS_PATTERN" if fused_score >= .40 else
        "MONITOR"
    )

    types  = list(set(a["alert_type"] for a in alerts))
    stage  = kill_chain["current_stage_name"]
    next_s = kill_chain["predicted_next_name"]

    defender = (
        f"[{sev}] {n} alert(s) detected. Types: {', '.join(types)}. "
        f"Kill-chain stage: {stage}. Fused score: {fused_score:.2f}. "
        f"Predicted next: {next_s}. "
        + ("IMMEDIATE ACTION — isolate endpoints and revoke active sessions." if fused_score >= .65
           else "Escalate to Tier 2. Monitor for lateral movement."           if fused_score >= .40
           else "Continue monitoring.")
    )
    attacker = (
        f"Objective: credential theft → lateral movement → exfiltration. "
        f"Completed stages: {' → '.join(kill_chain.get('stages_traversed', []))}. "
        f"Next move: {next_s}."
    ) if n >= 3 else "Insufficient signal to model attacker objective."

    timeline = [
        {
            "id":             a["id"],
            "timestamp_iso":  a["timestamp_iso"],
            "alert_type":     a["alert_type"],
            "severity":       a["severity"],
            "threat_score":   a["threat_score"],
            "mitre":          a.get("mitre_technique"),
            "shap_deviation": a["detail"].get("shap", {}).get("mean_shap_value"),
            "shap_note":      a["detail"].get("shap", {}).get("interpretation"),
        }
        for a in alerts[-5:]
    ]

    result = {
        "status":             "FULL_ANALYSIS" if n >= ESCALATION_THRESHOLD else "PARTIAL",
        "verdict":            verdict,
        "severity":           sev,
        "fused_score":        fused_score,
        "alert_count":        n,
        "window_seconds":     window_seconds,
        "temporal_features":  features,
        "kill_chain":         kill_chain,
        "time_to_impact":     tti,
        "defender_view":      defender,
        "attacker_view":      attacker,
        "recent_timeline":    timeline,
        "recommended_action": (
            "IMMEDIATE: Isolate systems, revoke sessions, escalate to CSIRT." if sev == "CRITICAL" else
            "Escalate to Tier 2. Investigate lateral movement paths."         if sev == "HIGH"     else
            "Monitor closely. Increase logging verbosity."                    if sev == "MEDIUM"   else
            "Continue passive monitoring."
        ),
    }

    if fused_score >= 0.40 and n >= ESCALATION_THRESHOLD:
        result["ai_narrative"] = generate_narrative(result)
    else:
        result["ai_narrative"] = {
            "status":             "skipped",
            "reason":             f"fused_score={fused_score:.2f} or alert_count={n} below threshold",
            "defender_brief":     defender,
            "attacker_narrative": attacker,
            "risk_summary":       f"Monitor — {n} alert(s), score {fused_score:.2f}.",
            "immediate_actions":  [result["recommended_action"]],
            "model_used":         "rule-based fallback",
        }

    return result