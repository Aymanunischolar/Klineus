import { Fragment, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import AppShell from "../components/AppShell.jsx";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { api } from "../services/api.js";


const copy = {
  de: {
    eyebrow: "Fallprüfung",
    back: "Zurück zum Dashboard",
    loading: "Fall wird geladen ...",
    errorTitle: "Fall konnte nicht geladen werden",
    retry: "Erneut versuchen",
    patient: "Patient",
    unknownPatient: "Unbenannter Patient",
    caseId: "Fall-ID",
    created: "Erstellt",
    updated: "Aktualisiert",
    indication: "Fragebogen",
    version: "Version",
    status: "Status",
    reportStatus: "Berichtstatus",
    bmi: "BMI",
    noBmi: "Nicht berechnet",
    completed: "Abgeschlossen",
    pending: "Ausstehend",
    notGenerated: "Nicht generiert",
    generated: "Generiert",
    edited: "Bearbeitet",
    knee: "Knie",
    hip: "Hüfte",
    answersTitle: "Patientenantworten",
    flagsTitle: "Dokumentationshinweise",
    noFlags: "Keine besonderen Hinweise erkannt.",
    reportTitle: "KI-Dokumentationsentwurf",
    noReport: "Noch kein Bericht generiert.",
    generateReport: "Bericht generieren",
    generating: "Bericht wird generiert ...",
    saveReport: "Bericht speichern",
    saving: "Bericht wird gespeichert ...",
    reportSaved: "Bericht gespeichert.",
    copied: "Bericht kopiert.",
    aiDisclaimer:
      "KI-generierter Entwurf. Muss ärztlich geprüft und freigegeben werden.",
    preview: "Vorschau",
    edit: "Bearbeiten",
    printPdf: "Als PDF drucken",
    copy: "Kopieren",
    reportPlaceholder:
      "Generieren Sie einen Bericht oder schreiben Sie hier einen eigenen Entwurf.",
  },
  en: {
    eyebrow: "Case review",
    back: "Back to dashboard",
    loading: "Loading case ...",
    errorTitle: "Case could not be loaded",
    retry: "Try again",
    patient: "Patient",
    unknownPatient: "Unnamed patient",
    caseId: "Case ID",
    created: "Created",
    updated: "Updated",
    indication: "Questionnaire",
    version: "Version",
    status: "Status",
    reportStatus: "Report status",
    bmi: "BMI",
    noBmi: "Not calculated",
    completed: "Completed",
    pending: "Pending",
    notGenerated: "Not generated",
    generated: "Generated",
    edited: "Edited",
    knee: "Knee",
    hip: "Hip",
    answersTitle: "Patient answers",
    flagsTitle: "Documentation notes",
    noFlags: "No special notes detected.",
    reportTitle: "AI documentation draft",
    noReport: "No report generated yet.",
    generateReport: "Generate report",
    generating: "Generating report ...",
    saveReport: "Save report",
    saving: "Saving report ...",
    reportSaved: "Report saved.",
    copied: "Report copied.",
    aiDisclaimer:
      "AI-generated draft. Must be reviewed and approved by a physician.",
    preview: "Preview",
    edit: "Edit",
    printPdf: "Print / PDF",
    copy: "Copy",
    reportPlaceholder:
      "Generate a report or write your own draft here.",
  },
};


function formatDate(value, language) {
  if (!value) {
    return "—";
  }

  try {
    return new Intl.DateTimeFormat(language === "en" ? "en-US" : "de-DE", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}


function getIndicationLabel(indication, text) {
  if (indication === "hip_tep") {
    return text.hip;
  }

  if (indication === "knee_tep") {
    return text.knee;
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


function formatAnswer(answer) {
  if (Array.isArray(answer)) {
    return answer.length ? answer.join(", ") : "—";
  }

  if (answer && typeof answer === "object") {
    const parts = [];

    if (answer.height_cm) {
      parts.push(`${answer.height_cm} cm`);
    }

    if (answer.weight_kg) {
      parts.push(`${answer.weight_kg} kg`);
    }

    return parts.length ? parts.join(" / ") : "—";
  }

  if (answer === 0) {
    return "0";
  }

  return answer || "—";
}


function getFlagClass(level) {
  if (level === "red") {
    return "danger";
  }

  if (level === "orange") {
    return "warning";
  }

  return "success";
}


function renderInlineMarkdown(text) {
  const parts = String(text || "").split(/(\*\*[^*]+\*\*)/g);

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={`${part}-${index}`}>
          {part.slice(2, -2)}
        </strong>
      );
    }

    return (
      <Fragment key={`${part}-${index}`}>
        {part}
      </Fragment>
    );
  });
}


function MarkdownPreview({ markdown }) {
  const lines = String(markdown || "")
    .replace(/\r\n/g, "\n")
    .split("\n");

  const blocks = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index].trim();

    if (!line) {
      index += 1;
      continue;
    }

    if (line.startsWith("# ")) {
      blocks.push({
        type: "h1",
        text: line.replace(/^#\s+/, ""),
      });
      index += 1;
      continue;
    }

    if (line.startsWith("## ")) {
      blocks.push({
        type: "h2",
        text: line.replace(/^##\s+/, ""),
      });
      index += 1;
      continue;
    }

    if (line.startsWith("### ")) {
      blocks.push({
        type: "h3",
        text: line.replace(/^###\s+/, ""),
      });
      index += 1;
      continue;
    }

    if (/^[-*]\s+/.test(line)) {
      const items = [];

      while (index < lines.length && /^[-*]\s+/.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(/^[-*]\s+/, ""));
        index += 1;
      }

      blocks.push({
        type: "ul",
        items,
      });
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      const items = [];

      while (index < lines.length && /^\d+\.\s+/.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(/^\d+\.\s+/, ""));
        index += 1;
      }

      blocks.push({
        type: "ol",
        items,
      });
      continue;
    }

    const paragraphLines = [line];
    index += 1;

    while (
      index < lines.length &&
      lines[index].trim() &&
      !lines[index].trim().startsWith("# ") &&
      !lines[index].trim().startsWith("## ") &&
      !lines[index].trim().startsWith("### ") &&
      !/^[-*]\s+/.test(lines[index].trim()) &&
      !/^\d+\.\s+/.test(lines[index].trim())
    ) {
      paragraphLines.push(lines[index].trim());
      index += 1;
    }

    blocks.push({
      type: "p",
      text: paragraphLines.join(" "),
    });
  }

  return (
    <article className="markdown-report">
      {blocks.map((block, blockIndex) => {
        if (block.type === "h1") {
          return (
            <h1 key={blockIndex}>
              {renderInlineMarkdown(block.text)}
            </h1>
          );
        }

        if (block.type === "h2") {
          return (
            <h2 key={blockIndex}>
              {renderInlineMarkdown(block.text)}
            </h2>
          );
        }

        if (block.type === "h3") {
          return (
            <h3 key={blockIndex}>
              {renderInlineMarkdown(block.text)}
            </h3>
          );
        }

        if (block.type === "ul") {
          return (
            <ul key={blockIndex}>
              {block.items.map((item, itemIndex) => (
                <li key={`${item}-${itemIndex}`}>
                  {renderInlineMarkdown(item)}
                </li>
              ))}
            </ul>
          );
        }

        if (block.type === "ol") {
          return (
            <ol key={blockIndex}>
              {block.items.map((item, itemIndex) => (
                <li key={`${item}-${itemIndex}`}>
                  {renderInlineMarkdown(item)}
                </li>
              ))}
            </ol>
          );
        }

        return (
          <p key={blockIndex}>
            {renderInlineMarkdown(block.text)}
          </p>
        );
      })}
    </article>
  );
}


