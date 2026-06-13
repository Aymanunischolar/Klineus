import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";

import AppShell from "../components/AppShell.jsx";
import { useLanguage } from "../i18n/LanguageContext.jsx";

const PATIENT_DOCUMENT_CHECKLIST_STORAGE_KEY =
  "klineus_patient_document_checklist";

const copy = {
  de: {
    eyebrow: "Übermittlung abgeschlossen",
    title: "Vielen Dank. Ihre Angaben wurden gespeichert.",
    lead:
      "Ihre Antworten wurden erfolgreich übermittelt und stehen der Ärztin oder dem Arzt im Dashboard zur Prüfung zur Verfügung.",
    caseLabel: "Fall-ID",
    documentsTitle: "Bitte zum Termin mitbringen",
    documentsLead:
      "Auf Basis Ihrer Antworten empfehlen wir, folgende Unterlagen zum Termin mitzubringen.",
    fallbackDocumentTitle: "Vorhandene medizinische Unterlagen",
    fallbackDocumentDescription:
      "Falls vorhanden, bringen Sie bitte aktuelle Arztbriefe, Röntgenbilder, Befunde oder Laborwerte zum Termin mit.",
    emailNote:
      "Diese Liste wurde Ihnen zusätzlich per E-Mail gesendet, sofern Ihre E-Mail-Adresse korrekt angegeben wurde.",
    note:
      "Dies ist keine Diagnose. Die medizinische Bewertung erfolgt ausschließlich durch Ihre Ärztin oder Ihren Arzt.",
    backHome: "Zur Startseite",
    newQuestionnaire: "Weiteren Fragebogen ausfüllen",
  },
  en: {
    eyebrow: "Submission completed",
    title: "Thank you. Your answers have been saved.",
    lead:
      "Your answers were submitted successfully and are available for the doctor to review in the dashboard.",
    caseLabel: "Case ID",
    documentsTitle: "Please bring to your appointment",
    documentsLead:
      "Based on your answers, we recommend bringing the following documents to your appointment.",
    fallbackDocumentTitle: "Available medical documents",
    fallbackDocumentDescription:
      "If available, please bring current doctor letters, X-rays, findings or lab results to your appointment.",
    emailNote:
      "This list was also sent to you by email if your email address was entered correctly.",
    note:
      "This is not a diagnosis. Medical evaluation is performed only by your doctor.",
    backHome: "Go to homepage",
    newQuestionnaire: "Fill out another questionnaire",
  },
};

function readDocumentChecklist(text) {
  try {
    const rawValue = window.sessionStorage.getItem(
      PATIENT_DOCUMENT_CHECKLIST_STORAGE_KEY,
    );

    if (!rawValue) {
      return [
        {
          id: "fallback_documents",
          title: text.fallbackDocumentTitle,
          description: text.fallbackDocumentDescription,
        },
      ];
    }

    const parsedValue = JSON.parse(rawValue);

    if (!Array.isArray(parsedValue) || parsedValue.length === 0) {
      return [
        {
          id: "fallback_documents",
          title: text.fallbackDocumentTitle,
          description: text.fallbackDocumentDescription,
        },
      ];
    }

    return parsedValue;
  } catch {
    return [
      {
        id: "fallback_documents",
        title: text.fallbackDocumentTitle,
        description: text.fallbackDocumentDescription,
      },
    ];
  }
}

export default function PatientDonePage() {
  const { caseId } = useParams();
  const { language } = useLanguage();
  const text = copy[language] || copy.de;

  const documentsToBring = useMemo(() => readDocumentChecklist(text), [text]);

  return (
    <AppShell compact hideNav>
      <section className="patient-card patient-done-card">
        <p className="eyebrow">{text.eyebrow}</p>

        <h1>{text.title}</h1>

        <p>{text.lead}</p>

        {caseId ? (
          <div className="case-id-card">
            <span>{text.caseLabel}</span>
            <strong>{caseId}</strong>
          </div>
        ) : null}

        <section className="patient-documents-card">
          <div>
            <p className="eyebrow">{text.documentsTitle}</p>
            <h2>{text.documentsTitle}</h2>
            <p>{text.documentsLead}</p>
          </div>

          <div className="patient-documents-list">
            {documentsToBring.map((documentItem) => (
              <article
                className="patient-document-item"
                key={documentItem.id || documentItem.title}
              >
                <strong>{documentItem.title}</strong>

                {documentItem.description ? (
                  <p>{documentItem.description}</p>
                ) : null}
              </article>
            ))}
          </div>

          <p className="patient-email-note">{text.emailNote}</p>
        </section>

        <p className="disclaimer">{text.note}</p>

        <div className="patient-start-actions">
          <Link className="primary-button full-width" to="/patient/start">
            {text.newQuestionnaire}
          </Link>

          <Link className="secondary-button full-width" to="/home">
            {text.backHome}
          </Link>
        </div>
      </section>
    </AppShell>
  );
}