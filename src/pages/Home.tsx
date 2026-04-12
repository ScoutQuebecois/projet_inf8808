import React from "react";
import { Col, Row } from "react-bootstrap";
import { Link, NavLink } from "react-router";

// Static data bundled with the frontend
const sampleData = {
  message: "Hello from the Data Visualization App!",
  timestamp: new Date().toISOString(),
  datasets: [
    {
      name: "Évolution des athlètes",
      value:
        "Un graphique linéaire modulable qui représente l'évolution physique des athlètes filtrable par sport et sexe ",
      navLink: "/sports",
    },
    {
      name: "Comparaison par pays",
      value:
        "Une carte de chaleur et un nuage de points qui démontre les pays les plus performants pour un sport donné et les caractéristiques physiques de leur athèltes médaillés ",
      navLink: "/pays",
    },
    {
      name: "Comment je me compare?",
      value:
        "Des boîtes à moustache pour vous permettre de vous comparer aux caractéristiques physiques des médaillés de votre sport  ",
      navLink: "/sports",
    },
  ],
};

const Home = () => {
  const [data] = React.useState(sampleData);

  return (
    <div className="data-container">
      <h2 className="text-center">
        Le mirroir olympique : une analyse des olympiens
      </h2>
      <br />
      <p>
        Les Jeux Olympiques sont des événements extrêmement populaires
        internationalement. Ils montrent les limites des capacité humaine dans
        une multitude de sports différents. La compétition pousse la perfection
        dans chaque compétiteur.
        <br />
        <br />
        Cela soulève cependant une question intéressante :{" "}
        <b>
          les caractéristiques physiques des athlètes ont-elles évolué au fil du
          temps ?
        </b>{" "}
        <br />
        <br />
        Depuis 1896, les méthodes d'entraînement, la nutrition et la
        professionnalisation du sport ont considérablement progressé, il est
        donc plausible que les profils des médaillés olympiques se soient
        transformés également.
      </p>
      <p>
        La question centrale que nous tentons de répondre est donc la suivante :
      </p>
      <p className="data-container text-center" style={{ color: "blue" }}>
        <h5>
          Comment est-ce que les caractéristiques physiques des médaillés d’un
          sport ont évolué selon le temps?
        </h5>
      </p>
      <div className="data-list">
        <h6>Explication des différentes pages et leurs fonctions</h6>
        <ul>
          {data.datasets.map((item, index) => (
            <Link
              key={index}
              to={item.navLink}
              className=""
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <li key={index}>
                <Row>
                  <Col lg={11}>
                    <b>{item.name}</b> <br />
                    {item.value}
                  </Col>
                  <Col>&#8250;</Col>
                </Row>
              </li>
            </Link>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Home;