export default function DoctorCasePage() {
  const params = useParams();
  const caseId = params.caseId || params.case_id || params.id;

  const { language } = useLanguage();
  const text = copy[language] || copy.de;

  const [patientCase, setPatientCase] = useState(null);
  const [reportText, setReportText] = useState("");
  const [reportMode, setReportMode] = useState("preview");
  const [status, setStatus] = useState("loading");
  const [actionStatus, setActionStatus] = useState("idle");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function loadCase() {
    try {
      setStatus("loading");
      setError("");
      setNotice("");

      const data = await api.getCase(caseId);

      setPatientCase(data);
      setReportText(data.report_text || "");
      setReportMode(data.report_text ? "preview" : "edit");
      setStatus("success");
    } catch (err) {
      setError(err.message || text.errorTitle);
      setStatus("error");
    }
  }

  useEffect(() => {
    loadCase();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId]);

  const answerGroups = useMemo(() => {
    return patientCase?.answer_groups || [];
  }, [patientCase]);

  async function generateReport() {
    try {
      setActionStatus("generating");
      setError("");
      setNotice("");

      const data = await api.generateReport(caseId);

      setReportText(data.report_text || "");
      setReportMode("preview");

      setPatientCase((current) =>
        current
          ? {
              ...current,
              report_text: data.report_text,
              report_status: data.report_status,
              report_generated_at: data.report_generated_at,
            }
          : current
      );

      setActionStatus("idle");
    } catch (err) {
      setError(err.message || text.errorTitle);
      setActionStatus("idle");
    }
  }

  async function saveReport() {
    try {
      setActionStatus("saving");
      setError("");
      setNotice("");

      const data = await api.saveReport(caseId, reportText);

      setReportText(data.report_text || "");

      setPatientCase((current) =>
        current
          ? {
              ...current,
              report_text: data.report_text,
              report_status: data.report_status,
              report_generated_at: data.report_generated_at,
            }
          : current
      );

      setNotice(text.reportSaved);
      setActionStatus("idle");
    } catch (err) {
      setError(err.message || text.errorTitle);
      setActionStatus("idle");
    }
  }

  async function copyReport() {
    try {
      await navigator.clipboard.writeText(reportText);
      setNotice(text.copied);
    } catch {
      setError("Report could not be copied.");
    }
  }

  function printReport() {
    window.print();
  }

  return (
    <AppShell>
      <section className="case-detail-header">
        <div>
          <p className="eyebrow">{text.eyebrow}</p>
          <h1>
            {patientCase?.patient_name || text.unknownPatient}
          </h1>
        </div>

        <Link className="secondary-button" to="/doctor/dashboard">
          {text.back}
        </Link>
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

          <button className="primary-button" type="button" onClick={loadCase}>
            {text.retry}
          </button>
        </section>
      ) : null}

      {status === "success" && patientCase ? (
        <>
          <section className="case-meta-grid">
            <article>
              <span>{text.patient}</span>
              <strong>{patientCase.patient_name || text.unknownPatient}</strong>
            </article>

            <article>
              <span>{text.indication}</span>
              <strong>{getIndicationLabel(patientCase.indication, text)}</strong>
            </article>

            <article>
              <span>{text.version}</span>
              <strong>
                {patientCase.questionnaire_version
                  ? `v${patientCase.questionnaire_version}`
                  : "—"}
              </strong>
            </article>

            <article>
              <span>{text.status}</span>
              <strong>{getStatusLabel(patientCase.status, text)}</strong>
            </article>

            <article>
              <span>{text.reportStatus}</span>
              <strong>{getReportStatusLabel(patientCase.report_status, text)}</strong>
            </article>

            <article>
              <span>{text.bmi}</span>
              <strong>{patientCase.bmi || text.noBmi}</strong>
            </article>

            <article className="wide">
              <span>{text.caseId}</span>
              <strong className="mono">{patientCase.case_id}</strong>
            </article>

            <article>
              <span>{text.created}</span>
              <strong>{formatDate(patientCase.created_at, language)}</strong>
            </article>

            <article>
              <span>{text.updated}</span>
              <strong>{formatDate(patientCase.updated_at, language)}</strong>
            </article>
          </section>

          <section className="case-detail-grid">
            <div className="case-detail-column">
              <section className="case-panel">
                <div className="section-heading">
                  <p className="eyebrow">Klineus</p>
                  <h2>{text.flagsTitle}</h2>
                </div>

                {patientCase.flags?.length ? (
                  <div className="flag-list">
                    {patientCase.flags.map((flag, index) => (
                      <article
                        className={`flag-card ${getFlagClass(flag.level)}`}
                        key={`${flag.title}-${index}`}
                      >
                        <strong>{flag.title}</strong>
                        <p>{flag.description}</p>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="muted-text">{text.noFlags}</p>
                )}
              </section>

              <section className="case-panel">
                <div className="section-heading">
                  <p className="eyebrow">Klineus</p>
                  <h2>{text.answersTitle}</h2>
                </div>

                <div className="answer-group-list">
                  {answerGroups.map((group) => (
                    <article className="answer-group" key={group.block_id}>
                      <h3>{group.block_title || group.block_id}</h3>

                      <div className="answer-list">
                        {group.answers.map((answer) => (
                          <div
                            className="answer-row"
                            key={`${group.block_id}-${answer.question_id}`}
                          >
                            <span>{answer.question}</span>
                            <strong>{formatAnswer(answer.answer)}</strong>
                          </div>
                        ))}
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            </div>

            <aside className="case-panel report-panel">
              <div className="section-heading">
                <p className="eyebrow">Klineus</p>
                <h2>{text.reportTitle}</h2>
              </div>

              <p className="disclaimer">{text.aiDisclaimer}</p>

              {error ? <p className="form-error">{error}</p> : null}
              {notice ? <p className="form-success">{notice}</p> : null}

              <div className="report-actions">
                <button
                  className="primary-button"
                  type="button"
                  onClick={generateReport}
                  disabled={actionStatus === "generating" || actionStatus === "saving"}
                >
                  {actionStatus === "generating"
                    ? text.generating
                    : text.generateReport}
                </button>

                <button
                  className="secondary-button"
                  type="button"
                  onClick={saveReport}
                  disabled={
                    !reportText.trim() ||
                    actionStatus === "generating" ||
                    actionStatus === "saving"
                  }
                >
                  {actionStatus === "saving" ? text.saving : text.saveReport}
                </button>
              </div>

              <div className="report-toolbar">
                <div className="report-mode-toggle">
                  <button
                    className={reportMode === "preview" ? "active" : ""}
                    type="button"
                    onClick={() => setReportMode("preview")}
                    disabled={!reportText.trim()}
                  >
                    {text.preview}
                  </button>

                  <button
                    className={reportMode === "edit" ? "active" : ""}
                    type="button"
                    onClick={() => setReportMode("edit")}
                  >
                    {text.edit}
                  </button>
                </div>

                <div className="report-export-actions">
                  <button
                    className="small-button"
                    type="button"
                    onClick={copyReport}
                    disabled={!reportText.trim()}
                  >
                    {text.copy}
                  </button>

                  <button
                    className="small-button"
                    type="button"
                    onClick={printReport}
                    disabled={!reportText.trim()}
                  >
                    {text.printPdf}
                  </button>
                </div>
              </div>

              {reportMode === "preview" && reportText.trim() ? (
                <div className="report-preview-box print-report">
                  <div className="print-report-header">
                    <strong>Klineus</strong>
                    <span>{patientCase.patient_name || text.unknownPatient}</span>
                    <span>{formatDate(new Date().toISOString(), language)}</span>
                  </div>

                  <MarkdownPreview markdown={reportText} />
                </div>
              ) : (
                <textarea
                  className="report-textarea"
                  rows={24}
                  value={reportText}
                  placeholder={text.reportPlaceholder}
                  onChange={(event) => setReportText(event.target.value)}
                />
              )}
            </aside>
          </section>
        </>
      ) : null}
    </AppShell>
  );
}