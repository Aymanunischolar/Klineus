const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"
).replace(/\/$/, "");


function getToken() {
  return window.localStorage.getItem("klineus_doctor_token");
}


function getAdminToken() {
  return window.localStorage.getItem("klineus_admin_token");
}


function assetUrl(path, fallback = "") {
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

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    let message = "The request could not be processed.";

    try {
      const data = await response.json();
      message = data.detail || data.message || message;
    } catch {
      message = response.statusText || message;
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}


function normalizePatientCasePayload(payloadOrAnswers, metadata = {}) {
  if (Array.isArray(payloadOrAnswers)) {
    return {
      indication: "knee_tep",
      answers: payloadOrAnswers,
      metadata,
    };
  }

  const payload = payloadOrAnswers || {};

  return {
    indication: payload.indication,
    patient_name: payload.patientName || payload.patient_name || null,
    questionnaire_template_id:
      payload.questionnaireTemplateId ||
      payload.questionnaire_template_id ||
      null,
    questionnaire_version:
      payload.questionnaireVersion ||
      payload.questionnaire_version ||
      null,
    answers: payload.answers || [],
    metadata: payload.metadata || {},
  };
}


export const api = {
  assetUrl,

  login: (email, password) =>
    request("/auth/login", {
      method: "POST",
      body: {
        email,
        password,
      },
    }),

  getSiteSettings: () => request("/patient/site-settings"),

  listPublicPages: () => request("/patient/pages"),

  getPage: (slug) => request(`/patient/pages/${slug}`),

  listQuestionnaires: () => request("/patient/questionnaires"),

  getQuestionnaire: (identifier) =>
    request(`/patient/questionnaires/${identifier}`),

  getPatientConfig: () => request("/patient/config"),

  getQuestionnaireConfig: () => request("/patient/config"),

  createPatientCase: (payloadOrAnswers, metadata = {}) =>
    request("/patient/cases", {
      method: "POST",
      body: normalizePatientCasePayload(payloadOrAnswers, metadata),
    }),

  listCases: () =>
    request("/doctor/cases", {
      auth: true,
    }),

  getCase: (caseId) =>
    request(`/doctor/cases/${caseId}`, {
      auth: true,
    }),

  deleteCase: (caseId) =>
    request(`/doctor/cases/${caseId}`, {
      method: "DELETE",
      auth: true,
    }),

  generateReport: (caseId) =>
    request(`/reports/${caseId}/generate`, {
      method: "POST",
      auth: true,
    }),

  saveReport: (caseId, reportText, reportJson = null) =>
    request(`/reports/${caseId}`, {
      method: "PUT",
      auth: true,
      body: {
        report_text: reportText,
        report_json: reportJson,
      },
    }),

  getAdminConfig: () =>
    request("/admin/analytics", {
      auth: "admin",
    }),

  getAdminAnalytics: () =>
    request("/admin/analytics", {
      auth: "admin",
    }),

  listApiLogs: (params = {}) => {
    const searchParams = new URLSearchParams();

    if (params.limit) {
      searchParams.set("limit", String(params.limit));
    }

    if (params.errorsOnly || params.errors_only) {
      searchParams.set("errors_only", "true");
    }

    const query = searchParams.toString();

    return request(`/admin/api-logs${query ? `?${query}` : ""}`, {
      auth: "admin",
    });
  },

  listAiLogs: (params = {}) => {
    const searchParams = new URLSearchParams();

    if (params.limit) {
      searchParams.set("limit", String(params.limit));
    }

    const query = searchParams.toString();

    return request(`/admin/ai-logs${query ? `?${query}` : ""}`, {
      auth: "admin",
    });
  },

  listLanguages: () =>
    request("/admin/languages", {
      auth: "admin",
    }),

  addLanguage: (payload) =>
    request("/admin/languages", {
      method: "POST",
      auth: "admin",
      body: payload,
    }),

  listMediaAssets: () =>
    request("/admin/media", {
      auth: "admin",
    }),

  upsertMediaAsset: (payload) =>
    request("/admin/media", {
      method: "POST",
      auth: "admin",
      body: payload,
    }),

  listContentPages: () =>
    request("/admin/pages", {
      auth: "admin",
    }),

  getContentPage: (slug) =>
    request(`/admin/pages/${slug}`, {
      auth: "admin",
    }),

  upsertContentPage: (slug, payload) =>
    request(`/admin/pages/${slug}`, {
      method: "PUT",
      auth: "admin",
      body: payload,
    }),

  createContentPage: (payload) =>
    request("/admin/pages", {
      method: "POST",
      auth: "admin",
      body: payload,
    }),

  deleteContentPage: (slug) =>
    request(`/admin/pages/${slug}`, {
      method: "DELETE",
      auth: "admin",
    }),

  listAdminQuestionnaires: () =>
    request("/admin/questionnaires", {
      auth: "admin",
    }),

  getAdminQuestionnaire: (identifier) =>
    request(`/admin/questionnaires/${identifier}`, {
      auth: "admin",
    }),

  updateAdminQuestionnaire: (identifier, payload) =>
    request(`/admin/questionnaires/${identifier}`, {
      method: "PUT",
      auth: "admin",
      body: payload,
    }),

  publishQuestionnaire: (identifier, isPublished) =>
    request(`/admin/questionnaires/${identifier}/publish`, {
      method: "PATCH",
      auth: "admin",
      body: {
        is_published: isPublished,
      },
    }),

  addQuestion: (payload) =>
    request("/admin/questions", {
      method: "POST",
      auth: "admin",
      body: payload,
    }),

  deleteQuestion: (questionId) =>
    request(`/admin/questions/${questionId}`, {
      method: "DELETE",
      auth: "admin",
    }),
};