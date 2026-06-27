import AppShell from "../components/AppShell.jsx";
import { useLanguage } from "../i18n/LanguageContext.jsx";

function localText(language, de, en) {
  return language === "en" ? en : de;
}

export default function LegalPage() {
  const { language } = useLanguage();

  const imprintCards = [
    {
      label: localText(language, "Anbieter", "Provider"),
      title: "Klineus",
      text: localText(
        language,
        "Die vollständigen Angaben zur verantwortlichen Person oder Gesellschaft müssen vor Veröffentlichung ergänzt werden.",
        "The full details of the responsible person or company must be added before publication.",
      ),
    },
    {
      label: localText(language, "Kontakt", "Contact"),
      title: "contact@klineus.de",
      text: localText(
        language,
        "Für allgemeine Rückfragen erreichen Sie Klineus per E-Mail.",
        "For general questions, Klineus can be reached by email.",
      ),
    },
    {
      label: localText(
        language,
        "Verantwortlich für den Inhalt",
        "Responsible for content",
      ),
      title: "Klineus",
      text: localText(
        language,
        "Diese Angabe muss vor produktivem Einsatz rechtlich geprüft und ergänzt werden.",
        "This information must be legally reviewed and completed before production use.",
      ),
    },
  ];

  const privacyCards = [
    {
      label: localText(language, "Datensparsamkeit", "Data minimization"),
      title: localText(
        language,
        "Nur erforderliche Angaben",
        "Only required information",
      ),
      text: localText(
        language,
        "Es sollen nur Informationen erhoben werden, die für den jeweiligen medizinischen Ablauf erforderlich sind.",
        "Only information required for the relevant medical workflow should be collected.",
      ),
    },
    {
      label: localText(
        language,
        "Ärztliche Zuordnung",
        "Physician-side assignment",
      ),
      title: localText(
        language,
        "Patientenname und Fallinformationen",
        "Patient name and case information",
      ),
      text: localText(
        language,
        "Patientenname und Fallinformationen dienen der Zuordnung im ärztlichen Arbeitsablauf.",
        "Patient name and case information are used for assignment within the physician workflow.",
      ),
    },
    {
      label: localText(language, "KI-Verarbeitung", "AI processing"),
      title: localText(
        language,
        "Keine direkten Identifikatoren in Prompts",
        "No direct identifiers in prompts",
      ),
      text: localText(
        language,
        "Direkte Identifikatoren sollen nicht an KI-Prompts übergeben werden.",
        "Direct identifiers should not be passed into AI prompts.",
      ),
    },
    {
      label: localText(
        language,
        "Prüfung vor Produktivbetrieb",
        "Review before production use",
      ),
      title: localText(
        language,
        "Rechtliche und technische Prüfung",
        "Legal and technical review",
      ),
      text: localText(
        language,
        "Vor produktivem Einsatz müssen Datenschutz, IT-Sicherheit, regulatorische Einordnung und klinische Validierung geprüft werden.",
        "Before production use, privacy, IT security, regulatory classification and clinical validation must be reviewed.",
      ),
    },
  ];

  return (
    <AppShell>
      <main className="legal-clean-page">
        <section className="legal-clean-hero">
          <p className="eyebrow">
            {localText(language, "Rechtliches", "Legal")}
          </p>

          <h1>
            {localText(
                language,
                "Impressum und Datenschutz",
                "Imprint and Privacy",
            )}
          </h1>

          <p>
            {localText(
                language,
                "Auf dieser Seite finden Sie die rechtlichen Informationen, das Impressum und die Datenschutzhinweise zur Nutzung von Klineus.",
                "This page contains the legal information, imprint and privacy information for using Klineus.",
            )}
          </p>

          <div className="legal-clean-anchor-row">
            <a href="#terms">
              {localText(language, "Impressum", "Imprint")}
            </a>

            <a href="#privacy">
              {localText(language, "Datenschutz", "Privacy")}
            </a>
          </div>
        </section>

        <section id="terms" className="legal-clean-section">
          <div className="legal-clean-section-heading">
            <p className="eyebrow">
              {localText(language, "Impressum", "Imprint")}
            </p>

            <h2>{localText(language, "Impressum", "Imprint")}</h2>

            <p>
              {localText(
                language,
                "Informationen zum Anbieter und zur Kontaktaufnahme.",
                "Information about the provider and contact details.",
              )}
            </p>
          </div>

          <div className="legal-clean-card-grid legal-clean-card-grid-3">
            {imprintCards.map((card) => (
              <article className="legal-clean-card" key={card.label}>
                <span>{card.label}</span>
                <strong>{card.title}</strong>
                <p>{card.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="privacy" className="legal-clean-section">
          <div className="legal-clean-section-heading">
            <p className="eyebrow">
              {localText(language, "Datenschutz", "Privacy")}
            </p>

            <h2>{localText(language, "Datenschutz", "Privacy")}</h2>

            <p>
              {localText(
                language,
                "Klineus verarbeitet Daten zweckgebunden zur strukturierten Vorbereitung medizinischer Informationen und zur ärztlichen Zuordnung.",
                "Klineus processes data for the purpose of structured preparation of medical information and physician-side assignment.",
              )}
            </p>
          </div>

          <div className="legal-clean-card-grid">
            {privacyCards.map((card) => (
              <article className="legal-clean-card" key={card.label}>
                <span>{card.label}</span>
                <strong>{card.title}</strong>
                <p>{card.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="legal-clean-note">
          <div>
            <p className="eyebrow">
              {localText(
                  language,
                  "Nutzungsbedingungen",
                  "Terms and Conditions",
              )}
            </p>

            <h2>
              {localText(
                  language,
                  "Unsere rechtlichen Informationen.",
                  "Our terms and conditions.",
              )}
            </h2>
          </div>

          <p>
            {localText(
                language,
                "Diese Seite informiert über die Nutzung von Klineus, die Anbieterangaben und den Umgang mit personenbezogenen Daten.",
                "This page explains the use of Klineus, provider information and how personal data is handled.",
            )}
          </p>
        </section>
      </main>
    </AppShell>
  );
}