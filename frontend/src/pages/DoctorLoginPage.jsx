import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import AppShell from "../components/AppShell.jsx";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { api } from "../services/api.js";

export default function DoctorLoginPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    setIsSubmitting(true);
    setError("");

    try {
      const data = await api.login(email, password);

      if (data.role === "admin") {
        window.localStorage.setItem("klineus_admin_token", data.access_token);
        navigate("/admin/dashboard");
        return;
      }

      window.localStorage.setItem("klineus_doctor_token", data.access_token);
      navigate("/doctor/dashboard");
    } catch (loginError) {
      setError(loginError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AppShell compact hideNav>
      <section className="login-card auth-card">
        <div className="auth-card-header">
          <p className="eyebrow">{t("doctorArea")}</p>
          <h1>{t("loginTitle")}</h1>
          <p>
            Melden Sie sich an, um eingereichte Patientenfälle, Dokumentationshinweise
            und KI-generierte Berichtsentwürfe zu prüfen.
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            <span>{t("email")}</span>
            <input
              autoComplete="email"
              placeholder="doctor@klineus.local"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>

          <label>
            <span>{t("password")}</span>
            <input
              autoComplete="current-password"
              placeholder="••••••••"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>

          {error ? <p className="form-error">{error}</p> : null}

          <button className="primary-button full-width" disabled={isSubmitting} type="submit">
            {isSubmitting ? "..." : t("loginButton")}
          </button>
        </form>

        <div className="auth-footer">
          <Link className="text-link" to="/home">
            ← {t("home")}
          </Link>

          <Link className="text-link" to="/admin/login">
            Admin
          </Link>
        </div>
      </section>
    </AppShell>
  );
}