import { useLanguage } from "../i18n/LanguageContext.jsx";

export default function LanguageToggle() {
  const { language, t, toggleLanguage } = useLanguage();
  const isEnglish = language === "en";

  return (
    <div className="language-toggle" aria-label={t("toggleLabel")}>
      <span>{t("toggleLabel")}</span>
      <button
        aria-pressed={isEnglish}
        className="language-switch"
        type="button"
        onClick={toggleLanguage}
      >
        <span className={!isEnglish ? "active" : ""}>DE</span>
        <span className={isEnglish ? "active" : ""}>EN</span>
      </button>
    </div>
  );
}
