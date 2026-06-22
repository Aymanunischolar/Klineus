import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import AppShell from "../components/AppShell.jsx";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { api } from "../services/api.js";

function localText(language, de, en) {
  return language === "en" ? en : de;
}

function formatDate(value, language) {
  if (!value) {
    return "-";
  }

  try {
    return new Intl.DateTimeFormat(language === "en" ? "en-US" : "de-DE", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return "-";
  }
}

function indicationLabel(indication) {
  if (indication === "hip_tep") {
    return "Hüft-TEP";
  }

  if (indication === "knee_tep") {
    return "Knie-TEP";
  }

  return indication || "-";
}

function displayValue(value) {
  if (
    !value ||
    value === "not-provided" ||
    value === "not-provided@klineus.local"
  ) {
    return "-";
  }

  return value;
}

function patientDisplayName(item) {
  const firstName = displayValue(item?.patient_name);
  const lastName = displayValue(item?.patient_last_name);

  if (firstName !== "-" && lastName !== "-" && !firstName.includes(lastName)) {
    return `${firstName} ${lastName}`;
  }

  if (firstName !== "-") {
    return firstName;
  }

  if (lastName !== "-") {
    return lastName;
  }

  return "-";
}

function statusLabel(status, language) {
  if (status === "completed") {
    return localText(language, "Ausgefüllt", "Completed");
  }

  if (status === "in_progress") {
    return localText(language, "Ausstehend", "Pending");
  }

  return status || "-";
}

function reportStatusLabel(status, language) {
  if (!status || status === "not_generated") {
    return localText(language, "Nicht erstellt", "Not generated");
  }

  return status;
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

    api
      .getDoctorWorklist()
      .then((data) => {
        if (!mounted) {
          return;
        }

        setPendingSessions(
          Array.isArray(data?.pending_sessions)
            ? data.pending_sessions
            : [],
        );

        setCompletedCases(
          Array.isArray(data?.completed_cases)
            ? data.completed_cases
            : [],
        );
      })
      .catch((loadError) => {
        if (mounted) {
          setError(loadError.message);
        }
      })
      .finally(() => {
        if (mounted) {
          setIsLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  function logout() {
    window.localStorage.removeItem("klineus_doctor_token");
    navigate("/doctor/login");
  }

  const hasAnyItems = pendingSessions.length > 0 || completedCases.length > 0;

  return (
    <AppShell>
      <section className="dashboard-header">
        <div>
          <p className="eyebrow">{t("dashboardEyebrow")}</p>

          <h1>{t("patientCases")}</h1>

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
            {t("logout")}
          </button>
        </div>
      </section>

      {error ? <p className="form-error">{error}</p> : null}

      {isLoading ? <p className="muted">{t("loadingCases")}</p> : null}

      {!isLoading && !hasAnyItems ? (
        <section className="empty-state">
          <h2>{t("emptyCasesTitle")}</h2>
          <p>{t("emptyCasesText")}</p>
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
                  <th>{localText(language, "E-Mail", "Email")}</th>
                  <th>
                    {localText(
                      language,
                      "Versicherungsnummer",
                      "Insurance ID",
                    )}
                  </th>
                  <th>{t("indication") || "Indikation"}</th>
                  <th>{t("status") || "Status"}</th>
                  <th>{localText(language, "Antworten", "Answers")}</th>
                  <th>
                    {localText(language, "Zuletzt aktualisiert", "Updated")}
                  </th>
                </tr>
              </thead>

              <tbody>
                {pendingSessions.map((session) => (
                  <tr key={session.session_id}>
                    <td>{patientDisplayName(session)}</td>

                    <td>{displayValue(session.patient_email)}</td>

                    <td>{displayValue(session.insurance_id)}</td>

                    <td>
                      <span className="indication-pill">
                        {indicationLabel(session.indication)}
                      </span>
                    </td>

                    <td>
                      <span className="status-pill status-pending">
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
                    {localText(
                      language,
                      "Versicherungsnummer",
                      "Insurance ID",
                    )}
                  </th>
                  <th>{t("caseId")}</th>
                  <th>{t("created")}</th>
                  <th>{t("indication")}</th>
                  <th>{t("status")}</th>
                  <th>{t("report")}</th>
                  <th>{localText(language, "Aktion", "Action")}</th>
                </tr>
              </thead>

              <tbody>
                {completedCases.map((patientCase) => (
                  <tr key={patientCase.case_id}>
                    <td>{patientDisplayName(patientCase)}</td>

                    <td>{displayValue(patientCase.insurance_id)}</td>

                    <td className="mono">
                      {patientCase.case_id
                        ? patientCase.case_id.slice(0, 8)
                        : "-"}
                    </td>

                    <td>{formatDate(patientCase.created_at, language)}</td>

                    <td>
                      <span className="indication-pill">
                        {indicationLabel(patientCase.indication)}
                      </span>
                    </td>

                    <td>{statusLabel(patientCase.status, language)}</td>

                    <td>
                      {reportStatusLabel(
                        patientCase.report_status,
                        language,
                      )}
                    </td>

                    <td>
                      {patientCase.case_id ? (
                        <Link
                          className="small-button"
                          to={`/doctor/cases/${patientCase.case_id}`}
                        >
                          {t("openCase") || "Öffnen"}
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