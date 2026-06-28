import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import AppShell from "../components/AppShell.jsx";
import { api } from "../services/api.js";

const EMPTY_FORM = {
  patient_name: "",
  patient_last_name: "",
  patient_age: "",
  insurance_id: "",
  patient_email: "",
  appointment_date: "",
  indication: "knee_tep",
};

function formatIndication(value) {
  if (value === "hip_tep") {
    return "Hüfte-TEP";
  }

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

function formatDateTime(value) {
  if (!value) {
    return "—";
  }

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
  if (!value) {
    return "—";
  }

  try {
    return new Intl.DateTimeFormat("de-DE", {
      dateStyle: "medium",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function buildQrUrl(inviteUrl) {
  if (!inviteUrl) {
    return "";
  }

  return `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(
    inviteUrl,
  )}`;
}

export default function ReceptionDashboardPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState(EMPTY_FORM);
  const [invites, setInvites] = useState([]);
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    appointment_date: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [createdInvite, setCreatedInvite] = useState(null);

  const hasDoctorToken = useMemo(() => {
    return Boolean(window.localStorage.getItem("klineus_doctor_token"));
  }, []);

  useEffect(() => {
    if (!hasDoctorToken) {
      navigate("/doctor/login", {
        replace: true,
      });
      return;
    }

    loadInvites();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasDoctorToken, navigate]);

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

  function updateForm(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function updateFilter(field, value) {
    const nextFilters = {
      ...filters,
      [field]: value,
    };

    setFilters(nextFilters);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setSaving(true);
    setError("");
    setSuccessMessage("");
    setCreatedInvite(null);

    try {
      const response = await api.createReceptionInvite(form);

      setCreatedInvite(response);
      setSuccessMessage(
        response?.email_sent
          ? "Einladung wurde erstellt und per E-Mail gesendet."
          : "Einladung wurde erstellt. E-Mail wurde nicht gesendet. Bitte SMTP prüfen.",
      );

      setForm(EMPTY_FORM);
      await loadInvites();
    } catch (submitError) {
      setError(submitError?.message || "Einladung konnte nicht erstellt werden.");
    } finally {
      setSaving(false);
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

    if (!confirmed) {
      return;
    }

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
    if (!caseId) {
      return;
    }

    navigate(`/doctor/cases/${caseId}`);
  }

  return (
    <AppShell compact hideNav>
      <section className="admin-page">
        <div className="admin-header">
          <div>
            <p className="eyebrow">Reception</p>
            <h1>Patienten-Einladungen</h1>
            <p>
              Erstellen Sie sichere Fragebogen-Links für Patienten und verfolgen
              Sie den Status bis zur ärztlichen Prüfung.
            </p>
          </div>

          <div className="admin-header-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={() => navigate("/doctor/dashboard")}
            >
              Doctor Dashboard
            </button>

            <button
              type="button"
              className="secondary-button"
              onClick={() => {
                window.localStorage.removeItem("klineus_doctor_token");
                navigate("/doctor/login", {
                  replace: true,
                });
              }}
            >
              Logout
            </button>
          </div>
        </div>

        {error ? <div className="form-error">{error}</div> : null}
        {successMessage ? (
          <div className="form-success">{successMessage}</div>
        ) : null}

        <div className="admin-grid two-column-grid">
          <form className="admin-card" onSubmit={handleSubmit}>
            <p className="eyebrow">Neue Einladung</p>
            <h2>Patientendaten eingeben</h2>

            <div className="form-grid two-column-grid">
              <label>
                Vorname / Name
                <input
                  type="text"
                  value={form.patient_name}
                  onChange={(event) => updateForm("patient_name", event.target.value)}
                  required
                  placeholder="z. B. Max"
                />
              </label>

              <label>
                Nachname
                <input
                  type="text"
                  value={form.patient_last_name}
                  onChange={(event) =>
                    updateForm("patient_last_name", event.target.value)
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
                  value={form.patient_age}
                  onChange={(event) =>
                    updateForm("patient_age", event.target.value)
                  }
                  placeholder="z. B. 65"
                />
              </label>

              <label>
                Versicherungsnummer
                <input
                  type="text"
                  value={form.insurance_id}
                  onChange={(event) =>
                    updateForm("insurance_id", event.target.value)
                  }
                  required
                  placeholder="Versicherungsnummer"
                />
              </label>

              <label>
                E-Mail Patient
                <input
                  type="email"
                  value={form.patient_email}
                  onChange={(event) =>
                    updateForm("patient_email", event.target.value)
                  }
                  required
                  placeholder="patient@example.com"
                />
              </label>

              <label>
                Termin-Datum
                <input
                  type="date"
                  value={form.appointment_date}
                  onChange={(event) =>
                    updateForm("appointment_date", event.target.value)
                  }
                  required
                />
              </label>

              <label>
                Fragebogen / Indikation
                <select
                  value={form.indication}
                  onChange={(event) => updateForm("indication", event.target.value)}
                  required
                >
                  <option value="knee_tep">Knie-TEP</option>
                  <option value="hip_tep">Hüfte-TEP</option>
                </select>
              </label>
            </div>

            <button type="submit" className="primary-button" disabled={saving}>
              {saving ? "Wird gesendet..." : "Sicheren Link senden"}
            </button>
          </form>

          <div className="admin-card">
            <p className="eyebrow">Letzte Einladung</p>
            <h2>Sicherer Link / QR-Code</h2>

            {createdInvite ? (
              <>
                <p>
                  Der Link wurde erstellt. Falls die E-Mail nicht ankommt, kann
                  dieser Link manuell kopiert werden.
                </p>

                <div className="invite-link-box">
                  <a
                    href={createdInvite.invite_url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {createdInvite.invite_url}
                  </a>
                </div>

                <div className="qr-preview">
                  <img
                    src={buildQrUrl(createdInvite.invite_url)}
                    alt="QR-Code"
                    width="160"
                    height="160"
                  />
                </div>
              </>
            ) : (
              <p>
                Nach dem Erstellen erscheint hier der persönliche Link und der
                QR-Code für den Patienten.
              </p>
            )}
          </div>
        </div>

        <form className="admin-card" onSubmit={handleApplyFilters}>
          <div className="admin-section-header">
            <div>
              <p className="eyebrow">Suche & Filter</p>
              <h2>Einladungen finden</h2>
            </div>

            <div className="admin-header-actions">
              <button type="submit" className="primary-button">
                Filtern
              </button>

              <button
                type="button"
                className="secondary-button"
                onClick={handleResetFilters}
              >
                Zurücksetzen
              </button>
            </div>
          </div>

          <div className="form-grid three-column-grid">
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
        </form>

        <div className="admin-card">
          <div className="admin-section-header">
            <div>
              <p className="eyebrow">Übersicht</p>
              <h2>Patienten</h2>
            </div>

            <button
              type="button"
              className="secondary-button"
              onClick={() => loadInvites()}
              disabled={loading}
            >
              Aktualisieren
            </button>
          </div>

          {loading ? <p>Einladungen werden geladen...</p> : null}

          {!loading && invites.length === 0 ? (
            <p>Noch keine passenden Einladungen vorhanden.</p>
          ) : null}

          {!loading && invites.length > 0 ? (
            <div className="table-scroll">
              <table className="admin-table">
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
                        <strong>
                          {invite.patient_name} {invite.patient_last_name}
                        </strong>
                        <br />
                        <span>{invite.patient_email}</span>
                        <br />
                        <span>VSNR: {invite.insurance_id || "—"}</span>
                        {invite.patient_age ? (
                          <>
                            <br />
                            <span>Alter: {invite.patient_age}</span>
                          </>
                        ) : null}
                      </td>

                      <td>{formatIndication(invite.indication)}</td>

                      <td>{formatDate(invite.appointment_date)}</td>

                      <td>
                        <span className={`status-pill status-${invite.invite_status}`}>
                          {formatStatus(invite.invite_status)}
                        </span>
                        <br />
                        <span>{invite.answer_count || 0} Antworten</span>
                      </td>

                      <td>
                        {invite.case_id ? (
                          <>
                            <span>{invite.case_status || "completed"}</span>
                            <br />
                            <span>{invite.report_status || "not_generated"}</span>
                          </>
                        ) : (
                          "Noch kein Fall"
                        )}
                      </td>

                      <td>
                        <span>
                          Einladung: {formatDateTime(invite.last_invitation_sent_at)}
                        </span>
                        <br />
                        <span>
                          Erinnerung: {formatDateTime(invite.last_reminder_sent_at)}
                        </span>
                      </td>

                      <td>
                        <div className="table-actions">
                          {invite.case_id ? (
                            <button
                              type="button"
                              className="secondary-button"
                              onClick={() => openDoctorCase(invite.case_id)}
                            >
                              Fall öffnen
                            </button>
                          ) : null}

                          <button
                            type="button"
                            className="secondary-button"
                            onClick={() => handleResend(invite.session_id)}
                            disabled={
                              actionLoadingId === `resend-${invite.session_id}`
                            }
                          >
                            Erneut senden
                          </button>

                          <button
                            type="button"
                            className="secondary-button"
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
                            className="danger-button"
                            onClick={() => handleDelete(invite.session_id)}
                            disabled={
                              actionLoadingId === `delete-${invite.session_id}`
                            }
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
        </div>
      </section>
    </AppShell>
  );
}