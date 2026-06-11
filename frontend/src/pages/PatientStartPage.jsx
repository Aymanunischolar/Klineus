import { useNavigate } from "react-router-dom";

import AppShell from "../components/AppShell.jsx";
import { useLanguage } from "../i18n/LanguageContext.jsx";

function localText(language, de, en) {
  return language === "en" ? en : de;
}

export default function PatientStartPage() {
  const navigate = useNavigate();
  const { language } = useLanguage();

  function openQuestionnaire(indication) {
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
            "Wählen Sie den passenden Fragebogen aus. Die Fragen erscheinen einzeln und können vor dem Absenden korrigiert werden.",
            "Select the matching questionnaire. Questions appear one by one and can be corrected before submission.",
          )}
        </p>

        <div className="patient-intro-grid">
          <button
            className="patient-info-card patient-info-card-button"
            type="button"
            onClick={() => openQuestionnaire("knee_tep")}
          >
            <div className="joint-choice-image" aria-hidden="true">
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
            <div className="joint-choice-image" aria-hidden="true">
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