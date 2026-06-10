import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

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

function localText(language, de, en) {
  return language === "en" ? en : de;
}

function serialiseAnswer(answer) {
  if (answer && typeof answer === "object" && !Array.isArray(answer)) {
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
  const [searchParams] = useSearchParams();
  const { language, t } = useLanguage();
  const startedAtRef = useRef(Date.now());

  const indication =
    searchParams.get("indication") === "hip_tep" ? "hip_tep" : "knee_tep";

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
        IMPORTANT:
        The doctor dashboard receives the German source wording.
        The English toggle only changes what the patient sees.
      */
      question: getQuestionText(question, "de"),
      question_displayed:
        language === "en" ? getQuestionText(question, "en") : undefined,

      answer: serialiseAnswer(nextAnswers[question.id] ?? defaultAnswer(question)),

      block_id: question.blockId,
      block_title: question.blockLabels?.de || question.blockTitle,
      block_title_displayed:
        language === "en" ? question.blockLabels?.en : undefined,

      pii_category: question.piiCategory || "none",
      include_in_ai: question.includeInAi !== false,
    }));
  }

  async function submitQuestionnaire(nextAnswers) {
    setIsSubmitting(true);
    setError("");

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
      await api.createPatientCase(
        buildPayload(nextAnswers),
        metadata,
        indication,
        {
          questionnaire_template_id: questionnaire.id,
          questionnaire_version: questionnaire.version,
        },
      );

      navigate("/patient/done");
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
          localText(language, "Bitte beantworten Sie diese Frage.", "Please answer this question."),
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
                {questionnaire.labels?.[language] || questionnaire.labels?.de}
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