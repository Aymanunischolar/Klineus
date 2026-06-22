import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import LanguageToggle from "./LanguageToggle.jsx";
import { useLanguage } from "../i18n/LanguageContext.jsx";

export default function AppShell({ children, compact = false, hideNav = false }) {
  const { language } = useLanguage();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const isEnglish = language === "en";

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
        <Link
          className="brand"
          to="/home"
          onClick={closeMenu}
          aria-label="Klineus home"
        >
          <img src="/klineus-logo.png" alt="Klineus" className="brand-logo" />
        </Link>

        <div className="topbar-actions">
          {!hideNav ? (
            <div className="products-menu" ref={menuRef}>
              <button
                className="products-menu-button"
                type="button"
                aria-expanded={isMenuOpen}
                aria-haspopup="menu"
                onClick={() => setIsMenuOpen((current) => !current)}
              >
                {isEnglish ? "Menu" : "Menü"}
                <span aria-hidden="true">⌄</span>
              </button>

              {isMenuOpen ? (
                <div className="products-dropdown" role="menu">
                  <Link to="/product" onClick={closeMenu} role="menuitem">
                    <strong>{isEnglish ? "Our Product" : "Unser Produkt"}</strong>
                    <span>
                      {isEnglish
                        ? "Learn how Klineus works."
                        : "Erfahren Sie, wie Klineus funktioniert."}
                    </span>
                  </Link>

                  <Link to="/team" onClick={closeMenu} role="menuitem">
                    <strong>{isEnglish ? "About Us" : "Über uns"}</strong>
                    <span>
                      {isEnglish
                        ? "Learn more about Klineus."
                        : "Mehr über Klineus erfahren."}
                    </span>
                  </Link>
                </div>
              ) : null}
            </div>
          ) : null}

          <LanguageToggle />
        </div>
      </header>

      <main className="main-content">{children}</main>

      {!hideNav ? (
        <footer className="site-footer">
          <Link to="/legal#terms">
            {isEnglish ? "Imprint" : "Impressum"}
          </Link>

          <Link to="/legal#privacy">
            {isEnglish ? "Privacy" : "Datenschutz"}
          </Link>
        </footer>
      ) : null}
    </div>
  );
}