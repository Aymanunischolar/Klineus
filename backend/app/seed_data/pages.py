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
            "Webbasierter Prototyp für strukturierte TEP-Fragebögen und ärztlich geprüfte Dokumentationsentwürfe.",
            "Web-based prototype for structured replacement questionnaires and physician-reviewed documentation drafts.",
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
                "eyebrow": lt(
                    "Orthopädische Dokumentationsunterstützung",
                    "Orthopedic documentation support",
                ),
                "title": lt("Klineus", "Klineus"),
                "subtitle": lt(
                    "Strukturierte Fragebögen und ärztlich geprüfte Dokumentationsentwürfe für Knie- und Hüft-TEP.",
                    "Structured questionnaires and physician-reviewed documentation drafts for knee and hip replacement.",
                ),
                "body": lt(
                    "Klineus unterstützt die leitlinienbasierte Erhebung, Einordnung und Dokumentation patientenbezogener Informationen vor dem Arztkontakt.",
                    "Klineus supports guideline-based collection, structuring and documentation of patient information before the consultation.",
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
                    link(
                        "Arzt-Dashboard öffnen",
                        "Open doctor dashboard",
                        "/doctor/login",
                        "secondary",
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
                    "Von der Patientenantwort zur ärztlich prüfbaren Fallübersicht.",
                    "From patient answers to a physician-reviewable case overview.",
                ),
                "subtitle": {},
                "body": lt(
                    "Patientendaten werden strukturiert erhoben, medizinisch eingeordnet und für die ärztliche Prüfung vorbereitet.",
                    "Patient data is collected in a structured way, medically organized and prepared for physician review.",
                ),
                "image_path": None,
                "image_alt": {},
                "links": [],
                "items": [
                    item(
                        "patient-intake",
                        "Patientenaufnahme",
                        "Patient intake",
                        "Patientinnen und Patienten beantworten vor dem Termin den passenden Knie- oder Hüftfragebogen.",
                        "Patients answer the matching knee or hip questionnaire before the appointment.",
                        icon="01",
                    ),
                    item(
                        "structured-review",
                        "Strukturierte Prüfung",
                        "Structured review",
                        "Klineus ordnet Angaben in Blöcke, erkennt Risiken und markiert offene Punkte.",
                        "Klineus organizes answers into blocks, detects risks and highlights open points.",
                        icon="02",
                    ),
                    item(
                        "doctor-documentation",
                        "Ärztliche Dokumentation",
                        "Medical documentation",
                        "Ärztinnen und Ärzte prüfen die Übersicht und können einen Dokumentationsentwurf generieren.",
                        "Physicians review the overview and can generate a documentation draft.",
                        icon="03",
                    ),
                ],
                "settings": {},
            },
            {
                "id": "cta",
                "type": "cta",
                "order": 3,
                "eyebrow": lt("Pilotierung", "Pilot"),
                "title": lt(
                    "Klineus wird für den klinischen Einsatz weiterentwickelt.",
                    "Klineus is being developed for clinical use.",
                ),
                "subtitle": {},
                "body": lt(
                    "Wir suchen klinische Partner, Feedbackgeber und Einrichtungen, die strukturierte Indikationsprozesse verbessern möchten.",
                    "We are looking for clinical partners, feedback providers and institutions that want to improve structured indication workflows.",
                ),
                "image_path": None,
                "image_alt": {},
                "links": [
                    link("Kontakt aufnehmen", "Contact us", "/contact", "primary"),
                ],
                "items": [],
                "settings": {},
            },
        ],
    },

    {
        "slug": "product",
        "title": lt("Produkt", "Product"),
        "description": lt(
            "KI-gestützte Dokumentationsunterstützung für Orthopädie und Unfallchirurgie.",
            "AI-supported documentation support for orthopedics and trauma surgery.",
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
                "eyebrow": lt("Produkt", "Product"),
                "title": lt(
                    "Dokumentationsunterstützung für Knie- und Hüft-TEP.",
                    "Documentation support for knee and hip replacement.",
                ),
                "subtitle": lt(
                    "Ein System für Patientenaufnahme, ärztliche Prüfung und Dokumentationsentwurf.",
                    "One system for patient intake, physician review and documentation drafting.",
                ),
                "body": lt(
                    "Klineus verbindet strukturierte Fragebögen, ein Arzt-Dashboard und KI-generierte Dokumentationsentwürfe.",
                    "Klineus connects structured questionnaires, a doctor dashboard and AI-generated documentation drafts.",
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
                    link(
                        "Arzt-Dashboard öffnen",
                        "Open doctor dashboard",
                        "/doctor/login",
                        "secondary",
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
                        "Patienten wählen den passenden Fragebogen und geben Beschwerden, Alltagseinschränkungen, Vorbehandlungen und Risiken an.",
                        "Patients select the matching questionnaire and provide symptoms, daily limitations, previous treatments and risks.",
                        icon="questionnaire",
                    ),
                    item(
                        "doctor-dashboard",
                        "Arzt-Dashboard",
                        "Doctor dashboard",
                        "Fälle werden nach Knie und Hüfte getrennt und können ärztlich geprüft werden.",
                        "Cases are separated by knee and hip and can be reviewed by physicians.",
                        icon="dashboard",
                    ),
                    item(
                        "ai-draft",
                        "KI-Dokumentationsentwurf",
                        "AI documentation draft",
                        "Die KI erstellt nur einen Entwurf. Die ärztliche Prüfung bleibt zwingend erforderlich.",
                        "AI creates a draft only. Physician review remains mandatory.",
                        icon="ai",
                    ),
                ],
                "settings": {},
            },
        ],
    },

    {
        "slug": "team",
        "title": lt("Team", "Team"),
        "description": lt(
            "Ein komplementäres Team aus Business, Medizin und Technologie.",
            "A complementary team across business, medicine and technology.",
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
                "eyebrow": lt("Team", "Team"),
                "title": lt(
                    "Ein Team für klinisch sinnvolle Automatisierung.",
                    "A team for clinically meaningful automation.",
                ),
                "subtitle": lt(
                    "Klineus entsteht aus der Verbindung von medizinischem Bedarf, Produktlogik und KI-gestützter Prozessautomatisierung.",
                    "Klineus combines medical needs, product logic and AI-supported process automation.",
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
                        "KI und Produktlogik",
                        "AI and product logic",
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
                    link("E-Mail senden", "Send email", "mailto:contact@klineus.de", "primary"),
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
            "Prototyp-Bedingungen, Datenschutz und klinische Grenzen.",
            "Prototype terms, privacy and clinical boundaries.",
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
                    "Prototyp-Bedingungen, Datenschutz und klinische Grenzen.",
                    "Prototype terms, privacy and clinical boundaries.",
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
                "eyebrow": lt("Bedingungen", "Terms"),
                "title": lt("Nutzungsbedingungen", "Terms of use"),
                "subtitle": {},
                "body": {},
                "image_path": None,
                "image_alt": {},
                "links": [],
                "items": [
                    item(
                        "prototype-status",
                        "Prototyp-Status",
                        "Prototype status",
                        "Klineus ist derzeit ein Prototyp für Demonstration, Validierung und interne Tests.",
                        "Klineus is currently a prototype for demonstration, validation and internal testing.",
                        icon="01",
                    ),
                    item(
                        "no-medical-decision",
                        "Keine medizinische Entscheidungsfindung",
                        "No medical decision-making",
                        "Klineus stellt keine Diagnosen, trifft keine endgültigen Behandlungsentscheidungen und gibt keine Operationsempfehlungen.",
                        "Klineus does not provide diagnoses, final treatment decisions or surgery recommendations.",
                        icon="02",
                    ),
                    item(
                        "ai-drafts",
                        "KI-generierte Entwürfe",
                        "AI-generated drafts",
                        "KI-generierte Texte sind ausschließlich Dokumentationsentwürfe und müssen ärztlich geprüft werden.",
                        "AI-generated text is documentation draft only and must be reviewed by a physician.",
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
                "title": lt("Datenschutz-Hinweise", "Privacy notes"),
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
                        "Patientenname und Versicherungsnummer dienen der ärztlichen Zuordnung. Direkte Identifikatoren sollen nicht an KI-Prompts übergeben werden.",
                        "Patient name and insurance ID are used for doctor-side identification. Direct identifiers should not be passed into AI prompts.",
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