import { useEffect, useState, useMemo } from "react";
import { Container, Row, Col, Spinner, Form } from "react-bootstrap";
import * as d3 from "d3";
import Select from "react-select";
import ScatterPlot, { BubbleData } from "../components/ScatterPlot";
import { Athlete } from "../types/Athlete";
import { Option } from "../types/Options";
import { loadAthleteData } from "../utils/dataLoader";

const Nations = () => {
  const [data, setData] = useState<Athlete[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSport, setSelectedSport] = useState<Option | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<Option | null>(null);
  const [sexFilter, setSexFilter] = useState<string>("");
  const [sportSearch, setSportSearch] = useState("");
  const [countrySearch, setCountrySearch] = useState("");

  useEffect(() => {
    loadAthleteData().then((cleaned) => {
      setData(cleaned);
      setLoading(false);
    });
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
      const hasMedal = d.Medal !== null;
      const matchSex = sexFilter === "" || d.Sex === sexFilter;
      const hasPhysical =
        d.Height != null && d.Weight != null && d.Age != null;
      return hasMedal && matchSex && hasPhysical;
    });

    const grouped = d3.groups(medalData, (d) => d.Team, (d) => d.Sport);

    const countryDominant = new Map<string, string>();
    grouped.forEach(([country, sportGroups]) => {
      let maxMedals = 0;
      let dominantSport = "";
      sportGroups.forEach(([sport, athletes]) => {
        if (athletes.length > maxMedals) {
          maxMedals = athletes.length;
          dominantSport = sport;
        }
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

        result.push({
          country,
          sport,
          avgHeight,
          avgWeight,
          avgAge,
          medalCount,
          isDominant: countryDominant.get(country) === sport,
        });
      });
    });

    return result;
  }, [data, sexFilter]);

  if (loading) {
    return (
      <Container className="text-center mt-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Chargement des données...</p>
      </Container>
    );
  }

  return (
    <Container fluid className="px-4">
      <div className="data-container text-center mb-4">
        <h2>Profil physique des médaillés par nation</h2>
        <p className="text-muted">
          Comparez les caractéristiques physiques moyennes des médaillés selon les nations et les sports.
          La taille des bulles est proportionnelle au nombre de médaillés. Les bulles bleues indiquent le sport dominant d'une nation.
        </p>
      </div>

      <Row>
        <Col lg={3}>
          <div className="data-container mb-3">
            <h5>Filtres</h5>

            <Form.Label className="mt-2">Sport</Form.Label>
            <Form.Control
              size="sm"
              type="text"
              placeholder="Rechercher un sport..."
              value={sportSearch}
              onChange={(e) => setSportSearch(e.target.value)}
              className="mb-1"
            />
            <Select
              options={sports
                .filter((s) => s.toLowerCase().includes(sportSearch.toLowerCase()))
                .map((s) => ({ value: s, label: s }))}
              placeholder="Tous les sports"
              isClearable
              isSearchable
              onChange={(opt) => setSelectedSport(opt as Option | null)}
              value={selectedSport}
            />

            <Form.Label className="mt-3">Pays</Form.Label>
            <Form.Control
              size="sm"
              type="text"
              placeholder="Rechercher un pays..."
              value={countrySearch}
              onChange={(e) => setCountrySearch(e.target.value)}
              className="mb-1"
            />
            <Select
              options={countries
                .filter((c) => c.toLowerCase().includes(countrySearch.toLowerCase()))
                .map((c) => ({ value: c, label: c }))}
              placeholder="Tous les pays"
              isClearable
              isSearchable
              onChange={(opt) => setSelectedCountry(opt as Option | null)}
              value={selectedCountry}
            />

            <Form.Label className="mt-3">Sexe</Form.Label>
            <Form.Select
              size="sm"
              value={sexFilter}
              onChange={(e) => setSexFilter(e.target.value)}
            >
              <option value="">Tous</option>
              <option value="M">Hommes</option>
              <option value="F">Femmes</option>
            </Form.Select>
          </div>

          <div className="data-container">
            <h6>Lecture du graphique</h6>
            <small className="text-muted">
              <div className="d-flex align-items-center mb-1">
                <div style={{ width: 12, height: 12, backgroundColor: "#4a90d9", borderRadius: "50%", marginRight: 6 }} />
                Sport dominant de la nation
              </div>
              <div className="d-flex align-items-center mb-1">
                <div style={{ width: 12, height: 12, backgroundColor: "#bbb", borderRadius: "50%", marginRight: 6 }} />
                Autre sport
              </div>
              <p className="mt-2 mb-0">La taille du cercle represente le nombre de médailles obtenues.</p>
            </small>
          </div>
        </Col>

        <Col lg={9}>
          <div className="data-container text-center">
            {bubbleData.length === 0 ? (
              <p className="text-muted mt-4">Aucune donnée disponible pour les critères sélectionnés.</p>
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
  );
};

export default Nations;
