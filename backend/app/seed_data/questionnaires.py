from __future__ import annotations

from copy import deepcopy


def lt(de: str, en: str) -> dict[str, str]:
    return {
        "de": de,
        "en": en,
    }


def option(de: str, en: str) -> dict:
    return {
        "value": de,
        "labels": lt(de, en),
    }


def question(
    question_id: str,
    text_de: str,
    text_en: str,
    question_type: str,
    order: int,
    options: list[dict] | None = None,
    minimum: int | None = None,
    maximum: int | None = None,
    required: bool = True,
    pii_category: str = "none",
    include_in_ai: bool = True,
    help_text_de: str = "",
    help_text_en: str = "",
) -> dict:
    return {
        "id": question_id,
        "block_id": "",
        "block_title": {},
        "type": question_type,
        "labels": lt(text_de, text_en),
        "options": options or [],
        "min": minimum,
        "max": maximum,
        "required": required,
        "pii_category": pii_category,
        "include_in_ai": include_in_ai,
        "order": order,
        "help_text": lt(help_text_de, help_text_en) if help_text_de or help_text_en else {},
    }


def block(
    block_id: str,
    title_de: str,
    title_en: str,
    order: int,
    questions: list[dict],
) -> dict:
    title = lt(title_de, title_en)

    prepared_questions = []
    for item in questions:
        next_item = deepcopy(item)
        next_item["block_id"] = block_id
        next_item["block_title"] = title
        prepared_questions.append(next_item)

    return {
        "id": block_id,
        "title": title,
        "order": order,
        "questions": prepared_questions,
    }


YES_NO = [
    option("Ja", "Yes"),
    option("Nein", "No"),
]

YES_NO_UNKNOWN = [
    option("Ja", "Yes"),
    option("Nein", "No"),
    option("Weiß nicht", "I do not know"),
]

YES_NO_IDK = [
    option("Ja", "Yes"),
    option("Nein", "No"),
    option("Weiß ich nicht", "I do not know"),
]

DURATION_OPTIONS = [
    option("Weniger als 3 Monate", "Less than 3 months"),
    option("3 bis 6 Monate", "3 to 6 months"),
    option("6 bis 12 Monate", "6 to 12 months"),
    option("Länger als 1 Jahr", "More than 1 year"),
]


