# main.py
# ─────────────────────────────────────────────────────────────
# AEGIS — Phase 1 + Phase 2 + Prompt Injection
# v3.2 — prompt injection detection added (protectai/deberta-v3-base-prompt-injection-v2)
#
# Endpoints:
#   POST /analyze/phishing          — phishing email detection + SHAP
#   POST /analyze/url               — malicious URL detection + SHAP
#   POST /analyze/prompt-injection  — prompt injection detection + SHAP + tactic tagging
#   POST /ingest/alert              — push alert into sliding window
#   POST /analyze/temporal          — temporal fusion analysis
#   GET  /alerts/window             — view current window
#   DELETE /alerts/reset            — clear window
#   GET  /health
# ─────────────────────────────────────────────────────────────

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, field_validator
from transformers import AutoTokenizer, AutoModelForSequenceClassification
from urllib.parse import urlparse
from typing import Optional
import torch

from temporal_fusion import (
    AlertInput,
    TemporalAnalysisRequest,
    push_alert,
    get_window_alerts,
    run_temporal_analysis,
    alert_window,
    init_phishing_explainer,
    init_url_explainer,
    init_prompt_injection_explainer,       # ← NEW
    explain_phishing_input,
    explain_url_input,
    explain_prompt_injection_input,        # ← NEW
)

