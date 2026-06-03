import { getOptionLabel, getOptionValue, getQuestionText } from "../data/questionnaire.js";
import { useLanguage } from "../i18n/LanguageContext.jsx";

export default function QuestionInput({ question, value, onChange }) {
  const { language, t } = useLanguage();

  if (question.type === "single") {
    return (
      <div className="choice-grid">
        {question.options.map((option) => {
          const optionValue = getOptionValue(option);
          return (
            <button
              className={value === optionValue ? "choice-button selected" : "choice-button"}
              key={optionValue}
              type="button"
              onClick={() => onChange(optionValue)}
            >
              {getOptionLabel(option, language)}
            </button>
          );
        })}
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
    return (
      <div className="slider-panel">
        <div className="slider-value">{value}</div>
        <input
          aria-label={getQuestionText(question, language)}
          max={question.max}
          min={question.min}
          type="range"
          value={value}
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
    return (
      <div className="number-grid">
        <label>
          <span>{t("heightCm")}</span>
          <input
            inputMode="numeric"
            min="1"
            type="number"
            value={value?.height_cm || ""}
            onChange={(event) => onChange({ ...value, height_cm: event.target.value })}
          />
        </label>
        <label>
          <span>{t("weightKg")}</span>
          <input
            inputMode="numeric"
            min="1"
            type="number"
            value={value?.weight_kg || ""}
            onChange={(event) => onChange({ ...value, weight_kg: event.target.value })}
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
