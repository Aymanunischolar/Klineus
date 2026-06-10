import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import AppShell from "../components/AppShell.jsx";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { api } from "../services/api.js";


const copy = {
  de: {
    eyebrow: "Patientenfragebogen",
    title: "Welchen Fragebogen möchten Sie beantworten?",
    lead:
      "Bitte wählen Sie aus, ob es heute um Knie- oder Hüftbeschwerden geht. Danach startet der passende strukturierte Fragebogen.",
    loading: "Fragebögen werden geladen ...",
    errorTitle: "Fragebögen konnten nicht geladen werden",
    retry: "Erneut versuchen",
    start: "Fragebogen starten",
    noteTitle: "Wichtiger Hinweis",
    noteText:
      "Dies ist keine Diagnose. Ihre Ärztin oder Ihr Arzt prüft alle Angaben und trifft die medizinische Entscheidung.",
    home: "Zur Startseite",
  },
  en: {
    eyebrow: "Patient questionnaire",
    title: "Which questionnaire would you like to answer?",
    lead:
      "Please choose whether today's questions are about knee or hip symptoms. The matching structured questionnaire will start afterwards.",
    loading: "Loading questionnaires ...",
    errorTitle: "Questionnaires could not be loaded",
    retry: "Try again",
    start: "Start questionnaire",
    noteTitle: "Important note",
    noteText:
      "This is not a diagnosis. Your doctor will review all information and make the medical decision.",
    home: "Go to homepage",
  },
};


function getText(value, language = "de", fallback = "") {
  if (!value) {
    return fallback;
  }

  if (typeof value === "string") {
    return value;
  }

  return value[language] || value.de || value.en || fallback;
}


function QuestionnaireChoiceCard({ questionnaire, language, startLabel }) {
  const title = getText(
    questionnaire.labels,
    language,
    questionnaire.indication
  );

  const description = getText(
    questionnaire.description,
    language,
    ""
  );

  const imageAlt = getText(
    questionnaire.image_alt,
    language,
    title
  );

  const target = `/patient/questionnaire/${questionnaire.slug || questionnaire.indication}`;

  return (
    <Link className="patient-info-card" to={target}>
      {questionnaire.image_path ? (
        <div className="joint-choice-image">
          <img
            src={api.assetUrl(questionnaire.image_path)}
            alt={imageAlt}
            loading="lazy"
          />
        </div>
      ) : (
        <div className="joint-choice-image joint-choice-fallback">
          {title.slice(0, 1)}
        </div>
      )}

      <h2>{title}</h2>

      {description ? <p>{description}</p> : null}

      <strong className="text-link">{startLabel} →</strong>
    </Link>
  );
}


export default function PatientStartPage() {
  const { language } = useLanguage();
  const text = copy[language] || copy.de;

  const [questionnaires, setQuestionnaires] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");

  async function loadQuestionnaires() {
    try {
      setStatus("loading");
      setError("");

      const data = await api.listQuestionnaires();

      setQuestionnaires(data.questionnaires || []);
      setStatus("success");
    } catch (err) {
      setError(err.message || text.errorTitle);
      setStatus("error");
    }
  }

  useEffect(() => {
    loadQuestionnaires();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AppShell compact hideNav>
      <section className="patient-card patient-start-card">
        <p className="eyebrow">{text.eyebrow}</p>

        <h1>{text.title}</h1>

        <p className="patient-start-lead">{text.lead}</p>

        {status === "loading" ? (
          <div className="patient-info-card">
            <h2>{text.loading}</h2>
          </div>
        ) : null}

        {status === "error" ? (
          <div className="patient-info-card">
            <h2>{text.errorTitle}</h2>
            <p>{error}</p>

            <button
              className="primary-button full-width"
              type="button"
              onClick={loadQuestionnaires}
            >
              {text.retry}
            </button>
          </div>
        ) : null}

        {status === "success" ? (
          <div className="patient-intro-grid">
            {questionnaires.map((questionnaire) => (
              <QuestionnaireChoiceCard
                key={questionnaire.id || questionnaire.indication}
                questionnaire={questionnaire}
                language={language}
                startLabel={text.start}
              />
            ))}

            <article className="patient-info-card">
              <span>!</span>
              <h2>{text.noteTitle}</h2>
              <p>{text.noteText}</p>
            </article>
          </div>
        ) : null}

        <div className="patient-start-actions">
          <Link className="secondary-button full-width" to="/home">
            {text.home}
          </Link>
        </div>
      </section>
    </AppShell>
  );
}