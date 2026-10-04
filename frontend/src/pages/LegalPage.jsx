import { useEffect } from "react";
import { useLocation } from "react-router-dom";

import AppShell from "../components/AppShell.jsx";
import { legalContent } from "../data/legalContent.js";
import { OPERATOR } from "../data/operator.js";
import { useLanguage } from "../i18n/LanguageContext.jsx";

function localText(language, de, en) {
  return language === "en" ? en : de;
}

function fill(text, language) {
  return text
    .replaceAll("{email}", OPERATOR.email)
    .replaceAll("{updated}", OPERATOR.updated[language] || OPERATOR.updated.de);
}

function Blocks({ blocks, language }) {
  return blocks.map((block) => (
    <div className="legal-prose-block" key={block.heading}>
      <h3>{block.heading}</h3>

      {(block.paragraphs || []).map((paragraph) => (
        <p key={paragraph}>{fill(paragraph, language)}</p>
      ))}

      {block.items ? (
        <ul>
          {block.items.map((item) => (
            <li key={item}>{fill(item, language)}</li>
          ))}
        </ul>
      ) : null}

      {(block.paragraphs2 || []).map((paragraph) => (
        <p key={paragraph}>{fill(paragraph, language)}</p>
      ))}
    </div>
  ));
}

export default function LegalPage() {
  const { language } = useLanguage();
  const { hash } = useLocation();
  const content = legalContent[language] || legalContent.de;

  // Images above the target load after the first paint and move it, so scroll
  // again a few times; stop as soon as the visitor scrolls themselves.
  useEffect(() => {
    if (!hash) return undefined;

    const go = () =>
      document.getElementById(hash.slice(1))?.scrollIntoView({ block: "start" });
    const timers = [0, 200, 600, 1400].map((delay) => window.setTimeout(go, delay));
    const stop = () => timers.forEach(window.clearTimeout);
    const events = ["wheel", "touchstart", "keydown", "mousedown"];

    events.forEach((name) => window.addEventListener(name, stop, { passive: true, once: true }));

    return () => {
      stop();
      events.forEach((name) => window.removeEventListener(name, stop));
    };
  }, [hash, language]);

  return (
    <AppShell>
      <main className="legal-clean-page">
        <section className="legal-clean-hero">
          <p className="eyebrow">{localText(language, "Rechtliches", "Legal")}</p>

          <h1>
            {localText(
              language,
              "Impressum, Datenschutz und KI",
              "Imprint, privacy and AI",
            )}
          </h1>

          <p>
            {localText(
              language,
              "Hier finden Sie das Impressum, die Datenschutzerklärung und Informationen zum Einsatz von Künstlicher Intelligenz bei Klineus.",
              "Here you will find the imprint, the privacy notice and information about how Klineus uses artificial intelligence.",
            )}
          </p>

          <div className="legal-clean-anchor-row">
            <a href="#terms">{content.imprint.title}</a>
            <a href="#privacy">{localText(language, "Datenschutz", "Privacy")}</a>
            <a href="#ai">{localText(language, "KI & Governance", "AI & governance")}</a>
          </div>
        </section>

        <section id="terms" className="legal-clean-section legal-prose">
          <div className="legal-clean-section-heading">
            <p className="eyebrow">{content.imprint.title}</p>
            <h2>{content.imprint.title}</h2>
            <p>{content.imprint.intro}</p>
          </div>

          <Blocks blocks={content.imprint.blocks} language={language} />
        </section>

        <section id="privacy" className="legal-clean-section legal-prose">
          <div className="legal-clean-section-heading">
            <p className="eyebrow">{localText(language, "Datenschutz", "Privacy")}</p>
            <h2>{content.privacy.title}</h2>
            <p>{fill(content.privacy.intro, language)}</p>
          </div>

          <Blocks blocks={content.privacy.blocks} language={language} />
        </section>

        <section id="ai" className="legal-clean-section legal-prose">
          <div className="legal-clean-section-heading">
            <p className="eyebrow">{localText(language, "Künstliche Intelligenz", "Artificial intelligence")}</p>
            <h2>{content.ai.title}</h2>
            <p>{content.ai.intro}</p>
          </div>

          <Blocks blocks={content.ai.blocks} language={language} />
        </section>
      </main>
    </AppShell>
  );
}
