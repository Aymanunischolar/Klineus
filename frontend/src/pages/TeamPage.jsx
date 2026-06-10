import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import AppShell from "../components/AppShell.jsx";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { api } from "../services/api.js";


const fallbackCopy = {
  de: {
    eyebrow: "Team & Verantwortung",
    title: "Ein Prototyp für strukturierte medizinische Vorbereitung.",
    lead:
      "Klineus ist als ärztlich prüfpflichtiges Unterstützungssystem gedacht. Der Fokus liegt auf strukturierter Erfassung, transparenter Dokumentation und klarer Verantwortlichkeit.",
    imageAlt: "Klineus medizinisches Team",
    capabilitiesTitle: "Unsere Schwerpunkte",
    capabilities: [
      {
        title: "Medizinische Struktur",
        text: "Fragebögen werden indikationsbezogen aufgebaut, damit Beschwerden, Funktion, Vorbehandlung und Risiken nachvollziehbar dokumentiert werden.",
      },
      {
        title: "Produktqualität",
        text: "Die Anwendung ist auf klare Abläufe, mobile Nutzbarkeit und ein verständliches Arzt-Dashboard ausgelegt.",
      },
      {
        title: "Verantwortungsvolle KI",
        text: "KI-Ausgaben sind nur Entwürfe. Jede medizinische Bewertung bleibt bei der Ärztin oder dem Arzt.",
      },
    ],
    missionEyebrow: "Prinzipien",
    missionTitle: "Was Klineus bewusst nicht macht.",
    principles: [
      "Keine automatische Diagnose",
      "Keine automatische Operationsentscheidung",
      "Keine ärztliche Freigabe ohne menschliche Prüfung",
      "Keine unnötige Übermittlung direkter Identifikatoren an die KI",
    ],
    ctaTitle: "Fragen zum Prototyp?",
    ctaText:
      "Kontaktieren Sie uns, wenn Sie Feedback geben oder den Ablauf besprechen möchten.",
    ctaButton: "Kontakt aufnehmen",
  },
  en: {
    eyebrow: "Team & responsibility",
    title: "A prototype for structured medical preparation.",
    lead:
      "Klineus is designed as a physician-reviewed support system. The focus is structured intake, transparent documentation and clear responsibility.",
    imageAlt: "Klineus medical team",
    capabilitiesTitle: "Our focus areas",
    capabilities: [
      {
        title: "Medical structure",
        text: "Questionnaires are indication-specific so symptoms, function, prior treatment and risks can be documented clearly.",
      },
      {
        title: "Product quality",
        text: "The application focuses on clear workflows, mobile usability and an understandable doctor dashboard.",
      },
      {
        title: "Responsible AI",
        text: "AI outputs are drafts only. Every medical evaluation remains with the physician.",
      },
    ],
    missionEyebrow: "Principles",
    missionTitle: "What Klineus deliberately does not do.",
    principles: [
      "No automatic diagnosis",
      "No automatic surgery decision",
      "No medical approval without human review",
      "No unnecessary transfer of direct identifiers to AI",
    ],
    ctaTitle: "Questions about the prototype?",
    ctaText:
      "Contact us if you want to give feedback or discuss the workflow.",
    ctaButton: "Contact us",
  },
};


function getText(value, language, fallback = "") {
  if (!value) {
    return fallback;
  }

  if (typeof value === "string") {
    return value;
  }

  return value[language] || value.de || value.en || fallback;
}


function normalizeImagePath(path, fallback) {
  const value = path || fallback;

  if (!value) {
    return "";
  }

  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }

  if (value.startsWith("/api/static/images/")) {
    return value.replace("/api/static/images/", "/static/images/");
  }

  if (value.startsWith("/images/")) {
    return value.replace("/images/", "/static/images/");
  }

  if (value.startsWith("static/images/")) {
    return `/${value}`;
  }

  return value;
}


function findSection(page, id) {
  return (page?.sections || []).find((section) => section.id === id);
}


export default function TeamPage() {
  const { language } = useLanguage();
  const text = fallbackCopy[language] || fallbackCopy.de;

  const [page, setPage] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function loadPage() {
      try {
        const data = await api.getPage("team");

        if (mounted) {
          setPage(data);
        }
      } catch {
        if (mounted) {
          setPage(null);
        }
      }
    }

    loadPage();

    return () => {
      mounted = false;
    };
  }, []);

  const heroSection = useMemo(() => findSection(page, "hero"), [page]);

  const heroEyebrow = getText(heroSection?.eyebrow, language, text.eyebrow);
  const heroTitle = getText(heroSection?.title, language, text.title);
  const heroBody = getText(heroSection?.body, language, text.lead);
  const heroImage = normalizeImagePath(
    heroSection?.image_path,
    "/static/images/team.png"
  );
  const heroImageAlt = getText(
    heroSection?.image_alt,
    language,
    text.imageAlt
  );

  return (
    <AppShell>
      <main className="team-page-pro">
        <section className="team-hero-pro">
          <div className="team-hero-copy-pro">
            <p className="eyebrow">{heroEyebrow}</p>
            <h1>{heroTitle}</h1>
            <p>{heroBody}</p>

            <div className="hero-actions">
              <Link className="primary-button" to="/contact">
                {text.ctaButton}
              </Link>

              <Link className="secondary-button" to="/product">
                Product
              </Link>
            </div>
          </div>

          <div className="team-hero-media-pro">
            <img
              className="team-hero-image-pro"
              src={heroImage}
              alt={heroImageAlt}
              loading="eager"
            />
          </div>
        </section>

        <section className="team-capabilities-pro">
          <div className="section-heading">
            <p className="eyebrow">Klineus</p>
            <h2>{text.capabilitiesTitle}</h2>
          </div>

          <div className="team-capability-grid-pro">
            {text.capabilities.map((item) => (
              <article className="team-capability-card-pro" key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="team-mission-pro">
          <div>
            <p className="eyebrow">{text.missionEyebrow}</p>
            <h2>{text.missionTitle}</h2>
          </div>

          <div className="team-principle-list-pro">
            {text.principles.map((principle) => (
              <article key={principle}>
                <span>✓</span>
                <p>{principle}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="team-cta-pro">
          <div>
            <p className="eyebrow">Klineus</p>
            <h2>{text.ctaTitle}</h2>
            <p>{text.ctaText}</p>
          </div>

          <Link className="primary-button" to="/contact">
            {text.ctaButton}
          </Link>
        </section>
      </main>
    </AppShell>
  );
}