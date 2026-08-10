from __future__ import annotations

from typing import Any

from app.report_service import (
    _answer_value,
    _answers_by_id,
    _as_number,
    calculate_bmi,
    clean_german_text,
)


# ---------------------------------------------------------------------------
# Shared translation tables
#
# These mirror the "Übersetzungstabellen" in the Klineus Arztbrief reference
# documents (Hüft-TEP / Knie-TEP handover specs). Question IDs here are the
# ones actually used by the live patient questionnaire in
# frontend/src/data/questionnaire.js — NOT the backend's CMS-seeded
# questionnaire (backend/app/seed_data/questionnaires.py), which is a
# separate, unused, differently-numbered definition. The two indications
# have genuinely different question sets/IDs from block B onward, so almost
# everything below is indication-specific.
# ---------------------------------------------------------------------------

DURATION_SEIT = {
    "Weniger als 3 Monate": "seit weniger als 3 Monaten",
    "3 bis 6 Monate": "seit 3 bis 6 Monaten",
    "6 bis 12 Monate": "seit 6 bis 12 Monaten",
    "Länger als 1 Jahr": "seit über einem Jahr",
}

DURATION_UEBER = {
    "Weniger als 3 Monate": "über weniger als 3 Monate",
    "3 bis 6 Monate": "über 3 bis 6 Monate",
    "6 bis 12 Monate": "über 6 bis 12 Monate",
    "Länger als 1 Jahr": "über mehr als ein Jahr",
}

KNEE_A5_TIMING_TEXT = {
    "Beim Gehen oder Belasten": "bei Belastung",
    "Beim Treppensteigen": "beim Treppensteigen",
    "In Ruhe": "in Ruhe",
    "Nachts": "nachts",
    "Eigentlich immer": "dauerhaft",
}

HIP_A5_TIMING_TEXT = {
    "Beim Gehen oder Belasten": "bei Belastung",
    "Beim Aufstehen oder Lagewechsel": "beim Aufstehen und bei Lagewechseln",
    "In Ruhe": "in Ruhe",
    "Nachts": "nachts",
    "Eigentlich immer": "dauerhaft",
}

KNEE_A6_TEXT = {
    "Schmerz": "Schmerzen",
    "Steifigkeit": "ein Steifigkeitsgefühl",
    "Unsicherheit im Knie": "ein Instabilitätsgefühl",
    "Das Knie knickt weg": "Giving-way-Episoden",
    "Knie lässt sich nicht richtig beugen oder strecken": "eine eingeschränkte Beweglichkeit",
    "Schwellung": "eine Schwellneigung",
    "Etwas anderes": "weitere Beschwerden gemäß Patientenangabe",
}

HIP_A6_TEXT = {
    "Schmerz": "Schmerzen",
    "Steifigkeit": "ein Steifigkeitsgefühl",
    "Die Hüfte ist unbeweglich": "eine eingeschränkte Beweglichkeit",
    "Ich humpele": "ein hinkendes Gangbild",
    "Die Hüfte fühlt sich schwach an": "ein Schwächegefühl",
    "Etwas anderes": "weitere Beschwerden gemäß Patientenangabe",
}

A7_REASON_TEXT = {
    "Ursache klären": "die Klärung der Beschwerdeursache",
    "Behandlung besprechen": "die Besprechung der Behandlungsoptionen",
    "Prüfen ob eine Operation sinnvoll sein könnte": "die Prüfung einer Operationsindikation",
    "Zweitmeinung": "der Wunsch nach einer Zweitmeinung",
    "Sonstiges": "sonstige Gründe",
}

HIP_B3_ACTIVITY_TEXT = {
    "Gehen": "beim Gehen",
    "Längeres Stehen": "bei längerem Stehen",
    "Treppensteigen": "beim Treppensteigen",
    "Hinsetzen oder Aufstehen": "beim Hinsetzen und Aufstehen",
    "Schuhe oder Socken anziehen": "beim An- und Ausziehen von Schuhen und Socken",
    "Haushalt": "bei der Haushaltsführung",
    "Arbeit oder Beruf": "bei der beruflichen Tätigkeit",
    "Sport oder Hobbys": "bei Sport und Hobbys",
    "Verkehrsmittel nutzen": "bei der Nutzung von Verkehrsmitteln",
    "Sexualität": "im Bereich der Sexualität",
}

KNEE_GEHSTRECKE_TEXT = {
    "Mehr als 1 Kilometer": "über 1 km",
    "500 Meter bis 1 Kilometer": "500 m bis 1 km",
    "100 bis 500 Meter": "100 bis 500 m",
    "Weniger als 100 Meter": "unter 100 m",
    "Kaum möglich": "als kaum möglich",
}

