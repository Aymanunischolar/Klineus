import { Link, NavLink } from "react-router-dom";

import LanguageToggle from "./LanguageToggle.jsx";
import { useLanguage } from "../i18n/LanguageContext.jsx";

function localText(language, de, en) {
  return language === "en" ? en : de;
}

export default function AppShell({
  children,
  compact = false,
  hideNav = false,
}) {
  const { language, t } = useLanguage();

  const shellClassName = [
    "app-shell",
    compact ? "app-shell-compact" : "",
    hideNav ? "app-shell-hidden-nav" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={shellClassName}>
      {!hideNav ? (
        <header className="topbar">
          <Link className="brand" to="/home" aria-label="Klineus home">
            <img
              className="brand-logo"
              src="/klineus-logo.png"
              alt="Klineus"
            />
          </Link>

          {!compact ? (
            <div className="topbar-actions">
              <nav className="desktop-nav" aria-label="Main navigation">
                <NavLink to="/product">
                  {t("navProduct") ||
                    localText(language, "Unser Produkt", "Our Product")}
                </NavLink>

                <NavLink to="/team">
                  {t("navTeam") ||
                    localText(language, "Über uns", "About Us")}
                </NavLink>

                <NavLink to="/contact">
                  {t("navContact") ||
                    localText(language, "Kontakt", "Contact")}
                </NavLink>
              </nav>

              <LanguageToggle />
            </div>
          ) : null}
        </header>
      ) : null}

      <main className="main-content">{children}</main>

      {!compact && !hideNav ? (
        <footer className="site-footer">
          <Link to="/legal#terms">
            {localText(language, "Impressum", "Imprint")}
          </Link>

          <Link to="/legal#privacy">
            {localText(language, "Datenschutz", "Privacy")}
          </Link>
        </footer>
      ) : null}
    </div>
  );
}