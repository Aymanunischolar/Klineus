const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
function assetUrl(path) {
  if (!path) {
    return "";
  }

  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  if (path.startsWith("/static/")) {
    return `${API_BASE_URL}${path}`;
  }

  if (path.startsWith("static/")) {
    return `${API_BASE_URL}/${path}`;
  }

  return path;
}

function getDoctorToken() {
  return window.localStorage.getItem("klineus_doctor_token");
}


function getAdminToken() {
  return window.localStorage.getItem("klineus_admin_token");
}


function buildUrl(path) {
  if (!path) {
    return API_BASE_URL;
  }

  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}


async function request(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (options.auth) {
    const token = options.auth === "admin" ? getAdminToken() : getDoctorToken();

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const response = await fetch(buildUrl(path), {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    let message = "Die Anfrage konnte nicht verarbeitet werden.";

    try {
      const data = await response.json();
      message = data.detail || message;
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
      patient_name: null,
      questionnaire_template_id: null,
      questionnaire_version: null,
      answers: payloadOrAnswers,
      metadata,
    };
  }

  const payload = payloadOrAnswers || {};

  return {
    indication: payload.indication || "knee_tep",
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
      body: { email, password },
    }),

  // rest of your functions...
};

  // -------------------------------------------------------------------------
  // Public CMS / site content
  // -------------------------------------------------------------------------

  getSiteSettings: () => request("/patient/site-settings"),

  listPages: () => request("/patient/pages"),

  getPage: (slug) => request(`/patient/pages/${slug}`),

  getHomePage: () => request("/patient/pages/home"),

  getProductPage: () => request("/patient/pages/product"),

  getTeamPage: () => request("/patient/pages/team"),

  getContactPage: () => request("/patient/pages/contact"),

  getLegalPage: () => request("/patient/pages/legal"),

  // -------------------------------------------------------------------------
  // Public questionnaires
  // -------------------------------------------------------------------------

  getPatientConfig: () => request("/patient/config"),

  getQuestionnaireConfig: () => request("/patient/config"),

  listQuestionnaires: () => request("/patient/questionnaires"),

  getQuestionnaire: (identifier) =>
    request(`/patient/questionnaires/${identifier}`),

  // -------------------------------------------------------------------------
  // Patient cases
  // -------------------------------------------------------------------------

  createPatientCase: (payloadOrAnswers, metadata = {}) =>
    request("/patient/cases", {
      method: "POST",
      body: normalizePatientCasePayload(payloadOrAnswers, metadata),
    }),

  // -------------------------------------------------------------------------
  // Doctor
  // -------------------------------------------------------------------------

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

  saveReport: (caseId, reportText) =>
    request(`/reports/${caseId}`, {
      method: "PUT",
      auth: true,
      body: {
        report_text: reportText,
      },
    }),

  // -------------------------------------------------------------------------
  // Admin: dashboard / analytics
  // -------------------------------------------------------------------------

    getAdminAnalytics: () =>
    request("/admin/analytics", {
      auth: "admin",
    }),

  listApiLogs: (limit = 50, errorsOnly = false) =>
    request(`/admin/api-logs?limit=${limit}&errors_only=${errorsOnly}`, {
      auth: "admin",
    }),

  listAiLogs: (limit = 50) =>
    request(`/admin/ai-logs?limit=${limit}`, {
      auth: "admin",
    }),

    getAdminConfig: async () => {
    const [
      languages,
      questionnaires,
      pages,
      media,
      siteSettings,
      analytics,
      apiLogs,
      aiLogs,
    ] = await Promise.all([
      request("/admin/languages", { auth: "admin" }),
      request("/admin/questionnaires", { auth: "admin" }),
      request("/admin/pages", { auth: "admin" }),
      request("/admin/media", { auth: "admin" }),
      request("/admin/site-settings", { auth: "admin" }),
      request("/admin/analytics", { auth: "admin" }),
      request("/admin/api-logs?limit=50", { auth: "admin" }),
      request("/admin/ai-logs?limit=50", { auth: "admin" }),
    ]);

    return {
      languages,
      questionnaires: questionnaires.questionnaires || [],
      pages: pages.pages || [],
      media,
      siteSettings,
      analytics,
      apiLogs,
      aiLogs,
    };
  },
  // -------------------------------------------------------------------------
  // Admin: languages
  // -------------------------------------------------------------------------

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

  // -------------------------------------------------------------------------
  // Admin: site settings
  // -------------------------------------------------------------------------

  getAdminSiteSettings: () =>
    request("/admin/site-settings", {
      auth: "admin",
    }),

  updateSiteSettings: (payload) =>
    request("/admin/site-settings", {
      method: "PUT",
      auth: "admin",
      body: payload,
    }),

  // -------------------------------------------------------------------------
  // Admin: media paths
  // -------------------------------------------------------------------------

  listMedia: () =>
    request("/admin/media", {
      auth: "admin",
    }),

  upsertMedia: (payload) =>
    request("/admin/media", {
      method: "POST",
      auth: "admin",
      body: payload,
    }),

  updateMedia: (key, payload) =>
    request(`/admin/media/${key}`, {
      method: "PUT",
      auth: "admin",
      body: payload,
    }),

  // -------------------------------------------------------------------------
  // Admin: CMS pages
  // -------------------------------------------------------------------------

  listAdminPages: () =>
    request("/admin/pages", {
      auth: "admin",
    }),

  getAdminPage: (slug) =>
    request(`/admin/pages/${slug}`, {
      auth: "admin",
    }),

  createPage: (payload) =>
    request("/admin/pages", {
      method: "POST",
      auth: "admin",
      body: payload,
    }),

  updatePage: (slug, payload) =>
    request(`/admin/pages/${slug}`, {
      method: "PUT",
      auth: "admin",
      body: payload,
    }),

  deletePage: (slug) =>
    request(`/admin/pages/${slug}`, {
      method: "DELETE",
      auth: "admin",
    }),

  // -------------------------------------------------------------------------
  // Admin: questionnaires
  // -------------------------------------------------------------------------

  listAdminQuestionnaires: () =>
    request("/admin/questionnaires", {
      auth: "admin",
    }),

  getAdminQuestionnaire: (identifier) =>
    request(`/admin/questionnaires/${identifier}`, {
      auth: "admin",
    }),

  createQuestionnaire: (payload) =>
    request("/admin/questionnaires", {
      method: "POST",
      auth: "admin",
      body: payload,
    }),

  updateQuestionnaire: (identifier, payload) =>
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

  deleteQuestionnaire: (identifier) =>
    request(`/admin/questionnaires/${identifier}`, {
      method: "DELETE",
      auth: "admin",
    }),

  // -------------------------------------------------------------------------
  // Admin: old extra-question compatibility
  // -------------------------------------------------------------------------

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