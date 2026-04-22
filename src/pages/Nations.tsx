import { useEffect, useState, useMemo } from "react";
import { Container, Row, Col } from "react-bootstrap";
import * as d3 from "d3";
import Select from "react-select";
import ScatterPlot, { BubbleData } from "../components/ScatterPlot";
import OlympicLogo from "../components/OlympicLogo";
import { Athlete } from "../types/Athlete";
import { Option } from "../types/Options";
import { loadAthleteData } from "../utils/dataLoader";

const Rings = () => <OlympicLogo className="rings-row" decorative />;

const Nations = () => {
  const [data, setData] = useState<Athlete[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSport, setSelectedSport] = useState<Option | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<Option | null>(null);
  const [sexFilter, setSexFilter] = useState<string>("");
  const [sportSearch] = useState("");
  const [countrySearch] = useState("");

  useEffect(() => {
    loadAthleteData().then((cleaned) => { setData(cleaned); setLoading(false); });
  }, []);

  const sports = useMemo(() => {
    if (!data.length) return [];
    return [...new Set(data.filter((d) => d.Medal !== null).map((d) => d.Sport))].sort();
  }, [data]);

  const countries = useMemo(() => {
    if (!data.length) return [];
    return [...new Set(data.filter((d) => d.Medal !== null).map((d) => d.Team))].sort();
  }, [data]);

  const bubbleData = useMemo<BubbleData[]>(() => {
    if (!data.length) return [];
    const medalData = data.filter((d) => {
      return d.Medal !== null &&
        (sexFilter === "" || d.Sex === sexFilter) &&
        d.Height != null && d.Weight != null && d.Age != null;
    });
    const grouped = d3.groups(medalData, (d) => d.Team, (d) => d.Sport);
    const countryDominant = new Map<string, string>();
    grouped.forEach(([country, sportGroups]) => {
      let maxMedals = 0; let dominantSport = "";
      sportGroups.forEach(([sport, athletes]) => {
        if (athletes.length > maxMedals) { maxMedals = athletes.length; dominantSport = sport; }
      });
      countryDominant.set(country, dominantSport);
    });
    const result: BubbleData[] = [];
    grouped.forEach(([country, sportGroups]) => {
      sportGroups.forEach(([sport, athletes]) => {
        const avgHeight = d3.mean(athletes, (d) => d.Height as number) || 0;
        const avgWeight = d3.mean(athletes, (d) => d.Weight as number) || 0;
        const avgAge = d3.mean(athletes, (d) => d.Age as number) || 0;
        const medalCount = athletes.length;
        if (avgHeight === 0 || avgWeight === 0) return;
        result.push({ country, sport, avgHeight, avgWeight, avgAge, medalCount, isDominant: countryDominant.get(country) === sport });
      });
    });
    return result;
  }, [data, sexFilter]);

  const selectStyles = {
    classNamePrefix: "rs",
    className: "olympic-select",
  };

  if (loading) return (
    <div className="loading-screen">
      <Rings />
      <div style={{ width: 36, height: 36, border: "3px solid rgba(255,255,255,0.1)", borderTopColor: "#0085C7", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <p className="loading-label">Chargement des données</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div className="page-wrapper">
      <Container fluid style={{ maxWidth: 1400, padding: "0 20px" }}>

        <div className="page-hero">
          <Rings />
          <h1 className="page-hero-title">Profil physique des médaillés par nation</h1>
          <p className="page-hero-sub">
            Comparez les caractéristiques physiques moyennes selon les nations et les sports. La taille des bulles reflète le nombre de médailles. Les bulles bleues indiquent le sport dominant d'une nation.
          </p>
        </div>

        <Row className="g-3">

          <Col lg={3}>
            <div className="panel">
              <span className="section-label">Sport</span>
              <div className="mb-3">
                <Select
                  {...selectStyles}
                  options={sports.filter((s) => s.toLowerCase().includes(sportSearch.toLowerCase())).map((s) => ({ value: s, label: s }))}
                  placeholder="Tous les sports"
                  isClearable isSearchable
                  onChange={(opt) => setSelectedSport(opt as Option | null)}
                  value={selectedSport}
                />
              </div>

              <span className="section-label">Pays</span>
              <div className="mb-3">
                <Select
                  {...selectStyles}
                  options={countries.filter((c) => c.toLowerCase().includes(countrySearch.toLowerCase())).map((c) => ({ value: c, label: c }))}
                  placeholder="Tous les pays"
                  isClearable isSearchable
                  onChange={(opt) => setSelectedCountry(opt as Option | null)}
                  value={selectedCountry}
                />
              </div>

              <span className="section-label">Sexe</span>
              <div className="sex-pills mb-4">
                {[
                  { v: "", label: "Tous", cls: "active-all" },
                  { v: "M", label: "Hommes", cls: "active-M" },
                  { v: "F", label: "Femmes", cls: "active-F" },
                ].map(({ v, label, cls }) => (
                  <button
                    key={v}
                    className={`sex-pill ${sexFilter === v ? cls : ""}`}
                    onClick={() => setSexFilter(v)}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <hr className="oly-divider" />

              <span className="section-label">Lecture du graphique</span>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 6 }}>
                <div className="legend-card">
                  <div className="legend-dot-circle" style={{ background: "#0085C7" }} />
                  Sport dominant de la nation
                </div>
                <div className="legend-card">
                  <div className="legend-dot-circle" style={{ background: "rgba(255,255,255,0.2)" }} />
                  Autre sport
                </div>
                <p style={{ fontSize: "0.77rem", color: "var(--text)", marginTop: 4, marginBottom: 0 }}>
                  La taille du cercle est proportionnelle au nombre de médailles.
                </p>
              </div>
            </div>
          </Col>

          <Col lg={9}>
            <div className="panel">
              {bubbleData.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon" aria-hidden="true" />
                  <p style={{ fontSize: "0.88rem" }}>Aucune donnée pour les critères sélectionnés.</p>
                </div>
              ) : (
                <ScatterPlot
                  data={bubbleData}
                  highlightSport={selectedSport?.value || null}
                  highlightCountry={selectedCountry?.value || null}
                />
              )}
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Nations;
