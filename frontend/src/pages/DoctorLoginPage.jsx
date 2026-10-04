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

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    const cleanUsername = username.trim();

    setIsSubmitting(true);
    setError("");

    try {
      const data = await api.login(cleanUsername, password);

      if (data.role !== "doctor") {
        setError(
          localText(
            language,
            "Diese Zugangsdaten gehören nicht zum Arztbereich.",
            "These credentials do not belong to the doctor area.",
          ),
        );

        window.localStorage.removeItem("klineus_doctor_token");
        return;
      }

      window.localStorage.setItem("klineus_doctor_token", data.access_token);
      window.localStorage.removeItem("klineus_reception_token");
      window.localStorage.removeItem("klineus_admin_token");

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

          <h1>{localText(language, "Arzt-Anmeldung", "Doctor login")}</h1>

          <p>
            {localText(
              language,
              "Melden Sie sich mit einem Arzt-Zugang an, um Patientenfälle und Dokumentationsentwürfe zu prüfen.",
              "Sign in with a doctor account to review patient cases and documentation drafts.",
            )}
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            <span>{localText(language, "Benutzername", "Username")}</span>

            <input
              autoComplete="username"
              placeholder="doctor01"
              type="text"
              value={username}
              onChange={(event) => {
                setUsername(event.target.value);
                setError("");
              }}
              required
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
              required
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
              : localText(language, "Als Arzt einloggen", "Sign in as doctor")}
          </button>
        </form>
      </section>
    </AppShell>
  );
}