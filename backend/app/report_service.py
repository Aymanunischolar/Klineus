from __future__ import annotations

import json
from collections import defaultdict
from typing import Any

from app.schemas import AnswerGroup, DocumentationFlag, QuestionnaireAnswer


DISCLAIMER = "AI-generated draft. Must be reviewed and approved by a physician."

BLOCK_TITLES = {
    "A": "Block A: Ihr Knieproblem",
    "B": "Block B: Auswirkungen im Alltag",
    "C": "Block C: Bisherige Behandlung",
    "D": "Block D: Vorbefunde und aerztliche Aussagen",
    "E": "Block E: Gesundheit und Risiken",
    "F": "Block F: Ziele, Erwartungen und Ergaenzungen",
}

DIRECT_IDENTIFIER_CATEGORIES = {
    "name",
    "date_of_birth",
    "address",
    "phone",
    "email",
    "insurance",
    "other_identifier",
}

DIRECT_IDENTIFIER_TERMS = {
    "name",
    "vorname",
    "nachname",
    "geburtsdatum",
    "date of birth",
    "dob",
    "adresse",
    "address",
    "telefon",
    "phone",
    "email",
    "e-mail",
    "versicherung",
    "insurance",
}


def block_id_for_question(question_id: str) -> str:
    return question_id[:1].upper() if question_id else "?"


def block_title_for_question(question_id: str) -> str:
    return BLOCK_TITLES.get(block_id_for_question(question_id), "Weitere Angaben")


def group_answers(answers: list[dict[str, Any]]) -> list[AnswerGroup]:
    grouped: dict[str, list[QuestionnaireAnswer]] = defaultdict(list)

    for raw_answer in answers:
        answer = QuestionnaireAnswer(**raw_answer)
        block_id = answer.block_id or block_id_for_question(answer.question_id)
        block_title = answer.block_title or BLOCK_TITLES.get(block_id, "Weitere Angaben")
        answer.block_id = block_id
        answer.block_title = block_title
        grouped[block_id].append(answer)

    ordered_groups: list[AnswerGroup] = []
    for block_id in sorted(grouped.keys()):
        ordered_groups.append(
            AnswerGroup(
                block_id=block_id,
                block_title=BLOCK_TITLES.get(block_id, "Weitere Angaben"),
                answers=grouped[block_id],
            )
        )

    return ordered_groups


def _answers_by_id(answers: list[dict[str, Any]]) -> dict[str, Any]:
    return {item.get("question_id", ""): item.get("answer") for item in answers}


def _as_number(value: Any) -> float | None:
    if value is None or value == "":
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def calculate_bmi(answers: list[dict[str, Any]]) -> float | None:
    value = _answers_by_id(answers).get("E4")
    if not isinstance(value, dict):
        return None

    height_cm = _as_number(value.get("height_cm"))
    weight_kg = _as_number(value.get("weight_kg"))
    if not height_cm or not weight_kg or height_cm <= 0:
        return None

    height_m = height_cm / 100
    return round(weight_kg / (height_m * height_m), 1)


def _flag(level: str, title: str, description: str) -> DocumentationFlag:
    return DocumentationFlag(level=level, title=title, description=description)


