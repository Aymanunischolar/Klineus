const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"
).replace(/\/$/, "");

function getToken() {
  return window.localStorage.getItem("klineus_doctor_token");
}

function getAdminToken() {
  return window.localStorage.getItem("klineus_admin_token");
}

export function assetUrl(path, fallback = "") {
  const value = path || fallback;

  if (!value) {
    return "";
  }

  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }

  if (value.startsWith("/api/static/images/")) {
    return value.replace("/api/static/images/", "/static/images/");
  }

  if (value.startsWith("/images/")) {
    return value.replace("/images/", "/static/images/");
  }

  if (value.startsWith("/static/images/")) {
    return value;
  }

  if (value.startsWith("static/images/")) {
    return `/${value}`;
  }

  return value;
}

async function request(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (options.auth) {
    const token = options.auth === "admin" ? getAdminToken() : getToken();

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const fetchOptions = {
    ...options,
    headers,
  };

  if (Object.prototype.hasOwnProperty.call(options, "body")) {
    fetchOptions.body = JSON.stringify(options.body);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, fetchOptions);

  const rawText = await response.text();

  let data = null;

  if (rawText) {
    try {
      data = JSON.parse(rawText);
    } catch {
      data = rawText;
    }
  }

  if (!response.ok) {
    let message = "Die Anfrage konnte nicht verarbeitet werden.";

    if (data?.detail) {
      message = Array.isArray(data.detail)
        ? data.detail.map((item) => item.msg || String(item)).join(", ")
        : data.detail;
    } else if (typeof data === "string" && data.trim()) {
      message = data;
    } else if (response.statusText) {
      message = response.statusText;
    }

    throw new Error(message);
  }

  return data;
}

async function requestWithFallback(primaryPath, fallbackPath, options = {}) {
  try {
    return await request(primaryPath, options);
  } catch (error) {
    if (!fallbackPath) {
      throw error;
    }

    return request(fallbackPath, options);
  }
}

export const api = {
  login: (email, password) =>
    request("/auth/login", {
      method: "POST",
      body: { email, password },
    }),

 createPatientCase: (
  answers,
  metadata = {},
  indication = "knee_tep",
  questionnaireInfo = {},
) =>
  request("/patient/cases", {
    method: "POST",
    body: {
      indication,
      patient_name: questionnaireInfo.patient_name || null,
      insurance_id: questionnaireInfo.insurance_id || null,
      questionnaire_template_id:
        questionnaireInfo.questionnaire_template_id ||
        questionnaireInfo.id ||
        null,
      questionnaire_version:
        questionnaireInfo.questionnaire_version ||
        questionnaireInfo.version ||
        null,
      answers,
      metadata,
    },
  }),

  getQuestionnaireConfig: () =>
    requestWithFallback("/patient/config", "/patient/questionnaire-config"),

  listQuestionnaires: () => request("/patient/questionnaires"),

  getQuestionnaire: (identifier) =>
    request(`/patient/questionnaires/${encodeURIComponent(identifier)}`),

  getSiteSettings: () => request("/patient/site-settings"),

  listPages: () => request("/patient/pages"),

  getPage: (slug) => request(`/patient/pages/${encodeURIComponent(slug)}`),

  listCases: () => request("/doctor/cases", { auth: true }),

  getCase: (caseId) =>
    request(`/doctor/cases/${encodeURIComponent(caseId)}`, {
      auth: true,
    }),

  generateReport: (caseId) =>
    request(`/reports/${encodeURIComponent(caseId)}/generate`, {
      method: "POST",
      auth: true,
    }),

  saveReport: (caseId, reportText) =>
    request(`/reports/${encodeURIComponent(caseId)}`, {
      method: "PUT",
      auth: true,
      body: { report_text: reportText },
    }),

  deleteCase: (caseId) =>
    request(`/doctor/cases/${encodeURIComponent(caseId)}`, {
      method: "DELETE",
      auth: true,
    }),

 getAdminConfig: async () => {
  const [
    analytics,
    siteSettings,
    pagesResponse,
    media,
    questionnairesResponse,
    apiLogs,
    aiLogs,
    languages,
    extraQuestions,
  ] = await Promise.all([
    request("/admin/analytics", { auth: "admin" }),
    request("/admin/site-settings", { auth: "admin" }),
    request("/admin/pages", { auth: "admin" }),
    request("/admin/media", { auth: "admin" }),
    request("/admin/questionnaires", { auth: "admin" }),
    request("/admin/api-logs", { auth: "admin" }),
    request("/admin/ai-logs", { auth: "admin" }),
    request("/admin/languages", { auth: "admin" }),
    request("/admin/questions", { auth: "admin" }),
  ]);

  return {
    analytics,
    siteSettings,
    pages: pagesResponse?.pages || [],
    media: media || [],
    questionnaires: questionnairesResponse?.questionnaires || [],
    apiLogs: apiLogs || [],
    aiLogs: aiLogs || [],
    languages: languages || [],
    extra_questions: extraQuestions || [],
  };
},

  getAdminAnalytics: () =>
    request("/admin/analytics", {
      auth: "admin",
    }),

  addLanguage: (payload) =>
    request("/admin/languages", {
      method: "POST",
      auth: "admin",
      body: payload,
    }),

  addQuestion: (payload) =>
    request("/admin/questions", {
      method: "POST",
      auth: "admin",
      body: payload,
    }),

  deleteQuestion: (questionId) =>
    request(`/admin/questions/${encodeURIComponent(questionId)}`, {
      method: "DELETE",
      auth: "admin",
    }),

  listAdminPages: () =>
    request("/admin/pages", {
      auth: "admin",
    }),

  getAdminPage: (slug) =>
    request(`/admin/pages/${encodeURIComponent(slug)}`, {
      auth: "admin",
    }),

  saveAdminPage: (slug, payload) =>
    request(`/admin/pages/${encodeURIComponent(slug)}`, {
      method: "PUT",
      auth: "admin",
      body: payload,
    }),

  listAdminQuestionnaires: () =>
    request("/admin/questionnaires", {
      auth: "admin",
    }),

  getAdminQuestionnaire: (identifier) =>
    request(`/admin/questionnaires/${encodeURIComponent(identifier)}`, {
      auth: "admin",
    }),

  saveAdminQuestionnaire: (identifier, payload) =>
    request(`/admin/questionnaires/${encodeURIComponent(identifier)}`, {
      method: "PUT",
      auth: "admin",
      body: payload,
    }),
};