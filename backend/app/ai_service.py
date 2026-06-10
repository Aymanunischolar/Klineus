from __future__ import annotations

import json
import re
import time
from typing import Any

import requests

from app.config import get_settings
from app.report_service import (
    DISCLAIMER,
    ensure_disclaimer,
    format_minimum_answers_for_ai,
)


class AIServiceError(RuntimeError):
    pass


RETRY_STATUS_CODES = {429, 500, 502, 503, 504}


def clean_text(value: Any) -> str:
    text = str(value or "").strip()

    replacements = {
        "**": "",
        "__": "",
        "`": "",
        "Idk": "unklar",
        "idk": "unklar",
        "IDK": "unklar",
        "I don't know": "unklar",
        "i don't know": "unklar",
        "Keine Angabe.": "nicht angegeben",
    }

    for old, new in replacements.items():
        text = text.replace(old, new)

    text = re.sub(r"^\s*[-*•]\s+", "", text)
    text = re.sub(r"\s+", " ", text)
    text = text.strip()

    return text


def clean_list(value: Any) -> list[str]:
    if not value:
        return []

    if isinstance(value, list):
        return [
            clean_text(item)
            for item in value
            if clean_text(item)
        ]

    text = clean_text(value)

    if not text:
        return []

    return [text]


def clean_dict(value: Any) -> dict[str, Any]:
    if not isinstance(value, dict):
        return {}

    cleaned: dict[str, Any] = {}

    for key, item in value.items():
        if isinstance(item, dict):
            cleaned[key] = clean_dict(item)
        elif isinstance(item, list):
            cleaned[key] = clean_list(item)
        else:
            cleaned[key] = clean_text(item)

    return cleaned


def build_report_prompt(
    answers: list[dict],
    indication: str | None = None,
    questionnaire_version: int | None = None,
) -> str:
    structured_answers = format_minimum_answers_for_ai(answers)

    if indication == "hip_tep":
        indication_label = "Hüft-TEP"
        joint_label = "Hüfte"
    elif indication == "knee_tep":
        indication_label = "Knie-TEP"
        joint_label = "Knie"
    else:
        indication_label = indication or "nicht angegeben"
        joint_label = "Gelenk"

    version_label = (
        f"Version {questionnaire_version}"
        if questionnaire_version is not None
        else "Version nicht angegeben"
    )

    return f"""
You are creating a structured medical documentation draft for a physician.

Return JSON only.
Do not return Markdown.
Do not use code fences.
Do not use **bold**.
Do not include bullet characters inside text.
Do not include duplicate disclaimers.
Do not invent facts.
Do not diagnose.
Do not recommend surgery.
Do not make treatment decisions.
Use only the supplied questionnaire answers.
Use German medical documentation style.
Keep the language concise and professional.
Translate unclear answers such as "Idk" to "unklar".
If information is missing, contradictory or unclear, write "unklar" or "nicht angegeben".

Clinical context:
- Fragebogen: {indication_label}
- Gelenk: {joint_label}
- Fragebogen-Version: {version_label}

Return exactly this JSON shape:

{{
  "title": "Klineus Dokumentationsentwurf",
  "disclaimer": "{DISCLAIMER}",
  "summary": [
    "Kurzer Punkt 1",
    "Kurzer Punkt 2"
  ],
  "complaints": {{
    "text": "Kurze Zusammenfassung der Beschwerden.",
    "unclear_or_contradictory": [
      "Unklare oder widersprüchliche Angabe."
    ]
  }},
  "functional_limitations": {{
    "text": "Kurze Zusammenfassung der funktionellen Einschränkungen.",
    "key_points": [
      "Punkt"
    ]
  }},
  "conservative_treatment": {{
    "text": "Kurze Zusammenfassung der bisherigen Behandlung.",
    "key_points": [
      "Punkt"
    ]
  }},
  "findings_and_documents": {{
    "text": "Kurze Zusammenfassung vorhandener Vorbefunde und Unterlagen.",
    "key_points": [
      "Punkt"
    ]
  }},
  "risk_notes": {{
    "critical_to_clarify": [
      "Wichtiger Risikohinweis, der ärztlich geklärt werden muss."
    ],
    "other_notes": [
      "Weitere relevante Hinweise."
    ]
  }},
  "doctor_questions": [
    "Offene Frage für das Arztgespräch."
  ],
  "documentation_draft": {{
    "anlass": "Kurztext.",
    "anamnese": "Kurztext.",
    "funktion": "Kurztext.",
    "vorbehandlung": "Kurztext.",
    "vorbefunde": "Kurztext.",
    "risiken_komorbiditaeten": "Kurztext.",
    "weiteres_vorgehen_zu_klaeren": "Kurztext."
  }},
  "final_note": "KI-generierter Entwurf. Ärztliche Prüfung, Korrektur und Freigabe erforderlich."
}}

Patient questionnaire answers:
{structured_answers}
""".strip()