KNEE_BLOCKS = [
    block(
        "A",
        "Ihr Knieproblem",
        "Your knee problem",
        1,
        [
            question(
                "A1",
                "Um welches Knie geht es heute?",
                "Which knee is this about today?",
                "single",
                1,
                [
                    option("Rechts", "Right"),
                    option("Links", "Left"),
                    option("Beide", "Both"),
                ],
            ),
            question(
                "A2",
                "Haben Sie aktuell Schmerzen in diesem Knie?",
                "Do you currently have pain in this knee?",
                "single",
                2,
                YES_NO,
            ),
            question(
                "A3",
                "Seit wann haben Sie diese Knieschmerzen?",
                "How long have you had this knee pain?",
                "single",
                3,
                DURATION_OPTIONS,
            ),
            question(
                "A4",
                "Wie stark sind Ihre Knieschmerzen im Durchschnitt?",
                "How strong is your knee pain on average?",
                "slider",
                4,
                minimum=0,
                maximum=10,
            ),
            question(
                "A5",
                "Wann treten die Schmerzen vor allem auf?",
                "When does the pain mainly occur?",
                "multiple",
                5,
                [
                    option("Beim Gehen oder Belasten", "When walking or bearing weight"),
                    option("Beim Treppensteigen", "When climbing stairs"),
                    option("In Ruhe", "At rest"),
                    option("Nachts", "At night"),
                    option("Eigentlich immer", "Almost always"),
                ],
            ),
            question(
                "A6",
                "Was beschreibt Ihre Beschwerden am besten?",
                "What best describes your symptoms?",
                "multiple",
                6,
                [
                    option("Schmerz", "Pain"),
                    option("Steifigkeit", "Stiffness"),
                    option("Unsicherheit im Knie", "Uncertainty in the knee"),
                    option("Das Knie knickt weg", "The knee gives way"),
                    option(
                        "Knie lässt sich nicht richtig beugen oder strecken",
                        "The knee cannot be bent or straightened properly",
                    ),
                    option("Schwellung", "Swelling"),
                    option("Etwas anderes", "Something else"),
                ],
            ),
            question(
                "A7",
                "Was ist heute der Hauptgrund für Ihren Termin?",
                "What is the main reason for your appointment today?",
                "single",
                7,
                [
                    option("Ursache klären", "Clarify the cause"),
                    option("Behandlung besprechen", "Discuss treatment"),
                    option(
                        "Prüfen ob eine Operation sinnvoll sein könnte",
                        "Check whether surgery could make sense",
                    ),
                    option("Zweitmeinung", "Second opinion"),
                    option("Sonstiges", "Other"),
                ],
            ),
        ],
    ),
    block(
        "B",
        "Auswirkungen im Alltag",
        "Impact on daily life",
        2,
        [
            question(
                "B1",
                "Wie sehr schränken Ihre Kniebeschwerden Ihren Alltag insgesamt ein?",
                "Overall, how much do your knee symptoms limit your everyday life?",
                "slider",
                1,
                minimum=0,
                maximum=10,
            ),
            question(
                "B2",
                "Seit wann schränken Ihre Kniebeschwerden Ihren Alltag deutlich ein?",
                "How long have your knee symptoms clearly limited your daily life?",
                "single",
                2,
                DURATION_OPTIONS,
            ),
            question(
                "B3",
                "Bei welchen Aktivitäten haben Sie wegen Ihres Knies Schwierigkeiten?",
                "Which activities are difficult because of your knee?",
                "multiple",
                3,
                [
                    option("Gehen", "Walking"),
                    option("Längeres Stehen", "Standing for longer periods"),
                    option("Treppensteigen", "Climbing stairs"),
                    option("Hinsetzen oder Aufstehen", "Sitting down or standing up"),
                    option("Knien", "Kneeling"),
                    option("Körperpflege", "Personal care"),
                    option("Haushalt", "Household tasks"),
                    option("Arbeit oder Beruf", "Work or job"),
                    option("Sport oder Hobbys", "Sports or hobbies"),
                    option("Bus, Bahn oder Auto nutzen", "Using bus, train or car"),
                    option("Soziale Aktivitäten", "Social activities"),
                    option("Keine besonderen Schwierigkeiten", "No particular difficulties"),
                ],
            ),
            question(
                "B4",
                "Wie weit können Sie ungefähr am Stück gehen, bevor das Knie Sie deutlich einschränkt?",
                "Roughly how far can you walk at once before your knee clearly limits you?",
                "single",
                4,
                [
                    option("Mehr als 1 Kilometer", "More than 1 kilometer"),
                    option("500 Meter bis 1 Kilometer", "500 meters to 1 kilometer"),
                    option("100 bis 500 Meter", "100 to 500 meters"),
                    option("Weniger als 100 Meter", "Less than 100 meters"),
                    option("Kaum möglich", "Hardly possible"),
                ],
            ),
            question(
                "B5",
                "Fühlt sich Ihr Knie manchmal instabil an oder knickt weg?",
                "Does your knee sometimes feel unstable or give way?",
                "single",
                5,
                [
                    option("Nie", "Never"),
                    option("Selten", "Rarely"),
                    option("Manchmal", "Sometimes"),
                    option("Häufig", "Often"),
                ],
            ),
            question(
                "B6",
                "Haben Sie das Gefühl, dass Sie Ihr Knie nicht mehr richtig beugen oder strecken können?",
                "Do you feel that you can no longer bend or straighten your knee properly?",
                "single",
                6,
                YES_NO_UNKNOWN,
            ),
            question(
                "B7",
                "Haben Sie das Gefühl, dass Ihr Bein oder Knie schief steht?",
                "Do you feel that your leg or knee is misaligned?",
                "single",
                7,
                YES_NO_UNKNOWN,
            ),
            question(
                "B8",
                "Haben Sie das Gefühl, dass Ihr betroffenes Bein schwächer geworden ist?",
                "Do you feel that the affected leg has become weaker?",
                "single",
                8,
                YES_NO_UNKNOWN,
            ),
            question(
                "B9",
                "Brauchen Sie wegen Ihres Knies im Alltag Hilfe von anderen Personen?",
                "Do you need help from other people in daily life because of your knee?",
                "single",
                9,
                [
                    option("Nein", "No"),
                    option("Selten", "Rarely"),
                    option("Regelmäßig", "Regularly"),
                    option("Fast immer", "Almost always"),
                ],
            ),
            question(
                "B10",
                "Wie sehr leiden Sie persönlich unter Ihren Kniebeschwerden?",
                "How much do you personally suffer from your knee symptoms?",
                "slider",
                10,
                minimum=0,
                maximum=10,
            ),
        ],
    ),
    block(
        "C",
        "Bisherige Behandlung",
        "Previous treatment",
        3,
        [
            question(
                "C1",
                "Wurden Ihre Kniebeschwerden schon behandelt?",
                "Have your knee symptoms already been treated?",
                "single",
                1,
                YES_NO,
            ),
            question(
                "C2",
                "Welche Behandlungen haben Sie bisher erhalten?",
                "Which treatments have you received so far?",
                "multiple",
                2,
                [
                    option("Schmerzmittel", "Pain medication"),
                    option("Physiotherapie oder Krankengymnastik", "Physiotherapy"),
                    option("Übungen zu Hause", "Exercises at home"),
                    option("Spritzen ins Knie", "Injections into the knee"),
                    option("Bandage oder Hilfsmittel", "Brace or assistive device"),
                    option("Einlagen oder spezielle Schuhe", "Insoles or special shoes"),
                    option("Empfehlung zur Gewichtsabnahme", "Recommendation to lose weight"),
                    option("Sonstige Behandlung", "Other treatment"),
                    option("Keine", "None"),
                ],
            ),
            question(
                "C3",
                "Seit wie lange werden Ihre Kniebeschwerden schon behandelt?",
                "How long have your knee symptoms been treated?",
                "single",
                3,
                DURATION_OPTIONS,
            ),
            question(
                "C4",
                "Haben die bisherigen Behandlungen Ihre Beschwerden gebessert?",
                "Have previous treatments improved your symptoms?",
                "single",
                4,
                [
                    option("Ja, deutlich", "Yes, clearly"),
                    option("Ja, etwas", "Yes, somewhat"),
                    option("Nein, kaum oder gar nicht", "No, hardly or not at all"),
                ],
            ),
            question(
                "C5",
                "Haben Sie in den letzten Monaten regelmäßig Physiotherapie oder Übungen gemacht?",
                "Have you regularly done physiotherapy or exercises in recent months?",
                "single",
                5,
                [
                    option("Ja", "Yes"),
                    option("Nein", "No"),
                    option("Teilweise", "Partly"),
                ],
            ),
            question(
                "C6",
                "Wurde Ihnen von einem Arzt schon einmal gesagt, dass Sie zunächst weiter ohne Operation behandelt werden sollen?",
                "Has a doctor ever told you that you should initially continue treatment without surgery?",
                "single",
                6,
                YES_NO_UNKNOWN,
            ),
        ],
    ),
    block(
        "D",
        "Vorbefunde und ärztliche Aussagen",
        "Previous findings and medical statements",
        4,
        [
            question(
                "D1",
                "Wurde von Ihrem Knie schon einmal ein Röntgenbild gemacht?",
                "Has an X-ray of your knee ever been taken?",
                "single",
                1,
                YES_NO_IDK,
            ),
            question(
                "D2",
                "Wurde Ihnen gesagt, dass in Ihrem Knie ein deutlicher Gelenkverschleiß oder Arthrose vorliegt?",
                "Have you been told that there is significant joint wear or osteoarthritis in your knee?",
                "single",
                2,
                YES_NO_IDK,
            ),
            question(
                "D3",
                "Wurde Ihnen gesagt, dass der Knorpel oder die Gelenkfläche im Knie deutlich geschädigt ist?",
                "Have you been told that the cartilage or joint surface in your knee is significantly damaged?",
                "single",
                3,
                YES_NO_IDK,
            ),
            question(
                "D4",
                "Wurde Ihnen gesagt, dass am Knochen oder an der Gelenkfläche ein Schaden vorliegt?",
                "Have you been told that there is damage to the bone or joint surface?",
                "single",
                4,
                YES_NO_IDK,
            ),
            question(
                "D5",
                "Haben Sie Arztbriefe, Röntgenbilder oder Befunde zu Ihrem Knie?",
                "Do you have medical letters, X-rays or findings for your knee?",
                "single",
                5,
                [
                    option("Ja, ich habe Unterlagen", "Yes, I have documents"),
                    option("Teilweise", "Partly"),
                    option("Nein", "No"),
                ],
            ),
            question(
                "D6",
                "Wurde Ihnen bereits einmal eine Knieprothese empfohlen?",
                "Have you ever been recommended a knee replacement?",
                "single",
                6,
                YES_NO_IDK,
            ),
        ],
    ),
    block(
        "E",
        "Gesundheit und Risiken",
        "Health and risks",
        5,
        [
            question(
                "E0",
                "Wie alt sind Sie?",
                "How old are you?",
                "number",
                1,
                pii_category="age",
                include_in_ai=True,
            ),
            question(
                "E1",
                "Haben Sie aktuell eine Entzündung oder Infektion im Knie, die gerade behandelt wird?",
                "Do you currently have inflammation or infection in the knee that is being treated?",
                "single",
                2,
                YES_NO_IDK,
            ),
            question(
                "E2",
                "Hatten Sie in den letzten 3 Monaten einen Herzinfarkt, Schlaganfall oder ein anderes schweres Herz-Kreislauf-Ereignis?",
                "Have you had a heart attack, stroke or another severe cardiovascular event in the last 3 months?",
                "single",
                3,
                YES_NO_IDK,
            ),
            question(
                "E3",
                "Haben Sie Diabetes oder erhöhte Blutzuckerwerte?",
                "Do you have diabetes or elevated blood sugar levels?",
                "single",
                4,
                YES_NO_IDK,
            ),
            question(
                "E4",
                "Wie groß sind Sie und wie viel wiegen Sie ungefähr?",
                "How tall are you and approximately how much do you weigh?",
                "number_pair",
                5,
            ),
            question(
                "E5",
                "Rauchen Sie aktuell?",
                "Do you currently smoke?",
                "single",
                6,
                [
                    option("Ja", "Yes"),
                    option("Nein", "No"),
                    option("Ich habe aufgehört", "I have stopped"),
                ],
            ),
            question(
                "E6",
                "Haben Sie in letzter Zeit eine Kortison-Spritze direkt ins Knie bekommen?",
                "Have you recently received a cortisone injection directly into the knee?",
                "single",
                7,
                [
                    option("Nein", "No"),
                    option("Ja, vor weniger als 6 Wochen", "Yes, less than 6 weeks ago"),
                    option("Ja, vor 6 Wochen bis 3 Monaten", "Yes, 6 weeks to 3 months ago"),
                    option("Ja, vor mehr als 3 Monaten", "Yes, more than 3 months ago"),
                    option("Weiß ich nicht", "I do not know"),
                ],
            ),
            question(
                "E7",
                "Wurde bei Ihnen schon einmal eine Blutarmut bzw. Anämie festgestellt?",
                "Have you ever been diagnosed with anemia?",
                "single",
                8,
                YES_NO_IDK,
            ),
            question(
                "E8",
                "Werden Sie aktuell wegen einer psychischen Erkrankung behandelt?",
                "Are you currently being treated for a mental health condition?",
                "single",
                9,
                [
                    option("Ja", "Yes"),
                    option("Nein", "No"),
                    option("Möchte ich nicht angeben", "I prefer not to say"),
                ],
            ),
            question(
                "E9",
                "Haben Sie eine rheumatische Erkrankung?",
                "Do you have a rheumatic disease?",
                "single",
                10,
                YES_NO_IDK,
            ),
            question(
                "E10",
                "Nehmen Sie aktuell Kortison als Tabletten ein?",
                "Are you currently taking cortisone tablets?",
                "single",
                11,
                YES_NO_IDK,
            ),
            question(
                "E11",
                "Haben Sie eine andere schwere Erkrankung, wegen der Sie regelmäßig in ärztlicher Behandlung sind?",
                "Do you have another serious condition for which you receive regular medical care?",
                "single",
                12,
                [
                    option("Nein", "No"),
                    option("Ja, Herz", "Yes, heart"),
                    option("Ja, Lunge", "Yes, lungs"),
                    option("Ja, Krebs", "Yes, cancer"),
                    option("Ja, etwas anderes", "Yes, something else"),
                ],
            ),
            question(
                "E12",
                "Trinken Sie regelmäßig viel Alkohol oder haben Sie aktuell Probleme mit Alkohol oder anderen Suchtmitteln?",
                "Do you regularly drink a lot of alcohol or currently have problems with alcohol or other substances?",
                "single",
                13,
                [
                    option("Ja", "Yes"),
                    option("Nein", "No"),
                    option("Möchte ich nicht angeben", "I prefer not to say"),
                ],
            ),
            question(
                "E13",
                "Gab es früher schon einmal eine Infektion in diesem Knie?",
                "Has there ever been an infection in this knee before?",
                "single",
                14,
                YES_NO_IDK,
            ),
        ],
    ),
    block(
        "F",
        "Ziele, Erwartungen und Ergänzungen",
        "Goals, expectations and additions",
        6,
        [
            question(
                "F1",
                "Was möchten Sie durch die Behandlung Ihres Knies am meisten erreichen?",
                "What would you most like to achieve through treatment of your knee?",
                "multiple",
                1,
                [
                    option("Weniger Schmerzen", "Less pain"),
                    option("Besser gehen können", "Being able to walk better"),
                    option("Wieder besser Treppen steigen", "Climbing stairs better again"),
                    option("Wieder besser schlafen", "Sleeping better again"),
                    option("Im Alltag unabhängiger sein", "Being more independent in daily life"),
                    option("Wieder arbeiten können", "Being able to work again"),
                    option("Wieder Sport oder Hobbys ausüben", "Doing sports or hobbies again"),
                    option("Sonstiges", "Other"),
                ],
            ),
            question(
                "F2",
                "Welche Aktivität möchten Sie am liebsten wieder besser machen können?",
                "Which activity would you most like to be able to do better again?",
                "text",
                2,
            ),
            question(
                "F3",
                "Was wäre für Sie persönlich ein gutes Ergebnis der Behandlung?",
                "What would personally be a good treatment outcome for you?",
                "text",
                3,
            ),
            question(
                "F4",
                "Wurde mit Ihnen schon einmal über eine mögliche Knieoperation gesprochen?",
                "Has a possible knee operation ever been discussed with you?",
                "single",
                4,
                YES_NO,
            ),
            question(
                "F5",
                "Haben Sie Sorgen oder Fragen zu einer möglichen Operation?",
                "Do you have concerns or questions about a possible operation?",
                "single",
                5,
                [
                    option("Ja", "Yes"),
                    option("Nein", "No"),
                    option("Vielleicht", "Maybe"),
                ],
            ),
            question(
                "F6",
                "Gibt es noch etwas, das Ihr Arzt über Ihr Knie wissen sollte?",
                "Is there anything else your doctor should know about your knee?",
                "text",
                6,
            ),
        ],
    ),
]


