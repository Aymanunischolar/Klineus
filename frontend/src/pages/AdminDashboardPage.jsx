import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import AppShell from "../components/AppShell.jsx";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { api } from "../services/api.js";

const FALLBACK_PATIENT_VALUE = "not-provided";
const FALLBACK_PATIENT_EMAIL = "not-provided@klineus.local";

const copy = {
  de: {
    eyebrow: "Admin-Dashboard",
    title: "Klineus Verwaltung",
    logout: "Abmelden",
    refresh: "Aktualisieren",
    loading: "Admin-Daten werden geladen ...",
    errorTitle: "Admin-Daten konnten nicht geladen werden",
    overview: "Statistiken",
    cms: "CMS-Seiten",
    media: "Medien",
    questionnaires: "Fragebögen",
    logs: "Logs",
    siteSettings: "Website-Einstellungen",
    totalCases: "Fälle gesamt",
    completedCases: "Abgeschlossene Fälle",
    generatedReports: "Generierte Berichte",
    editedReports: "Bearbeitete Berichte",
    avgFillTime: "Ø Ausfülldauer",
    avgPageLoad: "Ø Ladezeit",
    avgQuestions: "Ø Fragen pro Fall",
    contentPages: "CMS-Seiten",
    mediaAssets: "Medien",
    questionnaireCount: "Fragebögen",
    questionCount: "Fragen gesamt",
    aiRequests: "AI-Anfragen",
    aiFailures: "AI-Fehler",
    aiAvgTime: "Ø AI-Antwortzeit",
    apiRequests: "API-Anfragen",
    apiErrors: "API-Fehler",
    apiAvgTime: "Ø API-Antwortzeit",
    formTypeStats: "Statistik nach Formular-Typ",
    statusCodes: "API-Statuscodes",
    latestApiErrors: "Letzte API-Fehler",
    latestAiLogs: "Letzte AI-Logs",
    recentCases: "Neueste Fälle",
    submitted: "Abgesendet",
    aiGenerated: "AI generiert",
    aiEdited: "Bearbeitet",
    noData: "Keine Daten vorhanden.",
    caseReference: "Fall",
    patient: "Patient",
    indication: "Fragebogen",
    version: "Version",
    created: "Erstellt",
    status: "Status",
    caseId: "Fall-ID",
    pageEditor: "CMS-Seiten bearbeiten",
    newPage: "Neue Seite",
    edit: "Bearbeiten",
    save: "Speichern",
    saving: "Speichert ...",
    saved: "Gespeichert.",
    delete: "Löschen",
    deleteConfirm: "Wirklich löschen?",
    jsonHint:
      "Bearbeite den JSON-Inhalt. Später können wir daraus schönere Formularfelder machen.",
    selectPage: "Seite auswählen",
    selectQuestionnaire: "Fragebogen auswählen",
    mediaEditor: "Medienpfade bearbeiten",
    mediaKey: "Media-Key",
    mediaPath: "Dateipfad",
    mediaKind: "Typ",
    mediaAltDe: "Alt-Text DE",
    mediaAltEn: "Alt-Text EN",
    addOrUpdateMedia: "Medienpfad speichern",
    questionnaireEditor: "Fragebogen bearbeiten",
    publish: "Veröffentlichen",
    unpublish: "Deaktivieren",
    published: "Veröffentlicht",
    unpublished: "Entwurf",
    increaseVersion: "Version erhöhen",
    apiLogs: "API-Logs",
    aiLogs: "AI-Logs",
    level: "Level",
    method: "Methode",
    path: "Pfad",
    response: "Antwort",
    duration: "Dauer",
    message: "Nachricht",
    source: "Quelle",
    model: "Modell",
    success: "Erfolg",
    failed: "Fehler",
    errorMessage: "Fehlermeldung",
    details: "Details",
  },
  en: {
    eyebrow: "Admin dashboard",
    title: "Klineus administration",
    logout: "Log out",
    refresh: "Refresh",
    loading: "Loading admin data ...",
    errorTitle: "Admin data could not be loaded",
    overview: "Statistics",
    cms: "CMS pages",
    media: "Media",
    questionnaires: "Questionnaires",
    logs: "Logs",
    siteSettings: "Site settings",
    totalCases: "Total cases",
    completedCases: "Completed cases",
    generatedReports: "Generated reports",
    editedReports: "Edited reports",
    avgFillTime: "Avg. fill time",
    avgPageLoad: "Avg. page load",
    avgQuestions: "Avg. questions per case",
    contentPages: "CMS pages",
    mediaAssets: "Media assets",
    questionnaireCount: "Questionnaires",
    questionCount: "Total questions",
    aiRequests: "AI requests",
    aiFailures: "AI failures",
    aiAvgTime: "Avg. AI response time",
    apiRequests: "API requests",
    apiErrors: "API errors",
    apiAvgTime: "Avg. API response time",
    formTypeStats: "Statistics by form type",
    statusCodes: "API status codes",
    latestApiErrors: "Latest API errors",
    latestAiLogs: "Latest AI logs",
    recentCases: "Recent cases",
    submitted: "Submitted",
    aiGenerated: "AI generated",
    aiEdited: "Edited",
    noData: "No data available.",
    caseReference: "Case",
    patient: "Patient",
    indication: "Questionnaire",
    version: "Version",
    created: "Created",
    status: "Status",
    caseId: "Case ID",
    pageEditor: "Edit CMS pages",
    newPage: "New page",
    edit: "Edit",
    save: "Save",
    saving: "Saving ...",
    saved: "Saved.",
    delete: "Delete",
    deleteConfirm: "Really delete?",
    jsonHint:
      "Edit the JSON content. Later we can turn this into nicer form fields.",
    selectPage: "Select page",
    selectQuestionnaire: "Select questionnaire",
    mediaEditor: "Edit media paths",
    mediaKey: "Media key",
    mediaPath: "File path",
    mediaKind: "Type",
    mediaAltDe: "Alt text DE",
    mediaAltEn: "Alt text EN",
    addOrUpdateMedia: "Save media path",
    questionnaireEditor: "Edit questionnaire",
    publish: "Publish",
    unpublish: "Unpublish",
    published: "Published",
    unpublished: "Draft",
    increaseVersion: "Increase version",
    apiLogs: "API logs",
    aiLogs: "AI logs",
    level: "Level",
    method: "Method",
    path: "Path",
    response: "Response",
    duration: "Duration",
    message: "Message",
    source: "Source",
    model: "Model",
    success: "Success",
    failed: "Error",
    errorMessage: "Error message",
    details: "Details",
  },
};

