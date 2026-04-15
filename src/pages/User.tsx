import { Row, Col, Container, Form, ButtonGroup, ToggleButton } from "react-bootstrap"
import BoxPlot from "../components/BoxPlot";
import { useState, useEffect, useMemo } from "react";
import { Option } from "../types/Options";
import { loadAthleteData } from "../utils/dataLoader";
import Select from "react-select";

const radios = [
    { name: 'Tous' , value : ''},
    { name: 'Hommes', value: 'M' },
    { name: 'Femmes', value: 'F' }
]

const User = () => {
    const [radioValue, setRadioValue] = useState<string>('');
    const [selectedOption, setSelectedOption] = useState<Option | null>(null);
    const [ userHeight, setUserHeight] = useState<number | null>(null);
    const [ userWeight, setUserWeight] = useState<number | null>(null);
    const [ userAge, setUserAge] = useState<number | null>(null);
    const [sportSearch] = useState("");
    const [allSports, setAllSports] = useState<string[]>([]);

    useEffect(() => {
        loadAthleteData().then((cleaned) => {
            const sports = [...new Set(cleaned.map((d) => d.Sport))].sort();
            setAllSports(sports);
        });
    }, []);

    const filteredSports = useMemo(() => {
        return allSports.filter((s) => s.toLowerCase().includes(sportSearch.toLowerCase()));
    }, [allSports, sportSearch]);

    return (
        <>
            <Container>
                <div className="data-container text-center">
                    <h2>Quelles sont vos performances par rapport aux champions du passé ?</h2>
                    <h6>Saisissez vos données et comparez-vous aux médaillés d'or du sport de votre choix !</h6>
                </div>
            </Container>
            <br />
            <Container>
                <Row>
                    <Col lg={9}>

                        <div className="data-container ">
                            <Container>
                                <Row>
                                    <Col lg={8}>
                                        {/* <Form.Control
                                            size="sm"
                                            type="text"
                                            placeholder="Rechercher un sport..."
                                            value={sportSearch}
                                            onChange={(e) => setSportSearch(e.target.value)}
                                            className="mb-1"
                                        /> */}
                                        <Select
                                            options={filteredSports.map((sport) => ({ value: sport, label: sport }))}
                                            placeholder="Choisir un sport"
                                            isSearchable={true}
                                            onChange={setSelectedOption}
                                            value={selectedOption}
                                        />
                                    </Col>
                                    <Col lg={4}>
                                        <ButtonGroup>
                                        {radios.map((radio, idx) => (
                                            <ToggleButton
                                                key={idx}
                                                id={`radio-${idx}`}
                                                type="radio"
                                                variant={idx === 0 ? 'outline-secondary' : idx=== 1 ?  'outline-primary': 'outline-danger'}
                                                name="radio"
                                                value={radio.value}
                                                checked={radioValue === radio.value}
                                                onChange={(e) => setRadioValue(e.currentTarget.value)}
                                            >
                                                {radio.name}
                                            </ToggleButton>
                                        ))}
                                        </ButtonGroup>
                                    </Col>
                                </Row>
                            </Container>
                            <br/>
                            {selectedOption !== null &&
                                <>
                                <Container>
                                    <Row>
                                        <Col lg={6} className="align-self-center">
                                            <h5 className="text-center">Taille</h5>
                                            <BoxPlot userNumber={userHeight} userSport={selectedOption.value} type="height" sexe={radioValue} />
                                        </Col>
                                        <Col lg={6} className="align-self-center">
                                            <h5 className="text-center">Poids</h5>
                                            <BoxPlot userNumber={userWeight} userSport={selectedOption.value} type="weight" sexe={radioValue} />
                                        </Col>
                                    </Row>
                                    <br/>
                                    <Row>
                                        <Col lg={6} className="align-self-center">
                                            <h5 className="text-center">Âge</h5>
                                            <BoxPlot userNumber={userAge} userSport={selectedOption.value} type="age" sexe={radioValue} />
                                        </Col>
                                    </Row>
                                </Container>
                                </>

                            }

                        </div>

                    </Col>
                    <Col lg={3}>
                        <div className="data-container">
                            <Form noValidate>
                                <Form.Group className="mb-3" controlId="formWeight">
                                    <Form.Label>Poids (kg)</Form.Label>
                                    <Form.Control type="number" placeholder="" onChange={(e) => setUserWeight(parseFloat(e.target.value) || null)}/>
                                </Form.Group>

                                <Form.Group className="mb-3" controlId="formAge">
                                    <Form.Label>Âge</Form.Label>
                                    <Form.Control type="number" placeholder="" onChange={(e) => setUserAge(parseInt(e.target.value) || null)} />
                                </Form.Group>

                                <Form.Group className="mb-3" controlId="formHeight">
                                    <Form.Label>Taille (cm)</Form.Label>
                                    <Form.Control type="number" placeholder="" onChange={(e) => setUserHeight(parseFloat(e.target.value) || null)} />
                                </Form.Group>

                            </Form>

                        </div>
                    </Col>
                </Row>
            </Container>

        </>

    )
}

export default User;
