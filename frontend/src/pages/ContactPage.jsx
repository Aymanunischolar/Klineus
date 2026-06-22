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
        `Name: ${form.name}`,
        `Organisation: ${form.organization}`,
        "",
        "Nachricht:",
        form.message,
      ].join("\n"),
    );

    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
  }

  return (
    <AppShell>
      <main className="contact-page-pro">
        <section className="contact-hero-pro">
          <div className="contact-hero-copy-pro">
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

          <aside className="contact-info-card-pro">
            <p className="eyebrow">
              {localText(language, "Direkter Kontakt", "Direct contact")}
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

        <section className="contact-grid-pro">
          <article className="contact-detail-card-pro">
            <span>{localText(language, "E-Mail", "Email")}</span>
            <strong>{CONTACT_EMAIL}</strong>
          </article>

          <article className="contact-detail-card-pro">
            <span>{localText(language, "Standort", "Location")}</span>
            <strong>{localText(language, "Deutschland", "Germany")}</strong>
          </article>

          <article className="contact-detail-card-pro">
            <span>{localText(language, "Anliegen", "Topic")}</span>
            <strong>
              {localText(
                language,
                "Pilotierung und Partnerschaft",
                "Pilots and partnerships",
              )}
            </strong>
          </article>
        </section>

        <section className="contact-form-section-pro">
          <div className="section-heading">
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

          <form className="contact-form-pro" onSubmit={handleSubmit}>
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
                rows={6}
                value={form.message}
                onChange={(event) =>
                  updateField("message", event.target.value)
                }
              />
            </label>

            <div className="contact-form-actions">
              <button className="primary-button" type="submit">
                {localText(language, "E-Mail vorbereiten", "Prepare email")}
              </button>
            </div>
          </form>
        </section>
      </main>
    </AppShell>
  );
}