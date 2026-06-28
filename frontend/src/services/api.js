const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"
).replace(/\/$/, "");

const FALLBACK_PATIENT_VALUE = "not-provided";
const FALLBACK_PATIENT_EMAIL = "not-provided@klineus.local";

function getDoctorToken() {
  return window.localStorage.getItem("klineus_doctor_token");
}

function getReceptionToken() {
  return window.localStorage.getItem("klineus_reception_token");
}

function getAdminToken() {
  return window.localStorage.getItem("klineus_admin_token");
}

function cleanString(value) {
  return String(value || "").trim();
}

function cleanPatientPayloadValue(value) {
  const cleaned = cleanString(value);

  if (!cleaned) {
    return null;
  }

  if (cleaned === FALLBACK_PATIENT_VALUE) {
    return null;
  }

  if (cleaned.toLowerCase() === FALLBACK_PATIENT_EMAIL) {
    return null;
  }

  if (cleaned.toLowerCase().endsWith("@klineus.local")) {
    return null;
  }

  return cleaned;
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

function resolveToken(auth) {
  if (!auth) {
    return null;
  }

  if (auth === "admin") {
    return getAdminToken();
  }

  if (auth === "reception") {
    return getReceptionToken();
  }

  if (auth === "doctor") {
    return getDoctorToken();
  }

  return getDoctorToken() || getReceptionToken() || getAdminToken();
}

async function request(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (options.auth) {
    const token = resolveToken(options.auth);

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const fetchOptions = {
    ...options,
    headers,
  };

  delete fetchOptions.auth;

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
  // -------------------------------------------------------------------------
  // Auth
  // -------------------------------------------------------------------------

  login: (username, password) =>
    request("/auth/login", {
      method: "POST",
      body: {
        username,
        password,
      },
    }),

  // -------------------------------------------------------------------------
  // Public CMS pages/settings
  // -------------------------------------------------------------------------

  getSiteSettings: () => request("/patient/site-settings"),

  listPages: () => request("/patient/pages"),

  getPage: (slug) =>
    request(`/patient/pages/${encodeURIComponent(slug)}`),

  // -------------------------------------------------------------------------
  // Public questionnaire config
  // -------------------------------------------------------------------------

  getQuestionnaireConfig: () =>
    requestWithFallback("/patient/config", "/patient/questionnaire-config"),

  listQuestionnaires: () => request("/patient/questionnaires"),

  getQuestionnaire: (identifier) =>
    request(`/patient/questionnaires/${encodeURIComponent(identifier)}`),

  // -------------------------------------------------------------------------
  // Secure patient invite
  // -------------------------------------------------------------------------

  getPatientInvite: (inviteToken) =>
    request(`/patient/invite/${encodeURIComponent(inviteToken)}`),

  // -------------------------------------------------------------------------
  // Patient questionnaire session flow
  // -------------------------------------------------------------------------

  startPatientQuestionnaireSession: ({ patient_name, indication }) =>
    request("/patient/questionnaire-sessions/start", {
      method: "POST",
      body: {
        patient_name: cleanString(patient_name),
        indication,
      },
    }),

  saveQuestionnaireProgress: ({
    session_id,
    indication,
    patient_name,
    patient_last_name,
    patient_email,
    insurance_id,
    questionnaire_template_id,
    questionnaire_version,
    answers,
    metadata,
    current_question_id,
  }) =>
    request("/patient/questionnaire-sessions/progress", {
      method: "PUT",
      body: {
        session_id,
        indication,
        patient_name: cleanPatientPayloadValue(patient_name),
        patient_last_name:
          cleanPatientPayloadValue(patient_last_name) ||
          cleanPatientPayloadValue(patient_name),
        patient_email: cleanPatientPayloadValue(patient_email),
        insurance_id: cleanPatientPayloadValue(insurance_id),
        questionnaire_template_id: questionnaire_template_id || null,
        questionnaire_version: questionnaire_version || null,
        answers: answers || [],
        metadata: metadata || {},
        current_question_id: current_question_id || null,
      },
    }),

  resumePatientQuestionnaireSession: ({
    patient_name,
    patient_last_name,
    resume_code,
  }) =>
    request("/patient/questionnaire-sessions/resume", {
      method: "POST",
      body: {
        patient_name:
          cleanPatientPayloadValue(patient_name) ||
          cleanPatientPayloadValue(patient_last_name),
        patient_last_name:
          cleanPatientPayloadValue(patient_last_name) ||
          cleanPatientPayloadValue(patient_name),
        resume_code: cleanString(resume_code),
      },
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
        patient_name: cleanPatientPayloadValue(questionnaireInfo.patient_name),
        patient_last_name:
          cleanPatientPayloadValue(questionnaireInfo.patient_last_name) ||
          cleanPatientPayloadValue(questionnaireInfo.patient_name),
        patient_email: cleanPatientPayloadValue(questionnaireInfo.patient_email),
        insurance_id: cleanPatientPayloadValue(questionnaireInfo.insurance_id),
        session_id: questionnaireInfo.session_id || null,
        questionnaire_template_id:
          questionnaireInfo.questionnaire_template_id ||
          questionnaireInfo.id ||
          null,
        questionnaire_version:
          questionnaireInfo.questionnaire_version ||
          questionnaireInfo.version ||
          null,
        answers: answers || [],
        metadata: metadata || {},
      },
    }),

  // -------------------------------------------------------------------------
  // Receptionist portal - doctor account management
  // -------------------------------------------------------------------------

  listDoctorUsers: () =>
    request("/reception/doctors", {
      auth: "reception",
    }),

  createDoctorUser: (payload) =>
    request("/reception/doctors", {
      method: "POST",
      auth: "reception",
      body: {
        username: cleanString(payload.username),
        password: cleanString(payload.password),
        full_name: cleanString(payload.full_name) || null,
      },
    }),

  updateDoctorStatus: (userId, isActive) =>
    request(`/reception/doctors/${encodeURIComponent(userId)}/status`, {
      method: "PATCH",
      auth: "reception",
      body: {
        is_active: Boolean(isActive),
      },
    }),

  updateDoctorPassword: (userId, password) =>
    request(`/reception/doctors/${encodeURIComponent(userId)}/password`, {
      method: "PATCH",
      auth: "reception",
      body: {
        password: cleanString(password),
      },
    }),

  deleteDoctorUser: (userId) =>
    request(`/reception/doctors/${encodeURIComponent(userId)}`, {
      method: "DELETE",
      auth: "reception",
    }),

  // -------------------------------------------------------------------------
  // Receptionist portal - patient invites
  // -------------------------------------------------------------------------

  createReceptionInvite: (payload) =>
    request("/reception/invites", {
      method: "POST",
      auth: "reception",
      body: {
        patient_name: cleanString(payload.patient_name),
        patient_last_name: cleanString(payload.patient_last_name),
        patient_age: payload.patient_age ? Number(payload.patient_age) : null,
        insurance_id: cleanString(payload.insurance_id),
        patient_email: cleanString(payload.patient_email),
        appointment_date: payload.appointment_date,
        indication: payload.indication || "knee_tep",
      },
    }),

  listReceptionInvites: ({
    search = "",
    status = "",
    appointment_date = "",
  } = {}) => {
    const params = new URLSearchParams();

    if (search) {
      params.set("search", search);
    }

    if (status) {
      params.set("status", status);
    }

    if (appointment_date) {
      params.set("appointment_date", appointment_date);
    }

    const queryString = params.toString();

    return request(`/reception/invites${queryString ? `?${queryString}` : ""}`, {
      auth: "reception",
    });
  },

  resendReceptionInvite: (sessionId) =>
    request(`/reception/invites/${encodeURIComponent(sessionId)}/resend`, {
      method: "POST",
      auth: "reception",
    }),

  sendReceptionReminder: (sessionId) =>
    request(`/reception/invites/${encodeURIComponent(sessionId)}/reminder`, {
      method: "POST",
      auth: "reception",
    }),

  deleteReceptionInvite: (sessionId) =>
    request(`/reception/invites/${encodeURIComponent(sessionId)}`, {
      method: "DELETE",
      auth: "reception",
    }),

  // -------------------------------------------------------------------------
  // Doctor
  // -------------------------------------------------------------------------

  getDoctorWorklist: () =>
    request("/doctor/worklist", {
      auth: "doctor",
    }),

  listCases: () =>
    request("/doctor/cases", {
      auth: "doctor",
    }),

  getCase: (caseId) =>
    request(`/doctor/cases/${encodeURIComponent(caseId)}`, {
      auth: "doctor",
    }),

  deleteCase: (caseId) =>
    request(`/doctor/cases/${encodeURIComponent(caseId)}`, {
      method: "DELETE",
      auth: "doctor",
    }),

  // -------------------------------------------------------------------------
  // Reports
  // -------------------------------------------------------------------------

  generateReport: (caseId) =>
    request(`/reports/${encodeURIComponent(caseId)}/generate`, {
      method: "POST",
      auth: "doctor",
    }),

  saveReport: (caseId, reportText, reportJson = null) =>
    request(`/reports/${encodeURIComponent(caseId)}`, {
      method: "PUT",
      auth: "doctor",
      body: {
        report_text: reportText,
        report_json: reportJson,
      },
    }),

  // -------------------------------------------------------------------------
  // Admin user management
  // -------------------------------------------------------------------------

  listUsers: (role = "") => {
    const params = new URLSearchParams();

    if (role) {
      params.set("role", role);
    }

    const queryString = params.toString();

    return request(`/admin/users${queryString ? `?${queryString}` : ""}`, {
      auth: "admin",
    });
  },

  createReceptionistUser: (payload) =>
    request("/admin/users/receptionists", {
      method: "POST",
      auth: "admin",
      body: {
        username: cleanString(payload.username),
        password: cleanString(payload.password),
        full_name: cleanString(payload.full_name) || null,
      },
    }),

  updateUserStatus: (userId, isActive) =>
    request(`/admin/users/${encodeURIComponent(userId)}/status`, {
      method: "PATCH",
      auth: "admin",
      body: {
        is_active: Boolean(isActive),
      },
    }),

  // -------------------------------------------------------------------------
  // Admin dashboard
  // -------------------------------------------------------------------------

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
      usersResponse,
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
      request("/admin/users", { auth: "admin" }),
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
      users: usersResponse?.users || [],
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

  createPage: (payload) =>
    request("/admin/pages", {
      method: "POST",
      auth: "admin",
      body: payload,
    }),

  saveAdminPage: (slug, payload) =>
    request(`/admin/pages/${encodeURIComponent(slug)}`, {
      method: "PUT",
      auth: "admin",
      body: payload,
    }),

  updatePage: (slug, payload) =>
    request(`/admin/pages/${encodeURIComponent(slug)}`, {
      method: "PUT",
      auth: "admin",
      body: payload,
    }),

  deletePage: (slug) =>
    request(`/admin/pages/${encodeURIComponent(slug)}`, {
      method: "DELETE",
      auth: "admin",
    }),

  updateSiteSettings: (payload) =>
    request("/admin/site-settings", {
      method: "PUT",
      auth: "admin",
      body: payload,
    }),

  upsertMedia: (payload) =>
    request("/admin/media", {
      method: "POST",
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

  updateQuestionnaire: (identifier, payload) =>
    request(`/admin/questionnaires/${encodeURIComponent(identifier)}`, {
      method: "PUT",
      auth: "admin",
      body: payload,
    }),

  publishQuestionnaire: (identifier, isPublished) =>
    request(`/admin/questionnaires/${encodeURIComponent(identifier)}/publish`, {
      method: "PATCH",
      auth: "admin",
      body: {
        is_published: isPublished,
      },
    }),
};