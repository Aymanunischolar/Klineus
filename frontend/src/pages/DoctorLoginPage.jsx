import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import AppShell from "../components/AppShell.jsx";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { api } from "../services/api.js";

function localText(language, de, en) {
  return language === "en" ? en : de;
}

export default function DoctorLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { language, t } = useLanguage();

  const isReceptionLogin = location.pathname.startsWith("/reception");

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

      if (data.role === "admin") {
        window.localStorage.setItem("klineus_admin_token", data.access_token);
        navigate("/admin/dashboard");
        return;
      }

      if (data.role === "receptionist") {
        window.localStorage.setItem("klineus_reception_token", data.access_token);
        navigate("/reception/dashboard");
        return;
      }

      if (data.role === "doctor") {
        window.localStorage.setItem("klineus_doctor_token", data.access_token);
        navigate("/doctor/dashboard");
        return;
      }

      setError(
        localText(
          language,
          "Dieses Konto hat keine gültige Rolle.",
          "This account does not have a valid role.",
        ),
      );
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
            {isReceptionLogin
              ? localText(language, "Rezeption", "Reception")
              : t("doctorArea") || localText(language, "Arztbereich", "Doctor area")}
          </p>

          <h1>
            {isReceptionLogin
              ? localText(language, "Rezeption anmelden", "Reception sign in")
              : t("loginTitle") || localText(language, "Anmelden", "Sign in")}
          </h1>

          <p>
            {isReceptionLogin
              ? localText(
                  language,
                  "Melden Sie sich an, um Patienteneinladungen und Arztzugänge zu verwalten.",
                  "Sign in to manage patient invitations and doctor accounts.",
                )
              : localText(
                  language,
                  "Melden Sie sich an, um eingereichte Patientenfälle und Dokumentationsentwürfe ärztlich zu prüfen.",
                  "Sign in to review submitted patient cases and documentation drafts.",
                )}
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            <span>{localText(language, "Benutzername", "Username")}</span>

            <input
              autoComplete="username"
              placeholder={isReceptionLogin ? "rezeption01" : "doctor01"}
              type="text"
              value={username}
              onChange={(event) => {
                setUsername(event.target.value);
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