HIP_GEHSTRECKE_TEXT = {
    "Mehr als 1 km": "über 1 km",
    "500 m bis 1 km": "500 m bis 1 km",
    "Unter 500 m": "unter 500 m",
    "Unter 100 m": "unter 100 m",
    "Kaum möglich": "als kaum möglich",
}

KNEE_HILFEBEDARF_TEXT = {
    "Selten": "gelegentlich",
    "Regelmäßig": "regelmäßig",
    "Fast immer": "nahezu durchgehend",
}

C2_MASSNAHMEN_TEXT = {
    "Schmerzmittel": "analgetischer Medikation",
    "Physiotherapie oder Krankengymnastik": "Physiotherapie",
    "Übungen zu Hause": "eigenständigem Übungsprogramm",
    "Spritzen ins Knie": "intraartikulären Injektionen",
    "Spritzen in die Hüfte": "intraartikulären Injektionen",
    "Bandage oder Hilfsmittel": "Orthesen- bzw. Hilfsmittelversorgung",
    "Einlagen oder spezielle Schuhe": "Einlagen- bzw. Schuhversorgung",
    "Empfehlung zur Gewichtsabnahme": "der Empfehlung zur Gewichtsreduktion",
    "Gehstock oder andere Hilfsmittel": "Hilfsmittelversorgung",
    "Sonstige Behandlung": "sonstiger Behandlung gemäß Patientenangabe",
}

C4_ANSPRECHEN_TEXT = {
    "Ja, deutlich": "als deutlich",
    "Ja, etwas": "als gering",
    "Nein, kaum oder gar nicht": "als nicht ausreichend",
}

HIP_C6_BEWEGUNGSTHERAPIE_TEXT = {
    "Ja": "regelmäßig",
    "Teilweise": "zeitweise",
}

SIDE_WORD = {
    "Rechts": "rechts",
    "Links": "links",
}

SIDE_ADJECTIVE = {
    "Rechts": "rechte",
    "Links": "linke",
}

SIDE_PLACEHOLDER = "[Seite auswählen]"

ROENTGEN_DEFAULT = (
    "Regelrechte Implantatlage, kein Nachweis einer periprothetischen Fraktur"
)
GEHHILFE_DEFAULT = "Unterarmgehstützen"
BEWEGLICHKEIT_DEFAULT = "0-0-90°"
TELEFON_PLACEHOLDER = "[Telefonnummer der Sprechstunde eintragen]"
ANREDE_PLACEHOLDER = "[Der Patient/Die Patientin]"


INDICATION_CONFIG = {
    "hip_tep": {
        "title_label": "Hüft-TEP",
        "diagnosis_label": "Coxarthrose",
        "joint_short": "Hüft",
        "joint_full": "Hüftgelenkes",
        "nebendiagnosen_heading": "Nebendiagnosen",
        "xray_exam": "Beckenübersicht und Hüfte axial",
        "mobility_label": "Hüftgelenkbeweglichkeit",
        "prosthesis_word": "Hüftendoprothese",
        "prosthesis_full": "Hüftgelenktotalendoprothese",
    },
    "knee_tep": {
        "title_label": "Knie-TEP",
        "diagnosis_label": "Gonarthrose",
        "joint_short": "Knie",
        "joint_full": "Kniegelenkes",
        "nebendiagnosen_heading": "Dauerdiagnosen",
        "xray_exam": "Kniegelenk in 2 Ebenen, Patella axial",
        "mobility_label": "Kniegelenkbeweglichkeit",
        "prosthesis_word": "Knieendoprothese",
        "prosthesis_full": "Kniegelenktotalendoprothese",
    },
}


# ---------------------------------------------------------------------------
# Small helpers
# ---------------------------------------------------------------------------

def join_with_and(items: list[str]) -> str:
    clean_items = [item for item in items if item]

    if not clean_items:
        return ""

    if len(clean_items) == 1:
        return clean_items[0]

    return f"{', '.join(clean_items[:-1])} und {clean_items[-1]}"


def single_value(by_id: dict[str, Any], question_id: str) -> str:
    return str(_answer_value(by_id.get(question_id)) or "").strip()


def multi_values(by_id: dict[str, Any], question_id: str) -> list[str]:
    value = by_id.get(question_id)

    if isinstance(value, list):
        return [str(item).strip() for item in value if str(item or "").strip()]

    return []


def number_value(by_id: dict[str, Any], question_id: str) -> int | None:
    number = _as_number(by_id.get(question_id))

    if number is None:
        return None

    return int(round(number))


