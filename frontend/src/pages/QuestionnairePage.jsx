import {
  getOptionLabel,
  getOptionValue,
  getQuestionText,
} from "../data/questionnaire.js";

function selectedValue(value) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value.value || "";
  }

  return value || "";
}

function getDetailLabel(question, language) {
  return (
    question.detailsLabels?.[language] ||
    question.detailsLabels?.de ||
    question.detailsLabel ||
    "Angabe"
  );
}

function getNote(question, selected, language) {
  if (language === "en" && question.notesByValueEn?.[selected]) {
    return question.notesByValueEn[selected];
  }

  return question.notesByValue?.[selected] || "";
}

export default function QuestionInput({
  question,
  value,
  onChange,
  language = "de",
}) {
  if (question.type === "single") {
    return (
      <div className="choice-grid">
        {question.options.map((option) => {
          const optionValue = getOptionValue(option);

          return (
            <button
              className={
                value === optionValue ? "choice-button selected" : "choice-button"
              }
              key={optionValue}
              type="button"
              onClick={() => onChange(optionValue)}
            >
              {getOptionLabel(option, language)}
            </button>
          );
        })}

        {getNote(question, value, language) ? (
          <p className="question-inline-note">
            {getNote(question, value, language)}
          </p>
        ) : null}
      </div>
    );
  }

  if (question.type === "single_with_text") {
    const current =
      value && typeof value === "object" && !Array.isArray(value)
        ? value
        : { value: "", detail: "" };

    const activeValue = selectedValue(current);
    const needsDetails = question.detailsIf?.includes(activeValue);
    const detailLabel = getDetailLabel(question, language);

    return (
      <div className="choice-grid">
        {question.options.map((option) => {
          const optionValue = getOptionValue(option);

          return (
            <button
              className={
                activeValue === optionValue
                  ? "choice-button selected"
                  : "choice-button"
              }
              key={optionValue}
              type="button"
              onClick={() => onChange({ value: optionValue, detail: "" })}
            >
              {getOptionLabel(option, language)}
            </button>
          );
        })}

        {needsDetails ? (
          <label className="question-detail-field">
            <span>{detailLabel}</span>
            <textarea
              aria-label={detailLabel}
              rows="4"
              value={current.detail || ""}
              onChange={(event) =>
                onChange({ ...current, detail: event.target.value })
              }
            />
          </label>
        ) : null}

        {getNote(question, activeValue, language) ? (
          <p className="question-inline-note">
            {getNote(question, activeValue, language)}
          </p>
        ) : null}
      </div>
    );
  }

  if (question.type === "multiple") {
    const selected = Array.isArray(value) ? value : [];

    return (
      <div className="choice-grid">
        {question.options.map((option) => {
          const optionValue = getOptionValue(option);
          const isSelected = selected.includes(optionValue);

          return (
            <button
              className={
                isSelected ? "choice-button selected" : "choice-button"
              }
              key={optionValue}
              type="button"
              onClick={() => {
                if (isSelected) {
                  onChange(selected.filter((item) => item !== optionValue));
                } else {
                  onChange([...selected, optionValue]);
                }
              }}
            >
              {getOptionLabel(option, language)}
            </button>
          );
        })}
      </div>
    );
  }

  if (question.type === "slider") {
    const sliderValue = Number.isFinite(Number(value))
      ? Number(value)
      : question.min ?? 0;

    return (
      <div className="slider-panel">
        <div className="slider-value">{sliderValue}</div>

        <input
          aria-label={getQuestionText(question, language)}
          max={question.max}
          min={question.min}
          type="range"
          value={sliderValue}
          onChange={(event) => onChange(Number(event.target.value))}
        />

        <div className="slider-scale">
          <span>{question.min}</span>
          <span>{question.max}</span>
        </div>
      </div>
    );
  }

  if (question.type === "number_pair") {
    const current =
      value && typeof value === "object" && !Array.isArray(value)
        ? value
        : { height_cm: "", weight_kg: "" };

    return (
      <div className="number-grid">
        <label>
          <span>{language === "en" ? "Height in cm" : "Größe in cm"}</span>
          <input
            inputMode="numeric"
            min="1"
            type="number"
            value={current.height_cm || ""}
            onChange={(event) =>
              onChange({ ...current, height_cm: event.target.value })
            }
          />
        </label>

        <label>
          <span>{language === "en" ? "Weight in kg" : "Gewicht in kg"}</span>
          <input
            inputMode="numeric"
            min="1"
            type="number"
            value={current.weight_kg || ""}
            onChange={(event) =>
              onChange({ ...current, weight_kg: event.target.value })
            }
          />
        </label>
      </div>
    );
  }

  if (question.type === "number") {
    return (
      <input
        aria-label={getQuestionText(question, language)}
        className="number-input"
        inputMode="numeric"
        type="number"
        value={value || ""}
        onChange={(event) => onChange(event.target.value)}
      />
    );
  }

  return (
    <textarea
      aria-label={getQuestionText(question, language)}
      className="free-text-input"
      rows="6"
      value={value || ""}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}