DE_REPLACEMENTS = [
    ("Das Knie knickt weg", "Das Bein gibt nach"),
    (
        "Knie lässt sich nicht richtig beugen oder strecken",
        "Hüfte lässt sich nicht richtig bewegen",
    ),
    ("diesem Knie", "dieser Hüfte"),
    ("dieses Knie", "diese Hüfte"),
    ("Ihres Knies", "Ihrer Hüfte"),
    ("Ihrem Knie", "Ihrer Hüfte"),
    ("Ihr Knie", "Ihre Hüfte"),
    ("ins Knie", "in die Hüfte"),
    ("im Knie", "in der Hüfte"),
    ("am Knie", "an der Hüfte"),
    ("zum Knie", "zur Hüfte"),
    ("vom Knie", "von der Hüfte"),
    ("Knie-TEP", "Hüft-TEP"),
    ("Knieproblem", "Hüftproblem"),
    ("Knieschmerzen", "Hüftschmerzen"),
    ("Kniebeschwerden", "Hüftbeschwerden"),
    ("Knieprothese", "Hüftprothese"),
    ("Knieoperation", "Hüftoperation"),
    ("Knies", "Hüfte"),
    ("Knie", "Hüfte"),
]

EN_REPLACEMENTS = [
    ("The knee gives way", "The leg gives way"),
    (
        "The knee cannot be bent or straightened properly",
        "The hip cannot be moved properly",
    ),
    ("Knee TEP", "Hip TEP"),
    ("knee replacement", "hip replacement"),
    ("knee problem", "hip problem"),
    ("knee pain", "hip pain"),
    ("knee symptoms", "hip symptoms"),
    ("knee operation", "hip operation"),
    ("Knee", "Hip"),
    ("knee", "hip"),
]


