import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import AppShell from "./AppShell.jsx";
import CmsPageRenderer from "./CmsPageRenderer.jsx";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { api } from "../services/api.js";


const copy = {
  de: {
    loading: "Inhalte werden geladen ...",
    errorTitle: "Inhalt konnte nicht geladen werden",
    retry: "Erneut versuchen",
    home: "Zur Startseite",
  },
  en: {
    loading: "Loading content ...",
    errorTitle: "Content could not be loaded",
    retry: "Try again",
    home: "Go to homepage",
  },
};


export default function CmsPageLoader({ slug, compact = false, hideNav = false }) {
  const { language } = useLanguage();
  const text = copy[language] || copy.de;

  const [page, setPage] = useState(null);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");

  async function loadPage() {
    try {
      setStatus("loading");
      setError("");

      const data = await api.getPage(slug);

      setPage(data);
      setStatus("success");
    } catch (err) {
      setError(err.message || text.errorTitle);
      setStatus("error");
    }
  }

  useEffect(() => {
    loadPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  return (
    <AppShell compact={compact} hideNav={hideNav}>
      {status === "loading" ? (
        <section className="patient-card">
          <p className="eyebrow">Klineus</p>
          <h1>{text.loading}</h1>
        </section>
      ) : null}

      {status === "error" ? (
        <section className="patient-card">
          <p className="eyebrow">Klineus</p>
          <h1>{text.errorTitle}</h1>
          <p>{error}</p>

          <div className="hero-actions">
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