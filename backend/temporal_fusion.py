# temporal_fusion.py
# ─────────────────────────────────────────────────────────────
# AEGIS — Phase 2: Temporal Fusion + SHAP + Groq Narrative
#
# SHAP approach: KernelExplainer on output-probability space.
# Groq: llama-3.1-8b-instant generates defender + attacker
#       narrative from the fused analysis output.
#
# pip install shap groq python-dotenv
# ─────────────────────────────────────────────────────────────

import os
import json
import shap
import torch
import numpy as np
import time
import math
from dotenv import load_dotenv
from collections import deque
from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, field_validator
from groq import Groq

# ── Load .env before anything else ──────────────────────────
load_dotenv()

# ── Config ──────────────────────────────────────────────────
WINDOW_SECONDS       = 300
MAX_ALERTS           = 50
ESCALATION_THRESHOLD = 3

# ── Groq client — reads API_KEY from .env ───────────────────
groq_client = Groq(api_key=os.environ.get("API_KEY"))

# ── MITRE kill-chain ────────────────────────────────────────
MITRE_STAGE_ORDER = {
    "T1595": 0, "T1592": 0,
    "T1566": 1, "T1566.001": 1, "T1566.002": 1,
    "T1059": 2, "T1078": 2, "T1053": 2,
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
# SHAP — global state
# ─────────────────────────────────────────────────────────────

_phishing_predict_fn = None
_url_predict_fn      = None
_phishing_base_value = None
_url_base_value      = None

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
    "github.com",
    "google.com",
    "stackoverflow.com",
    "docs.python.org",
    "wikipedia.org",
    "npmjs.com",
    "pypi.org",
    "linkedin.com",
    "microsoft.com",
    "amazon.com",
]


# ─────────────────────────────────────────────────────────────
# PREDICT FUNCTIONS
# ─────────────────────────────────────────────────────────────

def _make_phishing_predict(tokenizer, model):
    def predict(texts):
        results = []
        for t in texts:
            enc = tokenizer(
                str(t), return_tensors="pt",
                truncation=True, max_length=512, padding=True
            )
            with torch.no_grad():
                p = torch.nn.functional.softmax(
                    model(**enc).logits, dim=-1
                )[0].tolist()
            results.append([p[0] + p[2], p[1] + p[3]])  # [legit, phishing]
        return np.array(results, dtype=float)
    return predict


def _make_url_predict(tokenizer, model):
    def predict(domains):
        results = []
        for d in domains:
            enc = tokenizer(
                str(d), return_tensors="pt",
                truncation=True, padding=True, max_length=128
            )
            with torch.no_grad():
                p = torch.nn.functional.softmax(
                    model(**enc).logits, dim=-1
                )[0].tolist()
            results.append([p[0], p[1]])  # [benign, malicious]
        return np.array(results, dtype=float)
    return predict


# ─────────────────────────────────────────────────────────────
# INIT — called from main.py after models load
# ─────────────────────────────────────────────────────────────

def init_phishing_explainer(tokenizer, model):
    global _phishing_predict_fn, _phishing_base_value
    if _phishing_predict_fn is not None:
        return
    print("Initializing phishing SHAP explainer...")
    _phishing_predict_fn = _make_phishing_predict(tokenizer, model)
    bg_preds = _phishing_predict_fn(PHISHING_BACKGROUND)
    _phishing_base_value = float(np.mean(bg_preds[:, 1]))
    print(f"Phishing SHAP ready. Base value: {_phishing_base_value:.4f}")


def init_url_explainer(tokenizer, model):
    global _url_predict_fn, _url_base_value
    if _url_predict_fn is not None:
        return
    print("Initializing URL SHAP explainer...")
    _url_predict_fn = _make_url_predict(tokenizer, model)
    bg_preds = _url_predict_fn(URL_BACKGROUND)
    _url_base_value = float(np.mean(bg_preds[:, 1]))
    print(f"URL SHAP ready. Base value: {_url_base_value:.4f}")


# ─────────────────────────────────────────────────────────────
# SHAP SHAPE NORMALIZER
#
# Debug confirmed your shap version returns shape (1, 2, 2):
#   axis 0 = n_samples  (1)
#   axis 1 = n_features (2)  ← the [legit, phishing] values
#   axis 2 = n_classes  (2)
#
# To get feature attributions for class 1 (phishing/malicious):
#   sv[0, :, 1]  →  shape (2,)  ← exactly what we need
#
# All other shapes handled as fallbacks for portability.
# ─────────────────────────────────────────────────────────────

