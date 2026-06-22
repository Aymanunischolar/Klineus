import { Link } from "react-router-dom";

import AppShell from "../components/AppShell.jsx";
import { useLanguage } from "../i18n/LanguageContext.jsx";

const copy = {
  de: {
    eyebrow: "Übermittlung abgeschlossen",
    title: "Vielen Dank. Ihre Angaben wurden übermittelt.",
    lead:
      "Ihre Antworten wurden gespeichert und stehen der Ärztin oder dem Arzt zur Prüfung zur Verfügung.",
    backHome: "Zur Startseite",
  },
  en: {
    eyebrow: "Submission completed",
    title: "Thank you. Your answers have been submitted.",
    lead:
      "Your answers have been saved and are available for the doctor to review.",
    backHome: "Go to homepage",
  },
};

export default function PatientDonePage() {
  const { language } = useLanguage();
  const text = copy[language] || copy.de;

  return (
    <AppShell compact hideNav>
      <section className="patient-card patient-done-card">
        <p className="eyebrow">{text.eyebrow}</p>

        <h1>{text.title}</h1>

        <p>{text.lead}</p>

        <div className="patient-start-actions">
          <Link className="secondary-button full-width" to="/home">
            {text.backHome}
          </Link>
        </div>
      </section>
    </AppShell>
  );
}