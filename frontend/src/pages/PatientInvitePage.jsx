import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import AppShell from "../components/AppShell.jsx";
import { api } from "../services/api.js";

const PATIENT_IDENTITY_STORAGE_KEY = "klineus_patient_identity";

function localText(language, de, en) {
  return language === "en" ? en : de;
}

export default function PatientInvitePage() {
  const navigate = useNavigate();
  const { inviteToken } = useParams();

  const [language] = useState("de");
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadInvite() {
      if (!inviteToken) {
        setStatus("error");
        setError("Der Einladungslink ist ungültig.");
        return;
      }

      try {
        const invite = await api.getPatientInvite(inviteToken);

        if (!isMounted) {
          return;
        }

        const patientIdentity = {
          session_id: invite.session_id,
          patient_name: invite.patient_name || "",
          patient_last_name: invite.patient_last_name || invite.patient_name || "",
          patient_email: invite.patient_email || "",
          insurance_id: invite.insurance_id || "",
          patient_age: invite.patient_age || "",
          appointment_date: invite.appointment_date || "",
          indication: invite.indication || "knee_tep",
          answers: invite.answers || {},
          current_question_id: invite.current_question_id || "",
        };

        window.sessionStorage.setItem(
          PATIENT_IDENTITY_STORAGE_KEY,
          JSON.stringify(patientIdentity),
        );

        setStatus("success");

        window.setTimeout(() => {
          navigate(`/patient/questionnaire/${patientIdentity.indication}`, {
            replace: true,
          });
        }, 700);
      } catch (inviteError) {
        if (!isMounted) {
          return;
        }

        setStatus("error");
        setError(
          inviteError?.message ||
            "Der Einladungslink konnte nicht geöffnet werden.",
        );
      }
    }

    loadInvite();

    return () => {
      isMounted = false;
    };
  }, [inviteToken, navigate]);

  return (
    <AppShell compact hideNav>
      <section className="patient-card patient-done-card">
        {status === "loading" ? (
          <>
            <p className="eyebrow">
              {localText(language, "Einladung wird geprüft", "Checking invite")}
            </p>

            <h1>
              {localText(
                language,
                "Ihr persönlicher Fragebogen wird vorbereitet.",
                "Your personal questionnaire is being prepared.",
              )}
            </h1>

            <p>
              {localText(
                language,
                "Bitte warten Sie einen Moment.",
                "Please wait a moment.",
              )}
            </p>
          </>
        ) : null}

        {status === "success" ? (
          <>
            <p className="eyebrow">
              {localText(language, "Einladung bestätigt", "Invite confirmed")}
            </p>

            <h1>
              {localText(
                language,
                "Sie werden zum Fragebogen weitergeleitet.",
                "You are being redirected to the questionnaire.",
              )}
            </h1>

            <p>
              {localText(
                language,
                "Ihre Patientendaten wurden geladen.",
                "Your patient details have been loaded.",
              )}
            </p>
          </>
        ) : null}

        {status === "error" ? (
          <>
            <p className="eyebrow">
              {localText(language, "Link ungültig", "Invalid link")}
            </p>

            <h1>
              {localText(
                language,
                "Dieser Fragebogen-Link konnte nicht geöffnet werden.",
                "This questionnaire link could not be opened.",
              )}
            </h1>

            <p className="form-error">{error}</p>

            <a className="secondary-button" href="/">
              {localText(language, "Zur Startseite", "Back to home")}
            </a>
          </>
        ) : null}
      </section>
    </AppShell>
  );
}