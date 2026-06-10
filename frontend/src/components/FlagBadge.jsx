import { useLanguage } from "../i18n/LanguageContext.jsx";

const levelConfig = {
  red: {
    icon: "!",
    de: "Hohe Aufmerksamkeit",
    en: "High attention",
  },
  orange: {
    icon: "i",
    de: "Bitte prüfen",
    en: "Review needed",
  },
  green: {
    icon: "✓",
    de: "Unauffällig",
    en: "No major issue",
  },
};

export default function FlagBadge({ flag }) {
  const { language } = useLanguage();

  const level = flag?.level && levelConfig[flag.level] ? flag.level : "orange";
  const config = levelConfig[level];

  return (
    <article className={`flag-card flag-card-enhanced flag-${level}`}>
      <div className="flag-card-header">
        <span className={`flag-icon flag-icon-${level}`} aria-hidden="true">
          {config.icon}
        </span>

        <div>
          <span className="flag-level-label">{config[language] || config.de}</span>
          <strong>{flag?.title || "Hinweis"}</strong>
        </div>
      </div>

      {flag?.description ? <p>{flag.description}</p> : null}
    </article>
  );
}