import AppShell from "../components/AppShell.jsx";
import { useLanguage } from "../i18n/LanguageContext.jsx";

function localText(language, de, en) {
  return language === "en" ? en : de;
}

export default function TeamPage() {
  const { language } = useLanguage();

  const focusAreas = [
    {
      title: localText(
        language,
        "Medizinische Struktur",
        "Medical structure",
      ),
      text: localText(
        language,
        "Medizinische Anforderungen werden in klare, verständliche und prüfbare Abläufe übersetzt.",
        "Medical requirements are translated into clear, understandable and reviewable workflows.",
      ),
    },
    {
      title: localText(language, "Produktqualität", "Product quality"),
      text: localText(
        language,
        "Der Fokus liegt auf einfacher Bedienbarkeit, klarer Darstellung und stabilen Prozessen.",
        "The focus is on simple usability, clear presentation and stable processes.",
      ),
    },
    {
      title: localText(
        language,
        "Verantwortungsvolle Technologie",
        "Responsible technology",
      ),
      text: localText(
        language,
        "Technologie soll Struktur und Übersicht schaffen, aber keine ärztliche Verantwortung ersetzen.",
        "Technology should create structure and clarity, but not replace medical responsibility.",
      ),
    },
  ];

  const principles = [
    localText(
      language,
      "Klineus soll medizinische Gespräche besser vorbereiten.",
      "Klineus should better prepare medical consultations.",
    ),
    localText(
      language,
      "Patientenangaben sollen klarer, strukturierter und prüfbarer werden.",
      "Patient information should become clearer, more structured and easier to review.",
    ),
    localText(
      language,
      "Ärztliche Prüfung und Entscheidung bleiben zentral.",
      "Physician review and decision-making remain central.",
    ),
  ];

  return (
    <AppShell>
      <main className="team-page-pro">
        <section className="team-hero-pro">
          <div className="team-hero-copy-pro">
            <p className="eyebrow">
              {localText(language, "Über uns", "About Us")}
            </p>

            <h1>
              {localText(
                language,
                "Klineus entsteht an der Schnittstelle von Medizin und Produktentwicklung.",
                "Klineus is built at the intersection of medicine and product development.",
              )}
            </h1>

            <p>
              {localText(
                language,
                "Unser Ziel ist es, medizinisch relevante Patientenangaben klarer, strukturierter und prüfbarer aufzubereiten.",
                "Our goal is to make medically relevant patient information clearer, more structured and easier to review.",
              )}
            </p>
          </div>

          <div className="team-hero-media-pro">
            <img
              className="team-hero-image"
              src="/static/images/team.png"
              alt={localText(language, "Klineus Team", "Klineus team")}
              loading="eager"
            />
          </div>
        </section>

        <section className="team-capabilities-pro">
          <div className="section-heading">
            <p className="eyebrow">
              {localText(language, "Fokus", "Focus")}
            </p>

            <h2>
              {localText(
                language,
                "Medizinische Struktur, Produktqualität und verantwortungsvolle Technologie.",
                "Medical structure, product quality and responsible technology.",
              )}
            </h2>
          </div>

          <div className="team-capability-grid-pro">
            {focusAreas.map((area) => (
              <article className="team-capability-card-pro" key={area.title}>
                <h3>{area.title}</h3>
                <p>{area.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="team-mission-pro">
          <div>
            <p className="eyebrow">
              {localText(language, "Grundsätze", "Principles")}
            </p>

            <h2>
              {localText(
                language,
                "Klar, strukturiert und ärztlich prüfbar.",
                "Clear, structured and physician-reviewable.",
              )}
            </h2>
          </div>

          <div className="team-principle-list-pro">
            {principles.map((principle) => (
              <article key={principle}>
                <span>✓</span>
                <p>{principle}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="team-responsibility-pro">
          <div>
            <p className="eyebrow">
              {localText(language, "Verantwortung", "Responsibility")}
            </p>

            <h2>
              {localText(
                language,
                "Klineus unterstützt Vorbereitung und Dokumentation.",
                "Klineus supports preparation and documentation.",
              )}
            </h2>

            <p>
              {localText(
                language,
                "Die Anwendung wird mit Blick auf reale medizinische Abläufe weiterentwickelt. Sie ersetzt keine Diagnose, keine Therapieentscheidung und keine ärztliche Freigabe.",
                "The application is developed with real medical workflows in mind. It does not replace diagnosis, treatment decisions or physician approval.",
              )}
            </p>
          </div>
        </section>
      </main>
    </AppShell>
  );
}