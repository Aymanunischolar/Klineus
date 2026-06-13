import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

import AppShell from "../components/AppShell.jsx";
import QuestionInput from "../components/QuestionInput.jsx";
import { api } from "../services/api.js";
import {
  defaultAnswer,
  getQuestionnaire,
  getQuestionText,
  getQuestionsForIndication,
  getVisibleQuestions,
  isAnswerComplete,
} from "../data/questionnaire.js";
import { useLanguage } from "../i18n/LanguageContext.jsx";



const PATIENT_IDENTITY_STORAGE_KEY = "klineus_patient_identity";

function readPatientIdentity() {
  try {
    const rawValue = window.sessionStorage.getItem(
      PATIENT_IDENTITY_STORAGE_KEY,
    );

    if (!rawValue) {
      return {
        patient_name: "",
        insurance_id: "",
      };
    }

    const parsedValue = JSON.parse(rawValue);

    return {
      patient_name: parsedValue.patient_name || "",
      insurance_id: parsedValue.insurance_id || "",
    };
  } catch {
    return {
      patient_name: "",
      insurance_id: "",
    };
  }
}


function localText(language, de, en) {
  return language === "en" ? en : de;
}

function normalizeIndication(value) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/ü/g, "ue");

  if (["hip_tep", "hip", "huefte", "hufte"].includes(normalized)) {
    return "hip_tep";
  }

  return "knee_tep";
}

function serialiseAnswer(answer) {
  if (answer && typeof answer === "object" && !Array.isArray(answer)) {
    if (
      Object.prototype.hasOwnProperty.call(answer, "packs_per_day") ||
      Object.prototype.hasOwnProperty.call(answer, "smoking_years") ||
      Object.prototype.hasOwnProperty.call(answer, "stopped_since")
    ) {
      const packsPerDay = answer.packs_per_day || "";
      const smokingYears = answer.smoking_years || "";
      const stoppedSince = answer.stopped_since || "";

      const packYears =
        Number(packsPerDay) > 0 && Number(smokingYears) > 0
          ? Number(packsPerDay) * Number(smokingYears)
          : "";

      return {
        value: answer.value || "",
        packs_per_day: packsPerDay,
        smoking_years: smokingYears,
        pack_years: packYears === "" ? "" : Number(packYears.toFixed(1)),
        stopped_since: stoppedSince,
      };
    }

    if (Object.prototype.hasOwnProperty.call(answer, "value")) {
      return answer.detail ? `${answer.value}: ${answer.detail}` : answer.value;
    }

    if (
      Object.prototype.hasOwnProperty.call(answer, "height_cm") ||
      Object.prototype.hasOwnProperty.call(answer, "weight_kg")
    ) {
      return {
        height_cm: answer.height_cm || "",
        weight_kg: answer.weight_kg || "",
      };
    }
  }

  return answer;
}


