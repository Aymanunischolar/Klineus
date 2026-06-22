from __future__ import annotations

import json
import re
from collections import defaultdict
from typing import Any

from app.schemas import AnswerGroup, DocumentationFlag, QuestionnaireAnswer


DISCLAIMER = (
    "KI-generierter Entwurf. Dieser Text ist keine Diagnose und ersetzt keine "
    "ärztliche Entscheidung. Muss von einer Ärztin oder einem Arzt geprüft, "
    "bearbeitet und freigegeben werden."
)

BLOCK_TITLES = {
    "A": "Ihr Knieproblem",
    "B": "Auswirkungen im Alltag",
    "C": "Bisherige Behandlung",
    "D": "Vorbefunde und ärztliche Aussagen",
    "E": "Gesundheit und Risiken",
    "F": "Ziele, Erwartungen und Ergänzungen",
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


def clean_german_text(value: Any) -> str:
    text = str(value or "")

    replacements = {
        "Block A: ": "",
        "Block B: ": "",
        "Block C: ": "",
        "Block D: ": "",
        "Block E: ": "",
        "Block F: ": "",
        "aerztliche": "ärztliche",
        "aerztlicher": "ärztlicher",
        "aerztlich": "ärztlich",
        "Aerztliche": "Ärztliche",
        "Aerztlicher": "Ärztlicher",
        "Aerztlich": "Ärztlich",
        "Pruefung": "Prüfung",
        "pruefung": "prüfung",
        "pruefen": "prüfen",
        "prueft": "prüft",
        "geprueft": "geprüft",
        "Kuerzliches": "Kürzliches",
        "kuerzliches": "kürzliches",
        "kuerzliche": "kürzliche",
        "Kuerzliche": "Kürzliche",
        "Erhoehtes": "Erhöhtes",
        "erhoehtes": "erhöhtes",
        "erhoehte": "erhöhte",
        "erhoehten": "erhöhten",
        "Erhoehte": "Erhöhte",
        "Huefte": "Hüfte",
        "Hueft": "Hüft",
        "fuer": "für",
        "moeglich": "möglich",
        "moegliche": "mögliche",
        "regelmaessig": "regelmäßig",
        "Regelmaessige": "Regelmäßige",
        "vollstaendig": "vollständig",
        "Vollstaendig": "Vollständig",
        "unvollstaendig": "unvollständig",
        "Alltagseinschraenkung": "Alltagseinschränkung",
        "Einschraenkung": "Einschränkung",
        "einschraenkung": "einschränkung",
        "Einschraenkungen": "Einschränkungen",
        "Roentgen": "Röntgen",
        "Entzuendung": "Entzündung",
        "Entzuendungen": "Entzündungen",
        "Klaerung": "Klärung",
        "klaeren": "klären",
        "geklaert": "geklärt",
        "Arztgespraech": "Arztgespräch",
        "Gespraech": "Gespräch",
        "praeoperative": "präoperative",
        "Praeoperative": "Präoperative",
        "Anaemie": "Anämie",
        "anaemie": "anämie",
        "bezueglich": "bezüglich",
        "Fruehere": "Frühere",
        "fruehere": "frühere",
        "Gelenkverschleiss": "Gelenkverschleiß",
        "Aufklaerung": "Aufklärung",
        "beduerftigen": "bedürftigen",
    }

    for old, new in replacements.items():
        text = text.replace(old, new)

    text = re.sub(r"^\s*Block\s+[A-Z]:\s*", "", text)

    return text.strip()


def block_id_for_question(question_id: str) -> str:
    return question_id[:1].upper() if question_id else "?"


def block_title_for_question(question_id: str) -> str:
    return BLOCK_TITLES.get(block_id_for_question(question_id), "Weitere Angaben")


def group_answers(answers: list[dict[str, Any]]) -> list[AnswerGroup]:
    grouped: dict[str, list[QuestionnaireAnswer]] = defaultdict(list)
    group_titles: dict[str, str] = {}

    for raw_answer in answers:
        answer = QuestionnaireAnswer(**raw_answer)

        block_id = answer.block_id or block_id_for_question(answer.question_id)
        block_title = clean_german_text(
            answer.block_title
            or BLOCK_TITLES.get(block_id)
            or "Weitere Angaben"
        )

        answer.block_id = block_id
        answer.block_title = block_title

        grouped[block_id].append(answer)

        if block_id not in group_titles:
            group_titles[block_id] = block_title

    ordered_groups: list[AnswerGroup] = []

    for block_id in sorted(grouped.keys()):
        ordered_groups.append(
            AnswerGroup(
                block_id=block_id,
                block_title=group_titles.get(
                    block_id,
                    BLOCK_TITLES.get(block_id, "Weitere Angaben"),
                ),
                answers=grouped[block_id],
            )
        )

    return ordered_groups


def _answers_by_id(answers: list[dict[str, Any]]) -> dict[str, Any]:
    return {
        item.get("question_id", ""): item.get("answer")
        for item in answers
    }


def _as_number(value: Any) -> float | None:
    if value is None or value == "":
        return None

    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _answer_value(value: Any) -> Any:
    if isinstance(value, dict):
        return value.get("value", "")

    return value


def _starts_with_yes(value: Any) -> bool:
    return str(_answer_value(value) or "").strip().lower().startswith("ja")


def _is_unknown(value: Any) -> bool:
    normalized = str(_answer_value(value) or "").strip().lower()

    return normalized in {
        "weiß ich nicht",
        "weiss ich nicht",
        "weiß nicht",
        "weiss nicht",
    }


def _infer_indication(answers: list[dict[str, Any]]) -> str:
    for item in answers:
        indication = item.get("indication") or item.get("template_indication")

        if indication in {"knee_tep", "hip_tep"}:
            return indication

    return "knee_tep"


def _height_weight_answer(
    by_id: dict[str, Any],
    indication: str | None = None,
) -> dict[str, Any] | None:
    value = by_id.get("E4")

    if isinstance(value, dict) and (
        "height_cm" in value or "weight_kg" in value
    ):
        return value

    return None


def calculate_bmi(
    answers: list[dict[str, Any]],
    indication: str | None = None,
) -> float | None:
    by_id = _answers_by_id(answers)
    resolved_indication = indication or _infer_indication(answers)

    value = _height_weight_answer(by_id, resolved_indication)

    if not isinstance(value, dict):
        return None

    height_cm = _as_number(value.get("height_cm"))
    weight_kg = _as_number(value.get("weight_kg"))

    if not height_cm or not weight_kg or height_cm <= 0:
        return None

    height_m = height_cm / 100

    return round(weight_kg / (height_m * height_m), 1)


def _flag(level: str, title: str, description: str) -> DocumentationFlag:
    return DocumentationFlag(
        level=level,
        title=clean_german_text(title),
        description=clean_german_text(description),
    )


def _append_bmi_flags(
    flags: list[DocumentationFlag],
    answers: list[dict[str, Any]],
    indication: str,
) -> None:
    bmi = calculate_bmi(answers, indication)

    if bmi is None:
        return

    if bmi >= 40:
        flags.append(
            _flag(
                "red",
                "BMI ab 40 berechnet",
                f"Aus den Angaben wurde ein BMI von {bmi} berechnet. Erfordert ärztliche Prüfung.",
            )
        )
    elif 30 <= bmi < 40:
        flags.append(
            _flag(
                "orange",
                "BMI 30 bis 39 berechnet",
                f"Aus den Angaben wurde ein BMI von {bmi} berechnet. Als modifizierbaren Risikohinweis prüfen.",
            )
        )


def _append_smoking_flag(
    flags: list[DocumentationFlag],
    value: Any,
) -> None:
    answer_value = _answer_value(value)

    active_values = {
        "Ja",
        "Ja, mit Angabe Packungen pro Tag und Rauchjahre",
        "Ja, täglich",
        "Ja, gelegentlich",
    }

    if answer_value not in active_values:
        return

    pack_years = None

    if isinstance(value, dict):
        pack_years = value.get("pack_years")

    if pack_years not in (None, ""):
        description = (
            "Patient berichtet aktuelles Rauchen. "
            f"Berechnete Packungsjahre: {pack_years}. "
            "Nikotinkarenz und perioperatives Risiko ärztlich prüfen."
        )
    else:
        description = (
            "Patient berichtet aktuelles Rauchen. "
            "Nikotinkarenz und perioperatives Risiko ärztlich prüfen."
        )

    flags.append(
        _flag(
            "orange",
            "Aktives Rauchen berichtet",
            description,
        )
    )


def _append_cortisone_flag(
    flags: list[DocumentationFlag],
    value: Any,
    joint_article: str,
) -> None:
    answer = _answer_value(value)

    if answer == "Ja, vor weniger als 6 Wochen":
        flags.append(
            _flag(
                "red",
                "Kortison-Injektion vor weniger als 6 Wochen berichtet",
                f"Patient berichtet eine kürzliche Kortison-Spritze direkt in {joint_article}. Erfordert ärztliche Prüfung.",
            )
        )
    elif answer == "Ja, vor 6 Wochen bis 3 Monaten":
        flags.append(
            _flag(
                "orange",
                "Kortison-Injektion vor 6 Wochen bis 3 Monaten berichtet",
                f"Patient berichtet eine Kortison-Spritze in {joint_article} im relevanten Zeitraum. Als offener Punkt für die Konsultation markieren.",
            )
        )


def generate_documentation_flags(
    answers: list[dict[str, Any]],
    indication: str | None = None,
) -> list[DocumentationFlag]:
    by_id = _answers_by_id(answers)
    resolved_indication = indication or _infer_indication(answers)
    joint_label = "Hüfte" if resolved_indication == "hip_tep" else "Knie"
    joint_article = "die Hüfte" if resolved_indication == "hip_tep" else "das Knie"

    flags: list[DocumentationFlag] = []

    if by_id.get("A2") == "Nein":
        flags.append(
            _flag(
                "orange",
                "Schmerzangabe unklar",
                f"Patient berichtet keine aktuellen Schmerzen in {joint_article}. Als offener Punkt im Arztgespräch prüfen.",
            )
        )

    if by_id.get("A3") == "Weniger als 3 Monate":
        flags.append(
            _flag(
                "orange",
                "Kurze Symptomdauer",
                "Patient berichtet eine Symptomdauer unter 3 Monaten. Erfordert ärztliche Einordnung.",
            )
        )

    limitation_score = _as_number(by_id.get("B1"))

    if limitation_score is not None and limitation_score < 3:
        flags.append(
            _flag(
                "orange",
                "Geringe Alltagsbelastung berichtet",
                "Patient berichtet eine niedrige alltagsbezogene Einschränkung. Als offener Punkt für die Konsultation markieren.",
            )
        )

    if by_id.get("B2") == "Weniger als 3 Monate":
        flags.append(
            _flag(
                "orange",
                "Kurze Dauer der Alltagseinschränkung",
                "Patient berichtet eine deutliche Alltagseinschränkung seit weniger als 3 Monaten.",
            )
        )

    walking_distance = by_id.get("B4")

    if walking_distance in {
        "100 bis 500 Meter",
        "Weniger als 100 Meter",
        "Kaum möglich",
    }:
        flags.append(
            _flag(
                "orange",
                "Deutliche Gehstreckenlimitierung berichtet",
                "Patient berichtet eine relevante Einschränkung der Gehstrecke.",
            )
        )

    if _is_unknown(by_id.get("B6")):
        flags.append(
            _flag(
                "orange",
                "Beweglichkeit unklar",
                f"Patient ist unsicher, ob {joint_article} richtig bewegt werden kann. Im Arztgespräch gezielt prüfen.",
            )
        )

    if _is_unknown(by_id.get("B7")):
        flags.append(
            _flag(
                "orange",
                "Achsfehlstellung unklar",
                "Patient ist unsicher, ob Bein oder Gelenk schief steht. Im Arztgespräch gezielt prüfen.",
            )
        )

    if _is_unknown(by_id.get("B8")):
        flags.append(
            _flag(
                "orange",
                "Kraftminderung unklar",
                "Patient ist unsicher, ob das betroffene Bein schwächer geworden ist. Im Arztgespräch gezielt prüfen.",
            )
        )

    if by_id.get("C1") == "Nein":
        flags.append(
            _flag(
                "orange",
                "Keine konservative Vorbehandlung berichtet",
                "Patient berichtet keine bisherige Behandlung. Konservative Therapiehistorie ärztlich prüfen.",
            )
        )

    if by_id.get("C3") == "Weniger als 3 Monate":
        flags.append(
            _flag(
                "orange",
                "Kurze konservative Therapiedauer",
                "Patient berichtet eine konservative Behandlungsdauer unter 3 Monaten.",
            )
        )

    if by_id.get("C4") == "Ja, deutlich":
        flags.append(
            _flag(
                "orange",
                "Deutliche Besserung durch Vorbehandlung berichtet",
                "Patient berichtet deutliche Besserung. Therapieversagen gegebenenfalls nicht eindeutig.",
            )
        )

    if by_id.get("C5") in {"Nein", "Teilweise"}:
        flags.append(
            _flag(
                "orange",
                "Bewegungstherapie unvollständig",
                "Regelmäßige Physiotherapie, Krankengymnastik oder gezielte Übungen sind nicht vollständig erfolgt.",
            )
        )

    if by_id.get("D1") in {"Nein", "Weiß nicht", "Weiß ich nicht"}:
        flags.append(
            _flag(
                "orange",
                "Röntgenbefund unklar oder fehlend",
                f"Patient berichtet kein bekanntes Röntgenbild von {joint_article} oder ist unsicher.",
            )
        )

    if by_id.get("D2") in {"Nein", "Weiß nicht", "Weiß ich nicht"}:
        flags.append(
            _flag(
                "orange",
                "Gelenkverschleiß unklar",
                f"Patient berichtet keinen bekannten deutlichen Gelenkverschleiß in {joint_article} oder ist unsicher.",
            )
        )

    if _is_unknown(by_id.get("D6")):
        flags.append(
            _flag(
                "orange",
                "Frühere Prothesenempfehlung unklar",
                f"Patient ist unsicher, ob bereits eine {joint_label}-Prothese empfohlen wurde.",
            )
        )

    if by_id.get("E1") == "Ja":
        flags.append(
            _flag(
                "red",
                "Aktive Infektion berichtet",
                f"Patient berichtet eine aktuell behandelte Entzündung oder Infektion in {joint_article}. Erfordert ärztliche Prüfung.",
            )
        )

    if _is_unknown(by_id.get("E1")):
        flags.append(
            _flag(
                "orange",
                "Aktive Infektion unklar",
                f"Patient ist unsicher, ob aktuell eine Entzündung oder Infektion in {joint_article} behandelt wird.",
            )
        )

    if by_id.get("E2") == "Ja":
        flags.append(
            _flag(
                "red",
                "Kürzliches schweres Herz-Kreislauf-Ereignis berichtet",
                "Patient berichtet ein schweres Herz-Kreislauf-Ereignis in den letzten 3 Monaten. Erfordert ärztliche Prüfung.",
            )
        )

    if _is_unknown(by_id.get("E2")):
        flags.append(
            _flag(
                "orange",
                "Kürzliches Herz-Kreislauf-Ereignis unklar",
                "Patient ist unsicher, ob in den letzten 3 Monaten ein schweres Herz-Kreislauf-Ereignis vorlag.",
            )
        )

    if by_id.get("E3") == "Ja":
        flags.append(
            _flag(
                "orange",
                "Diabetes oder erhöhte Blutzuckerwerte berichtet",
                "Patient berichtet Diabetes oder erhöhte Blutzuckerwerte. HbA1c und präoperative Einstellung ärztlich prüfen.",
            )
        )

    if _is_unknown(by_id.get("E3")):
        flags.append(
            _flag(
                "orange",
                "Diabetesstatus unklar",
                "Patient ist unsicher bezüglich Diabetes oder erhöhter Blutzuckerwerte. HbA1c/Laborwerte ärztlich prüfen.",
            )
        )

    _append_bmi_flags(flags, answers, resolved_indication)
    _append_smoking_flag(flags, by_id.get("E5"))

    if _is_unknown(by_id.get("E6")):
        flags.append(
            _flag(
                "orange",
                "Kortison-Injektion unklar",
                f"Patient ist unsicher bezüglich einer Kortison-Spritze direkt in {joint_article}. Im Arztgespräch klären.",
            )
        )

    _append_cortisone_flag(flags, by_id.get("E6"), joint_article)

    if by_id.get("E7") == "Ja":
        flags.append(
            _flag(
                "orange",
                "Blutarmut oder Anämie berichtet",
                "Patient berichtet Blutarmut oder Anämie. Diagnostik und Optimierung vor OP prüfen.",
            )
        )

    if _is_unknown(by_id.get("E7")):
        flags.append(
            _flag(
                "orange",
                "Anämiestatus unklar",
                "Patient ist unsicher bezüglich Blutarmut oder Anämie. Diagnostik und Optimierung vor OP prüfen.",
            )
        )

    if by_id.get("E8") == "Ja":
        flags.append(
            _flag(
                "orange",
                "Psychische Erkrankung berichtet",
                "Patient berichtet aktuelle Behandlung wegen einer psychischen Erkrankung.",
            )
        )

    if _starts_with_yes(by_id.get("E9")):
        flags.append(
            _flag(
                "orange",
                "Rheumatische Erkrankung berichtet",
                "Patient berichtet eine rheumatische Erkrankung. Krankheitskontrolle ärztlich prüfen.",
            )
        )

    if _is_unknown(by_id.get("E9")):
        flags.append(
            _flag(
                "orange",
                "Rheumatische Erkrankung unklar",
                "Patient ist unsicher bezüglich einer rheumatischen Erkrankung.",
            )
        )

    if by_id.get("E10") == "Ja":
        flags.append(
            _flag(
                "orange",
                "Kortison als Tabletten berichtet",
                "Patient berichtet aktuelle Kortison-Tabletteneinnahme. Glukokortikoiddosis ärztlich prüfen.",
            )
        )

    if _is_unknown(by_id.get("E10")):
        flags.append(
            _flag(
                "orange",
                "Kortison-Tabletteneinnahme unklar",
                "Patient ist unsicher bezüglich aktueller Kortison-Tabletteneinnahme.",
            )
        )

    if _starts_with_yes(by_id.get("E11")):
        flags.append(
            _flag(
                "orange",
                "Andere schwere Erkrankung berichtet",
                "Patient berichtet eine andere schwere Erkrankung mit regelmäßiger ärztlicher Behandlung.",
            )
        )

    if by_id.get("E12") == "Ja":
        flags.append(
            _flag(
                "orange",
                "Alkohol- oder Suchtmittelrisiko berichtet",
                "Patient berichtet regelmäßig viel Alkohol oder aktuelle Probleme mit Alkohol oder anderen Suchtmitteln.",
            )
        )

    if by_id.get("E13") == "Ja":
        flags.append(
            _flag(
                "orange",
                "Frühere Gelenkinfektion berichtet",
                f"Patient berichtet eine frühere Infektion in {joint_article}. Relevanz ärztlich prüfen.",
            )
        )

    if _is_unknown(by_id.get("E13")):
        flags.append(
            _flag(
                "orange",
                "Frühere Gelenkinfektion unklar",
                f"Patient ist unsicher, ob früher eine Infektion in {joint_article} vorlag.",
            )
        )

    if not flags:
        flags.append(
            _flag(
                "green",
                "Strukturierte Angaben vollständig",
                "Keine hinterlegten orangefarbenen oder roten Dokumentationshinweise aus den Patientenangaben erzeugt.",
            )
        )

    return flags


def derive_traffic_light_level(flags: list[DocumentationFlag]) -> str:
    has_red = any(flag.level == "red" for flag in flags)
    has_orange = any(flag.level == "orange" for flag in flags)

    if has_red:
        return "red"

    if has_orange:
        return "orange"

    return "green"


def derive_traffic_light_label(level: str) -> str:
    if level == "red":
        return "ROT"

    if level == "orange":
        return "ORANGE"

    return "GRÜN"


def derive_traffic_light_description(level: str) -> str:
    if level == "red":
        return (
            "Kontraindikation oder kritischer Risikofaktor berichtet. "
            "Sofortige ärztliche Prüfung erforderlich."
        )

    if level == "orange":
        return (
            "Hauptkriterien teilweise unklar oder modifizierbare Risikofaktoren vorhanden. "
            "Im Arztgespräch gezielt nachfragen."
        )

    return (
        "Keine hinterlegten roten oder orangefarbenen Hinweise aus den Patientenangaben. "
        "Ärztliche Prüfung bleibt erforderlich."
    )


def derive_traffic_light(flags: list[DocumentationFlag]) -> dict[str, str]:
    level = derive_traffic_light_level(flags)

    return {
        "level": level,
        "label": derive_traffic_light_label(level),
        "description": derive_traffic_light_description(level),
    }


def _is_direct_identifier(answer: dict[str, Any]) -> bool:
    pii_category = str(answer.get("pii_category") or "none").strip().lower()

    if pii_category in DIRECT_IDENTIFIER_CATEGORIES:
        return True

    question_id = str(answer.get("question_id", "")).lower()
    question = str(answer.get("question", "")).lower()
    haystack = f"{question_id} {question}"

    return any(term in haystack for term in DIRECT_IDENTIFIER_TERMS)


def _format_answer_for_ai(value: Any) -> Any:
    if value is None or value == "":
        return "nicht angegeben"

    if isinstance(value, list):
        return [
            clean_german_text(item)
            for item in value
        ] if value else "nicht angegeben"

    if isinstance(value, dict):
        if (
            "packs_per_day" in value
            or "smoking_years" in value
            or "pack_years" in value
            or "stopped_since" in value
        ):
            parts = []

            if value.get("value"):
                parts.append(clean_german_text(value.get("value")))

            if value.get("packs_per_day"):
                parts.append(f"{value.get('packs_per_day')} Packungen pro Tag")

            if value.get("smoking_years"):
                parts.append(f"{value.get('smoking_years')} Raucherjahre")

            if value.get("pack_years") not in (None, ""):
                parts.append(f"{value.get('pack_years')} Packungsjahre")

            if value.get("stopped_since"):
                parts.append(f"aufgehört seit {value.get('stopped_since')}")

            return " | ".join(parts) if parts else "nicht angegeben"

        if "height_cm" in value or "weight_kg" in value:
            height_cm = _as_number(value.get("height_cm"))
            weight_kg = _as_number(value.get("weight_kg"))

            parts = []

            if height_cm:
                parts.append(f"Größe {height_cm:g} cm")

            if weight_kg:
                parts.append(f"Gewicht {weight_kg:g} kg")

            if height_cm and weight_kg:
                height_m = height_cm / 100
                bmi = round(weight_kg / (height_m * height_m), 1)
                parts.append(f"BMI {bmi}")

            return " | ".join(parts) if parts else "nicht angegeben"

        if "value" in value:
            if value.get("detail"):
                return clean_german_text(f"{value.get('value')}: {value.get('detail')}")

            return clean_german_text(value.get("value")) or "nicht angegeben"

        return json.dumps(value, ensure_ascii=False)

    return clean_german_text(value)


def format_minimum_answers_for_ai(answers: list[dict[str, Any]]) -> str:
    """Return only questionnaire content needed for report drafting.

    Direct patient identifiers are excluded before the AI prompt is created.
    The AI receives only medically relevant questionnaire answers.
    """
    minimal_payload = []

    for answer in answers:
        if answer.get("include_in_ai") is False or _is_direct_identifier(answer):
            continue

        block_title = (
            answer.get("block_title_displayed")
            or answer.get("block_title")
            or block_title_for_question(answer.get("question_id", ""))
        )

        question_text = (
            answer.get("question_displayed")
            or answer.get("question")
            or answer.get("question_id")
        )

        minimal_payload.append(
            {
                "block": clean_german_text(block_title),
                "question_id": answer.get("question_id"),
                "question": clean_german_text(question_text),
                "answer": _format_answer_for_ai(answer.get("answer")),
            }
        )

    return json.dumps(minimal_payload, ensure_ascii=False, indent=2)


def ensure_disclaimer(report_text: str) -> str:
    clean_text = report_text.strip()

    if clean_text.startswith(DISCLAIMER):
        return clean_text

    return f"{DISCLAIMER}\n\n{clean_text}"