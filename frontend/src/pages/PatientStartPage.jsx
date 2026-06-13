import { useState } from "react";
import { useNavigate } from "react-router-dom";

import AppShell from "../components/AppShell.jsx";
import { useLanguage } from "../i18n/LanguageContext.jsx";

function localText(language, de, en) {
  return language === "en" ? en : de;
}

export default function PatientStartPage() {
  const navigate = useNavigate();
  const { language } = useLanguage();

  const [patientName, setPatientName] = useState("");
  const [insuranceId, setInsuranceId] = useState("");
  const [error, setError] = useState("");

  function openQuestionnaire(indication) {
    const cleanPatientName = patientName.trim();
    const cleanInsuranceId = insuranceId.trim();

    if (!cleanPatientName || !cleanInsuranceId) {
      setError(
        localText(
          language,
          "Bitte geben Sie den Patientennamen und die Versicherungsnummer ein.",
          "Please enter the patient name and insurance ID.",
        ),
      );
      return;
    }

    window.sessionStorage.setItem(
      "klineus_patient_identity",
      JSON.stringify({
        patient_name: cleanPatientName,
        insurance_id: cleanInsuranceId,
      }),
    );

    navigate(`/patient/questionnaire/${indication}`);
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
            "Bitte geben Sie zuerst Ihre Patientendaten für das ärztliche Dashboard ein. Danach wählen Sie den passenden Fragebogen aus.",
            "Please enter your patient details for the doctor dashboard first. Then select the matching questionnaire.",
          )}
        </p>

        <div className="patient-identity-panel">
          <div className="patient-identity-heading">
            <p className="eyebrow">
              {localText(language, "Patientendaten", "Patient details")}
            </p>

            <h2>
              {localText(
                language,
                "Angaben für die ärztliche Zuordnung",
                "Details for doctor identification",
              )}
            </h2>

            <p>
              {localText(
                language,
                "Diese Angaben werden dem Arzt angezeigt, aber nicht als medizinische Fragebogenantwort an die KI übergeben.",
                "These details are shown to the doctor, but are not sent to the AI as medical questionnaire answers.",
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
                  setError("");
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
                  setError("");
                }}
              />
            </label>
          </div>
        </div>

        {error ? <p className="form-error">{error}</p> : null}

        <div className="patient-intro-grid">
          <button
            className="patient-info-card patient-info-card-button"
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
              {localText(
                language,
                "Knie-Fragebogen starten",
                "Start knee questionnaire",
              )}
            </span>
          </button>

          <button
            className="patient-info-card patient-info-card-button"
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
              {localText(
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
              "Die Auswertung ist nur für das ärztliche Dashboard bestimmt. Sie sehen am Ende lediglich eine Bestätigung, dass Ihre Eingaben übermittelt wurden.",
              "The evaluation is only intended for the doctor dashboard. At the end, you will only see a confirmation that your answers were submitted.",
            )}
          </p>
        </div>
      </section>
    </AppShell>
  );
}