def generate_documentation_flags(answers: list[dict[str, Any]]) -> list[DocumentationFlag]:
    by_id = _answers_by_id(answers)
    flags: list[DocumentationFlag] = []

    if by_id.get("A2") == "Nein":
        flags.append(
            _flag(
                "orange",
                "Schmerzangabe unklar",
                "Patient berichtet keine aktuellen Knieschmerzen. Als offener Punkt im Arztgespraech pruefen.",
            )
        )

    if by_id.get("A3") == "Weniger als 3 Monate":
        flags.append(
            _flag(
                "orange",
                "Kurze Symptomdauer",
                "Patient berichtet eine Symptomdauer unter 3 Monaten. Erfordert aerztliche Einordnung.",
            )
        )

    limitation_score = _as_number(by_id.get("B1"))
    if limitation_score is not None and limitation_score < 3:
        flags.append(
            _flag(
                "orange",
                "Geringe Alltagsbelastung berichtet",
                "Patient berichtet eine niedrige alltagsbezogene Einschraenkung. Als offener Punkt fuer die Konsultation markieren.",
            )
        )

    if by_id.get("C1") == "Nein":
        flags.append(
            _flag(
                "orange",
                "Keine konservative Vorbehandlung berichtet",
                "Patient berichtet keine bisherige Behandlung. Konservative Therapiehistorie aerztlich pruefen.",
            )
        )

    if by_id.get("D1") in {"Nein", "Weiß ich nicht"}:
        flags.append(
            _flag(
                "orange",
                "Radiologischer Nachweis offen",
                "Patient berichtet kein bekanntes Roentgenbild oder ist unsicher. Befundlage fuer das Arztgespraech offen.",
            )
        )

    if by_id.get("E1") == "Ja":
        flags.append(
            _flag(
                "red",
                "Aktive Infektion berichtet",
                "Patient berichtet eine aktuell behandelte Entzuendung oder Infektion im Knie. Erfordert aerztliche Pruefung.",
            )
        )

    if by_id.get("E2") == "Ja":
        flags.append(
            _flag(
                "red",
                "Kuerzliches schweres Herz-Kreislauf-Ereignis berichtet",
                "Patient berichtet ein Ereignis in den letzten 3 Monaten. Erfordert aerztliche Pruefung.",
            )
        )

    if by_id.get("E3") == "Ja":
        flags.append(
            _flag(
                "orange",
                "Diabetes oder erhoehte Blutzuckerwerte berichtet",
                "Patient berichtet Diabetes oder erhoehte Blutzuckerwerte. Als patientenberichteter Risikohinweis dokumentieren.",
            )
        )

    bmi = calculate_bmi(answers)
    if bmi is not None:
        if bmi >= 40:
            flags.append(
                _flag(
                    "red",
                    "BMI ab 40 berechnet",
                    f"Aus den Angaben wurde ein BMI von {bmi} berechnet. Erfordert aerztliche Pruefung.",
                )
            )
        elif 30 <= bmi < 40:
            flags.append(
                _flag(
                    "orange",
                    "BMI 30 bis 39 berechnet",
                    f"Aus den Angaben wurde ein BMI von {bmi} berechnet. Als modifizierbaren Risikohinweis pruefen.",
                )
            )

    if by_id.get("E5") == "Ja":
        flags.append(
            _flag(
                "orange",
                "Aktives Rauchen berichtet",
                "Patient berichtet aktuelles Rauchen. Als patientenberichteter Risikohinweis dokumentieren.",
            )
        )

    if by_id.get("E6") == "Ja, vor weniger als 6 Wochen":
        flags.append(
            _flag(
                "red",
                "Kortison-Injektion vor weniger als 6 Wochen berichtet",
                "Patient berichtet eine kuerzliche Kortison-Spritze ins Knie. Erfordert aerztliche Pruefung.",
            )
        )
    elif by_id.get("E6") == "Ja, vor 6 Wochen bis 3 Monaten":
        flags.append(
            _flag(
                "orange",
                "Kortison-Injektion vor 6 Wochen bis 3 Monaten berichtet",
                "Patient berichtet eine Kortison-Spritze im relevanten Zeitraum. Als offener Punkt fuer die Konsultation markieren.",
            )
        )

    if not flags:
        flags.append(
            _flag(
                "green",
                "Strukturierte Angaben vollstaendig",
                "Keine hinterlegten orangefarbenen oder roten Dokumentationshinweise aus den Patientenangaben erzeugt.",
            )
        )

    return flags


def _is_direct_identifier(answer: dict[str, Any]) -> bool:
    pii_category = answer.get("pii_category") or "none"
    if pii_category in DIRECT_IDENTIFIER_CATEGORIES:
        return True

    question_id = str(answer.get("question_id", "")).lower()
    question = str(answer.get("question", "")).lower()
    haystack = f"{question_id} {question}"
    return any(term in haystack for term in DIRECT_IDENTIFIER_TERMS)


def format_minimum_answers_for_ai(answers: list[dict[str, Any]]) -> str:
    """Return only questionnaire content needed for report drafting.

    The prototype intentionally excludes direct identifiers such as name,
    address, date of birth, phone number, email, and insurance data. Age is
    allowed because it can be medically relevant without sending a direct date
    of birth.
    """
    minimal_payload = []
    for answer in answers:
        if answer.get("include_in_ai") is False or _is_direct_identifier(answer):
            continue

        minimal_payload.append(
            {
                "block": answer.get("block_title") or block_title_for_question(answer.get("question_id", "")),
                "question_id": answer.get("question_id"),
                "question": answer.get("question"),
                "answer": answer.get("answer"),
            }
        )
    return json.dumps(minimal_payload, ensure_ascii=False, indent=2)


def ensure_disclaimer(report_text: str) -> str:
    clean_text = report_text.strip()
    if clean_text.startswith(DISCLAIMER):
        return clean_text
    return f"{DISCLAIMER}\n\n{clean_text}"
