import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import AppShell from "../components/AppShell.jsx";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { api } from "../services/api.js";
import { normalizeGermanText } from "../utils/germanText.js";

const FALLBACK_PATIENT_VALUE = "not-provided";
const FALLBACK_PATIENT_EMAIL = "not-provided@klineus.local";

function localText(language, de, en) {
  return language === "en" ? en : de;
}

function cleanText(value) {
  return normalizeGermanText(value);
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

function patientDisplayName(patientCase) {
  const fullName = cleanPatientValue(patientCase?.patient_name);
  const lastName = cleanPatientValue(patientCase?.patient_last_name);

  if (fullName) {
    return fullName;
  }

  if (lastName) {
    return lastName;
  }

  return "-";
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

function getQuestionText(answer) {
  const text =
    answer.question ||
    answer.question_de ||
    answer.question_text_de ||
    answer.question_text ||
    answer.label_de ||
    answer.label ||
    answer.text_de ||
    answer.text ||
    "";

  return cleanText(text) || "Frage";
}

function getQuestionId(answer) {
  return answer.question_id || answer.id || crypto.randomUUID();
}

function getBlockId(answer) {
  return answer.block_id || answer.blockId || "answers";
}

function groupAnswers(answers) {
  const groups = [];

  answers.forEach((answer) => {
    const blockId = getBlockId(answer);
    let group = groups.find((item) => item.blockId === blockId);

    if (!group) {
      group = {
        blockId,
        answers: [],
      };

      groups.push(group);
    }

    group.answers.push(answer);
  });

  return groups;
}

function normalizeAnswerGroups(patientCase) {
  const backendGroups = Array.isArray(patientCase?.answer_groups)
    ? patientCase.answer_groups
    : [];

  if (backendGroups.length > 0) {
    return backendGroups.map((group, index) => ({
      blockId: group.blockId || group.block_id || `group-${index}`,
      answers: Array.isArray(group.answers) ? group.answers : [],
    }));
  }

  const rawAnswers = Array.isArray(patientCase?.answers)
    ? patientCase.answers
    : [];

  return groupAnswers(rawAnswers);
}

function normalizeAnswer(answer) {
  if (answer === null || answer === undefined || answer === "") {
    return "Keine Angabe";
  }

  if (Array.isArray(answer)) {
    return answer.length ? answer.map(cleanText).join(", ") : "Keine Angabe";
  }

  if (typeof answer === "object") {
    if (
      Object.prototype.hasOwnProperty.call(answer, "packs_per_day") ||
      Object.prototype.hasOwnProperty.call(answer, "smoking_years") ||
      Object.prototype.hasOwnProperty.call(answer, "stopped_since")
    ) {
      const parts = [];

      if (answer.value) {
        parts.push(cleanText(answer.value));
      }

      if (answer.packs_per_day) {
        parts.push(`${answer.packs_per_day} Packungen/Tag`);
      }

      if (answer.smoking_years) {
        parts.push(`${answer.smoking_years} Jahre`);
      }

      if (answer.stopped_since) {
        parts.push(`Rauchstopp seit: ${answer.stopped_since}`);
      }

      return parts.length ? parts.join(" · ") : "Keine Angabe";
    }

    if (
      Object.prototype.hasOwnProperty.call(answer, "height_cm") ||
      Object.prototype.hasOwnProperty.call(answer, "weight_kg")
    ) {
      return `Größe: ${answer.height_cm || "-"} cm, Gewicht: ${
        answer.weight_kg || "-"
      } kg`;
    }

    if (Object.prototype.hasOwnProperty.call(answer, "value")) {
      const main = cleanText(answer.value) || "Keine Angabe";
      return answer.detail ? `${main}: ${cleanText(answer.detail)}` : main;
    }

    return JSON.stringify(answer, null, 2);
  }

  return cleanText(answer);
}

function extractReportText(data) {
  if (!data) {
    return "";
  }

  if (typeof data === "string") {
    return cleanText(data);
  }

  return cleanText(
    data.report_text ||
      data.report ||
      data.markdown ||
      data.content ||
      data.ai_report ||
      data.report_json?.markdown ||
      data.report_json?.report_text ||
      "",
  );
}

function extractFlags(patientCase) {
  const reportJson = patientCase?.report_json || {};

  const possibleFlags =
    patientCase?.documentation_flags ||
    patientCase?.flags ||
    patientCase?.risk_flags ||
    patientCase?.ai_flags ||
    reportJson.documentation_flags ||
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

function trafficLightClass(trafficLight) {
  const level = String(trafficLight?.level || "").toLowerCase();

  if (level === "red") {
    return "traffic-light-card traffic-light-red";
  }

  if (level === "orange") {
    return "traffic-light-card traffic-light-orange";
  }

  return "traffic-light-card traffic-light-green";
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
  const cleanContent = cleanText(nextContent)
    .replace(/\n+/g, " ")
    .trim();

  const nextLines = [...lines];
  nextLines[index] = prefix ? `${prefix}${cleanContent}` : cleanContent;

  onChange(nextLines.join("\n"));
}

  return (
    <article className="doctor-report-preview doctor-report-preview-editable">
      {lines.map((line, index) => {
        const trimmedLine = cleanText(line);

        if (!trimmedLine) {
          return <div className="doctor-report-spacer" key={index} />;
        }

        if (
          trimmedLine.includes("KI-generierter Entwurf") ||
          trimmedLine.includes("Ärztliche Prüfung") ||
          trimmedLine.includes("ärztliche Entscheidung") ||
          trimmedLine.includes("AI-generated draft") ||
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
    () => normalizeAnswerGroups(patientCase),
    [patientCase],
  );

  const allAnswers = useMemo(
    () => answerGroups.flatMap((group) => group.answers || []),
    [answerGroups],
  );

  const answerCount = allAnswers.length;
  const flags = useMemo(() => extractFlags(patientCase), [patientCase]);
  const trafficLight = patientCase?.traffic_light || null;

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
                "Fragen und Antworten werden für die ärztliche Prüfung angezeigt.",
                "Questions and answers are shown for physician review.",
              )}
            </p>
          </div>
        </section>

        {trafficLight ? (
          <section className={trafficLightClass(trafficLight)}>
            <div>
              <p className="eyebrow">
                {localText(language, "Einschätzung", "Assessment")}
              </p>

              <h2>{cleanText(trafficLight.label)}</h2>
            </div>

            <p>{cleanText(trafficLight.description)}</p>
          </section>
        ) : null}

        <section className="case-summary-grid">
          <article className="case-summary-card">
            <span>{localText(language, "Patient", "Patient")}</span>
            <strong>{patientDisplayName(patientCase)}</strong>
          </article>

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
            <strong>{cleanText(patientCase?.status) || "-"}</strong>
          </article>

          <article className="case-summary-card">
            <span>{localText(language, "Antworten", "Answers")}</span>
            <strong>{answerCount}</strong>
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
                        {cleanText(
                          flag.title ||
                            flag.label ||
                            flag.message ||
                            localText(language, "Hinweis", "Note"),
                        )}
                      </strong>

                      {flag.description || flag.text || flag.reason ? (
                        <p>
                          {cleanText(
                            flag.description || flag.text || flag.reason,
                          )}
                        </p>
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

              {allAnswers.length === 0 ? (
                <p className="muted">
                  {localText(
                    language,
                    "Für diesen Fall wurden keine Antworten gefunden.",
                    "No answers were found for this case.",
                  )}
                </p>
              ) : (
                <div className="answer-list">
                  {allAnswers.map((answer, index) => (
                    <div
                      className="answer-row"
                      key={`${getQuestionId(answer)}-${index}`}
                    >
                      <div>
                        <p>{getQuestionText(answer)}</p>
                      </div>

                      <strong>{normalizeAnswer(answer.answer)}</strong>
                    </div>
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

          <div className="doctor-print-patient-grid">
            <div>
              <span>Patient</span>
              <strong>{patientDisplayName(patientCase)}</strong>
            </div>

            <div>
              <span>Indikation</span>
              <strong>{indicationLabel(patientCase?.indication)}</strong>
            </div>

            <div>
              <span>Erstellt</span>
              <strong>{formatDate(patientCase?.created_at, language)}</strong>
            </div>
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