export default function QuestionnairePage() {
  const navigate = useNavigate();
  const params = useParams();
  const [searchParams] = useSearchParams();
  const { language, t } = useLanguage();
  const startedAtRef = useRef(Date.now());

  const indication = normalizeIndication(
    params.indication || searchParams.get("indication"),
  );

  const questionnaire = useMemo(
    () => getQuestionnaire(indication),
    [indication],
  );

  const allQuestions = useMemo(
    () => getQuestionsForIndication(indication),
    [indication],
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [error, setError] = useState("");
  const [patientIdentity] = useState(() => readPatientIdentity());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const visibleQuestions = useMemo(
    () => getVisibleQuestions(allQuestions, answers),
    [allQuestions, answers],
  );

  useEffect(() => {
    setCurrentIndex((index) =>
      Math.min(index, Math.max(visibleQuestions.length - 1, 0)),
    );
  }, [visibleQuestions.length]);

  useEffect(() => {
    setCurrentIndex(0);
    setAnswers({});
    setError("");
    startedAtRef.current = Date.now();
  }, [indication]);

  const currentQuestion = visibleQuestions[currentIndex];

  const value = currentQuestion
    ? answers[currentQuestion.id] ?? defaultAnswer(currentQuestion)
    : "";

  const isLastQuestion = currentIndex === visibleQuestions.length - 1;

  const progress = visibleQuestions.length
    ? Math.round(((currentIndex + 1) / visibleQuestions.length) * 100)
    : 0;

  function updateAnswer(nextValue) {
    if (!currentQuestion) return;

    setAnswers((previous) => ({
      ...previous,
      [currentQuestion.id]: nextValue,
    }));

    setError("");
  }

  function buildPayload(nextAnswers) {
    return visibleQuestions.map((question) => ({
      question_id: question.id,

      /*
        Doctor dashboard rule:
        Always send the German source question and block title.
        The English language mode only changes what the patient sees.
      */
      question: getQuestionText(question, "de"),
      question_displayed:
        language === "en" ? getQuestionText(question, "en") : undefined,

      answer: serialiseAnswer(
        nextAnswers[question.id] ?? defaultAnswer(question),
      ),

      block_id: question.blockId,
      block_title: question.blockLabels?.de || question.blockTitle,
      block_title_displayed:
        language === "en" ? question.blockLabels?.en : undefined,

      pii_category: question.piiCategory || "none",
      include_in_ai: question.includeInAi !== false,
    }));
  }

async function submitQuestionnaire(nextAnswers) {
  setError("");

  if (!patientIdentity.patient_name || !patientIdentity.insurance_id) {
    setError(
      localText(
        language,
        "Patientenname oder Versicherungsnummer fehlen. Bitte starten Sie den Fragebogen erneut über die Startseite.",
        "Patient name or insurance ID is missing. Please restart the questionnaire from the start page.",
      ),
    );

    return;
  }

  setIsSubmitting(true);

  const payloadAnswers = buildPayload(nextAnswers);
  const navigationEntry = performance.getEntriesByType("navigation")[0];

  const metadata = {
    language,
    fill_duration_seconds: Math.max(
      1,
      Math.round((Date.now() - startedAtRef.current) / 1000),
    ),
    page_load_ms: navigationEntry
      ? Math.round(navigationEntry.duration)
      : undefined,
    question_count: visibleQuestions.length,
    user_agent_family: navigator.userAgent.includes("Mobile")
      ? "mobile"
      : "desktop",
  };

  try {
    const createdCase = await api.createPatientCase(
      payloadAnswers,
      metadata,
      indication,
      {
        patient_name: patientIdentity.patient_name,
        insurance_id: patientIdentity.insurance_id,
        questionnaire_template_id: questionnaire.id,
        questionnaire_version: questionnaire.version,
      },
    );

   window.sessionStorage.removeItem(PATIENT_IDENTITY_STORAGE_KEY);

if (createdCase?.case_id) {
  navigate(`/patient/done/${createdCase.case_id}`);
} else {
  navigate("/patient/done");
}
  } catch (submitError) {
    setError(
      submitError?.message ||
        localText(
          language,
          "Der Fragebogen konnte nicht übermittelt werden.",
          "The questionnaire could not be submitted.",
        ),
    );
  } finally {
    setIsSubmitting(false);
  }
}
  async function handleForward() {
    if (!currentQuestion) return;

    const nextAnswers = {
      ...answers,
      [currentQuestion.id]: value,
    };

    if (!isAnswerComplete(currentQuestion, value)) {
      setError(
        t("answerRequired") ||
          localText(
            language,
            "Bitte beantworten Sie diese Frage.",
            "Please answer this question.",
          ),
      );
      return;
    }

    setAnswers(nextAnswers);

    if (isLastQuestion) {
      await submitQuestionnaire(nextAnswers);
      return;
    }

    setCurrentIndex((index) => index + 1);
    setError("");
  }

  function handleBack() {
    setCurrentIndex((index) => Math.max(index - 1, 0));
    setError("");
  }

 function handleCancel() {
  window.sessionStorage.removeItem(PATIENT_IDENTITY_STORAGE_KEY);
  navigate("/patient/start");
}
  if (!currentQuestion) {
    return (
      <AppShell compact>
        <section className="questionnaire-card questionnaire-card-pro">
          <p className="form-error">
            {localText(
              language,
              "Der Fragebogen konnte nicht geladen werden.",
              "The questionnaire could not be loaded.",
            )}
          </p>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell compact>
      <section className="questionnaire-card questionnaire-card-pro">
        <div className="questionnaire-progress-panel">
          <div className="questionnaire-progress-topline">
            <div>
              <p className="questionnaire-progress-kicker">
                {questionnaire.labels?.[language] ||
                  questionnaire.labels?.de ||
                  localText(language, "Fragebogen", "Questionnaire")}
              </p>

              <strong>
                {currentQuestion.blockLabels?.[language] ||
                  currentQuestion.blockLabels?.de ||
                  currentQuestion.blockTitle}
              </strong>
            </div>

            <span>
              {localText(language, "Schritt", "Step")} {currentIndex + 1}{" "}
              {localText(language, "von", "of")} {visibleQuestions.length}
            </span>
          </div>

          <div
            aria-label={localText(language, "Fortschritt", "Progress")}
            aria-valuemax="100"
            aria-valuemin="0"
            aria-valuenow={progress}
            className="questionnaire-progress-track-pro"
            role="progressbar"
          >
            <div
              className="questionnaire-progress-fill-pro"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="questionnaire-progress-footer">
            <span>{progress}%</span>
            <span>
              {localText(
                language,
                "Eine Frage pro Bildschirm",
                "One question per screen",
              )}
            </span>
          </div>
        </div>

        <div className="questionnaire-question-shell">
          <p className="question-id">{currentQuestion.id}</p>

          <h1>{getQuestionText(currentQuestion, language)}</h1>

          {currentQuestion.helpText?.[language] ||
          currentQuestion.helpText?.de ? (
            <p className="question-help-text">
              {currentQuestion.helpText?.[language] ||
                currentQuestion.helpText?.de}
            </p>
          ) : null}

          <QuestionInput
            language={language}
            question={currentQuestion}
            value={value}
            onChange={updateAnswer}
          />
        </div>

        {error ? <p className="form-error">{error}</p> : null}

        <div className="question-nav question-nav-pro">
          <button
            className="secondary-button"
            disabled={currentIndex === 0 || isSubmitting}
            type="button"
            onClick={handleBack}
          >
            {t("back") || localText(language, "Zurück", "Back")}
          </button>

          <button
            className="secondary-button questionnaire-cancel-button"
            disabled={isSubmitting}
            type="button"
            onClick={handleCancel}
          >
            {localText(language, "Abbrechen", "Cancel")}
          </button>

          <button
            className="primary-button"
            disabled={isSubmitting}
            type="button"
            onClick={handleForward}
          >
            {isSubmitting
              ? localText(language, "Wird gesendet…", "Submitting…")
              : isLastQuestion
                ? t("submit") || localText(language, "Absenden", "Submit")
                : t("next") || localText(language, "Weiter", "Next")}
          </button>
        </div>
      </section>
    </AppShell>
  );
}