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

function ReportPreview({ text, language }) {
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
            "Erstellen Sie einen KI-Entwurf. Danach kann der Text ärztlich geprüft, bearbeitet und gespeichert werden.",
            "Generate an AI draft. Afterwards, the text can be medically reviewed, edited and saved.",
          )}
        </p>
      </div>
    );
  }

  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  return (
    <article className="doctor-report-preview">
      {lines.map((line, index) => {
        const cleanLine = line.replace(/^[-*]\s*/, "");

        if (
          line.includes("AI-generated draft") ||
          line.includes("KI-generierter Entwurf") ||
          line.includes("Ärztliche Prüfung") ||
          line.includes("physician")
        ) {
          return (
            <div className="doctor-report-disclaimer" key={index}>
              {cleanLine}
            </div>
          );
        }

        if (line.startsWith("# ")) {
          return <h1 key={index}>{line.replace("# ", "")}</h1>;
        }

        if (line.startsWith("## ")) {
          return <h2 key={index}>{line.replace("## ", "")}</h2>;
        }

        if (line.startsWith("### ")) {
          return <h3 key={index}>{line.replace("### ", "")}</h3>;
        }

        if (line.startsWith("- ")) {
          return (
            <div className="doctor-report-bullet" key={index}>
              <span aria-hidden="true">•</span>
              <p>{cleanLine}</p>
            </div>
          );
        }

        return <p key={index}>{cleanLine}</p>;
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

  async function handleCopyReport() {
    if (!reportText) {
      setNotice(
        localText(
          language,
          "Es gibt noch keinen Bericht zum Kopieren.",
          "There is no report to copy yet.",
        ),
      );
      return;
    }

    try {
      await navigator.clipboard.writeText(reportText);
      setNotice(
        localText(
          language,
          "Der Bericht wurde kopiert.",
          "The report was copied.",
        ),
      );
    } catch {
      setError(
        localText(
          language,
          "Der Bericht konnte nicht kopiert werden.",
          "The report could not be copied.",
        ),
      );
    }
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
                  "Dieser Text ist ein Entwurf und muss ärztlich geprüft und freigegeben werden.",
                  "This text is a draft and must be medically reviewed and approved.",
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
                  onClick={handleCopyReport}
                >
                  {localText(language, "Kopieren", "Copy")}
                </button>
              </div>

              <div className="doctor-letter-scroll">
                <ReportPreview text={reportText} language={language} />
              </div>

              <details className="doctor-letter-editor">
                <summary>
                  {localText(language, "Rohtext bearbeiten", "Edit raw text")}
                </summary>

                <textarea
                  className="report-textarea"
                  placeholder={localText(
                    language,
                    "Noch kein Bericht erstellt.",
                    "No report generated yet.",
                  )}
                  value={reportText}
                  onChange={(event) => setReportText(event.target.value)}
                />
              </details>
            </section>
          </aside>
        </section>
      </div>
    </AppShell>
  );
}