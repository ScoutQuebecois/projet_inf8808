import { useState } from "react";
import { NavLink } from "react-router-dom";
import OlympicLogo from "./OlympicLogo";
import { useAltTextVisibility } from "./AltTextContext";

const links = [
  { to: "/", label: "Évolution" },
  { to: "/nations", label: "Nations" },
  { to: "/map", label: "Carte mondiale" },
  { to: "/user", label: "Me comparer" },
];

const HeaderBar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { showAltText, setShowAltText } = useAltTextVisibility();

  return (
    <nav className="oly-nav" aria-label="Navigation principale">
      <div className="oly-nav-inner">
        <NavLink to="/" className="brand-mark" onClick={() => setIsOpen(false)}>
          <OlympicLogo className="mini-rings" decorative />
          <span className="brand-copy">
            <span className="brand-title">Le Miroir Olympique</span>
            <span className="brand-subtitle">Data stories des Jeux</span>
          </span>
        </NavLink>

        <button
          className="nav-menu-button"
          type="button"
          aria-label="Ouvrir le menu"
          aria-expanded={isOpen}
          onClick={() => setIsOpen((open) => !open)}
        >
          <span />
          <span />
          <span />
        </button>

        <div className={`nav-links ${isOpen ? "open" : ""}`}>
          <label className="nav-alt-toggle">
            <input
              type="checkbox"
              checked={showAltText}
              onChange={(event) => setShowAltText(event.target.checked)}
            />
            <span>Alt text</span>
          </label>
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className="nav-link-item"
              onClick={() => setIsOpen(false)}
            >
              {link.label}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default HeaderBar;
