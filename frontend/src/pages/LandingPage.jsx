import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import AppShell from "../components/AppShell.jsx";
import { useLanguage } from "../i18n/LanguageContext.jsx";


const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";


const fallbackCopy = {
  de: {
    eyebrow: "Orthopädische Dokumentationsunterstützung",
    title: "Klineus strukturiert Patientenantworten für die ärztliche Prüfung.",
    lead:
      "Ein schlanker Prototyp für Knie- und Hüft-TEP-Fragebögen, Fallübersicht und Dokumentationsentwürfe.",
    sublead:
      "Patientendaten werden strukturiert erhoben, medizinisch geordnet und für die ärztliche Bewertung vorbereitet.",
    primaryAction: "Patientenfragebogen starten",
    secondaryAction: "Arzt-Dashboard öffnen",
    sectionEyebrow: "Workflow",
    sectionTitle: "Vom Patientenfragebogen zur prüfbaren Fallübersicht.",
    sectionText:
      "Klineus reduziert unstrukturierte Vorinformationen und macht relevante Angaben für die ärztliche Dokumentation schneller sichtbar.",
    ctaTitle: "Bereit für den ersten Testlauf?",
    ctaText:
      "Starten Sie einen Fragebogen oder öffnen Sie das Arzt-Dashboard, um den Prototyp zu prüfen.",
    patient: "Patientenaufnahme",
    patientText: "Patienten wählen Knie oder Hüfte und beantworten strukturierte Fragen.",
    review: "Ärztliche Prüfung",
    reviewText: "Antworten werden nach Abschnitten gruppiert und im Dashboard sichtbar.",
    report: "Dokumentationsentwurf",
    reportText: "Die KI erstellt einen Entwurf, der ärztlich geprüft und freigegeben wird.",
    badge1: "Knie und Hüfte",
    badge2: "Ärztliche Kontrolle",
    badge3: "KI nur als Entwurf",
  },
  en: {
    eyebrow: "Orthopedic documentation support",
    title: "Klineus structures patient answers for physician review.",
    lead:
      "A focused prototype for knee and hip replacement questionnaires, case review and documentation drafts.",
    sublead:
      "Patient information is collected in a structured way, medically organized and prepared for physician review.",
    primaryAction: "Start patient questionnaire",
    secondaryAction: "Open doctor dashboard",
    sectionEyebrow: "Workflow",
    sectionTitle: "From patient intake to a reviewable clinical case overview.",
    sectionText:
      "Klineus reduces unstructured pre-consultation information and makes relevant details easier to review for documentation.",
    ctaTitle: "Ready for the first test run?",
    ctaText:
      "Start a questionnaire or open the doctor dashboard to review the prototype.",
    patient: "Patient intake",
    patientText: "Patients choose knee or hip and answer structured questions.",
    review: "Physician review",
    reviewText: "Answers are grouped by section and displayed in the doctor dashboard.",
    report: "Documentation draft",
    reportText: "AI creates a draft that must be checked and approved by a physician.",
    badge1: "Knee and hip",
    badge2: "Physician controlled",
    badge3: "AI as draft only",
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


function findSection(sections, keys) {
  return sections.find((section) => {
    const searchable = [
      section.id,
      section.type,
      section.eyebrow?.de,
      section.eyebrow?.en,
      section.title?.de,
      section.title?.en,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return keys.some((key) => searchable.includes(key.toLowerCase()));
  });
}


export default function LandingPage() {
  const { language } = useLanguage();
  const text = fallbackCopy[language] || fallbackCopy.de;

  const [page, setPage] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadPage() {
      try {
        const response = await fetch(`${API_BASE_URL}/patient/pages/home`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Home page could not be loaded.");
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
      findSection(sections, ["hero", "orthopedic", "documentation"]) ||
      sections[0] ||
      {};

    const workflowSection =
      findSection(sections, ["workflow", "process", "patient answers"]) ||
      sections[1] ||
      {};

    const workflowItems = workflowSection.items?.length
      ? workflowSection.items
      : [
          {
            id: "patient",
            title: { de: text.patient, en: text.patient },
            text: { de: text.patientText, en: text.patientText },
          },
          {
            id: "review",
            title: { de: text.review, en: text.review },
            text: { de: text.reviewText, en: text.reviewText },
          },
          {
            id: "report",
            title: { de: text.report, en: text.report },
            text: { de: text.reportText, en: text.reportText },
          },
        ];

    return {
      eyebrow: getText(heroSection.eyebrow, language, text.eyebrow),
      title: getText(heroSection.title || page?.title, language, text.title),
      lead: getText(
        heroSection.subtitle || page?.description,
        language,
        text.lead
      ),
      sublead: getText(heroSection.body, language, text.sublead),
      imagePath: heroSection.image_path || "/static/images/hero-medical.png",
      imageAlt: getText(
        heroSection.image_alt,
        language,
        "Doctor explaining knee and hip treatment"
      ),
      workflowEyebrow: getText(
        workflowSection.eyebrow,
        language,
        text.sectionEyebrow
      ),
      workflowTitle: getText(
        workflowSection.title,
        language,
        text.sectionTitle
      ),
      workflowText: getText(
        workflowSection.subtitle || workflowSection.body,
        language,
        text.sectionText
      ),
      workflowItems,
    };
  }, [language, page, text]);

  return (
    <AppShell>
      <main className="home-page-pro">
        <section className="home-hero-pro">
          <div className="home-hero-copy-pro">
            <p className="eyebrow">{content.eyebrow}</p>

            <h1>{content.title}</h1>

            <p className="home-hero-lead">{content.lead}</p>

            <p className="home-hero-sublead">{content.sublead}</p>

            <div className="home-hero-actions">
              <Link className="primary-button" to="/patient/start">
                {text.primaryAction}
              </Link>

              <Link className="secondary-button" to="/doctor/login">
                {text.secondaryAction}
              </Link>
            </div>

            <div className="home-badge-row">
              <span>{text.badge1}</span>
              <span>{text.badge2}</span>
              <span>{text.badge3}</span>
            </div>
          </div>

          <div className="home-hero-media-pro">
            <img
              src={assetUrl(content.imagePath)}
              alt={content.imageAlt}
              width="720"
              height="540"
              loading="eager"
            />
          </div>
        </section>

        <section className="home-workflow-pro">
          <div className="home-section-heading-pro">
            <p className="eyebrow">{content.workflowEyebrow}</p>

            <div>
              <h2>{content.workflowTitle}</h2>
              <p>{content.workflowText}</p>
            </div>
          </div>

          <div className="home-workflow-grid-pro">
            {content.workflowItems.slice(0, 3).map((item, index) => (
              <article className="home-workflow-card-pro" key={item.id || index}>
                <span>{String(index + 1).padStart(2, "0")}</span>

                <h3>{getText(item.title, language, text.patient)}</h3>

                <p>{getText(item.text, language, text.patientText)}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="home-split-cta-pro">
          <div>
            <p className="eyebrow">Klineus</p>
            <h2>{text.ctaTitle}</h2>
            <p>{text.ctaText}</p>
          </div>

          <div className="home-cta-actions-pro">
            <Link className="primary-button" to="/patient/start">
              {text.primaryAction}
            </Link>

            <Link className="secondary-button" to="/contact">
              Contact
            </Link>
          </div>
        </section>
      </main>
    </AppShell>
  );
}