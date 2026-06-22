import { useState } from "react";
import { useNavigate } from "react-router-dom";

import AppShell from "../components/AppShell.jsx";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { api } from "../services/api.js";

function localText(language, de, en) {
  return language === "en" ? en : de;
}

export default function DoctorLoginPage() {
  const navigate = useNavigate();
  const { language, t } = useLanguage();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    const cleanEmail = email.trim();

    setIsSubmitting(true);
    setError("");

    try {
      const data = await api.login(cleanEmail, password);

      if (data.role === "admin") {
        window.localStorage.setItem("klineus_admin_token", data.access_token);
        navigate("/admin/dashboard");
        return;
      }

      window.localStorage.setItem("klineus_doctor_token", data.access_token);
      navigate("/doctor/dashboard");
    } catch (loginError) {
      setError(
        loginError?.message ||
          localText(
            language,
            "Die Anmeldung war nicht erfolgreich.",
            "Login was not successful.",
          ),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AppShell compact hideNav>
      <section className="login-card auth-card">
        <div className="auth-card-header">
          <p className="eyebrow">
            {t("doctorArea") || localText(language, "Arztbereich", "Doctor area")}
          </p>

          <h1>
            {t("loginTitle") || localText(language, "Anmelden", "Sign in")}
          </h1>

          <p>
            {localText(
              language,
              "Melden Sie sich an, um eingereichte Patientenfälle und Dokumentationsentwürfe ärztlich zu prüfen.",
              "Sign in to review submitted patient cases and documentation drafts.",
            )}
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            <span>{t("email") || "E-Mail"}</span>

            <input
              autoComplete="email"
              placeholder="doctor@klineus.local"
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setError("");
              }}
            />
          </label>

          <label>
            <span>
              {t("password") || localText(language, "Passwort", "Password")}
            </span>

            <input
              autoComplete="current-password"
              placeholder="••••••••"
              type="password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setError("");
              }}
            />
          </label>

          {error ? <p className="form-error">{error}</p> : null}

          <button
            className="primary-button full-width"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting
              ? localText(language, "Wird angemeldet…", "Signing in…")
              : t("loginButton") || localText(language, "Einloggen", "Sign in")}
          </button>
        </form>
      </section>
    </AppShell>
  );
}