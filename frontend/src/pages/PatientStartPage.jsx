import { useState } from "react";
import { useNavigate } from "react-router-dom";

import AppShell from "../components/AppShell.jsx";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { api } from "../services/api.js";

const PATIENT_IDENTITY_STORAGE_KEY = "klineus_patient_identity";

function localText(language, de, en) {
  return language === "en" ? en : de;
}

export default function PatientStartPage() {
  const navigate = useNavigate();
  const { language } = useLanguage();

  const [patientName, setPatientName] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isStarting, setIsStarting] = useState(false);

  function clearMessages() {
    setError("");
    setNotice("");
  }

  async function openQuestionnaire(indication) {
    const cleanPatientName = patientName.trim();

    setError("");
    setNotice("");

    if (!cleanPatientName) {
      setError(
        localText(
          language,
          "Bitte geben Sie den Patientennamen ein.",
          "Please enter the patient name.",
        ),
      );
      return;
    }

    try {
      setIsStarting(true);

      const session = await api.startPatientQuestionnaireSession({
        patient_name: cleanPatientName,
        indication,
      });

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
          answers: session.answers || {},
          metadata: session.metadata || {},
          current_question_id: session.current_question_id || "",
        }),
      );

      if (session.resume_code) {
        window.alert(
          localText(
            language,
            `Testmodus: Ihr Zugangscode lautet ${session.resume_code}.`,
            `Test mode: your access code is ${session.resume_code}.`,
          ),
        );
      }

      navigate(`/patient/questionnaire/${indication}`);
    } catch (startError) {
      setError(
        startError?.message ||
          localText(
            language,
            "Der Fragebogen konnte nicht gestartet werden.",
            "The questionnaire could not be started.",
          ),
      );
    } finally {
      setIsStarting(false);
    }
  }

  return (
    <AppShell compact>
      <section className="patient-card patient-start-card">
        <p className="eyebrow">
          {localText(language, "Patientenfragebogen", "Patient questionnaire")}
        </p>

        <h1>
          {localText(
            language,
            "Bereiten Sie Ihren Termin strukturiert vor.",
            "Prepare your appointment in a structured way.",
          )}
        </h1>

        <p className="patient-start-lead">
          {localText(
            language,
            "Bitte geben Sie Ihren Patientennamen ein. Danach wählen Sie den passenden Fragebogen aus.",
            "Please enter your patient name. Then select the matching questionnaire.",
          )}
        </p>

        <div className="patient-resume-strip">
          <div>
            <strong>
              {localText(
                language,
                "Sie haben bereits einen Zugangscode?",
                "Already have an access code?",
              )}
            </strong>

            <p>
              {localText(
                language,
                "Setzen Sie Ihren Fragebogen mit Patientennamen und vierstelligem Code fort.",
                "Continue your questionnaire with your patient name and four-digit code.",
              )}
            </p>
          </div>

          <button
            className="secondary-button"
            type="button"
            onClick={() => navigate("/patient/resume")}
          >
            {localText(
              language,
              "Fragebogen fortsetzen",
              "Resume questionnaire",
            )}
          </button>
        </div>

        <div className="patient-identity-panel">
          <div className="patient-identity-heading">
            <p className="eyebrow">
              {localText(language, "Patientendaten", "Patient details")}
            </p>

            <h2>{localText(language, "Patientenname", "Patient name")}</h2>

            <p>
              {localText(
                language,
                "Der Patientenname dient der ärztlichen Zuordnung des Fragebogens.",
                "The patient name is used by the doctor to assign the questionnaire.",
              )}
            </p>
          </div>

          <div className="patient-identity-grid patient-identity-grid-single">
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
                  clearMessages();
                }}
              />
            </label>
          </div>
        </div>

        {error ? <p className="form-error">{error}</p> : null}
        {notice ? <p className="form-notice">{notice}</p> : null}

        <div className="patient-intro-grid">
          <button
            className="patient-info-card patient-info-card-button"
            disabled={isStarting}
            type="button"
            onClick={() => openQuestionnaire("knee_tep")}
          >
            <div className="joint-choice-image">
              <img alt="" src="/static/images/knee.png" />
            </div>

            <h2>Knie-TEP</h2>

            <p>
              {localText(
                language,
                "Fragebogen für Beschwerden, Alltagseinschränkungen, bisherige Behandlung und Risikofaktoren rund um das Knie.",
                "Questionnaire for symptoms, daily limitations, previous treatment and risk factors related to the knee.",
              )}
            </p>

            <span className="text-link">
              {isStarting
                ? localText(language, "Wird vorbereitet…", "Preparing…")
                : localText(
                    language,
                    "Knie-Fragebogen starten",
                    "Start knee questionnaire",
                  )}
            </span>
          </button>

          <button
            className="patient-info-card patient-info-card-button"
            disabled={isStarting}
            type="button"
            onClick={() => openQuestionnaire("hip_tep")}
          >
            <div className="joint-choice-image">
              <img alt="" src="/static/images/hip.png" />
            </div>

            <h2>Hüft-TEP</h2>

            <p>
              {localText(
                language,
                "Fragebogen für hüftbezogene Beschwerden, Funktion, konservative Therapie und medizinische Risikofaktoren.",
                "Questionnaire for hip-related symptoms, function, conservative treatment and medical risk factors.",
              )}
            </p>

            <span className="text-link">
              {isStarting
                ? localText(language, "Wird vorbereitet…", "Preparing…")
                : localText(
                    language,
                    "Hüft-Fragebogen starten",
                    "Start hip questionnaire",
                  )}
            </span>
          </button>
        </div>

        <div className="patient-start-note">
          <strong>{localText(language, "Wichtig", "Important")}</strong>

          <p>
            {localText(
              language,
              "Die Auswertung ist nur für das ärztliche Dashboard bestimmt. Am Ende sehen Sie lediglich eine Bestätigung, dass Ihre Eingaben übermittelt wurden.",
              "The evaluation is only intended for the doctor dashboard. At the end, you will only see a confirmation that your answers were submitted.",
            )}
          </p>
        </div>
      </section>
    </AppShell>
  );
}