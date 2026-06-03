import { Link } from "react-router-dom";

import AppShell from "../components/AppShell.jsx";
import { useLanguage } from "../i18n/LanguageContext.jsx";

export default function PatientDonePage() {
  const { t } = useLanguage();

  return (
    <AppShell compact>
      <section className="patient-card done-card">
        <div className="success-mark">✓</div>
        <h1>{t("doneTitle")}</h1>
        <p>{t("doneText")}</p>
        <Link className="secondary-button full-width" to="/">
          {t("home")}
        </Link>
      </section>
    </AppShell>
  );
}
