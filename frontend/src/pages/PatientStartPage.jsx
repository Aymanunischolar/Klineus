import { Link } from "react-router-dom";

import AppShell from "../components/AppShell.jsx";
import { useLanguage } from "../i18n/LanguageContext.jsx";

export default function PatientStartPage() {
  const { t } = useLanguage();

  return (
    <AppShell compact>
      <section className="patient-card">
        <p className="eyebrow">{t("patientStartEyebrow")}</p>
        <h1>{t("patientStartTitle")}</h1>
        <div className="intro-copy">
          <p>{t("patientIntro1")}</p>
          <p>{t("patientIntro2")}</p>
          <p>{t("patientIntro3")}</p>
        </div>
        <Link className="primary-button full-width" to="/patient/questionnaire">
          {t("startQuestionnaire")}
        </Link>
      </section>
    </AppShell>
  );
}
