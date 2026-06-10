import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import AppShell from "../components/AppShell.jsx";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { api } from "../services/api.js";


const copy = {
  de: {
    loading: "Fragebogen wird geladen ...",
    errorTitle: "Fragebogen konnte nicht geladen werden",
    retry: "Erneut versuchen",
    backToSelection: "Zur Auswahl",
    patientDataEyebrow: "Patientendaten",
    patientDataTitle: "Bitte geben Sie den Patientennamen ein",
    patientNameLabel: "Patientenname",
    patientNamePlaceholder: "z. B. Max Mustermann",
    patientNameHint:
      "Der Name hilft der Ärztin oder dem Arzt, den Fall im Dashboard wiederzufinden.",
    start: "Fragebogen starten",
    previous: "Zurück",
    next: "Weiter",
    submit: "Antworten absenden",
    submitting: "Wird übermittelt ...",
    required: "Bitte beantworten Sie alle rot markierten Pflichtfragen.",
    requiredField: "Diese Frage ist erforderlich.",
    nameRequired: "Bitte geben Sie den Patientennamen ein.",
    questionProgress: "Abschnitt",
    of: "von",
    scaleLow: "keine Beschwerden",
    scaleHigh: "maximal",
    height: "Größe in cm",
    weight: "Gewicht in kg",
    noQuestions: "Dieser Fragebogen enthält noch keine Fragen.",
    disclaimer:
      "Dies ist keine Diagnose. Ihre Ärztin oder Ihr Arzt prüft alle Angaben und trifft die medizinische Entscheidung.",
  },
  en: {
    loading: "Loading questionnaire ...",
    errorTitle: "Questionnaire could not be loaded",
    retry: "Try again",
    backToSelection: "Back to selection",
    patientDataEyebrow: "Patient data",
    patientDataTitle: "Please enter the patient name",
    patientNameLabel: "Patient name",
    patientNamePlaceholder: "e.g. Max Mustermann",
    patientNameHint:
      "The name helps the doctor find the case in the dashboard.",
    start: "Start questionnaire",
    previous: "Back",
    next: "Next",
    submit: "Submit answers",
    submitting: "Submitting ...",
    required: "Please answer all required questions marked in red.",
    requiredField: "This question is required.",
    nameRequired: "Please enter the patient name.",
    questionProgress: "Section",
    of: "of",
    scaleLow: "none",
    scaleHigh: "maximum",
    height: "Height in cm",
    weight: "Weight in kg",
    noQuestions: "This questionnaire does not contain questions yet.",
    disclaimer:
      "This is not a diagnosis. Your doctor will review all information and make the medical decision.",
  },
};


function getText(value, language = "de", fallback = "") {
  if (!value) {
    return fallback;
  }

  if (typeof value === "string") {
    return value;
  }

  return value[language] || value.de || value.en || fallback;
}


function getOptionValue(option) {
  return option?.value ?? option;
}


function getOptionLabel(option, language) {
  if (!option) {
    return "";
  }

  if (typeof option === "string") {
    return option;
  }

  return getText(option.labels, language, option.value);
}


function defaultAnswer(question) {
  if (question.type === "multiple") {
    return [];
  }

  if (question.type === "slider") {
    const min = question.min ?? 0;
    const max = question.max ?? 10;

    return Math.round((min + max) / 2);
  }

  if (question.type === "number_pair") {
    return {
      height_cm: "",
      weight_kg: "",
    };
  }

  return "";
}


function isAnswerComplete(question, value) {
  if (question.required === false) {
    return true;
  }

  if (question.type === "multiple") {
    return Array.isArray(value) && value.length > 0;
  }

  if (question.type === "number_pair") {
    return Number(value?.height_cm) > 0 && Number(value?.weight_kg) > 0;
  }

  if (question.type === "slider") {
    return Number.isFinite(Number(value));
  }

  return String(value ?? "").trim().length > 0;
}


function scrollToElement(element, block = "start") {
  if (!element) {
    return;
  }

  element.scrollIntoView({
    behavior: "smooth",
    block,
  });
}


function focusFirstInput(container) {
  if (!container) {
    return;
  }

  const input = container.querySelector(
    "input, textarea, select, button"
  );

  if (input && typeof input.focus === "function") {
    input.focus({
      preventScroll: true,
    });
  }
}


