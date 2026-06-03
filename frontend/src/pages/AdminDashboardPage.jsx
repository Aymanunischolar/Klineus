import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import AppShell from "../components/AppShell.jsx";
import { api } from "../services/api.js";

const defaultQuestionForm = {
  question_id: "",
  block_id: "G",
  block_title_de: "Block G: Zusatzfragen",
  block_title_en: "Block G: Additional questions",
  question_de: "",
  question_en: "",
  type: "single",
  options_de: "",
  options_en: "",
  min: 0,
  max: 10,
  required: true,
  pii_category: "none",
  include_in_ai: true,
};

function metricValue(value, fallback = "-") {
  return value === null || value === undefined ? fallback : value;
}

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [config, setConfig] = useState({ languages: [], extra_questions: [] });
  const [languageForm, setLanguageForm] = useState({ code: "", name: "" });
  const [questionForm, setQuestionForm] = useState(defaultQuestionForm);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const languageSummary = useMemo(() => {
    if (!analytics?.language_counts) {
      return "-";
    }
    return Object.entries(analytics.language_counts)
      .map(([language, count]) => `${language}: ${count}`)
      .join(", ");
  }, [analytics]);

  async function loadAdminData() {
    setIsLoading(true);
    setError("");
    try {
      const [nextConfig, nextAnalytics] = await Promise.all([
        api.getAdminConfig(),
        api.getAdminAnalytics(),
      ]);
      setConfig(nextConfig);
      setAnalytics(nextAnalytics);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadAdminData();
  }, []);

  function logout() {
    window.localStorage.removeItem("klineus_admin_token");
    navigate("/admin/login");
  }

  async function handleAddLanguage(event) {
    event.preventDefault();
    setError("");
    setNotice("");
    try {
      await api.addLanguage({
        code: languageForm.code,
        name: languageForm.name,
      });
      setLanguageForm({ code: "", name: "" });
      setNotice("Language added.");
      await loadAdminData();
    } catch (languageError) {
      setError(languageError.message);
    }
  }

  async function handleAddQuestion(event) {
    event.preventDefault();
    setError("");
    setNotice("");
    try {
      const optionsDe = questionForm.options_de
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean);
      const optionsEn = questionForm.options_en
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean);

      await api.addQuestion({
        ...questionForm,
        options_de: optionsDe,
        options_en: optionsEn,
        min: Number(questionForm.min),
        max: Number(questionForm.max),
        include_in_ai:
          questionForm.include_in_ai && ["none", "age"].includes(questionForm.pii_category),
      });
      setQuestionForm(defaultQuestionForm);
      setNotice("Question added to the patient form.");
      await loadAdminData();
    } catch (questionError) {
      setError(questionError.message);
    }
  }

  async function handleDeleteQuestion(questionId) {
    setError("");
    setNotice("");
    try {
      await api.deleteQuestion(questionId);
      setNotice("Question removed.");
      await loadAdminData();
    } catch (deleteError) {
      setError(deleteError.message);
    }
  }

  return (
    <AppShell>
      <section className="dashboard-header">
        <div>
          <p className="eyebrow">Admin control center</p>
          <h1>Questionnaire and analytics</h1>
        </div>
        <button className="secondary-button" type="button" onClick={logout}>
          Log out
        </button>
      </section>

      {error ? <p className="form-error">{error}</p> : null}
      {notice ? <p className="form-notice">{notice}</p> : null}
      {isLoading ? <p className="muted">Loading admin data.</p> : null}

      {analytics ? (
        <section className="metric-grid">
          <article className="metric-card">
            <span>Total cases</span>
            <strong>{analytics.total_cases}</strong>
          </article>
          <article className="metric-card">
            <span>Avg. fill time</span>
            <strong>{metricValue(analytics.average_fill_duration_seconds)}s</strong>
          </article>
          <article className="metric-card">
            <span>Avg. page load</span>
            <strong>{metricValue(analytics.average_page_load_ms)}ms</strong>
          </article>
          <article className="metric-card">
            <span>Questions</span>
            <strong>{analytics.question_count}</strong>
          </article>
          <article className="metric-card">
            <span>Reports</span>
            <strong>{analytics.generated_reports}</strong>
          </article>
          <article className="metric-card">
            <span>Languages used</span>
            <strong>{languageSummary}</strong>
          </article>
        </section>
      ) : null}

      <section className="admin-layout">
        <article className="admin-panel">
          <h2>Languages</h2>
          <div className="pill-row">
            {config.languages.map((language) => (
              <span className="prototype-pill" key={language.code}>
                {language.name} ({language.code})
              </span>
            ))}
          </div>
          <form className="admin-form" onSubmit={handleAddLanguage}>
            <label>
              <span>Language code</span>
              <input
                placeholder="fr"
                value={languageForm.code}
                onChange={(event) => setLanguageForm((form) => ({ ...form, code: event.target.value }))}
              />
            </label>
            <label>
              <span>Language name</span>
              <input
                placeholder="Français"
                value={languageForm.name}
                onChange={(event) => setLanguageForm((form) => ({ ...form, name: event.target.value }))}
              />
            </label>
            <button className="primary-button" type="submit">
              Add language
            </button>
          </form>
        </article>

        <article className="admin-panel">
          <h2>Add question</h2>
          <form className="admin-form" onSubmit={handleAddQuestion}>
            <div className="form-grid-2">
              <label>
                <span>Question ID</span>
                <input
                  placeholder="G1"
                  value={questionForm.question_id}
                  onChange={(event) => setQuestionForm((form) => ({ ...form, question_id: event.target.value }))}
                />
              </label>
              <label>
                <span>Block ID</span>
                <input
                  placeholder="G"
                  value={questionForm.block_id}
                  onChange={(event) => setQuestionForm((form) => ({ ...form, block_id: event.target.value }))}
                />
              </label>
            </div>
            <div className="form-grid-2">
              <label>
                <span>German block title</span>
                <input
                  value={questionForm.block_title_de}
                  onChange={(event) => setQuestionForm((form) => ({ ...form, block_title_de: event.target.value }))}
                />
              </label>
              <label>
                <span>English block title</span>
                <input
                  value={questionForm.block_title_en}
                  onChange={(event) => setQuestionForm((form) => ({ ...form, block_title_en: event.target.value }))}
                />
              </label>
            </div>
            <label>
              <span>German question</span>
              <input
                value={questionForm.question_de}
                onChange={(event) => setQuestionForm((form) => ({ ...form, question_de: event.target.value }))}
              />
            </label>
            <label>
              <span>English question</span>
              <input
                value={questionForm.question_en}
                onChange={(event) => setQuestionForm((form) => ({ ...form, question_en: event.target.value }))}
              />
            </label>
            <div className="form-grid-3">
              <label>
                <span>Type</span>
                <select
                  value={questionForm.type}
                  onChange={(event) => setQuestionForm((form) => ({ ...form, type: event.target.value }))}
                >
                  <option value="single">Single choice</option>
                  <option value="multiple">Multiple choice</option>
                  <option value="slider">Slider</option>
                  <option value="number">Number</option>
                  <option value="text">Free text</option>
                </select>
              </label>
              <label>
                <span>PII category</span>
                <select
                  value={questionForm.pii_category}
                  onChange={(event) => setQuestionForm((form) => ({ ...form, pii_category: event.target.value }))}
                >
                  <option value="none">None</option>
                  <option value="age">Age</option>
                  <option value="name">Name</option>
                  <option value="date_of_birth">Date of birth</option>
                  <option value="address">Address</option>
                  <option value="phone">Phone</option>
                  <option value="email">Email</option>
                  <option value="insurance">Insurance</option>
                  <option value="other_identifier">Other identifier</option>
                </select>
              </label>
              <label>
                <span>Include in AI</span>
                <select
                  value={questionForm.include_in_ai ? "yes" : "no"}
                  onChange={(event) =>
                    setQuestionForm((form) => ({ ...form, include_in_ai: event.target.value === "yes" }))
                  }
                >
                  <option value="yes">Yes, unless PII</option>
                  <option value="no">No</option>
                </select>
              </label>
            </div>
            <div className="form-grid-2">
              <label>
                <span>German options, one per line</span>
                <textarea
                  rows="5"
                  value={questionForm.options_de}
                  onChange={(event) => setQuestionForm((form) => ({ ...form, options_de: event.target.value }))}
                />
              </label>
              <label>
                <span>English options, one per line</span>
                <textarea
                  rows="5"
                  value={questionForm.options_en}
                  onChange={(event) => setQuestionForm((form) => ({ ...form, options_en: event.target.value }))}
                />
              </label>
            </div>
            <button className="primary-button" type="submit">
              Add question to patient form
            </button>
          </form>
        </article>
      </section>

      <section className="admin-panel">
        <h2>Admin-added questions</h2>
        {config.extra_questions.length === 0 ? (
          <p className="muted">No extra questions yet.</p>
        ) : (
          <div className="admin-question-list">
            {config.extra_questions.map((question) => (
              <article className="admin-question-row" key={question.id}>
                <div>
                  <strong>{question.id}</strong>
                  <p>{question.labels.de}</p>
                  <small>
                    {question.type} · PII: {question.pii_category} · AI:{" "}
                    {question.include_in_ai ? "included" : "excluded"}
                  </small>
                </div>
                <button className="danger-button" type="button" onClick={() => handleDeleteQuestion(question.id)}>
                  Remove
                </button>
              </article>
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
}
