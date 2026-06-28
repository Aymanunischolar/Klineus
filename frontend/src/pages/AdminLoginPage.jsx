import { useState } from "react";
import { useNavigate } from "react-router-dom";

import AppShell from "../components/AppShell.jsx";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { api } from "../services/api.js";

function localText(language, de, en) {
  return language === "en" ? en : de;
}

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const { language } = useLanguage();

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

      if (data.role !== "admin") {
        setError(
          localText(
            language,
            "Dieses Konto hat keinen Admin-Zugang.",
            "This account does not have admin access.",
          ),
        );
        return;
      }

      window.localStorage.setItem("klineus_admin_token", data.access_token);
      navigate("/admin/dashboard");
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
      <section className="login-card auth-card admin-auth-card">
        <div className="auth-card-header">
          <p className="eyebrow">Klineus Admin</p>

          <h1>
            {localText(language, "Admin-Bereich", "Admin area")}
          </h1>

          <p>
            {localText(
              language,
              "Melden Sie sich an, um Website-Inhalte, Fragebögen, Medien, Auswertungen und Benutzerzugänge zu verwalten.",
              "Sign in to manage website content, questionnaires, media, analytics and user access.",
            )}
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            <span>{localText(language, "Benutzername", "Username")}</span>

            <input
              autoComplete="username"
              placeholder="admin"
              type="text"
              value={username}
              onChange={(event) => {
                setUsername(event.target.value);
                setError("");
              }}
            />
          </label>

          <label>
            <span>{localText(language, "Passwort", "Password")}</span>

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
              : localText(language, "Als Admin anmelden", "Sign in as admin")}
          </button>
        </form>
      </section>
    </AppShell>
  );
}