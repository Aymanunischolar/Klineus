import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import AppShell from "../components/AppShell.jsx";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { api } from "../services/api.js";

function formatDate(value, language) {
  return new Intl.DateTimeFormat(language === "en" ? "en-US" : "de-DE", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
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
          setCases(data);
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
        </div>
        <button className="secondary-button" type="button" onClick={logout}>
          {t("logout")}
        </button>
      </section>

      {error ? <p className="form-error">{error}</p> : null}
      {isLoading ? <p className="muted">{t("loadingCases")}</p> : null}

      {!isLoading && cases.length === 0 ? (
        <section className="empty-state">
          <h2>{t("emptyCasesTitle")}</h2>
          <p>{t("emptyCasesText")}</p>
        </section>
      ) : null}

      {cases.length > 0 ? (
        <div className="case-table-wrap">
          <table className="case-table">
            <thead>
              <tr>
                <th>{t("caseId")}</th>
                <th>{t("created")}</th>
                <th>{t("indication")}</th>
                <th>{t("status")}</th>
                <th>{t("report")}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {cases.map((patientCase) => (
                <tr key={patientCase.case_id}>
                  <td className="mono">{patientCase.case_id.slice(0, 8)}</td>
                  <td>{formatDate(patientCase.created_at, language)}</td>
                  <td>{t("kneeTep")}</td>
                  <td>{t(patientCase.status)}</td>
                  <td>
                    {patientCase.report_status === "not_generated"
                      ? t("notGenerated")
                      : t(patientCase.report_status)}
                  </td>
                  <td>
                    <Link className="small-button" to={`/doctor/cases/${patientCase.case_id}`}>
                      {t("openCase")}
                    </Link>
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
