import { createContext, useContext, useEffect, useMemo, useState } from "react";
const STORAGE_KEY = "klineus_language";

const translations = {
  de: {
    languageName: "Deutsch",
    otherLanguageName: "English",
    prototypePill: "Knie-TEP Prototyp",
    toggleLabel: "Sprache",
    navProduct: "Produkt",
navTeam: "Team",
navContact: "Kontakt",
navLegal: "Rechtliches",
quickLinks: "Menü",
quickProductTitle: "Klineus Produkt",
quickProductText: "Ein System für Patientenaufnahme, Arztprüfung und Dokumentation.",
quickDoctorTitle: "Arzt-Dashboard",
quickDoctorText: "Der zentrale Arbeitsbereich für ärztliche Prüfung.",
quickContactTitle: "Kontakt",
quickContactText: "Pilotanfrage, Partnerschaft oder Rückfrage senden.",

learnProduct: "Produkt ansehen",
contactUs: "Kontakt aufnehmen",

homeCard1Title: "Patientenaufnahme vor dem Termin",
homeCard1Text: "Patientinnen und Patienten erfassen relevante Informationen strukturiert vor dem Arztgespräch.",
homeCard2Title: "Leitlinienbasierte Strukturierung",
homeCard2Text: "Klineus ordnet Angaben anhand medizinischer Kriterien und markiert offene Punkte.",
homeCard3Title: "Ärztliche Prüfung und Dokumentation",
homeCard3Text: "Der Arzt erhält ein klares Dashboard mit Hinweisen und Dokumentationsentwurf.",

homeCtaEyebrow: "Pilotierung und Partnerschaft",
homeCtaTitle: "Klineus wird für den klinischen Einsatz weiterentwickelt.",
homeCtaText: "Wir suchen klinische Partner, Feedbackgeber und Einrichtungen, die strukturierte Indikationsprozesse verbessern möchten.",

productPageEyebrow: "Produkt",
productPageTitle: "KI-gestützte Dokumentationsunterstützung für Orthopädie und Unfallchirurgie.",
productPageIntro: "Klineus unterstützt die leitlinienbasierte Erhebung, Einordnung und Dokumentation patientenbezogener Informationen vor dem Arztkontakt.",

workflowEyebrow: "So funktioniert Klineus",
workflowTitle: "Ein strukturierter Ablauf vor dem Arztgespräch.",
workflowIntro: "Klineus bereitet relevante Patienteninformationen vor, bevor das ärztliche Gespräch beginnt.",
workflowStep1Title: "Patientenaufnahme",
workflowStep1Text: "Patientinnen und Patienten beantworten einen geführten Knie-TEP-Fragebogen zu Hause oder im Wartezimmer.",
workflowStep2Title: "Leitlinienlogik",
workflowStep2Text: "Klineus strukturiert die Antworten und markiert erfüllte, fehlende und unklare Kriterien.",
workflowStep3Title: "Ärztliche Prüfung",
workflowStep3Text: "Der Arzt erhält ein klares Dashboard mit Hinweisen, offenen Punkten und Dokumentationsentwurf.",

productSystemKicker: "Ein Produkt, ein Ablauf",
productSystemTitle: "Klineus verbindet Patientenangaben, ärztliche Prüfung und Dokumentationsentwurf.",
productSystemText: "Das Arzt-Dashboard ist der zentrale Arbeitsbereich. Der Patientenfragebogen liefert die vorbereitenden Informationen. Interne Analysen helfen dem Klineus-Team, Nutzung und Abläufe zu verbessern.",

coreProductLabel: "Kernbereich",
supportingWorkflowLabel: "Vorbereitung",
internalInsightLabel: "Intern",
doctorProductLongTitle: "Arzt-Dashboard",
doctorProductLongText: "Ärztinnen und Ärzte prüfen eingereichte Fälle, Patientenangaben, BMI, Dokumentationshinweise und KI-generierte Berichtsentwürfe. Die KI-Ausgabe bleibt ein Entwurf und muss ärztlich geprüft und freigegeben werden.",
patientProductLongTitle: "Patientenfragebogen",
patientProductLongText: "Patientinnen und Patienten beantworten vor dem Termin einen geführten Fragebogen. Dadurch liegen Beschwerden, Einschränkungen, Vorbehandlungen, Befunde und Risikohinweise strukturiert vor.",
workflowInsightTitle: "Nutzungs- und Verhaltensanalyse",
workflowInsightText: "Der interne Admin-Bereich ist kein eigenständiges Produkt. Er hilft dem Klineus-Team, Nutzung, Ausfülldauer, Sprachen und Berichtserstellung besser zu verstehen.",

valueEyebrow: "Klinischer Nutzen",
valueTitle: "Mehr Zeit für ärztliche Entscheidung, weniger Zeitverlust durch Routinedokumentation.",
valueText: "Klineus adressiert den zeitintensiven Indikationsprozess in Orthopädie und Unfallchirurgie.",
valueMetric1: "Minuten Zeitersparnis pro Patient als Zielwert.",
valueMetric2: "Leitlinienlogik für Hüft- und Knie-TEP.",
valueMetric3: "Einmal erfassen, mehrfach nutzen.",
valueMetric4: "Vom Prototyp zur klinisch validierten Pilotversion.",

targetEyebrow: "Zielgruppe",
targetTitle: "Gestartet in der Endoprothetik, skalierbar auf weitere Indikationsbereiche.",
targetText: "Der initiale Fokus liegt auf orthopädischen und unfallchirurgischen Einrichtungen sowie niedergelassenen Fachärzten.",
targetClinicTitle: "Kliniken und Endoprothetikzentren",
targetClinicText: "Für Einrichtungen mit hohen Fallzahlen, standardisierten Abläufen und Anforderungen an Nachvollziehbarkeit.",
targetPracticeTitle: "Niedergelassene Fachärzte",
targetPracticeText: "Für Praxen mit Bedarf an strukturierter Voraberhebung und klarer Dokumentationsgrundlage.",
targetFutureTitle: "Weitere Indikationsbereiche",
targetFutureText: "Das Prinzip lässt sich auf weitere Bereiche in Orthopädie, Unfallchirurgie und andere Fachgebiete übertragen.",

productCtaEyebrow: "Nächster Schritt",
productCtaTitle: "Möchten Sie Klineus als Pilotpartner kennenlernen?",
productCtaText: "Kontaktieren Sie uns für Austausch, Feedback oder Pilotierung.",

teamPageEyebrow: "Team",
teamPageTitle: "Ein komplementäres Team aus Business, Medizin und Technologie.",
teamPageIntro: "Klineus entsteht aus der Verbindung von KI-gestützter Prozessautomatisierung und konkretem klinischem Bedarf.",
teamBusinessTitle: "Geschäftsmodell und Umsetzung",
teamBusinessText: "Das Team bringt Erfahrung in Strategie, Vertrieb, Marketing und Finanzierung ein, um Klineus als skalierbares Health-Tech-Produkt aufzubauen.",
teamMedicalTitle: "Medizinische und klinische Expertise",
teamMedicalText: "Die medizinische Seite verantwortet die Übersetzung von Leitlinien in klare Kriterien, fachliche Validierung und Austausch mit klinischen Anwendern.",
teamAiTitle: "KI und Produktlogik",
teamAiText: "KI unterstützt Strukturierung, Auswertung und Dokumentationsvorbereitung. Sie ersetzt keine ärztliche Entscheidung.",
teamMissionEyebrow: "Mission",
teamMissionTitle: "Weniger Routinedokumentation, mehr Fokus auf das Arzt-Patienten-Gespräch.",
teamMissionText1: "Klineus soll den Indikationsprozess nachvollziehbarer, konsistenter und effizienter machen.",
teamMissionText2: "Das Produkt wird mit klinischem Feedback weiterentwickelt und auf reale Anforderungen im Versorgungsalltag ausgerichtet.",

contactEyebrow: "Kontakt",
contactTitle: "Interessieren Sie sich für Klineus?",
contactText: "Kontaktieren Sie uns für Pilotierung, Partnerschaft oder Feedback.",
contactEmail: "E-Mail",
contactLocation: "Standort",
contactUseCase: "Anwendungsfall",
contactUseCaseValue: "Knie-TEP-Dokumentationsunterstützung",
contactName: "Name",
contactNamePlaceholder: "Ihr Name",
contactOrganization: "Organisation",
contactOrganizationPlaceholder: "Klinik, Praxis oder Unternehmen",
contactMessage: "Nachricht",
contactMessagePlaceholder: "Schreiben Sie uns, wie Sie Klineus einsetzen möchten.",
contactSubmit: "Nachricht senden",
contactPrototypeAlert: "Vielen Dank. Dies ist ein Prototyp-Kontaktformular. Die Backend-Übermittlung wird später verbunden.",

termsEyebrow: "Rechtliches",
termsTitle: "Prototyp-Bedingungen, Datenschutz und klinische Grenzen.",
termsIntro: "Diese Inhalte sind Platzhalter und müssen vor einem produktiven Einsatz rechtlich geprüft werden.",
terms1Title: "1. Prototyp-Status",
terms1Text: "Klineus ist derzeit ein Prototyp für Demonstration, Validierung und interne Tests.",
terms2Title: "2. Keine medizinische Entscheidungsfindung",
terms2Text: "Klineus stellt keine Diagnosen, trifft keine endgültigen Behandlungsentscheidungen und gibt keine Operationsempfehlungen.",
terms3Title: "3. Datenverarbeitung",
terms3Text: "Der Prototyp ist auf anonyme Fall-IDs ausgelegt und vermeidet direkte Identifikatoren in KI-Prompts.",
terms4Title: "4. KI-generierte Entwürfe",
terms4Text: "KI-generierte Texte sind ausschließlich Dokumentationsentwürfe und müssen ärztlich geprüft werden.",
terms5Title: "5. Verfügbarkeit",
terms5Text: "Prototyp-Dienste können sich ändern, unterbrochen oder entfernt werden.",
terms6Title: "6. Kontakt",
terms6Text: "Fragen zum Prototyp, zu Partnerschaften oder zu Evaluierungszugang können über das Kontaktformular gestellt werden.",
    products: "Produkt",
    navOurGoal: "Unser Ziel",
    navOurTeam: "Unser Team",
    navContact: "Kontakt",
    navTerms: "AGB",

    landingEyebrow: "Orthopädische Dokumentationsunterstützung",
    landingTitle: "Klineus",
    landingDescription:
      "Webbasierter Prototyp für strukturierte Knie-TEP-Fragebögen und ärztlich geprüfte Dokumentationsentwürfe.",
    landingDisclaimer:
      "Dieser Prototyp ersetzt keine ärztliche Beurteilung und gibt keine eigenständigen Diagnose- oder Behandlungsempfehlungen.",

    startPatientQuestionnaire: "Patientenfragebogen starten",
    openDoctorDashboard: "Arzt-Dashboard öffnen",
    adminPanel: "Admin-Bereich",

    productDoctorText: "Zentraler Arbeitsbereich für Fallprüfung und Berichtsentwürfe.",
    productPatientText: "Strukturierte Vorbereitung vor dem Arzttermin.",
    workflowInsightShortText: "Interne Auswertung zur Verbesserung des Klineus-Ablaufs.",

    productsSectionKicker: "Produkt",
    productsSectionTitle: "Ein Klineus-Produkt für strukturierte Knie-TEP-Dokumentation.",
    productsSectionText:
      "Klineus verbindet Patientenangaben, ärztliche Prüfung und KI-gestützte Dokumentationsentwürfe in einem gemeinsamen Ablauf. Der zentrale Arbeitsbereich ist das Arzt-Dashboard; der Patientenfragebogen liefert die vorbereitenden Informationen.",

    coreProductLabel: "Kernbereich für Ärztinnen und Ärzte",
    supportingWorkflowLabel: "Vorbereitung durch Patientinnen und Patienten",
    internalInsightLabel: "Interne Auswertung",

    doctorProductLongTitle: "Arzt-Dashboard",
    doctorProductLongText:
      "Das Arzt-Dashboard ist der wichtigste Arbeitsbereich von Klineus. Ärztinnen und Ärzte prüfen dort eingereichte Fälle, Patientenangaben, BMI, Dokumentationshinweise und KI-generierte Berichtsentwürfe. Die KI-Ausgabe bleibt ein Entwurf und muss ärztlich geprüft und freigegeben werden.",

    patientProductLongTitle: "Patientenfragebogen",
    patientProductLongText:
      "Patientinnen und Patienten beantworten vor dem Termin einen geführten Knie-TEP-Fragebogen. Dadurch liegen relevante Beschwerden, Einschränkungen, Vorbehandlungen, Befunde und Risikohinweise bereits strukturiert vor dem Arztgespräch vor.",

    workflowInsightTitle: "Nutzungs- und Verhaltensanalyse",
    workflowInsightText:
      "Der interne Admin-Bereich dient nicht als eigenständiges Produkt, sondern hilft dem Klineus-Team, Nutzung, Ausfülldauer, Sprachen, Frageanzahl und Berichtserstellung besser zu verstehen und den Ablauf weiter zu verbessern.",

    ourGoalEyebrow: "Unser Ziel",
    ourGoalTitle: "Bessere Arztgespräche vorbereiten, bevor der Patient den Raum betritt.",
    ourGoalText1:
      "Unser Ziel ist es, orthopädische Teams mit strukturierter, ärztlich geprüfter Dokumentation zu unterstützen. Klineus hilft dabei, relevante patientenberichtete Informationen frühzeitig zu erfassen, wiederholte Aufnahmeprozesse zu reduzieren und das Gespräch fokussierter zu machen.",
    ourGoalText2:
      "Das Produkt ersetzt keine ärztliche Beurteilung. Es stellt keine Diagnose, trifft keine Behandlungsentscheidung und empfiehlt keine Operation. Es hilft, Informationen zu strukturieren, damit Ärztinnen und Ärzte sie prüfen, bearbeiten und freigeben können.",

    ourTeamEyebrow: "Unser Team",
    ourTeamTitle: "Entwickelt mit Fokus auf Gesundheitswesen, Produktqualität und verantwortungsvolle KI.",
    teamMedicalTitle: "Medizinische Beratung",
    teamMedicalText:
      "Platzhaltertext: Orthopädische Expertinnen und Experten unterstützen bei Fragebogenstruktur, Dokumentationsgrenzen und ärztlichem Prüfprozess.",
    teamProductTitle: "Produkterlebnis",
    teamProductText:
      "Platzhaltertext: Das Produktteam konzentriert sich auf einfache Patientenführung, gute Lesbarkeit, Barrierearmut und klare Trennung zwischen Patienten-, Arzt- und internen Verwaltungsbereichen.",
    teamAiTitle: "Verantwortungsvolle KI",
    teamAiText:
      "Platzhaltertext: KI wird nur zur Unterstützung von Dokumentationsentwürfen verwendet. Direkte Identifikatoren werden nach Möglichkeit aus KI-Prompts ausgeschlossen, und Ergebnisse müssen ärztlich geprüft werden.",

    contactEyebrow: "Kontakt",
    contactTitle: "Interessieren Sie sich für Klineus?",
    contactText:
      "Nutzen Sie dieses Prototyp-Kontaktformular, um frühes Interesse zu erfassen. Später kann es mit Backend, CRM, E-Mail-Service oder Support-Postfach verbunden werden.",
    contactEmail: "E-Mail",
    contactLocation: "Standort",
    contactUseCase: "Anwendungsfall",
    contactUseCaseValue: "Knie-TEP-Dokumentationsunterstützung",
    contactName: "Name",
    contactNamePlaceholder: "Ihr Name",
    contactOrganization: "Organisation",
    contactOrganizationPlaceholder: "Klinik, Praxis oder Unternehmen",
    contactMessage: "Nachricht",
    contactMessagePlaceholder: "Schreiben Sie uns, wie Sie Klineus einsetzen möchten.",
    contactSubmit: "Nachricht senden",
    contactPrototypeAlert:
      "Vielen Dank. Dies ist ein Prototyp-Kontaktformular. Die Backend-Übermittlung wird später verbunden.",

    termsEyebrow: "AGB",
    termsTitle: "Prototyp-Bedingungen, Datenschutz und klinische Grenzen.",
    terms1Title: "1. Prototyp-Status",
    terms1Text:
      "Platzhaltertext: Klineus ist derzeit ein Prototyp für Demonstration, Validierung und interne Tests. Es sollte nicht als zertifiziertes Medizinprodukt oder produktives klinisches System betrachtet werden.",
    terms2Title: "2. Keine medizinische Entscheidungsfindung",
    terms2Text:
      "Platzhaltertext: Klineus stellt keine Diagnosen, trifft keine endgültigen Behandlungsentscheidungen und gibt keine Operationsempfehlungen. Alle Ausgaben müssen von qualifizierten Ärztinnen oder Ärzten geprüft, bearbeitet und freigegeben werden.",
    terms3Title: "3. Datenverarbeitung",
    terms3Text:
      "Platzhaltertext: Der Prototyp ist auf anonyme Fall-IDs ausgelegt und vermeidet direkte Identifikatoren in KI-Prompts. Für den produktiven Einsatz sind rechtliche, datenschutzbezogene, sicherheitstechnische und klinische Prüfungen erforderlich.",
    terms4Title: "4. KI-generierte Entwürfe",
    terms4Text:
      "Platzhaltertext: KI-generierte Texte sind ausschließlich Dokumentationsentwürfe. Ärztinnen und Ärzte bleiben verantwortlich für Richtigkeit, Vollständigkeit, Kontext und Eignung vor der Verwendung.",
    terms5Title: "5. Verfügbarkeit",
    terms5Text:
      "Platzhaltertext: Prototyp-Dienste können sich ändern, unterbrochen oder entfernt werden. In dieser Phase werden keine Verfügbarkeit, kein Support und keine klinische Einsatzbereitschaft zugesichert.",
    terms6Title: "6. Kontakt",
    terms6Text:
      "Platzhaltertext: Fragen zum Prototyp, zu Partnerschaften oder zu Evaluierungszugang können über das Kontaktformular gestellt werden.",

    patientStartEyebrow: "Patientenfragebogen",
    patientStartTitle: "Fragen zu Ihren Kniebeschwerden",
    patientIntro1: "Sie beantworten gleich einige Fragen zu Ihren Beschwerden am Knie.",
    patientIntro2: "Ihre Angaben helfen, das Arztgespräch vorzubereiten.",
    patientIntro3: "Dies ist keine Diagnose. Ihre Ärztin oder Ihr Arzt prüft alle Angaben.",
    startQuestionnaire: "Fragebogen starten",
    doneTitle: "Vielen Dank.",
    doneText: "Ihre Angaben wurden übermittelt und werden vom Arzt geprüft.",
    home: "Zur Startseite",
    back: "Zurück",
    next: "Weiter",
    submit: "Absenden",
    answerRequired: "Bitte beantworten Sie die Frage, bevor Sie fortfahren.",
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
    emptyCasesTitle: "Noch keine Fälle",
    emptyCasesText: "Nach dem Absenden eines Patientenfragebogens erscheint der Fall hier.",
    caseId: "Case ID",
    created: "Erstellt",
    updated: "Aktualisiert",
    indication: "Indikation",
    status: "Status",
    report: "Bericht",
    openCase: "Fall öffnen",
    kneeTep: "Knie-TEP",
    completed: "completed",
    pending: "pending",
    notGenerated: "nicht generiert",
    generated: "generiert",
    edited: "bearbeitet",
    backToDashboard: "Zurück zum Dashboard",
    kneeCase: "Knie-TEP Fall",
    deleteCase: "Fall löschen",
    deleteConfirm: "Diesen anonymen Fall löschen?",
    loadingCase: "Fall wird geladen.",
    caseNotFound: "Fall nicht gefunden.",
    patientAnswers: "Patientenantworten",
    documentationFlags: "Dokumentationsflags",
    aiReport: "AI-Bericht",
    generateAiReport: "AI-Bericht generieren",
    save: "Speichern",
    copy: "Kopieren",
    print: "Drucken",
    reportGeneratedNotice: "AI-Bericht wurde generiert.",
    reportSavedNotice: "Bericht wurde gespeichert.",
    reportCopiedNotice: "Bericht wurde kopiert.",
    noReportToCopy: "Es gibt noch keinen Bericht zum Kopieren.",
    reportPlaceholder:
      "Generieren Sie einen AI-Bericht. Der Entwurf kann vor dem Speichern manuell bearbeitet werden.",
    printTitle: "Klineus Dokumentationsentwurf",
    noAnswer: "keine Angabe",
    heightShort: "Größe",
    weightShort: "Gewicht",
    navHowItWorks: "Ablauf",
navClinicalValue: "Nutzen",

workflowEyebrow: "So funktioniert Klineus",
workflowTitle: "Von der Patientenantwort zur ärztlich prüfbaren Entscheidungsgrundlage.",
workflowIntro:
  "Klineus strukturiert den Indikationsprozess vor dem Arztkontakt. Patientendaten werden gezielt erhoben, anhand medizinischer Kriterien eingeordnet und für den Arzt verständlich aufbereitet.",

workflowStep1Title: "Adaptiver Patientenfragebogen",
workflowStep1Text:
  "Patientinnen und Patienten beantworten vor dem Arztkontakt, zu Hause oder im Wartezimmer, einen digitalen Fragebogen. Die Fragen orientieren sich an relevanten Leitlinienkriterien und sind patientengerecht formuliert.",

workflowStep2Title: "Leitlinienbasierte Auswertung",
workflowStep2Text:
  "Die Antworten werden automatisch strukturiert und mit hinterlegter Leitlinienlogik abgeglichen. Das System erkennt erfüllte Kriterien, offene Punkte und fehlende Informationen.",

workflowStep3Title: "Arzt-Dashboard und Epikrise-Entwurf",
workflowStep3Text:
  "Der Arzt erhält eine klare Zusammenfassung mit Patientendaten, Dokumentationshinweisen, offenen Punkten und einem vorbereiteten Entwurf für die ärztliche Dokumentation. Die Entscheidung bleibt immer beim Arzt.",

valueEyebrow: "Klinischer Nutzen",
valueTitle: "Mehr Zeit für ärztliche Entscheidung, weniger Zeitverlust durch Routinedokumentation.",
valueText:
  "Klineus adressiert den zeitintensiven Indikationsprozess in Orthopädie und Unfallchirurgie. Der Fokus liegt auf strukturierter Voraberhebung, konsistenter Leitlinienanwendung und nachvollziehbarer Dokumentation.",

valueMetric1: "Minuten Zeitersparnis pro Patient als Zielwert im Indikationsprozess.",
valueMetric2: "Leitlinienlogik für Hüft- und Knie-TEP als initialer Anwendungsbereich.",
valueMetric3: "Einmal erfassen, mehrfach nutzen: Aufnahme, Indikationsdokumentation und Berichtsentwurf.",
valueMetric4: "Weiterentwicklung vom funktionalen Prototyp zur klinisch validierten Pilotversion.",

targetEyebrow: "Zielgruppe und Skalierung",
targetTitle: "Gestartet in der Endoprothetik, skalierbar auf weitere Indikationsbereiche.",
targetText:
  "Der initiale Fokus liegt auf orthopädischen und unfallchirurgischen Einrichtungen sowie niedergelassenen Fachärzten. Besonders geeignet sind standardisierte, leitlinienbasierte Indikationsprozesse mit hohem Dokumentationsaufwand.",

targetClinicTitle: "Kliniken und Endoprothetikzentren",
targetClinicText:
  "Klineus unterstützt Einrichtungen mit hohen Fallzahlen, standardisierten Abläufen und Anforderungen an Nachvollziehbarkeit, Dokumentationsqualität und Registerfähigkeit.",

targetPracticeTitle: "Niedergelassene Fachärzte",
targetPracticeText:
  "Praxen profitieren von strukturierter Voraberhebung, schnellerer Fallübersicht und einer klaren Dokumentationsgrundlage vor dem Patientengespräch.",

targetFutureTitle: "Weitere Indikationsbereiche",
targetFutureText:
  "Das Prinzip lässt sich auf weitere Bereiche in Orthopädie, Unfallchirurgie und perspektivisch andere medizinische Fachgebiete übertragen.",

teamBusinessTitle: "Geschäftsmodell und Umsetzung",
teamBusinessText:
  "Das Team verbindet betriebswirtschaftliche Erfahrung in Strategie, Vertrieb, Marketing und Finanzierung mit dem Ziel, Klineus als skalierbares Health-Tech-Produkt aufzubauen.",

teamMedicalTitle: "Medizinische und klinische Expertise",
teamMedicalText:
  "Die medizinische Seite verantwortet die Übersetzung von Leitlinien in klare Kriterien, die fachliche Validierung und den Austausch mit ärztlichen Anwendern und klinischen Partnern.",

teamAiTitle: "KI und Produktlogik",
teamAiText:
  "Die KI unterstützt die Strukturierung, Auswertung und Dokumentationsvorbereitung. Sie ersetzt keine ärztliche Entscheidung, sondern liefert eine prüfbare Grundlage für den Arzt.",
  },

  en: {
    languageName: "English",
      navProduct: "Product",
navTeam: "Team",
navContact: "Contact",
navLegal: "Legal",
quickLinks: "Menu",
quickProductTitle: "Klineus product",
quickProductText: "One system for intake, physician review and documentation.",
quickDoctorTitle: "Doctor dashboard",
quickDoctorText: "The central workspace for physician review.",
quickContactTitle: "Contact",
quickContactText: "Send a pilot, partnership or feedback request.",

learnProduct: "View product",
contactUs: "Contact us",

homeCard1Title: "Patient intake before the appointment",
homeCard1Text: "Patients provide relevant information in a structured way before the consultation.",
homeCard2Title: "Guideline-based structuring",
homeCard2Text: "Klineus organizes answers around medical criteria and highlights open points.",
homeCard3Title: "Physician review and documentation",
homeCard3Text: "The doctor receives a clear dashboard with flags and a documentation draft.",

homeCtaEyebrow: "Pilot and partnership",
homeCtaTitle: "Klineus is being developed for clinical use.",
homeCtaText: "We are looking for clinical partners, feedback providers and institutions that want to improve structured indication workflows.",

productPageEyebrow: "Product",
productPageTitle: "AI-supported documentation support for orthopedics and trauma surgery.",
productPageIntro: "Klineus supports guideline-based collection, structuring and documentation of patient-related information before the consultation.",

workflowEyebrow: "How Klineus works",
workflowTitle: "A structured workflow before the consultation.",
workflowIntro: "Klineus prepares the relevant patient information before the doctor enters the consultation.",
workflowStep1Title: "Patient intake",
workflowStep1Text: "Patients complete a guided Knee TEP questionnaire at home or in the waiting room.",
workflowStep2Title: "Guideline logic",
workflowStep2Text: "Klineus structures the answers and highlights fulfilled, missing and unclear criteria.",
workflowStep3Title: "Doctor review",
workflowStep3Text: "The doctor receives a clear dashboard with flags, open points and a documentation draft.",

productSystemKicker: "One product, one workflow",
productSystemTitle: "Klineus connects patient input, physician review and documentation drafting.",
productSystemText: "The doctor dashboard is the central workspace. The patient questionnaire provides the prepared information. Internal analytics help the Klineus team improve usage and workflows.",

coreProductLabel: "Core workspace",
supportingWorkflowLabel: "Preparation",
internalInsightLabel: "Internal",
doctorProductLongTitle: "Doctor dashboard",
doctorProductLongText: "Physicians review submitted cases, patient answers, BMI, documentation flags and AI-generated draft reports. The AI output remains a draft and must be checked, edited and approved by a physician.",
patientProductLongTitle: "Patient questionnaire",
patientProductLongText: "Patients answer a guided questionnaire before the appointment. Symptoms, limitations, previous treatments, findings and risk information are structured before the consultation.",
workflowInsightTitle: "Usage and behavior analytics",
workflowInsightText: "The internal admin area is not a standalone product. It helps the Klineus team understand usage, completion time, languages and report generation.",

valueEyebrow: "Clinical value",
valueTitle: "More time for medical decision-making, less time lost to routine documentation.",
valueText: "Klineus addresses the time-intensive indication process in orthopedics and trauma surgery.",
valueMetric1: "Minutes saved per patient as a target value.",
valueMetric2: "Guideline logic for hip and knee TEP.",
valueMetric3: "Capture once, reuse multiple times.",
valueMetric4: "From prototype to clinically validated pilot version.",

targetEyebrow: "Target users",
targetTitle: "Starting in endoprosthetics, scalable to further indication areas.",
targetText: "The initial focus is orthopedic and trauma-surgery institutions as well as specialist practices.",
targetClinicTitle: "Hospitals and endoprosthetic centers",
targetClinicText: "For institutions with high case volumes, standardized workflows and traceability requirements.",
targetPracticeTitle: "Specialist practices",
targetPracticeText: "For practices that need structured pre-consultation intake and clear documentation support.",
targetFutureTitle: "Further indication areas",
targetFutureText: "The principle can be transferred to further areas in orthopedics, trauma surgery and other specialties.",

productCtaEyebrow: "Next step",
productCtaTitle: "Would you like to explore Klineus as a pilot partner?",
productCtaText: "Contact us for exchange, feedback or pilot discussions.",

teamPageEyebrow: "Team",
teamPageTitle: "A complementary team across business, medicine and technology.",
teamPageIntro: "Klineus combines AI-supported process automation with a concrete clinical need.",
teamBusinessTitle: "Business model and execution",
teamBusinessText: "The team brings experience in strategy, sales, marketing and finance to build Klineus as a scalable health-tech product.",
teamMedicalTitle: "Medical and clinical expertise",
teamMedicalText: "The medical side is responsible for translating guidelines into clear criteria, validating content and working with clinical users.",
teamAiTitle: "AI and product logic",
teamAiText: "AI supports structuring, evaluation and documentation preparation. It does not replace physician decision-making.",
teamMissionEyebrow: "Mission",
teamMissionTitle: "Less routine documentation, more focus on the doctor-patient conversation.",
teamMissionText1: "Klineus aims to make the indication process more traceable, consistent and efficient.",
teamMissionText2: "The product is developed with clinical feedback and aligned with real-world care workflows.",

contactEyebrow: "Contact",
contactTitle: "Interested in Klineus?",
contactText: "Contact us for pilot discussions, partnership or feedback.",
contactEmail: "Email",
contactLocation: "Location",
contactUseCase: "Use case",
contactUseCaseValue: "Knee TEP documentation support",
contactName: "Name",
contactNamePlaceholder: "Your name",
contactOrganization: "Organization",
contactOrganizationPlaceholder: "Clinic, practice or company",
contactMessage: "Message",
contactMessagePlaceholder: "Tell us how you would like to use Klineus.",
contactSubmit: "Send message",
contactPrototypeAlert: "Thank you. This is a prototype contact form. Backend submission will be connected later.",

termsEyebrow: "Legal",
termsTitle: "Prototype terms, privacy and clinical boundary.",
termsIntro: "These contents are placeholders and must be legally reviewed before production use.",
terms1Title: "1. Prototype status",
terms1Text: "Klineus is currently a prototype for demonstration, validation and internal testing.",
terms2Title: "2. No medical decision-making",
terms2Text: "Klineus does not provide diagnoses, final treatment decisions or surgery recommendations.",
terms3Title: "3. Data handling",
terms3Text: "The prototype is designed around anonymous case IDs and avoids direct identifiers in AI prompts.",
terms4Title: "4. AI-generated drafts",
terms4Text: "AI-generated text is documentation draft only and must be reviewed by a physician.",
terms5Title: "5. Availability",
terms5Text: "Prototype services may change, be interrupted or be removed.",
terms6Title: "6. Contact",
terms6Text: "Questions about the prototype, partnerships or evaluation access can be sent through the contact form.",
    otherLanguageName: "Deutsch",
    prototypePill: "Knee TEP Prototype",
    toggleLabel: "Language",

    products: "Product",
    navOurGoal: "Our goal",
    navOurTeam: "Our team",
    navContact: "Contact",
    navTerms: "Terms",

    landingEyebrow: "Orthopedic documentation support",
    landingTitle: "Klineus",
    landingDescription:
      "Web-based prototype for structured Knee TEP questionnaires and physician-reviewed documentation drafts.",
    landingDisclaimer:
      "This prototype does not replace medical judgment and does not provide autonomous diagnosis or treatment recommendations.",

    startPatientQuestionnaire: "Start patient questionnaire",
    openDoctorDashboard: "Open doctor dashboard",
    adminPanel: "Admin area",

    productDoctorText: "Central workspace for case review and report drafts.",
    productPatientText: "Structured preparation before the consultation.",
    workflowInsightShortText: "Internal analytics for improving the Klineus workflow.",

    productsSectionKicker: "Product",
    productsSectionTitle: "One Klineus product for structured Knee TEP documentation.",
    productsSectionText:
      "Klineus connects patient-reported information, physician review and AI-supported documentation drafts in one workflow. The doctor dashboard is the central workspace; the patient questionnaire prepares the information before the consultation.",

    coreProductLabel: "Core workspace for physicians",
    supportingWorkflowLabel: "Preparation by patients",
    internalInsightLabel: "Internal insight",

    doctorProductLongTitle: "Doctor dashboard",
    doctorProductLongText:
      "The doctor dashboard is the most important workspace in Klineus. Physicians review submitted cases, patient answers, BMI, documentation flags and AI-generated draft reports there. The AI output remains a draft and must be checked, edited and approved by a physician.",

    patientProductLongTitle: "Patient questionnaire",
    patientProductLongText:
      "Patients answer a guided Knee TEP questionnaire before the appointment. This means relevant symptoms, limitations, previous treatments, findings and risk information are already structured before the medical consultation.",

    workflowInsightTitle: "Usage and behavior analytics",
    workflowInsightText:
      "The internal admin area is not a standalone product. It helps the Klineus team understand usage, completion time, languages, question count and report generation so the workflow can be improved over time.",

    ourGoalEyebrow: "Our goal",
    ourGoalTitle: "Prepare better medical conversations before the patient enters the room.",
    ourGoalText1:
      "Our goal is to support orthopedic teams with structured, physician-reviewed documentation. Klineus helps collect relevant patient-reported information early, reduce repetitive intake work and make the consultation more focused.",
    ourGoalText2:
      "The product does not replace medical judgment. It does not diagnose, make treatment decisions or recommend surgery. It helps organize information so that physicians can review, edit and approve the documentation.",

    ourTeamEyebrow: "Our team",
    ourTeamTitle: "Built around healthcare, product quality and responsible AI.",
    teamMedicalTitle: "Medical advisors",
    teamMedicalText:
      "Placeholder text: Orthopedic specialists help shape the questionnaire structure, documentation boundaries and physician-review workflow.",
    teamProductTitle: "Product experience",
    teamProductText:
      "Placeholder text: The product team focuses on simple patient interaction, readable UI, accessibility and clear separation between patient, doctor and internal administration areas.",
    teamAiTitle: "Responsible AI",
    teamAiText:
      "Placeholder text: AI is used only for draft documentation support. Direct identifiers are excluded from AI prompts where possible, and outputs require medical review.",

    contactEyebrow: "Contact us",
    contactTitle: "Interested in Klineus?",
    contactText:
      "Use this prototype contact form to collect early interest. Later, this can be connected to your backend, CRM, email service or support inbox.",
    contactEmail: "Email",
    contactLocation: "Location",
    contactUseCase: "Use case",
    contactUseCaseValue: "Knee TEP documentation support",
    contactName: "Name",
    contactNamePlaceholder: "Your name",
    contactOrganization: "Organization",
    contactOrganizationPlaceholder: "Clinic, practice or company",
    contactMessage: "Message",
    contactMessagePlaceholder: "Tell us how you would like to use Klineus.",
    contactSubmit: "Send message",
    contactPrototypeAlert:
      "Thank you. This is a prototype contact form. Backend submission will be connected later.",

    termsEyebrow: "Terms and conditions",
    termsTitle: "Prototype terms, privacy and clinical boundary.",
    terms1Title: "1. Prototype status",
    terms1Text:
      "Placeholder terms: Klineus is currently a prototype for demonstration, validation and internal testing. It should not be treated as a certified medical device or production clinical system.",
    terms2Title: "2. No medical decision-making",
    terms2Text:
      "Placeholder terms: Klineus does not provide diagnoses, final treatment decisions or surgery recommendations. All outputs must be reviewed, edited and approved by a qualified physician.",
    terms3Title: "3. Data handling",
    terms3Text:
      "Placeholder terms: The prototype is designed around anonymous case IDs and avoids direct identifiers in AI prompts. Production use requires appropriate legal, privacy, security and clinical compliance review.",
    terms4Title: "4. AI-generated drafts",
    terms4Text:
      "Placeholder terms: AI-generated text is a documentation draft only. The physician remains responsible for checking correctness, completeness, context and suitability before use.",
    terms5Title: "5. Availability",
    terms5Text:
      "Placeholder terms: Prototype services may change, be interrupted or be removed without notice. No uptime, support or clinical availability commitment is provided at this stage.",
    terms6Title: "6. Contact",
    terms6Text:
      "Placeholder terms: Questions about the prototype, partnerships or evaluation access can be sent through the contact form above.",

    patientStartEyebrow: "Patient questionnaire",
    patientStartTitle: "Questions about your knee symptoms",
    patientIntro1: "You will answer a few questions about your knee symptoms.",
    patientIntro2: "Your answers help prepare the doctor consultation.",
    patientIntro3: "This is not a diagnosis. Your doctor will review all information.",
    startQuestionnaire: "Start questionnaire",
    doneTitle: "Thank you.",
    doneText: "Your information has been submitted and will be reviewed by the doctor.",
    home: "Home",
    back: "Back",
    next: "Next",
    submit: "Submit",
    answerRequired: "Please answer the question before continuing.",
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
    emptyCasesText: "After a patient questionnaire is submitted, the case will appear here.",
    caseId: "Case ID",
    created: "Created",
    updated: "Updated",
    indication: "Indication",
    status: "Status",
    report: "Report",
    openCase: "Open case",
    kneeTep: "Knee TEP",
    completed: "completed",
    pending: "pending",
    notGenerated: "not generated",
    generated: "generated",
    edited: "edited",
    backToDashboard: "Back to dashboard",
    kneeCase: "Knee TEP case",
    deleteCase: "Delete case",
    deleteConfirm: "Delete this anonymous case?",
    loadingCase: "Loading case.",
    caseNotFound: "Case not found.",
    patientAnswers: "Patient answers",
    documentationFlags: "Documentation flags",
    aiReport: "AI report",
    generateAiReport: "Generate AI report",
    save: "Save",
    copy: "Copy",
    print: "Print",
    reportGeneratedNotice: "AI report was generated.",
    reportSavedNotice: "Report was saved.",
    reportCopiedNotice: "Report was copied.",
    noReportToCopy: "There is no report to copy yet.",
    reportPlaceholder:
      "Generate an AI report. The draft can be edited manually before saving.",
    printTitle: "Klineus documentation draft",
    noAnswer: "not provided",
    heightShort: "Height",
    weightShort: "Weight",
    navHowItWorks: "Workflow",
navClinicalValue: "Value",

workflowEyebrow: "How Klineus works",
workflowTitle: "From patient answers to a physician-reviewable decision basis.",
workflowIntro:
  "Klineus structures the indication process before the medical consultation. Patient data is collected in a targeted way, mapped against medical criteria and prepared clearly for physician review.",

workflowStep1Title: "Adaptive patient questionnaire",
workflowStep1Text:
  "Patients complete a digital questionnaire before the consultation, either at home or in the waiting room. The questions are based on relevant guideline criteria and written in patient-friendly language.",

workflowStep2Title: "Guideline-based evaluation",
workflowStep2Text:
  "The answers are automatically structured and compared with embedded guideline logic. The system identifies fulfilled criteria, open points and missing information.",

workflowStep3Title: "Doctor dashboard and epikrisis draft",
workflowStep3Text:
  "The physician receives a clear summary with patient data, documentation flags, open points and a prepared draft for medical documentation. The final decision always remains with the physician.",

valueEyebrow: "Clinical value",
valueTitle: "More time for medical decision-making, less time lost to routine documentation.",
valueText:
  "Klineus addresses the time-intensive indication process in orthopedics and trauma surgery. The focus is structured pre-consultation intake, consistent guideline use and traceable documentation.",

valueMetric1: "Minutes saved per patient as target value in the indication process.",
valueMetric2: "Guideline logic for hip and knee TEP as the initial application area.",
valueMetric3: "Capture once, reuse multiple times: intake, indication documentation and report draft.",
valueMetric4: "Development from functional prototype to clinically validated pilot version.",

targetEyebrow: "Target users and scaling",
targetTitle: "Starting in endoprosthetics, scalable to further indication areas.",
targetText:
  "The initial focus is orthopedic and trauma-surgery institutions as well as specialist practices. Klineus is especially suitable for standardized, guideline-based indication processes with high documentation effort.",

targetClinicTitle: "Hospitals and endoprosthetic centers",
targetClinicText:
  "Klineus supports institutions with high case volume, standardized processes and requirements for traceability, documentation quality and registry readiness.",

targetPracticeTitle: "Specialist practices",
targetPracticeText:
  "Practices benefit from structured pre-consultation intake, faster case overview and a clear documentation basis before the patient conversation.",

targetFutureTitle: "Further indication areas",
targetFutureText:
  "The principle can be transferred to further areas in orthopedics, trauma surgery and, in perspective, other medical specialties.",

teamBusinessTitle: "Business model and execution",
teamBusinessText:
  "The team combines business experience in strategy, sales, marketing and finance with the goal of building Klineus as a scalable health-tech product.",

teamMedicalTitle: "Medical and clinical expertise",
teamMedicalText:
  "The medical side is responsible for translating guidelines into clear criteria, validating the content and working with physicians and clinical partners.",

teamAiTitle: "AI and product logic",
teamAiText:
  "AI supports structuring, evaluation and documentation preparation. It does not replace physician decision-making, but provides a reviewable basis for the doctor.",
  },
};

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved === "en" ? "en" : "de";
  });

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, language);
    document.documentElement.lang = language;
  }, [language]);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      toggleLanguage: () => setLanguage((current) => (current === "de" ? "en" : "de")),
      t: (key) => translations[language][key] || translations.de[key] || key,
      translateFlag: (flag) => {
        const translated = flagTranslations[flag.title]?.[language];

        if (!translated) {
          return flag;
        }

        let description = translated.description || flag.description;

        if (flag.title.includes("BMI") && flag.description) {
          const match = flag.description.match(/BMI von ([0-9.]+)/);
          const bmi = match?.[1];

          if (language === "en" && bmi) {
            description =
              flag.title === "BMI ab 40 berechnet"
                ? `A BMI of ${bmi} was calculated from the answers. Requires physician review.`
                : `A BMI of ${bmi} was calculated from the answers. Review as modifiable risk information.`;
          }
        }

        return { ...flag, title: translated.title, description };
      },
    }),
    [language]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error("useLanguage must be used inside LanguageProvider");
  }

  return context;
}