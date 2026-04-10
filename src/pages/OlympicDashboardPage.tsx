import { Container } from "react-bootstrap";
import OlympicDashboard from "../components/OlympicDashboard";



const OlympicDashboardPage = () => {
    
    return (
        <>
        <Container>
            <div className="data-container text-center">
                <h3>Comment les caractéristiques physiques varient-elles selon le sport au fil du temps?</h3>
                <h6>Découvrez l'évolution des caractéristiques physiques entre les différents sports olympiques au fil du temps</h6>
            </div>
            <br />
            <OlympicDashboard />
        </Container>
        </>
       
    )
}

export default OlympicDashboardPage;