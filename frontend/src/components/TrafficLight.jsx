import { useLanguage } from "../i18n/LanguageContext.jsx";

const LEVELS = {
  red: { icon: "!", rank: 0, de: "Rot", en: "Red" },
  orange: { icon: "▲", rank: 1, de: "Gelb", en: "Amber" },
  green: { icon: "✓", rank: 2, de: "Grün", en: "Green" },
};

export function trafficLevel(value) {
  const level = String(value?.level || value || "").toLowerCase();
  return LEVELS[level] ? level : "";
}

export function trafficRank(value) {
  const level = trafficLevel(value);
  return level ? LEVELS[level].rank : 3;
}

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
