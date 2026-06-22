import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import AppShell from "../components/AppShell.jsx";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { api } from "../services/api.js";

const PATIENT_IDENTITY_STORAGE_KEY = "klineus_patient_identity";

function localText(language, de, en) {
  return language === "en" ? en : de;
}

function normalizeIndication(value) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/ü/g, "ue");

  if (["hip_tep", "hip", "huefte", "hufte"].includes(normalized)) {
    return "hip_tep";
  }

  if (["knee_tep", "knee", "knie"].includes(normalized)) {
    return "knee_tep";
  }

  return "";
}

export default function PatientStartPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { language } = useLanguage();

  const requestedIndication = normalizeIndication(searchParams.get("indication"));

  const [patientName, setPatientName] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isStarting, setIsStarting] = useState(false);

  const questionnaireChoices = useMemo(() => {
    const choices = [
      {
        indication: "knee_tep",
        title: "Knie-TEP",
        image: "/static/images/knee.png",
        description: localText(
          language,
          "Fragebogen für Beschwerden, Alltagseinschränkungen, bisherige Behandlung und Risikofaktoren rund um das Knie.",
          "Questionnaire for symptoms, daily limitations, previous treatment and risk factors related to the knee.",
        ),
        button: localText(
          language,
          "Knie-Fragebogen starten",
          "Start knee questionnaire",
        ),
      },
      {
        indication: "hip_tep",
        title: "Hüft-TEP",
        image: "/static/images/hip.png",
        description: localText(
          language,
          "Fragebogen für hüftbezogene Beschwerden, Funktion, konservative Therapie und medizinische Risikofaktoren.",
          "Questionnaire for hip-related symptoms, function, conservative treatment and medical risk factors.",
        ),
        button: localText(
          language,
          "Hüft-Fragebogen starten",
          "Start hip questionnaire",
        ),
      },
    ];

    if (!requestedIndication) {
      return choices;
    }

    return choices.filter((choice) => choice.indication === requestedIndication);
  }, [language, requestedIndication]);

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
          "Bitte geben Sie Ihren Patientennamen ein.",
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
          session_id: session?.session_id || "",
          patient_name: cleanPatientName,
          patient_last_name: cleanPatientName,
          patient_email: "",
          insurance_id: "",
          indication,
          answers: {},
          current_question_id: "",
        }),
      );

      if (session?.resume_code) {
        window.alert(
          localText(
            language,
            `Ihr Zugangscode lautet ${session.resume_code}. Bitte notieren Sie ihn, falls Sie den Fragebogen später fortsetzen möchten.`,
            `Your access code is ${session.resume_code}. Please note it if you want to resume the questionnaire later.`,
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
    <AppShell compact hideNav>
      <section className="patient-card patient-start-card">
        <p className="eyebrow">
          {localText(language, "Patientenfragebogen", "Patient questionnaire")}
        </p>

        <h1>
          {localText(
            language,
            "Patientenangaben",
            "Patient information",
          )}
        </h1>

        <p className="patient-start-lead">
          {localText(
            language,
            "Bitte geben Sie Ihren Patientennamen ein. Danach starten Sie den passenden Fragebogen.",
            "Please enter the patient name. Then start the matching questionnaire.",
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
                "Continue your questionnaire with the patient name and four-digit code.",
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
              {localText(language, "Patient", "Patient")}
            </p>

            <h2>
              {localText(
                language,
                "Name für ärztliche Zuordnung",
                "Name for physician-side assignment",
              )}
            </h2>

            <p>
              {localText(
                language,
                "Der Name dient nur dazu, Ihre Angaben im ärztlichen Dashboard zuzuordnen.",
                "The name is only used to assign your answers in the doctor dashboard.",
              )}
            </p>
          </div>

          <div className="patient-identity-grid patient-identity-grid-single">
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
          </div>
        </div>

        {error ? <p className="form-error">{error}</p> : null}
        {notice ? <p className="form-notice">{notice}</p> : null}

        <div className="patient-intro-grid">
          {questionnaireChoices.map((choice) => (
            <button
              key={choice.indication}
              className="patient-info-card patient-info-card-button"
              disabled={isStarting}
              type="button"
              onClick={() => openQuestionnaire(choice.indication)}
            >
              <div className="joint-choice-image">
                <img alt="" src={choice.image} />
              </div>

              <h2>{choice.title}</h2>

              <p>{choice.description}</p>

              <span className="text-link">
                {isStarting
                  ? localText(language, "Wird vorbereitet…", "Preparing…")
                  : choice.button}
              </span>
            </button>
          ))}
        </div>

        <div className="patient-start-note">
          <strong>{localText(language, "Wichtig", "Important")}</strong>

          <p>
            {localText(
              language,
              "Dies ist keine Diagnose. Ihre Angaben werden ärztlich geprüft.",
              "This is not a diagnosis. Your answers will be reviewed by a physician.",
            )}
          </p>
        </div>
      </section>
    </AppShell>
  );
}