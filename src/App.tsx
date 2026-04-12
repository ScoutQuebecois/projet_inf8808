import React from 'react'
import './index.css'
import 'bootstrap/dist/css/bootstrap.min.css';
const Home = React.lazy(() => import('./pages/Home'))
const User = React.lazy(() => import('./pages/User'))
const Nations = React.lazy(() => import('./pages/Nations'))
const MapView = React.lazy(() => import('./pages/MapView'))
import HeaderBar from './components/HeaderBar';
import { Routes, Route } from 'react-router-dom';
import { Container, Spinner } from 'react-bootstrap';


const Loading = () => (
  <Container className="text-center mt-5">
    <Spinner animation="border" variant="primary" />
    <p className="mt-2">Chargement...</p>
  </Container>
);

const App: React.FC = () => {
  return (
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
  )
}

export default App
