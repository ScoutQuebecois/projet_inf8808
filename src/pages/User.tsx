import { Row, Col, Container } from "react-bootstrap"

const User = () => {
    return (
        <>
            <Container>
                <div className="data-container text-center">
                    <h2>Quelles sont vos performances par rapport aux champions du passé?</h2>
                </div>
            </Container>
            <br />
            <Container>
                <Row>
                    <Col lg={9}>
                        <div className="data-container text-center"></div>
                
                    </Col>
                    <Col lg={3}>
                        <div className="data-container text-center">
                            <h6>Entrez vos données</h6>
                            

                        </div>
                    </Col>
                </Row>
            </Container>
            
        </>
            
    )
}

export default User;