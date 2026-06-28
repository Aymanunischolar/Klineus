import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import AppShell from "../components/AppShell.jsx";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { api } from "../services/api.js";

const FALLBACK_PATIENT_VALUE = "not-provided";
const FALLBACK_PATIENT_EMAIL = "not-provided@klineus.local";

function localText(language, de, en) {
  return language === "en" ? en : de;
}

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

function formatDateTime(value, language) {
  if (!value) return "—";

  try {
    return new Intl.DateTimeFormat(language === "en" ? "en-US" : "de-DE", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return "—";
  }
}

function formatDateInput(value) {
  if (!value) return "";

  try {
    return new Date(value).toISOString().slice(0, 10);
  } catch {
    return "";
  }
}

function indicationLabel(indication) {
  if (indication === "hip_tep") return "Hüfte-TEP";
  if (indication === "knee_tep") return "Knie-TEP";
  return indication || "—";
}

function patientDisplayName(item) {
  const patientName = cleanPatientValue(item?.patient_name);
  const patientLastName = cleanPatientValue(item?.patient_last_name);

  if (patientName && patientLastName && patientName !== patientLastName) {
    return `${patientName} ${patientLastName}`;
  }

  if (patientName) return patientName;
  if (patientLastName) return patientLastName;

  return "—";
}

function patientSearchText(item) {
  return [
    patientDisplayName(item),
    cleanPatientValue(item?.patient_email, { isEmail: true }),
    cleanPatientValue(item?.insurance_id),
    item?.case_id || "",
    item?.session_id || "",
    indicationLabel(item?.indication),
  ]
    .join(" ")
    .toLowerCase();
}

function statusLabel(status, language) {
  if (status === "completed") {
    return localText(language, "Ausgefüllt", "Completed");
  }

  if (status === "in_progress") {
    return localText(language, "In Bearbeitung", "In progress");
  }

  if (status === "invited") {
    return localText(language, "Eingeladen", "Invited");
  }

  if (status === "abandoned") {
    return localText(language, "Abgebrochen", "Abandoned");
  }

  if (status === "review_done") {
    return localText(language, "Geprüft", "Reviewed");
  }

  if (status === "closed") {
    return localText(language, "Geschlossen", "Closed");
  }

  return status || "—";
}

function reportStatusLabel(status, language) {
  if (!status || status === "not_generated") {
    return localText(language, "Nicht erstellt", "Not generated");
  }

  if (status === "generated") {
    return localText(language, "Erstellt", "Generated");
  }

  if (status === "edited") {
    return localText(language, "Bearbeitet", "Edited");
  }

  return status;
}

function statusClass(status) {
  if (status === "completed" || status === "review_done" || status === "closed") {
    return "status-success";
  }

  if (status === "in_progress" || status === "invited") {
    return "status-warning";
  }

  return "status-muted";
}

export default function DoctorDashboardPage() {
  const navigate = useNavigate();
  const { language, t } = useLanguage();

  const [activeTab, setActiveTab] = useState("completed");
  const [pendingSessions, setPendingSessions] = useState([]);
  const [completedCases, setCompletedCases] = useState([]);

  const [filters, setFilters] = useState({
    search: "",
    indication: "",
    status: "",
    report_status: "",
    date: "",
  });

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  async function loadWorklist() {
    setIsLoading(true);
    setError("");

    try {
      const data = await api.getDoctorWorklist();

      setPendingSessions(
        Array.isArray(data?.pending_sessions)
          ? data.pending_sessions.filter(
              (session) => patientDisplayName(session) !== "—",
            )
          : [],
      );

      setCompletedCases(
        Array.isArray(data?.completed_cases)
          ? data.completed_cases.filter(
              (patientCase) => patientDisplayName(patientCase) !== "—",
            )
          : [],
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

  const dashboardStats = useMemo(() => {
    const total = pendingSessions.length + completedCases.length;
    const reportsGenerated = completedCases.filter(
      (item) => item.report_status === "generated" || item.report_status === "edited",
    ).length;
    const reportsEdited = completedCases.filter(
      (item) => item.report_status === "edited",
    ).length;

    return {
      total,
      pending: pendingSessions.length,
      completed: completedCases.length,
      reportsGenerated,
      reportsEdited,
    };
  }, [pendingSessions, completedCases]);

  const filteredPendingSessions = useMemo(() => {
    const search = filters.search.trim().toLowerCase();

    return pendingSessions.filter((item) => {
      if (search && !patientSearchText(item).includes(search)) return false;
      if (filters.indication && item.indication !== filters.indication) return false;
      if (filters.status && item.status !== filters.status) return false;

      if (filters.date) {
        const itemDate = formatDateInput(item.updated_at || item.created_at);

        if (itemDate !== filters.date) return false;
      }

      return true;
    });
  }, [filters, pendingSessions]);

  const filteredCompletedCases = useMemo(() => {
    const search = filters.search.trim().toLowerCase();

    return completedCases.filter((item) => {
      if (search && !patientSearchText(item).includes(search)) return false;
      if (filters.indication && item.indication !== filters.indication) return false;
      if (filters.status && item.status !== filters.status) return false;

      if (filters.report_status) {
        const currentReportStatus = item.report_status || "not_generated";
        if (currentReportStatus !== filters.report_status) return false;
      }

      if (filters.date) {
        const itemDate = formatDateInput(item.created_at || item.updated_at);

        if (itemDate !== filters.date) return false;
      }

      return true;
    });
  }, [completedCases, filters]);

  const visibleRows =
    activeTab === "pending" ? filteredPendingSessions : filteredCompletedCases;

  function updateFilter(field, value) {
    setFilters((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function resetFilters() {
    setFilters({
      search: "",
      indication: "",
      status: "",
      report_status: "",
      date: "",
    });
  }

  function logout() {
    window.localStorage.removeItem("klineus_doctor_token");
    navigate("/doctor/login");
  }

  return (
    <AppShell compact hideNav>
      <main className="doctor-dashboard-pro">
        <section className="doctor-hero">
          <div>
            <p className="doctor-kicker">
              {t("dashboardEyebrow") ||
                localText(language, "Arzt-Dashboard", "Doctor dashboard")}
            </p>

            <h1>
              {t("patientCases") ||
                localText(language, "Patientenfälle", "Patient cases")}
            </h1>

            <p>
              {localText(
                language,
                "Suchen, filtern und öffnen Sie eingereichte Patientenfälle und laufende Fragebögen.",
                "Search, filter, and open submitted patient cases and active questionnaires.",
              )}
            </p>
          </div>

          <div className="doctor-hero-actions">
            <button
              className="doctor-secondary-btn"
              type="button"
              onClick={loadWorklist}
              disabled={isLoading}
            >
              {localText(language, "Aktualisieren", "Refresh")}
            </button>

            <button className="doctor-secondary-btn" type="button" onClick={logout}>
              {t("logout") || localText(language, "Abmelden", "Logout")}
            </button>
          </div>
        </section>

        {error ? <div className="doctor-alert error">{error}</div> : null}

        <section className="doctor-stats-grid">
          <article>
            <span>{localText(language, "Gesamt", "Total")}</span>
            <strong>{dashboardStats.total}</strong>
            <p>{localText(language, "Patientenfälle", "Patient cases")}</p>
          </article>

          <article>
            <span>{localText(language, "Ausstehend", "Pending")}</span>
            <strong>{dashboardStats.pending}</strong>
            <p>{localText(language, "Gestartete Fragebögen", "Started questionnaires")}</p>
          </article>

          <article>
            <span>{localText(language, "Ausgefüllt", "Completed")}</span>
            <strong>{dashboardStats.completed}</strong>
            <p>{localText(language, "Übermittelte Fälle", "Submitted cases")}</p>
          </article>

          <article>
            <span>{localText(language, "Berichte", "Reports")}</span>
            <strong>{dashboardStats.reportsGenerated}</strong>
            <p>{localText(language, "Erstellt oder bearbeitet", "Generated or edited")}</p>
          </article>

          <article>
            <span>{localText(language, "Bearbeitet", "Edited")}</span>
            <strong>{dashboardStats.reportsEdited}</strong>
            <p>{localText(language, "Manuell geprüft", "Manually reviewed")}</p>
          </article>
        </section>

        <section className="doctor-toolbar">
          <div className="doctor-tabs">
            <button
              type="button"
              className={activeTab === "completed" ? "active" : ""}
              onClick={() => setActiveTab("completed")}
            >
              {localText(language, "Ausgefüllte Fälle", "Completed cases")}
            </button>

            <button
              type="button"
              className={activeTab === "pending" ? "active" : ""}
              onClick={() => setActiveTab("pending")}
            >
              {localText(language, "Laufende Fragebögen", "Active questionnaires")}
            </button>
          </div>

          <div className="doctor-search">
            <input
              type="search"
              value={filters.search}
              onChange={(event) => updateFilter("search", event.target.value)}
              placeholder={localText(
                language,
                "Patient suchen: Name, E-Mail, VSNR oder Fall-ID",
                "Search patient: name, email, insurance ID or case ID",
              )}
            />
          </div>
        </section>

        <section className="doctor-card">
          <div className="doctor-card-header">
            <div>
              <span>{localText(language, "Suche & Filter", "Search & filter")}</span>
              <h2>{localText(language, "Fälle finden", "Find cases")}</h2>
            </div>

            <div className="doctor-card-actions">
              <button
                type="button"
                className="doctor-secondary-btn"
                onClick={resetFilters}
              >
                {localText(language, "Zurücksetzen", "Reset")}
              </button>

              <button
                type="button"
                className="doctor-primary-btn"
                onClick={loadWorklist}
                disabled={isLoading}
              >
                {localText(language, "Aktualisieren", "Refresh")}
              </button>
            </div>
          </div>

          <div className="doctor-filter-grid">
            <label>
              {localText(language, "Name, E-Mail, VSNR oder Fall-ID", "Name, email, insurance ID or case ID")}
              <input
                type="search"
                value={filters.search}
                onChange={(event) => updateFilter("search", event.target.value)}
                placeholder={localText(language, "Suchen...", "Search...")}
              />
            </label>

            <label>
              {localText(language, "Indikation", "Indication")}
              <select
                value={filters.indication}
                onChange={(event) => updateFilter("indication", event.target.value)}
              >
                <option value="">{localText(language, "Alle", "All")}</option>
                <option value="knee_tep">Knie-TEP</option>
                <option value="hip_tep">Hüfte-TEP</option>
              </select>
            </label>

            <label>
              {localText(language, "Status", "Status")}
              <select
                value={filters.status}
                onChange={(event) => updateFilter("status", event.target.value)}
              >
                <option value="">{localText(language, "Alle", "All")}</option>
                <option value="completed">{localText(language, "Ausgefüllt", "Completed")}</option>
                <option value="in_progress">{localText(language, "In Bearbeitung", "In progress")}</option>
                <option value="review_done">{localText(language, "Geprüft", "Reviewed")}</option>
                <option value="closed">{localText(language, "Geschlossen", "Closed")}</option>
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
                <option value="not_generated">{localText(language, "Nicht erstellt", "Not generated")}</option>
                <option value="generated">{localText(language, "Erstellt", "Generated")}</option>
                <option value="edited">{localText(language, "Bearbeitet", "Edited")}</option>
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
          </div>
        </section>

        <section className="doctor-card">
          <div className="doctor-card-header">
            <div>
              <span>{localText(language, "Übersicht", "Overview")}</span>
              <h2>
                {activeTab === "pending"
                  ? localText(language, "Laufende Fragebögen", "Active questionnaires")
                  : localText(language, "Ausgefüllte Patientenfälle", "Completed patient cases")}
              </h2>
            </div>

            <p className="doctor-result-count">
              {visibleRows.length} {localText(language, "Ergebnisse", "results")}
            </p>
          </div>

          {isLoading ? (
            <p className="doctor-muted">
              {t("loadingCases") ||
                localText(language, "Fälle werden geladen…", "Loading cases…")}
            </p>
          ) : null}

          {!isLoading && visibleRows.length === 0 ? (
            <p className="doctor-muted">
              {localText(
                language,
                "Keine passenden Fälle gefunden.",
                "No matching cases found.",
              )}
            </p>
          ) : null}

          {!isLoading && activeTab === "pending" && visibleRows.length > 0 ? (
            <div className="doctor-table-wrap">
              <table className="doctor-table">
                <thead>
                  <tr>
                    <th>{localText(language, "Patient", "Patient")}</th>
                    <th>{localText(language, "Indikation", "Indication")}</th>
                    <th>{localText(language, "Status", "Status")}</th>
                    <th>{localText(language, "Antworten", "Answers")}</th>
                    <th>{localText(language, "Zuletzt aktualisiert", "Updated")}</th>
                  </tr>
                </thead>

                <tbody>
                  {visibleRows.map((session) => (
                    <tr key={session.session_id || `${session.patient_name}-${session.updated_at}`}>
                      <td>
                        <div className="doctor-patient-cell">
                          <strong>{patientDisplayName(session)}</strong>
                          <span>
                            {cleanPatientValue(session.patient_email, { isEmail: true }) || "—"}
                          </span>
                          <small>VSNR: {cleanPatientValue(session.insurance_id) || "—"}</small>
                        </div>
                      </td>

                      <td>{indicationLabel(session.indication)}</td>

                      <td>
                        <span className={`doctor-status ${statusClass(session.status)}`}>
                          {statusLabel(session.status, language)}
                        </span>
                      </td>

                      <td>{session.answer_count || 0}</td>

                      <td>{formatDateTime(session.updated_at, language)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          {!isLoading && activeTab === "completed" && visibleRows.length > 0 ? (
            <div className="doctor-table-wrap">
              <table className="doctor-table">
                <thead>
                  <tr>
                    <th>{localText(language, "Patient", "Patient")}</th>
                    <th>{localText(language, "Fall-ID", "Case ID")}</th>
                    <th>{localText(language, "Erstellt", "Created")}</th>
                    <th>{localText(language, "Indikation", "Indication")}</th>
                    <th>{localText(language, "Status", "Status")}</th>
                    <th>{localText(language, "Bericht", "Report")}</th>
                    <th>{localText(language, "Aktion", "Action")}</th>
                  </tr>
                </thead>

                <tbody>
                  {visibleRows.map((patientCase) => (
                    <tr key={patientCase.case_id}>
                      <td>
                        <div className="doctor-patient-cell">
                          <strong>{patientDisplayName(patientCase)}</strong>
                          <span>
                            {cleanPatientValue(patientCase.patient_email, { isEmail: true }) || "—"}
                          </span>
                          <small>VSNR: {cleanPatientValue(patientCase.insurance_id) || "—"}</small>
                        </div>
                      </td>

                      <td className="mono">
                        {patientCase.case_id ? patientCase.case_id.slice(0, 8) : "—"}
                      </td>

                      <td>{formatDateTime(patientCase.created_at, language)}</td>

                      <td>{indicationLabel(patientCase.indication)}</td>

                      <td>
                        <span className={`doctor-status ${statusClass(patientCase.status)}`}>
                          {statusLabel(patientCase.status, language)}
                        </span>
                      </td>

                      <td>{reportStatusLabel(patientCase.report_status, language)}</td>

                      <td>
                        {patientCase.case_id ? (
                          <Link
                            className="doctor-secondary-btn small"
                            to={`/doctor/cases/${patientCase.case_id}`}
                          >
                            {t("openCase") || localText(language, "Fall öffnen", "Open case")}
                          </Link>
                        ) : (
                          <span className="doctor-muted">
                            {localText(language, "Keine Fall-ID", "No case ID")}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>
      </main>
    </AppShell>
  );
}