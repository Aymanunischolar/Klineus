import { useEffect, useRef, useState } from "react";
import { Link, NavLink } from "react-router-dom";

import LanguageToggle from "./LanguageToggle.jsx";
import { useLanguage } from "../i18n/LanguageContext.jsx";

export default function AppShell({ children, compact = false, hideNav = false }) {
  const { t } = useLanguage();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  function closeMenu() {
    setIsMenuOpen(false);
  }

  useEffect(() => {
    function handleClickOutside(event) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <div className={compact ? "app-shell app-shell-compact" : "app-shell"}>
      <header className="topbar">
        <Link className="brand" to="/home" onClick={closeMenu} aria-label="Klineus home">
          <img src="/klineus-logo.png" alt="Klineus" className="brand-logo" />
        </Link>

        <div className="topbar-actions">
          {!hideNav ? (
            <>
              <nav className="desktop-nav" aria-label="Main navigation">
                <NavLink to="/product">{t("navProduct")}</NavLink>
                <NavLink to="/team">{t("navTeam")}</NavLink>
                <NavLink to="/contact">{t("navContact")}</NavLink>
                <NavLink to="/legal">{t("navLegal")}</NavLink>
              </nav>

              <div className="products-menu" ref={menuRef}>
                <button
                  className="products-menu-button"
                  type="button"
                  aria-expanded={isMenuOpen}
                  aria-haspopup="menu"
                  onClick={() => setIsMenuOpen((current) => !current)}
                >
                  {t("quickLinks")}
                  <span aria-hidden="true">⌄</span>
                </button>

                {isMenuOpen ? (
                  <div className="products-dropdown" role="menu">
                    <Link to="/product" onClick={closeMenu} role="menuitem">
                      <strong>{t("quickProductTitle")}</strong>
                      <span>{t("quickProductText")}</span>
                    </Link>

                    <Link to="/product#doctor-dashboard" onClick={closeMenu} role="menuitem">
                      <strong>{t("quickDoctorTitle")}</strong>
                      <span>{t("quickDoctorText")}</span>
                    </Link>

                    <Link to="/contact" onClick={closeMenu} role="menuitem">
                      <strong>{t("quickContactTitle")}</strong>
                      <span>{t("quickContactText")}</span>
                    </Link>
                  </div>
                ) : null}
              </div>
            </>
          ) : null}

          <span className="prototype-pill">{t("prototypePill")}</span>
          <LanguageToggle />
        </div>
      </header>

      <main className="main-content">{children}</main>
    </div>
  );
}