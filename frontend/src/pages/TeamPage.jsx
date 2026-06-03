import AppShell from "../components/AppShell.jsx";
import { useLanguage } from "../i18n/LanguageContext.jsx";

export default function TeamPage() {
  const { t } = useLanguage();

  return (
    <AppShell>
      <section className="page-hero">
        <p className="eyebrow">{t("teamPageEyebrow")}</p>
        <h1>{t("teamPageTitle")}</h1>
        <p>{t("teamPageIntro")}</p>
      </section>

      <section className="team-grid">
        <article className="team-card">
          <div className="team-avatar">CEO</div>
          <h3>{t("teamBusinessTitle")}</h3>
          <p>{t("teamBusinessText")}</p>
        </article>

        <article className="team-card">
          <div className="team-avatar">CMO</div>
          <h3>{t("teamMedicalTitle")}</h3>
          <p>{t("teamMedicalText")}</p>
        </article>

        <article className="team-card">
          <div className="team-avatar">AI</div>
          <h3>{t("teamAiTitle")}</h3>
          <p>{t("teamAiText")}</p>
        </article>
      </section>

      <section className="content-section two-column-section">
        <div>
          <p className="eyebrow">{t("teamMissionEyebrow")}</p>
          <h2>{t("teamMissionTitle")}</h2>
        </div>

        <div className="section-copy">
          <p>{t("teamMissionText1")}</p>
          <p>{t("teamMissionText2")}</p>
        </div>
      </section>
    </AppShell>
  );
}