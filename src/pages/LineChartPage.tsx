import React, { useState, useEffect, useMemo } from 'react';
import * as d3 from 'd3';
import LineChart from '../components/LineChart';
import SportSelector from '../components/SportsSelector';
import { Athlete, MetricType } from '../types/Athlete';

const OlympicDashboard: React.FC = () => {
    const [data, setData] = useState<Athlete[]>([]);
    const [metric, setMetric] = useState<MetricType>("Age");
    const [selectedSports, setSelectedSports] = useState<string[]>(["Speed Skating"]);
    const [selectedSex, setSelectedSex] = useState<string>("All");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        d3.csv("/assets/athlete_events.csv").then((res) => {
            const cleaned = res.map((d: any) => ({
                ...d,
                Year: d.Year ? parseInt(d.Year) : 0,
                Age: (d.Age && d.Age !== "NA") ? parseFloat(d.Age) : null,
                Height: (d.Height && d.Height !== "NA") ? parseFloat(d.Height) : null,
                Weight: (d.Weight && d.Weight !== "NA") ? parseFloat(d.Weight) : null,
                Sex: d.Sex,
                Sport: d.Sport
            })) as unknown as Athlete[];
            
            setData(cleaned);
            setLoading(false);
        });
    }, []);

    const sportsList = useMemo(() => {
        return Array.from(new Set(data.map(d => d.Sport))).sort();
    }, [data]);

    const addSport = (sport: string) => {
        if (!selectedSports.includes(sport)) {
            setSelectedSports([...selectedSports, sport]);
        }
    };

    const removeSport = (sportToRemove: string) => {
        setSelectedSports(selectedSports.filter(s => s !== sportToRemove));
    };

    if (loading) return <div style={{ padding: '20px' }}>Chargement des données olympiques...</div>;

    return (
        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                <div>
                    <label style={{ fontWeight: 'bold' }}>Métrique : </label>
                    <select value={metric} onChange={(e) => setMetric(e.target.value as MetricType)}>
                        <option value="Age">Âge moyen</option>
                        <option value="Height">Taille moyenne</option>
                        <option value="Weight">Poids moyen</option>
                    </select>
                </div>

                <div>
                    <label style={{ fontWeight: 'bold' }}>Sexe : </label>
                    <select value={selectedSex} onChange={(e) => setSelectedSex(e.target.value)}>
                        <option value="All">Tous</option>
                        <option value="M">Hommes</option>
                        <option value="F">Femmes</option>
                    </select>
                </div>
            </div>

            <SportSelector 
                allSports={sportsList} 
                selectedSports={selectedSports} 
                onAdd={addSport} 
                onRemove={removeSport} 
            />

            <LineChart 
                data={data} 
                metric={metric} 
                selectedSports={selectedSports} 
                selectedSex={selectedSex}
            />
        </div>
    );
};

export default OlympicDashboard;