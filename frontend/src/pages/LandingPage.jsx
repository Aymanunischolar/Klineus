import AppShell from "../components/AppShell.jsx";
import { useLanguage } from "../i18n/LanguageContext.jsx";

function localText(language, de, en) {
  return language === "en" ? en : de;
}

export default function LandingPage() {
  const { language } = useLanguage();

  const steps = [
    {
      title: localText(
        language,
        "Strukturierte Erhebung",
        "Structured intake",
      ),
      text: localText(
        language,
        "Medizinisch relevante Patientenangaben werden in einem klaren Ablauf gesammelt.",
        "Medically relevant patient information is collected in a clear flow.",
      ),
    },
    {
      title: localText(
        language,
        "Übersichtliche Aufbereitung",
        "Clear preparation",
      ),
      text: localText(
        language,
        "Antworten und wichtige Punkte werden geordnet dargestellt und leichter prüfbar gemacht.",
        "Answers and important points are organized and made easier to review.",
      ),
    },
    {
      title: localText(
        language,
        "Ärztliche Prüfung",
        "Physician review",
      ),
      text: localText(
        language,
        "Die medizinische Bewertung, Entscheidung und Freigabe bleiben vollständig ärztliche Verantwortung.",
        "Medical assessment, decisions and approval remain fully the responsibility of the physician.",
      ),
    },
  ];

  const benefits = [
    localText(
      language,
      "Klare Vorbereitung vor medizinischen Gesprächen.",
      "Clear preparation before medical consultations.",
    ),
    localText(
      language,
      "Bessere Übersicht über Beschwerden, Funktion und relevante Risiken.",
      "Better overview of symptoms, function and relevant risks.",
    ),
    localText(
      language,
      "Nachvollziehbare Struktur für ärztliche Dokumentation.",
      "Traceable structure for medical documentation.",
    ),
    localText(
      language,
      "Technische Unterstützung ohne Ersatz ärztlicher Verantwortung.",
      "Technical support without replacing physician responsibility.",
    ),
  ];

  return (
    <AppShell>
      <main className="landing-page-pro">
        <section className="home-hero-pro">
          <div className="home-hero-copy-pro">
            <p className="eyebrow">Klineus</p>

            <h1>
              {localText(
                language,
                "Klineus strukturiert medizinisch relevante Patientenangaben.",
                "Klineus structures medically relevant patient information.",
              )}
            </h1>

            <p>
              {localText(
                language,
                "Klineus unterstützt medizinische Einrichtungen dabei, Angaben vor einem Termin klarer zu erfassen, aufzubereiten und für die ärztliche Prüfung übersichtlich darzustellen.",
                "Klineus helps medical organizations collect, prepare and present information clearly before an appointment for physician review.",
              )}
            </p>

            <div className="home-trust-row-pro" aria-label="Klineus Merkmale">
              <span>
                {localText(language, "Strukturierte Erhebung", "Structured intake")}
              </span>

              <span>
                {localText(language, "Ärztlich prüfbar", "Physician-reviewable")}
              </span>

              <span>
                {localText(language, "Keine Diagnose", "No diagnosis")}
              </span>
            </div>
          </div>

          <div className="home-hero-media-pro">
            <img
              className="home-hero-image"
              src="/static/images/hero-medical.png"
              alt={localText(
                language,
                "Digitale medizinische Oberfläche",
                "Digital medical interface",
              )}
              loading="eager"
            />

            <div className="home-hero-note-pro">
              <strong>Klineus</strong>
              <span>
                {localText(
                  language,
                  "Unterstützung für strukturierte Vorbereitung.",
                  "Support for structured preparation.",
                )}
              </span>
            </div>
          </div>
        </section>

        <section className="home-workflow-pro">
          <div className="section-heading">
            <p className="eyebrow">
              {localText(language, "Ablauf", "Workflow")}
            </p>

            <h2>
              {localText(
                language,
                "Von Angaben zu einer klaren medizinischen Übersicht.",
                "From information to a clear medical overview.",
              )}
            </h2>
          </div>

          <div className="home-step-grid-pro">
            {steps.map((step, index) => (
              <article className="home-step-card-pro" key={step.title}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="home-benefits-pro">
          <div>
            <p className="eyebrow">
              {localText(language, "Warum Klineus", "Why Klineus")}
            </p>

            <h2>
              {localText(
                language,
                "Für bessere Vorbereitung, nicht für automatische Entscheidungen.",
                "Built for better preparation, not automated decisions.",
              )}
            </h2>
          </div>

          <div className="home-benefit-list-pro">
            {benefits.map((benefit) => (
              <article key={benefit}>
                <span>✓</span>
                <p>{benefit}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="home-compliance-pro">
          <div>
            <p className="eyebrow">
              {localText(language, "Verantwortung", "Responsibility")}
            </p>

            <h2>
              {localText(
                language,
                "Klineus ersetzt keine ärztliche Entscheidung.",
                "Klineus does not replace medical decisions.",
              )}
            </h2>

            <p>
              {localText(
                language,
                "Alle Angaben, Hinweise und möglichen Dokumentationsentwürfe müssen ärztlich geprüft, korrigiert und freigegeben werden.",
                "All information, notes and possible documentation drafts must be reviewed, corrected and approved by a physician.",
              )}
            </p>
          </div>
        </section>
      </main>
    </AppShell>
  );
}