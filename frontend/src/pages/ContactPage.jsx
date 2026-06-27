import { useState } from "react";

import AppShell from "../components/AppShell.jsx";
import { useLanguage } from "../i18n/LanguageContext.jsx";

const CONTACT_EMAIL = "contact@klineus.de";

function localText(language, de, en) {
  return language === "en" ? en : de;
}

export default function ContactPage() {
  const { language } = useLanguage();

  const [form, setForm] = useState({
    name: "",
    organization: "",
    message: "",
  });

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();

    const subject = encodeURIComponent("Klineus Kontaktanfrage");

    const body = encodeURIComponent(
      [
        `Name: ${form.name || "-"}`,
        `Organisation: ${form.organization || "-"}`,
        "",
        "Nachricht:",
        form.message || "-",
      ].join("\n"),
    );

    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
  }

  const contactDetails = [
    {
      label: localText(language, "E-Mail", "Email"),
      value: CONTACT_EMAIL,
      text: localText(
        language,
        "Für allgemeine Rückfragen und Kontaktanfragen.",
        "For general questions and contact requests.",
      ),
    },
    {
      label: localText(language, "Standort", "Location"),
      value: localText(language, "Deutschland", "Germany"),
      text: localText(
        language,
        "Klineus ist für medizinische Einrichtungen in Deutschland vorbereitet.",
        "Klineus is prepared for medical organizations in Germany.",
      ),
    },
    {
      label: localText(language, "Anliegen", "Topic"),
      value: localText(
        language,
        "Pilotierung und Partnerschaft",
        "Pilots and partnerships",
      ),
      text: localText(
        language,
        "Kontaktieren Sie uns für Pilotprojekte, Kooperationen oder Fragen.",
        "Contact us for pilots, partnerships or questions.",
      ),
    },
  ];

  return (
    <AppShell>
      <main className="contact-clean-page">
        <section className="contact-clean-hero">
          <div className="contact-clean-hero-copy">
            <p className="eyebrow">
              {localText(language, "Kontakt", "Contact")}
            </p>

            <h1>
              {localText(
                language,
                "Sprechen Sie mit uns über Klineus.",
                "Talk to us about Klineus.",
              )}
            </h1>

            <p>
              {localText(
                language,
                "Für Pilotprojekte, Partnerschaften oder allgemeine Rückfragen erreichen Sie uns direkt per E-Mail.",
                "For pilots, partnerships or general questions, you can reach us directly by email.",
              )}
            </p>
          </div>

          <aside className="contact-clean-direct-card">
            <p className="eyebrow">
              {localText(language, "Direkter Kontakt", "Direct Contact")}
            </p>

            <h2>{CONTACT_EMAIL}</h2>

            <p>
              {localText(
                language,
                "Schreiben Sie uns eine kurze Nachricht. Wir melden uns so bald wie möglich zurück.",
                "Send us a short message. We will get back to you as soon as possible.",
              )}
            </p>

            <a className="primary-button" href={`mailto:${CONTACT_EMAIL}`}>
              {localText(language, "E-Mail senden", "Send email")}
            </a>
          </aside>
        </section>

        <section className="contact-clean-details">
          {contactDetails.map((detail) => (
            <article className="contact-clean-detail-card" key={detail.label}>
              <span>{detail.label}</span>
              <strong>{detail.value}</strong>
              <p>{detail.text}</p>
            </article>
          ))}
        </section>

        <section className="contact-clean-form-section">
          <div className="contact-clean-form-copy">
            <p className="eyebrow">
              {localText(language, "Nachricht", "Message")}
            </p>

            <h2>
              {localText(
                language,
                "Kontaktanfrage vorbereiten.",
                "Prepare a contact request.",
              )}
            </h2>

            <p>
              {localText(
                language,
                "Das Formular öffnet Ihr E-Mail-Programm mit einer vorbereiteten Nachricht.",
                "The form opens your email app with a prepared message.",
              )}
            </p>
          </div>

          <form className="contact-clean-form" onSubmit={handleSubmit}>
            <label>
              <span>{localText(language, "Name", "Name")}</span>

              <input
                autoComplete="name"
                placeholder={localText(
                  language,
                  "Ihr Name",
                  "Your name",
                )}
                type="text"
                value={form.name}
                onChange={(event) => updateField("name", event.target.value)}
              />
            </label>

            <label>
              <span>
                {localText(language, "Organisation", "Organization")}
              </span>

              <input
                autoComplete="organization"
                placeholder={localText(
                  language,
                  "Klinik, Praxis oder Organisation",
                  "Clinic, practice or organization",
                )}
                type="text"
                value={form.organization}
                onChange={(event) =>
                  updateField("organization", event.target.value)
                }
              />
            </label>

            <label>
              <span>{localText(language, "Nachricht", "Message")}</span>

              <textarea
                placeholder={localText(
                  language,
                  "Worum geht es?",
                  "How can we help?",
                )}
                rows={7}
                value={form.message}
                onChange={(event) =>
                  updateField("message", event.target.value)
                }
              />
            </label>

            <div className="contact-clean-actions">
              <button className="primary-button" type="submit">
                {localText(language, "E-Mail vorbereiten", "Prepare email")}
              </button>

              <p>
                {localText(
                  language,
                  "Es werden keine Daten auf dieser Seite gespeichert. Die Nachricht wird über Ihr E-Mail-Programm vorbereitet.",
                  "No data is stored on this page. The message is prepared through your email app.",
                )}
              </p>
            </div>
          </form>
        </section>
      </main>
    </AppShell>
  );
}