def split_value_and_detail(by_id: dict[str, Any], question_id: str) -> tuple[str, str]:
    """"single_with_text" answers are stored flattened as "Value" or
    "Value: detail text" (see serialiseAnswer() in QuestionnairePage.jsx)."""

    raw = single_value(by_id, question_id)

    if ": " in raw:
        value, _, detail = raw.partition(": ")
        return value.strip(), detail.strip()

    return raw, ""


def smoking_answer(by_id: dict[str, Any], question_id: str) -> dict[str, Any]:
    raw = by_id.get(question_id)

    if isinstance(raw, dict):
        return {
            "value": str(raw.get("value") or "").strip(),
            "pack_years": raw.get("pack_years"),
            "stopped_since": str(raw.get("stopped_since") or "").strip(),
        }

    return {"value": str(raw or "").strip(), "pack_years": None, "stopped_since": ""}


def resolve_side(by_id: dict[str, Any]) -> tuple[str, str]:
    """Returns (diagnosis-line side text, adjective form) for A1."""

    a1 = single_value(by_id, "A1")

    word = SIDE_WORD.get(a1)
    adjective = SIDE_ADJECTIVE.get(a1)

    return (word or SIDE_PLACEHOLDER, adjective or SIDE_PLACEHOLDER)


# ---------------------------------------------------------------------------
# Diagnose / Nebendiagnosen / Dauerdiagnosen
# ---------------------------------------------------------------------------

def build_diagnose_lines(
    config: dict[str, Any],
    side_word: str,
    bmi: float | None,
) -> list[str]:
    lines = [f"{config['diagnosis_label']} {side_word}"]

    if bmi is not None and bmi >= 30:
        lines.append(f"Adipositas (BMI {bmi:.1f})")

    return lines


def build_hip_nebendiagnosen(by_id: dict[str, Any], config: dict[str, Any]) -> list[str]:
    entries: list[str] = []

    diabetes_value, diabetes_detail = split_value_and_detail(by_id, "E6")
    if diabetes_value == "Ja":
        entries.append(
            f"Diabetes mellitus ({diabetes_detail})"
            if diabetes_detail
            else "Diabetes mellitus bzw. erhöhte Blutzuckerwerte"
        )

    if single_value(by_id, "E2") == "Ja":
        entries.append(f"Zustand nach Infektion des betroffenen {config['joint_full']}")

    other_value, other_detail = split_value_and_detail(by_id, "E3")
    if other_value == "Ja":
        entries.append(
            f"Schwere Begleiterkrankung mit erhöhtem Operationsrisiko ({other_detail})"
            if other_detail
            else "Schwere Begleiterkrankung mit erhöhtem Operationsrisiko"
        )

    medication_value, medication_detail = split_value_and_detail(by_id, "E11")
    if medication_value.startswith("Ja"):
        entries.append(
            f"Dauerhafte immunmodulierende Medikation ({medication_detail})"
            if medication_detail
            else "Dauerhafte immunmodulierende Medikation"
        )

    return entries


def build_knee_dauerdiagnosen(by_id: dict[str, Any], config: dict[str, Any]) -> list[str]:
    entries: list[str] = []

    if single_value(by_id, "E4") == "Ja":
        entries.append("Diabetes mellitus bzw. erhöhte Blutzuckerwerte")

    if single_value(by_id, "E2") == "Ja":
        entries.append(f"Zustand nach Infektion des betroffenen {config['joint_full']}")

    rheuma_value, rheuma_detail = split_value_and_detail(by_id, "E10")
    if rheuma_value == "Ja":
        entries.append(
            f"Rheumatische Erkrankung ({rheuma_detail})"
            if rheuma_detail
            else "Rheumatische Erkrankung"
        )

    if single_value(by_id, "E8") == "Ja":
        entries.append("Anämie in der Vorgeschichte")

    other_value, other_detail = split_value_and_detail(by_id, "E12")
    if other_value == "Ja":
        entries.append(
            f"Weitere behandlungsbedürftige Erkrankung ({other_detail})"
            if other_detail
            else "Weitere behandlungsbedürftige Erkrankung"
        )

    if single_value(by_id, "E11") == "Ja":
        entries.append("Systemische Glukokortikoidtherapie")

    return entries


# ---------------------------------------------------------------------------
# Präoperativ erhobene Risikofaktoren
# ---------------------------------------------------------------------------

