import AppShell from "../components/AppShell.jsx";
import { useLanguage } from "../i18n/LanguageContext.jsx";

export default function ContactPage() {
  const { t } = useLanguage();

  function handleContactSubmit(event) {
    event.preventDefault();
    alert(t("contactPrototypeAlert"));
    event.currentTarget.reset();
  }

  return (
    <AppShell>
      <section className="contact-section">
        <div>
          <p className="eyebrow">{t("contactEyebrow")}</p>
          <h1>{t("contactTitle")}</h1>
          <p>{t("contactText")}</p>

          <div className="contact-details">
            <p>
              <strong>{t("contactEmail")}:</strong> contact@klineus.de
            </p>
            <p>
              <strong>{t("contactLocation")}:</strong> Deutschland
            </p>
            <p>
              <strong>{t("contactUseCase")}:</strong> {t("contactUseCaseValue")}
            </p>
          </div>
        </div>

        <form className="contact-form" onSubmit={handleContactSubmit}>
          <label>
            <span>{t("contactName")}</span>
            <input name="name" placeholder={t("contactNamePlaceholder")} required />
          </label>

          <label>
            <span>{t("email")}</span>
            <input name="email" type="email" placeholder="you@example.com" required />
          </label>

          <label>
            <span>{t("contactOrganization")}</span>
            <input name="organization" placeholder={t("contactOrganizationPlaceholder")} />
          </label>

          <label>
            <span>{t("contactMessage")}</span>
            <textarea
              name="message"
              rows="5"
              placeholder={t("contactMessagePlaceholder")}
              required
            />
          </label>

          <button className="primary-button" type="submit">
            {t("contactSubmit")}
          </button>
        </form>
      </section>
    </AppShell>
  );
}