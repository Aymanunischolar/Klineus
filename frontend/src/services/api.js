const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

function getToken() {
  return window.localStorage.getItem("klineus_doctor_token");
}

function getAdminToken() {
  return window.localStorage.getItem("klineus_admin_token");
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

export const api = {
  login: (email, password) =>
    request("/auth/login", {
      method: "POST",
      body: { email, password },
    }),
  createPatientCase: (answers, metadata = {}) =>
    request("/patient/cases", {
      method: "POST",
      body: { indication: "knee_tep", answers, metadata },
    }),
  getQuestionnaireConfig: () => request("/patient/questionnaire-config"),
  listCases: () => request("/doctor/cases", { auth: true }),
  getCase: (caseId) => request(`/doctor/cases/${caseId}`, { auth: true }),
  generateReport: (caseId) =>
    request(`/reports/${caseId}/generate`, {
      method: "POST",
      auth: true,
    }),
  saveReport: (caseId, reportText) =>
    request(`/reports/${caseId}`, {
      method: "PUT",
      auth: true,
      body: { report_text: reportText },
    }),
  deleteCase: (caseId) =>
    request(`/doctor/cases/${caseId}`, {
      method: "DELETE",
      auth: true,
    }),
  getAdminConfig: () => request("/admin/questionnaire-config", { auth: "admin" }),
  getAdminAnalytics: () => request("/admin/analytics", { auth: "admin" }),
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
    request(`/admin/questions/${questionId}`, {
      method: "DELETE",
      auth: "admin",
    }),
};