def _extract_class1_shap(shap_vals: any, class_idx: int = 1) -> np.ndarray:
    sv = np.array(shap_vals)

    if sv.ndim == 3 and sv.shape[0] == 1:
        # YOUR version: (n_samples=1, n_features=2, n_classes=2)
        # confirmed by debug_shap.py → shape (1, 2, 2)
        return sv[0, :, class_idx]

    elif sv.ndim == 3:
        # older shap: (n_classes, n_samples, n_features)
        return sv[class_idx].flatten()

    elif sv.ndim == 2 and sv.shape[0] == 1:
        # (1, n_features) — no class dim
        return sv[0]

    elif sv.ndim == 2 and sv.shape[1] == 2:
        # (n_features, n_classes) — transposed
        return sv[:, class_idx]

    else:
        return sv.flatten()


# ─────────────────────────────────────────────────────────────
# SHAP EXPLANATIONS
# ─────────────────────────────────────────────────────────────

def explain_phishing_input(text: str) -> dict:
    if _phishing_predict_fn is None or _phishing_base_value is None:
        return {"error": "Phishing SHAP explainer not initialized."}
    try:
        bg_preds      = _phishing_predict_fn(PHISHING_BACKGROUND)
        input_pred    = _phishing_predict_fn([text])
        prob_phishing = float(input_pred[0, 1])

        explainer = shap.KernelExplainer(lambda x: x, bg_preds, silent=True)
        shap_vals = explainer.shap_values(input_pred, nsamples=100, silent=True)

        sv_phishing = _extract_class1_shap(shap_vals, class_idx=1)
        shap_legit  = float(sv_phishing[0]) if len(sv_phishing) > 0 else 0.0
        shap_threat = float(sv_phishing[1]) if len(sv_phishing) > 1 else 0.0

        base_value = _phishing_base_value
        deviation  = prob_phishing - base_value

        bg_phishing_probs = bg_preds[:, 1]
        top_idx = np.argsort(np.abs(bg_phishing_probs - prob_phishing))[::-1][:3]
        top_contrasts = [
            {
                "background_text":  PHISHING_BACKGROUND[i],
                "bg_phishing_prob": round(float(bg_phishing_probs[i]), 4),
                "delta":            round(float(prob_phishing - bg_phishing_probs[i]), 4),
                "direction":        "more suspicious" if prob_phishing > bg_phishing_probs[i] else "less suspicious"
            }
            for i in top_idx
        ]

        return {
            "type":                    "phishing",
            "model_phishing_prob":     round(prob_phishing, 4),
            "base_value":              round(base_value, 4),
            "mean_shap_value":         round(deviation, 4),
            "prediction_deviation":    round(deviation, 4),
            "shap_feature_legit":      round(shap_legit, 4),
            "shap_feature_threat":     round(shap_threat, 4),
            "interpretation": (
                f"Model output {prob_phishing:.4f} vs baseline {base_value:.4f} "
                f"(deviation={deviation:+.4f}). "
                + ("Strong phishing signal above baseline."       if deviation > 0.20
                   else "Moderate phishing signal."               if deviation > 0.05
                   else "Close to baseline — low confidence phishing.")
            ),
            "top_contrastive_samples": top_contrasts,
        }
    except Exception as e:
        return {
            "type":                 "phishing",
            "error":                str(e),
            "mean_shap_value":      None,
            "base_value":           round(_phishing_base_value, 4),
            "prediction_deviation": None,
            "interpretation":       "SHAP computation failed — see error field.",
        }


def explain_url_input(domain: str) -> dict:
    if _url_predict_fn is None or _url_base_value is None:
        return {"error": "URL SHAP explainer not initialized."}
    try:
        bg_preds   = _url_predict_fn(URL_BACKGROUND)
        input_pred = _url_predict_fn([domain])
        prob_mal   = float(input_pred[0, 1])

        explainer = shap.KernelExplainer(lambda x: x, bg_preds, silent=True)
        shap_vals = explainer.shap_values(input_pred, nsamples=100, silent=True)

        sv_mal      = _extract_class1_shap(shap_vals, class_idx=1)
        shap_benign = float(sv_mal[0]) if len(sv_mal) > 0 else 0.0
        shap_threat = float(sv_mal[1]) if len(sv_mal) > 1 else 0.0

        base_value = _url_base_value
        deviation  = prob_mal - base_value

        bg_mal_probs = bg_preds[:, 1]
        top_idx = np.argsort(np.abs(bg_mal_probs - prob_mal))[::-1][:3]
        top_contrasts = [
            {
                "background_domain": URL_BACKGROUND[i],
                "bg_malicious_prob": round(float(bg_mal_probs[i]), 4),
                "delta":             round(float(prob_mal - bg_mal_probs[i]), 4),
                "direction":         "more malicious" if prob_mal > bg_mal_probs[i] else "less malicious"
            }
            for i in top_idx
        ]

        return {
            "type":                    "url",
            "model_malicious_prob":    round(prob_mal, 4),
            "base_value":              round(base_value, 4),
            "mean_shap_value":         round(deviation, 4),
            "prediction_deviation":    round(deviation, 4),
            "shap_feature_benign":     round(shap_benign, 4),
            "shap_feature_threat":     round(shap_threat, 4),
            "interpretation": (
                f"Model output {prob_mal:.4f} vs baseline {base_value:.4f} "
                f"(deviation={deviation:+.4f}). "
                + ("High malicious signal above baseline." if deviation > 0.20
                   else "Moderate malicious signal."       if deviation > 0.05
                   else "Close to baseline — low confidence malicious.")
            ),
            "top_contrastive_samples": top_contrasts,
        }
    except Exception as e:
        return {
            "type":                 "url",
            "error":                str(e),
            "mean_shap_value":      None,
            "base_value":           round(_url_base_value, 4),
            "prediction_deviation": None,
            "interpretation":       "SHAP computation failed — see error field.",
        }


