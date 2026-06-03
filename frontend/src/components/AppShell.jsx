import { useState } from "react";
import { Link, NavLink } from "react-router-dom";

import LanguageToggle from "./LanguageToggle.jsx";
import { useLanguage } from "../i18n/LanguageContext.jsx";

export default function AppShell({ children, compact = false }) {
  const { t } = useLanguage();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  function closeMenu() {
    setIsMenuOpen(false);
  }

  return (
    <div className={compact ? "app-shell app-shell-compact" : "app-shell"}>
      <header className="topbar">
        <Link className="brand" to="/home" onClick={closeMenu}>
          <img src="/klineus-logo.png" alt="Klineus" className="brand-logo" />
        </Link>

        <div className="topbar-actions">
          <nav className="desktop-nav" aria-label="Main navigation">
            <NavLink to="/product">{t("navProduct")}</NavLink>
            <NavLink to="/team">{t("navTeam")}</NavLink>
            <NavLink to="/contact">{t("navContact")}</NavLink>
            <NavLink to="/legal">{t("navLegal")}</NavLink>
          </nav>

          <div className="products-menu">
            <button
              className="products-menu-button"
              type="button"
              aria-expanded={isMenuOpen}
              onClick={() => setIsMenuOpen((current) => !current)}
            >
              {t("quickLinks")}
              <span aria-hidden="true">⌄</span>
            </button>

            {isMenuOpen ? (
              <div className="products-dropdown">
                <Link to="/product" onClick={closeMenu}>
                  <strong>{t("quickProductTitle")}</strong>
                  <span>{t("quickProductText")}</span>
                </Link>

                <Link to="/product#doctor-dashboard" onClick={closeMenu}>
                  <strong>{t("quickDoctorTitle")}</strong>
                  <span>{t("quickDoctorText")}</span>
                </Link>

                <Link to="/contact" onClick={closeMenu}>
                  <strong>{t("quickContactTitle")}</strong>
                  <span>{t("quickContactText")}</span>
                </Link>
              </div>
            ) : null}
          </div>

          <span className="prototype-pill">{t("prototypePill")}</span>
          <LanguageToggle />
        </div>
      </header>

      <main>{children}</main>
    </div>
  );
}