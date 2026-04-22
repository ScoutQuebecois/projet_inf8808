import { useState } from "react";
import { NavLink } from "react-router-dom";
import OlympicLogo from "./OlympicLogo";

const links = [
  { to: "/", label: "Évolution" },
  { to: "/nations", label: "Nations" },
  { to: "/user", label: "Me comparer" },
  { to: "/map", label: "Carte mondiale" },
];

const HeaderBar = () => {
  const [isOpen, setIsOpen] = useState(false);

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
