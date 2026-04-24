import React, { useEffect, useState } from 'react'
import './index.css'
import 'bootstrap/dist/css/bootstrap.min.css';
const Home = React.lazy(() => import('./pages/Home'))
const User = React.lazy(() => import('./pages/User'))
const Nations = React.lazy(() => import('./pages/Nations'))
const MapView = React.lazy(() => import('./pages/MapView'))
import HeaderBar from './components/HeaderBar';
import { AltTextProvider } from './components/AltTextContext';
import { Routes, Route } from 'react-router-dom';
import { Container, Spinner } from 'react-bootstrap';


const Loading = () => (
  <Container className="text-center mt-5">
    <Spinner animation="border" variant="primary" />
    <p className="mt-2">Chargement...</p>
  </Container>
);

const App: React.FC = () => {
  const [showAltText, setShowAltText] = useState(() => {
    const stored = window.localStorage.getItem("showChartAltText");
    return stored == null ? true : stored === "true";
  });

  useEffect(() => {
    window.localStorage.setItem("showChartAltText", String(showAltText));
  }, [showAltText]);

  return (
    <AltTextProvider value={{ showAltText, setShowAltText }}>
      <div className="app">
        <header>
          <HeaderBar />
        </header>
        <main>
          <React.Suspense fallback={<Loading />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/nations" element={<Nations />} />
              <Route path="/user" element={<User />} />
              <Route path="/map" element={<MapView />} />
            </Routes>
          </React.Suspense>
        </main>
      </div>
    </AltTextProvider>
  )
}

export default App
