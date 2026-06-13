import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import AppShell from "../components/AppShell.jsx";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { api } from "../services/api.js";


const fallbackCopy = {
  de: {
    eyebrow: "Produkt",
    title: "Ein strukturierter Prototyp für Patientenerfassung und ärztliche Dokumentation.",
    lead:
      "Klineus verbindet indikationsspezifische Fragebögen, ein ärztliches Dashboard und KI-gestützte Dokumentationsentwürfe in einem klaren Ablauf.",
    imageAlt: "Klineus Produktansicht",
    primaryCta: "Fragebogen starten",
    secondaryCta: "Doctor Login",
    featuresEyebrow: "Funktionen",
    featuresTitle: "Was der Prototyp aktuell unterstützt.",
    features: [
      {
        title: "Patientenfragebögen",
        text: "Knie- und Hüft-TEP-Fragebögen mit strukturierten Antwortgruppen, Pflichtfragen und mobilen Eingabemasken.",
      },
      {
  title: "Ärztliches Dashboard",
  text: "Übersicht über eingereichte Fälle, Indikation, Status, Warnhinweise und Antworten.",
},
      {
        title: "KI-Dokumentationsentwurf",
        text: "Generierung eines prüfpflichtigen medizinischen Entwurfs, inklusive offener Punkte und PDF-fähiger Vorschau.",
      },
    ],
    workflowEyebrow: "Ablauf",
    workflowTitle: "Ein Workflow mit klarer ärztlicher Verantwortung.",
    workflow: [
      "Patient wählt Knie- oder Hüftfragebogen.",
      "Antworten werden strukturiert gespeichert.",
      "Ärztin oder Arzt prüft Fall und Hinweise.",
      "KI-Entwurf kann erzeugt, bearbeitet und als PDF exportiert werden.",
    ],
    complianceTitle: "Bewusst sicherheitsorientiert.",
    complianceText:
      "Klineus ersetzt keine ärztliche Untersuchung. Der KI-Bericht ist ein Entwurf und muss vor jeder Verwendung geprüft, korrigiert und freigegeben werden.",
    ctaTitle: "Bereit zum Testen?",
    ctaText:
      "Starten Sie einen Patientenfall oder öffnen Sie das Dashboard, um den Ablauf zu prüfen.",
  },
  en: {
    eyebrow: "Product",
    title: "A structured prototype for patient intake and medical documentation.",
    lead:
      "Klineus combines indication-specific questionnaires, a doctor dashboard and AI-supported documentation drafts in one clear workflow.",
    imageAlt: "Klineus product view",
    primaryCta: "Start questionnaire",
    secondaryCta: "Doctor login",
    featuresEyebrow: "Features",
    featuresTitle: "What the prototype currently supports.",
    features: [
      {
        title: "Patient questionnaires",
        text: "Knee and hip replacement questionnaires with structured answer groups, required questions and mobile-friendly inputs.",
      },
      {
  title: "Doctor dashboard",
  text: "Overview of submitted cases, indication, status, documentation notes and answers.",
},
      {
        title: "AI documentation draft",
        text: "Generation of a review-required medical draft with open points and PDF-ready preview.",
      },
    ],
    workflowEyebrow: "Workflow",
    workflowTitle: "A workflow with clear physician responsibility.",
    workflow: [
      "Patient selects knee or hip questionnaire.",
      "Answers are stored in a structured format.",
      "Doctor reviews the case and documentation notes.",
      "AI draft can be generated, edited and exported as PDF.",
    ],
    complianceTitle: "Safety-oriented by design.",
    complianceText:
      "Klineus does not replace a medical examination. The AI report is a draft and must be reviewed, corrected and approved before use.",
    ctaTitle: "Ready to test?",
    ctaText:
      "Start a patient case or open the dashboard to review the workflow.",
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


export default function ProductPage() {
  const { language } = useLanguage();
  const text = fallbackCopy[language] || fallbackCopy.de;

  const [page, setPage] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function loadPage() {
      try {
        const data = await api.getPage("product");

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
    "/static/images/hero-medical.png"
  );
  const heroImageAlt = getText(
    heroSection?.image_alt,
    language,
    text.imageAlt
  );

  return (
    <AppShell>
      <main className="product-page-pro">
        <section className="product-hero-pro">
          <div className="product-hero-copy-pro">
            <p className="eyebrow">{heroEyebrow}</p>
            <h1>{heroTitle}</h1>
            <p>{heroBody}</p>

            <div className="hero-actions">
              <Link className="primary-button" to="/patient/start">
                {text.primaryCta}
              </Link>

              <Link className="secondary-button" to="/doctor/login">
                {text.secondaryCta}
              </Link>
            </div>
          </div>

          <div className="product-hero-media-pro">
            <img
              className="product-hero-image"
              src={heroImage}
              alt={heroImageAlt}
              loading="eager"
            />
          </div>
        </section>

        <section className="product-feature-section-pro">
          <div className="section-heading">
            <p className="eyebrow">{text.featuresEyebrow}</p>
            <h2>{text.featuresTitle}</h2>
          </div>

          <div className="product-feature-grid-pro">
            {text.features.map((feature) => (
              <article className="product-feature-card-pro" key={feature.title}>
                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="product-process-pro">
          <div>
            <p className="eyebrow">{text.workflowEyebrow}</p>
            <h2>{text.workflowTitle}</h2>
          </div>

          <ol className="product-process-list-pro">
            {text.workflow.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        </section>

        <section className="product-compliance-pro">
          <div>
            <p className="eyebrow">Safety</p>
            <h2>{text.complianceTitle}</h2>
            <p>{text.complianceText}</p>
          </div>
        </section>

        <section className="product-cta-pro">
          <div>
            <p className="eyebrow">Klineus</p>
            <h2>{text.ctaTitle}</h2>
            <p>{text.ctaText}</p>
          </div>

          <div className="hero-actions">
            <Link className="primary-button" to="/patient/start">
              {text.primaryCta}
            </Link>

            <Link className="secondary-button" to="/doctor/login">
              {text.secondaryCta}
            </Link>
          </div>
        </section>
      </main>
    </AppShell>
  );
}