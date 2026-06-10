import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import AppShell from "../components/AppShell.jsx";
import { useLanguage } from "../i18n/LanguageContext.jsx";


const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";


const fallbackCopy = {
  de: {
    eyebrow: "Team",
    title: "Medizin, Produktlogik und Automatisierung zusammengeführt.",
    description:
      "Klineus verbindet medizinische Anforderungen, strukturierte Datenerhebung und KI-gestützte Dokumentationsprozesse.",
    primaryAction: "Kontakt aufnehmen",
    secondaryAction: "Produkt ansehen",
    sectionEyebrow: "Kompetenzen",
    sectionTitle: "Ein interdisziplinärer Ansatz für klinisch sinnvolle Software.",
    sectionText:
      "Der Prototyp ist darauf ausgelegt, ärztliche Arbeit nicht zu ersetzen, sondern Vorinformationen sauberer aufzubereiten.",
    missionEyebrow: "Arbeitsweise",
    missionTitle: "Ärztliche Kontrolle steht im Mittelpunkt.",
    missionText:
      "Klineus sammelt Patientenantworten strukturiert, gruppiert sie medizinisch nachvollziehbar und erstellt nur prüfbare Dokumentationsentwürfe.",
    ctaTitle: "Möchten Sie Klineus pilotieren?",
    ctaText:
      "Wir freuen uns über Rückmeldungen von Ärztinnen, Ärzten, Kliniken und Partnern.",
    ctaButton: "Kontakt aufnehmen",
    capabilities: [
      {
        label: "Business",
        title: "Produkt und Umsetzung",
        text:
          "Klineus wird als schlanker Prototyp entwickelt, um reale Abläufe schnell testbar zu machen.",
      },
      {
        label: "Medizin",
        title: "Medizinische Struktur",
        text:
          "Fragebögen, Fallübersicht und Hinweise orientieren sich an ärztlich prüfbaren Informationen.",
      },
      {
        label: "Technologie",
        title: "KI und Prozesslogik",
        text:
          "KI unterstützt nur beim Entwurf. Die finale Prüfung und Freigabe bleibt ärztlich.",
      },
    ],
    principles: [
      "Strukturierte Patientenantworten",
      "Knie- und Hüft-TEP getrennt abbildbar",
      "Ärztlich prüfbare Fallübersicht",
      "KI-generierte Dokumentation nur als Entwurf",
    ],
  },
  en: {
    eyebrow: "Team",
    title: "Medicine, product logic and automation brought together.",
    description:
      "Klineus combines medical requirements, structured data collection and AI-supported documentation workflows.",
    primaryAction: "Contact us",
    secondaryAction: "View product",
    sectionEyebrow: "Capabilities",
    sectionTitle: "An interdisciplinary approach to clinically meaningful software.",
    sectionText:
      "The prototype is designed not to replace physician work, but to prepare pre-consultation information more clearly.",
    missionEyebrow: "How we work",
    missionTitle: "Physician control stays at the center.",
    missionText:
      "Klineus collects patient answers in a structured way, groups them medically and creates reviewable documentation drafts only.",
    ctaTitle: "Would you like to pilot Klineus?",
    ctaText:
      "We welcome feedback from doctors, clinics and partners.",
    ctaButton: "Contact us",
    capabilities: [
      {
        label: "Business",
        title: "Product and execution",
        text:
          "Klineus is built as a focused prototype to make real workflows quickly testable.",
      },
      {
        label: "Medicine",
        title: "Medical structure",
        text:
          "Questionnaires, case review and notes are organized around physician-reviewable information.",
      },
      {
        label: "Technology",
        title: "AI and process logic",
        text:
          "AI supports drafting only. Final review and approval remain with the physician.",
      },
    ],
    principles: [
      "Structured patient answers",
      "Separate knee and hip pathways",
      "Physician-reviewable case overview",
      "AI-generated documentation as draft only",
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


function assetUrl(path) {
  if (!path) {
    return "";
  }

  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  if (path.startsWith("/")) {
    return `${API_BASE_URL}${path}`;
  }

  return `${API_BASE_URL}/${path}`;
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


function normalizeItems(section, language, fallbackItems) {
  const items = section?.items || [];

  if (!items.length) {
    return fallbackItems;
  }

  return items.map((item, index) => ({
    label:
      getText(item.eyebrow, language, "") ||
      item.icon ||
      String(index + 1).padStart(2, "0"),
    title: getText(item.title, language, fallbackItems[index]?.title || ""),
    text: getText(item.text, language, fallbackItems[index]?.text || ""),
  }));
}


export default function TeamPage() {
  const { language } = useLanguage();
  const text = fallbackCopy[language] || fallbackCopy.de;

  const [page, setPage] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadPage() {
      try {
        const response = await fetch(`${API_BASE_URL}/patient/pages/team`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Team page could not be loaded.");
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
      findSection(sections, ["hero", "team"]) ||
      sections[0] ||
      {};

    const capabilitiesSection =
      findSection(sections, ["capabilities", "business", "medicine", "technology"]) ||
      sections[1] ||
      {};

    const missionSection =
      findSection(sections, ["mission", "values", "approach", "working"]) ||
      sections[2] ||
      {};

    return {
      eyebrow: getText(heroSection.eyebrow, language, text.eyebrow),
      title: getText(heroSection.title || page?.title, language, text.title),
      description: getText(
        heroSection.subtitle || heroSection.body || page?.description,
        language,
        text.description
      ),
      imagePath: heroSection.image_path || "/static/images/team.png",
      imageAlt: getText(
        heroSection.image_alt,
        language,
        "Klineus clinical and product team"
      ),
      sectionEyebrow: getText(
        capabilitiesSection.eyebrow,
        language,
        text.sectionEyebrow
      ),
      sectionTitle: getText(
        capabilitiesSection.title,
        language,
        text.sectionTitle
      ),
      sectionText: getText(
        capabilitiesSection.subtitle || capabilitiesSection.body,
        language,
        text.sectionText
      ),
      capabilities: normalizeItems(
        capabilitiesSection,
        language,
        text.capabilities
      ),
      missionEyebrow: getText(
        missionSection.eyebrow,
        language,
        text.missionEyebrow
      ),
      missionTitle: getText(
        missionSection.title,
        language,
        text.missionTitle
      ),
      missionText: getText(
        missionSection.subtitle || missionSection.body,
        language,
        text.missionText
      ),
    };
  }, [language, page, text]);

  return (
    <AppShell>
      <main className="team-page-pro">
        <section className="team-hero-pro">
          <div className="team-hero-copy-pro">
            <p className="eyebrow">{content.eyebrow}</p>

            <h1>{content.title}</h1>

            <p>{content.description}</p>

            <div className="team-hero-actions-pro">
              <Link className="primary-button" to="/contact">
                {text.primaryAction}
              </Link>

              <Link className="secondary-button" to="/product">
                {text.secondaryAction}
              </Link>
            </div>
          </div>

          <div className="team-hero-media-pro">
            <img
              src={assetUrl(content.imagePath)}
              alt={content.imageAlt}
              width="720"
              height="540"
              loading="eager"
            />
          </div>
        </section>

        <section className="team-capabilities-pro">
          <div className="team-section-heading-pro">
            <p className="eyebrow">{content.sectionEyebrow}</p>

            <div>
              <h2>{content.sectionTitle}</h2>
              <p>{content.sectionText}</p>
            </div>
          </div>

          <div className="team-card-grid-pro">
            {content.capabilities.slice(0, 3).map((item, index) => (
              <article className="team-capability-card-pro" key={`${item.title}-${index}`}>
                <span>{item.label}</span>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="team-mission-pro">
          <div className="team-mission-copy-pro">
            <p className="eyebrow">{content.missionEyebrow}</p>
            <h2>{content.missionTitle}</h2>
            <p>{content.missionText}</p>
          </div>

          <div className="team-principle-list-pro">
            {text.principles.map((principle, index) => (
              <article key={principle}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{principle}</strong>
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