def parse_json_from_ai_output(raw_text: str) -> dict[str, Any]:
    cleaned = raw_text.strip()

    cleaned = re.sub(r"^```json\s*", "", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"^```\s*", "", cleaned)
    cleaned = re.sub(r"\s*```$", "", cleaned)

    try:
        data = json.loads(cleaned)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", cleaned, flags=re.DOTALL)

        if not match:
            raise AIServiceError("Gemini did not return valid JSON.")

        try:
            data = json.loads(match.group(0))
        except json.JSONDecodeError as exc:
            raise AIServiceError("Gemini returned malformed JSON.") from exc

    if not isinstance(data, dict):
        raise AIServiceError("Gemini JSON response was not an object.")

    return clean_dict(data)


def safe_section_text(data: dict[str, Any], key: str) -> str:
    section = data.get(key)

    if isinstance(section, dict):
        return clean_text(section.get("text"))

    return clean_text(section)


def safe_section_list(data: dict[str, Any], key: str, list_key: str) -> list[str]:
    section = data.get(key)

    if isinstance(section, dict):
        return clean_list(section.get(list_key))

    return []


def add_heading(lines: list[str], heading: str) -> None:
    lines.append("")
    lines.append(f"## {heading}")


def add_bullets(lines: list[str], items: list[str], fallback: str = "Nicht angegeben.") -> None:
    clean_items = [clean_text(item) for item in items if clean_text(item)]

    if not clean_items:
        lines.append(f"- {fallback}")
        return

    for item in clean_items:
        lines.append(f"- {item}")


def build_markdown_from_report_json(report_json: dict[str, Any]) -> str:
    title = clean_text(report_json.get("title")) or "Klineus Dokumentationsentwurf"

    lines: list[str] = [
        DISCLAIMER,
        "",
        f"# {title}",
    ]

    add_heading(lines, "1. Kurzüberblick")
    add_bullets(lines, clean_list(report_json.get("summary")))

    add_heading(lines, "2. Patientenseitig berichtete Beschwerden")
    complaints_text = safe_section_text(report_json, "complaints")
    lines.append(complaints_text or "Nicht angegeben.")

    unclear = safe_section_list(
        report_json,
        "complaints",
        "unclear_or_contradictory",
    )

    if unclear:
        lines.append("")
        lines.append("Zu klären:")
        add_bullets(lines, unclear)

    add_heading(lines, "3. Funktionelle Einschränkungen")
    lines.append(safe_section_text(report_json, "functional_limitations") or "Nicht angegeben.")
    key_points = safe_section_list(report_json, "functional_limitations", "key_points")
    if key_points:
        add_bullets(lines, key_points)

    add_heading(lines, "4. Bisherige konservative Behandlung")
    lines.append(safe_section_text(report_json, "conservative_treatment") or "Nicht angegeben.")
    key_points = safe_section_list(report_json, "conservative_treatment", "key_points")
    if key_points:
        add_bullets(lines, key_points)

    add_heading(lines, "5. Vorbefunde und vorhandene Unterlagen")
    lines.append(safe_section_text(report_json, "findings_and_documents") or "Nicht angegeben.")
    key_points = safe_section_list(report_json, "findings_and_documents", "key_points")
    if key_points:
        add_bullets(lines, key_points)

    add_heading(lines, "6. Relevante Risikohinweise")
    risk_notes = report_json.get("risk_notes") if isinstance(report_json.get("risk_notes"), dict) else {}

    lines.append("")
    lines.append("### Kritisch zu klären")
    add_bullets(
        lines,
        clean_list(risk_notes.get("critical_to_clarify")),
        fallback="Keine unmittelbar kritischen Angaben aus dem Fragebogen erkennbar.",
    )

    lines.append("")
    lines.append("### Weitere Hinweise")
    add_bullets(
        lines,
        clean_list(risk_notes.get("other_notes")),
        fallback="Keine weiteren Hinweise angegeben.",
    )

    add_heading(lines, "7. Offene Punkte für das Arztgespräch")
    add_bullets(lines, clean_list(report_json.get("doctor_questions")))

    add_heading(lines, "8. Ärztlicher Dokumentationsentwurf")
    draft = report_json.get("documentation_draft")

    if not isinstance(draft, dict):
        draft = {}

    draft_sections = [
        ("Anlass", "anlass"),
        ("Anamnese", "anamnese"),
        ("Funktion", "funktion"),
        ("Vorbehandlung", "vorbehandlung"),
        ("Vorbefunde", "vorbefunde"),
        ("Risiken / Komorbiditäten", "risiken_komorbiditaeten"),
        ("Weiteres Vorgehen / zu klären", "weiteres_vorgehen_zu_klaeren"),
    ]

    for label, key in draft_sections:
        lines.append("")
        lines.append(f"### {label}")
        lines.append(clean_text(draft.get(key)) or "Nicht angegeben.")

    add_heading(lines, "9. Hinweis")
    lines.append(
        clean_text(report_json.get("final_note"))
        or "KI-generierter Entwurf. Ärztliche Prüfung, Korrektur und Freigabe erforderlich."
    )

    clean_output = "\n".join(lines)
    clean_output = re.sub(r"\n{3,}", "\n\n", clean_output)

    return ensure_disclaimer(clean_output)


