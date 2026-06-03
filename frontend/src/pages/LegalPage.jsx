import AppShell from "../components/AppShell.jsx";
import { useLanguage } from "../i18n/LanguageContext.jsx";

export default function LegalPage() {
  const { t } = useLanguage();

  return (
    <AppShell>
      <section className="page-hero">
        <p className="eyebrow">{t("termsEyebrow")}</p>
        <h1>{t("termsTitle")}</h1>
        <p>{t("termsIntro")}</p>
      </section>

      <section className="terms-grid">
        <article>
          <h3>{t("terms1Title")}</h3>
          <p>{t("terms1Text")}</p>
        </article>

        <article>
          <h3>{t("terms2Title")}</h3>
          <p>{t("terms2Text")}</p>
        </article>

        <article>
          <h3>{t("terms3Title")}</h3>
          <p>{t("terms3Text")}</p>
        </article>

        <article>
          <h3>{t("terms4Title")}</h3>
          <p>{t("terms4Text")}</p>
        </article>

        <article>
          <h3>{t("terms5Title")}</h3>
          <p>{t("terms5Text")}</p>
        </article>

        <article>
          <h3>{t("terms6Title")}</h3>
          <p>{t("terms6Text")}</p>
        </article>
      </section>
    </AppShell>
  );
}