def smoking_risk_line(by_id: dict[str, Any], question_id: str, active_values: set[str]) -> str | None:
    smoking = smoking_answer(by_id, question_id)
    value = smoking["value"]

    if value in active_values:
        pack_years = smoking["pack_years"]

        if pack_years not in (None, ""):
            return f"Aktiver Nikotinkonsum ({pack_years} pack years)"

        return "Aktiver Nikotinkonsum (Patientenangabe)"

    if value == "Ja, gelegentlich":
        return "Gelegentlicher Nikotinkonsum (Patientenangabe)"

    if value.startswith("Ich habe aufgehört"):
        stopped_since = smoking["stopped_since"]

        if stopped_since:
            return f"Nikotinkonsum in der Vorgeschichte, abstinent seit {stopped_since} (Patientenangabe)"

        return "Nikotinkonsum in der Vorgeschichte, aktuell abstinent (Patientenangabe)"

    return None


def build_hip_risikofaktoren(by_id: dict[str, Any], config: dict[str, Any]) -> list[str]:
    entries: list[str] = []

    if single_value(by_id, "E1") == "Ja":
        entries.append(
            f"Aktuell behandelte Entzündung/Infektion des {config['joint_full']} oder an anderer "
            "Stelle (Patientenangabe)"
        )

    if single_value(by_id, "E2") == "Ja":
        entries.append(f"Zustand nach Infektion des betroffenen {config['joint_full']}")

    other_value, other_detail = split_value_and_detail(by_id, "E3")
    if other_value == "Ja":
        entries.append(
            f"Schwere Begleiterkrankung mit erhöhtem Operationsrisiko ({other_detail})"
            if other_detail
            else "Schwere Begleiterkrankung mit erhöhtem Operationsrisiko"
        )

    smoking_line = smoking_risk_line(by_id, "E5", {"Ja, täglich"})
    if smoking_line:
        entries.append(smoking_line)

    diabetes_value, diabetes_detail = split_value_and_detail(by_id, "E6")
    if diabetes_value == "Ja":
        entries.append(
            f"Diabetes mellitus ({diabetes_detail})"
            if diabetes_detail
            else "Diabetes mellitus bzw. erhöhte Blutzuckerwerte"
        )

    if single_value(by_id, "E7") == "Ja":
        entries.append("Anämie in der Vorgeschichte")

    e8 = single_value(by_id, "E8")
    if e8 == "Ja, vor weniger als 6 Wochen":
        entries.append("Intraartikuläre Kortisoninjektion vor weniger als 6 Wochen")
    elif e8 == "Ja, vor 6 Wochen bis 3 Monaten":
        entries.append("Intraartikuläre Kortisoninjektion vor 6 Wochen bis 3 Monaten")
    elif e8 == "Ja, vor mehr als 3 Monaten":
        entries.append("Intraartikuläre Kortisoninjektion vor mehr als 3 Monaten")

    if single_value(by_id, "E10") == "Ja":
        entries.append("Beschwerden beim Wasserlassen bzw. behandlungsbedürftiger Harnwegsinfekt")

    medication_value, medication_detail = split_value_and_detail(by_id, "E11")
    if medication_value.startswith("Ja"):
        entries.append(
            f"Dauerhafte immunmodulierende Medikation ({medication_detail})"
            if medication_detail
            else "Dauerhafte immunmodulierende Medikation"
        )

    return entries


def build_knee_risikofaktoren(by_id: dict[str, Any], config: dict[str, Any]) -> list[str]:
    entries: list[str] = []

    if single_value(by_id, "E1") == "Ja":
        entries.append(
            f"Aktuell behandelte Entzündung/Infektion des {config['joint_full']} (Patientenangabe)"
        )

    if single_value(by_id, "E2") == "Ja":
        entries.append(f"Zustand nach Infektion des betroffenen {config['joint_full']}")

    if single_value(by_id, "E3") == "Ja":
        entries.append("Kardiovaskuläres Ereignis innerhalb der letzten 3 Monate")

    if single_value(by_id, "E4") == "Ja":
        entries.append("Diabetes mellitus bzw. erhöhte Blutzuckerwerte")

    smoking_line = smoking_risk_line(
        by_id, "E6", {"Ja, mit Angabe Packungen pro Tag und Rauchjahre"}
    )
    if smoking_line:
        entries.append(smoking_line)

    e7 = single_value(by_id, "E7")
    if e7 == "Ja, vor weniger als 6 Wochen":
        entries.append("Intraartikuläre Kortisoninjektion vor weniger als 6 Wochen")
    elif e7 == "Ja, vor 6 Wochen bis 3 Monaten":
        entries.append("Intraartikuläre Kortisoninjektion vor 6 Wochen bis 3 Monaten")
    elif e7 == "Ja, vor mehr als 3 Monaten":
        entries.append("Intraartikuläre Kortisoninjektion vor mehr als 3 Monaten")

    if single_value(by_id, "E8") == "Ja":
        entries.append("Anämie in der Vorgeschichte")

    rheuma_value, rheuma_detail = split_value_and_detail(by_id, "E10")
    if rheuma_value == "Ja":
        entries.append(
            f"Rheumatische Erkrankung ({rheuma_detail})"
            if rheuma_detail
            else "Rheumatische Erkrankung"
        )

    if single_value(by_id, "E11") == "Ja":
        entries.append("Systemische Glukokortikoidtherapie")

    other_value, other_detail = split_value_and_detail(by_id, "E12")
    if other_value == "Ja":
        entries.append(
            f"Weitere behandlungsbedürftige Erkrankung ({other_detail})"
            if other_detail
            else "Weitere behandlungsbedürftige Erkrankung"
        )

    return entries


