import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import AppShell from "../components/AppShell.jsx";
import LanguageToggle from "../components/LanguageToggle.jsx";
import TrafficLight from "../components/TrafficLight.jsx";
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

// ---------------------------------------------------------------------------
// Rich text formatting for the Arztbrief editor
//
// report_text is stored as a single string, shared verbatim between the
// on-screen editor and the printed/PDF view (see EditableReportTemplate
// below, used for both). To support bold/italic/underline/color without
// changing that storage shape, each line's content is HTML rather than
// plain text once it enters the editor. Freshly generated text from the
// backend is always plain, so it's HTML-escaped before display (a literal
// "<" from a patient's free-text answer must never be read as markup).
// Anything that has previously been through this editor and saved is
// already sanitized HTML, so it's used as-is (not re-escaped, or the
// formatting tags themselves would show up as literal text).
// ---------------------------------------------------------------------------

const RICH_TEXT_INLINE_TAGS = new Set(["B", "STRONG", "I", "EM", "U"]);
const SAFE_CSS_COLOR =
  /^(#[0-9a-fA-F]{3}|#[0-9a-fA-F]{4}|#[0-9a-fA-F]{6}|#[0-9a-fA-F]{8}|rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)|rgba\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*(0|1|0?\.\d+)\s*\))$/;

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// execCommand doesn't reliably express bold/italic/underline the same way
// on every selection — a plain paragraph gets <b>/<i>/<u>, but toggling
// bold on a heading (already bold via its own CSS) can instead add
// "font-weight: normal" as an inline style on whatever element already
// wraps the selection. Rather than rely on a particular DOM shape, the
// sanitizer recognizes this fixed, narrow set of formatting styles
// wherever they appear and rebuilds a clean style string from scratch —
// anything else in the original style (backgrounds, urls, ...) is dropped.
function sanitizeFormattingStyle(styleValue) {
  const style = styleValue || "";
  const parts = [];

  const colorMatch = /(?:^|;)\s*color\s*:\s*([^;]+)/i.exec(style);
  if (colorMatch && SAFE_CSS_COLOR.test(colorMatch[1].trim())) {
    parts.push(`color: ${colorMatch[1].trim()}`);
  }

  const weightMatch = /(?:^|;)\s*font-weight\s*:\s*([^;]+)/i.exec(style);
  if (weightMatch) {
    const weight = weightMatch[1].trim().toLowerCase();
    if (weight === "bold" || weight === "700") {
      parts.push("font-weight: bold");
    } else if (weight === "normal" || weight === "400") {
      parts.push("font-weight: normal");
    }
  }

  const italicMatch = /(?:^|;)\s*font-style\s*:\s*([^;]+)/i.exec(style);
  if (italicMatch) {
    const value = italicMatch[1].trim().toLowerCase();
    if (value === "italic" || value === "normal") {
      parts.push(`font-style: ${value}`);
    }
  }

  const decorationMatch = /(?:^|;)\s*text-decoration(?:-line)?\s*:\s*([^;]+)/i.exec(
    style,
  );
  if (decorationMatch) {
    const value = decorationMatch[1].trim().toLowerCase();
    if (value.includes("underline")) {
      parts.push("text-decoration: underline");
    } else if (value === "none") {
      parts.push("text-decoration: none");
    }
  }

  return parts.join("; ");
}

function appendSanitizedNode(node, target) {
  if (node.nodeType === Node.TEXT_NODE) {
    target.appendChild(document.createTextNode(node.textContent));
    return;
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return;
  }

  const tagName = node.tagName;

  if (tagName === "BR") {
    target.appendChild(document.createElement("br"));
    return;
  }

  const isSpan = tagName === "SPAN";
  const isAllowedInline = RICH_TEXT_INLINE_TAGS.has(tagName);

  if (isSpan || isAllowedInline) {
    // The browser doesn't only ever wrap a fresh <span> for foreColor, and
    // toggling bold/italic/underline off can add its own inline style to
    // whatever element already wraps the selection — so formatting styles
    // are checked on every allowed tag, not only SPAN.
    const formattingStyle = sanitizeFormattingStyle(node.getAttribute("style"));

    if (isSpan && !formattingStyle) {
      // A <span> carrying none of our allowed styles is a no-op wrapper.
      Array.from(node.childNodes).forEach((child) =>
        appendSanitizedNode(child, target),
      );
      return;
    }

    const clone = document.createElement(isSpan ? "span" : tagName.toLowerCase());

    if (formattingStyle) {
      clone.setAttribute("style", formattingStyle);
    }

    Array.from(node.childNodes).forEach((child) =>
      appendSanitizedNode(child, clone),
    );
    target.appendChild(clone);
    return;
  }

  // Any other tag (script, img, a, div, style, event handlers, ...) is
  // unwrapped: its text/children survive, the tag and its attributes don't.
  Array.from(node.childNodes).forEach((child) =>
    appendSanitizedNode(child, target),
  );
}

function sanitizeRichHtml(html) {
  const template = document.createElement("template");
  template.innerHTML = String(html ?? "");

  const wrapper = document.createElement("div");

  Array.from(template.content.childNodes).forEach((child) =>
    appendSanitizedNode(child, wrapper),
  );

  return wrapper.innerHTML;
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

function caseStatusLabel(status, language) {
  const labels = {
    completed: ["Ausgefüllt", "Completed"],
    in_progress: ["In Bearbeitung", "In progress"],
    invited: ["Eingeladen", "Invited"],
    abandoned: ["Abgebrochen", "Abandoned"],
    review_done: ["Geprüft", "Reviewed"],
    closed: ["Geschlossen", "Closed"],
  };

  return labels[status]
    ? localText(language, labels[status][0], labels[status][1])
    : cleanText(status) || "-";
}

function indicationLabel(indication) {
  if (indication === "hip_tep") {
    return "Hüft-TEP";
  }

  return "Knie-TEP";
}

function patientDisplayName(patientCase) {
  const firstName = cleanPatientValue(patientCase?.patient_name);
  const lastName = cleanPatientValue(patientCase?.patient_last_name);

  if (firstName && lastName && firstName !== lastName) {
    return `${firstName} ${lastName}`;
  }

  if (firstName) {
    return firstName;
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

function extractReportText(data, { alreadyRich = false } = {}) {
  if (!data) {
    return "";
  }

  const raw =
    typeof data === "string"
      ? data
      : data.report_text ||
        data.report ||
        data.markdown ||
        data.content ||
        data.ai_report ||
        data.report_json?.markdown ||
        data.report_json?.report_text ||
        "";

  const cleaned = cleanText(raw);

  // Text fresh from the backend is always plain (build_arztbrief never emits
  // HTML), so it must be escaped before it's treated as editor HTML. Text
  // that has already been through this editor and saved (report_status ===
  // "edited") is already sanitized HTML and must NOT be re-escaped, or its
  // own formatting tags would show up as literal text.
  return alreadyRich ? cleaned : escapeHtml(cleaned);
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
            "Erstellen Sie den Arztbrief. Danach kann der Text direkt im Dokument bearbeitet und gespeichert werden.",
            "Generate the doctor letter. Afterwards, the text can be edited directly inside the document and saved.",
          )}
        </p>
      </div>
    );
  }

  const lines = text.split("\n");

  function updateLine(index, nextContentHtml, prefix = "") {
    const sanitized = sanitizeRichHtml(cleanText(nextContentHtml))
      .replace(/\n+/g, " ")
      .trim();

    const nextLines = [...lines];
    nextLines[index] = prefix ? `${prefix}${sanitized}` : sanitized;

    onChange(nextLines.join("\n"));
  }

  function handleFieldKeyDown(event) {
    // Each line is its own single-line contentEditable field — block Enter
    // instead of letting the browser insert a nested block element, which
    // the sanitizer would otherwise have to unwrap on the next blur.
    if (event.key === "Enter") {
      event.preventDefault();
      event.currentTarget.blur();
    }
  }

  function handleFieldPaste(event) {
    event.preventDefault();

    const clipboard = event.clipboardData;
    const html = clipboard?.getData("text/html") || "";
    const plain = clipboard?.getData("text/plain") || "";
    const sanitizedHtml = html ? sanitizeRichHtml(html) : "";
    const hasSanitizedText = sanitizedHtml.replace(/<[^>]*>/g, "").trim();
    const safeHtml = hasSanitizedText ? sanitizedHtml : escapeHtml(plain);

    document.execCommand("insertHTML", false, safeHtml);
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
          trimmedLine.includes("physician") ||
          trimmedLine.includes("keine Diagnose") ||
          trimmedLine.includes("ersetzt keine") ||
          trimmedLine.includes("geprüft, bearbeitet und freigegeben") ||
          trimmedLine.includes("Freigabe erforderlich")
        ) {
          return null;
        }

        if (trimmedLine.startsWith("# ")) {
          return (
            <h1
              className="editable-report-field"
              contentEditable
              suppressContentEditableWarning
              spellCheck="true"
              key={index}
              onKeyDown={handleFieldKeyDown}
              onPaste={handleFieldPaste}
              onBlur={(event) =>
                updateLine(index, event.currentTarget.innerHTML, "# ")
              }
              dangerouslySetInnerHTML={{ __html: trimmedLine.replace("# ", "") }}
            />
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
              onKeyDown={handleFieldKeyDown}
              onPaste={handleFieldPaste}
              onBlur={(event) =>
                updateLine(index, event.currentTarget.innerHTML, "## ")
              }
              dangerouslySetInnerHTML={{ __html: trimmedLine.replace("## ", "") }}
            />
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
              onKeyDown={handleFieldKeyDown}
              onPaste={handleFieldPaste}
              onBlur={(event) =>
                updateLine(index, event.currentTarget.innerHTML, "### ")
              }
              dangerouslySetInnerHTML={{ __html: trimmedLine.replace("### ", "") }}
            />
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
                onKeyDown={handleFieldKeyDown}
                onPaste={handleFieldPaste}
                onBlur={(event) =>
                  updateLine(index, event.currentTarget.innerHTML, "- ")
                }
                dangerouslySetInnerHTML={{ __html: trimmedLine.replace("- ", "") }}
              />
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
            onKeyDown={handleFieldKeyDown}
            onPaste={handleFieldPaste}
            onBlur={(event) =>
              updateLine(index, event.currentTarget.innerHTML)
            }
            dangerouslySetInnerHTML={{ __html: trimmedLine }}
          />
        );
      })}
    </article>
  );
}

