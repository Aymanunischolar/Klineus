import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import AppShell from "./AppShell.jsx";
import CmsPageRenderer from "./CmsPageRenderer.jsx";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { api } from "../services/api.js";

const PUBLIC_CMS_SLUGS = ["home", "product", "team", "contact", "legal"];

const BLOCKED_SLUG_PARTS = [
  "patient",
  "doctor",
  "admin",
  "login",
  "questionnaire",
  "prototype",
  "prototyp",
];

const copy = {
  de: {
    loading: "Inhalte werden geladen ...",
    errorTitle: "Inhalt konnte nicht geladen werden",
    blockedTitle: "Diese Seite ist nicht öffentlich verfügbar",
    blockedText:
      "Der angeforderte Inhalt gehört nicht zum öffentlichen Website-Bereich.",
    retry: "Erneut versuchen",
    home: "Zur Startseite",
  },
  en: {
    loading: "Loading content ...",
    errorTitle: "Content could not be loaded",
    blockedTitle: "This page is not publicly available",
    blockedText:
      "The requested content is not part of the public website area.",
    retry: "Try again",
    home: "Go to homepage",
  },
};

function normalizeSlug(value) {
  return String(value || "")
    .trim()
    .replace(/^\/+/, "")
    .replace(/\/+$/, "")
    .toLowerCase();
}

function isBlockedSlug(slug) {
  const normalizedSlug = normalizeSlug(slug);

  if (!normalizedSlug) {
    return true;
  }

  if (PUBLIC_CMS_SLUGS.includes(normalizedSlug)) {
    return false;
  }

  return BLOCKED_SLUG_PARTS.some(
    (part) =>
      normalizedSlug === part ||
      normalizedSlug.startsWith(`${part}/`) ||
      normalizedSlug.includes(`/${part}/`),
  );
}

function fallbackPage(slug, language) {
  const title =
    language === "en"
      ? "Klineus"
      : "Klineus";

  const description =
    language === "en"
      ? "Structured preparation of medically relevant patient information."
      : "Strukturierte Vorbereitung medizinisch relevanter Patientenangaben.";

  return {
    slug,
    title: {
      de: title,
      en: title,
    },
    description: {
      de: description,
      en: description,
    },
    sections: [
      {
        id: "fallback",
        type: "hero",
        order: 1,
        eyebrow: {
          de: "Klineus",
          en: "Klineus",
        },
        title: {
          de: title,
          en: title,
        },
        subtitle: {
          de: description,
          en: description,
        },
        body: {},
        image_path: null,
        image_alt: {},
        links: [],
        items: [],
        settings: {},
      },
    ],
  };
}

export default function CmsPageLoader({
  slug,
  compact = false,
  hideNav = false,
}) {
  const { language } = useLanguage();
  const text = copy[language] || copy.de;

  const normalizedSlug = useMemo(() => normalizeSlug(slug), [slug]);
  const blocked = useMemo(() => isBlockedSlug(normalizedSlug), [normalizedSlug]);

  const [page, setPage] = useState(null);
  const [status, setStatus] = useState(blocked ? "blocked" : "loading");
  const [error, setError] = useState("");

  async function loadPage() {
    if (blocked) {
      setPage(null);
      setError("");
      setStatus("blocked");
      return;
    }

    try {
      setStatus("loading");
      setError("");

      const data = await api.getPage(normalizedSlug);

      if (!data || data.is_published === false) {
        setPage(fallbackPage(normalizedSlug, language));
      } else {
        setPage(data);
      }

      setStatus("success");
    } catch (err) {
      setError(err.message || text.errorTitle);
      setPage(fallbackPage(normalizedSlug, language));
      setStatus("error");
    }
  }

  useEffect(() => {
    loadPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [normalizedSlug, blocked, language]);

  return (
    <AppShell compact={compact} hideNav={hideNav}>
      {status === "loading" ? (
        <section className="patient-card">
          <p className="eyebrow">Klineus</p>
          <h1>{text.loading}</h1>
        </section>
      ) : null}

      {status === "blocked" ? (
        <section className="patient-card">
          <p className="eyebrow">Klineus</p>
          <h1>{text.blockedTitle}</h1>
          <p>{text.blockedText}</p>

          <div className="case-header-actions">
            <Link className="primary-button" to="/home">
              {text.home}
            </Link>
          </div>
        </section>
      ) : null}

      {status === "error" ? (
        <section className="patient-card">
          <p className="eyebrow">Klineus</p>
          <h1>{text.errorTitle}</h1>
          <p>{error}</p>

          <div className="case-header-actions">
            <button className="primary-button" type="button" onClick={loadPage}>
              {text.retry}
            </button>

            <Link className="secondary-button" to="/home">
              {text.home}
            </Link>
          </div>
        </section>
      ) : null}

      {status === "success" ? <CmsPageRenderer page={page} /> : null}
    </AppShell>
  );
}