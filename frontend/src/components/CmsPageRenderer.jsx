import { Link } from "react-router-dom";

import { useLanguage } from "../i18n/LanguageContext.jsx";
import { api } from "../services/api.js";

const BLOCKED_INTERNAL_PREFIXES = [
  "/patient",
  "/doctor",
  "/admin",
  "/questionnaire",
  "/login",
];

const SAFE_INTERNAL_PREFIXES = ["/home", "/product", "/team", "/contact", "/legal"];

const BLOCKED_SECTION_TEXT = [
  "orthopädische dokumentations",
  "orthopaedische dokumentations",
  "entscheidungsunterstützung",
  "entscheidungsunterstuetzung",
  "prototype",
  "prototyp",
  "start questionnaire",
  "fragebogen starten",
  "patientenfragebogen starten",
  "doctor login",
  "arzt-login",
  "arztbereich",
];

function cleanCmsText(value) {
  return String(value || "")
    .replace(/^\s*Block\s+[A-Z]:\s*/i, "")
    .replaceAll("aerztlich", "ärztlich")
    .replaceAll("Aerztlich", "Ärztlich")
    .replaceAll("Pruefung", "Prüfung")
    .replaceAll("pruefung", "prüfung")
    .replaceAll("Huefte", "Hüfte")
    .replaceAll("fuer", "für")
    .replaceAll("moeglich", "möglich")
    .replaceAll("vollstaendig", "vollständig")
    .replaceAll("Roentgen", "Röntgen")
    .replaceAll("Klaerung", "Klärung")
    .replaceAll("Aufklaerung", "Aufklärung")
    .trim();
}

function getText(value, language = "de", fallback = "") {
  if (!value) {
    return fallback;
  }

  if (typeof value === "string") {
    return cleanCmsText(value);
  }

  return cleanCmsText(value[language] || value.de || value.en || fallback);
}

function isExternalLink(href = "") {
  return (
    href.startsWith("http://") ||
    href.startsWith("https://") ||
    href.startsWith("mailto:") ||
    href.startsWith("tel:")
  );
}

function normalizeHref(href = "") {
  const value = String(href || "").trim();

  if (!value) {
    return "";
  }

  if (isExternalLink(value)) {
    return value;
  }

  try {
    return new URL(value, window.location.origin).pathname;
  } catch {
    return value;
  }
}

function isBlockedInternalLink(href = "") {
  const normalizedHref = normalizeHref(href);

  if (!normalizedHref || isExternalLink(normalizedHref)) {
    return false;
  }

  if (SAFE_INTERNAL_PREFIXES.some((prefix) => normalizedHref === prefix)) {
    return false;
  }

  return BLOCKED_INTERNAL_PREFIXES.some(
    (prefix) =>
      normalizedHref === prefix || normalizedHref.startsWith(`${prefix}/`),
  );
}

function collectText(value) {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(collectText).join(" ");
  }

  if (typeof value === "object") {
    return Object.values(value).map(collectText).join(" ");
  }

  return String(value);
}

function containsBlockedSectionText(value) {
  const text = collectText(value).toLowerCase();

  return BLOCKED_SECTION_TEXT.some((blockedText) =>
    text.includes(blockedText),
  );
}

function safeLinks(links = []) {
  if (!Array.isArray(links)) {
    return [];
  }

  return links.filter((link) => link?.href && !isBlockedInternalLink(link.href));
}

function safeItems(items = []) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items.filter((item) => {
    if (!item) {
      return false;
    }

    if (item.href && isBlockedInternalLink(item.href)) {
      return false;
    }

    if (containsBlockedSectionText(item)) {
      return false;
    }

    return true;
  });
}

function shouldHideSection(section) {
  if (!section) {
    return true;
  }

  const sectionId = String(section.id || "").toLowerCase();
  const sectionType = String(section.type || "").toLowerCase();

  if (
    sectionId.includes("prototype") ||
    sectionId.includes("patient-start") ||
    sectionId.includes("questionnaire-access") ||
    sectionId.includes("doctor-access")
  ) {
    return true;
  }

  if (containsBlockedSectionText(section)) {
    return true;
  }

  if (sectionType === "cta") {
    const links = safeLinks(section.links);
    const items = safeItems(section.items);

    if (!links.length && !items.length) {
      return true;
    }
  }

  return false;
}

function CmsLink({ link }) {
  const { language } = useLanguage();

  if (!link?.href || isBlockedInternalLink(link.href)) {
    return null;
  }

  const label = getText(link.label, language, link.href);
  const className =
    link.variant === "primary" ? "primary-button" : "secondary-button";

  if (isExternalLink(link.href)) {
    return (
      <a className={className} href={link.href}>
        {label}
      </a>
    );
  }

  return (
    <Link className={className} to={normalizeHref(link.href)}>
      {label}
    </Link>
  );
}

