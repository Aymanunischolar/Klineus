import { useEffect, useMemo, useState } from "react";

import AppShell from "../components/AppShell.jsx";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { api } from "../services/api.js";

const fallbackCopy = {
  de: {
    title: "Klineus",
    lead:
      "Klineus unterstützt die strukturierte Erhebung, Einordnung und Dokumentation patientenbezogener Informationen vor dem Arztkontakt.",

    workflowEyebrow: "Ablauf",
    workflowTitle: "Vom Fragebogen zur ärztlichen Übersicht.",
    steps: [
      {
        title: "Patienteninformationen erfassen",
        text:
          "Patientinnen und Patienten beantworten strukturierte Fragen zu Beschwerden, Alltag, Vorbehandlung und relevanten Hinweisen.",
      },
      {
        title: "Fall im Dashboard prüfen",
        text:
          "Ärztinnen und Ärzte sehen die Antworten übersichtlich zusammengefasst und können wichtige Punkte für das Gespräch prüfen.",
      },
      {
        title: "Dokumentation vorbereiten",
        text:
          "Die Informationen können für eine strukturierte ärztliche Dokumentation vorbereitet werden.",
      },
    ],

    benefitsEyebrow: "Warum Klineus",
    benefitsTitle: "Für bessere Vorbereitung vor dem Termin.",
    benefits: [
      "Strukturierte Erfassung vor dem Arztkontakt",
      "Übersichtliche Darstellung für Ärztinnen und Ärzte",
      "Bessere Vorbereitung des Patientengesprächs",
      "Klare Dokumentation relevanter Angaben",
    ],
  },

  en: {
    title: "Klineus",
    lead:
      "Klineus supports the structured collection, organization and documentation of patient-related information before the medical consultation.",

    workflowEyebrow: "Workflow",
    workflowTitle: "From questionnaire to physician overview.",
    steps: [
      {
        title: "Collect patient information",
        text:
          "Patients answer structured questions about symptoms, daily life, prior treatment and relevant notes.",
      },
      {
        title: "Review the case in the dashboard",
        text:
          "Doctors see the answers clearly summarized and can review important points for the consultation.",
      },
      {
        title: "Prepare documentation",
        text:
          "The information can be prepared for structured medical documentation.",
      },
    ],

    benefitsEyebrow: "Why Klineus",
    benefitsTitle: "Better preparation before the appointment.",
    benefits: [
      "Structured intake before the medical consultation",
      "Clear overview for doctors",
      "Better preparation for the patient conversation",
      "Clear documentation of relevant information",
    ],
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

  const heroImage = normalizeImagePath(
    heroSection?.image_path,
    "/static/images/hero-medical.png",
  );

  const heroImageAlt = getText(
    heroSection?.image_alt,
    language,
    "Klineus medical documentation support",
  );

  return (
    <AppShell>
      <main className="landing-page-pro">
        <section className="home-hero-pro">
          <div className="home-hero-copy-pro">
            <h1>{heroTitle}</h1>
            <p>{heroBody}</p>
          </div>

          <div className="home-hero-media-pro">
            <img
              className="home-hero-image"
              src={heroImage}
              alt={heroImageAlt}
              loading="eager"
            />
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
      </main>
    </AppShell>
  );
}