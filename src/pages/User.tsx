import { Container, Row, Col } from "react-bootstrap";
import BoxPlot from "../components/BoxPlot";
import { useState, useEffect, useMemo } from "react";
import { Option } from "../types/Options";
import { loadAthleteData } from "../utils/dataLoader";
import Select from "react-select";
import OlympicLogo from "../components/OlympicLogo";

const Rings = () => <OlympicLogo className="rings-row" decorative />;

const NumberInput = ({
  label, unit, value, onChange, placeholder,
}: {
  label: string; unit: string; value: number | null; onChange: (v: number | null) => void; placeholder?: string;
}) => (
  <div>
    <label className="input-label">{label}</label>
    <div style={{ position: "relative" }}>
      <input
        className="user-input-field form-control"
        type="number"
        placeholder={placeholder ?? "—"}
        value={value ?? ""}
        onChange={(e) => onChange(parseFloat(e.target.value) || null)}
        style={{ paddingRight: "3rem" }}
      />
      <span style={{
        position: "absolute", right: 12, top: "50%",
        transform: "translateY(-50%)",
        fontSize: "0.75rem", color: "var(--text)", pointerEvents: "none",
      }}>
        {unit}
      </span>
    </div>
  </div>
);

const StatHighlight = ({ label, value, color }: { label: string; value: string; color: string }) => (
  <div style={{
    background: "var(--bg-2)",
    border: `1px solid ${color}33`,
    borderLeft: `3px solid ${color}`,
    borderRadius: "var(--radius)",
    padding: "10px 14px",
  }}>
    <div style={{ fontSize: "0.65rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text)", marginBottom: 2 }}>
      {label}
    </div>
    <div style={{ fontSize: "1.15rem", fontWeight: 600, color, fontVariantNumeric: "tabular-nums" }}>
      {value}
    </div>
  </div>
);

const User = () => {
  const [radioValue, setRadioValue] = useState<string>("");
  const [selectedOption, setSelectedOption] = useState<Option | null>(null);
  const [userHeight, setUserHeight] = useState<number | null>(null);
  const [userWeight, setUserWeight] = useState<number | null>(null);
  const [userAge, setUserAge] = useState<number | null>(null);
  const [sportSearch] = useState("");
  const [allSports, setAllSports] = useState<string[]>([]);

  useEffect(() => {
    loadAthleteData().then((cleaned) => {
      setAllSports([...new Set(cleaned.map((d) => d.Sport))].sort());
    });
  }, []);

  const filteredSports = useMemo(
    () => allSports.filter((s) => s.toLowerCase().includes(sportSearch.toLowerCase())),
    [allSports, sportSearch]
  );

  const hasUserData = userHeight || userWeight || userAge;
  const userBMI: number | null = userHeight && userWeight
  ? (userWeight / ((userHeight / 100) ** 2))
  : null;

  const sexConfig = [
    { v: "", label: "Tous", cls: "active-all" },
    { v: "M", label: "Hommes", cls: "active-M" },
    { v: "F", label: "Femmes", cls: "active-F" },
  ];

  return (
    <div className="page-wrapper">
      <Container fluid style={{ maxWidth: 1400, padding: "0 20px" }}>

        <div className="page-hero">
          <Rings />
          <h1 className="page-hero-title">Comparez-vous aux champions</h1>
          <p className="page-hero-sub">
            Saisissez vos données physiques et découvrez comment vous vous positionnez par rapport aux médaillés d'or du sport de votre choix.
          </p>
        </div>

        <Row className="g-3">

          <Col lg={3} className="order-lg-2">
            <div className="panel">
              <span className="section-label">Vos données</span>

              <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 20 }}>
                <NumberInput label="Taille" unit="cm" value={userHeight} onChange={setUserHeight} placeholder="175" />
                <NumberInput label="Poids" unit="kg" value={userWeight} onChange={setUserWeight} placeholder="70" />
                <NumberInput label="Âge" unit="ans" value={userAge} onChange={setUserAge} placeholder="25" />
              </div>

              {hasUserData && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {userBMI && (
                    <StatHighlight label="Votre IMC" value={userBMI.toFixed(1)} color="#F4C300" />
                  )}
                  {userHeight && (
                    <StatHighlight label="Taille" value={`${userHeight} cm`} color="#0085C7" />
                  )}
                  {userWeight && (
                    <StatHighlight label="Poids" value={`${userWeight} kg`} color="#009F6B" />
                  )}
                  {userAge && (
                    <StatHighlight label="Âge" value={`${userAge} ans`} color="#DF0024" />
                  )}
                </div>
              )}

              {!hasUserData && (
                <p style={{ fontSize: "0.78rem", color: "var(--text)", textAlign: "center", marginTop: 8 }}>
                  Remplissez vos données pour voir votre position sur les graphiques.
                </p>
              )}
            </div>
          </Col>

          <Col lg={9}>
            <div className="panel">

              <div style={{
                display: "flex", alignItems: "center", gap: 12,
                flexWrap: "wrap", marginBottom: 24,
                paddingBottom: 20, borderBottom: "1px solid var(--border)",
              }}>
                <div style={{ flex: "1 1 220px", minWidth: 180 }}>
                  <Select
                    classNamePrefix="rs"
                    className="olympic-select"
                    options={filteredSports.map((sport) => ({ value: sport, label: sport }))}
                    placeholder="Choisir un sport…"
                    isSearchable
                    onChange={setSelectedOption}
                    value={selectedOption}
                  />
                </div>

                <div className="sex-pills" style={{ flex: "0 0 auto" }}>
                  {sexConfig.map(({ v, label, cls }) => (
                    <button
                      key={v}
                      className={`sex-pill ${radioValue === v ? cls : ""}`}
                      onClick={() => setRadioValue(v)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {selectedOption === null && (
                <div className="empty-state">
                  <p style={{ fontSize: "0.88rem" }}>
                    Sélectionnez un sport pour afficher les distributions physiques des médaillés.
                  </p>
                </div>
              )}

              {selectedOption !== null && (
                <Row className="g-4">
                  <Col lg={6}>
                    <p className="chart-group-label">Taille (cm)</p>
                    <BoxPlot
                      userNumber={userHeight}
                      userSport={selectedOption.value}
                      type="height"
                      sexe={radioValue}
                      userBMI={userBMI}
                    />
                  </Col>
                  <Col lg={6}>
                    <p className="chart-group-label">Poids (kg)</p>
                    <BoxPlot
                      userNumber={userWeight}
                      userSport={selectedOption.value}
                      type="weight"
                      sexe={radioValue}
                      userBMI={userBMI}
                    />
                  </Col>
                  <Col lg={6}>
                    <p className="chart-group-label">Âge (ans)</p>
                    <BoxPlot
                      userNumber={userAge}
                      userSport={selectedOption.value}
                      type="age"
                      sexe={radioValue}
                      userBMI={userBMI}
                    />
                  </Col>
                </Row>
              )}
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default User;
