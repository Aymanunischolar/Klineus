import AppShell from "../components/AppShell.jsx";
import { useLanguage } from "../i18n/LanguageContext.jsx";

function localText(language, de, en) {
  return language === "en" ? en : de;
}

export default function ProductPage() {
  const { language } = useLanguage();

  const features = [
    {
      title: localText(
        language,
        "Strukturierte Erhebung",
        "Structured intake",
      ),
      text: localText(
        language,
        "Klineus hilft, medizinisch relevante Patientenangaben in einem klaren Ablauf zu erfassen.",
        "Klineus helps collect medically relevant patient information in a clear flow.",
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
        "Antworten werden geordnet dargestellt, damit sie im ärztlichen Arbeitsablauf leichter geprüft werden können.",
        "Answers are organized so they can be reviewed more easily within the medical workflow.",
      ),
    },
    {
      title: localText(
        language,
        "Dokumentationsunterstützung",
        "Documentation support",
      ),
      text: localText(
        language,
        "Klineus kann die Vorbereitung eines Dokumentationsentwurfs unterstützen. Jede Ausgabe muss ärztlich geprüft werden.",
        "Klineus can support the preparation of a documentation draft. Every output must be reviewed by a physician.",
      ),
    },
  ];

  const workflow = [
    localText(
      language,
      "Patientenangaben werden strukturiert erfasst.",
      "Patient information is collected in a structured way.",
    ),
    localText(
      language,
      "Relevante Antworten und offene Punkte werden geordnet aufbereitet.",
      "Relevant answers and open points are prepared clearly.",
    ),
    localText(
      language,
      "Die Ärztin oder der Arzt prüft die Angaben und entscheidet über die weitere Einordnung.",
      "The physician reviews the information and decides on the further assessment.",
    ),
    localText(
      language,
      "Ein möglicher Dokumentationsentwurf wird geprüft, korrigiert und freigegeben.",
      "A possible documentation draft is reviewed, corrected and approved.",
    ),
  ];

  const boundaries = [
    {
      title: localText(language, "Keine Diagnose", "No diagnosis"),
      text: localText(
        language,
        "Klineus stellt keine Diagnose und ersetzt keine medizinische Untersuchung.",
        "Klineus does not provide diagnosis and does not replace a medical examination.",
      ),
    },
    {
      title: localText(
        language,
        "Keine Therapieentscheidung",
        "No treatment decision",
      ),
      text: localText(
        language,
        "Therapieentscheidungen bleiben vollständig ärztliche Verantwortung.",
        "Treatment decisions remain fully the responsibility of the physician.",
      ),
    },
    {
      title: localText(
        language,
        "Ärztliche Prüfung erforderlich",
        "Physician review required",
      ),
      text: localText(
        language,
        "Alle Informationen und Entwürfe müssen geprüft, korrigiert und freigegeben werden.",
        "All information and drafts must be reviewed, corrected and approved.",
      ),
    },
  ];

  return (
    <AppShell>
      <main className="product-page-pro">
        <section className="product-hero-pro">
          <div className="product-hero-copy-pro">
            <p className="eyebrow">
              {localText(language, "Unser Produkt", "Our Product")}
            </p>

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
                "Klineus unterstützt medizinische Einrichtungen dabei, patientenbezogene Informationen vor einem Termin klarer zu erfassen, aufzubereiten und für die ärztliche Prüfung übersichtlich darzustellen.",
                "Klineus helps medical organizations collect, prepare and present patient-related information clearly before an appointment for physician review.",
              )}
            </p>
          </div>

          <div className="product-hero-media-pro">
            <img
              className="product-hero-image"
              src="/static/images/hero-medical.png"
              alt={localText(
                language,
                "Digitale medizinische Oberfläche",
                "Digital medical interface",
              )}
              loading="eager"
            />
          </div>
        </section>

        <section className="product-feature-section-pro">
          <div className="section-heading">
            <p className="eyebrow">
              {localText(language, "Funktionen", "Features")}
            </p>

            <h2>
              {localText(
                language,
                "Was Klineus leistet.",
                "What Klineus provides.",
              )}
            </h2>
          </div>

          <div className="product-feature-grid-pro">
            {features.map((feature) => (
              <article className="product-feature-card-pro" key={feature.title}>
                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="product-process-pro">
          <div>
            <p className="eyebrow">{localText(language, "Ablauf", "Workflow")}</p>

            <h2>
              {localText(
                language,
                "Ein klarer Ablauf mit ärztlicher Verantwortung.",
                "A clear workflow with physician responsibility.",
              )}
            </h2>
          </div>

          <ol className="product-process-list-pro">
            {workflow.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        </section>

        <section className="product-feature-section-pro">
          <div className="section-heading">
            <p className="eyebrow">
              {localText(language, "Grenzen", "Boundaries")}
            </p>

            <h2>
              {localText(
                language,
                "Technische Unterstützung ohne Ersatz ärztlicher Prüfung.",
                "Technical support without replacing physician review.",
              )}
            </h2>
          </div>

          <div className="product-feature-grid-pro">
            {boundaries.map((item) => (
              <article className="product-feature-card-pro" key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="product-compliance-pro">
          <div>
            <p className="eyebrow">
              {localText(language, "Verantwortung", "Responsibility")}
            </p>

            <h2>
              {localText(
                language,
                "Klineus ist Unterstützung, keine medizinische Autorität.",
                "Klineus is support, not a medical authority.",
              )}
            </h2>

            <p>
              {localText(
                language,
                "Die Anwendung soll Struktur, Übersicht und Dokumentationsvorbereitung verbessern. Sie ersetzt keine Diagnose, keine Therapieentscheidung und keine ärztliche Freigabe.",
                "The application is intended to improve structure, overview and documentation preparation. It does not replace diagnosis, treatment decisions or physician approval.",
              )}
            </p>
          </div>
        </section>
      </main>
    </AppShell>
  );
}