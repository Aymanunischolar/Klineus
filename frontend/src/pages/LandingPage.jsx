import { Link } from "react-router-dom";

import AppShell from "../components/AppShell.jsx";
import { useLanguage } from "../i18n/LanguageContext.jsx";

export default function LandingPage() {
  const { t } = useLanguage();

  return (
    <AppShell>
      <section className="landing-grid">
        <div className="landing-copy">
          <p className="eyebrow">{t("landingEyebrow")}</p>
          <h1>{t("landingTitle")}</h1>
          <p>{t("landingDescription")}</p>
          <p className="disclaimer">{t("landingDisclaimer")}</p>

          <div className="button-row">
            <Link className="primary-button" to="/product">
              {t("learnProduct")}
            </Link>
            <Link className="secondary-button" to="/doctor/login">
              {t("openDoctorDashboard")}
            </Link>
            <Link className="secondary-button" to="/patient/start">
              {t("startPatientQuestionnaire")}
            </Link>
          </div>
        </div>

        <div className="medical-panel" aria-hidden="true">
          <div className="panel-line wide" />
          <div className="panel-line" />
          <div className="panel-line short" />
          <div className="panel-chart">
            <span />
            <span />
            <span />
          </div>
        </div>
      </section>

      <section className="home-summary-section">
        <article>
          <span>01</span>
          <h2>{t("homeCard1Title")}</h2>
          <p>{t("homeCard1Text")}</p>
        </article>

        <article>
          <span>02</span>
          <h2>{t("homeCard2Title")}</h2>
          <p>{t("homeCard2Text")}</p>
        </article>

        <article>
          <span>03</span>
          <h2>{t("homeCard3Title")}</h2>
          <p>{t("homeCard3Text")}</p>
        </article>
      </section>

      <section className="home-cta-section">
        <div>
          <p className="eyebrow">{t("homeCtaEyebrow")}</p>
          <h2>{t("homeCtaTitle")}</h2>
          <p>{t("homeCtaText")}</p>
        </div>

        <Link className="primary-button" to="/contact">
          {t("contactUs")}
        </Link>
      </section>
    </AppShell>
  );
}