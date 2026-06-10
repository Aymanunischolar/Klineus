import { Link } from "react-router-dom";

import { useLanguage } from "../i18n/LanguageContext.jsx";
import { api } from "../services/api.js";


function getText(value, language = "de", fallback = "") {
  if (!value) {
    return fallback;
  }

  if (typeof value === "string") {
    return value;
  }

  return value[language] || value.de || value.en || fallback;
}


function isExternalLink(href = "") {
  return (
    href.startsWith("http://") ||
    href.startsWith("https://") ||
    href.startsWith("mailto:") ||
    href.startsWith("tel:")
  );
}


function CmsLink({ link }) {
  const { language } = useLanguage();

  if (!link?.href) {
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
    <Link className={className} to={link.href}>
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
      <Link className="cms-item-card" to={item.href}>
        {content}
      </Link>
    );
  }

  return <article className="cms-item-card">{content}</article>;
}


function CmsSection({ section }) {
  const { language } = useLanguage();

  const eyebrow = getText(section.eyebrow, language);
  const title = getText(section.title, language);
  const subtitle = getText(section.subtitle, language);
  const body = getText(section.body, language);
  const sectionType = section.type || "standard";
  const hasImage = Boolean(section.image_path);
  const hasItems = Array.isArray(section.items) && section.items.length > 0;
  const hasLinks = Array.isArray(section.links) && section.links.length > 0;

  if (sectionType === "hero") {
    return (
      <section className="cms-section cms-hero-section">
        <div className="cms-hero-copy">
          {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
          {title ? <h1>{title}</h1> : null}
          {subtitle ? <p className="hero-lead">{subtitle}</p> : null}
          {body ? <p>{body}</p> : null}

          {hasLinks ? (
            <div className="hero-actions">
              {section.links.map((link) => (
                <CmsLink key={`${link.href}-${getText(link.label, language)}`} link={link} />
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
          <div className="hero-actions centered-actions">
            {section.links.map((link) => (
              <CmsLink key={`${link.href}-${getText(link.label, language)}`} link={link} />
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
          {section.items.map((item) => (
            <CmsItemCard key={item.id} item={item} />
          ))}
        </div>
      ) : null}

      {hasLinks ? (
        <div className="hero-actions centered-actions">
          {section.links.map((link) => (
            <CmsLink key={`${link.href}-${getText(link.label, language)}`} link={link} />
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

  const sections = [...(page.sections || [])].sort(
    (a, b) => (a.order || 0) - (b.order || 0)
  );

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