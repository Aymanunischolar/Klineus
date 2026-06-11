import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import AppShell from "../components/AppShell.jsx";
import { api } from "../services/api.js";
import { useLanguage } from "../i18n/LanguageContext.jsx";

function localText(language, de, en) {
  return language === "en" ? en : de;
}

function formatDate(value, language) {
  if (!value) {
    return "-";
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

function indicationLabel(indication) {
  if (indication === "hip_tep") {
    return "Hüft-TEP";
  }

  return "Knie-TEP";
}

function getCaseIdFromParams(params) {
  return (
    params.caseId ||
    params.sessionId ||
    params.id ||
    Object.values(params).find(Boolean) ||
    ""
  );
}

function normalizeAnswer(answer) {
  if (answer === null || answer === undefined || answer === "") {
    return "Keine Angabe";
  }

  if (Array.isArray(answer)) {
    return answer.length ? answer.join(", ") : "Keine Angabe";
  }

  if (typeof answer === "object") {
    if (
      Object.prototype.hasOwnProperty.call(answer, "height_cm") ||
      Object.prototype.hasOwnProperty.call(answer, "weight_kg")
    ) {
      return `Größe: ${answer.height_cm || "-"} cm, Gewicht: ${
        answer.weight_kg || "-"
      } kg`;
    }

    if (Object.prototype.hasOwnProperty.call(answer, "value")) {
      return answer.detail ? `${answer.value}: ${answer.detail}` : answer.value;
    }

    return JSON.stringify(answer, null, 2);
  }

  return String(answer);
}

function getQuestionText(answer) {
  return (
    answer.question ||
    answer.question_de ||
    answer.question_text_de ||
    answer.question_text ||
    answer.label_de ||
    answer.label ||
    answer.text_de ||
    answer.text ||
    answer.question_id ||
    "-"
  );
}

function getQuestionId(answer) {
  return answer.question_id || answer.id || "-";
}

function getBlockId(answer) {
  return answer.block_id || answer.blockId || "Weitere Angaben";
}

function getBlockTitle(answer) {
  return (
    answer.block_title ||
    answer.block_title_de ||
    answer.blockTitle ||
    answer.block ||
    getBlockId(answer)
  );
}

function groupAnswers(answers) {
  const groups = [];

  answers.forEach((answer) => {
    const blockId = getBlockId(answer);
    const blockTitle = getBlockTitle(answer);

    let group = groups.find((item) => item.blockId === blockId);

    if (!group) {
      group = {
        blockId,
        blockTitle,
        answers: [],
      };

      groups.push(group);
    }

    group.answers.push(answer);
  });

  return groups;
}

function normaliseAnswerGroups(patientCase) {
  if (Array.isArray(patientCase?.answer_groups)) {
    return patientCase.answer_groups.map((group) => ({
      blockId: group.block_id || group.blockId || "Weitere Angaben",
      blockTitle: group.block_title || group.blockTitle || "Weitere Angaben",
      answers: Array.isArray(group.answers) ? group.answers : [],
    }));
  }

  const rawAnswers = Array.isArray(patientCase?.answers)
    ? patientCase.answers
    : [];

  return groupAnswers(rawAnswers);
}

function extractReportText(data) {
  if (!data) {
    return "";
  }

  if (typeof data === "string") {
    return data;
  }

  return (
    data.report_text ||
    data.report ||
    data.markdown ||
    data.content ||
    data.ai_report ||
    data.report_json?.markdown ||
    data.report_json?.report_text ||
    ""
  );
}

function extractFlags(patientCase) {
  const reportJson = patientCase?.report_json || {};

  const possibleFlags =
    patientCase?.flags ||
    patientCase?.risk_flags ||
    patientCase?.ai_flags ||
    reportJson.flags ||
    reportJson.risk_flags ||
    reportJson.open_points ||
    [];

  return Array.isArray(possibleFlags) ? possibleFlags : [];
}

function flagLevelClass(flag) {
  const level = String(
    flag.level || flag.severity || flag.color || "",
  ).toLowerCase();

  if (
    level.includes("red") ||
    level.includes("rot") ||
    level.includes("danger") ||
    level.includes("critical")
  ) {
    return "flag-card danger";
  }

  if (
    level.includes("orange") ||
    level.includes("warning") ||
    level.includes("amber") ||
    level.includes("unclear")
  ) {
    return "flag-card warning";
  }

  return "flag-card success";
}

function EditableReportTemplate({ text, language, onChange }) {
  if (!text) {
    return (
      <div className="doctor-report-empty">
        <strong>
          {localText(
            language,
            "Noch kein Arztbrief erstellt",
            "No doctor letter yet",
          )}
        </strong>

        <p>
          {localText(
            language,
            "Erstellen Sie einen KI-Entwurf. Danach kann der Text direkt im Dokument bearbeitet und gespeichert werden.",
            "Generate an AI draft. Afterwards, the text can be edited directly inside the document and saved.",
          )}
        </p>
      </div>
    );
  }

  const lines = text.split("\n");

  function updateLine(index, nextContent, prefix = "") {
    const cleanContent = String(nextContent || "")
      .replace(/\n+/g, " ")
      .trim();

    const nextLines = [...lines];
    nextLines[index] = prefix ? `${prefix}${cleanContent}` : cleanContent;

    onChange(nextLines.join("\n"));
  }

  return (
    <article className="doctor-report-preview doctor-report-preview-editable">
      {lines.map((line, index) => {
        const trimmedLine = line.trim();

        if (!trimmedLine) {
          return <div className="doctor-report-spacer" key={index} />;
        }

        if (
          trimmedLine.includes("AI-generated draft") ||
          trimmedLine.includes("KI-generierter Entwurf") ||
          trimmedLine.includes("Ärztliche Prüfung") ||
          trimmedLine.includes("physician")
        ) {
          const cleanLine = trimmedLine.replace(/^[-*]\s*/, "");

          return (
            <div
              className="doctor-report-disclaimer editable-report-field"
              contentEditable
              suppressContentEditableWarning
              spellCheck="true"
              key={index}
              onBlur={(event) =>
                updateLine(index, event.currentTarget.innerText)
              }
            >
              {cleanLine}
            </div>
          );
        }

        if (trimmedLine.startsWith("# ")) {
          return (
            <h1
              className="editable-report-field"
              contentEditable
              suppressContentEditableWarning
              spellCheck="true"
              key={index}
              onBlur={(event) =>
                updateLine(index, event.currentTarget.innerText, "# ")
              }
            >
              {trimmedLine.replace("# ", "")}
            </h1>
          );
        }

        if (trimmedLine.startsWith("## ")) {
          return (
            <h2
              className="editable-report-field"
              contentEditable
              suppressContentEditableWarning
              spellCheck="true"
              key={index}
              onBlur={(event) =>
                updateLine(index, event.currentTarget.innerText, "## ")
              }
            >
              {trimmedLine.replace("## ", "")}
            </h2>
          );
        }

        if (trimmedLine.startsWith("### ")) {
          return (
            <h3
              className="editable-report-field"
              contentEditable
              suppressContentEditableWarning
              spellCheck="true"
              key={index}
              onBlur={(event) =>
                updateLine(index, event.currentTarget.innerText, "### ")
              }
            >
              {trimmedLine.replace("### ", "")}
            </h3>
          );
        }

        if (trimmedLine.startsWith("- ")) {
          return (
            <div className="doctor-report-bullet" key={index}>
              <span aria-hidden="true">•</span>

              <p
                className="editable-report-field"
                contentEditable
                suppressContentEditableWarning
                spellCheck="true"
                onBlur={(event) =>
                  updateLine(index, event.currentTarget.innerText, "- ")
                }
              >
                {trimmedLine.replace("- ", "")}
              </p>
            </div>
          );
        }

        return (
          <p
            className="editable-report-field"
            contentEditable
            suppressContentEditableWarning
            spellCheck="true"
            key={index}
            onBlur={(event) =>
              updateLine(index, event.currentTarget.innerText)
            }
          >
            {trimmedLine}
          </p>
        );
      })}
    </article>
  );
}

export default function DoctorCasePage() {
  const params = useParams();
  const caseId = getCaseIdFromParams(params);
  const { language } = useLanguage();

  const [patientCase, setPatientCase] = useState(null);
  const [reportText, setReportText] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let mounted = true;

    setIsLoading(true);
    setError("");
    setNotice("");

    api
      .getCase(caseId)
      .then((data) => {
        if (!mounted) return;

        setPatientCase(data);
        setReportText(extractReportText(data));
      })
      .catch((loadError) => {
        if (!mounted) return;

        setError(
          loadError.message ||
            localText(
              language,
              "Der Fall konnte nicht geladen werden.",
              "The case could not be loaded.",
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
  }, [caseId, language]);

  const answerGroups = useMemo(
    () => normaliseAnswerGroups(patientCase),
    [patientCase],
  );

  const answers = useMemo(
    () => answerGroups.flatMap((group) => group.answers || []),
    [answerGroups],
  );

  const flags = useMemo(() => extractFlags(patientCase), [patientCase]);

  async function handleGenerateReport() {
    setIsGenerating(true);
    setError("");
    setNotice("");

    try {
      const result = await api.generateReport(caseId);
      const nextReport = extractReportText(result);

      setReportText(nextReport);

      setPatientCase((previous) => ({
        ...(previous || {}),
        ...(result || {}),
        report_text: nextReport,
      }));

      setNotice(
        localText(
          language,
          "Der KI-Entwurf wurde erstellt. Bitte ärztlich prüfen.",
          "The AI draft was created. Please review medically.",
        ),
      );
    } catch (generateError) {
      setError(
        generateError.message ||
          localText(
            language,
            "Der Bericht konnte nicht erstellt werden.",
            "The report could not be generated.",
          ),
      );
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleSaveReport() {
    setIsSaving(true);
    setError("");
    setNotice("");

    try {
      await api.saveReport(caseId, reportText);

      setNotice(
        localText(
          language,
          "Der Bericht wurde gespeichert.",
          "The report was saved.",
        ),
      );
    } catch (saveError) {
      setError(
        saveError.message ||
          localText(
            language,
            "Der Bericht konnte nicht gespeichert werden.",
            "The report could not be saved.",
          ),
      );
    } finally {
      setIsSaving(false);
    }
  }

  function handleExportPdf() {
  if (!reportText) {
    setNotice(
      localText(
        language,
        "Bitte erstellen Sie zuerst einen KI-Entwurf.",
        "Please generate an AI draft first.",
      ),
    );
    return;
  }

  /*
    If the doctor is currently editing inside the template,
    force the active editable field to save its onBlur change before printing.
  */
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }

  document.body.classList.add("print-doctor-letter");

  window.setTimeout(() => {
    window.print();

    window.setTimeout(() => {
      document.body.classList.remove("print-doctor-letter");
    }, 500);
  }, 100);
}

  if (isLoading) {
    return (
      <AppShell>
        <p className="muted">
          {localText(language, "Fall wird geladen…", "Loading case…")}
        </p>
      </AppShell>
    );
  }

  if (error && !patientCase) {
    return (
      <AppShell>
        <Link className="text-link case-back-link" to="/doctor/dashboard">
          ← {localText(language, "Zurück zum Dashboard", "Back to dashboard")}
        </Link>

        <p className="form-error">{error}</p>
      </AppShell>
    );
  }

  return (
    <AppShell>
<div className="doctor-case-shell">
  <Link className="text-link case-back-link" to="/doctor/dashboard">
    ← {localText(language, "Zurück zum Dashboard", "Back to dashboard")}
  </Link>

  <section className="case-header case-header-enhanced">
    <div>
      <p className="eyebrow">
        {localText(language, "Patientenfall", "Patient case")}
      </p>

      <h1>
        {localText(language, "Auswertung", "Evaluation")}{" "}
        {caseId ? caseId.slice(0, 8) : ""}
      </h1>

      <p className="case-subtitle">
        {localText(
            language,
            "Fragen und Antworten werden für die ärztliche Prüfung immer in deutscher Originalfassung angezeigt.",
            "Questions and answers are always shown in the German source version for medical review.",
        )}
      </p>
    </div>
  </section>

  <section className="case-summary-grid">
    <article className="case-summary-card">
      <span>{localText(language, "Fall-ID", "Case ID")}</span>
      <strong className="mono">{patientCase?.case_id || caseId}</strong>
    </article>

    <article className="case-summary-card">
      <span>{localText(language, "Erstellt", "Created")}</span>
      <strong>{formatDate(patientCase?.created_at, language)}</strong>
    </article>

    <article className="case-summary-card">
      <span>{localText(language, "Indikation", "Indication")}</span>
      <strong>{indicationLabel(patientCase?.indication)}</strong>
    </article>

    <article className="case-summary-card">
      <span>{localText(language, "Status", "Status")}</span>
      <strong>{patientCase?.status || "-"}</strong>
    </article>

    <article className="case-summary-card">
      <span>{localText(language, "Antworten", "Answers")}</span>
      <strong>{answers.length}</strong>
    </article>
  </section>

  {error ? <p className="form-error">{error}</p> : null}
  {notice ? <p className="form-notice">{notice}</p> : null}

  <section className="doctor-workspace-grid">
    <main className="doctor-main-column">
      <section className="doctor-notes-panel-left">
        <div className="doctor-section-heading">
          <div>
            <p className="eyebrow">
              {localText(language, "Offene Punkte", "Open points")}
            </p>

            <h2>
              {localText(
                  language,
                  "Wichtige Hinweise für das Arztgespräch",
                  "Important notes for the consultation",
              )}
            </h2>
          </div>

          <span className="doctor-count-pill">{flags.length}</span>
        </div>

        {flags.length === 0 ? (
            <p className="muted">
              {localText(
                  language,
                  "Keine Hinweise vorhanden.",
                  "No notes available.",
              )}
            </p>
        ) : (
            <div className="doctor-notes-grid">
              {flags.map((flag, index) => (
                  <article className={flagLevelClass(flag)} key={index}>
                    <strong>
                      {flag.title ||
                          flag.label ||
                          flag.message ||
                          localText(language, "Hinweis", "Note")}
                    </strong>

                    {flag.description || flag.text || flag.reason ? (
                        <p>{flag.description || flag.text || flag.reason}</p>
                    ) : null}
                  </article>
              ))}
            </div>
        )}
      </section>

      <section className="answer-group answer-group-enhanced">
        <div className="section-heading">
          <div>
            <p className="eyebrow">
              {localText(
                  language,
                  "Originalfragebogen",
                  "Original questionnaire",
              )}
            </p>

            <h2>
              {localText(
                  language,
                  "Patientenantworten",
                  "Patient answers",
              )}
            </h2>
          </div>
        </div>

        {answerGroups.length === 0 ? (
            <p className="muted">
              {localText(
                  language,
                  "Für diesen Fall wurden keine Antworten gefunden.",
                  "No answers were found for this case.",
              )}
            </p>
        ) : (
            <div className="answer-group-list">
              {answerGroups.map((group) => (
                  <article className="answer-group" key={group.blockId}>
                    <h3>{group.blockTitle}</h3>

                    <div className="answer-list">
                      {group.answers.map((answer, index) => (
                          <div
                              className="answer-row"
                              key={`${getQuestionId(answer)}-${index}`}
                          >
                            <div>
                        <span className="question-code">
                          {getQuestionId(answer)}
                        </span>

                              <p>{getQuestionText(answer)}</p>
                            </div>

                            <strong>{normalizeAnswer(answer.answer)}</strong>
                          </div>
                      ))}
                    </div>
                  </article>
              ))}
            </div>
        )}
      </section>
    </main>

    <aside className="doctor-ai-sidebar">
      <section className="doctor-ai-panel">
        <div className="doctor-section-heading">
          <div>
            <p className="eyebrow">
              {localText(language, "KI-Entwurf", "AI draft")}
            </p>

            <h2>{localText(language, "Arztbrief", "Doctor letter")}</h2>
          </div>
        </div>

        <p className="report-helper">
          {localText(
              language,
              "Der Entwurf kann direkt im Dokument bearbeitet werden. Änderungen werden beim Speichern übernommen.",
              "The draft can be edited directly inside the document. Changes are saved when you click Save.",
          )}
        </p>

        <div className="doctor-letter-actions">
          <button
              className="primary-button"
              disabled={isGenerating}
              type="button"
              onClick={handleGenerateReport}
          >
            {isGenerating
                ? localText(language, "Wird erstellt…", "Generating…")
                : localText(
                    language,
                    "KI-Entwurf erstellen",
                    "Generate AI draft",
                )}
          </button>

          <button
              className="secondary-button"
              disabled={isSaving || !reportText}
              type="button"
              onClick={handleSaveReport}
          >
            {isSaving
                ? localText(language, "Speichert…", "Saving…")
                : localText(language, "Speichern", "Save")}
          </button>

          <button
              className="secondary-button"
              disabled={!reportText}
              type="button"
              onClick={handleExportPdf}
          >
            {localText(language, "Als PDF exportieren", "Export as PDF")}
          </button>
        </div>

        <div className="doctor-letter-scroll">
          <EditableReportTemplate
              text={reportText}
              language={language}
              onChange={setReportText}
          />
        </div>
      </section>
    </aside>
  </section>

  <section className="doctor-print-document">
    <header className="doctor-print-header">
      <div>
        <p>KLINEUS</p>
        <h1>Ärztlicher Dokumentationsentwurf</h1>
      </div>

      <div className="doctor-print-case-meta">
        <span>Fall-ID</span>
        <strong>{patientCase?.case_id || caseId}</strong>
      </div>
    </header>

    <div className="doctor-print-submeta">
      <span>{indicationLabel(patientCase?.indication)}</span>
      <span>{formatDate(patientCase?.created_at, language)}</span>
    </div>

    <main className="doctor-print-body">
      <EditableReportTemplate
          text={reportText}
          language={language}
          onChange={setReportText}
      />
    </main>
  </section>
</div>
    </AppShell>
  );
}