function QuestionInput({
  question,
  value,
  language,
  onChange,
  text,
  invalid,
  inputRef,
}) {
  const label = getText(question.labels, language, question.id);
  const helpText = getText(question.help_text, language, "");
  const cardClassName = invalid
    ? "question-card question-card-invalid"
    : "question-card";

  const questionCardProps = {
    id: `question-${question.id}`,
    className: cardClassName,
    ref: inputRef,
    "data-question-id": question.id,
  };

  if (question.type === "single") {
    return (
      <fieldset {...questionCardProps}>
        <legend>{label}</legend>

        {helpText ? <p className="question-help">{helpText}</p> : null}

        <div className="choice-list">
          {(question.options || []).map((option) => {
            const optionValue = getOptionValue(option);
            const optionLabel = getOptionLabel(option, language);
            const id = `${question.id}-${optionValue}`;

            return (
              <label className="choice-option" key={optionValue} htmlFor={id}>
                <input
                  id={id}
                  type="radio"
                  name={question.id}
                  value={optionValue}
                  checked={value === optionValue}
                  onChange={() => onChange(optionValue)}
                />
                <span>{optionLabel}</span>
              </label>
            );
          })}
        </div>

        {invalid ? (
          <p className="question-required-message">{text.requiredField}</p>
        ) : null}
      </fieldset>
    );
  }

  if (question.type === "multiple") {
    const selectedValues = Array.isArray(value) ? value : [];

    return (
      <fieldset {...questionCardProps}>
        <legend>{label}</legend>

        {helpText ? <p className="question-help">{helpText}</p> : null}

        <div className="choice-list">
          {(question.options || []).map((option) => {
            const optionValue = getOptionValue(option);
            const optionLabel = getOptionLabel(option, language);
            const id = `${question.id}-${optionValue}`;
            const checked = selectedValues.includes(optionValue);

            return (
              <label className="choice-option" key={optionValue} htmlFor={id}>
                <input
                  id={id}
                  type="checkbox"
                  value={optionValue}
                  checked={checked}
                  onChange={() => {
                    if (checked) {
                      onChange(
                        selectedValues.filter((item) => item !== optionValue)
                      );
                    } else {
                      onChange([...selectedValues, optionValue]);
                    }
                  }}
                />
                <span>{optionLabel}</span>
              </label>
            );
          })}
        </div>

        {invalid ? (
          <p className="question-required-message">{text.requiredField}</p>
        ) : null}
      </fieldset>
    );
  }

  if (question.type === "slider") {
    const min = question.min ?? 0;
    const max = question.max ?? 10;

    return (
      <div {...questionCardProps}>
        <label htmlFor={question.id}>{label}</label>

        {helpText ? <p className="question-help">{helpText}</p> : null}

        <div className="slider-value">{value}</div>

        <input
          id={question.id}
          className="range-input"
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
        />

        <div className="range-labels">
          <span>{min} — {text.scaleLow}</span>
          <span>{max} — {text.scaleHigh}</span>
        </div>

        {invalid ? (
          <p className="question-required-message">{text.requiredField}</p>
        ) : null}
      </div>
    );
  }

  if (question.type === "number_pair") {
    return (
      <div {...questionCardProps}>
        <label>{label}</label>

        {helpText ? <p className="question-help">{helpText}</p> : null}

        <div className="number-pair-grid">
          <label>
            <span>{text.height}</span>
            <input
              type="number"
              min="0"
              inputMode="decimal"
              value={value?.height_cm || ""}
              onChange={(event) =>
                onChange({
                  ...(value || {}),
                  height_cm: event.target.value,
                })
              }
            />
          </label>

          <label>
            <span>{text.weight}</span>
            <input
              type="number"
              min="0"
              inputMode="decimal"
              value={value?.weight_kg || ""}
              onChange={(event) =>
                onChange({
                  ...(value || {}),
                  weight_kg: event.target.value,
                })
              }
            />
          </label>
        </div>

        {invalid ? (
          <p className="question-required-message">{text.requiredField}</p>
        ) : null}
      </div>
    );
  }

  if (question.type === "number") {
    return (
      <div {...questionCardProps}>
        <label htmlFor={question.id}>{label}</label>

        {helpText ? <p className="question-help">{helpText}</p> : null}

        <input
          id={question.id}
          type="number"
          inputMode="decimal"
          value={value || ""}
          onChange={(event) => onChange(event.target.value)}
        />

        {invalid ? (
          <p className="question-required-message">{text.requiredField}</p>
        ) : null}
      </div>
    );
  }

  return (
    <div {...questionCardProps}>
      <label htmlFor={question.id}>{label}</label>

      {helpText ? <p className="question-help">{helpText}</p> : null}

      <textarea
        id={question.id}
        rows={4}
        value={value || ""}
        onChange={(event) => onChange(event.target.value)}
      />

      {invalid ? (
        <p className="question-required-message">{text.requiredField}</p>
      ) : null}
    </div>
  );
}


