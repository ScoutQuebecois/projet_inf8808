import React from 'react';
import OlympicDashboard from './pages/LineChartPage'; // Import de ta nouvelle page

const App: React.FC = () => {
    return (
        <div className="app" style={{ 
            padding: '30px', 
            backgroundColor: '#f4f7f6', 
            minHeight: '100vh',
            fontFamily: 'sans-serif' 
        }}>
            <header style={{ marginBottom: '30px' }}>
                <h1 style={{ color: '#2c3e50', margin: 0 }}>Le Miroir Olympique</h1>
                <p style={{ color: '#7f8c8d' }}>Analyse de l'évolution physique des athlètes à travers l'histoire.</p>
            </header>

            <main>
                <OlympicDashboard />
            </main>

            <footer style={{ marginTop: '40px', textAlign: 'center', color: '#bdc3c7', fontSize: '0.9em' }}>
                Projet de Visualisation de Données - 2026
            </footer>
        </div>
    );
};

export default App;