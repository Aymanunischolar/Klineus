import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import AppShell from "../components/AppShell.jsx";
import { useLanguage } from "../i18n/LanguageContext.jsx";


const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";


const fallbackCopy = {
  de: {
    eyebrow: "Rechtliches",
    title: "Rechtliche Hinweise, Datenschutz und klinische Grenzen.",
    description:
      "Klineus ist aktuell ein Prototyp. Die Inhalte dienen der Orientierung und müssen vor einem produktiven Einsatz rechtlich, medizinisch und regulatorisch geprüft werden.",
    summaryLabel: "Wichtiger Hinweis",
    summaryTitle: "Prototyp, keine medizinische Entscheidung.",
    summaryText:
      "Klineus unterstützt die strukturierte Vorbereitung und Dokumentation. Diagnose, Indikation und Behandlung bleiben vollständig in ärztlicher Verantwortung.",
    termsNav: "Nutzung",
    privacyNav: "Datenschutz",
    clinicalNav: "Klinische Grenzen",
    contactNav: "Kontakt",
    termsTitle: "Nutzungsbedingungen",
    termsIntro:
      "Diese Punkte beschreiben den aktuellen Prototyp-Status und die Grenzen der Nutzung.",
    privacyTitle: "Datenschutz und Datenverarbeitung",
    privacyIntro:
      "Der Prototyp ist auf sparsame Datenverarbeitung und klare Verantwortlichkeit ausgelegt.",
    clinicalTitle: "Klinische Verantwortung",
    clinicalIntro:
      "KI-generierte Inhalte sind Entwürfe und ersetzen keine ärztliche Prüfung.",
    contactTitle: "Fragen zu Recht, Datenschutz oder Pilotierung?",
    contactText:
      "Kontaktieren Sie uns, wenn Sie Klineus prüfen, pilotieren oder regulatorisch bewerten möchten.",
    contactButton: "Kontakt aufnehmen",
    fallbackCards: [
      {
        label: "Status",
        title: "Prototyp-Status",
        text:
          "Klineus ist aktuell ein Prototyp für Demonstration, Validierung und interne Tests.",
      },
      {
        label: "Medizin",
        title: "Keine medizinische Entscheidungsfindung",
        text:
          "Klineus stellt keine Diagnosen, trifft keine endgültigen Behandlungsentscheidungen und gibt keine Operationsempfehlungen.",
      },
      {
  label: "Daten",
  title: "Datenverarbeitung",
  text:
    "Patientenname und Versicherungsnummer dienen der ärztlichen Zuordnung. Direkte Identifikatoren sollen nicht an KI-Prompts übergeben werden.",
},
      {
        label: "KI",
        title: "KI-generierte Entwürfe",
        text:
          "KI-generierte Texte sind ausschließlich Dokumentationsentwürfe und müssen ärztlich geprüft werden.",
      },
      {
        label: "Betrieb",
        title: "Verfügbarkeit",
        text:
          "Prototyp-Dienste können sich ändern, unterbrochen oder entfernt werden.",
      },
      {
        label: "Kontakt",
        title: "Rückfragen",
        text:
          "Fragen zum Prototyp, zu Partnerschaften oder Pilotierung können über das Kontaktformular gestellt werden.",
      },
    ],
  },
  en: {
    eyebrow: "Legal",
    title: "Legal notes, privacy and clinical boundaries.",
    description:
      "Klineus is currently a prototype. These contents are for orientation and must be reviewed legally, medically and regulatorily before production use.",
    summaryLabel: "Important note",
    summaryTitle: "Prototype only, no medical decision-making.",
    summaryText:
      "Klineus supports structured preparation and documentation. Diagnosis, indication and treatment remain fully under physician responsibility.",
    termsNav: "Use",
    privacyNav: "Privacy",
    clinicalNav: "Clinical boundaries",
    contactNav: "Contact",
    termsTitle: "Terms of use",
    termsIntro:
      "These points describe the current prototype status and usage boundaries.",
    privacyTitle: "Privacy and data handling",
    privacyIntro:
      "The prototype is designed around data minimization and clear responsibility.",
    clinicalTitle: "Clinical responsibility",
    clinicalIntro:
      "AI-generated content is draft material and does not replace physician review.",
    contactTitle: "Questions about legal, privacy or pilot use?",
    contactText:
      "Contact us if you would like to review, pilot or assess Klineus from a regulatory perspective.",
    contactButton: "Contact us",
    fallbackCards: [
      {
        label: "Status",
        title: "Prototype status",
        text:
          "Klineus is currently a prototype for demonstration, validation and internal testing.",
      },
      {
        label: "Medicine",
        title: "No medical decision-making",
        text:
          "Klineus does not provide diagnoses, final treatment decisions or surgery recommendations.",
      },
     {
  label: "Data",
  title: "Data handling",
  text:
    "Patient name and insurance ID are used for doctor-side identification. Direct identifiers should not be passed into AI prompts.",
},
      {
        label: "AI",
        title: "AI-generated drafts",
        text:
          "AI-generated text is documentation draft only and must be reviewed by a physician.",
      },
      {
        label: "Operation",
        title: "Availability",
        text:
          "Prototype services may change, be interrupted or be removed.",
      },
      {
        label: "Contact",
        title: "Questions",
        text:
          "Questions about the prototype, partnerships or pilot use can be sent through the contact form.",
      },
    ],
  },
};


