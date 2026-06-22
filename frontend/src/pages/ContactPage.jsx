import { useEffect, useMemo, useState } from "react";

import AppShell from "../components/AppShell.jsx";
import { useLanguage } from "../i18n/LanguageContext.jsx";

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000"
).replace(/\/$/, "");

const fallbackCopy = {
  de: {
    eyebrow: "Kontakt",
    title: "Sprechen Sie mit uns über Klineus.",
    description:
      "Für Pilotprojekte, klinisches Feedback oder Partnerschaften erreichen Sie uns direkt per E-Mail.",
    formTitle: "Nachricht senden",
    formText:
      "Schreiben Sie uns kurz, worum es geht. Das Formular öffnet Ihr E-Mail-Programm mit einer vorbereiteten Nachricht.",
    name: "Name",
    email: "E-Mail",
    organization: "Organisation",
    message: "Nachricht",
    namePlaceholder: "Ihr Name",
    emailPlaceholder: "name@example.com",
    organizationPlaceholder: "Klinik, Praxis oder Organisation",
    messagePlaceholder: "Worum geht es?",
    submit: "Nachricht senden",
    directEmail: "Direkt per E-Mail",
    responseTime: "Antwortzeit",
    responseTimeText: "Wir melden uns so schnell wie möglich.",
    privacy:
      "Bitte senden Sie keine sensiblen Patientendaten über dieses Formular.",
    locationFallback: "Deutschland",
    useCaseFallback: "Knie- und Hüft-TEP-Dokumentationsunterstützung",
  },
  en: {
    eyebrow: "Contact",
    title: "Talk to us about Klineus.",
    description:
      "For pilots, clinical feedback or partnerships, you can reach us directly by email.",
    formTitle: "Send a message",
    formText:
      "Briefly tell us what this is about. The form opens your email client with a prepared message.",
    name: "Name",
    email: "Email",
    organization: "Organization",
    message: "Message",
    namePlaceholder: "Your name",
    emailPlaceholder: "name@example.com",
    organizationPlaceholder: "Clinic, practice or organization",
    messagePlaceholder: "How can we help?",
    submit: "Send message",
    directEmail: "Email directly",
    responseTime: "Response time",
    responseTimeText: "We will get back to you as soon as possible.",
    privacy: "Please do not send sensitive patient data through this form.",
    locationFallback: "Germany",
    useCaseFallback: "Knee and hip replacement documentation support",
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

function normalize(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");
}

function findItem(items, keys) {
  return items.find((item) => {
    const searchable = [
      item.id,
      item.icon,
      item.href,
      item.title?.de,
      item.title?.en,
      item.text?.de,
      item.text?.en,
    ]
      .filter(Boolean)
      .map(normalize)
      .join(" ");

    return keys.some((key) => searchable.includes(normalize(key)));
  });
}

function extractEmail(value, fallback = "contact@klineus.de") {
  const match = String(value || "").match(
    /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i,
  );

  return match?.[0] || fallback;
}

export default function ContactPage() {
  const { language } = useLanguage();
  const text = fallbackCopy[language] || fallbackCopy.de;

  const [page, setPage] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadPage() {
      try {
        const response = await fetch(`${API_BASE_URL}/patient/pages/contact`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Contact page could not be loaded.");
        }

        const data = await response.json();
        setPage(data);
      } catch (error) {
        if (error.name !== "AbortError") {
          setPage(null);
        }
      }
    }

    loadPage();

    return () => controller.abort();
  }, []);

  const content = useMemo(() => {
    const sections = page?.sections || [];
    const heroSection =
      sections.find((section) => section.type === "hero") || sections[0] || {};

    const allItems = sections.flatMap((section) => section.items || []);

    const emailItem = findItem(allItems, ["email", "e-mail", "mail"]);
    const locationItem = findItem(allItems, [
      "location",
      "standort",
      "germany",
      "deutschland",
    ]);
    const useCaseItem = findItem(allItems, [
      "medical",
      "use-case",
      "use case",
      "medizin",
      "anwendungsfall",
    ]);

    const emailText = getText(
      emailItem?.text || emailItem?.title,
      language,
      "contact@klineus.de",
    );

    const contactEmail = extractEmail(emailText);

    return {
      eyebrow: getText(heroSection.eyebrow, language, text.eyebrow),
      title: getText(heroSection.title || page?.title, language, text.title),
      description: getText(
        heroSection.subtitle || heroSection.body || page?.description,
        language,
        text.description,
      ),
      contactEmail,
      cards: [
        {
          label: getText(emailItem?.eyebrow, language, text.email),
          title: getText(emailItem?.title, language, text.directEmail),
          text: emailText,
          href: emailItem?.href || `mailto:${contactEmail}`,
        },
        {
          label: getText(locationItem?.eyebrow, language, text.locationFallback),
          title: getText(locationItem?.title, language, "Standort"),
          text: getText(locationItem?.text, language, text.locationFallback),
        },
        {
          label: getText(useCaseItem?.eyebrow, language, "Klineus"),
          title: getText(useCaseItem?.title, language, "Anwendungsfall"),
          text: getText(useCaseItem?.text, language, text.useCaseFallback),
        },
      ],
    };
  }, [language, page, text]);

  function handleSubmit(event) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    const name = formData.get("name") || "";
    const email = formData.get("email") || "";
    const organization = formData.get("organization") || "";
    const message = formData.get("message") || "";

    const subject = encodeURIComponent("Klineus contact request");

    const body = encodeURIComponent(
      [
        `Name: ${name}`,
        `Email: ${email}`,
        `Organization: ${organization}`,
        "",
        "Message:",
        message,
      ].join("\n"),
    );

    window.location.href = `mailto:${content.contactEmail}?subject=${subject}&body=${body}`;
  }

  return (
    <AppShell>
      <main className="contact-page-pro">
        <section className="contact-hero-pro">
          <div className="contact-hero-copy">
            <p className="eyebrow">{content.eyebrow}</p>

            <h1>{content.title}</h1>

            <p>{content.description}</p>

            <div className="contact-quick-actions">
              <a
                className="primary-button"
                href={`mailto:${content.contactEmail}`}
              >
                {text.directEmail}
              </a>
            </div>
          </div>

          <aside className="contact-response-card">
            <span>{text.responseTime}</span>

            <strong>{text.responseTimeText}</strong>

            <p>{text.privacy}</p>
          </aside>
        </section>

        <section className="contact-content-grid">
          <div className="contact-methods-grid">
            {content.cards.map((card) => {
              const cardContent = (
                <>
                  <span className="contact-card-label">{card.label}</span>

                  <h2>{card.title}</h2>

                  <p>{card.text}</p>
                </>
              );

              if (card.href) {
                return (
                  <a
                    className="contact-info-card"
                    href={card.href}
                    key={card.title}
                  >
                    {cardContent}
                  </a>
                );
              }

              return (
                <article className="contact-info-card" key={card.title}>
                  {cardContent}
                </article>
              );
            })}
          </div>

          <form className="contact-form-panel" onSubmit={handleSubmit}>
            <div className="contact-form-heading">
              <p className="eyebrow">Klineus</p>

              <h2>{text.formTitle}</h2>

              <p>{text.formText}</p>
            </div>

            <div className="contact-form-row">
              <label>
                <span>{text.name}</span>

                <input
                  name="name"
                  placeholder={text.namePlaceholder}
                  required
                  type="text"
                />
              </label>

              <label>
                <span>{text.email}</span>

                <input
                  name="email"
                  placeholder={text.emailPlaceholder}
                  required
                  type="email"
                />
              </label>
            </div>

            <label>
              <span>{text.organization}</span>

              <input
                name="organization"
                placeholder={text.organizationPlaceholder}
                type="text"
              />
            </label>

            <label>
              <span>{text.message}</span>

              <textarea
                name="message"
                placeholder={text.messagePlaceholder}
                required
                rows="5"
              />
            </label>

            <button className="primary-button" type="submit">
              {text.submit}
            </button>
          </form>
        </section>
      </main>
    </AppShell>
  );
}