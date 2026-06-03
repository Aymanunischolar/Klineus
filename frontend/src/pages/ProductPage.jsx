import { Link } from "react-router-dom";

import AppShell from "../components/AppShell.jsx";
import { useLanguage } from "../i18n/LanguageContext.jsx";

export default function ProductPage() {
  const { t } = useLanguage();

  return (
    <AppShell>
      <section className="page-hero">
        <p className="eyebrow">{t("productPageEyebrow")}</p>
        <h1>{t("productPageTitle")}</h1>
        <p>{t("productPageIntro")}</p>
      </section>

      <section className="workflow-section">
        <div className="section-heading-clean">
          <p className="eyebrow">{t("workflowEyebrow")}</p>
          <h2>{t("workflowTitle")}</h2>
          <p>{t("workflowIntro")}</p>
        </div>

        <div className="workflow-steps">
          <article className="workflow-step-card">
            <span>01</span>
            <h3>{t("workflowStep1Title")}</h3>
            <p>{t("workflowStep1Text")}</p>
          </article>

          <article className="workflow-step-card">
            <span>02</span>
            <h3>{t("workflowStep2Title")}</h3>
            <p>{t("workflowStep2Text")}</p>
          </article>

          <article className="workflow-step-card">
            <span>03</span>
            <h3>{t("workflowStep3Title")}</h3>
            <p>{t("workflowStep3Text")}</p>
          </article>
        </div>
      </section>

      <section className="product-section" id="doctor-dashboard">
        <div className="section-kicker">{t("productSystemKicker")}</div>
        <h2>{t("productSystemTitle")}</h2>
        <p>{t("productSystemText")}</p>

        <div className="product-feature-layout">
          <article className="product-card product-card-featured">
            <div className="product-icon">01</div>
            <span className="product-label">{t("coreProductLabel")}</span>
            <h3>{t("doctorProductLongTitle")}</h3>
            <p>{t("doctorProductLongText")}</p>
          </article>

          <div className="product-side-grid">
            <article className="product-card">
              <div className="product-icon">02</div>
              <span className="product-label">{t("supportingWorkflowLabel")}</span>
              <h3>{t("patientProductLongTitle")}</h3>
              <p>{t("patientProductLongText")}</p>
            </article>

            <article className="product-card">
              <div className="product-icon">03</div>
              <span className="product-label">{t("internalInsightLabel")}</span>
              <h3>{t("workflowInsightTitle")}</h3>
              <p>{t("workflowInsightText")}</p>
            </article>
          </div>
        </div>
      </section>

      <section className="value-section">
        <div>
          <p className="eyebrow">{t("valueEyebrow")}</p>
          <h2>{t("valueTitle")}</h2>
          <p>{t("valueText")}</p>
        </div>

        <div className="value-grid">
          <article>
            <strong>20–25</strong>
            <span>{t("valueMetric1")}</span>
          </article>

          <article>
            <strong>S2k/S3</strong>
            <span>{t("valueMetric2")}</span>
          </article>

          <article>
            <strong>1x</strong>
            <span>{t("valueMetric3")}</span>
          </article>

          <article>
            <strong>TRL 4 → 7</strong>
            <span>{t("valueMetric4")}</span>
          </article>
        </div>
      </section>

      <section className="target-section content-section">
        <div className="section-heading-clean">
          <p className="eyebrow">{t("targetEyebrow")}</p>
          <h2>{t("targetTitle")}</h2>
          <p>{t("targetText")}</p>
        </div>

        <div className="target-grid">
          <article>
            <h3>{t("targetClinicTitle")}</h3>
            <p>{t("targetClinicText")}</p>
          </article>

          <article>
            <h3>{t("targetPracticeTitle")}</h3>
            <p>{t("targetPracticeText")}</p>
          </article>

          <article>
            <h3>{t("targetFutureTitle")}</h3>
            <p>{t("targetFutureText")}</p>
          </article>
        </div>
      </section>

      <section className="home-cta-section">
        <div>
          <p className="eyebrow">{t("productCtaEyebrow")}</p>
          <h2>{t("productCtaTitle")}</h2>
          <p>{t("productCtaText")}</p>
        </div>

        <Link className="primary-button" to="/contact">
          {t("contactUs")}
        </Link>
      </section>
    </AppShell>
  );
}