# ---------------------------------------------------------------------------
# Anamnese
# ---------------------------------------------------------------------------

def build_a2_sentence(by_id: dict[str, Any], config: dict[str, Any]) -> str:
    a2 = single_value(by_id, "A2")

    if a2 == "Ja":
        duration = DURATION_SEIT.get(single_value(by_id, "A3"), "")
        nrs = number_value(by_id, "A4")

        sentence = "Anamnestisch bestehen die Beschwerden"

        if duration:
            sentence += f" {duration}"

        sentence += "."

        if nrs is not None:
            sentence += f" Die Schmerzintensität wurde im Durchschnitt mit {nrs}/10 (NRS) angegeben."

        return sentence

    if a2 == "Nein":
        return f"Zum Zeitpunkt der Datenerhebung wurden keine aktuellen {config['joint_short']}schmerzen angegeben."

    return ""


def build_a5_sentence(by_id: dict[str, Any], timing_text: dict[str, str]) -> str:
    values = multi_values(by_id, "A5")
    mapped = [timing_text[v] for v in values if v in timing_text]

    if not mapped:
        return ""

    return f"Die Schmerzen traten vor allem {join_with_and(mapped)} auf."


def build_a6_sentence(by_id: dict[str, Any], a6_text: dict[str, str]) -> str:
    values = multi_values(by_id, "A6")

    if single_value(by_id, "A2") == "Ja":
        values = [v for v in values if v != "Schmerz"]

    mapped = [a6_text[v] for v in values if v in a6_text]

    if not mapped:
        return ""

    return f"Begleitend wurden {join_with_and(mapped)} berichtet."


def build_a7_sentence(by_id: dict[str, Any]) -> str:
    a7 = single_value(by_id, "A7")
    mapped = A7_REASON_TEXT.get(a7)

    if not mapped:
        return ""

    return f"Als Grund der Vorstellung wurde {mapped} angegeben."


def build_conservative_treatment_sentence(by_id: dict[str, Any]) -> str:
    c1 = single_value(by_id, "C1")

    if c1 == "Ja":
        c3_duration = DURATION_UEBER.get(single_value(by_id, "C3"), "")
        c2_values = multi_values(by_id, "C2")
        c2_mapped = [C2_MASSNAHMEN_TEXT[v] for v in c2_values if v in C2_MASSNAHMEN_TEXT]
        c4_mapped = C4_ANSPRECHEN_TEXT.get(single_value(by_id, "C4"), "")

        sentence = "Konservativ erfolgte"
        if c3_duration:
            sentence += f" {c3_duration}"
        sentence += " eine Vorbehandlung"
        if c2_mapped:
            sentence += f" mittels {join_with_and(c2_mapped)}"
        sentence += "."

        if c4_mapped:
            sentence += f" Eine Beschwerdebesserung wurde {c4_mapped} angegeben."

        return sentence

    if c1 == "Nein":
        return "Eine konservative Vorbehandlung wurde anamnestisch nicht durchgeführt."

    return ""


def build_vorbefunde_sentence(by_id: dict[str, Any], question_id: str) -> str:
    value = single_value(by_id, question_id)

    if value == "Ja, ich habe Unterlagen":
        return "Auswärtige Vorbefunde lagen vor."

    if value == "Nein":
        return "Auswärtige Vorbefunde lagen zum Zeitpunkt der Datenerhebung nicht vor."

    return ""


