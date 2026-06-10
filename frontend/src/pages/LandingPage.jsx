import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import AppShell from "../components/AppShell.jsx";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { api } from "../services/api.js";


const fallbackCopy = {
  de: {
    eyebrow: "Klineus Prototyp",
    title: "Strukturierte Patientenerfassung für Knie- und Hüft-TEP.",
    lead:
      "Klineus unterstützt Patientinnen und Patienten beim Ausfüllen eines strukturierten Fragebogens und hilft Ärztinnen und Ärzten, Fälle effizient zu prüfen und Dokumentationsentwürfe vorzubereiten.",
    primaryCta: "Fragebogen starten",
    secondaryCta: "Produkt ansehen",
    trustOne: "Knie- und Hüft-TEP",
    trustTwo: "Arztprüfung vorgesehen",
    trustThree: "KI-Entwurf mit Freigabe",
    workflowEyebrow: "Ablauf",
    workflowTitle: "Vom Fragebogen zum ärztlich geprüften Entwurf.",
    steps: [
      {
        title: "Patientendaten erfassen",
        text: "Patientinnen und Patienten beantworten indikationsspezifische Fragen zu Beschwerden, Alltag, Vorbehandlung und Risikohinweisen.",
      },
      {
        title: "Fall im Dashboard prüfen",
        text: "Ärztinnen und Ärzte sehen strukturierte Antworten, Warnhinweise und wichtige offene Punkte für das Gespräch.",
      },
      {
        title: "Dokumentation vorbereiten",
        text: "Ein KI-generierter Entwurf wird erstellt, bleibt aber immer prüfpflichtig und muss ärztlich freigegeben werden.",
      },
    ],
    benefitsEyebrow: "Warum Klineus",
    benefitsTitle: "Für bessere Vorbereitung, nicht für automatische Entscheidungen.",
    benefits: [
      "Standardisierte Erfassung vor dem Termin",
      "Klarere Übersicht über Beschwerden und Funktion",
      "Risikohinweise für die ärztliche Prüfung",
      "PDF-tauglicher Dokumentationsentwurf",
    ],
    ctaTitle: "Starten Sie mit dem Prototyp.",
    ctaText:
      "Wählen Sie einen Fragebogen aus und testen Sie den Ablauf vom Patientenformular bis zum ärztlichen Dashboard.",
    ctaButton: "Zum Patientenstart",
  },
  en: {
    eyebrow: "Klineus prototype",
    title: "Structured patient intake for knee and hip replacement pathways.",
    lead:
      "Klineus helps patients complete a structured questionnaire and supports doctors with efficient case review and documentation drafting.",
    primaryCta: "Start questionnaire",
    secondaryCta: "View product",
    trustOne: "Knee and hip TEP",
    trustTwo: "Doctor review required",
    trustThree: "AI draft with approval",
    workflowEyebrow: "Workflow",
    workflowTitle: "From questionnaire to physician-reviewed draft.",
    steps: [
      {
        title: "Collect patient information",
        text: "Patients answer indication-specific questions about symptoms, daily life, prior treatment and risk notes.",
      },
      {
        title: "Review case in dashboard",
        text: "Doctors see structured answers, documentation notes and open points for the consultation.",
      },
      {
        title: "Prepare documentation",
        text: "An AI-generated draft can be created, but it always requires physician review and approval.",
      },
    ],
    benefitsEyebrow: "Why Klineus",
    benefitsTitle: "Built for preparation, not automated decisions.",
    benefits: [
      "Standardized intake before the appointment",
      "Clearer overview of symptoms and function",
      "Risk notes for medical review",
      "PDF-ready documentation draft",
    ],
    ctaTitle: "Start with the prototype.",
    ctaText:
      "Select a questionnaire and test the flow from patient form to doctor dashboard.",
    ctaButton: "Go to patient start",
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


export default function LandingPage() {
  const { language } = useLanguage();
  const text = fallbackCopy[language] || fallbackCopy.de;

  const [page, setPage] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function loadPage() {
      try {
        const data = await api.getPage("home");

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

  const heroTitle = getText(heroSection?.title, language, text.title);
  const heroBody = getText(heroSection?.body, language, text.lead);
  const heroEyebrow = getText(heroSection?.eyebrow, language, text.eyebrow);
  const heroImage = normalizeImagePath(
    heroSection?.image_path,
    "/static/images/hero-medical.png"
  );
  const heroImageAlt = getText(
    heroSection?.image_alt,
    language,
    "Klineus medical documentation support"
  );

  return (
    <AppShell>
      <main className="landing-page-pro">
        <section className="home-hero-pro">
          <div className="home-hero-copy-pro">
            <p className="eyebrow">{heroEyebrow}</p>
            <h1>{heroTitle}</h1>
            <p>{heroBody}</p>

            <div className="hero-actions">
              <Link className="primary-button" to="/patient/start">
                {text.primaryCta}
              </Link>

              <Link className="secondary-button" to="/product">
                {text.secondaryCta}
              </Link>
            </div>

            <div className="home-trust-row-pro" aria-label="Klineus features">
              <span>{text.trustOne}</span>
              <span>{text.trustTwo}</span>
              <span>{text.trustThree}</span>
            </div>
          </div>

          <div className="home-hero-media-pro">
            <img
              className="home-hero-image"
              src={heroImage}
              alt={heroImageAlt}
              loading="eager"
            />

            <div className="home-hero-note-pro">
              <strong>Klineus</strong>
              <span>{text.trustThree}</span>
            </div>
          </div>
        </section>

        <section className="home-workflow-pro">
          <div className="section-heading">
            <p className="eyebrow">{text.workflowEyebrow}</p>
            <h2>{text.workflowTitle}</h2>
          </div>

          <div className="home-step-grid-pro">
            {text.steps.map((step, index) => (
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
            <p className="eyebrow">{text.benefitsEyebrow}</p>
            <h2>{text.benefitsTitle}</h2>
          </div>

          <div className="home-benefit-list-pro">
            {text.benefits.map((benefit) => (
              <article key={benefit}>
                <span>✓</span>
                <p>{benefit}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="home-cta-pro">
          <div>
            <p className="eyebrow">Klineus</p>
            <h2>{text.ctaTitle}</h2>
            <p>{text.ctaText}</p>
          </div>

          <Link className="primary-button" to="/patient/start">
            {text.ctaButton}
          </Link>
        </section>
      </main>
    </AppShell>
  );
}