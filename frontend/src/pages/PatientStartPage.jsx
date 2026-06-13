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
  const [patientLastName, setPatientLastName] = useState("");
  const [patientEmail, setPatientEmail] = useState("");
  const [insuranceId, setInsuranceId] = useState("");

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isStarting, setIsStarting] = useState(false);

  async function openQuestionnaire(indication) {
    const cleanPatientName = patientName.trim();
    const cleanPatientLastName = patientLastName.trim();
    const cleanPatientEmail = patientEmail.trim();
    const cleanInsuranceId = insuranceId.trim();

    setError("");
    setNotice("");

    if (
      !cleanPatientName ||
      !cleanPatientLastName ||
      !cleanPatientEmail ||
      !cleanInsuranceId
    ) {
      setError(
        localText(
          language,
          "Bitte geben Sie Patientenname, Nachname, E-Mail und Versicherungsnummer ein.",
          "Please enter patient name, last name, email and insurance ID.",
        ),
      );
      return;
    }

    try {
      setIsStarting(true);

      const session = await api.startPatientQuestionnaireSession({
        patient_name: cleanPatientName,
        patient_last_name: cleanPatientLastName,
        patient_email: cleanPatientEmail,
        insurance_id: cleanInsuranceId,
        indication,
      });

      window.sessionStorage.setItem(
        PATIENT_IDENTITY_STORAGE_KEY,
        JSON.stringify({
          session_id: session.session_id,
          patient_name: cleanPatientName,
          patient_last_name: cleanPatientLastName,
          patient_email: cleanPatientEmail,
          insurance_id: cleanInsuranceId,
          indication,
        }),
      );

      if (session.resume_code) {
        window.alert(
          localText(
            language,
            `Testmodus: Ihr Zugangscode lautet ${session.resume_code}.`,
            `Test mode: your resume code is ${session.resume_code}.`,
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

  function clearMessages() {
    setError("");
    setNotice("");
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
              "Bitte geben Sie zuerst Ihre Daten für die ärztliche Zuordnung ein. Danach wählen Sie den passenden Fragebogen aus.",
              "Please enter your details for doctor-side identification first. Then select the matching questionnaire.",
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
                  "Setzen Sie Ihren Fragebogen mit Nachname und vierstelligem Code fort.",
                  "Continue your questionnaire with your last name and four-digit code.",
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

              <h2>
                {localText(
                    language,
                    "Angaben für Arzt und Zugangscode",
                    "Details for doctor and resume code",
                )}
              </h2>

              <p>
                {localText(
                    language,
                    "Sie erhalten einen vierstelligen Zugangscode per E-Mail. Damit können Sie den Fragebogen später mit Ihrem Nachnamen fortsetzen.",
                    "You will receive a four-digit code by email. You can use it with your last name to continue the questionnaire later.",
                )}
              </p>
            </div>

            <div className="patient-identity-grid">
              <label>
              <span>
                {localText(language, "Patientenname", "Patient name")}
              </span>

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

              <label>
                <span>{localText(language, "Nachname", "Last name")}</span>

                <input
                    autoComplete="family-name"
                    placeholder={localText(
                        language,
                        "z. B. Mustermann",
                        "e.g. Mustermann",
                    )}
                    type="text"
                    value={patientLastName}
                    onChange={(event) => {
                      setPatientLastName(event.target.value);
                      clearMessages();
                    }}
                />
              </label>

              <label>
                <span>{localText(language, "E-Mail", "Email")}</span>

                <input
                    autoComplete="email"
                    placeholder={localText(
                        language,
                        "z. B. patient@example.com",
                        "e.g. patient@example.com",
                    )}
                    type="email"
                    value={patientEmail}
                    onChange={(event) => {
                      setPatientEmail(event.target.value);
                      clearMessages();
                    }}
                />
              </label>

              <label>
              <span>
                {localText(
                    language,
                    "Versicherungsnummer",
                    "Insurance ID",
                )}
              </span>

                <input
                    autoComplete="off"
                    placeholder={localText(
                        language,
                        "z. B. A123456789",
                        "e.g. A123456789",
                    )}
                    type="text"
                    value={insuranceId}
                    onChange={(event) => {
                      setInsuranceId(event.target.value);
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
                <img alt="" src="/static/images/knee.png"/>
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
                <img alt="" src="/static/images/hip.png"/>
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