def build_hip_anamnese(by_id: dict[str, Any], config: dict[str, Any]) -> list[str]:
    side_word, side_adjective = resolve_side(by_id)

    paragraph1 = (
        f"{ANREDE_PLACEHOLDER} wurde bei gesicherter {config['diagnosis_label']} zur "
        f"geplanten endoprothetischen Versorgung des {config['joint_full']} stationär "
        "aufgenommen. Die Indikation bestand aufgrund einer seit längerer Zeit "
        "bestehenden Schmerzsymptomatik und zunehmender Einschränkung der "
        "schmerzfreien Gehstrecke."
    )

    clauses2: list[str] = []

    a2_sentence = build_a2_sentence(by_id, config)
    if a2_sentence:
        clauses2.append(a2_sentence)

    a5_sentence = build_a5_sentence(by_id, HIP_A5_TIMING_TEXT)
    if a5_sentence:
        clauses2.append(a5_sentence)

    a6_sentence = build_a6_sentence(by_id, HIP_A6_TEXT)
    if a6_sentence:
        clauses2.append(a6_sentence)

    b1 = number_value(by_id, "B1")
    if b1 is not None:
        clauses2.append(f"Die Einschränkung im Alltag wurde mit {b1}/10 angegeben.")

    if b1 is not None and b1 >= 3:
        b2_duration = DURATION_SEIT.get(single_value(by_id, "B2"))
        if b2_duration:
            clauses2.append(f"Eine deutliche Alltagseinschränkung bestand {b2_duration}.")

    b3_values = [v for v in multi_values(by_id, "B3") if v != "Keine besonderen Schwierigkeiten"]
    b3_mapped = [HIP_B3_ACTIVITY_TEXT[v] for v in b3_values if v in HIP_B3_ACTIVITY_TEXT]
    if b3_mapped:
        clauses2.append(f"Schwierigkeiten bestanden insbesondere {join_with_and(b3_mapped)}.")

    b4_mapped = HIP_GEHSTRECKE_TEXT.get(single_value(by_id, "B4"))
    if b4_mapped:
        clauses2.append(f"Die schmerzfreie Gehstrecke betrug anamnestisch {b4_mapped}.")

    b5 = number_value(by_id, "B5")
    if b5 is not None:
        clauses2.append(f"Der subjektive Leidensdruck wurde mit {b5}/10 angegeben.")

    paragraph2 = " ".join(clauses2)

    clauses3: list[str] = []

    conservative_sentence = build_conservative_treatment_sentence(by_id)
    if conservative_sentence:
        clauses3.append(conservative_sentence)

    c6_mapped = HIP_C6_BEWEGUNGSTHERAPIE_TEXT.get(single_value(by_id, "C6"))
    if c6_mapped:
        clauses3.append(
            f"Eine regelmäßige Bewegungstherapie bzw. Krankengymnastik wurde {c6_mapped} durchgeführt."
        )

    c5 = single_value(by_id, "C5")
    if c5 == "Ja":
        clauses3.append(
            "Eine Aufklärung über die Erkrankung und die Behandlungsmöglichkeiten war zuvor erfolgt."
        )
    elif c5 == "Nein":
        clauses3.append(
            "Eine Aufklärung über die Erkrankung und die Behandlungsmöglichkeiten war "
            "anamnestisch nicht erfolgt."
        )

    if single_value(by_id, "C7") == "Ja":
        clauses3.append(
            "Eine ärztliche Empfehlung zur zunächst weiteren konservativen Behandlung "
            "war zuvor ausgesprochen worden."
        )

    paragraph3 = " ".join(clauses3)

    clauses4: list[str] = []

    if single_value(by_id, "D1") == "Ja":
        clauses4.append(
            f"Ein deutlicher Gelenkverschleiß der {config['joint_short']}e war dem "
            "Patienten zuvor mitgeteilt worden."
        )

    vorbefunde_sentence = build_vorbefunde_sentence(by_id, "D2")
    if vorbefunde_sentence:
        clauses4.append(vorbefunde_sentence)

    prothese_value, prothese_detail = split_value_and_detail(by_id, "D3")
    if prothese_value == "Ja":
        clauses4.append(
            f"Eine {config['prosthesis_word']} war extern bereits für {prothese_detail} "
            "empfohlen worden."
            if prothese_detail
            else f"Eine {config['prosthesis_word']} war extern bereits für die "
            f"{side_adjective} Seite empfohlen worden."
        )

    a7_sentence = build_a7_sentence(by_id)
    if a7_sentence:
        clauses4.append(a7_sentence)

    paragraph4 = " ".join(clauses4)

    return [
        paragraph1,
        paragraph2,
        paragraph3,
        paragraph4,
    ]


