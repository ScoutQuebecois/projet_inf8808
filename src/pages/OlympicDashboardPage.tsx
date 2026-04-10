import { Container } from "react-bootstrap";
import OlympicDashboard from "./LineChartPage"



const OlympicDashboardPage = () => {
    
    return (
        <>
        <Container>
            <div className="data-container text-center">
                <h2>Comment les caractéristiques physiques varient-elles selon le sport au fil du temps?</h2>
            </div>
            <br />
            <OlympicDashboard />
        </Container>
        </>
       
    )
}

export default OlympicDashboardPage;