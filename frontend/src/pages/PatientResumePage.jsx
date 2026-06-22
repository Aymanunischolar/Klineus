import { useState } from "react";
import { useNavigate } from "react-router-dom";

import AppShell from "../components/AppShell.jsx";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { api } from "../services/api.js";

const PATIENT_IDENTITY_STORAGE_KEY = "klineus_patient_identity";

function localText(language, de, en) {
  return language === "en" ? en : de;
}

export default function PatientResumePage() {
  const navigate = useNavigate();
  const { language } = useLanguage();

  const [patientName, setPatientName] = useState("");
  const [resumeCode, setResumeCode] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleResume(event) {
    event.preventDefault();

    const cleanPatientName = patientName.trim();
    const cleanResumeCode = resumeCode.trim();

    setError("");

    if (!cleanPatientName || !cleanResumeCode) {
      setError(
        localText(
          language,
          "Bitte geben Sie Patientenname und Zugangscode ein.",
          "Please enter patient name and access code.",
        ),
      );
      return;
    }

    if (!/^\d{4}$/.test(cleanResumeCode)) {
      setError(
        localText(
          language,
          "Der Zugangscode muss vier Ziffern haben.",
          "The access code must contain four digits.",
        ),
      );
      return;
    }

    try {
      setIsLoading(true);

      const session = await api.resumePatientQuestionnaireSession({
        patient_name: cleanPatientName,
        resume_code: cleanResumeCode,
      });

      const indication = session.indication || "knee_tep";

      window.sessionStorage.setItem(
        PATIENT_IDENTITY_STORAGE_KEY,
        JSON.stringify({
          session_id: session.session_id,
          patient_name: session.patient_name || cleanPatientName,
          patient_last_name: session.patient_last_name || "",
          patient_email: session.patient_email || "",
          insurance_id: session.insurance_id || "",
          indication,
          questionnaire_template_id: session.questionnaire_template_id || "",
          questionnaire_version: session.questionnaire_version || null,
          answers: session.answers || [],
          metadata: session.metadata || {},
          current_question_id: session.current_question_id || "",
        }),
      );

      navigate(`/patient/questionnaire/${indication}`);
    } catch (resumeError) {
      setError(
        resumeError?.message ||
          localText(
            language,
            "Es wurde kein aktiver Fragebogen für diesen Namen und Code gefunden.",
            "No active questionnaire was found for this name and code.",
          ),
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AppShell compact>
      <section className="patient-card patient-start-card">
        <p className="eyebrow">
          {localText(language, "Fragebogen fortsetzen", "Resume questionnaire")}
        </p>

        <h1>
          {localText(
            language,
            "Setzen Sie Ihren Klineus Fragebogen fort.",
            "Continue your Klineus questionnaire.",
          )}
        </h1>

        <p className="patient-start-lead">
          {localText(
            language,
            "Geben Sie Ihren Patientennamen und den vierstelligen Zugangscode ein.",
            "Enter your patient name and the four-digit access code.",
          )}
        </p>

        <form className="patient-identity-panel" onSubmit={handleResume}>
          <div className="patient-identity-grid">
            <label>
              <span>{localText(language, "Patientenname", "Patient name")}</span>

              <input
                autoComplete="name"
                placeholder={localText(
                  language,
                  "z. B. Max Mustermann",
                  "e.g. Max Mustermann",
                )}
                type="text"
                value={patientName}
                onChange={(event) => {
                  setPatientName(event.target.value);
                  setError("");
                }}
              />
            </label>

            <label>
              <span>
                {localText(
                  language,
                  "Vierstelliger Zugangscode",
                  "Four-digit access code",
                )}
              </span>

              <input
                autoComplete="one-time-code"
                inputMode="numeric"
                maxLength={4}
                placeholder="1234"
                type="text"
                value={resumeCode}
                onChange={(event) => {
                  setResumeCode(
                    event.target.value.replace(/\D/g, "").slice(0, 4),
                  );
                  setError("");
                }}
              />
            </label>
          </div>

          {error ? <p className="form-error">{error}</p> : null}

          <div className="question-nav question-nav-pro">
            <button
              className="secondary-button"
              disabled={isLoading}
              type="button"
              onClick={() => navigate("/patient/start")}
            >
              {localText(language, "Zurück zum Start", "Back to start")}
            </button>

            <button
              className="primary-button"
              disabled={isLoading}
              type="submit"
            >
              {isLoading
                ? localText(language, "Wird geladen…", "Loading…")
                : localText(
                    language,
                    "Fragebogen fortsetzen",
                    "Resume questionnaire",
                  )}
            </button>
          </div>
        </form>
      </section>
    </AppShell>
  );
}