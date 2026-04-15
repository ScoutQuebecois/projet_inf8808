import { NavLink } from "react-router-dom";
import { Navbar } from "react-bootstrap";
import { Container, Nav } from "react-bootstrap";

const HeaderBar = () => {
    return (
    <Navbar bg="dark" data-bs-theme="dark" expand="lg">
      <Container fluid>
        <Navbar.Brand as={NavLink} to="/">
            <Container>
              <h1>Le Miroir Olympique</h1>
            </Container>
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="main-nav" />
        <Navbar.Collapse id="main-nav">
          <Nav className="me-auto">
              <Nav.Link as={NavLink} to="/">Évolution</Nav.Link>
              <Nav.Link as={NavLink} to="/nations">Nations</Nav.Link>
              <Nav.Link as={NavLink} to="/user">Me comparer</Nav.Link>
              <Nav.Link as={NavLink} to="/map">Carte mondiale</Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );

}
export default HeaderBar;