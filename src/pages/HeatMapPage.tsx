import { Col, Container, Row, Spinner } from "react-bootstrap";
import MedalHeatmap from "../components/Heatmap";
import { useState } from "react";
import { Athlete } from "../types/Athlete";
import * as d3 from "d3";
import { useEffect, useMemo } from "react";
import SportSelector from "../components/SportsSelector";
import CountryDropdown from "../components/CountryDropdown";
import { Option } from "../types/Options";
import ScatterPlot from "../components/ScatterPlot";

const HeatMapPage = () => {
  const [data, setData] = useState<Athlete[]>([]);
  const [selectedSports, setSelectedSports] = useState<string[]>([
    "Speed Skating",
  ]);
  const [loading, setLoading] = useState(true);
  const [nocRegions, setNocRegions] = useState<Record<string, string>>({});
  const [selectedCountry, setSelectedCountry] = useState<Option | null>(null);

  useEffect(() => {
    d3.csv("/assets/athlete_events.csv").then((res) => {
      const cleaned = res.map((d: any) => ({
        ...d,
        Year: d.Year ? parseInt(d.Year) : 0,
        Age: d.Age && d.Age !== "NA" ? parseFloat(d.Age) : null,
        Height: d.Height && d.Height !== "NA" ? parseFloat(d.Height) : null,
        Weight: d.Weight && d.Weight !== "NA" ? parseFloat(d.Weight) : null,
        Sex: d.Sex,
        Sport: d.Sport,
        Medal: d.Medal,
        Season: d.Season,
      })) as unknown as Athlete[];

      setData(cleaned);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    d3.csv("/assets/noc_regions.csv").then((res) => {
      const mapping: Record<string, string> = {};

      res.forEach((d: any) => {
        mapping[d.NOC] = d.region;
      });

      setNocRegions(mapping);
    });
  }, []);

  const sportsList = useMemo(() => {
    return Array.from(new Set(data.map((d) => d.Sport))).sort();
  }, [data]);

  const addSport = (sport: string) => {
    if (!selectedSports.includes(sport)) {
      setSelectedSports([...selectedSports, sport]);
    }
  };

  const removeSport = (sportToRemove: string) => {
    setSelectedSports(selectedSports.filter((s) => s !== sportToRemove));
  };

  return (
    <>
      <Container>
        <div className="data-container text-center">
          <h4>
            Est-ce que certaines nations dominent des sports plus que d'autres
            dans les médailles?
          </h4>
          <h6>
            Choisisez un ou plusieurs sports et regardez comment les pays et
            leurs athlètes se comparent
          </h6>
        </div>
        <br />
        <div className="data-container">
          {loading && (
            <>
              <div className="text-center">
                <Spinner animation="border" variant="primary" />
                <div style={{ padding: "20px" }}>
                  Chargement des données olympiques...
                </div>
              </div>
            </>
          )}
          {!loading && (
            <>
              <Container>
                <Row className="align-items-end">
                  <Col>
                    <SportSelector
                      allSports={sportsList}
                      selectedSports={selectedSports}
                      onAdd={addSport}
                      onRemove={removeSport}
                    />
                  </Col>
                  <Col>
                    <CountryDropdown onChange={setSelectedCountry} />
                  </Col>
                </Row>
              </Container>
              <br></br>

              {selectedSports.length === 0 ? (
                <div
                  style={{
                    backgroundColor: "rgba(255,255,255,0.9)",
                    padding: "15px 25px",
                    border: "2px solid #ff4d4f",
                    borderRadius: "8px",
                    color: "#ff4d4f",
                    fontWeight: "bold",
                    textAlign: "center",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  }}
                >
                  ⚠️ Aucune donnée disponible
                  <br />
                  <span style={{ fontSize: "0.8em", color: "#666" }}>
                    Veuillez sélectionner au moins un sport.
                  </span>
                </div>
              ) : (
                <>
                  <MedalHeatmap
                    data={data}
                    selectedSports={selectedSports}
                    nocRegions={nocRegions}
                    scrollCountry={selectedCountry?.value}
                  />

                  <Row>
                    {selectedSports.map((sport) => (
                      <Col
                        xs={12}
                        md={6}
                        key={`scatter-${sport}`}
                        className="mb-4"
                      >
                        <ScatterPlot
                          data={data}
                          selectedSport={sport}
                          selectedCountry={selectedCountry?.value}
                          nocRegions={nocRegions}
                        />
                      </Col>
                    ))}
                  </Row>
                </>
              )}
            </>
          )}
        </div>
      </Container>
    </>
  );
};

export default HeatMapPage;
