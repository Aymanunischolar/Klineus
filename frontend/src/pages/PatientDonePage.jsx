import { Link, useParams } from "react-router-dom";

import AppShell from "../components/AppShell.jsx";
import { useLanguage } from "../i18n/LanguageContext.jsx";


const copy = {
  de: {
    eyebrow: "Übermittlung abgeschlossen",
    title: "Vielen Dank. Ihre Angaben wurden gespeichert.",
    lead:
      "Ihre Antworten wurden erfolgreich übermittelt und stehen der Ärztin oder dem Arzt im Dashboard zur Prüfung zur Verfügung.",
    caseLabel: "Fall-ID",
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
    note:
      "This is not a diagnosis. Medical evaluation is performed only by your doctor.",
    backHome: "Go to homepage",
    newQuestionnaire: "Fill out another questionnaire",
  },
};


export default function PatientDonePage() {
  const { caseId } = useParams();
  const { language } = useLanguage();
  const text = copy[language] || copy.de;

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