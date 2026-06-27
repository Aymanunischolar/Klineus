import { useEffect, useRef, useState } from "react";
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
  const menuRef = useRef(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    if (!isMenuOpen) {
      return undefined;
    }

    function handlePointerDown(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMenuOpen]);

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
                <div className="products-menu" ref={menuRef}>
                  <button
                    aria-expanded={isMenuOpen}
                    aria-haspopup="true"
                    className="products-menu-button"
                    type="button"
                    onClick={() => setIsMenuOpen((open) => !open)}
                  >
                    {t("quickLinks") || localText(language, "Menü", "Menu")}
                    <span aria-hidden="true">⌄</span>
                  </button>

                  {isMenuOpen ? (
                    <div className="products-dropdown" role="menu">
                      <NavLink
                        role="menuitem"
                        to="/product"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <strong>
                          {t("quickProductTitle") ||
                            localText(language, "Unser Produkt", "Our Product")}
                        </strong>
                        <span>
                          {t("quickProductText") ||
                            localText(
                              language,
                              "Erfahren Sie, was Klineus macht.",
                              "Learn what Klineus does.",
                            )}
                        </span>
                      </NavLink>

                      <NavLink
                        role="menuitem"
                        to="/team"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <strong>
                          {t("quickTeamTitle") ||
                            localText(language, "Über uns", "About Us")}
                        </strong>
                        <span>
                          {t("quickTeamText") ||
                            localText(
                              language,
                              "Mehr über das Klineus Team.",
                              "More about the Klineus team.",
                            )}
                        </span>
                      </NavLink>
                    </div>
                  ) : null}
                </div>
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