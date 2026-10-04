import { useLanguage } from "../i18n/LanguageContext.jsx";
import { trafficLevel, trafficRank } from "../utils/traffic.js";

const LEVELS = {
  red: { icon: "!", de: "Rot", en: "Red" },
  orange: { icon: "▲", de: "Gelb", en: "Amber" },
  green: { icon: "✓", de: "Grün", en: "Green" },
};

export { trafficLevel, trafficRank };

export default function TrafficLight({ level, compact = false }) {
  const { language } = useLanguage();
  const key = trafficLevel(level);

  if (!key) return <span className="traffic-badge traffic-badge-none">—</span>;

  const config = LEVELS[key];

  return (
    <span
      className={`traffic-badge traffic-badge-${key}${compact ? " compact" : ""}`}
    >
      <span className="traffic-badge-icon" aria-hidden="true">
        {config.icon}
      </span>
      {config[language] || config.de}
    </span>
  );
}
