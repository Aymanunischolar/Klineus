export const DISCLAIMER =
  "AI-generated draft. Must be reviewed and approved by a physician.";

export const INDICATIONS = {
  knee_tep: {
    id: "knee_tep",
    slug: "knie",
    type: "knee",
    shortLabel: {
      de: "Knie",
      en: "Knee",
    },
    label: {
      de: "Knie-TEP",
      en: "Knee TEP",
    },
    caseLabel: {
      de: "Knie-TEP Fall",
      en: "Knee TEP case",
    },
    description: {
      de: "Fragen zu Ihren Kniebeschwerden",
      en: "Questions about your knee symptoms",
    },
  },

  hip_tep: {
    id: "hip_tep",
    slug: "huefte",
    type: "hip",
    shortLabel: {
      de: "Hüfte",
      en: "Hip",
    },
    label: {
      de: "Hüft-TEP",
      en: "Hip TEP",
    },
    caseLabel: {
      de: "Hüft-TEP Fall",
      en: "Hip TEP case",
    },
    description: {
      de: "Fragen zu Ihren Hüftbeschwerden",
      en: "Questions about your hip symptoms",
    },
  },
};

export function normalizeIndication(value) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/ü/g, "ue");

  if (["knee", "knie", "knee_tep", "knie_tep"].includes(normalized)) {
    return "knee_tep";
  }

  if (["hip", "huefte", "hufte", "hip_tep", "huefte_tep"].includes(normalized)) {
    return "hip_tep";
  }

  return null;
}

export function getIndicationConfig(value) {
  const indication = normalizeIndication(value);
  return indication ? INDICATIONS[indication] : null;
}

export function getIndicationLabel(value, language = "de") {
  const config = getIndicationConfig(value);

  return config?.label?.[language] || config?.label?.de || value || "";
}

export function getIndicationShortLabel(value, language = "de") {
  const config = getIndicationConfig(value);

  return config?.shortLabel?.[language] || config?.shortLabel?.de || value || "";
}

export function getIndicationCaseLabel(value, language = "de") {
  const config = getIndicationConfig(value);

  return config?.caseLabel?.[language] || config?.caseLabel?.de || value || "";
}

const optionTranslations = {
  Rechts: {
    de: "Rechts",
    en: "Right",
  },
  Links: {
    de: "Links",
    en: "Left",
  },
  Beide: {
    de: "Beide",
    en: "Both",
  },
  Ja: {
    de: "Ja",
    en: "Yes",
  },
  Nein: {
    de: "Nein",
    en: "No",
  },
  "Weiß nicht": {
    de: "Weiß nicht",
    en: "I don't know",
  },
  "Weiß ich nicht": {
    de: "Weiß ich nicht",
    en: "I don't know",
  },
  "Möchte ich nicht angeben": {
    de: "Möchte ich nicht angeben",
    en: "I prefer not to say",
  },
  "Weniger als 3 Monate": {
    de: "Weniger als 3 Monate",
    en: "Less than 3 months",
  },
  "3 bis 6 Monate": {
    de: "3 bis 6 Monate",
    en: "3 to 6 months",
  },
  "6 bis 12 Monate": {
    de: "6 bis 12 Monate",
    en: "6 to 12 months",
  },
  "Länger als 1 Jahr": {
    de: "Länger als 1 Jahr",
    en: "More than 1 year",
  },
  Nie: {
    de: "Nie",
    en: "Never",
  },
  Selten: {
    de: "Selten",
    en: "Rarely",
  },
  Manchmal: {
    de: "Manchmal",
    en: "Sometimes",
  },
  Häufig: {
    de: "Häufig",
    en: "Often",
  },
  Regelmäßig: {
    de: "Regelmäßig",
    en: "Regularly",
  },
  "Fast immer": {
    de: "Fast immer",
    en: "Almost always",
  },
  Teilweise: {
    de: "Teilweise",
    en: "Partly",
  },
  Vielleicht: {
    de: "Vielleicht",
    en: "Maybe",
  },
  Keine: {
    de: "Keine",
    en: "None",
  },
  Sonstiges: {
    de: "Sonstiges",
    en: "Other",
  },
};

export function makeOption(value, labels = {}) {
  return {
    value,
    labels: {
      de: labels.de || value,
      en: labels.en || optionTranslations[value]?.en || value,
    },
  };
}

export function getOptionLabel(option, language = "de") {
  if (option && typeof option === "object") {
    return (
      option.labels?.[language] ||
      option.labels?.de ||
      option.label ||
      option.value ||
      ""
    );
  }

  return optionTranslations[option]?.[language] || optionTranslations[option]?.de || option;
}

export function getOptionValue(option) {
  return option && typeof option === "object" ? option.value : option;
}

export function getQuestionText(questionOrId, language = "de", fallback = "") {
  if (!questionOrId) {
    return fallback;
  }

  if (typeof questionOrId === "object") {
    if (questionOrId.labels) {
      return (
        questionOrId.labels[language] ||
        questionOrId.labels.de ||
        questionOrId.text ||
        fallback
      );
    }

    return questionOrId.text || fallback;
  }

  return fallback || questionOrId;
}

export function getAnswerLabel(answer, language = "de", noAnswer = "keine Angabe") {
  if (Array.isArray(answer)) {
    return answer.length
      ? answer.map((item) => getOptionLabel(item, language)).join(", ")
      : noAnswer;
  }

  if (answer && typeof answer === "object") {
    const height = answer.height_cm ? `${answer.height_cm} cm` : noAnswer;
    const weight = answer.weight_kg ? `${answer.weight_kg} kg` : noAnswer;

    return `${height} / ${weight}`;
  }

  return answer ? getOptionLabel(answer, language) : noAnswer;
}

export function normalizeAdminQuestion(question) {
  return {
    id: question.id,
    blockId: question.block_id,
    blockTitle: question.block_title?.de || question.block_id,
    blockLabels: question.block_title || {
      de: question.block_id,
      en: question.block_id,
    },
    type: question.type,
    labels: question.labels,
    text: question.labels?.de || question.id,
    options: question.options || [],
    min: question.min ?? 0,
    max: question.max ?? 10,
    required: question.required !== false,
    piiCategory: question.pii_category || "none",
    includeInAi: question.include_in_ai !== false,
    source: "admin",
  };
}

export function defaultAnswer(question) {
  if (question.type === "multiple") {
    return [];
  }

  if (question.type === "slider") {
    return Math.round(((question.min ?? 0) + (question.max ?? 10)) / 2);
  }

  if (question.type === "number_pair") {
    return {
      height_cm: "",
      weight_kg: "",
    };
  }

  return "";
}

export function isAnswerComplete(question, value) {
  if (!question) {
    return false;
  }

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

  return String(value || "").trim().length > 0;
}