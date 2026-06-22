import { createContext, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "klineus_language";

function cleanGermanText(value) {
  return String(value || "")
    .replace(/^\s*Block\s+[A-Z]:\s*/i, "")
    .replaceAll("aerztliche", "ärztliche")
    .replaceAll("aerztlicher", "ärztlicher")
    .replaceAll("aerztlich", "ärztlich")
    .replaceAll("Aerztliche", "Ärztliche")
    .replaceAll("Aerztlicher", "Ärztlicher")
    .replaceAll("Aerztlich", "Ärztlich")
    .replaceAll("Pruefung", "Prüfung")
    .replaceAll("pruefung", "prüfung")
    .replaceAll("pruefen", "prüfen")
    .replaceAll("geprueft", "geprüft")
    .replaceAll("Kuerzliches", "Kürzliches")
    .replaceAll("kuerzliches", "kürzliches")
    .replaceAll("Kuerzliche", "Kürzliche")
    .replaceAll("kuerzliche", "kürzliche")
    .replaceAll("Huefte", "Hüfte")
    .replaceAll("Hueft", "Hüft")
    .replaceAll("fuer", "für")
    .replaceAll("moeglich", "möglich")
    .replaceAll("moegliche", "mögliche")
    .replaceAll("regelmaessig", "regelmäßig")
    .replaceAll("Regelmaessige", "Regelmäßige")
    .replaceAll("vollstaendig", "vollständig")
    .replaceAll("Vollstaendig", "Vollständig")
    .replaceAll("unvollstaendig", "unvollständig")
    .replaceAll("Einschraenkung", "Einschränkung")
    .replaceAll("einschraenkung", "einschränkung")
    .replaceAll("Alltagseinschraenkung", "Alltagseinschränkung")
    .replaceAll("Roentgen", "Röntgen")
    .replaceAll("Entzuendung", "Entzündung")
    .replaceAll("Klaerung", "Klärung")
    .replaceAll("klaeren", "klären")
    .replaceAll("Arztgespraech", "Arztgespräch")
    .replaceAll("Gespraech", "Gespräch")
    .replaceAll("Anaemie", "Anämie")
    .replaceAll("anaemie", "Anämie")
    .replaceAll("bezueglich", "bezüglich")
    .replaceAll("Fruehere", "Frühere")
    .replaceAll("fruehere", "frühere")
    .replaceAll("Gelenkverschleiss", "Gelenkverschleiß")
    .replaceAll("Aufklaerung", "Aufklärung")
    .trim();
}

const translations = {
  de: {
    languageName: "Deutsch",
    otherLanguageName: "English",
    toggleLabel: "Sprache",

    prototypePill: "Klineus",

    navProduct: "Unser Produkt",
    navTeam: "Über uns",
    navContact: "Kontakt",
    navLegal: "Rechtliches",

    quickLinks: "Menü",
    quickProductTitle: "Unser Produkt",
    quickProductText: "Erfahren Sie, was Klineus macht.",
    quickTeamTitle: "Über uns",
    quickTeamText: "Mehr über das Klineus Team.",
    quickContactTitle: "Kontakt",
    quickContactText: "Kontakt aufnehmen.",

    learnProduct: "Produkt ansehen",
    contactUs: "Kontakt aufnehmen",
    adminPanel: "Admin-Bereich",

    landingEyebrow: "Klineus",
    landingTitle: "Klineus",
    landingDescription:
      "Klineus unterstützt die strukturierte Erhebung und Aufbereitung medizinisch relevanter Patientenangaben vor dem Arztkontakt.",
    landingDisclaimer:
      "Klineus ersetzt keine Diagnose, keine Therapieentscheidung und keine ärztliche Prüfung.",

    homeCard1Title: "Strukturierte Erhebung",
    homeCard1Text:
      "Patientenangaben werden in einem klaren Ablauf gesammelt.",
    homeCard2Title: "Übersichtliche Aufbereitung",
    homeCard2Text:
      "Antworten werden für die ärztliche Prüfung geordnet dargestellt.",
    homeCard3Title: "Ärztliche Verantwortung",
    homeCard3Text:
      "Klineus unterstützt die Dokumentation, ersetzt aber keine ärztliche Entscheidung.",

    homeCtaEyebrow: "Klineus",
    homeCtaTitle: "Strukturierte Vorbereitung für medizinische Gespräche.",
    homeCtaText:
      "Klineus hilft dabei, patientenbezogene Informationen vor einem Termin geordnet aufzubereiten.",

    productPageEyebrow: "Unser Produkt",
    productPageTitle:
      "Klineus strukturiert medizinisch relevante Patientenangaben.",
    productPageIntro:
      "Klineus unterstützt Praxen und Kliniken dabei, patientenbezogene Informationen vor einem Termin geordnet zu erfassen, aufzubereiten und für die ärztliche Prüfung übersichtlich darzustellen.",

    workflowEyebrow: "Ablauf",
    workflowTitle: "Ein klarer Ablauf ohne Ersatz ärztlicher Verantwortung.",
    workflowIntro:
      "Klineus bereitet Patientenangaben strukturiert auf und macht wichtige oder unklare Punkte leichter erkennbar.",

    workflowStep1Title: "Strukturierte Erhebung",
    workflowStep1Text:
      "Relevante Angaben werden in einem klaren Ablauf gesammelt.",
    workflowStep2Title: "Übersichtliche Aufbereitung",
    workflowStep2Text:
      "Antworten werden geordnet dargestellt und leichter prüfbar gemacht.",
    workflowStep3Title: "Dokumentationsentwurf",
    workflowStep3Text:
      "Ein möglicher Entwurf muss ärztlich geprüft, korrigiert und freigegeben werden.",

    productSystemKicker: "Produkt",
    productSystemTitle:
      "Klineus verbindet strukturierte Erhebung, Übersicht und ärztliche Prüfung.",
    productSystemText:
      "Die Anwendung unterstützt die Vorbereitung medizinischer Gespräche und die nachvollziehbare Dokumentation.",

    coreProductLabel: "Kernfunktion",
    supportingWorkflowLabel: "Vorbereitung",
    internalInsightLabel: "Übersicht",

    doctorProductLongTitle: "Ärztliche Übersicht",
    doctorProductLongText:
      "Ärztinnen und Ärzte prüfen eingereichte Fälle, Patientenangaben, Hinweise und Dokumentationsentwürfe.",
    patientProductLongTitle: "Strukturierte Patientenangaben",
    patientProductLongText:
      "Patientenangaben werden vor dem Termin strukturiert erfasst und für die ärztliche Prüfung aufbereitet.",
    workflowInsightTitle: "Nutzung und Abläufe",
    workflowInsightText:
      "Interne Auswertungen helfen, Nutzung, Ausfülldauer und Abläufe besser zu verstehen.",

    valueEyebrow: "Nutzen",
    valueTitle:
      "Mehr Übersicht für medizinische Gespräche und Dokumentation.",
    valueText:
      "Klineus unterstützt eine strukturierte Vorbereitung und eine klarere ärztliche Prüfung.",
    valueMetric1: "Strukturierte Erhebung patientenbezogener Angaben.",
    valueMetric2: "Übersichtliche Darstellung wichtiger Informationen.",
    valueMetric3: "Einmal erfassen, geordnet prüfen.",
    valueMetric4: "Technische Unterstützung ohne Ersatz ärztlicher Verantwortung.",

    targetEyebrow: "Einsatzbereich",
    targetTitle:
      "Gestartet mit Knie- und Hüft-TEP, erweiterbar auf weitere medizinische Abläufe.",
    targetText:
      "Klineus richtet sich an medizinische Einrichtungen, die Patientenangaben strukturierter vorbereiten möchten.",
    targetClinicTitle: "Kliniken und Zentren",
    targetClinicText:
      "Für Einrichtungen mit standardisierten Abläufen und Anforderungen an Nachvollziehbarkeit.",
    targetPracticeTitle: "Praxen",
    targetPracticeText:
      "Für Praxen mit Bedarf an strukturierter Voraberhebung und klarer Übersicht.",
    targetFutureTitle: "Weitere Bereiche",
    targetFutureText:
      "Das Prinzip kann später auf weitere medizinische Abläufe übertragen werden.",

    productCtaEyebrow: "Kontakt",
    productCtaTitle: "Möchten Sie mehr über Klineus erfahren?",
    productCtaText: "Kontaktieren Sie uns für Rückfragen oder Zusammenarbeit.",

    teamPageEyebrow: "Über uns",
    teamPageTitle:
      "Klineus entsteht an der Schnittstelle von Medizin und Produktentwicklung.",
    teamPageIntro:
      "Klineus wird entwickelt, um medizinisch relevante Patientenangaben klarer, strukturierter und prüfbarer aufzubereiten.",
    teamBusinessTitle: "Produkt und Umsetzung",
    teamBusinessText:
      "Der Fokus liegt auf klaren Abläufen, einfacher Bedienbarkeit und sinnvoller Produktentwicklung.",
    teamMedicalTitle: "Medizinische Struktur",
    teamMedicalText:
      "Medizinische Anforderungen werden in klare Fragen und prüfbare Ausgaben übersetzt.",
    teamAiTitle: "Verantwortungsvolle Technologie",
    teamAiText:
      "Technologie unterstützt Strukturierung und Dokumentation, ersetzt aber keine ärztliche Entscheidung.",
    teamMissionEyebrow: "Grundsätze",
    teamMissionTitle: "Klar, strukturiert und ärztlich prüfbar.",
    teamMissionText1:
      "Klineus soll medizinische Gespräche besser vorbereiten.",
    teamMissionText2:
      "Die Anwendung wird mit Blick auf reale medizinische Abläufe weiterentwickelt.",

    contactEyebrow: "Kontakt",
    contactTitle: "Sprechen Sie mit uns über Klineus.",
    contactText:
      "Für Pilotprojekte, Partnerschaften oder allgemeine Rückfragen erreichen Sie uns direkt per E-Mail.",
    contactEmail: "E-Mail",
    contactLocation: "Standort",
    contactUseCase: "Anliegen",
    contactUseCaseValue: "Pilotierung und Partnerschaft",
    contactName: "Name",
    contactNamePlaceholder: "Ihr Name",
    contactOrganization: "Organisation",
    contactOrganizationPlaceholder: "Klinik, Praxis oder Organisation",
    contactMessage: "Nachricht",
    contactMessagePlaceholder: "Worum geht es?",
    contactSubmit: "E-Mail vorbereiten",
    contactPrototypeAlert: "Vielen Dank. Ihre Nachricht wurde vorbereitet.",

    termsEyebrow: "Rechtliches",
    termsTitle: "Impressum und Datenschutz",
    termsIntro:
      "Diese Angaben sind Platzhalter und müssen vor produktivem Einsatz rechtlich geprüft werden.",
    terms1Title: "1. Anbieter",
    terms1Text: "Klineus",
    terms2Title: "2. Kontakt",
    terms2Text: "contact@klineus.de",
    terms3Title: "3. Datenschutz",
    terms3Text:
      "Patientenname und Fallinformationen dienen der ärztlichen Zuordnung. Direkte Identifikatoren sollen nicht an KI-Prompts übergeben werden.",
    terms4Title: "4. KI-Verarbeitung",
    terms4Text:
      "KI-generierte Texte sind Dokumentationsentwürfe und müssen ärztlich geprüft werden.",
    terms5Title: "5. Prüfung vor Produktivbetrieb",
    terms5Text:
      "Vor produktivem Einsatz sind Datenschutz, IT-Sicherheit, regulatorische Einordnung und klinische Validierung zu prüfen.",
    terms6Title: "6. Kontakt",
    terms6Text: "Fragen können per E-Mail an contact@klineus.de gestellt werden.",

    patientStartEyebrow: "Patientenfragebogen",
    patientStartTitle: "Patientenangaben",
    patientIntro1: "Bitte geben Sie Ihren Patientennamen ein.",
    patientIntro2:
      "Ihre Angaben helfen, das Arztgespräch vorzubereiten.",
    patientIntro3:
      "Dies ist keine Diagnose. Ihre Ärztin oder Ihr Arzt prüft alle Angaben.",
    startPatientQuestionnaire: "Fragebogen starten",
    startQuestionnaire: "Fragebogen starten",

    doneTitle: "Vielen Dank.",
    doneText:
      "Ihre Angaben wurden übermittelt und stehen der Ärztin oder dem Arzt zur Prüfung zur Verfügung.",

    home: "Zur Startseite",
    back: "Zurück",
    next: "Weiter",
    submit: "Absenden",
    answerRequired: "Bitte beantworten Sie diese Frage.",
    heightCm: "Größe in cm",
    weightKg: "Gewicht in kg",

    doctorArea: "Arztbereich",
    loginTitle: "Anmelden",
    email: "E-Mail",
    password: "Passwort",
    loginButton: "Einloggen",

    dashboardEyebrow: "Arzt-Dashboard",
    patientCases: "Patientenfälle",
    logout: "Abmelden",
    loadingCases: "Fälle werden geladen.",
    emptyCasesTitle: "Noch keine Fälle vorhanden",
    emptyCasesText:
      "Sobald Patientinnen oder Patienten einen Fragebogen starten oder absenden, erscheinen sie hier.",
    caseId: "Fall-ID",
    created: "Erstellt",
    updated: "Aktualisiert",
    indication: "Indikation",
    status: "Status",
    report: "Bericht",
    openCase: "Öffnen",
    kneeTep: "Knie-TEP",
    hipTep: "Hüft-TEP",
    completed: "ausgefüllt",
    pending: "ausstehend",
    notGenerated: "nicht erstellt",
    generated: "erstellt",
    edited: "bearbeitet",

    backToDashboard: "Zurück zum Dashboard",
    kneeCase: "Knie-TEP Fall",
    deleteCase: "Fall löschen",
    deleteConfirm: "Diesen Fall löschen?",
    loadingCase: "Fall wird geladen.",
    caseNotFound: "Fall nicht gefunden.",
    patientAnswers: "Patientenantworten",
    documentationFlags: "Dokumentationshinweise",
    aiReport: "KI-Entwurf",
    generateAiReport: "KI-Entwurf erstellen",
    save: "Speichern",
    copy: "Kopieren",
    print: "Drucken",
    reportGeneratedNotice: "KI-Entwurf wurde erstellt.",
    reportSavedNotice: "Bericht wurde gespeichert.",
    reportCopiedNotice: "Bericht wurde kopiert.",
    noReportToCopy: "Es gibt noch keinen Bericht zum Kopieren.",
    reportPlaceholder:
      "Erstellen Sie einen KI-Entwurf. Der Text muss ärztlich geprüft werden.",
    printTitle: "Klineus Dokumentationsentwurf",
    noAnswer: "keine Angabe",
    heightShort: "Größe",
    weightShort: "Gewicht",
  },

  en: {
    languageName: "English",
    otherLanguageName: "Deutsch",
    toggleLabel: "Language",

    prototypePill: "Klineus",

    navProduct: "Our Product",
    navTeam: "About Us",
    navContact: "Contact",
    navLegal: "Legal",

    quickLinks: "Menu",
    quickProductTitle: "Our Product",
    quickProductText: "Learn what Klineus does.",
    quickTeamTitle: "About Us",
    quickTeamText: "More about the Klineus team.",
    quickContactTitle: "Contact",
    quickContactText: "Get in touch.",

    learnProduct: "View product",
    contactUs: "Contact us",
    adminPanel: "Admin area",

    landingEyebrow: "Klineus",
    landingTitle: "Klineus",
    landingDescription:
      "Klineus supports the structured collection and preparation of medically relevant patient information before the consultation.",
    landingDisclaimer:
      "Klineus does not replace diagnosis, treatment decisions, or medical review.",

    homeCard1Title: "Structured intake",
    homeCard1Text: "Patient information is collected in a clear flow.",
    homeCard2Title: "Clear preparation",
    homeCard2Text:
      "Answers are organized for physician review.",
    homeCard3Title: "Physician responsibility",
    homeCard3Text:
      "Klineus supports documentation but does not replace medical decisions.",

    homeCtaEyebrow: "Klineus",
    homeCtaTitle: "Structured preparation for medical consultations.",
    homeCtaText:
      "Klineus helps prepare patient information before an appointment.",

    productPageEyebrow: "Our Product",
    productPageTitle:
      "Klineus structures medically relevant patient information.",
    productPageIntro:
      "Klineus helps practices and clinics collect, prepare and present patient-related information clearly before a medical appointment.",

    workflowEyebrow: "Workflow",
    workflowTitle:
      "A clear process without replacing physician responsibility.",
    workflowIntro:
      "Klineus prepares patient information in a structured way and makes important or unclear points easier to identify.",

    workflowStep1Title: "Structured intake",
    workflowStep1Text:
      "Relevant information is collected in a clear flow.",
    workflowStep2Title: "Clear preparation",
    workflowStep2Text:
      "Answers are organized and made easier to review.",
    workflowStep3Title: "Documentation draft",
    workflowStep3Text:
      "Any draft must be reviewed, corrected and approved by a physician.",

    productSystemKicker: "Product",
    productSystemTitle:
      "Klineus connects structured intake, overview and physician review.",
    productSystemText:
      "The application supports preparation for medical consultations and traceable documentation.",

    coreProductLabel: "Core function",
    supportingWorkflowLabel: "Preparation",
    internalInsightLabel: "Overview",

    doctorProductLongTitle: "Physician overview",
    doctorProductLongText:
      "Physicians review submitted cases, patient information, flags and documentation drafts.",
    patientProductLongTitle: "Structured patient information",
    patientProductLongText:
      "Patient information is collected before the appointment and prepared for physician review.",
    workflowInsightTitle: "Usage and workflows",
    workflowInsightText:
      "Internal analytics help understand usage, completion time and workflows.",

    valueEyebrow: "Value",
    valueTitle:
      "More clarity for medical conversations and documentation.",
    valueText:
      "Klineus supports structured preparation and clearer physician review.",
    valueMetric1: "Structured collection of patient information.",
    valueMetric2: "Clear presentation of important information.",
    valueMetric3: "Collect once, review clearly.",
    valueMetric4: "Technical support without replacing medical responsibility.",

    targetEyebrow: "Use case",
    targetTitle:
      "Starting with knee and hip replacement, expandable to further medical workflows.",
    targetText:
      "Klineus is built for medical organizations that want to prepare patient information in a more structured way.",
    targetClinicTitle: "Clinics and centers",
    targetClinicText:
      "For organizations with standardized workflows and traceability requirements.",
    targetPracticeTitle: "Practices",
    targetPracticeText:
      "For practices that need structured pre-consultation intake and a clear overview.",
    targetFutureTitle: "Further areas",
    targetFutureText:
      "The principle can later be transferred to other medical workflows.",

    productCtaEyebrow: "Contact",
    productCtaTitle: "Would you like to learn more about Klineus?",
    productCtaText: "Contact us for questions or collaboration.",

    teamPageEyebrow: "About Us",
    teamPageTitle:
      "Klineus is built at the intersection of medicine and product development.",
    teamPageIntro:
      "Klineus is being developed to make medically relevant patient information clearer, more structured and easier to review.",
    teamBusinessTitle: "Product and execution",
    teamBusinessText:
      "The focus is on clear workflows, simple usability and meaningful product development.",
    teamMedicalTitle: "Medical structure",
    teamMedicalText:
      "Medical requirements are translated into clear questions and reviewable outputs.",
    teamAiTitle: "Responsible technology",
    teamAiText:
      "Technology supports structuring and documentation but does not replace medical decisions.",
    teamMissionEyebrow: "Principles",
    teamMissionTitle: "Clear, structured and physician-reviewable.",
    teamMissionText1:
      "Klineus should better prepare medical conversations.",
    teamMissionText2:
      "The application is developed with real medical workflows in mind.",

    contactEyebrow: "Contact",
    contactTitle: "Talk to us about Klineus.",
    contactText:
      "For pilots, partnerships or general questions, you can reach us directly by email.",
    contactEmail: "Email",
    contactLocation: "Location",
    contactUseCase: "Topic",
    contactUseCaseValue: "Pilots and partnerships",
    contactName: "Name",
    contactNamePlaceholder: "Your name",
    contactOrganization: "Organization",
    contactOrganizationPlaceholder: "Clinic, practice or organization",
    contactMessage: "Message",
    contactMessagePlaceholder: "How can we help?",
    contactSubmit: "Prepare email",
    contactPrototypeAlert: "Thank you. Your message has been prepared.",

    termsEyebrow: "Legal",
    termsTitle: "Imprint and Privacy",
    termsIntro:
      "This information is placeholder content and must be legally reviewed before production use.",
    terms1Title: "1. Provider",
    terms1Text: "Klineus",
    terms2Title: "2. Contact",
    terms2Text: "contact@klineus.de",
    terms3Title: "3. Privacy",
    terms3Text:
      "Patient name and case information are used for physician-side assignment. Direct identifiers should not be passed into AI prompts.",
    terms4Title: "4. AI processing",
    terms4Text:
      "AI-generated text is a documentation draft and must be reviewed by a physician.",
    terms5Title: "5. Review before production use",
    terms5Text:
      "Before production use, privacy, IT security, regulatory classification and clinical validation must be reviewed.",
    terms6Title: "6. Contact",
    terms6Text: "Questions can be sent by email to contact@klineus.de.",

    patientStartEyebrow: "Patient questionnaire",
    patientStartTitle: "Patient information",
    patientIntro1: "Please enter the patient name.",
    patientIntro2:
      "Your answers help prepare the doctor consultation.",
    patientIntro3:
      "This is not a diagnosis. Your doctor will review all information.",
    startPatientQuestionnaire: "Start questionnaire",
    startQuestionnaire: "Start questionnaire",

    doneTitle: "Thank you.",
    doneText:
      "Your answers have been submitted and are available for the doctor to review.",

    home: "Home",
    back: "Back",
    next: "Next",
    submit: "Submit",
    answerRequired: "Please answer this question.",
    heightCm: "Height in cm",
    weightKg: "Weight in kg",

    doctorArea: "Doctor area",
    loginTitle: "Sign in",
    email: "Email",
    password: "Password",
    loginButton: "Sign in",

    dashboardEyebrow: "Doctor dashboard",
    patientCases: "Patient cases",
    logout: "Log out",
    loadingCases: "Loading cases.",
    emptyCasesTitle: "No cases yet",
    emptyCasesText:
      "Once patients start or submit a questionnaire, they will appear here.",
    caseId: "Case ID",
    created: "Created",
    updated: "Updated",
    indication: "Indication",
    status: "Status",
    report: "Report",
    openCase: "Open",
    kneeTep: "Knee replacement",
    hipTep: "Hip replacement",
    completed: "completed",
    pending: "pending",
    notGenerated: "not generated",
    generated: "generated",
    edited: "edited",

    backToDashboard: "Back to dashboard",
    kneeCase: "Knee replacement case",
    deleteCase: "Delete case",
    deleteConfirm: "Delete this case?",
    loadingCase: "Loading case.",
    caseNotFound: "Case not found.",
    patientAnswers: "Patient answers",
    documentationFlags: "Documentation notes",
    aiReport: "AI draft",
    generateAiReport: "Generate AI draft",
    save: "Save",
    copy: "Copy",
    print: "Print",
    reportGeneratedNotice: "AI draft was created.",
    reportSavedNotice: "Report was saved.",
    reportCopiedNotice: "Report was copied.",
    noReportToCopy: "There is no report to copy yet.",
    reportPlaceholder:
      "Generate an AI draft. The text must be reviewed by a physician.",
    printTitle: "Klineus documentation draft",
    noAnswer: "not provided",
    heightShort: "Height",
    weightShort: "Weight",
  },
};

const flagTranslations = {
  "Schmerzangabe unklar": {
    en: {
      title: "Pain information unclear",
      description:
        "The patient reports no current pain. Review this as an open point in the consultation.",
    },
  },
  "Kurze Symptomdauer": {
    en: {
      title: "Short symptom duration",
      description:
        "The patient reports symptoms for less than 3 months. Requires physician assessment.",
    },
  },
  "Geringe Alltagsbelastung berichtet": {
    en: {
      title: "Low daily-life limitation reported",
      description:
        "The patient reports low daily-life limitation. Mark as an open point for the consultation.",
    },
  },
  "Keine konservative Vorbehandlung berichtet": {
    en: {
      title: "No conservative pretreatment reported",
      description:
        "The patient reports no previous treatment. Conservative treatment history should be reviewed by the physician.",
    },
  },
  "Röntgenbefund unklar oder fehlend": {
    en: {
      title: "X-ray finding unclear or missing",
      description:
        "The patient reports no known X-ray or is unsure. Findings remain open for the consultation.",
    },
  },
  "Aktive Infektion berichtet": {
    en: {
      title: "Active infection reported",
      description:
        "The patient reports a currently treated inflammation or infection. Requires physician review.",
    },
  },
  "Kürzliches schweres Herz-Kreislauf-Ereignis berichtet": {
    en: {
      title: "Recent severe cardiovascular event reported",
      description:
        "The patient reports a severe cardiovascular event in the last 3 months. Requires physician review.",
    },
  },
  "Diabetes oder erhöhte Blutzuckerwerte berichtet": {
    en: {
      title: "Diabetes or elevated blood sugar reported",
      description:
        "The patient reports diabetes or elevated blood sugar. HbA1c and preoperative management should be reviewed.",
    },
  },
  "BMI ab 40 berechnet": {
    en: {
      title: "BMI of 40 or higher calculated",
    },
  },
  "BMI 30 bis 39 berechnet": {
    en: {
      title: "BMI between 30 and 39 calculated",
    },
  },
  "Aktives Rauchen berichtet": {
    en: {
      title: "Active smoking reported",
      description:
        "The patient reports current smoking. Nicotine abstinence and perioperative risk should be reviewed.",
    },
  },
  "Kortison-Injektion vor weniger als 6 Wochen berichtet": {
    en: {
      title: "Cortisone injection less than 6 weeks ago reported",
      description:
        "The patient reports a recent cortisone injection. Requires physician review.",
    },
  },
  "Kortison-Injektion vor 6 Wochen bis 3 Monaten berichtet": {
    en: {
      title: "Cortisone injection 6 weeks to 3 months ago reported",
      description:
        "The patient reports a cortisone injection in the relevant time period. Mark as an open point for the consultation.",
    },
  },
  "Strukturierte Angaben vollständig": {
    en: {
      title: "Structured information complete",
      description:
        "No configured orange or red documentation notes were generated from the patient answers.",
    },
  },
};

const LanguageContext = createContext(null);

function normalizeLanguage(nextLanguage) {
  return nextLanguage === "en" ? "en" : "de";
}

function translateFlagText(flag, language) {
  if (!flag) {
    return flag;
  }

  const cleanedFlag = {
    ...flag,
    title: cleanGermanText(flag.title),
    description: cleanGermanText(flag.description),
  };

  if (language === "de" || !cleanedFlag.title) {
    return cleanedFlag;
  }

  const translated = flagTranslations[cleanedFlag.title]?.[language];

  if (!translated) {
    return cleanedFlag;
  }

  let description = translated.description || cleanedFlag.description;

  if (cleanedFlag.title.includes("BMI") && cleanedFlag.description) {
    const bmi = cleanedFlag.description.match(/BMI von ([0-9.]+)/)?.[1];

    if (bmi) {
      description =
        cleanedFlag.title === "BMI ab 40 berechnet"
          ? `A BMI of ${bmi} was calculated from the answers. Requires physician review.`
          : `A BMI of ${bmi} was calculated from the answers. Review as modifiable risk information.`;
    }
  }

  return {
    ...cleanedFlag,
    title: translated.title || cleanedFlag.title,
    description,
  };
}

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return normalizeLanguage(saved);
  });

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, language);
    document.documentElement.lang = language;
  }, [language]);

  const value = useMemo(
    () => ({
      language,
      setLanguage: (nextLanguage) =>
        setLanguageState(normalizeLanguage(nextLanguage)),
      toggleLanguage: () =>
        setLanguageState((current) => (current === "de" ? "en" : "de")),
      t: (key) => {
        const rawValue = translations[language]?.[key] || translations.de[key] || key;

        return language === "de" ? cleanGermanText(rawValue) : rawValue;
      },
      translateFlag: (flag) => translateFlagText(flag, language),
    }),
    [language],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error("useLanguage must be used inside LanguageProvider");
  }

  return context;
}