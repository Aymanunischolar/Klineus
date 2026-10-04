import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import AppShell from "../components/AppShell.jsx";
import TrafficLight from "../components/TrafficLight.jsx";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { api } from "../services/api.js";
import {
  cleanPatientValue,
  countByLevel,
  filterCases,
  groupByDay,
  indicationLabel,
  patientDisplayName,
  sortCases,
  topFlags,
} from "../utils/dashboardRows.js";
import { TRAFFIC_LEVELS, trafficLevel } from "../utils/traffic.js";
import "./doctor-dashboard.css";

const WIDE_QUERY = "(min-width: 1100px)";

const LEVEL_TEXT = {
  red: ["Sofort prüfen", "Review first"],
  orange: ["Im Gespräch klären", "Clarify in consultation"],
  green: ["Unauffällig", "No major issue"],
};

const EMPTY_FILTERS = {
  search: "",
  indication: "",
  status: "",
  report_status: "",
  date: "",
};

function localText(language, de, en) {
  return language === "en" ? en : de;
}

function formatDateTime(value, language) {
  if (!value) return "—";

  try {
    return new Intl.DateTimeFormat(language === "en" ? "en-US" : "de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return "—";
  }
}

function relativeTime(value, language) {
  if (!value) return "—";

  const minutes = Math.round((new Date(value).getTime() - Date.now()) / 60000);
  const formatter = new Intl.RelativeTimeFormat(language === "en" ? "en" : "de", {
    numeric: "auto",
  });

  if (Math.abs(minutes) < 60) return formatter.format(minutes, "minute");
  if (Math.abs(minutes) < 60 * 24) return formatter.format(Math.round(minutes / 60), "hour");
  return formatter.format(Math.round(minutes / 1440), "day");
}

function dayLabel(bucket, language) {
  if (bucket === 0) return localText(language, "Heute", "Today");
  if (bucket === 1) return localText(language, "Gestern", "Yesterday");
  return localText(language, "Älter", "Earlier");
}

function reportStatusLabel(status, language) {
  if (!status || status === "not_generated") {
    return localText(language, "Nicht erstellt", "Not generated");
  }

  if (status === "generated") return localText(language, "Erstellt", "Generated");
  if (status === "edited") return localText(language, "Bearbeitet", "Edited");

  return status;
}

function statusLabel(status, language) {
  const labels = {
    completed: ["Ausgefüllt", "Completed"],
    in_progress: ["In Bearbeitung", "In progress"],
    invited: ["Eingeladen", "Invited"],
    abandoned: ["Abgebrochen", "Abandoned"],
    review_done: ["Geprüft", "Reviewed"],
    closed: ["Geschlossen", "Closed"],
  };

  return labels[status] ? localText(language, ...labels[status]) : status || "—";
}

function useMediaQuery(query) {
  const [matches, setMatches] = useState(
    () => typeof window !== "undefined" && window.matchMedia(query).matches,
  );

  useEffect(() => {
    const media = window.matchMedia(query);
    const onChange = (event) => setMatches(event.matches);

    setMatches(media.matches);
    media.addEventListener("change", onChange);

    return () => media.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}

export default function DoctorDashboardPage() {
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const isWide = useMediaQuery(WIDE_QUERY);

  const [activeTab, setActiveTab] = useState("completed");
  const [pendingSessions, setPendingSessions] = useState([]);
  const [completedCases, setCompletedCases] = useState([]);
  const [trafficByCase, setTrafficByCase] = useState({});
  const [details, setDetails] = useState({});
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [severity, setSeverity] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  async function loadWorklist() {
    setIsLoading(true);
    setError("");

    try {
      const data = await api.getDoctorWorklist();
      const named = (item) => patientDisplayName(item) !== "—";

      setPendingSessions(
        Array.isArray(data?.pending_sessions) ? data.pending_sessions.filter(named) : [],
      );
      setCompletedCases(
        Array.isArray(data?.completed_cases) ? data.completed_cases.filter(named) : [],
      );
    } catch (loadError) {
      setError(
        loadError?.message ||
          localText(
            language,
            "Die Fälle konnten nicht geladen werden.",
            "The cases could not be loaded.",
          ),
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadWorklist();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  // Older backends do not put the assessment on the list; read it from the case
  // detail (three at a time) and cache it. Cases that carry it are skipped.
  useEffect(() => {
    let cancelled = false;
    const queue = completedCases
      .filter((item) => item.case_id && !trafficLevel(item.traffic_light))
      .map((item) => item.case_id);

    async function worker() {
      while (queue.length && !cancelled) {
        const caseId = queue.shift();
        let level = "";

        try {
          const detail = await api.getCase(caseId);
          level = trafficLevel(detail?.traffic_light);
        } catch {
          level = "";
        }

        if (!cancelled) {
          setTrafficByCase((current) => ({ ...current, [caseId]: level }));
        }
      }
    }

    Promise.all([worker(), worker(), worker()]);

    return () => {
      cancelled = true;
    };
  }, [completedCases]);

  const levelOf = (item) => trafficLevel(item.traffic_light) || trafficByCase[item.case_id] || "";

  const baseCases = useMemo(
    () => filterCases(completedCases, filters),
    [completedCases, filters],
  );

  const counts = useMemo(
    () => countByLevel(baseCases, levelOf),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [baseCases, trafficByCase],
  );

  const groups = useMemo(() => {
    const visible = severity
      ? baseCases.filter((item) => levelOf(item) === severity)
      : baseCases;

    return groupByDay(sortCases(visible, levelOf));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseCases, severity, trafficByCase]);

  const visibleCases = useMemo(() => groups.flatMap((group) => group.items), [groups]);

  const pendingRows = useMemo(
    () =>
      filterCases(pendingSessions, filters, { dateField: "updated_at" }).sort(
        (a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0),
      ),
    [pendingSessions, filters],
  );

  const selected =
    visibleCases.find((item) => item.case_id === selectedId) || visibleCases[0] || null;
  const selectedDetail = selected ? details[selected.case_id] : null;

  // Preview details are only needed on screens wide enough to show the pane.
  useEffect(() => {
    if (!isWide || !selected || details[selected.case_id]) return undefined;

    let cancelled = false;

    api
      .getCase(selected.case_id)
      .then((detail) => {
        if (!cancelled) {
          setDetails((current) => ({ ...current, [selected.case_id]: detail }));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setDetails((current) => ({ ...current, [selected.case_id]: { failed: true } }));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isWide, selected, details]);

  // Up/Down moves through the list on wide screens (not while typing).
  useEffect(() => {
    if (!isWide || activeTab !== "completed") return undefined;

    function onKey(event) {
      const tag = event.target?.tagName;
      if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;
      if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
      if (visibleCases.length === 0) return;

      event.preventDefault();

      const index = Math.max(visibleCases.findIndex((item) => item.case_id === selected?.case_id), 0);
      const next = Math.min(
        Math.max(index + (event.key === "ArrowDown" ? 1 : -1), 0),
        visibleCases.length - 1,
      );

      setSelectedId(visibleCases[next].case_id);
      document.getElementById(`dd-row-${visibleCases[next].case_id}`)?.scrollIntoView({
        block: "nearest",
      });
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isWide, activeTab, visibleCases, selected]);

  function updateFilter(field, value) {
    setFilters((current) => ({ ...current, [field]: value }));
  }

  function resetFilters() {
    setFilters(EMPTY_FILTERS);
    setSeverity("");
  }

  function selectCase(item) {
    if (isWide) {
      setSelectedId(item.case_id);
    } else {
      navigate(`/doctor/cases/${item.case_id}`);
    }
  }

  function logout() {
    window.localStorage.removeItem("klineus_doctor_token");
    navigate("/doctor/login");
  }

  // Show a dash instead of 0 until the list has loaded.
  const count = (value) => (isLoading ? "–" : value);

  const openLabel = t("openCase") || localText(language, "Fall öffnen", "Open case");
  const flags = topFlags(selectedDetail?.documentation_flags);
  const hasActiveFilters = Boolean(
    severity || Object.entries(filters).some(([field, value]) => field !== "search" && value),
  );

  return (
    <AppShell compact hideNav wide>
      <main className="dd">
        <header className="dd-header">
          <div>
            <p className="dd-kicker">
              {t("dashboardEyebrow") ||
                localText(language, "Arzt-Dashboard", "Doctor dashboard")}
            </p>
            <h1>{t("patientCases") || localText(language, "Patientenfälle", "Patient cases")}</h1>
          </div>

          <div className="dd-header-actions">
            <button type="button" onClick={loadWorklist} disabled={isLoading}>
              {localText(language, "Aktualisieren", "Refresh")}
            </button>
            <button type="button" onClick={logout}>
              {t("logout") || localText(language, "Abmelden", "Sign out")}
            </button>
          </div>
        </header>

        {error ? (
          <div className="dd-alert" role="alert">
            {error}
          </div>
        ) : null}

        <div className="dd-toolbar">
          <div className="dd-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "completed"}
              className={activeTab === "completed" ? "active" : ""}
              onClick={() => setActiveTab("completed")}
            >
              {localText(language, "Ausgefüllte Fälle", "Completed cases")}{" "}
              <b>{count(completedCases.length)}</b>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "pending"}
              className={activeTab === "pending" ? "active" : ""}
              onClick={() => setActiveTab("pending")}
            >
              {localText(language, "Laufende Fragebögen", "Active questionnaires")}{" "}
              <b>{count(pendingSessions.length)}</b>
            </button>
          </div>

          <input
            className="dd-search"
            type="search"
            value={filters.search}
            onChange={(event) => updateFilter("search", event.target.value)}
            aria-label={localText(language, "Patient suchen", "Search patient")}
            placeholder={localText(
              language,
              "Patient suchen: Name, E-Mail, VSNR oder Fall-ID",
              "Search patient: name, email, insurance ID or case ID",
            )}
          />

          <button
            type="button"
            className="dd-filter-toggle"
            aria-expanded={showFilters}
            onClick={() => setShowFilters((current) => !current)}
          >
            {localText(language, "Filter", "Filters")}
            {hasActiveFilters ? " •" : ""} {showFilters ? "▴" : "▾"}
          </button>
        </div>

        {showFilters ? (
          <div className="dd-filters">
            <label>
              {localText(language, "Indikation", "Indication")}
              <select
                value={filters.indication}
                onChange={(event) => updateFilter("indication", event.target.value)}
              >
                <option value="">{localText(language, "Alle", "All")}</option>
                <option value="knee_tep">Knie-TEP</option>
                <option value="hip_tep">Hüft-TEP</option>
              </select>
            </label>

            <label>
              {localText(language, "Status", "Status")}
              <select
                value={filters.status}
                onChange={(event) => updateFilter("status", event.target.value)}
              >
                <option value="">{localText(language, "Alle", "All")}</option>
                <option value="completed">{statusLabel("completed", language)}</option>
                <option value="in_progress">{statusLabel("in_progress", language)}</option>
                <option value="review_done">{statusLabel("review_done", language)}</option>
                <option value="closed">{statusLabel("closed", language)}</option>
              </select>
            </label>

            <label>
              {localText(language, "Bericht", "Report")}
              <select
                value={filters.report_status}
                onChange={(event) => updateFilter("report_status", event.target.value)}
                disabled={activeTab === "pending"}
              >
                <option value="">{localText(language, "Alle", "All")}</option>
                <option value="not_generated">{reportStatusLabel("not_generated", language)}</option>
                <option value="generated">{reportStatusLabel("generated", language)}</option>
                <option value="edited">{reportStatusLabel("edited", language)}</option>
              </select>
            </label>

            <label>
              {localText(language, "Datum", "Date")}
              <input
                type="date"
                value={filters.date}
                onChange={(event) => updateFilter("date", event.target.value)}
              />
            </label>

            <button type="button" onClick={resetFilters}>
              {localText(language, "Zurücksetzen", "Reset")}
            </button>
          </div>
        ) : null}

        {activeTab === "completed" ? (
          <>
            <div
              className="dd-chips"
              role="group"
              aria-label={localText(language, "Dringlichkeit", "Urgency")}
            >
              <button
                type="button"
                aria-pressed={severity === ""}
                className={severity === "" ? "on" : ""}
                onClick={() => setSeverity("")}
              >
                {localText(language, "Alle", "All")} <b>{count(baseCases.length)}</b>
              </button>

              {TRAFFIC_LEVELS.map((level) => (
                <button
                  key={level}
                  type="button"
                  aria-pressed={severity === level}
                  className={`dd-chip-${level}${severity === level ? " on" : ""}`}
                  onClick={() => setSeverity(severity === level ? "" : level)}
                >
                  <span className="dd-dot" aria-hidden="true" />
                  {localText(language, ...LEVEL_TEXT[level])} <b>{count(counts[level])}</b>
                </button>
              ))}
            </div>

            <div className="dd-split">
              <div className="dd-list">
                {isLoading ? (
                  <ul className="dd-rows" aria-busy="true">
                    {[0, 1, 2, 3].map((index) => (
                      <li key={index} className="dd-row dd-row-skeleton">
                        <span className="skeleton-bar" />
                      </li>
                    ))}
                  </ul>
                ) : groups.length === 0 ? (
                  <p className="dd-empty">
                    {localText(language, "Keine passenden Fälle gefunden.", "No matching cases found.")}
                  </p>
                ) : (
                  groups.map((group) => (
                    <section key={group.bucket} className="dd-group">
                      <h2>{dayLabel(group.bucket, language)}</h2>

                      <ul className="dd-rows">
                        {group.items.map((item) => {
                          const level = levelOf(item);
                          const isSelected = isWide && item.case_id === selected?.case_id;

                          return (
                            <li
                              key={item.case_id}
                              id={`dd-row-${item.case_id}`}
                              className={`dd-row dd-edge-${level || "none"}${isSelected ? " selected" : ""}`}
                            >
                              <button
                                type="button"
                                className="dd-row-main"
                                aria-current={isSelected ? "true" : undefined}
                                onClick={() => selectCase(item)}
                              >
                                {level ? (
                                  <TrafficLight level={level} />
                                ) : trafficByCase[item.case_id] === undefined ? (
                                  <span className="skeleton-bar" aria-hidden="true" />
                                ) : (
                                  <span className="dd-muted">—</span>
                                )}

                                <strong>{patientDisplayName(item)}</strong>
                                <span>{indicationLabel(item.indication)}</span>
                                <span className="dd-muted dd-hide-narrow">
                                  {cleanPatientValue(item.insurance_id) || "—"}
                                </span>
                                <span
                                  className="dd-muted"
                                  title={formatDateTime(item.created_at, language)}
                                >
                                  {relativeTime(item.created_at, language)}
                                </span>
                              </button>

                              <Link className="dd-row-open" to={`/doctor/cases/${item.case_id}`}>
                                {localText(language, "Öffnen", "Open")} →
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    </section>
                  ))
                )}
              </div>

              {isWide ? (
                <aside className="dd-preview" aria-label={localText(language, "Vorschau", "Preview")}>
                  {!selected ? (
                    <p className="dd-empty">
                      {localText(language, "Kein Fall ausgewählt.", "No case selected.")}
                    </p>
                  ) : (
                    <>
                      <div className={`dd-preview-head dd-edge-${levelOf(selected) || "none"}`}>
                        <div>
                          <TrafficLight level={levelOf(selected)} />
                          <h2>{patientDisplayName(selected)}</h2>
                          <p>
                            {indicationLabel(selected.indication)} ·{" "}
                            {localText(language, "eingereicht", "submitted")}{" "}
                            {relativeTime(selected.created_at, language)}
                          </p>
                        </div>

                        <Link className="dd-primary" to={`/doctor/cases/${selected.case_id}`}>
                          {openLabel} →
                        </Link>
                      </div>

                      <p className="dd-assessment">
                        {selectedDetail?.traffic_light?.description ||
                          (selectedDetail?.failed
                            ? localText(
                                language,
                                "Die Einschätzung konnte nicht geladen werden.",
                                "The assessment could not be loaded.",
                              )
                            : localText(language, "Einschätzung wird geladen…", "Loading assessment…"))}
                      </p>

                      <h3>
                        {localText(language, "Das sollten Sie ansprechen", "Raise in the consultation")}
                      </h3>

                      {!selectedDetail || selectedDetail.failed ? null : flags.length === 0 ? (
                        <p className="dd-empty">
                          {localText(language, "Keine Auffälligkeiten.", "Nothing flagged.")}
                        </p>
                      ) : (
                        <ul className="dd-flags">
                          {flags.map((flag, index) => (
                            <li key={index} className={`dd-edge-${trafficLevel(flag.level)}`}>
                              <strong>{flag.title}</strong>
                              <span>{flag.description}</span>
                            </li>
                          ))}
                        </ul>
                      )}

                      <dl className="dd-facts">
                        <div>
                          <dt>VSNR</dt>
                          <dd>{cleanPatientValue(selected.insurance_id) || "—"}</dd>
                        </div>
                        <div>
                          <dt>{localText(language, "E-Mail", "Email")}</dt>
                          <dd>
                            {cleanPatientValue(selected.patient_email, { isEmail: true }) || "—"}
                          </dd>
                        </div>
                        <div>
                          <dt>{localText(language, "Eingereicht", "Submitted")}</dt>
                          <dd>{formatDateTime(selected.created_at, language)}</dd>
                        </div>
                        <div>
                          <dt>{localText(language, "Bericht", "Report")}</dt>
                          <dd>{reportStatusLabel(selected.report_status, language)}</dd>
                        </div>
                        <div>
                          <dt>{localText(language, "Status", "Status")}</dt>
                          <dd>{statusLabel(selected.status, language)}</dd>
                        </div>
                      </dl>
                    </>
                  )}
                </aside>
              ) : null}
            </div>
          </>
        ) : (
          <div className="dd-list">
            {isLoading ? (
              <ul className="dd-rows" aria-busy="true">
                {[0, 1, 2].map((index) => (
                  <li key={index} className="dd-row dd-row-skeleton">
                    <span className="skeleton-bar" />
                  </li>
                ))}
              </ul>
            ) : pendingRows.length === 0 ? (
              <p className="dd-empty">
                {localText(language, "Keine laufenden Fragebögen.", "No active questionnaires.")}
              </p>
            ) : (
              <ul className="dd-rows">
                {pendingRows.map((session) => (
                  <li key={session.session_id} className="dd-row dd-edge-none">
                    <div className="dd-row-main dd-row-static">
                      <span className="dd-status">{statusLabel(session.status, language)}</span>
                      <strong>{patientDisplayName(session)}</strong>
                      <span>{indicationLabel(session.indication)}</span>
                      <span className="dd-muted dd-hide-narrow">
                        {session.answer_count || 0} {localText(language, "beantwortet", "answered")}
                      </span>
                      <span className="dd-muted" title={formatDateTime(session.updated_at, language)}>
                        {relativeTime(session.updated_at, language)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {isLoading ? null : (
          <p className="dd-summary">
            {completedCases.length} {localText(language, "ausgefüllt", "completed")} ·{" "}
            {pendingSessions.length} {localText(language, "laufend", "in progress")} ·{" "}
            {
              completedCases.filter(
                (item) => item.report_status === "generated" || item.report_status === "edited",
              ).length
            }{" "}
            {localText(language, "Berichte erstellt", "reports generated")}
          </p>
        )}
      </main>
    </AppShell>
  );
}
