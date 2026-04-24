import { useEffect, useState, useMemo, useCallback } from "react";
import { Container, Row, Col, Form } from "react-bootstrap";
import * as d3 from "d3";
import LineChart, { SeriesData } from "../components/LineChart";
import OlympicLogo from "../components/OlympicLogo";
import { Athlete } from "../types/Athlete";
import { loadAthleteData } from "../utils/dataLoader";

type SortMetric = "height" | "weight" | "age";
type SeasonFilter = "all" | "summer" | "winter";

interface SportStats {
  sport: string;
  season: string;
  stdHeight: number;
  stdWeight: number;
  stdAge: number;
}

function getTopSports(
  sportStats: SportStats[],
  season: SeasonFilter,
  metric: SortMetric,
  limit = 10
) {
  let filtered = [...sportStats];

  if (season === "summer") {
    filtered = filtered.filter((s) => s.season === "Summer" || s.season === "Both");
  } else if (season === "winter") {
    filtered = filtered.filter((s) => s.season === "Winter" || s.season === "Both");
  }

  const metricKey =
    metric === "height" ? "stdHeight" : metric === "weight" ? "stdWeight" : "stdAge";

  return filtered
    .sort((a, b) => b[metricKey] - a[metricKey])
    .slice(0, limit)
    .map((s) => s.sport);
}

const Rings = () => <OlympicLogo className="rings-row" decorative />;

const SeasonToggle = ({
  value, current, label, accent, onClick,
}: {
  value: SeasonFilter; current: SeasonFilter; label: string; accent: string; onClick: () => void;
}) => {
  const active = value === current;
  return (
    <button
      className="oly-toggle"
      onClick={onClick}
      style={{
        borderColor: active ? accent : "var(--border-med)",
        background: active ? `${accent}1a` : "transparent",
        color: active ? accent : "var(--text)",
      }}
    >
      {label}
    </button>
  );
};

const MetricPill = ({
  label, active, accent, onClick,
}: {
  label: string; active: boolean; accent: string; onClick: () => void;
}) => (
  <button
    className="oly-pill"
    onClick={onClick}
    style={{
      borderColor: active ? accent : "var(--border-med)",
      background: active ? `${accent}22` : "transparent",
      color: active ? accent : "var(--text)",
    }}
  >
    {label}
  </button>
);

