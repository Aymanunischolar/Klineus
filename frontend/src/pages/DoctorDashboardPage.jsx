import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import AppShell from "../components/AppShell.jsx";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { api } from "../services/api.js";


const copy = {
  de: {
    eyebrow: "Arzt-Dashboard",
    title: "Patientenfälle",
    logout: "Abmelden",
    refresh: "Aktualisieren",
    loading: "Fälle werden geladen ...",
    emptyTitle: "Noch keine Fälle vorhanden",
    emptyText:
      "Sobald ein Patient einen Fragebogen absendet, erscheint der Fall hier.",
    errorTitle: "Fälle konnten nicht geladen werden",
    all: "Alle",
    knee: "Knie",
    hip: "Hüfte",
    totalCases: "Fälle gesamt",
    kneeCases: "Knie-Fälle",
    hipCases: "Hüft-Fälle",
    patient: "Patient",
    caseId: "Fall-ID",
    created: "Erstellt",
    indication: "Fragebogen",
    version: "Version",
    status: "Status",
    report: "Bericht",
    actions: "Aktionen",
    open: "Öffnen",
    delete: "Löschen",
    deleteConfirm: "Diesen Fall wirklich löschen?",
    unknownPatient: "Unbenannter Patient",
    completed: "Abgeschlossen",
    pending: "Ausstehend",
    notGenerated: "Nicht generiert",
    generated: "Generiert",
    edited: "Bearbeitet",
    questionnaireVersion: "v",
  },
  en: {
    eyebrow: "Doctor dashboard",
    title: "Patient cases",
    logout: "Log out",
    refresh: "Refresh",
    loading: "Loading cases ...",
    emptyTitle: "No cases yet",
    emptyText:
      "As soon as a patient submits a questionnaire, the case will appear here.",
    errorTitle: "Cases could not be loaded",
    all: "All",
    knee: "Knee",
    hip: "Hip",
    totalCases: "Total cases",
    kneeCases: "Knee cases",
    hipCases: "Hip cases",
    patient: "Patient",
    caseId: "Case ID",
    created: "Created",
    indication: "Questionnaire",
    version: "Version",
    status: "Status",
    report: "Report",
    actions: "Actions",
    open: "Open",
    delete: "Delete",
    deleteConfirm: "Really delete this case?",
    unknownPatient: "Unnamed patient",
    completed: "Completed",
    pending: "Pending",
    notGenerated: "Not generated",
    generated: "Generated",
    edited: "Edited",
    questionnaireVersion: "v",
  },
};


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


function getIndicationLabel(indication, language) {
  if (indication === "hip_tep") {
    return language === "en" ? "Hip" : "Hüfte";
  }

  if (indication === "knee_tep") {
    return language === "en" ? "Knee" : "Knie";
  }

  return indication || "—";
}


function getStatusLabel(status, text) {
  if (status === "completed") {
    return text.completed;
  }

  if (status === "pending") {
    return text.pending;
  }

  return status || "—";
}


function getReportStatusLabel(status, text) {
  if (status === "not_generated") {
    return text.notGenerated;
  }

  if (status === "generated") {
    return text.generated;
  }

  if (status === "edited") {
    return text.edited;
  }

  return status || "—";
}


function getShortCaseId(caseId = "") {
  return caseId ? caseId.slice(0, 8) : "—";
}


