import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import AppShell from "../components/AppShell.jsx";
import QuestionInput from "../components/QuestionInput.jsx";
import { api } from "../services/api.js";
import {
  defaultAnswer,
  getBlockTitle,
  getQuestionText,
  isAnswerComplete,
  kneeTepQuestions,
  normalizeAdminQuestion,
} from "../data/questionnaire.js";
import { useLanguage } from "../i18n/LanguageContext.jsx";

export default function QuestionnairePage() {
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const startedAtRef = useRef(Date.now());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [extraQuestions, setExtraQuestions] = useState([]);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;
    api
      .getQuestionnaireConfig()
      .then((config) => {
        if (mounted) {
          setExtraQuestions((config.extra_questions || []).map(normalizeAdminQuestion));
        }
      })
      .catch(() => {
        if (mounted) {
          setExtraQuestions([]);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const questions = useMemo(() => [...kneeTepQuestions, ...extraQuestions], [extraQuestions]);
  const currentQuestion = questions[currentIndex];
  const value = answers[currentQuestion.id] ?? defaultAnswer(currentQuestion);
  const progress = useMemo(
    () => Math.round(((currentIndex + 1) / questions.length) * 100),
    [currentIndex, questions.length]
  );
  const isLastQuestion = currentIndex === questions.length - 1;

  function updateAnswer(nextValue) {
    setAnswers((previous) => ({ ...previous, [currentQuestion.id]: nextValue }));
    setError("");
  }

  function buildPayload(nextAnswers) {
    return questions.map((question) => ({
      question_id: question.id,
      question: question.labels?.de || question.text,
      answer: nextAnswers[question.id] ?? defaultAnswer(question),
      block_id: question.blockId,
      block_title: question.blockLabels?.de || question.blockTitle,
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
      fill_duration_seconds: Math.max(1, Math.round((Date.now() - startedAtRef.current) / 1000)),
      page_load_ms: navigationEntry ? Math.round(navigationEntry.duration) : undefined,
      question_count: questions.length,
      user_agent_family: navigator.userAgent.includes("Mobile") ? "mobile" : "desktop",
    };
    try {
      await api.createPatientCase(buildPayload(nextAnswers), metadata);
      navigate("/patient/done");
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleForward() {
    const nextAnswers = { ...answers, [currentQuestion.id]: value };
    if (!isAnswerComplete(currentQuestion, value)) {
      setError(t("answerRequired"));
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

  return (
    <AppShell compact>
      <section className="questionnaire-card">
        <div className="progress-header">
          <span>
            {currentQuestion.blockLabels?.[language] ||
              currentQuestion.blockLabels?.de ||
              getBlockTitle(currentQuestion.blockId, language)}
          </span>
          <span>
            {currentIndex + 1} / {questions.length}
          </span>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>

        <p className="question-id">{currentQuestion.id}</p>
        <h1>{getQuestionText(currentQuestion, language)}</h1>

        <QuestionInput question={currentQuestion} value={value} onChange={updateAnswer} />

        {error ? <p className="form-error">{error}</p> : null}

        <div className="question-nav">
          <button
            className="secondary-button"
            disabled={currentIndex === 0 || isSubmitting}
            type="button"
            onClick={() => {
              setCurrentIndex((index) => Math.max(index - 1, 0));
              setError("");
            }}
          >
            {t("back")}
          </button>
          <button className="primary-button" disabled={isSubmitting} type="button" onClick={handleForward}>
            {isLastQuestion ? t("submit") : t("next")}
          </button>
        </div>
      </section>
    </AppShell>
  );
}