function getText(value, language = "de", fallback = "") {
  if (!value) {
    return fallback;
  }

  if (typeof value === "string") {
    return value;
  }

  return value[language] || value.de || value.en || fallback;
}


function normalize(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");
}


function findSection(sections, keys) {
  return sections.find((section) => {
    const searchable = [
      section.id,
      section.type,
      section.eyebrow?.de,
      section.eyebrow?.en,
      section.title?.de,
      section.title?.en,
      section.subtitle?.de,
      section.subtitle?.en,
      section.body?.de,
      section.body?.en,
    ]
      .filter(Boolean)
      .map(normalize)
      .join(" ");

    return keys.some((key) => searchable.includes(normalize(key)));
  });
}


function sectionCards(section, language, fallbackCards) {
  const items = section?.items || [];

  if (!items.length) {
    return fallbackCards;
  }

  return items.map((item, index) => ({
    label:
      getText(item.eyebrow, language, "") ||
      item.icon ||
      String(index + 1).padStart(2, "0"),
    title: getText(item.title, language, `Item ${index + 1}`),
    text: getText(item.text, language, ""),
  }));
}


function LegalCard({ card, index }) {
  return (
    <article className="legal-pro-card">
      <span>{card.label || String(index + 1).padStart(2, "0")}</span>
      <h3>{card.title}</h3>
      <p>{card.text}</p>
    </article>
  );
}


