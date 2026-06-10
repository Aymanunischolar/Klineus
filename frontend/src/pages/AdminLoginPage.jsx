import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import AppShell from "../components/AppShell.jsx";
import { api } from "../services/api.js";

export default function AdminLoginPage() {
  const navigate = useNavigate();

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

      if (data.role !== "admin") {
        setError("This account does not have admin access.");
        return;
      }

      window.localStorage.setItem("klineus_admin_token", data.access_token);
      navigate("/admin/dashboard");
    } catch (loginError) {
      setError(loginError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AppShell compact hideNav>
      <section className="login-card auth-card admin-auth-card">
        <div className="auth-card-header">
          <p className="eyebrow">Klineus Admin</p>
          <h1>Admin panel</h1>
          <p>
            Manage questionnaire configuration, extra questions, supported languages,
            and prototype analytics.
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            <span>Email</span>
            <input
              autoComplete="email"
              placeholder="admin@klineus.local"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>

          <label>
            <span>Password</span>
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
            {isSubmitting ? "..." : "Sign in as admin"}
          </button>
        </form>

        <div className="auth-footer">
          <Link className="text-link" to="/home">
            ← Back to home
          </Link>

          <Link className="text-link" to="/doctor/login">
            Doctor login
          </Link>
        </div>
      </section>
    </AppShell>
  );
}