export default function DoctorDashboardPage() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const text = copy[language] || copy.de;

  const [cases, setCases] = useState([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");

  async function loadCases() {
    try {
      setStatus("loading");
      setError("");

      const data = await api.listCases();

      setCases(Array.isArray(data) ? data : []);
      setStatus("success");
    } catch (err) {
      setError(err.message || text.errorTitle);
      setStatus("error");
    }
  }

  useEffect(() => {
    loadCases();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const counts = useMemo(() => {
    return {
      all: cases.length,
      knee_tep: cases.filter((item) => item.indication === "knee_tep").length,
      hip_tep: cases.filter((item) => item.indication === "hip_tep").length,
    };
  }, [cases]);

  const filteredCases = useMemo(() => {
    if (activeFilter === "all") {
      return cases;
    }

    return cases.filter((item) => item.indication === activeFilter);
  }, [activeFilter, cases]);

  function logout() {
    window.localStorage.removeItem("klineus_doctor_token");
    navigate("/doctor/login");
  }

  async function deleteCase(caseId) {
    const confirmed = window.confirm(text.deleteConfirm);

    if (!confirmed) {
      return;
    }

    try {
      await api.deleteCase(caseId);

      setCases((currentCases) =>
        currentCases.filter((item) => item.case_id !== caseId)
      );
    } catch (err) {
      setError(err.message || text.errorTitle);
    }
  }

  return (
    <AppShell>
      <section className="dashboard-header">
        <div>
          <p className="eyebrow">{text.eyebrow}</p>
          <h1>{text.title}</h1>
        </div>

        <div className="dashboard-header-actions">
          <button className="secondary-button" type="button" onClick={loadCases}>
            {text.refresh}
          </button>

          <button className="secondary-button" type="button" onClick={logout}>
            {text.logout}
          </button>
        </div>
      </section>

      <section className="case-stats-grid">
        <article className="case-stat-card">
          <span>{text.totalCases}</span>
          <strong>{counts.all}</strong>
        </article>

        <article className="case-stat-card">
          <span>{text.kneeCases}</span>
          <strong>{counts.knee_tep}</strong>
        </article>

        <article className="case-stat-card">
          <span>{text.hipCases}</span>
          <strong>{counts.hip_tep}</strong>
        </article>
      </section>

      <section className="case-filter-tabs">
        <button
          className={activeFilter === "all" ? "active" : ""}
          type="button"
          onClick={() => setActiveFilter("all")}
        >
          {text.all} ({counts.all})
        </button>

        <button
          className={activeFilter === "knee_tep" ? "active" : ""}
          type="button"
          onClick={() => setActiveFilter("knee_tep")}
        >
          {text.knee} ({counts.knee_tep})
        </button>

        <button
          className={activeFilter === "hip_tep" ? "active" : ""}
          type="button"
          onClick={() => setActiveFilter("hip_tep")}
        >
          {text.hip} ({counts.hip_tep})
        </button>
      </section>

      {status === "loading" ? (
        <section className="empty-state">
          <p>{text.loading}</p>
        </section>
      ) : null}

      {status === "error" ? (
        <section className="empty-state">
          <h2>{text.errorTitle}</h2>
          <p>{error}</p>

          <button className="primary-button" type="button" onClick={loadCases}>
            {text.refresh}
          </button>
        </section>
      ) : null}

      {status === "success" && cases.length === 0 ? (
        <section className="empty-state">
          <h2>{text.emptyTitle}</h2>
          <p>{text.emptyText}</p>
        </section>
      ) : null}

      {status === "success" && cases.length > 0 ? (
        <div className="case-table-wrap">
          <table className="case-table">
            <thead>
              <tr>
                <th>{text.patient}</th>
                <th>{text.caseId}</th>
                <th>{text.created}</th>
                <th>{text.indication}</th>
                <th>{text.version}</th>
                <th>{text.status}</th>
                <th>{text.report}</th>
                <th>{text.actions}</th>
              </tr>
            </thead>

            <tbody>
              {filteredCases.map((patientCase) => (
                <tr key={patientCase.case_id}>
                  <td>
                    <strong>
                      {patientCase.patient_name || text.unknownPatient}
                    </strong>
                  </td>

                  <td className="mono">
                    {getShortCaseId(patientCase.case_id)}
                  </td>

                  <td>
                    {formatDate(patientCase.created_at, language)}
                  </td>

                  <td>
                    <span className={`indication-pill ${patientCase.indication}`}>
                      {getIndicationLabel(patientCase.indication, language)}
                    </span>
                  </td>

                  <td>
                    {patientCase.questionnaire_version
                      ? `${text.questionnaireVersion}${patientCase.questionnaire_version}`
                      : "—"}
                  </td>

                  <td>{getStatusLabel(patientCase.status, text)}</td>

                  <td>
                    {getReportStatusLabel(patientCase.report_status, text)}
                  </td>

                  <td>
                    <div className="case-row-actions">
                      <Link
                        className="small-button"
                        to={`/doctor/cases/${patientCase.case_id}`}
                      >
                        {text.open}
                      </Link>

                      <button
                        className="small-button danger"
                        type="button"
                        onClick={() => deleteCase(patientCase.case_id)}
                      >
                        {text.delete}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredCases.length === 0 ? (
            <section className="empty-state">
              <p>{text.emptyText}</p>
            </section>
          ) : null}
        </div>
      ) : null}
    </AppShell>
  );
}