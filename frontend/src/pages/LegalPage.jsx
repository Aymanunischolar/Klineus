import { useEffect } from "react";
import { useLocation } from "react-router-dom";

import AppShell from "../components/AppShell.jsx";
import { legalContent } from "../data/legalContent.js";
import { OPERATOR, missingOperatorFields } from "../data/operator.js";
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

function ProviderBlock({ language }) {
  const missing = missingOperatorFields();
  const lines = [
    OPERATOR.name,
    OPERATOR.street,
    OPERATOR.postalCity,
    OPERATOR.postalCity ? OPERATOR.country : "",
  ].filter(Boolean);

  const facts = [
    [localText(language, "Vertreten durch", "Represented by"), OPERATOR.representative],
    [localText(language, "Registereintrag", "Commercial register"), OPERATOR.register],
    [localText(language, "Umsatzsteuer-ID", "VAT ID"), OPERATOR.vatId],
    [
      localText(language, "Verantwortlich für den Inhalt (§ 18 Abs. 2 MStV)", "Responsible for content (§ 18(2) MStV)"),
      OPERATOR.contentResponsible || OPERATOR.representative,
    ],
  ].filter(([, value]) => value);

  return (
    <div className="legal-prose-block">
      <h3>{localText(language, "Anbieter", "Provider")}</h3>

      <p>
        {lines.map((line) => (
          <span key={line} className="legal-line">
            {line}
          </span>
        ))}
      </p>

      {facts.length ? (
        <ul>
          {facts.map(([label, value]) => (
            <li key={label}>
              {label}: {value}
            </li>
          ))}
        </ul>
      ) : null}

      {missing.length ? (
        <p className="legal-notice" role="note">
          {localText(
            language,
            "Die vollständige Anbieterkennzeichnung (Anschrift und vertretungsberechtigte Person) wird ergänzt.",
            "The full provider identification (address and authorised representative) is being added.",
          )}
        </p>
      ) : null}
    </div>
  );
}

export default function LegalPage() {
  const { language } = useLanguage();
  const { hash } = useLocation();
  const content = legalContent[language] || legalContent.de;

  useEffect(() => {
    if (!hash) return;

    document.getElementById(hash.slice(1))?.scrollIntoView({ block: "start" });
  }, [hash]);

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

          <ProviderBlock language={language} />
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