def build_knee_anamnese(by_id: dict[str, Any], config: dict[str, Any]) -> list[str]:
    side_word, side_adjective = resolve_side(by_id)

    paragraph1 = (
        f"{ANREDE_PLACEHOLDER} wurde bei klinisch und radiologisch gesicherter "
        f"{config['diagnosis_label']} {side_word} zur geplanten Implantation einer "
        f"{config['joint_short']}gelenksendoprothese aufgenommen. Die Indikation "
        "bestand aufgrund einer konservativ nicht mehr führbaren Schmerzsymptomatik "
        "und zunehmender Einschränkung der schmerzfreien Gehstrecke."
    )

    clauses2: list[str] = []

    a2_sentence = build_a2_sentence(by_id, config)
    if a2_sentence:
        clauses2.append(a2_sentence)

    a5_sentence = build_a5_sentence(by_id, KNEE_A5_TIMING_TEXT)
    if a5_sentence:
        clauses2.append(a5_sentence)

    a6_sentence = build_a6_sentence(by_id, KNEE_A6_TEXT)
    if a6_sentence:
        clauses2.append(a6_sentence)

    b1 = number_value(by_id, "B1")
    if b1 is not None:
        clauses2.append(f"Die Einschränkung im Alltag wurde mit {b1}/10 angegeben.")

    b2_mapped = KNEE_GEHSTRECKE_TEXT.get(single_value(by_id, "B2"))
    if b2_mapped:
        clauses2.append(f"Die schmerzfreie Gehstrecke betrug anamnestisch {b2_mapped}.")

    if single_value(by_id, "B3") == "Ja":
        clauses2.append("Subjektiv wurde eine Fehlstellung der Beinachse angegeben.")

    if single_value(by_id, "B4") == "Ja":
        clauses2.append("Zusätzlich wurde eine Kraftminderung des betroffenen Beines berichtet.")

    b5_mapped = KNEE_HILFEBEDARF_TEXT.get(single_value(by_id, "B5"))
    if b5_mapped:
        clauses2.append(f"Im Alltag bestand {b5_mapped} Unterstützungsbedarf durch Dritte.")

    paragraph2 = " ".join(clauses2)

    clauses3: list[str] = []

    conservative_sentence = build_conservative_treatment_sentence(by_id)
    if conservative_sentence:
        clauses3.append(conservative_sentence)

    if single_value(by_id, "C5") == "Ja":
        clauses3.append(
            "Eine ärztliche Empfehlung zur zunächst weiteren konservativen Behandlung "
            "war zuvor ausgesprochen worden."
        )

    paragraph3 = " ".join(clauses3)

    clauses4: list[str] = []

    vorbefunde_sentence = build_vorbefunde_sentence(by_id, "D1")
    if vorbefunde_sentence:
        clauses4.append(vorbefunde_sentence)

    prothese_value, prothese_detail = split_value_and_detail(by_id, "D2")
    if prothese_value == "Ja":
        clauses4.append(
            f"Eine {config['prosthesis_word']} war extern bereits für {prothese_detail} "
            "empfohlen worden."
            if prothese_detail
            else f"Eine {config['prosthesis_word']} war extern bereits für die "
            f"{side_adjective} Seite empfohlen worden."
        )

    a7_sentence = build_a7_sentence(by_id)
    if a7_sentence:
        clauses4.append(a7_sentence)

    paragraph4 = " ".join(clauses4)

    return [
        paragraph1,
        paragraph2,
        paragraph3,
        paragraph4,
    ]


# ---------------------------------------------------------------------------
# Full letter assembly
# ---------------------------------------------------------------------------

