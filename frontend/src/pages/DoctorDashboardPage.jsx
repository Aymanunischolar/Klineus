import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import AppShell from "../components/AppShell.jsx";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { api } from "../services/api.js";

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

function patientDisplayName(patientCase) {
  const fullName = patientCase.patient_name || "";
  const lastName = patientCase.patient_last_name || "";

  if (fullName && lastName && !fullName.includes(lastName)) {
    return `${fullName} ${lastName}`;
  }

  return fullName || lastName || "-";
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
            Eingereichte Fragebögen werden hier mit Patientendaten,
            Indikation, Status und Öffnen-Link angezeigt.
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
                <th>Patient</th>
                <th>Versicherung</th>
                <th>E-Mail</th>
                <th>{t("created") || "Erstellt"}</th>
                <th>{t("indication") || "Indikation"}</th>
                <th>{t("report") || "Arztbrief"}</th>
                <th>Aktion</th>
              </tr>
            </thead>

            <tbody>
              {cases.map((patientCase) => (
                <tr key={patientCase.case_id}>
                  <td>
                    <strong>{patientDisplayName(patientCase)}</strong>

                    <div className="muted mono">
                      {patientCase.case_id
                        ? patientCase.case_id.slice(0, 8)
                        : "-"}
                    </div>
                  </td>

                  <td className="mono">
                    {patientCase.insurance_id || "-"}
                  </td>

                  <td>{patientCase.patient_email || "-"}</td>

                  <td>{formatDate(patientCase.created_at, language)}</td>

                  <td>
                    <span className="indication-pill">
                      {indicationLabel(patientCase.indication)}
                    </span>
                  </td>

                  <td>{reportStatusLabel(patientCase.report_status, t)}</td>

                  <td>
                    {patientCase.case_id ? (
                      <Link
                        className="small-button"
                        to={`/doctor/cases/${patientCase.case_id}`}
                      >
                        {t("openCase") || "Öffnen"}
                      </Link>
                    ) : (
                      <span className="muted">Keine Fall-ID</span>
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