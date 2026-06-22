def lt(de: str, en: str) -> dict[str, str]:
    return {
        "de": de,
        "en": en,
    }


def link(de: str, en: str, href: str, variant: str = "secondary") -> dict:
    return {
        "label": lt(de, en),
        "href": href,
        "variant": variant,
    }


def item(
    item_id: str,
    title_de: str,
    title_en: str,
    text_de: str,
    text_en: str,
    icon: str | None = None,
    image_path: str | None = None,
    href: str | None = None,
    meta: dict | None = None,
) -> dict:
    return {
        "id": item_id,
        "title": lt(title_de, title_en),
        "text": lt(text_de, text_en),
        "eyebrow": {},
        "image_path": image_path,
        "image_alt": {},
        "icon": icon,
        "href": href,
        "meta": meta or {},
    }


DEFAULT_CONTENT_PAGES = [
    {
        "slug": "home",
        "title": lt("Klineus", "Klineus"),
        "description": lt(
            "Strukturierte Fragebögen und ärztlich prüfbare Dokumentationsentwürfe für Knie- und Hüft-TEP.",
            "Structured questionnaires and physician-reviewable documentation drafts for knee and hip replacement.",
        ),
        "is_published": True,
        "seo": {
            "title": lt("Klineus", "Klineus"),
        },
        "sections": [
            {
                "id": "hero",
                "type": "hero",
                "order": 1,
                "eyebrow": lt("Klineus", "Klineus"),
                "title": lt(
                    "Strukturierte Vorbereitung für Knie- und Hüft-TEP.",
                    "Structured preparation for knee and hip replacement.",
                ),
                "subtitle": lt(
                    "Patienten beantworten vor dem Termin gezielte Fragen. Ärztinnen und Ärzte erhalten eine geordnete Fallübersicht.",
                    "Patients answer focused questions before the appointment. Physicians receive a structured case overview.",
                ),
                "body": lt(
                    "Klineus unterstützt die Erhebung, Einordnung und Dokumentation patientenbezogener Informationen vor dem Arztkontakt.",
                    "Klineus supports the collection, structuring and documentation of patient information before the consultation.",
                ),
                "image_path": "/static/images/hero-medical.png",
                "image_alt": lt(
                    "Digitale medizinische Oberfläche",
                    "Digital medical interface",
                ),
                "links": [
                    link(
                        "Patientenfragebogen starten",
                        "Start patient questionnaire",
                        "/patient/start",
                        "primary",
                    ),
                ],
                "items": [],
                "settings": {},
            },
            {
                "id": "workflow",
                "type": "cards",
                "order": 2,
                "eyebrow": lt("Ablauf", "Workflow"),
                "title": lt(
                    "Vom Fragebogen zur prüfbaren Fallübersicht.",
                    "From questionnaire to reviewable case overview.",
                ),
                "subtitle": {},
                "body": lt(
                    "Patientenangaben werden strukturiert erfasst, in einer Übersicht dargestellt und für die ärztliche Prüfung vorbereitet.",
                    "Patient information is collected in a structured way, shown in an overview and prepared for physician review.",
                ),
                "image_path": None,
                "image_alt": {},
                "links": [],
                "items": [
                    item(
                        "patient-intake",
                        "Patientenaufnahme",
                        "Patient intake",
                        "Patientinnen und Patienten beantworten den passenden Knie- oder Hüftfragebogen.",
                        "Patients answer the matching knee or hip questionnaire.",
                        icon="01",
                    ),
                    item(
                        "structured-review",
                        "Strukturierte Übersicht",
                        "Structured overview",
                        "Klineus ordnet Antworten, markiert offene Punkte und zeigt relevante Hinweise.",
                        "Klineus organizes answers, highlights open points and shows relevant notes.",
                        icon="02",
                    ),
                    item(
                        "doctor-documentation",
                        "Ärztliche Prüfung",
                        "Physician review",
                        "Ärztinnen und Ärzte prüfen die Angaben und können einen Dokumentationsentwurf erstellen.",
                        "Physicians review the answers and can create a documentation draft.",
                        icon="03",
                    ),
                ],
                "settings": {},
            },
        ],
    },
    {
        "slug": "product",
        "title": lt("Unser Produkt", "Our Product"),
        "description": lt(
            "Klineus verbindet Patientenfragebogen, Arzt-Dashboard und Dokumentationsentwurf.",
            "Klineus connects patient questionnaire, doctor dashboard and documentation draft.",
        ),
        "is_published": True,
        "seo": {
            "title": lt("Klineus Produkt", "Klineus product"),
        },
        "sections": [
            {
                "id": "hero",
                "type": "hero",
                "order": 1,
                "eyebrow": lt("Unser Produkt", "Our Product"),
                "title": lt(
                    "Ein strukturierter Prozess für Knie- und Hüft-TEP.",
                    "A structured process for knee and hip replacement.",
                ),
                "subtitle": lt(
                    "Ein System für Patientenaufnahme, ärztliche Prüfung und Dokumentationsentwurf.",
                    "One system for patient intake, physician review and documentation drafting.",
                ),
                "body": lt(
                    "Klineus sammelt medizinisch relevante Antworten vor dem Termin und stellt sie dem Arzt strukturiert bereit.",
                    "Klineus collects medically relevant answers before the appointment and presents them to the physician in a structured way.",
                ),
                "image_path": "/static/images/hero-medical.png",
                "image_alt": lt(
                    "Klineus Produktansicht",
                    "Klineus product view",
                ),
                "links": [
                    link(
                        "Patientenfragebogen testen",
                        "Try patient questionnaire",
                        "/patient/start",
                        "primary",
                    ),
                ],
                "items": [],
                "settings": {},
            },
            {
                "id": "features",
                "type": "cards",
                "order": 2,
                "eyebrow": lt("Kernfunktionen", "Core features"),
                "title": lt(
                    "Was Klineus im Prototyp leistet.",
                    "What Klineus provides in the prototype.",
                ),
                "subtitle": {},
                "body": {},
                "image_path": None,
                "image_alt": {},
                "links": [],
                "items": [
                    item(
                        "patient-questionnaires",
                        "Knie- und Hüftfragebogen",
                        "Knee and hip questionnaires",
                        "Patienten wählen den passenden Fragebogen und beantworten Fragen zu Beschwerden, Alltag, Vorbehandlung und Risiken.",
                        "Patients select the matching questionnaire and answer questions about symptoms, daily life, previous treatment and risks.",
                        icon="questionnaire",
                    ),
                    item(
                        "doctor-dashboard",
                        "Arzt-Dashboard",
                        "Doctor dashboard",
                        "Fälle werden übersichtlich dargestellt und können ärztlich geprüft werden.",
                        "Cases are shown clearly and can be reviewed by physicians.",
                        icon="dashboard",
                    ),
                    item(
                        "ai-draft",
                        "Dokumentationsentwurf",
                        "Documentation draft",
                        "Der generierte Text ist nur ein Entwurf und muss ärztlich geprüft, korrigiert und freigegeben werden.",
                        "The generated text is only a draft and must be reviewed, corrected and approved by a physician.",
                        icon="ai",
                    ),
                ],
                "settings": {},
            },
        ],
    },
    {
        "slug": "team",
        "title": lt("Über uns", "About Us"),
        "description": lt(
            "Ein Team aus Business, Medizin und Technologie.",
            "A team across business, medicine and technology.",
        ),
        "is_published": True,
        "seo": {
            "title": lt("Klineus Team", "Klineus team"),
        },
        "sections": [
            {
                "id": "hero",
                "type": "hero",
                "order": 1,
                "eyebrow": lt("Über uns", "About Us"),
                "title": lt(
                    "Klineus entsteht an der Schnittstelle von Medizin und Produktentwicklung.",
                    "Klineus is built at the intersection of medicine and product development.",
                ),
                "subtitle": lt(
                    "Unser Ziel ist ein klarer, prüfbarer und klinisch sinnvoller Dokumentationsprozess.",
                    "Our goal is a clear, reviewable and clinically meaningful documentation process.",
                ),
                "body": {},
                "image_path": "/static/images/team.png",
                "image_alt": lt("Klineus Team", "Klineus team"),
                "links": [],
                "items": [],
                "settings": {},
            },
            {
                "id": "roles",
                "type": "cards",
                "order": 2,
                "eyebrow": lt("Kompetenzen", "Capabilities"),
                "title": lt(
                    "Business, Medizin und Technologie.",
                    "Business, medicine and technology.",
                ),
                "subtitle": {},
                "body": {},
                "image_path": None,
                "image_alt": {},
                "links": [],
                "items": [
                    item(
                        "business",
                        "Geschäftsmodell und Umsetzung",
                        "Business model and execution",
                        "Strategie, Vertrieb, Marketing und Finanzierung für ein skalierbares Health-Tech-Produkt.",
                        "Strategy, sales, marketing and finance for a scalable health-tech product.",
                        icon="business",
                    ),
                    item(
                        "medicine",
                        "Medizinische Expertise",
                        "Medical expertise",
                        "Übersetzung klinischer Kriterien in strukturierte Fragen und ärztlich prüfbare Ausgaben.",
                        "Translation of clinical criteria into structured questions and physician-reviewable outputs.",
                        icon="medicine",
                    ),
                    item(
                        "technology",
                        "Produktlogik und Automatisierung",
                        "Product logic and automation",
                        "Technische Umsetzung von Fragebogenlogik, Dashboard, Berichten und Admin-Bearbeitung.",
                        "Technical implementation of questionnaire logic, dashboard, reports and admin editing.",
                        icon="technology",
                    ),
                ],
                "settings": {},
            },
        ],
    },
    {
        "slug": "contact",
        "title": lt("Kontakt", "Contact"),
        "description": lt(
            "Kontaktieren Sie uns für Pilotierung, Partnerschaft oder Feedback.",
            "Contact us for pilots, partnership or feedback.",
        ),
        "is_published": True,
        "seo": {
            "title": lt("Kontakt", "Contact"),
        },
        "sections": [
            {
                "id": "hero",
                "type": "contact",
                "order": 1,
                "eyebrow": lt("Kontakt", "Contact"),
                "title": lt(
                    "Interessieren Sie sich für Klineus?",
                    "Interested in Klineus?",
                ),
                "subtitle": lt(
                    "Kontaktieren Sie uns für Pilotierung, Partnerschaft oder Feedback.",
                    "Contact us for pilots, partnership or feedback.",
                ),
                "body": lt(
                    "Dieses Kontaktformular ist im Prototyp noch nicht an einen E-Mail-Dienst angeschlossen.",
                    "This contact form is not yet connected to an email service in the prototype.",
                ),
                "image_path": None,
                "image_alt": {},
                "links": [
                    link(
                        "E-Mail senden",
                        "Send email",
                        "mailto:contact@klineus.de",
                        "primary",
                    ),
                ],
                "items": [
                    item(
                        "email",
                        "E-Mail",
                        "Email",
                        "contact@klineus.de",
                        "contact@klineus.de",
                        icon="email",
                        href="mailto:contact@klineus.de",
                    ),
                    item(
                        "location",
                        "Standort",
                        "Location",
                        "Deutschland",
                        "Germany",
                        icon="location",
                    ),
                    item(
                        "use-case",
                        "Anwendungsfall",
                        "Use case",
                        "Knie- und Hüft-TEP-Dokumentationsunterstützung",
                        "Knee and hip replacement documentation support",
                        icon="medical",
                    ),
                ],
                "settings": {
                    "show_contact_form": True,
                },
            },
        ],
    },
    {
        "slug": "legal",
        "title": lt("Rechtliches", "Legal"),
        "description": lt(
            "Impressum, Datenschutz und klinische Grenzen.",
            "Imprint, privacy and clinical boundaries.",
        ),
        "is_published": True,
        "seo": {
            "title": lt("Rechtliches", "Legal"),
        },
        "sections": [
            {
                "id": "hero",
                "type": "hero",
                "order": 1,
                "eyebrow": lt("Rechtliches", "Legal"),
                "title": lt(
                    "Impressum, Datenschutz und klinische Grenzen.",
                    "Imprint, privacy and clinical boundaries.",
                ),
                "subtitle": lt(
                    "Diese Inhalte sind Platzhalter und müssen vor produktivem Einsatz rechtlich geprüft werden.",
                    "These contents are placeholders and must be legally reviewed before production use.",
                ),
                "body": {},
                "image_path": None,
                "image_alt": {},
                "links": [],
                "items": [],
                "settings": {},
            },
            {
                "id": "terms",
                "type": "terms",
                "order": 2,
                "eyebrow": lt("Impressum", "Imprint"),
                "title": lt("Impressum", "Imprint"),
                "subtitle": {},
                "body": lt(
                    "Angaben gemäß geltendem Recht sind hier zu ergänzen.",
                    "Information required by applicable law should be added here.",
                ),
                "image_path": None,
                "image_alt": {},
                "links": [],
                "items": [
                    item(
                        "operator",
                        "Betreiber",
                        "Operator",
                        "Klineus",
                        "Klineus",
                        icon="01",
                    ),
                    item(
                        "contact",
                        "Kontakt",
                        "Contact",
                        "contact@klineus.de",
                        "contact@klineus.de",
                        icon="02",
                    ),
                    item(
                        "prototype-status",
                        "Prototyp-Status",
                        "Prototype status",
                        "Klineus ist derzeit ein Prototyp für Demonstration, Validierung und interne Tests.",
                        "Klineus is currently a prototype for demonstration, validation and internal testing.",
                        icon="03",
                    ),
                ],
                "settings": {},
            },
            {
                "id": "privacy",
                "type": "terms",
                "order": 3,
                "eyebrow": lt("Datenschutz", "Privacy"),
                "title": lt("Datenschutz", "Privacy"),
                "subtitle": {},
                "body": {},
                "image_path": None,
                "image_alt": {},
                "links": [],
                "items": [
                    item(
                        "doctor-identification",
                        "Ärztliche Zuordnung",
                        "Doctor-side identification",
                        "Patientenname und interne Fallinformationen dienen der ärztlichen Zuordnung. Direkte Identifikatoren sollen nicht an KI-Prompts übergeben werden.",
                        "Patient name and internal case information are used for doctor-side identification. Direct identifiers should not be passed into AI prompts.",
                        icon="privacy",
                    ),
                    item(
                        "production-review",
                        "Prüfung vor Produktivbetrieb",
                        "Review before production use",
                        "Vor produktivem Einsatz sind Datenschutz, IT-Sicherheit, MDR/AI-Act-Einordnung und klinische Validierung zu prüfen.",
                        "Before production use, privacy, IT security, MDR/AI Act classification and clinical validation must be reviewed.",
                        icon="review",
                    ),
                ],
                "settings": {},
            },
            {
                "id": "clinical-boundaries",
                "type": "terms",
                "order": 4,
                "eyebrow": lt("Klinische Grenzen", "Clinical boundaries"),
                "title": lt(
                    "Was Klineus nicht tut.",
                    "What Klineus does not do.",
                ),
                "subtitle": {},
                "body": lt(
                    "Klineus ersetzt keine ärztliche Beurteilung, keine Diagnostik, keine Therapieentscheidung und keine Dokumentationsverantwortung.",
                    "Klineus does not replace medical judgment, diagnosis, treatment decisions or documentation responsibility.",
                ),
                "image_path": None,
                "image_alt": {},
                "links": [],
                "items": [],
                "settings": {},
            },
        ],
    },
]