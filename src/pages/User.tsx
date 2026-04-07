import { Row, Col, Container, Form, ButtonGroup, ToggleButton } from "react-bootstrap"
import BoxPlot from "../components/BoxPlot";
import SportDropdown from "../components/SportDropdown";
import { useState } from "react";
import { Option } from "../types/Options";

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
    return (
        <>
            <Container>
                <div className="data-container text-center">
                    <h2>Quelles sont vos performances par rapport aux champions du passé?</h2>
                    <h6>Entrez vos données et comparez-vous aux médaillés d'or de votre sport!</h6>
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
                                        <SportDropdown onChange={setSelectedOption} />
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
                                <Form.Group className="mb-3" controlId="formBasicEmail">
                                    <Form.Label>Poids (kg)</Form.Label>
                                    <Form.Control type="number" placeholder="" onChange={(e) => setUserWeight(parseFloat(e.target.value) || null)}/>
                                </Form.Group>

                                <Form.Group className="mb-3" controlId="formBasicPassword">
                                    <Form.Label>Âge</Form.Label>
                                    <Form.Control type="number" placeholder="" onChange={(e) => setUserAge(parseInt(e.target.value) || null)} />
                                </Form.Group>

                                <Form.Group className="mb-3" controlId="formBasicPassword">
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