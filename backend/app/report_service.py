from __future__ import annotations

import re
from collections import defaultdict
from typing import Any

from app.schemas import AnswerGroup, DocumentationFlag, QuestionnaireAnswer


DISCLAIMER = (
    "Automatisch aus den Patientenangaben vorausgefüllter Entwurf. Dieser Text "
    "ist keine Diagnose und ersetzt keine ärztliche Entscheidung. Muss von einer "
    "Ärztin oder einem Arzt geprüft, bearbeitet und freigegeben werden."
)

BLOCK_TITLES = {
    "A": "Ihr Knieproblem",
    "B": "Auswirkungen im Alltag",
    "C": "Bisherige Behandlung",
    "D": "Vorbefunde und ärztliche Aussagen",
    "E": "Gesundheit und Risiken",
    "F": "Ziele, Erwartungen und Ergänzungen",
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
    # The live questionnaire (frontend/src/data/questionnaire.js) asks
    # height/weight at a different question id per indication: E4 for hip,
    # E5 for knee.
    question_id = "E4" if indication == "hip_tep" else "E5"
    value = by_id.get(question_id)

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
    """Build the doctor-dashboard risk flags.

    Question IDs are indication-specific from block B onward — knee_tep and
    hip_tep diverge structurally in the live questionnaire (see
    frontend/src/data/questionnaire.js, the real source of truth; the
    backend's own seed_data/questionnaires.py is a separate, unused
    definition). The mapping here mirrors the verified one in
    letter_service.py. Checks whose underlying question no longer exists for
    an indication are omitted rather than guessed.
    """

    by_id = _answers_by_id(answers)
    resolved_indication = indication or _infer_indication(answers)
    is_hip = resolved_indication == "hip_tep"
    joint_label = "Hüfte" if is_hip else "Knie"
    joint_article = "die Hüfte" if is_hip else "das Knie"
    # Dative, for "where" phrases: "im Knie" / "in der Hüfte". joint_article stays for
    # "into" phrases such as "Kortison-Spritze direkt in das Knie".
    joint_location = "in der Hüfte" if is_hip else "im Knie"

    flags: list[DocumentationFlag] = []

    # --- Shared: A-block (identical ids/options both indications) ---

    if by_id.get("A2") == "Nein":
        flags.append(
            _flag(
                "orange",
                "Schmerzangabe unklar",
                f"Patient berichtet keine aktuellen Schmerzen {joint_location}. Als offener Punkt im Arztgespräch prüfen.",
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

    # --- Shared: B1 (identical both indications) ---

    limitation_score = _as_number(by_id.get("B1"))

    if limitation_score is not None and limitation_score < 3:
        flags.append(
            _flag(
                "orange",
                "Geringe Alltagsbelastung berichtet",
                "Patient berichtet eine niedrige alltagsbezogene Einschränkung. Als offener Punkt für die Konsultation markieren.",
            )
        )

    # --- Shared: C1/C3/C4 (identical both indications) ---

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

    # --- Shared: E1/E2 (identical ids both indications) ---

    if by_id.get("E1") == "Ja":
        flags.append(
            _flag(
                "red",
                "Aktive Infektion berichtet",
                f"Patient berichtet eine aktuell behandelte Entzündung oder Infektion {joint_location}"
                + (" oder an anderer Stelle" if is_hip else "")
                + ". Erfordert ärztliche Prüfung.",
            )
        )

    if _is_unknown(by_id.get("E1")):
        flags.append(
            _flag(
                "orange",
                "Aktive Infektion unklar",
                f"Patient ist unsicher, ob aktuell eine Entzündung oder Infektion {joint_location} behandelt wird.",
            )
        )

    if by_id.get("E2") == "Ja":
        flags.append(
            _flag(
                "orange",
                "Frühere Gelenkinfektion berichtet",
                f"Patient berichtet eine frühere Infektion {joint_location}. Relevanz ärztlich prüfen.",
            )
        )

    if _is_unknown(by_id.get("E2")):
        flags.append(
            _flag(
                "orange",
                "Frühere Gelenkinfektion unklar",
                f"Patient ist unsicher, ob früher eine Infektion {joint_location} vorlag.",
            )
        )

    if is_hip:
        # --- Hip-specific: B2 (gated on B1>=3 in the questionnaire), B3, B4 ---

        if by_id.get("B2") == "Weniger als 3 Monate":
            flags.append(
                _flag(
                    "orange",
                    "Kurze Dauer der Alltagseinschränkung",
                    "Patient berichtet eine deutliche Alltagseinschränkung seit weniger als 3 Monaten.",
                )
            )

        if by_id.get("B4") in {"Unter 500 m", "Unter 100 m", "Kaum möglich"}:
            flags.append(
                _flag(
                    "orange",
                    "Deutliche Gehstreckenlimitierung berichtet",
                    "Patient berichtet eine relevante Einschränkung der Gehstrecke.",
                )
            )

        # --- Hip-specific: C5 Aufklärung / C6 Bewegungstherapie ---

        if by_id.get("C5") == "Nein":
            flags.append(
                _flag(
                    "orange",
                    "Aufklärung nicht erfolgt",
                    "Patient berichtet, anamnestisch bislang nicht über die Erkrankung und Behandlungsmöglichkeiten aufgeklärt worden zu sein.",
                )
            )

        if by_id.get("C6") in {"Nein", "Teilweise"}:
            flags.append(
                _flag(
                    "orange",
                    "Bewegungstherapie unvollständig",
                    "Regelmäßige Bewegungstherapie, Krankengymnastik oder gezielte Übungen sind nicht vollständig erfolgt.",
                )
            )

        # --- Hip-specific: D1 Gelenkverschleiß, D2 Vorbefunde, D3 Prothese ---

        if by_id.get("D1") in {"Nein", "Weiß nicht", "Weiß ich nicht"}:
            flags.append(
                _flag(
                    "orange",
                    "Gelenkverschleiß unklar",
                    f"Patient berichtet keinen bekannten deutlichen Gelenkverschleiß {joint_location} oder ist unsicher.",
                )
            )

        if by_id.get("D2") == "Nein":
            flags.append(
                _flag(
                    "orange",
                    "Keine externen Vorbefunde vorhanden",
                    f"Patient berichtet keine Arztbriefe, Röntgenbilder oder Befunde {joint_location}.",
                )
            )

        if _is_unknown(by_id.get("D3")):
            flags.append(
                _flag(
                    "orange",
                    "Frühere Prothesenempfehlung unklar",
                    f"Patient ist unsicher, ob bereits eine {joint_label}-Prothese empfohlen wurde.",
                )
            )

        # --- Hip-specific: E3 schwere Begleiterkrankung, E6 Diabetes ---

        if _starts_with_yes(by_id.get("E3")):
            flags.append(
                _flag(
                    "orange",
                    "Schwere Begleiterkrankung berichtet",
                    "Patient berichtet eine schwere Herz-, Lungen-, Krebs- oder andere Erkrankung mit erhöhtem Operationsrisiko. Details ärztlich prüfen.",
                )
            )

        if _is_unknown(by_id.get("E3")):
            flags.append(
                _flag(
                    "orange",
                    "Begleiterkrankungsstatus unklar",
                    "Patient ist unsicher bezüglich einer schweren Begleiterkrankung mit erhöhtem Operationsrisiko.",
                )
            )

        _append_bmi_flags(flags, answers, resolved_indication)
        _append_smoking_flag(flags, by_id.get("E5"))

        if _starts_with_yes(by_id.get("E6")):
            flags.append(
                _flag(
                    "orange",
                    "Diabetes oder erhöhte Blutzuckerwerte berichtet",
                    "Patient berichtet Diabetes oder erhöhte Blutzuckerwerte. HbA1c und präoperative Einstellung ärztlich prüfen.",
                )
            )

        if _is_unknown(by_id.get("E6")):
            flags.append(
                _flag(
                    "orange",
                    "Diabetesstatus unklar",
                    "Patient ist unsicher bezüglich Diabetes oder erhöhter Blutzuckerwerte. HbA1c/Laborwerte ärztlich prüfen.",
                )
            )

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

        _append_cortisone_flag(flags, by_id.get("E8"), joint_article)

        if _is_unknown(by_id.get("E8")):
            flags.append(
                _flag(
                    "orange",
                    "Kortison-Injektion unklar",
                    f"Patient ist unsicher bezüglich einer Kortison-Spritze direkt in {joint_article}. Im Arztgespräch klären.",
                )
            )

        if _starts_with_yes(by_id.get("E9")):
            flags.append(
                _flag(
                    "orange",
                    "Psychische Erkrankung berichtet",
                    "Patient berichtet, dass eine psychische Erkrankung vermutet wird oder behandelt wurde bzw. wird.",
                )
            )

        if by_id.get("E10") == "Ja":
            flags.append(
                _flag(
                    "orange",
                    "Beschwerden beim Wasserlassen bzw. Harnwegsinfekt berichtet",
                    "Patient berichtet aktuelle Beschwerden beim Wasserlassen oder einen behandlungsbedürftigen Harnwegsinfekt. Präoperativ relevant als möglicher Streuherd.",
                )
            )

        if _is_unknown(by_id.get("E10")):
            flags.append(
                _flag(
                    "orange",
                    "Harnwegsinfekt-Status unklar",
                    "Patient ist unsicher bezüglich aktueller Beschwerden beim Wasserlassen oder eines Harnwegsinfekts.",
                )
            )

        if _starts_with_yes(by_id.get("E11")):
            flags.append(
                _flag(
                    "orange",
                    "Dauerhafte immunmodulierende Medikation berichtet",
                    "Patient berichtet die dauerhafte Einnahme von Medikamenten, die das Immunsystem deutlich beeinflussen.",
                )
            )

        if _is_unknown(by_id.get("E11")):
            flags.append(
                _flag(
                    "orange",
                    "Immunmodulierende Medikation unklar",
                    "Patient ist unsicher bezüglich dauerhafter immunmodulierender Medikation.",
                )
            )

    else:
        # --- Knee-specific: B2 Gehstrecke, B3 Fehlstellung, B4 Kraftminderung ---

        if by_id.get("B2") in {
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

        if _is_unknown(by_id.get("B3")):
            flags.append(
                _flag(
                    "orange",
                    "Achsfehlstellung unklar",
                    "Patient ist unsicher, ob Bein oder Gelenk schief steht. Im Arztgespräch gezielt prüfen.",
                )
            )

        if _is_unknown(by_id.get("B4")):
            flags.append(
                _flag(
                    "orange",
                    "Kraftminderung unklar",
                    "Patient ist unsicher, ob das betroffene Bein schwächer geworden ist. Im Arztgespräch gezielt prüfen.",
                )
            )

        # --- Knee-specific: D1 Vorbefunde, D2 Prothese ---

        if by_id.get("D1") == "Nein":
            flags.append(
                _flag(
                    "orange",
                    "Keine externen Vorbefunde vorhanden",
                    f"Patient berichtet keine Arztbriefe, Röntgenbilder oder Befunde {joint_location}.",
                )
            )

        if _is_unknown(by_id.get("D2")):
            flags.append(
                _flag(
                    "orange",
                    "Frühere Prothesenempfehlung unklar",
                    f"Patient ist unsicher, ob bereits eine {joint_label}-Prothese empfohlen wurde.",
                )
            )

        # --- Knee-specific: E3 kardiovaskulär, E4 Diabetes ---

        if by_id.get("E3") == "Ja":
            flags.append(
                _flag(
                    "red",
                    "Kürzliches schweres Herz-Kreislauf-Ereignis berichtet",
                    "Patient berichtet ein schweres Herz-Kreislauf-Ereignis in den letzten 3 Monaten. Erfordert ärztliche Prüfung.",
                )
            )

        if _is_unknown(by_id.get("E3")):
            flags.append(
                _flag(
                    "orange",
                    "Kürzliches Herz-Kreislauf-Ereignis unklar",
                    "Patient ist unsicher, ob in den letzten 3 Monaten ein schweres Herz-Kreislauf-Ereignis vorlag.",
                )
            )

        if by_id.get("E4") == "Ja":
            flags.append(
                _flag(
                    "orange",
                    "Diabetes oder erhöhte Blutzuckerwerte berichtet",
                    "Patient berichtet Diabetes oder erhöhte Blutzuckerwerte. HbA1c und präoperative Einstellung ärztlich prüfen.",
                )
            )

        if _is_unknown(by_id.get("E4")):
            flags.append(
                _flag(
                    "orange",
                    "Diabetesstatus unklar",
                    "Patient ist unsicher bezüglich Diabetes oder erhöhter Blutzuckerwerte. HbA1c/Laborwerte ärztlich prüfen.",
                )
            )

        _append_bmi_flags(flags, answers, resolved_indication)
        _append_smoking_flag(flags, by_id.get("E6"))

        _append_cortisone_flag(flags, by_id.get("E7"), joint_article)

        if _is_unknown(by_id.get("E7")):
            flags.append(
                _flag(
                    "orange",
                    "Kortison-Injektion unklar",
                    f"Patient ist unsicher bezüglich einer Kortison-Spritze direkt in {joint_article}. Im Arztgespräch klären.",
                )
            )

        if by_id.get("E8") == "Ja":
            flags.append(
                _flag(
                    "orange",
                    "Blutarmut oder Anämie berichtet",
                    "Patient berichtet Blutarmut oder Anämie. Diagnostik und Optimierung vor OP prüfen.",
                )
            )

        if _is_unknown(by_id.get("E8")):
            flags.append(
                _flag(
                    "orange",
                    "Anämiestatus unklar",
                    "Patient ist unsicher bezüglich Blutarmut oder Anämie. Diagnostik und Optimierung vor OP prüfen.",
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

        if _starts_with_yes(by_id.get("E10")):
            flags.append(
                _flag(
                    "orange",
                    "Rheumatische Erkrankung berichtet",
                    "Patient berichtet eine rheumatische Erkrankung. Krankheitskontrolle ärztlich prüfen.",
                )
            )

        if _is_unknown(by_id.get("E10")):
            flags.append(
                _flag(
                    "orange",
                    "Rheumatische Erkrankung unklar",
                    "Patient ist unsicher bezüglich einer rheumatischen Erkrankung.",
                )
            )

        if by_id.get("E11") == "Ja":
            flags.append(
                _flag(
                    "orange",
                    "Kortison als Tabletten berichtet",
                    "Patient berichtet aktuelle Kortison-Tabletteneinnahme. Glukokortikoiddosis ärztlich prüfen.",
                )
            )

        if _is_unknown(by_id.get("E11")):
            flags.append(
                _flag(
                    "orange",
                    "Kortison-Tabletteneinnahme unklar",
                    "Patient ist unsicher bezüglich aktueller Kortison-Tabletteneinnahme.",
                )
            )

        if _starts_with_yes(by_id.get("E12")):
            flags.append(
                _flag(
                    "orange",
                    "Andere schwere Erkrankung berichtet",
                    "Patient berichtet eine andere schwere Erkrankung mit regelmäßiger ärztlicher Behandlung.",
                )
            )

        if by_id.get("E13") == "Ja":
            flags.append(
                _flag(
                    "orange",
                    "Alkohol- oder Suchtmittelrisiko berichtet",
                    "Patient berichtet regelmäßig viel Alkohol oder aktuelle Probleme mit Alkohol oder anderen Suchtmitteln.",
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


def ensure_disclaimer(report_text: str) -> str:
    clean_text = report_text.strip()

    if clean_text.startswith(DISCLAIMER):
        return clean_text

    return f"{DISCLAIMER}\n\n{clean_text}"