def build_arztbrief(
    answers: list[dict[str, Any]],
    indication: str | None = None,
    questionnaire_version: int | None = None,
) -> dict[str, Any]:
    resolved_indication = indication if indication in INDICATION_CONFIG else "knee_tep"
    config = INDICATION_CONFIG[resolved_indication]

    by_id = _answers_by_id(answers)

    side_word, side_adjective = resolve_side(by_id)
    bmi = calculate_bmi(answers, resolved_indication)

    diagnose_lines = build_diagnose_lines(config, side_word, bmi)

    if resolved_indication == "hip_tep":
        nebendiagnosen = build_hip_nebendiagnosen(by_id, config)
        risikofaktoren = build_hip_risikofaktoren(by_id, config)
        anamnese_paragraphs = build_hip_anamnese(by_id, config)
    else:
        nebendiagnosen = build_knee_dauerdiagnosen(by_id, config)
        risikofaktoren = build_knee_risikofaktoren(by_id, config)
        anamnese_paragraphs = build_knee_anamnese(by_id, config)

    lines: list[str] = []

    lines.append(f"# Vorläufiger Arztbrief – {config['title_label']} ({config['diagnosis_label']})")
    lines.append("")
    lines.append(
        "[Briefkopf: Praxis-/Klinikname, Anschrift, Patientenstammdaten, Anrede, "
        "Aufnahme- und Entlassungsdatum eintragen]"
    )

    lines.append("")
    lines.append("## Diagnose")
    for entry in diagnose_lines:
        lines.append(entry)

    if nebendiagnosen:
        lines.append("")
        lines.append(f"## {config['nebendiagnosen_heading']}")
        for entry in nebendiagnosen:
            lines.append(f"- {entry}")

    lines.append("")
    lines.append("## Therapie")
    lines.append("Operation am [OP-Datum eintragen]:")
    lines.append("[Operationsverfahren eintragen]")
    lines.append("[Implantat eintragen]")

    lines.append("")
    lines.append("## Anamnese")
    for paragraph in anamnese_paragraphs:
        if paragraph:
            lines.append(paragraph)
            lines.append("")
    if lines[-1] == "":
        lines.pop()

    if risikofaktoren:
        lines.append("")
        lines.append("## Präoperativ erhobene Risikofaktoren (Patientenangaben)")
        for entry in risikofaktoren:
            lines.append(f"- {entry}")

    lines.append("")
    lines.append("## Röntgen")
    lines.append(f"Postoperative Kontrolle ({config['xray_exam']}): {ROENTGEN_DEFAULT}")

    lines.append("")
    lines.append("## Therapie und Verlauf")
    lines.append(
        "Nach den üblichen präoperativen Vorbereitungen erfolgte der Eingriff in "
        "komplikationsloser Narkose. Postoperativ zeigte sich die Wunde reizlos, die "
        "periphere Durchblutung, Motorik und Sensibilität waren stets intakt. Die "
        "Röntgenkontrolle zeigte einen regelrechten Sitz der eingebrachten "
        f"Endoprothese. {ANREDE_PLACEHOLDER} wurde unter physiotherapeutischer "
        "Anleitung mit schmerzadaptierter Vollbelastung mobilisiert."
    )

    lines.append("")
    lines.append("## Entlassungsbefund")
    lines.append(
        f"Wunde reizlos, periphere Durchblutung, Motorik und Sensibilität intakt. "
        f"Mobilisation an {GEHHILFE_DEFAULT} auf Stationsebene und im Treppenhaus. "
        f"{config['mobility_label']} für E/F {BEWEGLICHKEIT_DEFAULT}."
    )

    lines.append("")
    lines.append("## Medikation bei Entlassung")
    lines.append("Siehe beiliegenden Medikationsplan.")

    lines.append("")
    lines.append("## Procedere")

    if resolved_indication == "hip_tep":
        lines.append(
            "Wir bitten um regelmäßige Befundkontrollen und Entfernung des "
            "einliegenden Hautklammernahtmaterials nach 12-14 Tagen postoperativ. "
            "Leitliniengerechte Fortführung der Thromboseprophylaxe unter "
            "Blutbildkontrollen bis Wiedererreichen der stützfreien Vollbelastung. "
            "Für 6 Wochen postoperativ sind aktive Adduktion und Flexion >90° zu "
            "vermeiden. Fortführung von KG und LD empfohlen. Regelmäßige "
            f"klinisch-radiologische Verlaufskontrollen der implantierten "
            f"{config['prosthesis_full']}."
        )
    else:
        lines.append(
            "Wir bitten um regelmäßige Befundkontrollen und Entfernung des "
            "einliegenden Hautklammernahtmaterials ab dem 14. Tag postoperativ. "
            "Leitliniengerechte Fortführung der Thromboseprophylaxe unter "
            "Blutbildkontrollen bis Wiedererreichen der stützfreien Vollbelastung. "
            "Fortführung von KG und LD empfohlen. Regelmäßige klinisch-radiologische "
            f"Verlaufskontrollen der implantierten {config['prosthesis_full']}."
        )

    lines.append(
        "Bei Fragen oder neuerlichen Beschwerden gern jederzeit Wiedervorstellung "
        f"in unserer Sprechstunde nach entsprechender Terminvereinbarung unter "
        f"{TELEFON_PLACEHOLDER}."
    )

    lines.append("")
    lines.append("[Grußformel, Unterschrift, Kontaktdaten der Praxis/Klinik eintragen]")

    report_text = clean_german_text("\n".join(lines))

    report_json = {
        "indication": resolved_indication,
        "questionnaire_version": questionnaire_version,
        "diagnose": diagnose_lines,
        "nebendiagnosen": nebendiagnosen,
        "risikofaktoren": risikofaktoren,
        "anamnese_paragraphs": anamnese_paragraphs,
        "bmi": bmi,
    }

    return {
        "report_text": report_text,
        "report_json": report_json,
    }
