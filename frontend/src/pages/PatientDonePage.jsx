import { Link, useParams } from "react-router-dom";

import AppShell from "../components/AppShell.jsx";
import { useLanguage } from "../i18n/LanguageContext.jsx";

const copy = {
  de: {
    eyebrow: "Übermittlung abgeschlossen",
    title: "Vielen Dank. Ihre Angaben wurden übermittelt.",
    lead:
      "Ihre Antworten wurden gespeichert und stehen der Ärztin oder dem Arzt zur Prüfung zur Verfügung.",
    caseLabel: "Fall-ID",
    backHome: "Zur Startseite",
  },
  en: {
    eyebrow: "Submission completed",
    title: "Thank you. Your answers have been submitted.",
    lead:
      "Your answers have been saved and are available for the doctor to review.",
    caseLabel: "Case ID",
    backHome: "Go to homepage",
  },
};

export default function PatientDonePage() {
  const { caseId } = useParams();
  const { language } = useLanguage();
  const text = copy[language] || copy.de;

  return (
    <AppShell compact hideNav>
      <section className="patient-card patient-done-card">
        <div className="success-mark" aria-hidden="true">
          ✓
        </div>

        <p className="eyebrow">{text.eyebrow}</p>

        <h1>{text.title}</h1>

        <p>{text.lead}</p>

        {caseId ? (
          <div className="case-id-card">
            <span>{text.caseLabel}</span>
            <strong>{caseId}</strong>
          </div>
        ) : null}

        <div className="patient-start-actions">
          <Link className="primary-button full-width" to="/home">
            {text.backHome}
          </Link>
        </div>
      </section>
    </AppShell>
  );
}