def replace_text(value: str, replacements: list[tuple[str, str]]) -> str:
    next_value = value

    for old, new in replacements:
        next_value = next_value.replace(old, new)

    return next_value


def to_hip_text(localized: dict[str, str]) -> dict[str, str]:
    return {
        "de": replace_text(localized.get("de", ""), DE_REPLACEMENTS),
        "en": replace_text(localized.get("en", ""), EN_REPLACEMENTS),
    }


def make_hip_blocks() -> list[dict]:
    hip_blocks = deepcopy(KNEE_BLOCKS)

    for current_block in hip_blocks:
        current_block["title"] = to_hip_text(current_block["title"])

        for current_question in current_block["questions"]:
            current_question["block_title"] = to_hip_text(current_question["block_title"])
            current_question["labels"] = to_hip_text(current_question["labels"])
            current_question["help_text"] = to_hip_text(current_question.get("help_text", {}))

            for current_option in current_question.get("options", []):
                current_option["value"] = replace_text(current_option["value"], DE_REPLACEMENTS)
                current_option["labels"] = to_hip_text(current_option["labels"])

    return hip_blocks


DEFAULT_QUESTIONNAIRES = [
    {
        "indication": "knee_tep",
        "slug": "knie-tep",
        "labels": {
            "de": "Knie-TEP Fragebogen",
            "en": "Knee replacement questionnaire",
        },
        "description": {
            "de": "Fragen zu Kniebeschwerden und möglicher Knie-TEP.",
            "en": "Questions about knee symptoms and possible knee replacement.",
        },
        "image_path": "/static/images/knee.png",
        "image_alt": {
            "de": "Knie Illustration",
            "en": "Knee illustration",
        },
        "version": 2,
        "is_published": True,
        "blocks": KNEE_BLOCKS,
    },
    {
        "indication": "hip_tep",
        "slug": "hueft-tep",
        "labels": {
            "de": "Hüft-TEP Fragebogen",
            "en": "Hip replacement questionnaire",
        },
        "description": {
            "de": "Fragen zu Hüftbeschwerden und möglicher Hüft-TEP.",
            "en": "Questions about hip symptoms and possible hip replacement.",
        },
        "image_path": "/static/images/hip.png",
        "image_alt": {
            "de": "Hüfte Illustration",
            "en": "Hip illustration",
        },
        "version": 2,
        "is_published": True,
        "blocks": make_hip_blocks(),
    },
]