# ─────────────────────────────────────────────────────────────
# GROQ NARRATIVE ENGINE
# Called only when fused_score >= 0.40 AND alert_count >= 3
# Never crashes the endpoint — always returns a fallback
# ─────────────────────────────────────────────────────────────

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

    shap_notes = [
        f"[{t['alert_type']} | score={t['threat_score']} | mitre={t.get('mitre')}] {t.get('shap_note', '')}"
        for t in timeline if t.get("shap_note")
    ]
    shap_summary = "\n".join(shap_notes) if shap_notes else "No SHAP deviation notes available."

    prompt = f"""You are a senior SOC analyst and threat intelligence expert at a Fortune 500 company.

You have received the following real-time attack intelligence from an AI-powered detection system:

THREAT SIGNALS:
- Alert types detected: {', '.join(alert_types) if alert_types else 'unknown'}
- Total alerts in window: {alert_count}
- Fused threat score: {fused_score:.2f} / 1.0
- Severity: {severity}
- Kill-chain stage now: {current_stage}
- Stages traversed: {' → '.join(stages_done) if stages_done else 'none recorded'}
- Predicted next stage: {next_stage}
- Estimated time to next move: {f'~{eta_minutes} minutes' if eta_minutes else 'unknown'}

TEMPORAL FEATURES (0.0–1.0):
- Alert velocity: {features.get('velocity', 0):.2f}
- Kill-chain progression rate: {features.get('kill_chain_prog', 0):.2f}
- Kill-chain depth reached: {features.get('kill_chain_depth', 0):.2f}
- Severity trend (rising=1.0): {features.get('severity_trend', 0):.2f}
- Peak individual threat score: {features.get('peak_score', 0):.2f}

AI EXPLAINABILITY (SHAP deviations from baseline):
{shap_summary}

Respond in this EXACT JSON format. No markdown, no extra text, no code fences:
{{
  "defender_brief": "3 sentences for a SOC analyst. Sentence 1: what is happening right now and what attack type this is. Sentence 2: what the attacker will do next and why. Sentence 3: the single most critical action to take immediately. Be specific — name the stage, technique, and time pressure.",
  "attacker_narrative": "3 sentences written in first person as the attacker. Start with 'I have...'. Sentence 1: what you have already accomplished. Sentence 2: what your next move is and how you will execute it. Sentence 3: why the defender is running out of time. Make it specific and chilling.",
  "risk_summary": "One sentence. The single worst outcome if no action is taken in the next 10 minutes.",
  "immediate_actions": ["specific action 1", "specific action 2", "specific action 3"]
}}"""

    try:
        response = groq_client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=600,
        )

        raw = response.choices[0].message.content.strip()

        # Strip markdown fences if model wraps in ```json ... ```
        if raw.startswith("```"):
            parts = raw.split("```")
            raw = parts[1] if len(parts) > 1 else raw
            if raw.startswith("json"):
                raw = raw[4:]
        raw = raw.strip()

        narrative = json.loads(raw)

        return {
            "status":             "ok",
            "model_used":         "llama-3.1-8b-instant (Groq)",
            "defender_brief":     narrative.get("defender_brief", ""),
            "attacker_narrative": narrative.get("attacker_narrative", ""),
            "risk_summary":       narrative.get("risk_summary", ""),
            "immediate_actions":  narrative.get("immediate_actions", []),
        }

    except json.JSONDecodeError as e:
        return {
            "status":             "json_parse_error",
            "error":              str(e),
            "raw_response":       raw if 'raw' in locals() else "no response",
            "defender_brief":     analysis.get("defender_view", ""),
            "attacker_narrative": analysis.get("attacker_view", ""),
            "risk_summary":       "AI narrative parse failed — see defender_view.",
            "immediate_actions":  [analysis.get("recommended_action", "")],
            "model_used":         "fallback",
        }

    except Exception as e:
        return {
            "status":             "error",
            "error":              str(e),
            "defender_brief":     analysis.get("defender_view", ""),
            "attacker_narrative": analysis.get("attacker_view", ""),
            "risk_summary":       "AI narrative unavailable — see defender_view.",
            "immediate_actions":  [analysis.get("recommended_action", "")],
            "model_used":         "fallback",
        }


