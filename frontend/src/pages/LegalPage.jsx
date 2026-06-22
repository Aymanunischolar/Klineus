import AppShell from "../components/AppShell.jsx";
import { useLanguage } from "../i18n/LanguageContext.jsx";

function localText(language, de, en) {
  return language === "en" ? en : de;
}

export default function LegalPage() {
  const { language } = useLanguage();

  return (
    <AppShell>
      <main className="legal-page-pro">
        <section className="legal-hero-pro">
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
              "Diese Angaben sind Platzhalter und müssen vor einem produktiven Einsatz rechtlich geprüft und vervollständigt werden.",
              "This information is placeholder content and must be legally reviewed and completed before production use.",
            )}
          </p>
        </section>

        <section id="terms" className="legal-section-pro">
          <p className="eyebrow">
            {localText(language, "Impressum", "Imprint")}
          </p>

          <h2>{localText(language, "Impressum", "Imprint")}</h2>

          <div className="legal-card-grid-pro">
            <article className="legal-card-pro">
              <span>{localText(language, "Anbieter", "Provider")}</span>
              <strong>Klineus</strong>
              <p>
                {localText(
                  language,
                  "Die vollständigen Angaben zur verantwortlichen Person oder Gesellschaft müssen vor Veröffentlichung ergänzt werden.",
                  "The full details of the responsible person or company must be added before publication.",
                )}
              </p>
            </article>

            <article className="legal-card-pro">
              <span>{localText(language, "Kontakt", "Contact")}</span>
              <strong>contact@klineus.de</strong>
              <p>
                {localText(
                  language,
                  "Für allgemeine Rückfragen erreichen Sie Klineus per E-Mail.",
                  "For general questions, Klineus can be reached by email.",
                )}
              </p>
            </article>

            <article className="legal-card-pro">
              <span>
                {localText(
                  language,
                  "Verantwortlich für den Inhalt",
                  "Responsible for content",
                )}
              </span>
              <strong>Klineus</strong>
              <p>
                {localText(
                  language,
                  "Diese Angabe muss vor produktivem Einsatz rechtlich geprüft und ergänzt werden.",
                  "This information must be legally reviewed and completed before production use.",
                )}
              </p>
            </article>
          </div>
        </section>

        <section id="privacy" className="legal-section-pro">
          <p className="eyebrow">
            {localText(language, "Datenschutz", "Privacy")}
          </p>

          <h2>{localText(language, "Datenschutz", "Privacy")}</h2>

          <p className="legal-section-intro-pro">
            {localText(
              language,
              "Klineus verarbeitet Daten zweckgebunden zur strukturierten Vorbereitung medizinischer Informationen und zur ärztlichen Zuordnung.",
              "Klineus processes data for the purpose of structured preparation of medical information and physician-side assignment.",
            )}
          </p>

          <div className="legal-card-grid-pro">
            <article className="legal-card-pro">
              <span>
                {localText(language, "Datensparsamkeit", "Data minimization")}
              </span>

              <strong>
                {localText(
                  language,
                  "Nur erforderliche Angaben",
                  "Only required information",
                )}
              </strong>

              <p>
                {localText(
                  language,
                  "Es sollen nur Informationen erhoben werden, die für den jeweiligen medizinischen Ablauf erforderlich sind.",
                  "Only information required for the relevant medical workflow should be collected.",
                )}
              </p>
            </article>

            <article className="legal-card-pro">
              <span>
                {localText(
                  language,
                  "Ärztliche Zuordnung",
                  "Physician-side assignment",
                )}
              </span>

              <strong>
                {localText(
                  language,
                  "Patientenname und Fallinformationen",
                  "Patient name and case information",
                )}
              </strong>

              <p>
                {localText(
                  language,
                  "Patientenname und Fallinformationen dienen der Zuordnung im ärztlichen Arbeitsablauf.",
                  "Patient name and case information are used for assignment within the physician workflow.",
                )}
              </p>
            </article>

            <article className="legal-card-pro">
              <span>
                {localText(language, "KI-Verarbeitung", "AI processing")}
              </span>

              <strong>
                {localText(
                  language,
                  "Keine direkten Identifikatoren in Prompts",
                  "No direct identifiers in prompts",
                )}
              </strong>

              <p>
                {localText(
                  language,
                  "Direkte Identifikatoren sollen nicht an KI-Prompts übergeben werden.",
                  "Direct identifiers should not be passed into AI prompts.",
                )}
              </p>
            </article>

            <article className="legal-card-pro">
              <span>
                {localText(
                  language,
                  "Prüfung vor Produktivbetrieb",
                  "Review before production use",
                )}
              </span>

              <strong>
                {localText(
                  language,
                  "Rechtliche und technische Prüfung",
                  "Legal and technical review",
                )}
              </strong>

              <p>
                {localText(
                  language,
                  "Vor produktivem Einsatz müssen Datenschutz, IT-Sicherheit, regulatorische Einordnung und klinische Validierung geprüft werden.",
                  "Before production use, privacy, IT security, regulatory classification and clinical validation must be reviewed.",
                )}
              </p>
            </article>
          </div>
        </section>
      </main>
    </AppShell>
  );
}