app = FastAPI(title="AEGIS Threat Detection", version="3.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─────────────────────────────────────────────────────────────
# LOAD MODELS + INIT SHAP AT STARTUP
# ─────────────────────────────────────────────────────────────

print("Loading phishing model...")
phishing_tokenizer = AutoTokenizer.from_pretrained(
    "cybersectony/phishing-email-detection-distilbert_v2.1"
)
phishing_model = AutoModelForSequenceClassification.from_pretrained(
    "cybersectony/phishing-email-detection-distilbert_v2.1"
)
phishing_model.eval()
print("Phishing model ready.")

print("Loading URL model...")
url_tokenizer = AutoTokenizer.from_pretrained("kmack/malicious-url-detection")
url_model     = AutoModelForSequenceClassification.from_pretrained(
    "kmack/malicious-url-detection"
)
url_model.eval()
print("URL model ready.")

# ── NEW: Prompt injection model ──────────────────────────────
print("Loading prompt injection model...")
prompt_inj_tokenizer = AutoTokenizer.from_pretrained(
    "protectai/deberta-v3-base-prompt-injection-v2"
)
prompt_inj_model = AutoModelForSequenceClassification.from_pretrained(
    "protectai/deberta-v3-base-prompt-injection-v2"
)
prompt_inj_model.eval()
print("Prompt injection model ready.")
# ────────────────────────────────────────────────────────────

# Init SHAP — runs 10 background predictions per model, no forward passes on user data yet
init_phishing_explainer(phishing_tokenizer, phishing_model)
init_url_explainer(url_tokenizer, url_model)
init_prompt_injection_explainer(prompt_inj_tokenizer, prompt_inj_model)   # ← NEW

print("✅ All models + SHAP explainers ready. Server starting...")


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

# ── Prompt injection label map for deberta-v3-base-prompt-injection-v2 ──
# label 0 → INJECTION, label 1 → LEGITIMATE
PROMPT_INJ_LABEL_MAP = {0: "INJECTION", 1: "LEGITIMATE"}


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
    # Build input text
    full_text = (f"Subject: {body.subject}\n\n" if body.subject else "") + body.body

    # Model inference
    inputs = phishing_tokenizer(
        full_text, return_tensors="pt", truncation=True, max_length=512
    )
    with torch.no_grad():
        probs = torch.nn.functional.softmax(
            phishing_model(**inputs).logits, dim=-1
        )

    scores = {PHISHING_LABEL_MAP[i]: round(p, 4) for i, p in enumerate(probs[0].tolist())}
    phishing_combined        = scores["phishing_url"] + scores["phishing_url_alt"]
    scores["phishing_combined"] = round(phishing_combined, 4)

    top_label = max(
        ["legitimate_email", "phishing_url", "legitimate_url", "phishing_url_alt"],
        key=lambda l: scores[l],
    )
    is_threat = top_label in ("phishing_url", "phishing_url_alt")
    verdict   = "THREAT" if is_threat else "SAFE"
    severity  = severity_from_score(phishing_combined)

    found_keywords = [kw for kw in PHISHING_KEYWORDS if kw.lower() in full_text.lower()]
    explanation    = (
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

    # SHAP + auto-ingest on THREAT only
    if is_threat:
        shap_result = explain_phishing_input(full_text)
        result["shap"] = shap_result
        push_alert(AlertInput(
            alert_type      = "phishing",
            threat_score    = round(phishing_combined, 4),
            severity        = severity,
            mitre_technique = "T1566.001",
            detail          = {
                "verdict":   verdict,
                "top_label": top_label,
                "shap":      shap_result,
            },
        ))
        result["ingested_to_window"] = True

    return result


# ─────────────────────────────────────────────────────────────
# ENDPOINT 2 — POST /analyze/url
# ─────────────────────────────────────────────────────────────

@app.post("/analyze/url")
def analyze_url(body: TextInput):
    domain = extract_domain(body.text)

    inputs = url_tokenizer(
        domain, return_tensors="pt", truncation=True, padding=True, max_length=128
    )
    with torch.no_grad():
        probs = torch.nn.functional.softmax(
            url_model(**inputs).logits, dim=-1
        )

    raw    = probs[0].tolist()
    scores = {"benign": round(raw[0], 4), "malicious": round(raw[1], 4)}

    is_threat    = scores["malicious"] > scores["benign"]
    verdict      = "THREAT" if is_threat else "SAFE"
    threat_score = scores["malicious"]
    severity     = severity_from_score(threat_score)

    found_patterns = [p for p in URL_SUSPICIOUS_PATTERNS if p.lower() in body.text.lower()]
    explanation    = (
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

    # SHAP + auto-ingest on THREAT only
    if is_threat:
        shap_result = explain_url_input(domain)
        result["shap"] = shap_result
        push_alert(AlertInput(
            alert_type      = "url",
            threat_score    = round(threat_score, 4),
            severity        = severity,
            mitre_technique = "T1566.002",
            detail          = {
                "domain":       domain,
                "original_url": body.text,
                "shap":         shap_result,
            },
        ))
        result["ingested_to_window"] = True

    return result


# ─────────────────────────────────────────────────────────────
# ENDPOINT 3 — POST /analyze/prompt-injection   ← NEW
# ─────────────────────────────────────────────────────────────

@app.post("/analyze/prompt-injection")
def analyze_prompt_injection(body: PromptInjectionInput):
    # Model inference — text only, no context wrapping
    inputs = prompt_inj_tokenizer(
        body.text, return_tensors="pt", truncation=True, max_length=512, padding=True
    )
    with torch.no_grad():
        probs = torch.nn.functional.softmax(
            prompt_inj_model(**inputs).logits, dim=-1
        )

    raw_probs = probs[0].tolist()
    # label 0 = BENIGN, label 1 = INJECTION  (per protectai model card)
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
        f"This input appears designed to override, hijack, or manipulate LLM instructions."
        if is_threat else
        f"Input appears legitimate ({scores['legitimate'] * 100:.1f}% confidence). "
        f"No injection patterns detected."
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

    # SHAP + tactic tags + auto-ingest on THREAT only
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
# ENDPOINT 4 — POST /ingest/alert
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
# ENDPOINT 5 — POST /analyze/temporal
# ─────────────────────────────────────────────────────────────

@app.post("/analyze/temporal")
def analyze_temporal(req: TemporalAnalysisRequest = None):
    window_secs = req.window_seconds if req else WINDOW_SECONDS
    return run_temporal_analysis(window_secs)


# ─────────────────────────────────────────────────────────────
# ENDPOINT 6 — GET /alerts/window
# ─────────────────────────────────────────────────────────────

@app.get("/alerts/window")
def get_window():
    alerts = get_window_alerts()
    return {"alert_count": len(alerts), "alerts": alerts}


# ─────────────────────────────────────────────────────────────
# ENDPOINT 7 — DELETE /alerts/reset
# ─────────────────────────────────────────────────────────────

@app.delete("/alerts/reset")
def reset_window():
    alert_window.clear()
    return {"status": "cleared", "message": "Alert window has been reset."}


# ─────────────────────────────────────────────────────────────
# ENDPOINT 8 — GET /health
# ─────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    from temporal_fusion import _phishing_base_value, _url_base_value, _prompt_inj_base_value
    return {
        "status":  "ok",
        "version": "3.2.0",
        "models": {
            "phishing":         "cybersectony/phishing-email-detection-distilbert_v2.1",
            "url":              "kmack/malicious-url-detection",
            "prompt_injection": "protectai/deberta-v3-base-prompt-injection-v2",   # ← NEW
        },
        "shap": {
            "method":                    "KernelExplainer on output-probability space",
            "phishing_base_value":       round(_phishing_base_value, 4)   if _phishing_base_value   else None,
            "url_base_value":            round(_url_base_value, 4)        if _url_base_value        else None,
            "prompt_inj_base_value":     round(_prompt_inj_base_value, 4) if _prompt_inj_base_value else None,  # ← NEW
            "background_size":           10,
            "nsamples":                  100,
        },
        "temporal_window": {
            "active_alerts":  len(get_window_alerts()),
            "window_seconds": 300,
        },
    }