function cleanPatientValue(value, { isEmail = false } = {}) {
  const cleaned = String(value || "").trim();

  if (!cleaned) return "";

  const normalized = cleaned.toLowerCase();

  if (
    normalized === FALLBACK_PATIENT_VALUE ||
    normalized === FALLBACK_PATIENT_EMAIL
  ) {
    return "";
  }

  if (isEmail && normalized.endsWith("@klineus.local")) {
    return "";
  }

  return cleaned;
}

function formatDate(value, language) {
  if (!value) {
    return "—";
  }

  try {
    return new Intl.DateTimeFormat(language === "en" ? "en-US" : "de-DE", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function formatSeconds(value) {
  if (!Number.isFinite(Number(value))) {
    return "—";
  }

  const seconds = Number(value);

  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  }

  return `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`;
}

function formatMs(value) {
  if (!Number.isFinite(Number(value))) {
    return "—";
  }

  return `${Math.round(Number(value))} ms`;
}

function formatNumber(value, digits = 1) {
  if (!Number.isFinite(Number(value))) {
    return "—";
  }

  return Number(value).toFixed(digits);
}

function getIndicationLabel(indication, language) {
  if (indication === "hip_tep") {
    return language === "en" ? "Hip" : "Hüfte";
  }

  if (indication === "knee_tep") {
    return language === "en" ? "Knee" : "Knie";
  }

  return indication || "—";
}

function patientDisplayName(patientCase) {
  const fullName = cleanPatientValue(patientCase?.patient_name);
  const lastName = cleanPatientValue(patientCase?.patient_last_name);

  if (fullName) {
    return fullName;
  }

  if (lastName) {
    return lastName;
  }

  return "—";
}

function safeJsonParse(value) {
  try {
    return {
      ok: true,
      data: JSON.parse(value),
    };
  } catch (error) {
    return {
      ok: false,
      error: error.message,
    };
  }
}

function prettyJson(value) {
  return JSON.stringify(value || {}, null, 2);
}

function cleanPagePayload(page) {
  return {
    slug: page.slug,
    title: page.title || {},
    description: page.description || {},
    sections: page.sections || [],
    seo: page.seo || {},
    is_published: page.is_published !== false,
  };
}

function cleanQuestionnairePayload(questionnaire) {
  return {
    indication: questionnaire.indication,
    slug: questionnaire.slug,
    labels: questionnaire.labels || {},
    description: questionnaire.description || {},
    image_path: questionnaire.image_path || null,
    image_alt: questionnaire.image_alt || {},
    version: Number(questionnaire.version || 1),
    is_published: questionnaire.is_published !== false,
    blocks: questionnaire.blocks || [],
  };
}

function StatCard({ label, value, hint }) {
  return (
    <article className="admin-stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
      {hint ? <small>{hint}</small> : null}
    </article>
  );
}

function JsonEditor({
  title,
  hint,
  value,
  onChange,
  onSave,
  saveLabel,
  saving,
  error,
  notice,
  actions,
}) {
  return (
    <section className="admin-panel">
      <div className="admin-panel-header">
        <div>
          <h2>{title}</h2>
          {hint ? <p>{hint}</p> : null}
        </div>

        <div className="admin-header-actions">
          {actions}

          <button
            className="primary-button"
            disabled={saving}
            type="button"
            onClick={onSave}
          >
            {saving ? "..." : saveLabel}
          </button>
        </div>
      </div>

      {error ? <p className="form-error">{error}</p> : null}
      {notice ? <p className="form-notice">{notice}</p> : null}

      <textarea
        className="admin-json-editor"
        spellCheck="false"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </section>
  );
}

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const text = copy[language] || copy.de;

  const [activeTab, setActiveTab] = useState("overview");
  const [config, setConfig] = useState(null);
  const [status, setStatus] = useState("loading");
  const [actionStatus, setActionStatus] = useState("idle");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [siteJson, setSiteJson] = useState("");

  const [selectedPageSlug, setSelectedPageSlug] = useState("");
  const [pageJson, setPageJson] = useState("");

  const [selectedQuestionnaire, setSelectedQuestionnaire] = useState("");
  const [questionnaireJson, setQuestionnaireJson] = useState("");

  const [mediaForm, setMediaForm] = useState({
    key: "",
    path: "",
    kind: "image",
    alt_de: "",
    alt_en: "",
  });

  async function loadAdminData() {
    try {
      setStatus("loading");
      setError("");
      setNotice("");

      const data = await api.getAdminConfig();

      setConfig(data);
      setSiteJson(prettyJson(data.siteSettings));
      setStatus("success");
    } catch (err) {
      setError(err.message || text.errorTitle);
      setStatus("error");
    }
  }

  useEffect(() => {
    loadAdminData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const analytics = config?.analytics || {};
  const aiAnalytics = analytics.ai || {};
  const apiAnalytics = analytics.api || {};

  const statusCodeRows = useMemo(() => {
    return Object.entries(apiAnalytics.status_code_counts || {}).sort(
      ([a], [b]) => String(a).localeCompare(String(b)),
    );
  }, [apiAnalytics.status_code_counts]);

  const questionnairePublishLabel = useMemo(() => {
    const parsed = safeJsonParse(questionnaireJson || "{}");

    if (!parsed.ok) {
      return text.unpublish;
    }

    return parsed.data?.is_published === false ? text.publish : text.unpublish;
  }, [questionnaireJson, text.publish, text.unpublish]);

  function logout() {
    window.localStorage.removeItem("klineus_admin_token");
    navigate("/admin/login");
  }

  async function saveSiteSettings() {
    const parsed = safeJsonParse(siteJson);

    if (!parsed.ok) {
      setError(parsed.error);
      return;
    }

    try {
      setActionStatus("saving");
      setError("");
      setNotice("");

      const saved = await api.updateSiteSettings(parsed.data);

      setSiteJson(prettyJson(saved));
      setNotice(text.saved);
      await loadAdminData();
      setActionStatus("idle");
    } catch (err) {
      setError(err.message || text.errorTitle);
      setActionStatus("idle");
    }
  }

  async function loadPage(slug) {
    setSelectedPageSlug(slug);
    setError("");
    setNotice("");

    if (slug === "__new__") {
      setPageJson(
        prettyJson({
          slug: "new-page",
          title: {
            de: "Neue Seite",
            en: "New page",
          },
          description: {
            de: "",
            en: "",
          },
          sections: [],
          seo: {},
          is_published: true,
        }),
      );
      return;
    }

    try {
      const page = await api.getAdminPage(slug);
      setPageJson(prettyJson(page));
    } catch (err) {
      setError(err.message || text.errorTitle);
    }
  }

  async function savePage() {
    const parsed = safeJsonParse(pageJson);

    if (!parsed.ok) {
      setError(parsed.error);
      return;
    }

    try {
      setActionStatus("saving");
      setError("");
      setNotice("");

      const payload = cleanPagePayload(parsed.data);

      const saved =
        selectedPageSlug === "__new__"
          ? await api.createPage(payload)
          : await api.updatePage(selectedPageSlug || payload.slug, payload);

      setSelectedPageSlug(saved.slug);
      setPageJson(prettyJson(saved));
      setNotice(text.saved);
      await loadAdminData();
      setActionStatus("idle");
    } catch (err) {
      setError(err.message || text.errorTitle);
      setActionStatus("idle");
    }
  }

  async function deletePage() {
    if (!selectedPageSlug || selectedPageSlug === "__new__") {
      return;
    }

    const confirmed = window.confirm(text.deleteConfirm);

    if (!confirmed) {
      return;
    }

    try {
      setActionStatus("saving");
      setError("");
      setNotice("");

      await api.deletePage(selectedPageSlug);

      setSelectedPageSlug("");
      setPageJson("");
      setNotice(text.saved);
      await loadAdminData();
      setActionStatus("idle");
    } catch (err) {
      setError(err.message || text.errorTitle);
      setActionStatus("idle");
    }
  }

  async function saveMedia() {
    try {
      setActionStatus("saving");
      setError("");
      setNotice("");

      await api.upsertMedia({
        key: mediaForm.key,
        path: mediaForm.path,
        kind: mediaForm.kind,
        alt: {
          de: mediaForm.alt_de,
          en: mediaForm.alt_en,
        },
        caption: {},
      });

      setMediaForm({
        key: "",
        path: "",
        kind: "image",
        alt_de: "",
        alt_en: "",
      });

      setNotice(text.saved);
      await loadAdminData();
      setActionStatus("idle");
    } catch (err) {
      setError(err.message || text.errorTitle);
      setActionStatus("idle");
    }
  }

  function startEditMedia(asset) {
    setMediaForm({
      key: asset.key || "",
      path: asset.path || "",
      kind: asset.kind || "image",
      alt_de: asset.alt?.de || "",
      alt_en: asset.alt?.en || "",
    });
    setActiveTab("media");
  }

  async function loadQuestionnaire(identifier) {
    setSelectedQuestionnaire(identifier);
    setError("");
    setNotice("");

    if (!identifier) {
      setQuestionnaireJson("");
      return;
    }

    try {
      const questionnaire = await api.getAdminQuestionnaire(identifier);
      setQuestionnaireJson(prettyJson(questionnaire));
    } catch (err) {
      setError(err.message || text.errorTitle);
    }
  }

  async function saveQuestionnaire(options = {}) {
    const parsed = safeJsonParse(questionnaireJson);

    if (!parsed.ok) {
      setError(parsed.error);
      return;
    }

    try {
      setActionStatus("saving");
      setError("");
      setNotice("");

      const payload = cleanQuestionnairePayload(parsed.data);

      if (options.increaseVersion) {
        payload.version = Number(payload.version || 1) + 1;
      }

      const saved = await api.updateQuestionnaire(
        selectedQuestionnaire || payload.indication,
        payload,
      );

      setQuestionnaireJson(prettyJson(saved));
      setNotice(text.saved);
      await loadAdminData();
      setActionStatus("idle");
    } catch (err) {
      setError(err.message || text.errorTitle);
      setActionStatus("idle");
    }
  }

  async function toggleQuestionnairePublish() {
    const parsed = safeJsonParse(questionnaireJson);

    if (!parsed.ok) {
      setError(parsed.error);
      return;
    }

    try {
      setActionStatus("saving");
      setError("");
      setNotice("");

      const nextPublished = parsed.data.is_published === false;

      const saved = await api.publishQuestionnaire(
        selectedQuestionnaire || parsed.data.indication,
        nextPublished,
      );

      setQuestionnaireJson(prettyJson(saved));
      setNotice(text.saved);
      await loadAdminData();
      setActionStatus("idle");
    } catch (err) {
      setError(err.message || text.errorTitle);
      setActionStatus("idle");
    }
  }

  const tabs = [
    ["overview", text.overview],
    ["cms", text.cms],
    ["media", text.media],
    ["questionnaires", text.questionnaires],
    ["logs", text.logs],
  ];

  return (
    <AppShell>
      <section className="admin-dashboard-header">
        <div>
          <p className="eyebrow">{text.eyebrow}</p>
          <h1>{text.title}</h1>
        </div>

        <div className="admin-header-actions">
          <button
            className="secondary-button"
            type="button"
            onClick={loadAdminData}
          >
            {text.refresh}
          </button>

          <button className="secondary-button" type="button" onClick={logout}>
            {text.logout}
          </button>
        </div>
      </section>

      <nav className="admin-tabs">
        {tabs.map(([key, label]) => (
          <button
            key={key}
            className={activeTab === key ? "active" : ""}
            type="button"
            onClick={() => setActiveTab(key)}
          >
            {label}
          </button>
        ))}
      </nav>

      {status === "loading" ? (
        <section className="empty-state">
          <p>{text.loading}</p>
        </section>
      ) : null}

      {status === "error" ? (
        <section className="empty-state">
          <h2>{text.errorTitle}</h2>
          <p>{error}</p>

          <button
            className="primary-button"
            type="button"
            onClick={loadAdminData}
          >
            {text.refresh}
          </button>
        </section>
      ) : null}

      {status === "success" && config ? (
        <>
          {activeTab === "overview" ? (
            <div className="admin-layout">
              <section className="admin-stat-grid">
                <StatCard
                  label={text.totalCases}
                  value={analytics.total_cases || 0}
                />
                <StatCard
                  label={text.completedCases}
                  value={analytics.completed_cases || 0}
                />
                <StatCard
                  label={text.generatedReports}
                  value={analytics.generated_reports || 0}
                />
                <StatCard
                  label={text.editedReports}
                  value={analytics.edited_reports || 0}
                />
                <StatCard
                  label={text.avgFillTime}
                  value={formatSeconds(
                    analytics.average_fill_duration_seconds,
                  )}
                />
                <StatCard
                  label={text.avgPageLoad}
                  value={formatMs(analytics.average_page_load_ms)}
                />
                <StatCard
                  label={text.avgQuestions}
                  value={formatNumber(analytics.average_question_count)}
                />
                <StatCard
                  label={text.contentPages}
                  value={analytics.content_page_count || 0}
                />
                <StatCard
                  label={text.mediaAssets}
                  value={analytics.media_asset_count || 0}
                />
                <StatCard
                  label={text.questionnaireCount}
                  value={analytics.questionnaire_count || 0}
                />
                <StatCard
                  label={text.questionCount}
                  value={analytics.question_count || 0}
                />
                <StatCard
                  label={text.aiRequests}
                  value={aiAnalytics.total_requests || 0}
                />
                <StatCard
                  label={text.aiFailures}
                  value={aiAnalytics.failed_requests || 0}
                />
                <StatCard
                  label={text.aiAvgTime}
                  value={formatMs(aiAnalytics.average_response_time_ms)}
                />
                <StatCard
                  label={text.apiRequests}
                  value={apiAnalytics.total_requests || 0}
                />
                <StatCard
                  label={text.apiErrors}
                  value={apiAnalytics.error_requests || 0}
                />
                <StatCard
                  label={text.apiAvgTime}
                  value={formatMs(apiAnalytics.average_response_time_ms)}
                />
              </section>

              <section className="admin-panel">
                <h2>{text.formTypeStats}</h2>

                {(analytics.form_type_stats || []).length ? (
                  <div className="admin-table-wrap">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>{text.indication}</th>
                          <th>{text.submitted}</th>
                          <th>{text.aiGenerated}</th>
                          <th>{text.aiEdited}</th>
                          <th>{text.avgFillTime}</th>
                          <th>{text.avgPageLoad}</th>
                          <th>{text.avgQuestions}</th>
                        </tr>
                      </thead>

                      <tbody>
                        {(analytics.form_type_stats || []).map((row) => (
                          <tr key={row.indication}>
                            <td>{row.label}</td>
                            <td>{row.submitted_cases}</td>
                            <td>{row.generated_reports}</td>
                            <td>{row.edited_reports}</td>
                            <td>
                              {formatSeconds(
                                row.average_fill_duration_seconds,
                              )}
                            </td>
                            <td>{formatMs(row.average_page_load_ms)}</td>
                            <td>{formatNumber(row.average_question_count)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="muted-text">{text.noData}</p>
                )}
              </section>

              <section className="admin-panel">
                <h2>{text.statusCodes}</h2>

                {statusCodeRows.length ? (
                  <div className="admin-status-grid">
                    {statusCodeRows.map(([code, count]) => (
                      <article key={code}>
                        <span>{code}</span>
                        <strong>{count}</strong>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="muted-text">{text.noData}</p>
                )}
              </section>

              <section className="admin-panel">
                <h2>{text.recentCases}</h2>

                {(analytics.recent_cases || []).length ? (
                  <div className="admin-table-wrap">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>{text.patient}</th>
                          <th>{text.caseId}</th>
                          <th>{text.indication}</th>
                          <th>{text.version}</th>
                          <th>{text.created}</th>
                          <th>{text.status}</th>
                        </tr>
                      </thead>

                      <tbody>
                        {(analytics.recent_cases || []).map((patientCase) => (
                          <tr key={patientCase.case_id}>
                            <td>
                              <strong>{patientDisplayName(patientCase)}</strong>
                            </td>

                            <td className="mono">
                              {patientCase.case_id
                                ? patientCase.case_id.slice(0, 8)
                                : "—"}
                            </td>

                            <td>
                              {getIndicationLabel(
                                patientCase.indication,
                                language,
                              )}
                            </td>

                            <td>
                              {patientCase.questionnaire_version
                                ? `v${patientCase.questionnaire_version}`
                                : "—"}
                            </td>

                            <td>
                              {formatDate(patientCase.created_at, language)}
                            </td>

                            <td>{patientCase.status || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="muted-text">{text.noData}</p>
                )}
              </section>
            </div>
          ) : null}

          {activeTab === "cms" ? (
            <div className="admin-layout">
              <JsonEditor
                title={text.siteSettings}
                hint={text.jsonHint}
                value={siteJson}
                onChange={setSiteJson}
                onSave={saveSiteSettings}
                saveLabel={text.save}
                saving={actionStatus === "saving"}
                error={error}
                notice={notice}
              />

              <section className="admin-panel">
                <div className="admin-panel-header">
                  <div>
                    <h2>{text.pageEditor}</h2>
                    <p>{text.jsonHint}</p>
                  </div>

                  <button
                    className="secondary-button"
                    type="button"
                    onClick={() => loadPage("__new__")}
                  >
                    {text.newPage}
                  </button>
                </div>

                <div className="admin-list-grid">
                  {(config.pages || []).map((page) => (
                    <article key={page.slug} className="admin-list-card">
                      <div>
                        <strong>{page.slug}</strong>
                        <span>
                          {page.is_published
                            ? text.published
                            : text.unpublished}
                        </span>
                      </div>

                      <button
                        className="small-button"
                        type="button"
                        onClick={() => loadPage(page.slug)}
                      >
                        {text.edit}
                      </button>
                    </article>
                  ))}
                </div>
              </section>

              {pageJson ? (
                <JsonEditor
                  title={`${text.pageEditor}: ${selectedPageSlug}`}
                  hint={text.jsonHint}
                  value={pageJson}
                  onChange={setPageJson}
                  onSave={savePage}
                  saveLabel={text.save}
                  saving={actionStatus === "saving"}
                  error={error}
                  notice={notice}
                  actions={
                    selectedPageSlug && selectedPageSlug !== "__new__" ? (
                      <button
                        className="secondary-button danger-button"
                        type="button"
                        disabled={actionStatus === "saving"}
                        onClick={deletePage}
                      >
                        {text.delete}
                      </button>
                    ) : null
                  }
                />
              ) : null}
            </div>
          ) : null}

          {activeTab === "media" ? (
            <div className="admin-layout">
              <section className="admin-panel">
                <h2>{text.mediaEditor}</h2>

                {error ? <p className="form-error">{error}</p> : null}
                {notice ? <p className="form-notice">{notice}</p> : null}

                <div className="admin-form-grid">
                  <label>
                    <span>{text.mediaKey}</span>
                    <input
                      value={mediaForm.key}
                      onChange={(event) =>
                        setMediaForm((current) => ({
                          ...current,
                          key: event.target.value,
                        }))
                      }
                    />
                  </label>

                  <label>
                    <span>{text.mediaPath}</span>
                    <input
                      placeholder="/static/images/example.png"
                      value={mediaForm.path}
                      onChange={(event) =>
                        setMediaForm((current) => ({
                          ...current,
                          path: event.target.value,
                        }))
                      }
                    />
                  </label>

                  <label>
                    <span>{text.mediaKind}</span>
                    <select
                      value={mediaForm.kind}
                      onChange={(event) =>
                        setMediaForm((current) => ({
                          ...current,
                          kind: event.target.value,
                        }))
                      }
                    >
                      <option value="image">image</option>
                      <option value="icon">icon</option>
                      <option value="logo">logo</option>
                      <option value="document">document</option>
                    </select>
                  </label>

                  <label>
                    <span>{text.mediaAltDe}</span>
                    <input
                      value={mediaForm.alt_de}
                      onChange={(event) =>
                        setMediaForm((current) => ({
                          ...current,
                          alt_de: event.target.value,
                        }))
                      }
                    />
                  </label>

                  <label>
                    <span>{text.mediaAltEn}</span>
                    <input
                      value={mediaForm.alt_en}
                      onChange={(event) =>
                        setMediaForm((current) => ({
                          ...current,
                          alt_en: event.target.value,
                        }))
                      }
                    />
                  </label>
                </div>

                <button
                  className="primary-button"
                  disabled={actionStatus === "saving"}
                  type="button"
                  onClick={saveMedia}
                >
                  {text.addOrUpdateMedia}
                </button>
              </section>

              <section className="admin-panel">
                <h2>{text.media}</h2>

                {(config.media || []).length ? (
                  <div className="admin-table-wrap">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>{text.mediaKey}</th>
                          <th>{text.mediaPath}</th>
                          <th>{text.mediaKind}</th>
                          <th>{text.edit}</th>
                        </tr>
                      </thead>

                      <tbody>
                        {(config.media || []).map((asset) => (
                          <tr key={asset.key}>
                            <td>{asset.key}</td>
                            <td className="mono">{asset.path}</td>
                            <td>{asset.kind}</td>
                            <td>
                              <button
                                className="small-button"
                                type="button"
                                onClick={() => startEditMedia(asset)}
                              >
                                {text.edit}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="muted-text">{text.noData}</p>
                )}
              </section>
            </div>
          ) : null}

          {activeTab === "questionnaires" ? (
            <div className="admin-layout">
              <section className="admin-panel">
                <div className="admin-panel-header">
                  <div>
                    <h2>{text.questionnaireEditor}</h2>
                    <p>{text.jsonHint}</p>
                  </div>
                </div>

                <div className="admin-list-grid">
                  {(config.questionnaires || []).map((questionnaire) => (
                    <article
                      key={questionnaire.indication}
                      className="admin-list-card"
                    >
                      <div>
                        <strong>
                          {getIndicationLabel(
                            questionnaire.indication,
                            language,
                          )}
                        </strong>
                        <span>
                          {questionnaire.is_published
                            ? text.published
                            : text.unpublished}
                          {" · "}
                          v{questionnaire.version}
                        </span>
                      </div>

                      <button
                        className="small-button"
                        type="button"
                        onClick={() =>
                          loadQuestionnaire(questionnaire.indication)
                        }
                      >
                        {text.edit}
                      </button>
                    </article>
                  ))}
                </div>
              </section>

              {questionnaireJson ? (
                <JsonEditor
                  title={`${text.questionnaireEditor}: ${selectedQuestionnaire}`}
                  hint={text.jsonHint}
                  value={questionnaireJson}
                  onChange={setQuestionnaireJson}
                  onSave={() => saveQuestionnaire()}
                  saveLabel={text.save}
                  saving={actionStatus === "saving"}
                  error={error}
                  notice={notice}
                  actions={
                    <>
                      <button
                        className="secondary-button"
                        type="button"
                        disabled={actionStatus === "saving"}
                        onClick={() =>
                          saveQuestionnaire({ increaseVersion: true })
                        }
                      >
                        {text.increaseVersion}
                      </button>

                      <button
                        className="secondary-button"
                        type="button"
                        disabled={actionStatus === "saving"}
                        onClick={toggleQuestionnairePublish}
                      >
                        {questionnairePublishLabel}
                      </button>
                    </>
                  }
                />
              ) : null}
            </div>
          ) : null}

          {activeTab === "logs" ? (
            <div className="admin-layout">
              <section className="admin-panel">
                <h2>{text.latestApiErrors}</h2>

                {(apiAnalytics.latest_errors || []).length ? (
                  <div className="admin-log-list">
                    {(apiAnalytics.latest_errors || []).map((log) => (
                      <article className="admin-log-card error" key={log.id}>
                        <div>
                          <strong>
                            {log.method || "—"} {log.path || "—"}
                          </strong>
                          <span>{formatDate(log.created_at, language)}</span>
                        </div>

                        <p>{log.message}</p>

                        <div className="admin-log-meta">
                          <span>
                            {text.response}: {log.status_code || "—"}
                          </span>
                          <span>
                            {text.duration}: {formatMs(log.duration_ms)}
                          </span>
                          <span>
                            {text.level}: {log.level}
                          </span>
                        </div>

                        <details>
                          <summary>{text.details}</summary>
                          <pre>{prettyJson(log.details)}</pre>
                        </details>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="muted-text">{text.noData}</p>
                )}
              </section>

              <section className="admin-panel">
                <h2>{text.apiLogs}</h2>

                {(config.apiLogs || []).length ? (
                  <div className="admin-table-wrap">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>{text.created}</th>
                          <th>{text.level}</th>
                          <th>{text.method}</th>
                          <th>{text.path}</th>
                          <th>{text.response}</th>
                          <th>{text.duration}</th>
                        </tr>
                      </thead>

                      <tbody>
                        {(config.apiLogs || []).map((log) => (
                          <tr key={log.id}>
                            <td>{formatDate(log.created_at, language)}</td>
                            <td>{log.level}</td>
                            <td>{log.method || "—"}</td>
                            <td className="mono">{log.path || "—"}</td>
                            <td>{log.status_code || "—"}</td>
                            <td>{formatMs(log.duration_ms)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="muted-text">{text.noData}</p>
                )}
              </section>

              <section className="admin-panel">
                <h2>{text.aiLogs}</h2>

                {(config.aiLogs || []).length ? (
                  <div className="admin-table-wrap">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>{text.created}</th>
                          <th>{text.status}</th>
                          <th>{text.indication}</th>
                          <th>{text.model}</th>
                          <th>{text.duration}</th>
                          <th>{text.errorMessage}</th>
                        </tr>
                      </thead>

                      <tbody>
                        {(config.aiLogs || []).map((log) => (
                          <tr key={log.id}>
                            <td>{formatDate(log.created_at, language)}</td>
                            <td>
                              {log.status === "success"
                                ? text.success
                                : text.failed}
                            </td>
                            <td>
                              {getIndicationLabel(log.indication, language)}
                            </td>
                            <td>{log.model || "—"}</td>
                            <td>{formatMs(log.duration_ms)}</td>
                            <td>{log.error_message || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="muted-text">{text.noData}</p>
                )}
              </section>
            </div>
          ) : null}
        </>
      ) : null}
    </AppShell>
  );
}