function CmsImage({ path, alt }) {
  const { language } = useLanguage();

  if (!path) {
    return null;
  }

  return (
    <div className="cms-image-card">
      <img
        src={api.assetUrl(path)}
        alt={getText(alt, language, "")}
        loading="lazy"
      />
    </div>
  );
}

function CmsItemCard({ item }) {
  const { language } = useLanguage();

  if (!item || containsBlockedSectionText(item)) {
    return null;
  }

  if (item.href && isBlockedInternalLink(item.href)) {
    return null;
  }

  const title = getText(item.title, language);
  const text = getText(item.text, language);
  const eyebrow = getText(item.eyebrow, language);
  const imageAlt = getText(item.image_alt, language, title);

  const content = (
    <>
      {item.image_path ? (
        <img
          className="cms-item-image"
          src={api.assetUrl(item.image_path)}
          alt={imageAlt}
          loading="lazy"
        />
      ) : item.icon ? (
        <span className="cms-item-icon">{item.icon}</span>
      ) : null}

      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      {title ? <h3>{title}</h3> : null}
      {text ? <p>{text}</p> : null}
    </>
  );

  if (item.href) {
    if (isExternalLink(item.href)) {
      return (
        <a className="cms-item-card" href={item.href}>
          {content}
        </a>
      );
    }

    return (
      <Link className="cms-item-card" to={normalizeHref(item.href)}>
        {content}
      </Link>
    );
  }

  return <article className="cms-item-card">{content}</article>;
}

function CmsSection({ section }) {
  const { language } = useLanguage();

  if (shouldHideSection(section)) {
    return null;
  }

  const eyebrow = getText(section.eyebrow, language);
  const title = getText(section.title, language);
  const subtitle = getText(section.subtitle, language);
  const body = getText(section.body, language);
  const sectionType = section.type || "standard";
  const links = safeLinks(section.links);
  const items = safeItems(section.items);
  const hasImage = Boolean(section.image_path);
  const hasItems = items.length > 0;
  const hasLinks = links.length > 0;

  if (sectionType === "hero") {
    return (
      <section className="cms-section cms-hero-section">
        <div className="cms-hero-copy">
          {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
          {title ? <h1>{title}</h1> : null}
          {subtitle ? <p className="hero-lead">{subtitle}</p> : null}
          {body ? <p>{body}</p> : null}

          {hasLinks ? (
              <div className="cms-link-row">
                {links.map((link) => (
                    <CmsLink
                        key={`${link.href}-${getText(link.label, language)}`}
                        link={link}
                    />
                ))}
              </div>
          ) : null}
        </div>

        {hasImage ? (
          <CmsImage path={section.image_path} alt={section.image_alt} />
        ) : null}
      </section>
    );
  }

  if (sectionType === "cta") {
    return (
      <section className="cms-section cms-cta-section">
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        {title ? <h2>{title}</h2> : null}
        {body ? <p>{body}</p> : null}

        {hasLinks ? (
            <div className="cms-link-row cms-link-row-centered">
              {links.map((link) => (
                  <CmsLink
                      key={`${link.href}-${getText(link.label, language)}`}
                      link={link}
                  />
              ))}
            </div>
        ) : null}
      </section>
    );
  }

  return (
    <section className={`cms-section cms-${sectionType}-section`}>
      <div className="section-heading">
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        {title ? <h2>{title}</h2> : null}
        {subtitle ? <p>{subtitle}</p> : null}
        {body ? <p>{body}</p> : null}
      </div>

      {hasImage ? (
        <CmsImage path={section.image_path} alt={section.image_alt} />
      ) : null}

      {hasItems ? (
        <div className="cms-card-grid">
          {items.map((item) => (
            <CmsItemCard key={item.id} item={item} />
          ))}
        </div>
      ) : null}

      {hasLinks ? (
          <div className="cms-link-row cms-link-row-centered">
            {links.map((link) => (
                <CmsLink
                    key={`${link.href}-${getText(link.label, language)}`}
                    link={link}
                />
            ))}
          </div>
      ) : null}
    </section>
  );
}

export default function CmsPageRenderer({ page }) {
  const { language } = useLanguage();

  if (!page) {
    return null;
  }

  const sections = [...(page.sections || [])]
    .filter((section) => !shouldHideSection(section))
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  return (
    <div className="cms-page">
      {sections.map((section) => (
        <CmsSection key={section.id} section={section} />
      ))}

      {!sections.length ? (
        <section className="cms-section">
          <p className="eyebrow">{getText(page.title, language, page.slug)}</p>
          <h1>{getText(page.title, language, page.slug)}</h1>
          <p>{getText(page.description, language)}</p>
        </section>
      ) : null}
    </div>
  );
}