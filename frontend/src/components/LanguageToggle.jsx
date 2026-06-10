import { useLanguage } from "../i18n/LanguageContext.jsx";

export default function LanguageToggle() {
  const { language, setLanguage, t } = useLanguage();

  const languages = [
    {
      code: "de",
      label: "DE",
      title: "Deutsch",
    },
    {
      code: "en",
      label: "EN",
      title: "English",
    },
  ];

  return (
    <div className="language-toggle language-toggle-enhanced" aria-label={t("toggleLabel")}>
      <span className="language-toggle-label">{t("toggleLabel")}</span>

      <div className="language-switch" role="group" aria-label={t("toggleLabel")}>
        {languages.map((item) => {
          const isActive = language === item.code;

          return (
            <button
              aria-pressed={isActive}
              className={isActive ? "active" : ""}
              key={item.code}
              title={item.title}
              type="button"
              onClick={() => setLanguage(item.code)}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}