const LETTER_FORMAT_COLORS = [
  { value: "#102033", de: "Standard", en: "Default" },
  { value: "#b42318", de: "Rot", en: "Red" },
  { value: "#b45309", de: "Orange", en: "Orange" },
  { value: "#0d7f8c", de: "Türkis", en: "Turquoise" },
  { value: "#0a376d", de: "Dunkelblau", en: "Dark blue" },
];

function isFormattableField(element) {
  return Boolean(element?.classList?.contains("editable-report-field"));
}

function readActiveFormats() {
  return {
    bold: document.queryCommandState("bold"),
    italic: document.queryCommandState("italic"),
    underline: document.queryCommandState("underline"),
  };
}

function LetterFormatToolbar({ disabled, language }) {
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
  });

  useEffect(() => {
    function handleSelectionChange() {
      if (!isFormattableField(document.activeElement)) {
        return;
      }

      setActiveFormats(readActiveFormats());
    }

    document.addEventListener("selectionchange", handleSelectionChange);

    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
    };
  }, []);

  function applyCommand(command, value = null) {
    if (!isFormattableField(document.activeElement)) {
      return;
    }

    // Only foreColor needs CSS-based output (a <span style="color:...">,
    // matched by the sanitizer's SPAN handling). Leaving styleWithCSS on for
    // bold/italic/underline makes browsers emit <span style="font-weight:
    // bold"> etc. instead of <strong>/<em>/<u>, which the sanitizer doesn't
    // recognize and would strip on save.
    document.execCommand("styleWithCSS", false, command === "foreColor");
    document.execCommand(command, false, value);

    setActiveFormats(readActiveFormats());
  }

  return (
    <div
      className="doctor-letter-toolbar"
      role="toolbar"
      aria-label={localText(language, "Textformatierung", "Text formatting")}
    >
      <button
        type="button"
        className={`doctor-format-button${activeFormats.bold ? " active" : ""}`}
        aria-pressed={activeFormats.bold}
        disabled={disabled}
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => applyCommand("bold")}
        title={localText(language, "Fett", "Bold")}
      >
        <strong>F</strong>
      </button>

      <button
        type="button"
        className={`doctor-format-button${activeFormats.italic ? " active" : ""}`}
        aria-pressed={activeFormats.italic}
        disabled={disabled}
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => applyCommand("italic")}
        title={localText(language, "Kursiv", "Italic")}
      >
        <em>K</em>
      </button>

      <button
        type="button"
        className={`doctor-format-button${activeFormats.underline ? " active" : ""}`}
        aria-pressed={activeFormats.underline}
        disabled={disabled}
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => applyCommand("underline")}
        title={localText(language, "Unterstrichen", "Underline")}
      >
        <u>U</u>
      </button>

      <span className="doctor-format-divider" aria-hidden="true" />

      <div className="doctor-format-colors">
        {LETTER_FORMAT_COLORS.map((color) => (
          <button
            key={color.value}
            type="button"
            className="doctor-format-swatch"
            style={{ backgroundColor: color.value }}
            disabled={disabled}
            title={localText(language, color.de, color.en)}
            aria-label={localText(language, color.de, color.en)}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => applyCommand("foreColor", color.value)}
          />
        ))}
      </div>

      <span className="doctor-format-divider" aria-hidden="true" />

      <button
        type="button"
        className="doctor-format-button doctor-format-clear"
        disabled={disabled}
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => applyCommand("removeFormat")}
        title={localText(language, "Formatierung entfernen", "Clear formatting")}
      >
        ⨯
      </button>
    </div>
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
        setReportText(
          extractReportText(data, {
            alreadyRich: data?.report_status === "edited",
          }),
        );
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
      // A fresh generation always comes back as plain text from the
      // backend, even if the case had prior (now discarded) edits.
      const nextReport = extractReportText(result, { alreadyRich: false });

      setReportText(nextReport);

      setPatientCase((previous) => ({
        ...(previous || {}),
        ...(result || {}),
        report_text: nextReport,
      }));

      setNotice(
        localText(
          language,
          "Der Arztbrief wurde vorausgefüllt. Bitte ärztlich prüfen und ergänzen.",
          "The doctor letter was pre-filled. Please review and complete it medically.",
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
          "Bitte erstellen Sie zuerst den Arztbrief.",
          "Please generate the doctor letter first.",
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
      <AppShell compact hideNav>
        <p className="muted">
          {localText(language, "Fall wird geladen…", "Loading case…")}
        </p>
      </AppShell>
    );
  }

  if (error && !patientCase) {
    return (
      <AppShell compact hideNav>
        <Link className="text-link case-back-link" to="/doctor/dashboard">
          ← {localText(language, "Zurück zum Dashboard", "Back to dashboard")}
        </Link>

        <p className="form-error">{error}</p>
      </AppShell>
    );
  }

  return (
    <AppShell compact hideNav>
      <div className="doctor-case-language-only">
        <LanguageToggle />
      </div>

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
              {patientDisplayName(patientCase) !== "-"
                ? patientDisplayName(patientCase)
                : localText(language, "Auswertung", "Evaluation")}
              {caseId ? (
                <small className="case-title-id">
                  {" "}
                  #{caseId.slice(0, 8)}
                </small>
              ) : null}
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
          <section
            className={trafficLightClass(trafficLight)}
            role="status"
          >
            <div className="traffic-light-banner-head">
              <p className="eyebrow">
                {localText(language, "Einschätzung", "Assessment")}
              </p>

              <TrafficLight level={trafficLight.level} />
            </div>

            <h2>{cleanText(trafficLight.label)}</h2>

            <p>{cleanText(trafficLight.description)}</p>
          </section>
        ) : null}

        <section className="case-summary-grid">
          <article className="case-summary-card">
            <span>{localText(language, "Patient", "Patient")}</span>
            <strong>{patientDisplayName(patientCase)}</strong>
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
            <strong>{caseStatusLabel(patientCase?.status, language)}</strong>
          </article>

          <article className="case-summary-card">
            <span>{localText(language, "Antworten", "Answers")}</span>
            <strong>{answerCount}</strong>
          </article>
        </section>

        {error ? <p className="form-error">{error}</p> : null}
        {notice ? <p className="form-notice">{notice}</p> : null}

        <section className="doctor-workspace-grid">
          <aside className="doctor-notes-column">
            <section className="doctor-notes-panel-left">
              <div className="doctor-section-heading">
                <div>
                  <p className="eyebrow">
                    {localText(language, "Risikohinweise", "Risk notices")}
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

              <div className="doctor-notes-scroll">
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
              </div>
            </section>
          </aside>

          <main className="doctor-letter-column">
            <section className="doctor-ai-panel">
              <div className="doctor-section-heading">
                <div>
                  <p className="eyebrow">
                    {localText(language, "Vorausgefüllt", "Pre-filled")}
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
                        "Arztbrief erstellen",
                        "Generate doctor letter",
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

              <LetterFormatToolbar disabled={!reportText} language={language} />

              <div className="doctor-letter-scroll">
                <EditableReportTemplate
                  text={reportText}
                  language={language}
                  onChange={setReportText}
                />
              </div>
            </section>
          </main>

          <aside className="doctor-answers-column">
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

              <div className="doctor-answers-scroll">
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
              </div>
            </section>
          </aside>
        </section>

        <section className="doctor-print-document">
          <header className="doctor-print-header">
            <div>
              <p>KLINEUS</p>
              <h1>Arztbrief</h1>
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
              <span>Versicherungsnummer</span>
              <strong>{cleanPatientValue(patientCase?.insurance_id) || "-"}</strong>
            </div>

            <div>
              <span>E-Mail</span>
              <strong>
                {cleanPatientValue(patientCase?.patient_email, {
                  isEmail: true,
                }) || "-"}
              </strong>
            </div>

            <div>
              <span>Indikation</span>
              <strong>{indicationLabel(patientCase?.indication)}</strong>
            </div>

            <div>
              <span>Erstellt</span>
              <strong>{formatDate(patientCase?.created_at, language)}</strong>
            </div>

            <div>
              <span>Arzt / Ärztin</span>
              <strong>________________________</strong>
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