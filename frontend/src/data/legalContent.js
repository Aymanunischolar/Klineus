// Text of the Impressum, privacy notice and AI section, in German and English.
// Each block: { heading, paragraphs?: string[], items?: string[] }.
// The Impressum "provider" block is generated from data/operator.js, not from here.

export const legalContent = {
  de: {
    imprint: {
      title: "Impressum",
      intro: "Angaben zum Anbieter und zur Kontaktaufnahme gemäß § 5 DDG.",
      blocks: [
        {
          heading: "Kontakt",
          paragraphs: ["E-Mail: {email}"],
        },
        {
          heading: "Medizinischer Hinweis",
          paragraphs: [
            "Klineus dient der Strukturierung und Vorbereitung von Patientenangaben für das ärztliche Gespräch. Es ersetzt keine ärztliche Untersuchung, Diagnose oder Beratung. In einem Notfall wählen Sie bitte den Notruf 112.",
          ],
        },
        {
          heading: "Haftung für Inhalte und Links",
          paragraphs: [
            "Wir erstellen die Inhalte dieser Website mit Sorgfalt, übernehmen aber keine Gewähr für Vollständigkeit, Richtigkeit und Aktualität. Für die Inhalte verlinkter externer Seiten sind ausschließlich deren Betreiber verantwortlich.",
          ],
        },
      ],
    },

    privacy: {
      title: "Datenschutzerklärung",
      intro:
        "Der Schutz Ihrer Daten, besonders Ihrer Gesundheitsdaten, ist uns wichtig. Diese Erklärung zeigt, welche Daten bei der Nutzung von Klineus verarbeitet werden, wofür das geschieht und welche Rechte Sie haben. Stand: {updated}.",
      blocks: [
        {
          heading: "1. Wer ist verantwortlich?",
          paragraphs: [
            "Für den Besuch dieser Website und für Anfragen an uns ist Klineus verantwortlich (Kontaktdaten siehe Impressum).",
            "Für die Angaben, die Sie als Patientin oder Patient im Fragebogen machen, ist die Praxis oder Einrichtung verantwortlich, die Sie eingeladen hat. Klineus verarbeitet diese Daten ausschließlich im Auftrag und nach Weisung der Praxis (Auftragsverarbeitung nach Art. 28 DSGVO). Bei Fragen zu Ihren Patientendaten wenden Sie sich bitte zuerst an Ihre Praxis.",
          ],
        },
        {
          heading: "2. Welche Daten verarbeiten wir?",
          items: [
            "Beim Besuch der Website: technisch notwendige Verbindungsdaten wie Zeitpunkt, aufgerufene Seite, Antwortstatus und Dauer der Anfrage. Die IP-Adresse wird vom Hosting-Anbieter zur Auslieferung und Absicherung der Seite verarbeitet.",
            "Bei der Einladung durch die Praxis: Vorname, Nachname, optional Alter, E-Mail-Adresse, Versicherungsnummer, Termin und der gewählte Fragebogen (z. B. Knie oder Hüfte).",
            "Im Fragebogen: Ihre Antworten zu Beschwerden, Vorerkrankungen, Behandlungen und Risikofaktoren. Das sind Gesundheitsdaten, eine besondere Kategorie personenbezogener Daten (Art. 9 DSGVO).",
            "Für Ärztinnen, Ärzte und Praxispersonal: Benutzername, Rolle und ein Passwort, das nur als verschlüsselter Hash gespeichert wird.",
            "Bei Kontakt per E-Mail: die Angaben in Ihrer Nachricht.",
          ],
        },
        {
          heading: "3. Wofür und auf welcher Grundlage?",
          items: [
            "Ausfüllen des Fragebogens und Vorbereitung des ärztlichen Gesprächs: im Auftrag der Praxis. Deren Rechtsgrundlage ist die Gesundheitsversorgung (Art. 6 Abs. 1 lit. b und Art. 9 Abs. 2 lit. h DSGVO) oder, soweit die Praxis sie einholt, Ihre Einwilligung (Art. 9 Abs. 2 lit. a DSGVO).",
            "Betrieb, Sicherheit und Fehleranalyse der Website sowie interne Auswertungen ohne Personenbezug, zum Beispiel die durchschnittliche Ausfülldauer: berechtigtes Interesse (Art. 6 Abs. 1 lit. f DSGVO).",
            "Zugang für Praxispersonal: Vertragserfüllung (Art. 6 Abs. 1 lit. b DSGVO).",
            "Beantwortung von Anfragen: Art. 6 Abs. 1 lit. b oder lit. f DSGVO.",
          ],
          paragraphs2: [
            "Ihre Angaben im Fragebogen sind freiwillig. Ohne sie kann die Praxis Ihr Gespräch jedoch unter Umständen weniger gut vorbereiten.",
          ],
        },
        {
          heading: "4. Wer erhält Ihre Daten?",
          paragraphs: [
            "Ihre Angaben sehen nur berechtigte Personen der Praxis, die Sie eingeladen hat. Für den technischen Betrieb setzt Klineus Dienstleister ein, und zwar nur auf Grundlage von Auftragsverarbeitungsverträgen nach Art. 28 DSGVO:",
          ],
          items: [
            "Hosting der Anwendung: Vercel Inc. (Server-Region Frankfurt, Deutschland).",
            "Datenbank: Neon, Inc. (Region Frankfurt, Deutschland).",
            "Versand von E-Mails (Einladung, Erinnerung): ein E-Mail-Dienstleister.",
            "Erzeugung von QR-Codes: ein externer QR-Code-Dienst erhält dafür den persönlichen Einladungslink.",
          ],
          paragraphs2: [
            "Eine Verarbeitung durch Unternehmen mit Sitz außerhalb der EU (zum Beispiel in den USA) kann bei diesen Anbietern nicht ausgeschlossen werden. Sie erfolgt nur mit geeigneten Garantien, etwa auf Grundlage eines Angemessenheitsbeschlusses (EU-US Data Privacy Framework) oder von Standardvertragsklauseln (Art. 44 ff. DSGVO).",
          ],
        },
        {
          heading: "5. Wie lange speichern wir Daten?",
          paragraphs: [
            "Patientendaten speichern wir so lange, wie die verantwortliche Praxis es anweist, und löschen sie auf deren Weisung. Gesetzliche Aufbewahrungspflichten der Praxis bleiben unberührt. Technische Protokolle bewahren wir nur so lange auf, wie es für Betrieb und Sicherheit erforderlich ist. E-Mail-Anfragen löschen wir, sobald sie erledigt sind und keine Aufbewahrungspflicht besteht.",
          ],
        },
        {
          heading: "6. Cookies und Tracking",
          paragraphs: [
            "Klineus verwendet keine Werbe- oder Tracking-Cookies und keine Analysedienste von Drittanbietern. Es werden keine externen Schriftarten nachgeladen. Der Speicher Ihres Browsers wird nur technisch notwendig genutzt, zum Beispiel für Ihre Spracheinstellung, den Fortschritt im Fragebogen und die Anmeldung von Praxispersonal. Dafür ist nach § 25 Abs. 2 TDDDG keine Einwilligung erforderlich.",
          ],
        },
        {
          heading: "7. Datensicherheit",
          paragraphs: [
            "Daten werden verschlüsselt übertragen (TLS). Der Zugriff ist rollenbasiert beschränkt, Passwörter werden nur als Hash gespeichert, und Patientinnen und Patienten erhalten einen persönlichen, nicht erratbaren Einladungslink. Wir entwickeln die technischen und organisatorischen Maßnahmen fortlaufend weiter (Art. 32 DSGVO).",
          ],
        },
        {
          heading: "8. Ihre Rechte",
          paragraphs: ["Sie haben das Recht auf:"],
          items: [
            "Auskunft über Ihre Daten (Art. 15 DSGVO)",
            "Berichtigung unrichtiger Daten (Art. 16 DSGVO)",
            "Löschung (Art. 17 DSGVO)",
            "Einschränkung der Verarbeitung (Art. 18 DSGVO)",
            "Datenübertragbarkeit (Art. 20 DSGVO)",
            "Widerspruch gegen eine Verarbeitung auf Grundlage berechtigter Interessen (Art. 21 DSGVO)",
            "Widerruf einer erteilten Einwilligung mit Wirkung für die Zukunft (Art. 7 Abs. 3 DSGVO)",
          ],
          paragraphs2: [
            "Bei Patientendaten richten Sie Ihre Anfrage bitte an Ihre Praxis; wir unterstützen sie dabei. Anfragen zur Website und zu Kontaktdaten richten Sie an {email}.",
          ],
        },
        {
          heading: "9. Beschwerderecht",
          paragraphs: [
            "Sie können sich bei der zuständigen Datenschutz-Aufsichtsbehörde beschweren (Art. 77 DSGVO), zum Beispiel am Ort Ihres Wohnsitzes.",
          ],
        },
        {
          heading: "10. Änderungen",
          paragraphs: [
            "Wir passen diese Erklärung an, wenn sich Funktionen oder die Rechtslage ändern. Die jeweils aktuelle Fassung finden Sie auf dieser Seite.",
          ],
        },
      ],
    },

    ai: {
      title: "KI-Nutzung, Datenschutz und Governance",
      intro:
        "Transparenz über den Einsatz Künstlicher Intelligenz (KI) ist uns wichtig, gerade bei Gesundheitsdaten.",
      blocks: [
        {
          heading: "Aktueller Stand",
          paragraphs: [
            "Klineus verwendet derzeit kein KI-Modell, das Patientendaten verarbeitet. Die Ampel-Einschätzung und der Entwurf des Arztbriefs entstehen durch festgelegte, nachvollziehbare Regeln und Textbausteine. Patientendaten werden nicht an KI-Anbieter übermittelt und nicht zum Training von KI-Modellen verwendet.",
          ],
        },
        {
          heading: "Ärztliche Verantwortung",
          items: [
            "Klineus stellt keine Diagnose und trifft keine Behandlungsentscheidung.",
            "Ampel und Arztbrief sind Hinweise und Entwürfe. Die Ärztin oder der Arzt prüft, ändert und gibt sie frei.",
            "Es gibt keine ausschließlich automatisierte Entscheidung mit rechtlicher oder ähnlich erheblicher Wirkung (Art. 22 DSGVO).",
          ],
        },
        {
          heading: "Unsere Grundsätze, falls KI-Funktionen eingeführt werden",
          items: [
            "Wir informieren vorab und aktualisieren diese Seite.",
            "Vor dem Einsatz führen wir eine Datenschutz-Folgenabschätzung durch (Art. 35 DSGVO).",
            "Datenminimierung: Direkte Identifikatoren wie Name, E-Mail-Adresse und Versicherungsnummer werden nicht an KI-Dienste übergeben.",
            "Wir nutzen nur Anbieter mit Auftragsverarbeitungsvertrag und mit Verarbeitung in der EU oder mit geeigneten Garantien.",
            "Patientendaten werden nicht zum Training von KI-Modellen verwendet.",
            "KI-generierte Inhalte werden als solche gekennzeichnet.",
            "Wir protokollieren den Einsatz und prüfen die Ergebnisse laufend auf Fehler und Verzerrungen.",
          ],
        },
        {
          heading: "Rechtlicher Rahmen",
          paragraphs: [
            "Wir beachten die DSGVO und die europäische KI-Verordnung (Verordnung (EU) 2024/1689), insbesondere die Anforderungen an Transparenz und KI-Kompetenz. Ob eine Funktion als Medizinprodukt (Verordnung (EU) 2017/745) oder als Hochrisiko-KI-System einzustufen ist, prüfen wir vor jedem Einsatz. Klineus ist derzeit als Hilfsmittel zur Strukturierung und Vorbereitung von Patientenangaben gedacht.",
          ],
        },
        {
          heading: "Fragen",
          paragraphs: ["Fragen zur KI-Nutzung und zum Datenschutz richten Sie bitte an {email}."],
        },
      ],
    },
  },

  en: {
    imprint: {
      title: "Imprint",
      intro: "Provider and contact details pursuant to § 5 DDG (German Digital Services Act).",
      blocks: [
        {
          heading: "Contact",
          paragraphs: ["Email: {email}"],
        },
        {
          heading: "Medical notice",
          paragraphs: [
            "Klineus helps structure and prepare patient information for the consultation. It does not replace a medical examination, diagnosis or advice. In an emergency, please call 112.",
          ],
        },
        {
          heading: "Liability for content and links",
          paragraphs: [
            "We prepare the content of this website with care but give no guarantee that it is complete, correct or up to date. The operators of linked external sites are solely responsible for their content.",
          ],
        },
      ],
    },

    privacy: {
      title: "Privacy Notice",
      intro:
        "Protecting your data, especially your health data, matters to us. This notice explains which data is processed when you use Klineus, why, and what rights you have. Last updated: {updated}.",
      blocks: [
        {
          heading: "1. Who is responsible?",
          paragraphs: [
            "Klineus is responsible for visits to this website and for enquiries sent to us (see the imprint for contact details).",
            "For the answers you give as a patient in the questionnaire, the practice or institution that invited you is responsible (the controller). Klineus processes this data only on behalf of and on the instructions of the practice (processing under Art. 28 GDPR). If you have questions about your patient data, please contact your practice first.",
          ],
        },
        {
          heading: "2. Which data do we process?",
          items: [
            "When you visit the website: technically necessary connection data such as time, page requested, response status and duration. Your IP address is processed by the hosting provider to deliver and secure the site.",
            "When the practice invites you: first name, surname, optionally age, email address, insurance number, appointment and the chosen questionnaire (for example knee or hip).",
            "In the questionnaire: your answers about symptoms, previous conditions, treatments and risk factors. This is health data, a special category of personal data (Art. 9 GDPR).",
            "For doctors and practice staff: username, role and a password stored only as an encrypted hash.",
            "When you contact us by email: the details in your message.",
          ],
        },
        {
          heading: "3. Why, and on what legal basis?",
          items: [
            "Completing the questionnaire and preparing the consultation: on behalf of the practice. Its legal basis is healthcare provision (Art. 6(1)(b) and Art. 9(2)(h) GDPR) or, where the practice obtains it, your consent (Art. 9(2)(a) GDPR).",
            "Operating and securing the website, analysing errors, and internal statistics without personal reference, such as average completion time: legitimate interest (Art. 6(1)(f) GDPR).",
            "Access for practice staff: performance of a contract (Art. 6(1)(b) GDPR).",
            "Answering enquiries: Art. 6(1)(b) or (f) GDPR.",
          ],
          paragraphs2: [
            "Your answers in the questionnaire are voluntary. Without them, however, the practice may be less able to prepare your consultation.",
          ],
        },
        {
          heading: "4. Who receives your data?",
          paragraphs: [
            "Only authorised people at the practice that invited you can see your answers. For technical operation, Klineus uses service providers, and only on the basis of data processing agreements under Art. 28 GDPR:",
          ],
          items: [
            "Application hosting: Vercel Inc. (server region Frankfurt, Germany).",
            "Database: Neon, Inc. (region Frankfurt, Germany).",
            "Sending emails (invitation, reminder): an email service provider.",
            "Generating QR codes: an external QR code service receives the personal invitation link for this purpose.",
          ],
          paragraphs2: [
            "Processing by companies based outside the EU (for example in the USA) cannot be ruled out for these providers. It takes place only with appropriate safeguards, such as an adequacy decision (EU-US Data Privacy Framework) or standard contractual clauses (Art. 44 et seq. GDPR).",
          ],
        },
        {
          heading: "5. How long do we store data?",
          paragraphs: [
            "We store patient data for as long as the responsible practice instructs and delete it on its instruction. Statutory retention duties of the practice remain unaffected. We keep technical logs only as long as needed for operation and security. We delete email enquiries once they are dealt with and no retention duty applies.",
          ],
        },
        {
          heading: "6. Cookies and tracking",
          paragraphs: [
            "Klineus does not use advertising or tracking cookies and no third-party analytics. No external fonts are loaded. Your browser's storage is used only where technically necessary, for example for your language setting, your progress in the questionnaire and staff sign-in. No consent is required for this under § 25(2) TDDDG.",
          ],
        },
        {
          heading: "7. Data security",
          paragraphs: [
            "Data is transmitted encrypted (TLS). Access is restricted by role, passwords are stored only as hashes, and patients receive a personal invitation link that cannot be guessed. We keep developing our technical and organisational measures (Art. 32 GDPR).",
          ],
        },
        {
          heading: "8. Your rights",
          paragraphs: ["You have the right to:"],
          items: [
            "access your data (Art. 15 GDPR)",
            "have inaccurate data corrected (Art. 16 GDPR)",
            "erasure (Art. 17 GDPR)",
            "restriction of processing (Art. 18 GDPR)",
            "data portability (Art. 20 GDPR)",
            "object to processing based on legitimate interests (Art. 21 GDPR)",
            "withdraw consent you have given, with effect for the future (Art. 7(3) GDPR)",
          ],
          paragraphs2: [
            "For patient data, please send your request to your practice; we support it in doing so. For website and contact data, write to {email}.",
          ],
        },
        {
          heading: "9. Right to complain",
          paragraphs: [
            "You can lodge a complaint with the competent data protection supervisory authority (Art. 77 GDPR), for example in the place where you live.",
          ],
        },
        {
          heading: "10. Changes",
          paragraphs: [
            "We update this notice when features or the legal situation change. The current version is always on this page.",
          ],
        },
      ],
    },

    ai: {
      title: "AI use, privacy and governance",
      intro:
        "Being transparent about the use of artificial intelligence (AI) matters to us, especially with health data.",
      blocks: [
        {
          heading: "Current status",
          paragraphs: [
            "Klineus currently uses no AI model that processes patient data. The traffic-light assessment and the draft doctor's letter are produced by fixed, traceable rules and text templates. Patient data is not sent to AI providers and is not used to train AI models.",
          ],
        },
        {
          heading: "Medical responsibility",
          items: [
            "Klineus does not make diagnoses and does not make treatment decisions.",
            "The traffic light and the doctor's letter are hints and drafts. The doctor reviews, edits and approves them.",
            "There is no solely automated decision with legal or similarly significant effect (Art. 22 GDPR).",
          ],
        },
        {
          heading: "Our principles if AI features are introduced",
          items: [
            "We inform you in advance and update this page.",
            "Before use, we carry out a data protection impact assessment (Art. 35 GDPR).",
            "Data minimisation: direct identifiers such as name, email address and insurance number are not passed to AI services.",
            "We use only providers with a data processing agreement and with processing in the EU or with appropriate safeguards.",
            "Patient data is not used to train AI models.",
            "AI-generated content is labelled as such.",
            "We log the use and continuously check the results for errors and bias.",
          ],
        },
        {
          heading: "Legal framework",
          paragraphs: [
            "We comply with the GDPR and the European AI Act (Regulation (EU) 2024/1689), in particular its transparency and AI literacy requirements. Whether a function counts as a medical device (Regulation (EU) 2017/745) or a high-risk AI system is assessed before each use. Klineus is currently intended as a tool for structuring and preparing patient information.",
          ],
        },
        {
          heading: "Questions",
          paragraphs: ["Please send questions about AI use and data protection to {email}."],
        },
      ],
    },
  },
};
