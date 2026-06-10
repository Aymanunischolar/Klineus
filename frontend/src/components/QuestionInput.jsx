import { getOptionLabel, getOptionValue, getQuestionText } from "../data/questionnaire.js";
import { useLanguage } from "../i18n/LanguageContext.jsx";

function ChoiceButton({ selected, children, onClick }) {
  return (
    <button
      className={selected ? "choice-button selected" : "choice-button"}
      type="button"
      aria-pressed={selected}
      onClick={onClick}
    >
      <span className="choice-button-indicator" aria-hidden="true" />
      <span>{children}</span>
    </button>
  );
}

export default function QuestionInput({ question, value, onChange }) {
  const { language, t } = useLanguage();

  if (question.type === "single") {
    return (
      <div className="choice-grid" role="radiogroup" aria-label={getQuestionText(question, language)}>
        {question.options.map((option) => {
          const optionValue = getOptionValue(option);
          const isSelected = value === optionValue;

          return (
            <ChoiceButton
              key={optionValue}
              selected={isSelected}
              onClick={() => onChange(optionValue)}
            >
              {getOptionLabel(option, language)}
            </ChoiceButton>
          );
        })}
      </div>
    );
  }

  if (question.type === "multiple") {
    const selected = Array.isArray(value) ? value : [];

    return (
      <div className="choice-grid" aria-label={getQuestionText(question, language)}>
        {question.options.map((option) => {
          const optionValue = getOptionValue(option);
          const isSelected = selected.includes(optionValue);

          return (
            <ChoiceButton
              key={optionValue}
              selected={isSelected}
              onClick={() => {
                if (isSelected) {
                  onChange(selected.filter((item) => item !== optionValue));
                } else {
                  onChange([...selected, optionValue]);
                }
              }}
            >
              {getOptionLabel(option, language)}
            </ChoiceButton>
          );
        })}
      </div>
    );
  }

  if (question.type === "slider") {
    const sliderValue = Number.isFinite(Number(value)) ? Number(value) : question.min ?? 0;

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
    return (
      <div className="number-grid">
        <label>
          <span>{t("heightCm")}</span>
          <input
            inputMode="numeric"
            min="1"
            type="number"
            value={value?.height_cm || ""}
            onChange={(event) =>
              onChange({
                ...value,
                height_cm: event.target.value,
              })
            }
          />
        </label>

        <label>
          <span>{t("weightKg")}</span>
          <input
            inputMode="numeric"
            min="1"
            type="number"
            value={value?.weight_kg || ""}
            onChange={(event) =>
              onChange({
                ...value,
                weight_kg: event.target.value,
              })
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