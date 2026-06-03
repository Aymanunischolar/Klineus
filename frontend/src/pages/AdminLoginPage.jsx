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
    <AppShell compact>
      <section className="login-card">
        <p className="eyebrow">Klineus Admin</p>
        <h1>Admin panel</h1>
        <form onSubmit={handleSubmit}>
          <label>
            <span>Email</span>
            <input
              autoComplete="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <label>
            <span>Password</span>
            <input
              autoComplete="current-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          {error ? <p className="form-error">{error}</p> : null}
          <button className="primary-button full-width" disabled={isSubmitting} type="submit">
            Sign in as admin
          </button>
        </form>
        <Link className="text-link" to="/home">
          Back to home
        </Link>
      </section>
    </AppShell>
  );
}