const Home = () => {
  const [data, setData] = useState<Athlete[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSports, setSelectedSports] = useState<Set<string>>(new Set());
  const [sortMetric, setSortMetric] = useState<SortMetric>("height");
  const [seasonFilter, setSeasonFilter] = useState<SeasonFilter>("all");
  const [medalOnly, setMedalOnly] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadAthleteData().then((cleaned) => { setData(cleaned); setLoading(false); });
  }, []);

  const sportStats = useMemo<SportStats[]>(() => {
    if (!data.length) return [];
    const medalData = data.filter((d) => d.Medal !== null);
    const sports = [...new Set(medalData.map((d) => d.Sport))];
    return sports.map((sport) => {
      const athletes = medalData.filter((d) => d.Sport === sport);
      const seasons = [...new Set(athletes.map((d) => d.Season))];
      const season = seasons.length === 1 ? seasons[0] : "Both";
      const byYear = d3.groups(athletes, (d) => d.Year as number);
      const yH = byYear.map(([, a]) => d3.mean(a, (d) => d.Height as number)).filter((v): v is number => v != null);
      const yW = byYear.map(([, a]) => d3.mean(a, (d) => d.Weight as number)).filter((v): v is number => v != null);
      const yA = byYear.map(([, a]) => d3.mean(a, (d) => d.Age as number)).filter((v): v is number => v != null);
      return { sport, season, stdHeight: d3.deviation(yH) || 0, stdWeight: d3.deviation(yW) || 0, stdAge: d3.deviation(yA) || 0 };
    });
  }, [data]);

  const sortedSports = useMemo(() => {
    return getTopSports(sportStats, seasonFilter, sortMetric, sportStats.length)
      .map((sport) => sportStats.find((entry) => entry.sport === sport))
      .filter((entry): entry is SportStats => entry != null);
  }, [sportStats, seasonFilter, sortMetric]);

  const selectTop10 = useCallback((season: SeasonFilter) => {
    setSeasonFilter(season);
    setSelectedSports(new Set(getTopSports(sportStats, season, sortMetric)));
  }, [sportStats, sortMetric]);

  useEffect(() => {
    if (sortedSports.length > 0 && selectedSports.size === 0)
      setSelectedSports(new Set(sortedSports.slice(0, 10).map((s) => s.sport)));
  }, [sortedSports, selectedSports.size]);

  useEffect(() => {
    if (!sportStats.length) return;
    setSelectedSports(new Set(getTopSports(sportStats, seasonFilter, sortMetric)));
  }, [sportStats, seasonFilter, sortMetric]);

  const isSingleSport = selectedSports.size === 1;

  const buildSeriesData = useCallback(
    (metric: "Height" | "Weight" | "Age", sex: "M" | "F", onlyMedal: boolean): SeriesData[] => {
      if (!data.length) return [];
      const filtered = data.filter((d) =>
        selectedSports.has(d.Sport) && d.Sex === sex && (onlyMedal ? d.Medal !== null : true)
      );
      return d3.groups(filtered, (d) => d.Sport).map(([sport, athletes]) => {
        const values = d3.groups(athletes, (d) => d.Year as number)
          .map(([year, arr]) => {
            const vals = arr.map((d) => d[metric] as number).filter((v) => v != null);
            const avg = d3.mean(vals);
            return avg != null ? { year, value: avg } : null;
          })
          .filter((v): v is { year: number; value: number } => v != null)
          .sort((a, b) => a.year - b.year);
        return { sport, values };
      });
    }, [data, selectedSports]
  );

  const colorScale = useMemo(() => {
    const allSports = sportStats.map((s) => s.sport).sort();
    return d3.scaleOrdinal<string, string>().domain(allSports).range(d3.schemeTableau10);
  }, [sportStats]);

  const heightM = useMemo(() => buildSeriesData("Height", "M", medalOnly), [buildSeriesData, medalOnly]);
  const heightF = useMemo(() => buildSeriesData("Height", "F", medalOnly), [buildSeriesData, medalOnly]);
  const weightM = useMemo(() => buildSeriesData("Weight", "M", medalOnly), [buildSeriesData, medalOnly]);
  const weightF = useMemo(() => buildSeriesData("Weight", "F", medalOnly), [buildSeriesData, medalOnly]);
  const ageM = useMemo(() => buildSeriesData("Age", "M", medalOnly), [buildSeriesData, medalOnly]);
  const ageF = useMemo(() => buildSeriesData("Age", "F", medalOnly), [buildSeriesData, medalOnly]);
  const nmHM = useMemo(() => isSingleSport ? buildSeriesData("Height", "M", false) : [], [buildSeriesData, isSingleSport]);
  const nmHF = useMemo(() => isSingleSport ? buildSeriesData("Height", "F", false) : [], [buildSeriesData, isSingleSport]);
  const nmWM = useMemo(() => isSingleSport ? buildSeriesData("Weight", "M", false) : [], [buildSeriesData, isSingleSport]);
  const nmWF = useMemo(() => isSingleSport ? buildSeriesData("Weight", "F", false) : [], [buildSeriesData, isSingleSport]);
  const nmAM = useMemo(() => isSingleSport ? buildSeriesData("Age", "M", false) : [], [buildSeriesData, isSingleSport]);
  const nmAF = useMemo(() => isSingleSport ? buildSeriesData("Age", "F", false) : [], [buildSeriesData, isSingleSport]);

  const toggleSport = (sport: string) => {
    setSelectedSports((prev) => {
      const next = new Set(prev);
      next.has(sport) ? next.delete(sport) : next.add(sport);
      return next;
    });
  };

  const metricKey = sortMetric === "height" ? "stdHeight" : sortMetric === "weight" ? "stdWeight" : "stdAge";
  const filtered = sortedSports.filter((s) => s.sport.toLowerCase().includes(searchTerm.toLowerCase()));

  const nmProps = (nm: SeriesData[]) => ({
    nonMedalData: isSingleSport && medalOnly ? nm : undefined,
    showNonMedal: isSingleSport && medalOnly,
  });

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
          <h1 className="page-hero-title">Évolution des profils physiques olympiques</h1>
          <p className="page-hero-sub">
            Comparez taille, poids et âge moyen des médaillés de 1896 à 2016, filtrés par sport et saison.
          </p>
        </div>

        <Row className="g-3">

          <Col lg={3}>
            <div className="panel">

              <span className="section-label">Affichage</span>
              <div className="medal-row mb-3">
                <span className="medal-row-label">
                  {medalOnly ? "Médaillés uniquement" : "Tous les athlètes"}
                </span>
                <Form.Check type="switch" id="medal-switch" checked={medalOnly}
                  onChange={() => setMedalOnly(!medalOnly)} style={{ margin: 0 }} />
              </div>

              <hr className="oly-divider" />

              <span className="section-label">
                Top 10 — variation de {sortMetric === "height" ? "taille" : sortMetric === "weight" ? "poids" : "âge"}
              </span>
              <div className="oly-toggle-group mb-3">
                <SeasonToggle value="all" current={seasonFilter} label="Tous" accent="#0085C7" onClick={() => selectTop10("all")} />
                <SeasonToggle value="summer" current={seasonFilter} label="Été" accent="#F4C300" onClick={() => selectTop10("summer")} />
                <SeasonToggle value="winter" current={seasonFilter} label="Hiver" accent="#8ecae6" onClick={() => selectTop10("winter")} />
              </div>

              <span className="section-label">Trier par</span>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
                <MetricPill label="Taille" active={sortMetric === "height"} accent="#0085C7" onClick={() => setSortMetric("height")} />
                <MetricPill label="Poids" active={sortMetric === "weight"} accent="#DF0024" onClick={() => setSortMetric("weight")} />
                <MetricPill label="Âge" active={sortMetric === "age"} accent="#009F6B" onClick={() => setSortMetric("age")} />
              </div>

              <hr className="oly-divider" />

              <input
                className="form-control mb-3"
                type="text"
                placeholder="Rechercher un sport…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />

              <div className="sport-list">
                {filtered.map((s) => {
                  const sel = selectedSports.has(s.sport);
                  const color = colorScale(s.sport);
                  return (
                    <div
                      key={s.sport}
                      className={`sport-row ${sel ? "selected" : ""}`}
                      onClick={() => toggleSport(s.sport)}
                    >
                      <div
                        className={`sport-tick ${sel ? "on" : ""}`}
                        style={sel ? { background: color, borderColor: color } : {}}
                      >
                        {sel && (
                          <svg width="8" height="8" viewBox="0 0 8 8">
                            <polyline points="1,4.5 3,6.5 7,1.5" stroke="#fff" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>
                      <span className="sport-name-text">{s.sport}</span>
                      <span className="sport-std-val">{s[metricKey].toFixed(1)}</span>
                    </div>
                  );
                })}
              </div>

              <div style={{ textAlign: "center", marginTop: 10, fontSize: "0.7rem", color: "var(--text)" }}>
                {selectedSports.size} sport{selectedSports.size !== 1 ? "s" : ""} sélectionné{selectedSports.size !== 1 ? "s" : ""}
              </div>
            </div>
          </Col>

          <Col lg={9}>
            <div className="panel">
              {selectedSports.size === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon" aria-hidden="true" />
                  <p style={{ fontSize: "0.88rem" }}>Sélectionnez au moins un sport pour afficher les graphiques.</p>
                </div>
              ) : (
                <>
                  <div className="legend-strip">
                    <span className="legend-strip-label">Légende</span>
                    {[...selectedSports].map((sport) => (
                      <div key={sport} className="legend-chip">
                        <div className="legend-swatch" style={{ background: colorScale(sport) }} />
                        {sport}
                      </div>
                    ))}
                  </div>

                  <p className="chart-group-label">Taille moyenne (cm)</p>
                  <Row className="mb-4 g-3">
                    <Col md={6}>
                      <LineChart data={heightM} title="Hommes" yLabel="Taille (cm)" colorScale={colorScale} medalOnly={medalOnly} seasonFilter={seasonFilter} {...nmProps(nmHM)} />
                    </Col>
                    <Col md={6}>
                      <LineChart data={heightF} title="Femmes" yLabel="Taille (cm)" colorScale={colorScale} medalOnly={medalOnly} seasonFilter={seasonFilter} {...nmProps(nmHF)} />
                    </Col>
                  </Row>

                  <p className="chart-group-label">Poids moyen (kg)</p>
                  <Row className="mb-4 g-3">
                    <Col md={6}>
                      <LineChart data={weightM} title="Hommes" yLabel="Poids (kg)" colorScale={colorScale} medalOnly={medalOnly} seasonFilter={seasonFilter} {...nmProps(nmWM)} />
                    </Col>
                    <Col md={6}>
                      <LineChart data={weightF} title="Femmes" yLabel="Poids (kg)" colorScale={colorScale} medalOnly={medalOnly} seasonFilter={seasonFilter} {...nmProps(nmWF)} />
                    </Col>
                  </Row>

                  <p className="chart-group-label">Âge moyen (ans)</p>
                  <Row className="g-3">
                    <Col md={6}>
                      <LineChart data={ageM} title="Hommes" yLabel="Âge (ans)" colorScale={colorScale} medalOnly={medalOnly} seasonFilter={seasonFilter} {...nmProps(nmAM)} />
                    </Col>
                    <Col md={6}>
                      <LineChart data={ageF} title="Femmes" yLabel="Âge (ans)" colorScale={colorScale} medalOnly={medalOnly} seasonFilter={seasonFilter} {...nmProps(nmAF)} />
                    </Col>
                  </Row>
                </>
              )}
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Home;
