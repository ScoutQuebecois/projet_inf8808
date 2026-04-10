import { NavLink } from "react-router-dom";
import Navbar from "react-bootstrap/NavBar";
import { Container, Nav } from "react-bootstrap";

const HeaderBar = () => {
    return (
    <Navbar bg="dark" data-bs-theme="dark" >
      <Container fluid>
        <Navbar.Brand href="/" >
            <Container >
              <h1>Le mirror Olympique</h1>
            </Container>
        </Navbar.Brand>
        <Nav className="me-auto">
            <Nav.Link className="pe-auto" as={NavLink} to="/">Home</Nav.Link>
            <Nav.Link className="pe-auto" as={NavLink} to="/olympic">Évolution par sport</Nav.Link>
            <Nav.Link className="pe-auto" as={NavLink} to="/user">Comment je me compare?</Nav.Link>
        </Nav>
      </Container>
    </Navbar>
  );

}
export default HeaderBar;