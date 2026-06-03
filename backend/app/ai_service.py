from __future__ import annotations

import requests

from app.config import get_settings
from app.report_service import DISCLAIMER, ensure_disclaimer, format_minimum_answers_for_ai


class AIServiceError(RuntimeError):
    pass


def build_report_prompt(answers: list[dict]) -> str:
    structured_answers = format_minimum_answers_for_ai(answers)
    return f"""You are assisting a physician with drafting a structured medical documentation note.

Important:
- Do not diagnose.
- Do not make final treatment decisions.
- Do not recommend surgery.
- Do not claim certainty.
- Use only the provided patient questionnaire answers.
- Mention missing or unclear information.
- Mark risks only as patient-reported information.
- The output is a draft for physician review.
- Include this exact disclaimer at the beginning of the output: {DISCLAIMER}

Generate the report in German.

Use this structure:

1. Anlass der Vorstellung
2. Zusammenfassung der Beschwerden
3. Funktionelle Einschränkungen
4. Bisherige konservative Behandlung
5. Vorbefunde und bekannte ärztliche Aussagen
6. Gesundheitsbezogene Risikohinweise
7. Offene Punkte für das Arztgespräch
8. Entwurf für die ärztliche Dokumentation
9. Hinweis: KI-generierter Entwurf, ärztliche Prüfung erforderlich

Patient questionnaire answers:
{structured_answers}
"""


def generate_ai_report(answers: list[dict]) -> str:
    settings = get_settings()
    if not settings.gemini_api_key:
        raise AIServiceError("GEMINI_API_KEY is not configured on the backend.")

    prompt = build_report_prompt(answers)
    url = (
        "https://generativelanguage.googleapis.com/v1beta/models/"
        f"{settings.gemini_model}:generateContent"
    )
    payload = {
        "contents": [
            {
                "role": "user",
                "parts": [{"text": prompt}],
            }
        ],
        "generationConfig": {
            "temperature": 0.2,
            "topP": 0.8,
            "maxOutputTokens": 4096,
        },
    }

    try:
        response = requests.post(
            url,
            params={"key": settings.gemini_api_key},
            json=payload,
            timeout=45,
        )
        response.raise_for_status()
        data = response.json()
    except requests.RequestException as exc:
        raise AIServiceError("Gemini API request failed.") from exc

    try:
        parts = data["candidates"][0]["content"]["parts"]
        report_text = "\n".join(part.get("text", "") for part in parts).strip()
    except (KeyError, IndexError, TypeError) as exc:
        raise AIServiceError("Gemini API response did not contain report text.") from exc

    if not report_text:
        raise AIServiceError("Gemini API returned an empty report.")

    return ensure_disclaimer(report_text)
