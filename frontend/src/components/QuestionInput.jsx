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

export default function QuestionInput({ question, value, onChange }) {
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
              {getOptionLabel(option)}
            </button>
          );
        })}

        {question.notesByValue?.[value] ? (
          <p className="question-inline-note">
            {question.notesByValue[value]}
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
              {getOptionLabel(option)}
            </button>
          );
        })}

        {needsDetails ? (
          <label className="question-detail-field">
            <span>{question.detailsLabel || "Angabe"}</span>
            <textarea
              aria-label={question.detailsLabel || "Angabe"}
              rows="4"
              value={current.detail || ""}
              onChange={(event) =>
                onChange({ ...current, detail: event.target.value })
              }
            />
          </label>
        ) : null}

        {question.notesByValue?.[activeValue] ? (
          <p className="question-inline-note">
            {question.notesByValue[activeValue]}
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
              {getOptionLabel(option)}
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
          aria-label={getQuestionText(question)}
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
          <span>Größe in cm</span>
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
          <span>Gewicht in kg</span>
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
        aria-label={getQuestionText(question)}
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
      aria-label={getQuestionText(question)}
      className="free-text-input"
      rows="6"
      value={value || ""}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}