# ─────────────────────────────────────────────────────────────
# SLIDING WINDOW
# ─────────────────────────────────────────────────────────────

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
# TEMPORAL FEATURES
# ─────────────────────────────────────────────────────────────

FEATURE_WEIGHTS = {
    "velocity":          0.20,
    "severity_trend":    0.15,
    "kill_chain_depth":  0.20,
    "kill_chain_prog":   0.20,
    "unique_techniques": 0.10,
    "recency_weight":    0.10,
    "peak_score":        0.05,
}

SEV_NUM = {"LOW": 0.2, "MEDIUM": 0.45, "HIGH": 0.75, "CRITICAL": 1.0}


def _get_stage(mitre: Optional[str]) -> Optional[int]:
    if not mitre:
        return None
    return MITRE_STAGE_ORDER.get(mitre) or MITRE_STAGE_ORDER.get(mitre.split(".")[0])


def compute_temporal_features(alerts: List[dict], window_seconds: int) -> Dict[str, float]:
    n = len(alerts)
    if n == 0:
        return {k: 0.0 for k in FEATURE_WEIGHTS}

    now      = time.time()
    elapsed  = max(now - alerts[0]["timestamp"], 1.0)
    velocity = min((n / elapsed) * 60 / 10.0, 1.0)

    sev_nums = [SEV_NUM.get(a["severity"], 0.2) for a in alerts]
    mid      = max(n // 2, 1)
    s1       = sum(sev_nums[:mid]) / mid
    s2       = sum(sev_nums[mid:]) / max(n - mid, 1)
    severity_trend = min(max(s2 - s1 + 0.5, 0.0), 1.0)

    stages           = [s for a in alerts for s in [_get_stage(a.get("mitre_technique"))] if s is not None]
    kill_chain_depth = max(stages) / 7.0 if stages else 0.0
    advances         = sum(1 for i in range(1, len(stages)) if stages[i] > stages[i - 1])
    kill_chain_prog  = advances / (len(stages) - 1) if len(stages) >= 2 else 0.0

    unique_techniques = min(
        len(set(a["mitre_technique"] for a in alerts if a.get("mitre_technique"))) / 6.0,
        1.0
    )

    recency_weight = min(
        sum(
            a["threat_score"] * math.exp(-(now - a["timestamp"]) / (window_seconds / 2))
            for a in alerts
        ) / n,
        1.0
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
    stages    = [s for a in alerts for s in [_get_stage(a.get("mitre_technique"))] if s is not None]
    current   = max(stages) if stages else 0
    predicted = min(current + 1, 7)
    return {
        "current_stage_index":  current,
        "current_stage_name":   MITRE_STAGE_NAMES[current],
        "predicted_next_index": predicted,
        "predicted_next_name":  MITRE_STAGE_NAMES[predicted],
        "stage_path":           sorted(set(stages)),
        "stages_traversed":     [MITRE_STAGE_NAMES[s] for s in sorted(set(stages))],
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
        return {
            "status":      "NO_DATA",
            "message":     "No alerts in window. Ingest alerts via POST /ingest/alert",
            "fused_score": 0.0,
            "alert_count": 0,
        }

    features    = compute_temporal_features(alerts, window_seconds)
    fused_score = compute_fused_score(features)
    kill_chain  = detect_kill_chain_stage(alerts)
    tti         = estimate_time_to_impact(alerts, kill_chain)

    sev = (
        "CRITICAL" if fused_score >= .85 else
        "HIGH"     if fused_score >= .65 else
        "MEDIUM"   if fused_score >= .40 else
        "LOW"
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

    # ── Groq narrative — fires when there's enough signal ──
    if fused_score >= 0.40 and n >= ESCALATION_THRESHOLD:
        result["ai_narrative"] = generate_narrative(result)
    else:
        result["ai_narrative"] = {
            "status":             "skipped",
            "reason":             f"fused_score={fused_score:.2f} or alert_count={n} below threshold (need score>=0.40 and alerts>=3)",
            "defender_brief":     defender,
            "attacker_narrative": attacker,
            "risk_summary":       f"Monitor — {n} alert(s), score {fused_score:.2f}.",
            "immediate_actions":  [result["recommended_action"]],
            "model_used":         "rule-based fallback",
        }

    return result