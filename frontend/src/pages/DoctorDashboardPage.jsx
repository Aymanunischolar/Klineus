import { useEffect, useState } from "react";
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
    return "—";
  }
}

function indicationLabel(indication) {
  if (indication === "hip_tep") {
    return "Hüft-TEP";
  }

  if (indication === "knee_tep") {
    return "Knie-TEP";
  }

  return indication || "—";
}

function patientDisplayName(item) {
  const patientName = cleanPatientValue(item?.patient_name);
  const patientLastName = cleanPatientValue(item?.patient_last_name);

  if (patientName) {
    return patientName;
  }

  if (patientLastName) {
    return patientLastName;
  }

  return "—";
}

function statusLabel(status, language) {
  if (status === "completed") {
    return localText(language, "Ausgefüllt", "Completed");
  }

  if (status === "in_progress") {
    return localText(language, "Ausstehend", "Pending");
  }

  if (status === "abandoned") {
    return localText(language, "Abgebrochen", "Abandoned");
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

function statusPillClass(status) {
  if (status === "completed") {
    return "status-pill status-completed";
  }

  if (status === "abandoned") {
    return "status-pill status-warning";
  }

  return "status-pill status-pending";
}

export default function DoctorDashboardPage() {
  const navigate = useNavigate();
  const { language, t } = useLanguage();

  const [pendingSessions, setPendingSessions] = useState([]);
  const [completedCases, setCompletedCases] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    setIsLoading(true);
    setError("");

    api
      .getDoctorWorklist()
      .then((data) => {
        if (!mounted) return;

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
      })
      .catch((loadError) => {
        if (!mounted) return;

        setError(
          loadError?.message ||
            localText(
              language,
              "Die Fälle konnten nicht geladen werden.",
              "The cases could not be loaded.",
            ),
        );
      })
      .finally(() => {
        if (mounted) {
          setIsLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [language]);

  function logout() {
    window.localStorage.removeItem("klineus_doctor_token");
    navigate("/doctor/login");
  }

  const hasAnyItems = pendingSessions.length > 0 || completedCases.length > 0;

  return (
    <AppShell>
      <section className="dashboard-header">
        <div>
          <p className="eyebrow">
            {t("dashboardEyebrow") ||
              localText(language, "Arzt-Dashboard", "Doctor dashboard")}
          </p>

          <h1>
            {t("patientCases") ||
              localText(language, "Patientenfälle", "Patient cases")}
          </h1>

          <p className="dashboard-subtitle">
            {localText(
              language,
              "Aktuelle Patienten werden mit Status angezeigt: ausstehend oder ausgefüllt.",
              "Current patients are shown with status: pending or completed.",
            )}
          </p>
        </div>

        <div className="case-header-actions">
          <button className="secondary-button" type="button" onClick={logout}>
            {t("logout") || localText(language, "Abmelden", "Logout")}
          </button>
        </div>
      </section>

      {error ? <p className="form-error">{error}</p> : null}

      {isLoading ? (
        <p className="muted">
          {t("loadingCases") ||
            localText(language, "Fälle werden geladen…", "Loading cases…")}
        </p>
      ) : null}

      {!isLoading && !hasAnyItems ? (
        <section className="empty-state">
          <h2>
            {t("emptyCasesTitle") ||
              localText(language, "Noch keine Fälle vorhanden", "No cases yet")}
          </h2>

          <p>
            {t("emptyCasesText") ||
              localText(
                language,
                "Sobald Patientinnen oder Patienten einen Fragebogen starten oder absenden, erscheinen sie hier.",
                "Once patients start or submit a questionnaire, they will appear here.",
              )}
          </p>
        </section>
      ) : null}

      {!isLoading && pendingSessions.length > 0 ? (
        <section className="dashboard-section">
          <div className="section-heading-row">
            <div>
              <p className="eyebrow">
                {localText(language, "Ausstehend", "Pending")}
              </p>

              <h2>
                {localText(
                  language,
                  "Gestartete Fragebögen",
                  "Started questionnaires",
                )}
              </h2>
            </div>
          </div>

          <div className="case-table-wrap">
            <table className="case-table">
              <thead>
                <tr>
                  <th>{localText(language, "Patient", "Patient")}</th>
                  <th>
                    {t("indication") ||
                      localText(language, "Indikation", "Indication")}
                  </th>
                  <th>
                    {t("status") || localText(language, "Status", "Status")}
                  </th>
                  <th>{localText(language, "Antworten", "Answers")}</th>
                  <th>
                    {localText(
                      language,
                      "Zuletzt aktualisiert",
                      "Updated",
                    )}
                  </th>
                </tr>
              </thead>

              <tbody>
                {pendingSessions.map((session) => (
                  <tr key={session.session_id || `${session.patient_name}-${session.updated_at}`}>
                    <td>
                      <strong>{patientDisplayName(session)}</strong>
                    </td>

                    <td>
                      <span className="indication-pill">
                        {indicationLabel(session.indication)}
                      </span>
                    </td>

                    <td>
                      <span className={statusPillClass(session.status)}>
                        {statusLabel(session.status, language)}
                      </span>
                    </td>

                    <td>{session.answer_count || 0}</td>

                    <td>{formatDate(session.updated_at, language)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {!isLoading && completedCases.length > 0 ? (
        <section className="dashboard-section">
          <div className="section-heading-row">
            <div>
              <p className="eyebrow">
                {localText(language, "Ausgefüllt", "Completed")}
              </p>

              <h2>
                {localText(
                  language,
                  "Übermittelte Fragebögen",
                  "Submitted questionnaires",
                )}
              </h2>
            </div>
          </div>

          <div className="case-table-wrap">
            <table className="case-table">
              <thead>
                <tr>
                  <th>{localText(language, "Patient", "Patient")}</th>
                  <th>
                    {t("caseId") || localText(language, "Fall-ID", "Case ID")}
                  </th>
                  <th>
                    {t("created") || localText(language, "Erstellt", "Created")}
                  </th>
                  <th>
                    {t("indication") ||
                      localText(language, "Indikation", "Indication")}
                  </th>
                  <th>
                    {t("status") || localText(language, "Status", "Status")}
                  </th>
                  <th>
                    {t("report") || localText(language, "Bericht", "Report")}
                  </th>
                  <th>{localText(language, "Aktion", "Action")}</th>
                </tr>
              </thead>

              <tbody>
                {completedCases.map((patientCase) => (
                  <tr key={patientCase.case_id}>
                    <td>
                      <strong>{patientDisplayName(patientCase)}</strong>
                    </td>

                    <td className="mono">
                      {patientCase.case_id
                        ? patientCase.case_id.slice(0, 8)
                        : "—"}
                    </td>

                    <td>{formatDate(patientCase.created_at, language)}</td>

                    <td>
                      <span className="indication-pill">
                        {indicationLabel(patientCase.indication)}
                      </span>
                    </td>

                    <td>
                      <span className={statusPillClass(patientCase.status)}>
                        {statusLabel(patientCase.status, language)}
                      </span>
                    </td>

                    <td>
                      {reportStatusLabel(patientCase.report_status, language)}
                    </td>

                    <td>
                      {patientCase.case_id ? (
                        <Link
                          className="small-button"
                          to={`/doctor/cases/${patientCase.case_id}`}
                        >
                          {t("openCase") ||
                            localText(language, "Öffnen", "Open")}
                        </Link>
                      ) : (
                        <span className="muted">
                          {localText(language, "Keine Fall-ID", "No case ID")}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </AppShell>
  );
}