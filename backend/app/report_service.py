from __future__ import annotations

import json
from collections import defaultdict
from typing import Any

from app.schemas import AnswerGroup, DocumentationFlag, QuestionnaireAnswer


DISCLAIMER = (
    "KI-generierter Entwurf. Dieser Text ist keine Diagnose und ersetzt keine "
    "ärztliche Entscheidung. Muss von einer Ärztin oder einem Arzt geprüft, "
    "bearbeitet und freigegeben werden."
)

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
    group_titles: dict[str, str] = {}

    for raw_answer in answers:
        answer = QuestionnaireAnswer(**raw_answer)

        block_id = answer.block_id or block_id_for_question(answer.question_id)
        block_title = (
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
    return {item.get("question_id", ""): item.get("answer") for item in answers}

###here
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


def _is_yes(value: Any) -> bool:
    return _answer_value(value) == "Ja"


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
    question_ids = {str(item.get("question_id", "")) for item in answers}

    if {"D3", "C6", "C7"}.intersection(question_ids):
        return "hip_tep"

    return "knee_tep"


def _height_weight_answer(
    by_id: dict[str, Any],
    indication: str | None = None,
) -> dict[str, Any] | None:
    resolved_indication = indication or "knee_tep"

    if resolved_indication == "hip_tep":
        value = by_id.get("E4")
        if isinstance(value, dict):
            return value

    if resolved_indication == "knee_tep":
        value = by_id.get("E5")
        if isinstance(value, dict):
            return value

    for fallback_id in ("E5", "E4"):
        value = by_id.get(fallback_id)
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
    return DocumentationFlag(level=level, title=title, description=description)


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


def _append_smoking_flag(
    flags: list[DocumentationFlag],
    value: Any,
) -> None:
    answer_value = _answer_value(value)

    active_values = {
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
            f"Berechnete Pack Years: {pack_years}. "
            "Nikotinkarenz und perioperatives Risiko aerztlich pruefen."
        )
    else:
        description = (
            "Patient berichtet aktuelles Rauchen. "
            "Nikotinkarenz und perioperatives Risiko aerztlich pruefen."
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
    joint_label: str,
) -> None:
    if value == "Ja, vor weniger als 6 Wochen":
        flags.append(
            _flag(
                "red",
                "Kortison-Injektion vor weniger als 6 Wochen berichtet",
                f"Patient berichtet eine kuerzliche Kortison-Spritze direkt in {joint_label}. Erfordert aerztliche Pruefung.",
            )
        )
    elif value == "Ja, vor 6 Wochen bis 3 Monaten":
        flags.append(
            _flag(
                "orange",
                "Kortison-Injektion vor 6 Wochen bis 3 Monaten berichtet",
                f"Patient berichtet eine Kortison-Spritze in {joint_label} im relevanten Zeitraum. Als offener Punkt fuer die Konsultation markieren.",
            )
        )


def generate_documentation_flags(
    answers: list[dict[str, Any]],
    indication: str | None = None,
) -> list[DocumentationFlag]:
    by_id = _answers_by_id(answers)
    resolved_indication = indication or _infer_indication(answers)
    flags: list[DocumentationFlag] = []

    if by_id.get("A2") == "Nein":
        flags.append(
            _flag(
                "orange",
                "Schmerzangabe unklar",
                "Patient berichtet keine aktuellen Schmerzen. Als offener Punkt im Arztgespraech pruefen.",
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

    if resolved_indication == "hip_tep":
        duration_limitation = by_id.get("B2")

        if duration_limitation == "Weniger als 3 Monate":
            flags.append(
                _flag(
                    "orange",
                    "Kurze Dauer der Alltagseinschraenkung",
                    "Patient berichtet eine deutliche Alltagseinschraenkung seit weniger als 3 Monaten.",
                )
            )

        walking_distance = by_id.get("B4")

        if walking_distance in {"Unter 500 m", "Unter 100 m", "Kaum möglich"}:
            flags.append(
                _flag(
                    "orange",
                    "Deutliche Gehstreckenlimitierung berichtet",
                    "Patient berichtet eine Gehstrecke unter 500 m oder kaum moegliche Gehstrecke.",
                )
            )

        if by_id.get("C5") in {"Nein", "Weiß nicht", "Weiß ich nicht"}:
            flags.append(
                _flag(
                    "orange",
                    "Patientenedukation unklar oder fehlend",
                    "Aufklaerung oder Beratung zur Huefterkrankung ist unklar oder nicht erfolgt.",
                )
            )

        if by_id.get("C6") in {"Nein", "Teilweise"}:
            flags.append(
                _flag(
                    "orange",
                    "Bewegungstherapie unvollstaendig",
                    "Regelmaessige Bewegungstherapie, Krankengymnastik oder gezielte Uebungen sind nicht vollstaendig erfolgt.",
                )
            )

        if by_id.get("D1") in {"Nein", "Weiß ich nicht", "Weiß nicht"}:
            flags.append(
                _flag(
                    "orange",
                    "Strukturschaden unklar",
                    "Patient berichtet keinen bekannten deutlichen Gelenkverschleiss oder ist unsicher. Befundlage fuer das Arztgespraech offen.",
                )
            )

        if by_id.get("D2") == "Nein":
            flags.append(
                _flag(
                    "orange",
                    "Vorbefunde nicht vorhanden",
                    "Patient berichtet keine Arztbriefe, Roentgenbilder oder Befunde zur Huefte.",
                )
            )

        if _is_unknown(by_id.get("D3")):
            flags.append(
                _flag(
                    "orange",
                    "Fruehere Prothesenempfehlung unklar",
                    "Patient ist unsicher, ob bereits eine Hueftprothese empfohlen wurde.",
                )
            )

        if _is_unknown(by_id.get("E1")):
            flags.append(
                _flag(
                    "orange",
                    "Aktive Infektion unklar",
                    "Patient ist unsicher, ob aktuell eine Entzuendung oder Infektion behandelt wird. Vor OP-Indikation aerztlich klaeren.",
                )
            )

        if by_id.get("E1") == "Ja":
            flags.append(
                _flag(
                    "red",
                    "Aktive Infektion berichtet",
                    "Patient berichtet eine aktuell behandelte Entzuendung oder Infektion. OP-Indikation aerztlich kritisch pruefen.",
                )
            )

        if _is_unknown(by_id.get("E2")):
            flags.append(
                _flag(
                    "orange",
                    "Fruehere Hueftinfektion unklar",
                    "Patient ist unsicher, ob frueher eine Infektion in dieser Huefte vorlag.",
                )
            )

        if by_id.get("E2") == "Ja":
            flags.append(
                _flag(
                    "orange",
                    "Fruehere Hueftinfektion berichtet",
                    "Patient berichtet eine fruehere Infektion in dieser Huefte. Restaktivitaet vor OP aerztlich pruefen.",
                )
            )

        if _is_unknown(by_id.get("E3")):
            flags.append(
                _flag(
                    "orange",
                    "Operationsrisiko unklar",
                    "Patient ist unsicher bezueglich schwerer Begleiterkrankungen oder eines erhoehten Operationsrisikos.",
                )
            )

        if _starts_with_yes(by_id.get("E3")):
            flags.append(
                _flag(
                    "orange",
                    "Erhoehtes Operationsrisiko berichtet",
                    "Patient berichtet eine schwere Erkrankung oder aerztlich genanntes erhoehtes Operationsrisiko.",
                )
            )

        _append_bmi_flags(flags, answers, resolved_indication)
        _append_smoking_flag(flags, by_id.get("E5"))

        if _is_unknown(by_id.get("E6")):
            flags.append(
                _flag(
                    "orange",
                    "Diabetesstatus unklar",
                    "Patient ist unsicher bezueglich Diabetes oder erhoehter Blutzuckerwerte. HbA1c/Laborwerte aerztlich pruefen.",
                )
            )

        if _starts_with_yes(by_id.get("E6")):
            flags.append(
                _flag(
                    "orange",
                    "Diabetes oder erhoehte Blutzuckerwerte berichtet",
                    "Patient berichtet Diabetes oder erhoehte Blutzuckerwerte. HbA1c und praeoperative Einstellung aerztlich pruefen.",
                )
            )

        if _is_unknown(by_id.get("E7")):
            flags.append(
                _flag(
                    "orange",
                    "Anaemiestatus unklar",
                    "Patient ist unsicher bezueglich Blutarmut oder Anaemie. Diagnostik und Optimierung vor OP pruefen.",
                )
            )

        if by_id.get("E7") == "Ja":
            flags.append(
                _flag(
                    "orange",
                    "Blutarmut oder Anaemie berichtet",
                    "Patient berichtet Blutarmut oder Anaemie. Diagnostik und Optimierung vor OP pruefen.",
                )
            )

        if _is_unknown(by_id.get("E8")):
            flags.append(
                _flag(
                    "orange",
                    "Kortison-Injektion unklar",
                    "Patient ist unsicher bezueglich einer Kortison-Spritze direkt in die Huefte. Im Arztgespraech klaeren.",
                )
            )

        _append_cortisone_flag(flags, by_id.get("E8"), "die Huefte")

        if _starts_with_yes(by_id.get("E9")):
            flags.append(
                _flag(
                    "orange",
                    "Psychische Erkrankung berichtet",
                    "Patient berichtet eine vermutete oder behandelte psychische Erkrankung. Fachspezifische Abklaerung pruefen.",
                )
            )

        if by_id.get("E10") == "Ja":
            flags.append(
                _flag(
                    "orange",
                    "Harnwegsbeschwerden oder Harnwegsinfekt berichtet",
                    "Patient berichtet Beschwerden beim Wasserlassen oder einen behandlungsbeduerftigen Harnwegsinfekt. Symptomatische Infektion aerztlich klaeren.",
                )
            )

        if _is_unknown(by_id.get("E10")):
            flags.append(
                _flag(
                    "orange",
                    "Harnwegsinfekt unklar",
                    "Patient ist unsicher bezueglich Beschwerden beim Wasserlassen oder Harnwegsinfekt.",
                )
            )

        if _starts_with_yes(by_id.get("E11")):
            flags.append(
                _flag(
                    "orange",
                    "Immunsystem-beeinflussende Medikamente berichtet",
                    "Patient berichtet dauerhafte Medikamente mit deutlichem Einfluss auf das Immunsystem.",
                )
            )

        if _is_unknown(by_id.get("E11")):
            flags.append(
                _flag(
                    "orange",
                    "Immunsystem-beeinflussende Medikamente unklar",
                    "Patient ist unsicher bezueglich dauerhaft immunsystem-beeinflussender Medikamente.",
                )
            )

    else:
        if _is_unknown(by_id.get("B3")):
            flags.append(
                _flag(
                    "orange",
                    "Achsfehlstellung unklar",
                    "Patient ist unsicher, ob Bein oder Knie schief steht. Im Arztgespraech gezielt pruefen.",
                )
            )

        if _is_unknown(by_id.get("B4")):
            flags.append(
                _flag(
                    "orange",
                    "Kraftminderung unklar",
                    "Patient ist unsicher, ob das betroffene Bein schwaecher geworden ist. Im Arztgespraech gezielt pruefen.",
                )
            )

        if by_id.get("D1") == "Nein":
            flags.append(
                _flag(
                    "orange",
                    "Vorbefunde nicht vorhanden",
                    "Patient berichtet keine Arztbriefe, Roentgenbilder oder Befunde zum Knie.",
                )
            )

        if _is_unknown(by_id.get("D2")):
            flags.append(
                _flag(
                    "orange",
                    "Fruehere Prothesenempfehlung unklar",
                    "Patient ist unsicher, ob bereits eine Knieprothese empfohlen wurde.",
                )
            )

        if _is_unknown(by_id.get("E1")):
            flags.append(
                _flag(
                    "orange",
                    "Aktive Knieinfektion unklar",
                    "Patient ist unsicher, ob aktuell eine Entzuendung oder Infektion im Knie behandelt wird. Vor OP-Indikation aerztlich klaeren.",
                )
            )

        if by_id.get("E1") == "Ja":
            flags.append(
                _flag(
                    "red",
                    "Aktive Infektion im Knie berichtet",
                    "Patient berichtet eine aktuell behandelte Entzuendung oder Infektion im Knie. Erfordert aerztliche Pruefung.",
                )
            )

        if _is_unknown(by_id.get("E2")):
            flags.append(
                _flag(
                    "orange",
                    "Fruehere Knieinfektion unklar",
                    "Patient ist unsicher, ob frueher eine Infektion in diesem Knie vorlag.",
                )
            )

        if by_id.get("E2") == "Ja":
            flags.append(
                _flag(
                    "orange",
                    "Fruehere Knieinfektion berichtet",
                    "Patient berichtet eine fruehere Infektion in diesem Knie. Erhoehtes Komplikationsprofil aerztlich pruefen.",
                )
            )

        if _is_unknown(by_id.get("E3")):
            flags.append(
                _flag(
                    "orange",
                    "Kuerzliches Herz-Kreislauf-Ereignis unklar",
                    "Patient ist unsicher, ob in den letzten 3 Monaten ein schweres Herz-Kreislauf-Ereignis vorlag. Im Arztgespraech klaeren.",
                )
            )

        if by_id.get("E3") == "Ja":
            flags.append(
                _flag(
                    "red",
                    "Kuerzliches schweres Herz-Kreislauf-Ereignis berichtet",
                    "Patient berichtet ein Ereignis in den letzten 3 Monaten. Erfordert aerztliche Pruefung.",
                )
            )

        if _is_unknown(by_id.get("E4")):
            flags.append(
                _flag(
                    "orange",
                    "Diabetesstatus unklar",
                    "Patient ist unsicher bezueglich Diabetes oder erhoehter Blutzuckerwerte. HbA1c/Laborwerte aerztlich pruefen.",
                )
            )

        if by_id.get("E4") == "Ja":
            flags.append(
                _flag(
                    "orange",
                    "Diabetes oder erhoehte Blutzuckerwerte berichtet",
                    "Patient berichtet Diabetes oder erhoehte Blutzuckerwerte. HbA1c und praeoperative Einstellung aerztlich pruefen.",
                )
            )

        _append_bmi_flags(flags, answers, resolved_indication)
        _append_smoking_flag(flags, by_id.get("E6"))

        if _is_unknown(by_id.get("E7")):
            flags.append(
                _flag(
                    "orange",
                    "Kortison-Injektion unklar",
                    "Patient ist unsicher bezueglich einer Kortison-Spritze direkt ins Knie. Im Arztgespraech klaeren.",
                )
            )

        _append_cortisone_flag(flags, by_id.get("E7"), "das Knie")

        if _is_unknown(by_id.get("E8")):
            flags.append(
                _flag(
                    "orange",
                    "Anaemiestatus unklar",
                    "Patient ist unsicher bezueglich Blutarmut oder Anaemie. Diagnostik und Optimierung vor OP pruefen.",
                )
            )

        if by_id.get("E8") == "Ja":
            flags.append(
                _flag(
                    "orange",
                    "Blutarmut oder Anaemie berichtet",
                    "Patient berichtet Blutarmut oder Anaemie. Diagnostik und Optimierung vor OP pruefen.",
                )
            )

        if by_id.get("E9") == "Ja":
            flags.append(
                _flag(
                    "orange",
                    "Psychische Erkrankung berichtet",
                    "Patient berichtet aktuelle Behandlung wegen einer psychischen Erkrankung.",
                )
            )

        if _is_unknown(by_id.get("E10")):
            flags.append(
                _flag(
                    "orange",
                    "Rheumatische Erkrankung unklar",
                    "Patient ist unsicher bezueglich einer rheumatischen Erkrankung.",
                )
            )

        if _starts_with_yes(by_id.get("E10")):
            flags.append(
                _flag(
                    "orange",
                    "Rheumatische Erkrankung berichtet",
                    "Patient berichtet eine rheumatische Erkrankung. Krankheitskontrolle aerztlich pruefen.",
                )
            )

        if _is_unknown(by_id.get("E11")):
            flags.append(
                _flag(
                    "orange",
                    "Kortison-Tabletteneinnahme unklar",
                    "Patient ist unsicher bezueglich aktueller Kortison-Tabletteneinnahme.",
                )
            )

        if by_id.get("E11") == "Ja":
            flags.append(
                _flag(
                    "orange",
                    "Kortison als Tabletten berichtet",
                    "Patient berichtet aktuelle Kortison-Tabletteneinnahme. Glukokortikoiddosis aerztlich pruefen.",
                )
            )

        if _starts_with_yes(by_id.get("E12")):
            flags.append(
                _flag(
                    "orange",
                    "Andere schwere Erkrankung berichtet",
                    "Patient berichtet eine andere schwere Erkrankung mit regelmaessiger aerztlicher Behandlung.",
                )
            )

        if by_id.get("E13") == "Ja":
            flags.append(
                _flag(
                    "orange",
                    "Alkohol- oder Suchtmittelrisiko berichtet",
                    "Patient berichtet regelmaessig viel Alkohol oder aktuelle Probleme mit Alkohol oder anderen Suchtmitteln.",
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

    if pii_category and pii_category != "none":
        return True

    question_id = str(answer.get("question_id", "")).lower()
    question = str(answer.get("question", "")).lower()
    haystack = f"{question_id} {question}"

    return any(term in haystack for term in DIRECT_IDENTIFIER_TERMS)


def _format_answer_for_ai(value: Any) -> Any:
    if value is None or value == "":
        return "nicht angegeben"

    if isinstance(value, list):
        return value if value else "nicht angegeben"

    if isinstance(value, dict):
        if (
            "packs_per_day" in value
            or "smoking_years" in value
            or "pack_years" in value
            or "stopped_since" in value
        ):
            parts = []

            if value.get("value"):
                parts.append(str(value.get("value")))

            if value.get("packs_per_day"):
                parts.append(f"{value.get('packs_per_day')} Packungen pro Tag")

            if value.get("smoking_years"):
                parts.append(f"{value.get('smoking_years')} Raucherjahre")

            if value.get("pack_years") not in (None, ""):
                parts.append(f"{value.get('pack_years')} Pack Years")

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
                return f"{value.get('value')}: {value.get('detail')}"

            return value.get("value") or "nicht angegeben"

        return json.dumps(value, ensure_ascii=False)

    return value


def format_minimum_answers_for_ai(answers: list[dict[str, Any]]) -> str:
    """Return only questionnaire content needed for report drafting.

    Direct patient identifiers are excluded before the AI prompt is created.
    The AI receives only medically relevant questionnaire answers.
    """
    minimal_payload = []

    for answer in answers:
        if answer.get("include_in_ai") is False or _is_direct_identifier(answer):
            continue

        minimal_payload.append(
            {
                "block": answer.get("block_title")
                or block_title_for_question(answer.get("question_id", "")),
                "question_id": answer.get("question_id"),
                "question": answer.get("question"),
                "answer": _format_answer_for_ai(answer.get("answer")),
            }
        )

    return json.dumps(minimal_payload, ensure_ascii=False, indent=2)

def ensure_disclaimer(report_text: str) -> str:
    clean_text = report_text.strip()
    if clean_text.startswith(DISCLAIMER):
        return clean_text
    return f"{DISCLAIMER}\n\n{clean_text}"
