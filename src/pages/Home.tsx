import { useEffect, useState, useMemo, useCallback } from "react";
import { Container, Row, Col, Form, ButtonGroup, ToggleButton, Spinner } from "react-bootstrap";
import * as d3 from "d3";
import LineChart, { SeriesData } from "../components/LineChart";
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

const Home = () => {
  const [data, setData] = useState<Athlete[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSports, setSelectedSports] = useState<Set<string>>(new Set());
  const [sortMetric, setSortMetric] = useState<SortMetric>("height");
  const [seasonFilter, setSeasonFilter] = useState<SeasonFilter>("all");
  const [medalOnly, setMedalOnly] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadAthleteData().then((cleaned) => {
      setData(cleaned);
      setLoading(false);
    });
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
      const yearlyHeights = byYear
        .map(([, arr]) => d3.mean(arr, (d) => d.Height as number))
        .filter((v): v is number => v != null);
      const yearlyWeights = byYear
        .map(([, arr]) => d3.mean(arr, (d) => d.Weight as number))
        .filter((v): v is number => v != null);
      const yearlyAges = byYear
        .map(([, arr]) => d3.mean(arr, (d) => d.Age as number))
        .filter((v): v is number => v != null);

      return {
        sport,
        season,
        stdHeight: d3.deviation(yearlyHeights) || 0,
        stdWeight: d3.deviation(yearlyWeights) || 0,
        stdAge: d3.deviation(yearlyAges) || 0,
      };
    });
  }, [data]);

  const sortedSports = useMemo(() => {
    let filtered = [...sportStats];

    if (seasonFilter === "summer") {
      filtered = filtered.filter((s) => s.season === "Summer" || s.season === "Both");
    } else if (seasonFilter === "winter") {
      filtered = filtered.filter((s) => s.season === "Winter" || s.season === "Both");
    }

    const key = sortMetric === "height" ? "stdHeight" : sortMetric === "weight" ? "stdWeight" : "stdAge";
    filtered.sort((a, b) => b[key] - a[key]);

    return filtered;
  }, [sportStats, seasonFilter, sortMetric]);

  const selectTop10 = useCallback(
    (season: SeasonFilter) => {
      setSeasonFilter(season);
      let filtered = [...sportStats];
      if (season === "summer") {
        filtered = filtered.filter((s) => s.season === "Summer" || s.season === "Both");
      } else if (season === "winter") {
        filtered = filtered.filter((s) => s.season === "Winter" || s.season === "Both");
      }
      const key = sortMetric === "height" ? "stdHeight" : sortMetric === "weight" ? "stdWeight" : "stdAge";
      filtered.sort((a, b) => b[key] - a[key]);
      setSelectedSports(new Set(filtered.slice(0, 10).map((s) => s.sport)));
    },
    [sportStats, sortMetric]
  );

  useEffect(() => {
    if (sortedSports.length > 0 && selectedSports.size === 0) {
      setSelectedSports(new Set(sortedSports.slice(0, 10).map((s) => s.sport)));
    }
  }, [sortedSports]);

  const isSingleSport = selectedSports.size === 1;

  const buildSeriesData = useCallback(
    (metric: "Height" | "Weight" | "Age", sex: "M" | "F", onlyMedal: boolean): SeriesData[] => {
      if (!data.length) return [];
      const filtered = data.filter((d) => {
        const inSport = selectedSports.has(d.Sport);
        const matchSex = d.Sex === sex;
        const matchMedal = onlyMedal ? d.Medal !== null : true;
        return inSport && matchSex && matchMedal;
      });

      const bySport = d3.groups(filtered, (d) => d.Sport);
      return bySport.map(([sport, athletes]) => {
        const byYear = d3.groups(athletes, (d) => d.Year as number);
        const values = byYear
          .map(([year, arr]) => {
            const vals = arr.map((d) => d[metric] as number).filter((v) => v != null);
            const avg = d3.mean(vals);
            return avg != null ? { year, value: avg } : null;
          })
          .filter((v): v is { year: number; value: number } => v != null)
          .sort((a, b) => a.year - b.year);
        return { sport, values };
      });
    },
    [data, selectedSports]
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

  const nonMedalHeightM = useMemo(() => (isSingleSport ? buildSeriesData("Height", "M", false) : []), [buildSeriesData, isSingleSport]);
  const nonMedalHeightF = useMemo(() => (isSingleSport ? buildSeriesData("Height", "F", false) : []), [buildSeriesData, isSingleSport]);
  const nonMedalWeightM = useMemo(() => (isSingleSport ? buildSeriesData("Weight", "M", false) : []), [buildSeriesData, isSingleSport]);
  const nonMedalWeightF = useMemo(() => (isSingleSport ? buildSeriesData("Weight", "F", false) : []), [buildSeriesData, isSingleSport]);
  const nonMedalAgeM = useMemo(() => (isSingleSport ? buildSeriesData("Age", "M", false) : []), [buildSeriesData, isSingleSport]);
  const nonMedalAgeF = useMemo(() => (isSingleSport ? buildSeriesData("Age", "F", false) : []), [buildSeriesData, isSingleSport]);

  const toggleSport = (sport: string) => {
    setSelectedSports((prev) => {
      const next = new Set(prev);
      if (next.has(sport)) next.delete(sport);
      else next.add(sport);
      return next;
    });
  };

  const filteredSportList = sortedSports.filter((s) =>
    s.sport.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <Container className="text-center mt-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Chargement des donnees...</p>
      </Container>
    );
  }

  return (
    <Container fluid className="px-4">
      <div className="data-container text-center mb-4">
        <h2>Evolution des caracteristiques physiques des medailles olympiques</h2>
        <p className="text-muted">
          Comparez l'evolution de la taille, du poids et de l'age moyen des medailles de 1896 a 2016 selon le sport.
        </p>
      </div>

      <Row>
        {/* Sidebar filters */}
        <Col lg={3}>
          <div className="data-container mb-3">
            <h5>Filtres</h5>

            {/* Medal toggle */}
            <Form.Check
              type="switch"
              id="medal-switch"
              label={medalOnly ? "Medailles seulement" : "Tous les athletes"}
              checked={medalOnly}
              onChange={() => setMedalOnly(!medalOnly)}
              className="mb-3"
            />

            {/* Quick season buttons */}
            <div className="mb-3">
              <small className="text-muted d-block mb-1">
                Top 10 par variation de {sortMetric === "height" ? "taille" : sortMetric === "weight" ? "poids" : "age"} :
              </small>
              <ButtonGroup size="sm" className="w-100">
                <ToggleButton
                  id="btn-all"
                  type="radio"
                  variant="outline-secondary"
                  value="all"
                  checked={seasonFilter === "all"}
                  onChange={() => selectTop10("all")}
                >
                  Tous
                </ToggleButton>
                <ToggleButton
                  id="btn-summer"
                  type="radio"
                  variant="outline-warning"
                  value="summer"
                  checked={seasonFilter === "summer"}
                  onChange={() => selectTop10("summer")}
                >
                  Ete
                </ToggleButton>
                <ToggleButton
                  id="btn-winter"
                  type="radio"
                  variant="outline-info"
                  value="winter"
                  checked={seasonFilter === "winter"}
                  onChange={() => selectTop10("winter")}
                >
                  Hiver
                </ToggleButton>
              </ButtonGroup>
            </div>

            {/* Sort metric */}
            <div className="mb-3">
              <small className="text-muted d-block mb-1">Trier par variation de :</small>
              <Form.Select
                size="sm"
                value={sortMetric}
                onChange={(e) => setSortMetric(e.target.value as SortMetric)}
              >
                <option value="height">Taille</option>
                <option value="weight">Poids</option>
                <option value="age">Age</option>
              </Form.Select>
            </div>

            {/* Search */}
            <Form.Control
              size="sm"
              type="text"
              placeholder="Rechercher un sport..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mb-2"
            />

            {/* Sport list */}
            <div style={{ maxHeight: "400px", overflowY: "auto" }}>
              {filteredSportList.map((s) => (
                <Form.Check
                  key={s.sport}
                  type="checkbox"
                  id={`sport-${s.sport}`}
                  label={
                    <span>
                      {s.sport}{" "}
                      <small className="text-muted">
                        ({sortMetric === "height"
                          ? s.stdHeight.toFixed(1)
                          : sortMetric === "weight"
                          ? s.stdWeight.toFixed(1)
                          : s.stdAge.toFixed(1)})
                      </small>
                    </span>
                  }
                  checked={selectedSports.has(s.sport)}
                  onChange={() => toggleSport(s.sport)}
                />
              ))}
            </div>
          </div>
        </Col>

        {/* Charts */}
        <Col lg={9}>
          <div className="data-container">
            {selectedSports.size === 0 ? (
              <p className="text-center text-muted mt-4">Selectionnez au moins un sport pour afficher les graphiques.</p>
            ) : (
              <>
                {/* Legend - at the top of charts area */}
                <div className="mb-3 p-2" style={{ backgroundColor: "#fafafa", borderRadius: 6, border: "1px solid #eee" }}>
                  <div className="d-flex flex-wrap align-items-center gap-3">
                    <small className="text-muted fw-bold me-2">Legende :</small>
                    {[...selectedSports].map((sport) => (
                      <div key={sport} className="d-flex align-items-center">
                        <div
                          style={{
                            width: 12,
                            height: 12,
                            backgroundColor: colorScale(sport),
                            borderRadius: 2,
                            marginRight: 4,
                            flexShrink: 0,
                          }}
                        />
                        <small>{sport}</small>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Height row */}
                <Row className="mb-3">
                  <Col md={6}>
                    <LineChart
                      data={heightM}
                      title="Taille moyenne — Hommes"
                      yLabel="Taille (cm)"
                      colorScale={colorScale}
                      nonMedalData={isSingleSport && medalOnly ? nonMedalHeightM : undefined}
                      showNonMedal={isSingleSport && medalOnly}
                    />
                  </Col>
                  <Col md={6}>
                    <LineChart
                      data={heightF}
                      title="Taille moyenne — Femmes"
                      yLabel="Taille (cm)"
                      colorScale={colorScale}
                      nonMedalData={isSingleSport && medalOnly ? nonMedalHeightF : undefined}
                      showNonMedal={isSingleSport && medalOnly}
                    />
                  </Col>
                </Row>

                {/* Weight row */}
                <Row className="mb-3">
                  <Col md={6}>
                    <LineChart
                      data={weightM}
                      title="Poids moyen — Hommes"
                      yLabel="Poids (kg)"
                      colorScale={colorScale}
                      nonMedalData={isSingleSport && medalOnly ? nonMedalWeightM : undefined}
                      showNonMedal={isSingleSport && medalOnly}
                    />
                  </Col>
                  <Col md={6}>
                    <LineChart
                      data={weightF}
                      title="Poids moyen — Femmes"
                      yLabel="Poids (kg)"
                      colorScale={colorScale}
                      nonMedalData={isSingleSport && medalOnly ? nonMedalWeightF : undefined}
                      showNonMedal={isSingleSport && medalOnly}
                    />
                  </Col>
                </Row>

                {/* Age row */}
                <Row>
                  <Col md={6}>
                    <LineChart
                      data={ageM}
                      title="Age moyen — Hommes"
                      yLabel="Age (ans)"
                      colorScale={colorScale}
                      nonMedalData={isSingleSport && medalOnly ? nonMedalAgeM : undefined}
                      showNonMedal={isSingleSport && medalOnly}
                    />
                  </Col>
                  <Col md={6}>
                    <LineChart
                      data={ageF}
                      title="Age moyen — Femmes"
                      yLabel="Age (ans)"
                      colorScale={colorScale}
                      nonMedalData={isSingleSport && medalOnly ? nonMedalAgeF : undefined}
                      showNonMedal={isSingleSport && medalOnly}
                    />
                  </Col>
                </Row>
              </>
            )}
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default Home;
