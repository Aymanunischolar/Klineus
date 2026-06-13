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

function localText(language, de, en) {
  return language === "en" ? en : de;
}

function getNote(question, value, language) {
  if (language === "en" && question.notesByValueEn?.[value]) {
    return question.notesByValueEn[value];
  }

  return question.notesByValue?.[value] || "";
}

function getDetailsLabel(question, language) {
  return (
    question.detailsLabels?.[language] ||
    question.detailsLabels?.de ||
    question.detailsLabel ||
    localText(language, "Angabe", "Details")
  );
}

function isActiveSmokingValue(value) {
  return (
    value === "Ja, mit Angabe Packungen pro Tag und Rauchjahre" ||
    value === "Ja, täglich"
  );
}

function isStoppedSmokingValue(value) {
  return (
    value === "Ich habe aufgehört seit…" ||
    value === "Ich habe aufgehört seit …"
  );
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
    const detailsLabel = getDetailsLabel(question, language);

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
            <span>{detailsLabel}</span>
            <textarea
              aria-label={detailsLabel}
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

  if (question.type === "smoking_details") {
    const current =
      value && typeof value === "object" && !Array.isArray(value)
        ? value
        : {
            value: "",
            packs_per_day: "",
            smoking_years: "",
            stopped_since: "",
          };

    const activeValue = current.value || "";
    const needsActiveSmokingDetails = isActiveSmokingValue(activeValue);
    const needsStoppedSince = isStoppedSmokingValue(activeValue);

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
              onClick={() =>
                onChange({
                  value: optionValue,
                  packs_per_day: "",
                  smoking_years: "",
                  stopped_since: "",
                })
              }
            >
              {getOptionLabel(option, language)}
            </button>
          );
        })}

        {needsActiveSmokingDetails ? (
          <div className="number-grid">
            <label>
              <span>
                {localText(
                  language,
                  "Packungen pro Tag",
                  "Packs per day",
                )}
              </span>

              <input
                inputMode="decimal"
                min="0"
                step="0.1"
                type="number"
                value={current.packs_per_day || ""}
                onChange={(event) =>
                  onChange({
                    ...current,
                    packs_per_day: event.target.value,
                  })
                }
              />
            </label>

            <label>
              <span>
                {localText(
                  language,
                  "Raucherjahre",
                  "Years of smoking",
                )}
              </span>

              <input
                inputMode="numeric"
                min="0"
                type="number"
                value={current.smoking_years || ""}
                onChange={(event) =>
                  onChange({
                    ...current,
                    smoking_years: event.target.value,
                  })
                }
              />
            </label>
          </div>
        ) : null}

        {needsStoppedSince ? (
          <label className="question-detail-field">
            <span>
              {localText(
                language,
                "Seit wann rauchen Sie nicht mehr?",
                "Since when have you stopped smoking?",
              )}
            </span>

            <input
              type="text"
              value={current.stopped_since || ""}
              onChange={(event) =>
                onChange({
                  ...current,
                  stopped_since: event.target.value,
                })
              }
            />
          </label>
        ) : null}

        {needsActiveSmokingDetails &&
        Number(current.packs_per_day) > 0 &&
        Number(current.smoking_years) > 0 ? (
          <p className="question-inline-note">
            {localText(
              language,
              `Pack Years: ${(
                Number(current.packs_per_day) * Number(current.smoking_years)
              ).toFixed(1)}`,
              `Pack years: ${(
                Number(current.packs_per_day) * Number(current.smoking_years)
              ).toFixed(1)}`,
            )}
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
              className={isSelected ? "choice-button selected" : "choice-button"}
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
          <span>{localText(language, "Größe in cm", "Height in cm")}</span>
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
          <span>{localText(language, "Gewicht in kg", "Weight in kg")}</span>
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