export default function QuestionnairePage() {
  const { indication } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const text = copy[language] || copy.de;

  const firstQuestionRef = useRef(null);
  const patientNameRef = useRef(null);

  const [questionnaire, setQuestionnaire] = useState(null);
  const [answers, setAnswers] = useState({});
  const [patientName, setPatientName] = useState("");
  const [step, setStep] = useState(0);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [validationError, setValidationError] = useState("");
  const [missingQuestionIds, setMissingQuestionIds] = useState([]);
  const [nameInvalid, setNameInvalid] = useState(false);
  const [startedAt] = useState(() => Date.now());

  async function loadQuestionnaire() {
    try {
      setStatus("loading");
      setError("");
      setValidationError("");
      setMissingQuestionIds([]);
      setNameInvalid(false);

      const data = await api.getQuestionnaire(indication);

      const initialAnswers = {};

      for (const block of data.blocks || []) {
        for (const question of block.questions || []) {
          initialAnswers[question.id] = defaultAnswer(question);
        }
      }

      setQuestionnaire(data);
      setAnswers(initialAnswers);
      setStep(0);
      setStatus("success");
    } catch (err) {
      setError(err.message || text.errorTitle);
      setStatus("error");
    }
  }

  useEffect(() => {
    loadQuestionnaire();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [indication]);

  const blocks = useMemo(() => {
    return [...(questionnaire?.blocks || [])].sort(
      (a, b) => (a.order || 0) - (b.order || 0)
    );
  }, [questionnaire]);

  const currentBlock = blocks[step - 1];

  useEffect(() => {
    if (step <= 0) {
      return;
    }

    setValidationError("");
    setMissingQuestionIds([]);

    window.setTimeout(() => {
      scrollToElement(firstQuestionRef.current, "start");
      focusFirstInput(firstQuestionRef.current);
    }, 80);
  }, [step, currentBlock?.id]);

  const title = getText(
    questionnaire?.labels,
    language,
    questionnaire?.indication || ""
  );

  const description = getText(
    questionnaire?.description,
    language,
    ""
  );

  const imageAlt = getText(
    questionnaire?.image_alt,
    language,
    title
  );

  function getQuestionById(questionId) {
    for (const block of blocks) {
      const foundQuestion = (block.questions || []).find(
        (question) => question.id === questionId
      );

      if (foundQuestion) {
        return foundQuestion;
      }
    }

    return null;
  }

  function updateAnswer(questionId, value) {
    setAnswers((current) => ({
      ...current,
      [questionId]: value,
    }));

    const question = getQuestionById(questionId);

    if (question && isAnswerComplete(question, value)) {
      setMissingQuestionIds((current) =>
        current.filter((id) => id !== questionId)
      );
    }
  }

  function startQuestionnaire() {
    if (!patientName.trim()) {
      setNameInvalid(true);
      setValidationError(text.nameRequired);

      window.setTimeout(() => {
        scrollToElement(patientNameRef.current, "center");
        patientNameRef.current?.focus();
      }, 50);

      return;
    }

    setNameInvalid(false);
    setValidationError("");
    setStep(1);
  }

  function getMissingQuestionsForCurrentBlock() {
    if (!currentBlock) {
      return [];
    }

    return (currentBlock.questions || [])
      .filter((question) => !isAnswerComplete(question, answers[question.id]))
      .map((question) => question.id);
  }

  function validateCurrentBlock() {
    const missingIds = getMissingQuestionsForCurrentBlock();

    if (!missingIds.length) {
      setMissingQuestionIds([]);
      setValidationError("");
      return true;
    }

    setMissingQuestionIds(missingIds);
    setValidationError(text.required);

    window.setTimeout(() => {
      const firstMissingQuestion = document.getElementById(
        `question-${missingIds[0]}`
      );

      scrollToElement(firstMissingQuestion, "center");
      focusFirstInput(firstMissingQuestion);
    }, 50);

    return false;
  }

  function goNext() {
    if (!validateCurrentBlock()) {
      return;
    }

    setStep((current) => Math.min(current + 1, blocks.length));
  }

  function goPrevious() {
    setValidationError("");
    setMissingQuestionIds([]);
    setStep((current) => Math.max(current - 1, 0));
  }

  function buildSubmissionAnswers() {
    const payload = [];

    for (const block of blocks) {
      const blockTitle = getText(block.title, language, block.id);

      for (const question of block.questions || []) {
        payload.push({
          question_id: question.id,
          question: getText(question.labels, language, question.id),
          answer: answers[question.id],
          block_id: block.id,
          block_title: blockTitle,
          pii_category: question.pii_category || "none",
          include_in_ai: question.include_in_ai !== false,
        });
      }
    }

    return payload;
  }

  async function submitAnswers() {
    if (!validateCurrentBlock()) {
      return;
    }

    try {
      setStatus("submitting");
      setValidationError("");

      const fillDurationSeconds = Math.round((Date.now() - startedAt) / 1000);
      const submissionAnswers = buildSubmissionAnswers();

      const result = await api.createPatientCase({
        indication: questionnaire.indication,
        patientName: patientName.trim(),
        questionnaireTemplateId: questionnaire.id,
        questionnaireVersion: questionnaire.version,
        answers: submissionAnswers,
        metadata: {
          language,
          fill_duration_seconds: fillDurationSeconds,
          question_count: submissionAnswers.length,
        },
      });

      navigate(`/patient/done/${result.case_id}`);
    } catch (err) {
      setError(err.message || text.errorTitle);
      setStatus("error");
    }
  }

  return (
    <AppShell compact hideNav>
      <section className="patient-card questionnaire-card">
        {status === "loading" ? (
          <>
            <p className="eyebrow">Klineus</p>
            <h1>{text.loading}</h1>
          </>
        ) : null}

        {status === "error" ? (
          <>
            <p className="eyebrow">Klineus</p>
            <h1>{text.errorTitle}</h1>
            <p>{error}</p>

            <div className="hero-actions">
              <button className="primary-button" type="button" onClick={loadQuestionnaire}>
                {text.retry}
              </button>

              <Link className="secondary-button" to="/patient/start">
                {text.backToSelection}
              </Link>
            </div>
          </>
        ) : null}

        {(status === "success" || status === "submitting") && questionnaire ? (
          <>
            <div className="questionnaire-header">
              <div>
                <p className="eyebrow">
                  {step === 0
                    ? text.patientDataEyebrow
                    : `${text.questionProgress} ${step} ${text.of} ${blocks.length}`}
                </p>

                <h1>{step === 0 ? text.patientDataTitle : title}</h1>

                {description ? <p>{description}</p> : null}
              </div>

              {questionnaire.image_path ? (
                <img
                  className="questionnaire-header-image"
                  src={api.assetUrl(questionnaire.image_path)}
                  alt={imageAlt}
                  loading="lazy"
                />
              ) : null}
            </div>

            {blocks.length === 0 ? (
              <div className="question-card">
                <p>{text.noQuestions}</p>
              </div>
            ) : null}

            {step === 0 && blocks.length > 0 ? (
              <div
                className={
                  nameInvalid
                    ? "question-card question-card-invalid"
                    : "question-card"
                }
              >
                <label htmlFor="patient-name">{text.patientNameLabel}</label>

                <input
                  ref={patientNameRef}
                  id="patient-name"
                  type="text"
                  value={patientName}
                  placeholder={text.patientNamePlaceholder}
                  onChange={(event) => {
                    setPatientName(event.target.value);

                    if (event.target.value.trim()) {
                      setNameInvalid(false);
                      setValidationError("");
                    }
                  }}
                />

                <p className="question-help">{text.patientNameHint}</p>

                {nameInvalid ? (
                  <p className="question-required-message">
                    {text.nameRequired}
                  </p>
                ) : null}
              </div>
            ) : null}

            {currentBlock ? (
              <div className="questionnaire-block">
                <div className="section-heading">
                  <p className="eyebrow">{currentBlock.id}</p>
                  <h2>{getText(currentBlock.title, language, currentBlock.id)}</h2>
                </div>

                {[...(currentBlock.questions || [])]
                  .sort((a, b) => (a.order || 0) - (b.order || 0))
                  .map((question, questionIndex) => (
                    <QuestionInput
                      key={question.id}
                      question={question}
                      value={answers[question.id]}
                      language={language}
                      text={text}
                      invalid={missingQuestionIds.includes(question.id)}
                      inputRef={questionIndex === 0 ? firstQuestionRef : null}
                      onChange={(value) => updateAnswer(question.id, value)}
                    />
                  ))}
              </div>
            ) : null}

            {validationError ? (
              <p className="form-error">{validationError}</p>
            ) : null}

            <p className="disclaimer">{text.disclaimer}</p>

            <div className="questionnaire-actions">
              {step > 0 ? (
                <button
                  className="secondary-button"
                  type="button"
                  onClick={goPrevious}
                  disabled={status === "submitting"}
                >
                  {text.previous}
                </button>
              ) : (
                <Link className="secondary-button" to="/patient/start">
                  {text.backToSelection}
                </Link>
              )}

              {step === 0 ? (
                <button
                  className="primary-button"
                  type="button"
                  onClick={startQuestionnaire}
                >
                  {text.start}
                </button>
              ) : step < blocks.length ? (
                <button
                  className="primary-button"
                  type="button"
                  onClick={goNext}
                >
                  {text.next}
                </button>
              ) : (
                <button
                  className="primary-button"
                  type="button"
                  onClick={submitAnswers}
                  disabled={status === "submitting"}
                >
                  {status === "submitting" ? text.submitting : text.submit}
                </button>
              )}
            </div>
          </>
        ) : null}
      </section>
    </AppShell>
  );
}