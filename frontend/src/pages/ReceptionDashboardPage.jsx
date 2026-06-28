import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import AppShell from "../components/AppShell.jsx";
import { api } from "../services/api.js";

const EMPTY_INVITE_FORM = {
  patient_name: "",
  patient_last_name: "",
  patient_age: "",
  insurance_id: "",
  patient_email: "",
  appointment_date: "",
  indication: "knee_tep",
};

const EMPTY_DOCTOR_FORM = {
  username: "",
  password: "",
  full_name: "",
};

function formatIndication(value) {
  if (value === "hip_tep") return "Hüfte-TEP";
  return "Knie-TEP";
}

function formatStatus(value) {
  const status = value || "invited";

  const labels = {
    invited: "Eingeladen",
    opened: "Geöffnet",
    in_progress: "In Bearbeitung",
    completed: "Abgeschlossen",
  };

  return labels[status] || status;
}

function getStatusClass(value) {
  const status = value || "invited";

  if (status === "completed") return "status-success";
  if (status === "opened" || status === "in_progress") return "status-warning";
  return "status-muted";
}

function formatDateTime(value) {
  if (!value) return "—";

  try {
    return new Intl.DateTimeFormat("de-DE", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function formatDate(value) {
  if (!value) return "—";

  try {
    return new Intl.DateTimeFormat("de-DE", {
      dateStyle: "medium",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function buildQrUrl(inviteUrl) {
  if (!inviteUrl) return "";

  return `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(
    inviteUrl,
  )}`;
}

export default function ReceptionDashboardPage() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("patients");
  const [inviteForm, setInviteForm] = useState(EMPTY_INVITE_FORM);
  const [doctorForm, setDoctorForm] = useState(EMPTY_DOCTOR_FORM);

  const [invites, setInvites] = useState([]);
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    appointment_date: "",
  });

  const [loading, setLoading] = useState(true);
  const [savingInvite, setSavingInvite] = useState(false);
  const [savingDoctor, setSavingDoctor] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [createdInvite, setCreatedInvite] = useState(null);
  const [createdDoctor, setCreatedDoctor] = useState(null);

  const hasReceptionToken = useMemo(() => {
    return Boolean(window.localStorage.getItem("klineus_reception_token"));
  }, []);

  useEffect(() => {
    if (!hasReceptionToken) {
      navigate("/reception/login", { replace: true });
      return;
    }

    loadInvites();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasReceptionToken, navigate]);

  const dashboardStats = useMemo(() => {
    const total = invites.length;

    const completed = invites.filter(
      (invite) => invite.invite_status === "completed",
    ).length;

    const inProgress = invites.filter(
      (invite) =>
        invite.invite_status === "opened" ||
        invite.invite_status === "in_progress",
    ).length;

    const waiting = invites.filter(
      (invite) => !invite.invite_status || invite.invite_status === "invited",
    ).length;

    return {
      total,
      waiting,
      inProgress,
      completed,
    };
  }, [invites]);

  async function loadInvites(nextFilters = filters) {
    setLoading(true);
    setError("");

    try {
      const response = await api.listReceptionInvites(nextFilters);
      setInvites(response?.invites || []);
    } catch (loadError) {
      setError(loadError?.message || "Einladungen konnten nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  }

  function updateInviteForm(field, value) {
    setInviteForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function updateDoctorForm(field, value) {
    setDoctorForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function updateFilter(field, value) {
    setFilters((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSearchSubmit(event) {
    event.preventDefault();
    setActiveTab("patients");
    await loadInvites(filters);
  }

  async function handleCreateInvite(event) {
    event.preventDefault();

    setSavingInvite(true);
    setError("");
    setSuccessMessage("");
    setCreatedInvite(null);
    setCreatedDoctor(null);

    try {
      const response = await api.createReceptionInvite(inviteForm);

      setCreatedInvite(response);
      setSuccessMessage(
        response?.email_sent
          ? "Einladung wurde erstellt und per E-Mail gesendet."
          : "Einladung wurde erstellt. E-Mail wurde nicht gesendet. Bitte SMTP prüfen.",
      );

      setInviteForm(EMPTY_INVITE_FORM);
      setActiveTab("patients");
      await loadInvites();
    } catch (submitError) {
      setError(submitError?.message || "Einladung konnte nicht erstellt werden.");
    } finally {
      setSavingInvite(false);
    }
  }

  async function handleCreateDoctor(event) {
    event.preventDefault();

    setSavingDoctor(true);
    setError("");
    setSuccessMessage("");
    setCreatedInvite(null);
    setCreatedDoctor(null);

    try {
      const response = await api.createDoctorUser(doctorForm);

      setCreatedDoctor(response);
      setSuccessMessage("Arzt-Login wurde erfolgreich erstellt.");
      setDoctorForm(EMPTY_DOCTOR_FORM);
    } catch (submitError) {
      setError(submitError?.message || "Arzt-Login konnte nicht erstellt werden.");
    } finally {
      setSavingDoctor(false);
    }
  }

  async function handleResend(sessionId) {
    setActionLoadingId(`resend-${sessionId}`);
    setError("");
    setSuccessMessage("");

    try {
      await api.resendReceptionInvite(sessionId);
      setSuccessMessage("Einladung wurde erneut gesendet.");
      await loadInvites();
    } catch (actionError) {
      setError(actionError?.message || "Einladung konnte nicht erneut gesendet werden.");
    } finally {
      setActionLoadingId("");
    }
  }

  async function handleReminder(sessionId) {
    setActionLoadingId(`reminder-${sessionId}`);
    setError("");
    setSuccessMessage("");

    try {
      await api.sendReceptionReminder(sessionId);
      setSuccessMessage("Erinnerung wurde gesendet.");
      await loadInvites();
    } catch (actionError) {
      setError(actionError?.message || "Erinnerung konnte nicht gesendet werden.");
    } finally {
      setActionLoadingId("");
    }
  }

  async function handleDelete(sessionId) {
    const confirmed = window.confirm(
      "Möchten Sie diese Einladung wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.",
    );

    if (!confirmed) return;

    setActionLoadingId(`delete-${sessionId}`);
    setError("");
    setSuccessMessage("");

    try {
      await api.deleteReceptionInvite(sessionId);
      setSuccessMessage("Einladung wurde gelöscht.");
      await loadInvites();
    } catch (actionError) {
      setError(actionError?.message || "Einladung konnte nicht gelöscht werden.");
    } finally {
      setActionLoadingId("");
    }
  }

  async function handleApplyFilters(event) {
    event.preventDefault();
    setActiveTab("patients");
    await loadInvites(filters);
  }

  async function handleResetFilters() {
    const nextFilters = {
      search: "",
      status: "",
      appointment_date: "",
    };

    setFilters(nextFilters);
    await loadInvites(nextFilters);
  }

  function openDoctorCase(caseId) {
    if (!caseId) return;
    navigate(`/doctor/cases/${caseId}`);
  }

  function logout() {
    window.localStorage.removeItem("klineus_reception_token");
    navigate("/reception/login", { replace: true });
  }

  return (
    <AppShell compact hideNav>
      <main className="reception-dashboard">
        <section className="reception-hero">
          <div>
            <p className="reception-kicker">Dashboard</p>
            <h1>Klinik-Management</h1>
            <p>
              Verwalten Sie Patienteneinladungen, Fragebogenstatus und Arztzugänge
              in einer übersichtlichen Arbeitsoberfläche.
            </p>
          </div>

          <div className="reception-hero-actions">


            <button type="button" className="reception-secondary-btn" onClick={logout}>
              Logout
            </button>
          </div>
        </section>

        <section className="reception-toolbar">
          <div className="reception-tabs">
            <button
              type="button"
              className={activeTab === "patients" ? "active" : ""}
              onClick={() => setActiveTab("patients")}
            >
              Patienten
            </button>

            <button
              type="button"
              className={activeTab === "invite" ? "active" : ""}
              onClick={() => setActiveTab("invite")}
            >
              Neue Einladung
            </button>

            <button
              type="button"
              className={activeTab === "doctors" ? "active" : ""}
              onClick={() => setActiveTab("doctors")}
            >
              Arzt-Zugang
            </button>
          </div>

          <form className="reception-search" onSubmit={handleSearchSubmit}>
            <input
              type="search"
              value={filters.search}
              onChange={(event) => updateFilter("search", event.target.value)}
              placeholder="Patient suchen: Name, E-Mail oder VSNR"
            />

            <button type="submit">Suchen</button>
          </form>
        </section>

        {error ? <div className="reception-alert error">{error}</div> : null}
        {successMessage ? (
          <div className="reception-alert success">{successMessage}</div>
        ) : null}

        <section className="reception-stats">
          <article>
            <span>Gesamt</span>
            <strong>{dashboardStats.total}</strong>
            <p>Patienten-Einladungen</p>
          </article>

          <article>
            <span>Warten</span>
            <strong>{dashboardStats.waiting}</strong>
            <p>Noch nicht gestartet</p>
          </article>

          <article>
            <span>In Bearbeitung</span>
            <strong>{dashboardStats.inProgress}</strong>
            <p>Geöffnet oder begonnen</p>
          </article>

          <article>
            <span>Abgeschlossen</span>
            <strong>{dashboardStats.completed}</strong>
            <p>Fragebogen fertig</p>
          </article>
        </section>

        {activeTab === "invite" ? (
          <section className="reception-grid">
            <form className="reception-card" onSubmit={handleCreateInvite}>
              <div className="reception-card-header">
                <div>
                  <span>Neue Einladung</span>
                  <h2>Patientendaten</h2>
                </div>
              </div>

              <div className="reception-form-grid">
                <label>
                  Vorname / Name
                  <input
                    type="text"
                    value={inviteForm.patient_name}
                    onChange={(event) =>
                      updateInviteForm("patient_name", event.target.value)
                    }
                    required
                    placeholder="z. B. Max"
                  />
                </label>

                <label>
                  Nachname
                  <input
                    type="text"
                    value={inviteForm.patient_last_name}
                    onChange={(event) =>
                      updateInviteForm("patient_last_name", event.target.value)
                    }
                    placeholder="z. B. Mustermann"
                  />
                </label>

                <label>
                  Alter
                  <input
                    type="number"
                    min="0"
                    max="130"
                    value={inviteForm.patient_age}
                    onChange={(event) =>
                      updateInviteForm("patient_age", event.target.value)
                    }
                    placeholder="z. B. 65"
                  />
                </label>

                <label>
                  Versicherungsnummer
                  <input
                    type="text"
                    value={inviteForm.insurance_id}
                    onChange={(event) =>
                      updateInviteForm("insurance_id", event.target.value)
                    }
                    required
                    placeholder="VSNR"
                  />
                </label>

                <label>
                  E-Mail Patient
                  <input
                    type="email"
                    value={inviteForm.patient_email}
                    onChange={(event) =>
                      updateInviteForm("patient_email", event.target.value)
                    }
                    required
                    placeholder="patient@example.com"
                  />
                </label>

                <label>
                  Termin-Datum
                  <input
                    type="date"
                    value={inviteForm.appointment_date}
                    onChange={(event) =>
                      updateInviteForm("appointment_date", event.target.value)
                    }
                    required
                  />
                </label>

                <label>
                  Fragebogen / Indikation
                  <select
                    value={inviteForm.indication}
                    onChange={(event) =>
                      updateInviteForm("indication", event.target.value)
                    }
                    required
                  >
                    <option value="knee_tep">Knie-TEP</option>
                    <option value="hip_tep">Hüfte-TEP</option>
                  </select>
                </label>
              </div>

              <div className="reception-form-actions">
                <button
                  type="submit"
                  className="reception-primary-btn"
                  disabled={savingInvite}
                >
                  {savingInvite ? "Wird gesendet..." : "Sicheren Link senden"}
                </button>
              </div>
            </form>

            <aside className="reception-card">
              <div className="reception-card-header">
                <div>
                  <span>Letzte Einladung</span>
                  <h2>Link & QR-Code</h2>
                </div>
              </div>

              {createdInvite ? (
                <div className="reception-result-box">
                  <p>
                    Der Link wurde erstellt. Falls die E-Mail nicht ankommt, kann
                    dieser Link manuell kopiert werden.
                  </p>

                  <a
                    href={createdInvite.invite_url}
                    target="_blank"
                    rel="noreferrer"
                    className="reception-link-box"
                  >
                    {createdInvite.invite_url}
                  </a>

                  <img
                    src={buildQrUrl(createdInvite.invite_url)}
                    alt="QR-Code"
                    width="160"
                    height="160"
                  />
                </div>
              ) : (
                <p className="reception-muted">
                  Nach dem Erstellen erscheint hier der persönliche Link und der
                  QR-Code für den Patienten.
                </p>
              )}
            </aside>
          </section>
        ) : null}

        {activeTab === "doctors" ? (
          <section className="reception-grid">
            <form className="reception-card" onSubmit={handleCreateDoctor}>
              <div className="reception-card-header">
                <div>
                  <span>Arzt-Zugang</span>
                  <h2>Login-Daten erstellen</h2>
                </div>
              </div>

              <div className="reception-form-grid single">
                <label>
                  Benutzername
                  <input
                    type="text"
                    value={doctorForm.username}
                    onChange={(event) =>
                      updateDoctorForm("username", event.target.value)
                    }
                    required
                    minLength={3}
                    placeholder="z. B. doctor01"
                    autoComplete="username"
                  />
                </label>

                <label>
                  Passwort
                  <input
                    type="password"
                    value={doctorForm.password}
                    onChange={(event) =>
                      updateDoctorForm("password", event.target.value)
                    }
                    required
                    minLength={6}
                    placeholder="Mindestens 6 Zeichen"
                    autoComplete="new-password"
                  />
                </label>

                <label>
                  Name des Arztes
                  <input
                    type="text"
                    value={doctorForm.full_name}
                    onChange={(event) =>
                      updateDoctorForm("full_name", event.target.value)
                    }
                    placeholder="z. B. Dr. Müller"
                  />
                </label>
              </div>

              <div className="reception-form-actions">
                <button
                  type="submit"
                  className="reception-primary-btn"
                  disabled={savingDoctor}
                >
                  {savingDoctor ? "Wird erstellt..." : "Arzt-Login erstellen"}
                </button>
              </div>
            </form>

            <aside className="reception-card">
              <div className="reception-card-header">
                <div>
                  <span>Sicherheit</span>
                  <h2>Hinweis</h2>
                </div>
              </div>

              {createdDoctor ? (
                <div className="reception-result-box">
                  <p>Arzt-Zugang wurde erstellt:</p>
                  <p>
                    <strong>Benutzername:</strong> {createdDoctor.username}
                  </p>
                  <p>
                    <strong>Rolle:</strong> {createdDoctor.role}
                  </p>
                  <p>Das Passwort wird aus Sicherheitsgründen nicht erneut angezeigt.</p>
                </div>
              ) : (
                <p className="reception-muted">
                  Der Benutzername muss eindeutig sein. Das Passwort wird gehasht
                  in der Datenbank gespeichert.
                </p>
              )}
            </aside>
          </section>
        ) : null}

        {activeTab === "patients" ? (
          <>
            <section className="reception-card">
              <div className="reception-card-header">
                <div>
                  <span>Suche & Filter</span>
                  <h2>Einladungen finden</h2>
                </div>

                <div className="reception-card-actions">
                  <button
                    type="button"
                    className="reception-secondary-btn"
                    onClick={handleResetFilters}
                  >
                    Zurücksetzen
                  </button>

                  <button
                    type="button"
                    className="reception-primary-btn"
                    onClick={handleApplyFilters}
                  >
                    Filtern
                  </button>
                </div>
              </div>

              <div className="reception-filter-grid">
                <label>
                  Name, E-Mail oder Versicherungsnummer
                  <input
                    type="search"
                    value={filters.search}
                    onChange={(event) => updateFilter("search", event.target.value)}
                    placeholder="Suchen..."
                  />
                </label>

                <label>
                  Status
                  <select
                    value={filters.status}
                    onChange={(event) => updateFilter("status", event.target.value)}
                  >
                    <option value="">Alle</option>
                    <option value="invited">Eingeladen</option>
                    <option value="opened">Geöffnet</option>
                    <option value="in_progress">In Bearbeitung</option>
                    <option value="completed">Abgeschlossen</option>
                  </select>
                </label>

                <label>
                  Termin-Datum
                  <input
                    type="date"
                    value={filters.appointment_date}
                    onChange={(event) =>
                      updateFilter("appointment_date", event.target.value)
                    }
                  />
                </label>
              </div>
            </section>

            <section className="reception-card">
              <div className="reception-card-header">
                <div>
                  <span>Übersicht</span>
                  <h2>Patienten</h2>
                </div>

                <button
                  type="button"
                  className="reception-secondary-btn"
                  onClick={() => loadInvites()}
                  disabled={loading}
                >
                  Aktualisieren
                </button>
              </div>

              {loading ? <p className="reception-muted">Einladungen werden geladen...</p> : null}

              {!loading && invites.length === 0 ? (
                <p className="reception-muted">Noch keine passenden Einladungen vorhanden.</p>
              ) : null}

              {!loading && invites.length > 0 ? (
                <div className="reception-table-wrap">
                  <table className="reception-table">
                    <thead>
                      <tr>
                        <th>Patient</th>
                        <th>Indikation</th>
                        <th>Termin</th>
                        <th>Status</th>
                        <th>Bericht</th>
                        <th>Gesendet</th>
                        <th>Aktionen</th>
                      </tr>
                    </thead>

                    <tbody>
                      {invites.map((invite) => (
                        <tr key={invite.session_id}>
                          <td>
                            <div className="patient-cell">
                              <strong>
                                {invite.patient_name} {invite.patient_last_name}
                              </strong>
                              <span>{invite.patient_email}</span>
                              <small>VSNR: {invite.insurance_id || "—"}</small>
                              {invite.patient_age ? (
                                <small>Alter: {invite.patient_age}</small>
                              ) : null}
                            </div>
                          </td>

                          <td>{formatIndication(invite.indication)}</td>

                          <td>{formatDate(invite.appointment_date)}</td>

                          <td>
                            <span className={`reception-status ${getStatusClass(invite.invite_status)}`}>
                              {formatStatus(invite.invite_status)}
                            </span>
                            <small className="answer-count">
                              {invite.answer_count || 0} Antworten
                            </small>
                          </td>

                          <td>
                            {invite.case_id ? (
                              <div className="report-cell">
                                <span>{invite.case_status || "completed"}</span>
                                <small>{invite.report_status || "not_generated"}</small>
                              </div>
                            ) : (
                              <span className="reception-muted">Noch kein Fall</span>
                            )}
                          </td>

                          <td>
                            <div className="sent-cell">
                              <span>Einladung: {formatDateTime(invite.last_invitation_sent_at)}</span>
                              <small>Erinnerung: {formatDateTime(invite.last_reminder_sent_at)}</small>
                            </div>
                          </td>

                          <td>
                            <div className="reception-row-actions">
                              {invite.case_id ? (
                                <button
                                  type="button"
                                  className="reception-secondary-btn small"
                                  onClick={() => openDoctorCase(invite.case_id)}
                                >
                                  Fall öffnen
                                </button>
                              ) : null}

                              <button
                                type="button"
                                className="reception-secondary-btn small"
                                onClick={() => handleResend(invite.session_id)}
                                disabled={actionLoadingId === `resend-${invite.session_id}`}
                              >
                                Erneut senden
                              </button>

                              <button
                                type="button"
                                className="reception-secondary-btn small"
                                onClick={() => handleReminder(invite.session_id)}
                                disabled={
                                  invite.invite_status === "completed" ||
                                  actionLoadingId === `reminder-${invite.session_id}`
                                }
                              >
                                Erinnerung
                              </button>

                              <button
                                type="button"
                                className="reception-danger-btn small"
                                onClick={() => handleDelete(invite.session_id)}
                                disabled={actionLoadingId === `delete-${invite.session_id}`}
                              >
                                Löschen
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </section>
          </>
        ) : null}
      </main>
    </AppShell>
  );
}