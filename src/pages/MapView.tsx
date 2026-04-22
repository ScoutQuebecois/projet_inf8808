import { useEffect, useState, useMemo } from "react";
import { Container, Row, Col } from "react-bootstrap";
import * as d3 from "d3";
import Select from "react-select";
import ChoroplethMap, { CountryIMCData } from "../components/ChoroplethMap";
import OlympicLogo from "../components/OlympicLogo";
import TrendLineChart, { YearlyIMC } from "../components/TrendLineChart";
import { Athlete } from "../types/Athlete";
import { Option } from "../types/Options";
import { loadAthleteData } from "../utils/dataLoader";
import { nocToIso } from "../utils/nocMapping";

const Rings = () => <OlympicLogo className="rings-row" decorative />;

const MapView = () => {
  const [data, setData] = useState<Athlete[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSport, setSelectedSport] = useState<Option | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [sportSearch] = useState("");
  const [selectedCountryName, setSelectedCountryName] = useState<string | null>(null);

  useEffect(() => {
    loadAthleteData().then((cleaned) => { setData(cleaned); setLoading(false); });
  }, []);

  const sports = useMemo(() => {
    if (!data.length) return [];
    const medalData = data.filter((d) =>
      d.Medal !== null && d.Height != null && d.Weight != null && d.Age != null &&
      (d.Height as number) > 0 && (d.Weight as number) > 0 && (d.Age as number) > 0
    );
    return d3.groups(medalData, (d) => d.Sport)
      .filter(([, athletes]) =>
        d3.groups(athletes, (d) => d.Team).some(([, ca]) => new Set(ca.map((a) => a.Year)).size >= 2)
      )
      .map(([sport]) => sport).sort();
  }, [data]);

  useEffect(() => {
    if (sports.length > 0 && selectedSport === null)
      setSelectedSport({ value: sports[0], label: sports[0] });
  }, [sports]);

  const sportName = selectedSport?.value || "";

  const countryIMCData = useMemo<CountryIMCData[]>(() => {
    if (!data.length || !sportName) return [];
    const medalData = data.filter((d) =>
      d.Medal !== null && d.Sport === sportName &&
      d.Height != null && d.Weight != null && d.Age != null &&
      (d.Height as number) > 0 && (d.Weight as number) > 0 && (d.Age as number) > 0
    );
    const computeIMC = (arr: Athlete[]) =>
      d3.mean(arr.map((a) => {
        const h = (a.Height as number) / 100;
        const w = a.Weight as number;
        const age = a.Age as number;
        return (w / (h * h)) * (age / 25);
      }).filter((v) => isFinite(v))) || 0;

    return d3.groups(medalData, (d) => d.Team)
      .map(([country, athletes]) => {
        const byYear = d3.groups(athletes, (d) => d.Year as number).sort((a, b) => a[0] - b[0]);
        if (byYear.length < 2) return null;
        const delta = computeIMC(byYear[byYear.length - 1][1]) - computeIMC(byYear[0][1]);
        return { country, iso3: nocToIso(athletes[0].NOC), delta };
      })
      .filter((d): d is CountryIMCData => d !== null);
  }, [data, sportName]);

  const trendData = useMemo<YearlyIMC[]>(() => {
    if (!data.length || !selectedCountryName || !sportName) return [];
    const medalData = data.filter((d) =>
      d.Medal !== null && d.Sport === sportName && d.Team === selectedCountryName &&
      d.Height != null && d.Weight != null && d.Age != null &&
      (d.Height as number) > 0 && (d.Weight as number) > 0 && (d.Age as number) > 0
    );
    return d3.groups(medalData, (d) => d.Year as number).sort((a, b) => a[0] - b[0])
      .map(([year, athletes]) => ({
        year,
        imc: d3.mean(athletes.map((a) => {
          const h = (a.Height as number) / 100;
          return (a.Weight as number) / (h * h) * ((a.Age as number) / 25);
        })) || 0,
      }));
  }, [data, selectedCountryName, sportName]);

  const handleCountryClick = (country: string, _iso3: string) => {
    setSelectedCountryName(country);
    setSelectedCountry(country);
  };

  if (loading) return (
    <div className="loading-screen">
      <Rings />
      <div style={{ width: 36, height: 36, border: "3px solid rgba(255,255,255,0.1)", borderTopColor: "#0085C7", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <p className="loading-label">Chargement des données</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  const LEGEND_ITEMS = [
    { color: "#e8751a", border: "1px solid rgba(0,0,0, 1)", label: "Variation négative (IMC ajusté en baisse)" },
    { color: "#ffffff", border: "1px solid rgba(0,0,0, 1)", label: "Aucune variation" },
    { color: "#4a90d9", border: "1px solid rgba(0,0,0, 1)", label: "Variation positive (IMC ajusté en hausse)" },
    { color: "#E1E8F0", border: "1px solid rgba(0,0,0, 1)", label: "Données insuffisantes" },
  ];

  return (
    <div className="page-wrapper">
      <Container fluid style={{ maxWidth: 1400, padding: "0 20px" }}>

        <div className="page-hero">
          <Rings />
          <h1 className="page-hero-title">Évolution du profil physique par nation</h1>
          <p className="page-hero-sub">
            Explorez comment l'IMC ajusté par l'âge des médaillés a évolué entre la première et la dernière édition des Jeux pour chaque pays. Cliquez sur un pays pour l'évolution détaillée.
          </p>
        </div>

        <Row className="g-3">

          <Col lg={3}>
            <div className="panel">
              <span className="section-label">Sport</span>
              <div className="mb-4">
                <Select
                  classNamePrefix="rs"
                  className="olympic-select"
                  options={sports.filter((s) => s.toLowerCase().includes(sportSearch.toLowerCase())).map((s) => ({ value: s, label: s }))}
                  placeholder="Choisir un sport"
                  isSearchable
                  onChange={(opt) => {
                    setSelectedSport(opt as Option | null);
                    setSelectedCountry(null);
                    setSelectedCountryName(null);
                  }}
                  value={selectedSport}
                />
              </div>

              <hr className="oly-divider" />

              <span className="section-label">Lecture de la carte</span>
              <p style={{ fontSize: "0.78rem", color: "var(--text)", marginBottom: 12, marginTop: 6 }}>
                Variation de l'IMC ajusté (IMC × âge / 25) entre la première et la dernière participation.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {LEGEND_ITEMS.map(({ color, border, label }) => (
                  <div key={label} className="legend-card">
                    <div className="legend-dot-square" style={{ background: color, border: border || "none" }} />
                    <span style={{ fontSize: "0.78rem" }}>{label}</span>
                  </div>
                ))}
              </div>

              {selectedCountryName && (
                <>
                  <hr className="oly-divider" />
                  <span className="section-label">Pays sélectionné</span>
                  <div style={{
                    background: "var(--bg-2)",
                    border: "1px solid var(--border-med)",
                    borderRadius: "var(--radius)",
                    padding: "10px 14px",
                    fontSize: "0.85rem",
                    color: "var(--text)",
                    fontWeight: 500,
                  }}>
                    {selectedCountryName}
                  </div>
                  <button
                    onClick={() => { setSelectedCountry(null); setSelectedCountryName(null); }}
                    style={{
                      width: "100%", marginTop: 8, padding: "6px 0",
                      borderRadius: "var(--radius-sm)", border: "1.5px solid var(--border-med)",
                      background: "transparent", color: "var(--text)",
                      fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.06em",
                      textTransform: "uppercase", cursor: "pointer",
                      transition: "var(--transition)",
                    }}
                  >
                    Désélectionner
                  </button>
                </>
              )}
            </div>
          </Col>

          <Col lg={9}>
            <div className="panel mb-3">
              {countryIMCData.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon" aria-hidden="true" />
                  <p style={{ fontSize: "0.88rem" }}>Aucune donnée disponible pour ce sport.</p>
                </div>
              ) : (
                <ChoroplethMap
                  data={countryIMCData}
                  onCountryClick={handleCountryClick}
                  selectedCountry={selectedCountry}
                  sportName={sportName}
                />
              )}
            </div>

            {selectedCountryName && trendData.length > 0 && (
              <div className="panel">
                <p className="chart-group-label" style={{ marginBottom: 16 }}>
                  Évolution de l'IMC ajusté — {selectedCountryName}
                </p>
                <TrendLineChart data={trendData} country={selectedCountryName} sport={sportName} />
              </div>
            )}

            {selectedCountryName && trendData.length === 0 && (
              <div className="panel">
                <div className="empty-state" style={{ minHeight: 120 }}>
                  <p style={{ fontSize: "0.85rem" }}>
                    Données insuffisantes pour {selectedCountryName} dans ce sport.
                  </p>
                </div>
              </div>
            )}
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default MapView;
