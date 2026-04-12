import React from 'react'
import './index.css'
import 'bootstrap/dist/css/bootstrap.min.css';
const Home = React.lazy(() => import('./pages/Home'))
const User = React.lazy(() => import('./pages/User'))
import HeaderBar from './components/HeaderBar';
import { Routes, Route } from 'react-router-dom';
import OlympicDashboardPage from './pages/OlympicDashboardPage';
import HeatMapPage from './pages/HeatMapPage';


const App: React.FC = () => {
  return (
    <div className="app">
      <header>
        <HeaderBar />
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/sports" element={<OlympicDashboardPage />} />
          <Route path="/user" element={<User />} />
          <Route path="/pays" element={<HeatMapPage />} />
        </Routes>
      </main>
    </div>
  )
}

export default App;