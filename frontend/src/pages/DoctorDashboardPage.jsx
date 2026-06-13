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

  return new Intl.DateTimeFormat(language === "en" ? "en-US" : "de-DE", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function indicationLabel(indication) {
  if (indication === "hip_tep") {
    return "Hüft-TEP";
  }

  return "Knie-TEP";
}

function statusLabel(status, t) {
  if (!status) {
    return "-";
  }

  return t(status) || status;
}

function reportStatusLabel(status, t) {
  if (!status || status === "not_generated") {
    return t("notGenerated") || "Nicht erstellt";
  }

  return t(status) || status;
}

export default function DoctorDashboardPage() {
  const navigate = useNavigate();
  const { language, t } = useLanguage();

  const [cases, setCases] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    api
      .listCases()
      .then((data) => {
        if (mounted) {
          setCases(Array.isArray(data) ? data : []);
        }
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

  return (
    <AppShell>
      <section className="dashboard-header">
        <div>
          <p className="eyebrow">{t("dashboardEyebrow")}</p>

          <h1>{t("patientCases")}</h1>

          <p className="dashboard-subtitle">
            {localText(
              language,
              "Eingereichte Fragebögen werden hier mit Patient, Versicherungsnummer, Indikation, Status und Öffnen-Link angezeigt.",
              "Submitted questionnaires are shown here with patient, insurance ID, indication, status and open link.",
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

      {!isLoading && cases.length === 0 ? (
        <section className="empty-state">
          <h2>{t("emptyCasesTitle")}</h2>
          <p>{t("emptyCasesText")}</p>
        </section>
      ) : null}

      {!isLoading && cases.length > 0 ? (
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
              {cases.map((patientCase) => (
                <tr key={patientCase.case_id}>
                  <td>
                    <strong>{patientCase.patient_name || "-"}</strong>
                  </td>

                  <td className="mono">{patientCase.insurance_id || "-"}</td>

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

                  <td>{statusLabel(patientCase.status, t)}</td>

                  <td>{reportStatusLabel(patientCase.report_status, t)}</td>

                  <td>
                    {patientCase.case_id ? (
                      <Link
                        className="small-button"
                        to={`/doctor/cases/${patientCase.case_id}`}
                      >
                        {t("openCase") || localText(language, "Öffnen", "Open")}
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
      ) : null}
    </AppShell>
  );
}