def get_fallback_models(primary_model: str, fallback_models: list[str]) -> list[str]:
    models = [primary_model, *fallback_models]
    clean_models = []

    for model in models:
        if model and model not in clean_models:
            clean_models.append(model)

    return clean_models


def extract_error_message(response: requests.Response) -> str:
    try:
        data = response.json()
    except ValueError:
        return response.text[:800]

    error = data.get("error")

    if isinstance(error, dict):
        message = error.get("message")
        status = error.get("status")
        code = error.get("code")

        parts = []

        if code:
            parts.append(f"code={code}")

        if status:
            parts.append(f"status={status}")

        if message:
            parts.append(str(message))

        if parts:
            return " | ".join(parts)

    return str(data)[:800]


def extract_report_text(data: dict) -> str:
    candidates = data.get("candidates") or []

    if not candidates:
        prompt_feedback = data.get("promptFeedback") or data.get("prompt_feedback")

        if prompt_feedback:
            raise AIServiceError(
                f"Gemini returned no candidates. Prompt feedback: {prompt_feedback}"
            )

        raise AIServiceError("Gemini returned no candidates.")

    first_candidate = candidates[0] or {}
    content = first_candidate.get("content") or {}
    parts = content.get("parts") or []

    report_parts = [
        str(part.get("text", "")).strip()
        for part in parts
        if isinstance(part, dict) and part.get("text")
    ]

    report_text = "\n".join(report_parts).strip()

    if not report_text:
        finish_reason = (
            first_candidate.get("finishReason")
            or first_candidate.get("finish_reason")
        )

        if finish_reason:
            raise AIServiceError(
                f"Gemini returned an empty report. Finish reason: {finish_reason}"
            )

        raise AIServiceError("Gemini returned an empty report.")

    return report_text


def call_gemini_model(
    *,
    api_key: str,
    model: str,
    prompt: str,
) -> str:
    if " " in model:
        raise AIServiceError(
            f"Invalid Gemini model value: '{model}'. Use an API model id like 'gemini-2.5-flash-lite'."
        )

    url = (
        "https://generativelanguage.googleapis.com/v1beta/models/"
        f"{model}:generateContent"
    )

    payload = {
        "contents": [
            {
                "role": "user",
                "parts": [
                    {
                        "text": prompt,
                    }
                ],
            }
        ],
        "generationConfig": {
            "temperature": 0.1,
            "topP": 0.7,
            "maxOutputTokens": 4096,
            "responseMimeType": "application/json",
        },
    }

    response = requests.post(
        url,
        params={
            "key": api_key,
        },
        json=payload,
        timeout=60,
    )

    if not response.ok:
        error_message = extract_error_message(response)

        raise AIServiceError(
            f"Gemini model '{model}' failed with HTTP {response.status_code}: {error_message}"
        )

    try:
        data = response.json()
    except ValueError as exc:
        raise AIServiceError(
            f"Gemini model '{model}' returned invalid JSON."
        ) from exc

    return extract_report_text(data)


def generate_ai_report(
    answers: list[dict],
    indication: str | None = None,
    questionnaire_version: int | None = None,
) -> dict[str, Any]:
    settings = get_settings()

    api_key = (settings.gemini_api_key or "").strip()
    primary_model = (settings.gemini_model or "gemini-2.5-flash-lite").strip()

    if not api_key:
        raise AIServiceError("GEMINI_API_KEY is not configured on the backend.")

    prompt = build_report_prompt(
        answers=answers,
        indication=indication,
        questionnaire_version=questionnaire_version,
    )

    models_to_try = get_fallback_models(
        primary_model,
        settings.gemini_fallback_model_list,
    )

    errors: list[str] = []

    for model_index, model in enumerate(models_to_try):
        for attempt in range(1, 4):
            try:
                raw_text = call_gemini_model(
                    api_key=api_key,
                    model=model,
                    prompt=prompt,
                )

                report_json = parse_json_from_ai_output(raw_text)
                report_text = build_markdown_from_report_json(report_json)

                return {
                    "report_text": report_text,
                    "report_json": report_json,
                }

            except requests.RequestException as exc:
                message = (
                    f"Gemini model '{model}' attempt {attempt} could not be sent: {exc}"
                )
                errors.append(message)

            except AIServiceError as exc:
                message = str(exc)
                errors.append(message)

                retryable = any(
                    f"HTTP {status_code}" in message
                    for status_code in RETRY_STATUS_CODES
                )

                if not retryable:
                    break

            if attempt < 3:
                time.sleep(1.5 * attempt)

        if model_index < len(models_to_try) - 1:
            continue

    raise AIServiceError(
        "All Gemini report generation attempts failed. Last errors: "
        + " || ".join(errors[-6:])
    )