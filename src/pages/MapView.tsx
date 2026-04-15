import { useEffect, useState, useMemo } from "react";
import { Container, Row, Col, Spinner, Form } from "react-bootstrap";
import * as d3 from "d3";
import Select from "react-select";
import ChoroplethMap, { CountryIMCData } from "../components/ChoroplethMap";
import TrendLineChart, { YearlyIMC } from "../components/TrendLineChart";
import { Athlete } from "../types/Athlete";
import { Option } from "../types/Options";
import { loadAthleteData } from "../utils/dataLoader";
import { nocToIso } from "../utils/nocMapping";

const MapView = () => {
  const [data, setData] = useState<Athlete[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSport, setSelectedSport] = useState<Option | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [sportSearch, setSportSearch] = useState("");
  const [selectedCountryName, setSelectedCountryName] = useState<string | null>(null);

  useEffect(() => {
    loadAthleteData().then((cleaned) => {
      setData(cleaned);
      setLoading(false);
    });
  }, []);

  const sports = useMemo(() => {
    if (!data.length) return [];
    const medalData = data.filter(
      (d) =>
        d.Medal !== null &&
        d.Height != null &&
        d.Weight != null &&
        d.Age != null &&
        (d.Height as number) > 0 &&
        (d.Weight as number) > 0 &&
        (d.Age as number) > 0
    );
    const bySport = d3.groups(medalData, (d) => d.Sport);
    return bySport
      .filter(([, athletes]) => {
        const countries = d3.groups(athletes, (d) => d.Team);
        return countries.some(([, countryAthletes]) => {
          const years = new Set(countryAthletes.map((a) => a.Year));
          return years.size >= 2;
        });
      })
      .map(([sport]) => sport)
      .sort();
  }, [data]);

  useEffect(() => {
    if (sports.length > 0 && selectedSport === null) {
      setSelectedSport({ value: sports[0], label: sports[0] });
    }
  }, [sports]);

  const sportName = selectedSport?.value || "";

  const countryIMCData = useMemo<CountryIMCData[]>(() => {
    if (!data.length || !sportName) return [];

    const medalData = data.filter(
      (d) =>
        d.Medal !== null &&
        d.Sport === sportName &&
        d.Height != null &&
        d.Weight != null &&
        d.Age != null &&
        (d.Height as number) > 0 &&
        (d.Weight as number) > 0 &&
        (d.Age as number) > 0
    );

    const byCountry = d3.groups(medalData, (d) => d.Team);

    return byCountry
      .map(([country, athletes]) => {
        const byYear = d3.groups(athletes, (d) => d.Year as number).sort((a, b) => a[0] - b[0]);
        if (byYear.length < 2) return null;

        const computeIMC = (arr: Athlete[]) => {
          const vals = arr
            .map((a) => {
              const h = (a.Height as number) / 100;
              const w = a.Weight as number;
              const age = a.Age as number;
              const bmi = w / (h * h);
              return bmi * (age / 25);
            })
            .filter((v) => isFinite(v));
          return d3.mean(vals) || 0;
        };

        const firstYear = byYear[0][1];
        const lastYear = byYear[byYear.length - 1][1];
        const delta = computeIMC(lastYear) - computeIMC(firstYear);

        const noc = athletes[0].NOC;
        const iso3 = nocToIso(noc);

        return {
          country,
          iso3,
          delta,
        };
      })
      .filter((d): d is CountryIMCData => d !== null);
  }, [data, sportName]);

  const trendData = useMemo<YearlyIMC[]>(() => {
    if (!data.length || !selectedCountryName || !sportName) return [];

    const medalData = data.filter(
      (d) =>
        d.Medal !== null &&
        d.Sport === sportName &&
        d.Team === selectedCountryName &&
        d.Height != null &&
        d.Weight != null &&
        d.Age != null &&
        (d.Height as number) > 0 &&
        (d.Weight as number) > 0 &&
        (d.Age as number) > 0
    );

    const byYear = d3.groups(medalData, (d) => d.Year as number).sort((a, b) => a[0] - b[0]);

    return byYear.map(([year, athletes]) => {
      const vals = athletes.map((a) => {
        const h = (a.Height as number) / 100;
        const w = a.Weight as number;
        const age = a.Age as number;
        const bmi = w / (h * h);
        return bmi * (age / 25);
      });
      return { year, imc: d3.mean(vals) || 0 };
    });
  }, [data, selectedCountryName, sportName]);

  const handleCountryClick = (country: string, _iso3: string) => {
    setSelectedCountryName(country);
    setSelectedCountry(country);
  };

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
        <h2>Évolution du profil physique par nation</h2>
        <p className="text-muted">
          Explorez comment l'IMC ajusté par l'âge des médaillés a évolué entre la première et la derniére édition des Jeux Olympiques pour chaque pays.
          Cliquez sur un pays pour voir l'évolution détaillée.
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

          <div className="data-container">
            <h6>Lecture de la carte</h6>
            <small className="text-muted">
              <p>La couleur représente la variation de l'IMC ajusté (IMC x âge / 25) entre la première et la dernière participation du pays.</p>
              <div className="d-flex align-items-center mb-1">
                <div style={{ width: 14, height: 14, backgroundColor: "#e8751a", marginRight: 6, borderRadius: 2 }} />
                Variation négative
              </div>
              <div className="d-flex align-items-center mb-1">
                <div style={{ width: 14, height: 14, backgroundColor: "#ffffff", border: "1px solid #ccc", marginRight: 6, borderRadius: 2 }} />
                Pas de variation
              </div>
              <div className="d-flex align-items-center mb-1">
                <div style={{ width: 14, height: 14, backgroundColor: "#4a90d9", marginRight: 6, borderRadius: 2 }} />
                Variation positive
              </div>
              <div className="d-flex align-items-center mb-1">
                <div style={{ width: 14, height: 14, backgroundColor: "#eee", border: "1px solid #ccc", marginRight: 6, borderRadius: 2 }} />
                Aucune donnée disponible
              </div>
            </small>
          </div>
        </Col>

        <Col lg={9}>
          <div className="data-container text-center mb-3">
            {countryIMCData.length === 0 ? (
              <p className="text-muted mt-4">Aucune donnée disponible pour ce sport.</p>
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
            <div className="data-container text-center">
              <TrendLineChart
                data={trendData}
                country={selectedCountryName}
                sport={sportName}
              />
            </div>
          )}

          {selectedCountryName && trendData.length === 0 && (
            <div className="data-container text-center">
              <p className="text-muted">Aucune donnée détaillée disponible pour {selectedCountryName} dans ce sport.</p>
            </div>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default MapView;