export default function LegalPage() {
  const { language } = useLanguage();
  const text = fallbackCopy[language] || fallbackCopy.de;

  const [page, setPage] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadPage() {
      try {
        const response = await fetch(`${API_BASE_URL}/patient/pages/legal`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Legal page could not be loaded.");
        }

        const data = await response.json();
        setPage(data);
      } catch (error) {
        if (error.name !== "AbortError") {
          setPage(null);
        }
      }
    }

    loadPage();

    return () => controller.abort();
  }, []);

  const content = useMemo(() => {
    const sections = page?.sections || [];

    const heroSection =
      findSection(sections, ["hero", "legal", "rechtlich"]) ||
      sections[0] ||
      {};

    const termsSection =
      findSection(sections, ["terms", "nutzung", "bedingungen"]) ||
      sections[1] ||
      {};

    const privacySection =
      findSection(sections, ["privacy", "datenschutz", "daten"]) ||
      sections[2] ||
      {};

    const clinicalSection =
      findSection(sections, ["clinical", "medizin", "grenzen", "boundary"]) ||
      sections[3] ||
      {};

    const fallbackCards = text.fallbackCards;

    const termsCards = sectionCards(
      termsSection,
      language,
      fallbackCards.slice(0, 3)
    );

    const privacyCards = sectionCards(
      privacySection,
      language,
      fallbackCards.slice(2, 4)
    );

    const clinicalCards = sectionCards(
      clinicalSection,
      language,
      fallbackCards.slice(1, 6)
    );

    return {
      eyebrow: getText(heroSection.eyebrow, language, text.eyebrow),
      title: getText(heroSection.title || page?.title, language, text.title),
      description: getText(
        heroSection.subtitle || heroSection.body || page?.description,
        language,
        text.description
      ),
      termsTitle: getText(termsSection.title, language, text.termsTitle),
      termsIntro: getText(
        termsSection.subtitle || termsSection.body,
        language,
        text.termsIntro
      ),
      privacyTitle: getText(privacySection.title, language, text.privacyTitle),
      privacyIntro: getText(
        privacySection.subtitle || privacySection.body,
        language,
        text.privacyIntro
      ),
      clinicalTitle: getText(
        clinicalSection.title,
        language,
        text.clinicalTitle
      ),
      clinicalIntro: getText(
        clinicalSection.subtitle || clinicalSection.body,
        language,
        text.clinicalIntro
      ),
      termsCards,
      privacyCards,
      clinicalCards,
    };
  }, [language, page, text]);

  return (
    <AppShell>
      <main className="legal-page-pro">
        <section className="legal-hero-pro">
          <div className="legal-hero-copy-pro">
            <p className="eyebrow">{content.eyebrow}</p>

            <h1>{content.title}</h1>

            <p>{content.description}</p>

            <nav className="legal-anchor-nav" aria-label="Legal sections">
              <a href="#terms">{text.termsNav}</a>
              <a href="#privacy">{text.privacyNav}</a>
              <a href="#clinical">{text.clinicalNav}</a>
              <a href="#contact">{text.contactNav}</a>
            </nav>
          </div>

          <aside className="legal-summary-pro">
            <span>{text.summaryLabel}</span>
            <strong>{text.summaryTitle}</strong>
            <p>{text.summaryText}</p>
          </aside>
        </section>

        <section className="legal-section-pro" id="terms">
          <div className="legal-section-heading-pro">
            <p className="eyebrow">{text.termsNav}</p>
            <h2>{content.termsTitle}</h2>
            <p>{content.termsIntro}</p>
          </div>

          <div className="legal-card-grid-pro">
            {content.termsCards.map((card, index) => (
              <LegalCard
                card={card}
                index={index}
                key={`${card.title}-${index}`}
              />
            ))}
          </div>
        </section>

        <section className="legal-section-pro legal-section-muted-pro" id="privacy">
          <div className="legal-section-heading-pro">
            <p className="eyebrow">{text.privacyNav}</p>
            <h2>{content.privacyTitle}</h2>
            <p>{content.privacyIntro}</p>
          </div>

          <div className="legal-card-grid-pro two-columns">
            {content.privacyCards.map((card, index) => (
              <LegalCard
                card={card}
                index={index}
                key={`${card.title}-${index}`}
              />
            ))}
          </div>
        </section>

        <section className="legal-section-pro" id="clinical">
          <div className="legal-section-heading-pro">
            <p className="eyebrow">{text.clinicalNav}</p>
            <h2>{content.clinicalTitle}</h2>
            <p>{content.clinicalIntro}</p>
          </div>

          <div className="legal-card-grid-pro">
            {content.clinicalCards.map((card, index) => (
              <LegalCard
                card={card}
                index={index}
                key={`${card.title}-${index}`}
              />
            ))}
          </div>
        </section>

        <section className="legal-contact-pro" id="contact">
          <div>
            <p className="eyebrow">Klineus</p>
            <h2>{text.contactTitle}</h2>
            <p>{text.contactText}</p>
          </div>

          <Link className="primary-button" to="/contact">
            {text.contactButton}
          </Link>
        </section>
      </main>
    </AppShell>
  );
}