import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import FlagBadge from "../components/FlagBadge.jsx";
import LanguageToggle from "../components/LanguageToggle.jsx";
import {
  DISCLAIMER,
  getAnswerLabel,
  getBlockTitle,
  getQuestionText,
} from "../data/questionnaire.js";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { api } from "../services/api.js";

function formatAnswer(answer, language, t) {
  if (Array.isArray(answer)) {
    return getAnswerLabel(answer, language, t("noAnswer"));
  }
  if (answer && typeof answer === "object") {
    const height = answer.height_cm ? `${answer.height_cm} cm` : t("noAnswer");
    const weight = answer.weight_kg ? `${answer.weight_kg} kg` : t("noAnswer");
    return `${t("heightShort")}: ${height}, ${t("weightShort")}: ${weight}`;
  }
  return getAnswerLabel(answer, language, t("noAnswer"));
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

function ensureDisclaimerText(text) {
  const cleanText = text.trim();
  if (!cleanText) {
    return "";
  }
  if (cleanText.startsWith(DISCLAIMER)) {
    return cleanText;
  }
  return `${DISCLAIMER}\n\n${cleanText}`;
}

export default function DoctorCasePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { language, t, translateFlag } = useLanguage();
  const [patientCase, setPatientCase] = useState(null);
  const [reportText, setReportText] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  async function loadCase() {
    setIsLoading(true);
    setError("");
    try {
      const data = await api.getCase(id);
      setPatientCase(data);
      setReportText(data.report_text || "");
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadCase();
  }, [id]);

  async function handleGenerate() {
    setIsGenerating(true);
    setError("");
    setNotice("");
    try {
      const data = await api.generateReport(id);
      setReportText(data.report_text);
      await loadCase();
      setNotice(t("reportGeneratedNotice"));
    } catch (generateError) {
      setError(generateError.message);
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleSave() {
    setIsSaving(true);
    setError("");
    setNotice("");
    try {
      const data = await api.saveReport(id, ensureDisclaimerText(reportText));
      setReportText(data.report_text);
      await loadCase();
      setNotice(t("reportSavedNotice"));
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleCopy() {
    if (!reportText.trim()) {
      setError(t("noReportToCopy"));
      return;
    }
    await navigator.clipboard.writeText(ensureDisclaimerText(reportText));
    setNotice(t("reportCopiedNotice"));
  }

  async function handleDelete() {
    const confirmed = window.confirm(t("deleteConfirm"));
    if (!confirmed) {
      return;
    }
    await api.deleteCase(id);
    navigate("/doctor/dashboard");
  }

  if (isLoading) {
    return (
      <div className="app-shell">
        <p className="muted">{t("loadingCase")}</p>
      </div>
    );
  }

  if (!patientCase) {
    return (
      <div className="app-shell">
        <Link className="text-link" to="/doctor/dashboard">
          {t("back")}
        </Link>
        <p className="form-error">{error || t("caseNotFound")}</p>
      </div>
    );
  }

  return (
    <div className="app-shell doctor-case-shell">
      <header className="case-header no-print">
        <div>
          <Link className="text-link" to="/doctor/dashboard">
            {t("backToDashboard")}
          </Link>
          <p className="eyebrow">{t("kneeCase")}</p>
          <h1>{patientCase.case_id.slice(0, 8)}</h1>
          <p className="muted">
            {t("created")}: {formatDate(patientCase.created_at, language)} · {t("updated")}:{" "}
            {formatDate(patientCase.updated_at, language)}
          </p>
        </div>
        <div className="case-header-actions">
          <LanguageToggle />
          <button className="danger-button" type="button" onClick={handleDelete}>
            {t("deleteCase")}
          </button>
        </div>
      </header>

      {error ? <p className="form-error no-print">{error}</p> : null}
      {notice ? <p className="form-notice no-print">{notice}</p> : null}

      <div className="case-layout">
        <section className="case-column">
          <div className="section-heading">
            <h2>{t("patientAnswers")}</h2>
            {patientCase.bmi ? <span className="metric-pill">BMI {patientCase.bmi}</span> : null}
          </div>
          {patientCase.answer_groups.map((group) => (
            <article className="answer-group" key={group.block_id}>
              <h3>{getBlockTitle(group.block_id, language)}</h3>
              <div className="answer-list">
                {group.answers.map((answer) => (
                  <div className="answer-row" key={answer.question_id}>
                    <div>
                      <span className="question-code">{answer.question_id}</span>
                      <p>{getQuestionText(answer.question_id, language, answer.question)}</p>
                    </div>
                    <strong>{formatAnswer(answer.answer, language, t)}</strong>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </section>

        <aside className="case-column no-print">
          <div className="section-heading">
            <h2>{t("documentationFlags")}</h2>
          </div>
          <div className="flag-list">
            {patientCase.flags.map((flag) => (
              <FlagBadge flag={translateFlag(flag)} key={`${flag.level}-${flag.title}`} />
            ))}
          </div>
        </aside>
      </div>

      <section className="report-section">
        <div className="section-heading no-print">
          <div>
            <h2>{t("aiReport")}</h2>
            <p className="disclaimer">{DISCLAIMER}</p>
          </div>
          <button className="primary-button" disabled={isGenerating} type="button" onClick={handleGenerate}>
            {t("generateAiReport")}
          </button>
        </div>

        <div className="report-actions no-print">
          <button className="secondary-button" disabled={isSaving || !reportText.trim()} type="button" onClick={handleSave}>
            {t("save")}
          </button>
          <button className="secondary-button" disabled={!reportText.trim()} type="button" onClick={handleCopy}>
            {t("copy")}
          </button>
          <button className="secondary-button" disabled={!reportText.trim()} type="button" onClick={() => window.print()}>
            {t("print")}
          </button>
        </div>

        <textarea
          className="report-editor no-print"
          placeholder={t("reportPlaceholder")}
          rows="18"
          value={reportText}
          onChange={(event) => setReportText(event.target.value)}
        />

        <article className="print-report">
          <h2>{t("printTitle")}</h2>
          <p>{DISCLAIMER}</p>
          <pre>{reportText}</pre>
        </article>
      </section>
    </div>
  );
}
