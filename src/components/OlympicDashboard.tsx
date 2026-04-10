import React, { useState, useEffect, useMemo } from 'react';
import * as d3 from 'd3';
import LineChart from './LineChart';
import SportSelector from './SportsSelector';
import { Athlete, MetricType } from '../types/Athlete';
import Select from "react-select";
import { Col, Container, Row, Spinner } from 'react-bootstrap';

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
                Sport: d.Sport,
                Medal: d.Medal,
                Season: d.Season
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

    if (loading) return (
        <>
        <div className='text-center'>
            <Spinner animation="border" variant="primary" />
            <div style={{ padding: '20px' }}>
                Chargement des données olympiques...
            </div>
        </div></>
    )

    const metriques = [
        { value: "Age", label: "Âge moyen" },
        { value: "Height", label: "Taille moyenne" },
        { value: "Weight", label: "Poids moyen" }
    ];

    const ages = [{ value: "All", label: "Tous" }, { value: "M", label: "Hommes" }, { value: "F", label: "Femmes" }];
    const seasons = [{ value: "All", label: "Tous" }, { value: "Summer", label: "Été" }, { value: "Winter", label: "Hiver" }];

    return (
        <div className="data-container ">
            <Container>
                <Row>
                    <Col>
                        <Select
                            value={metriques
                            .map(m => ({ value: m.value, label: m.label }))
                            .find(m => m.value === metric)}
                            options={metriques.map(m => ({ value: m.value, label: m.label }))}
                            placeholder="Choisir une métrique"
                            onChange={(option) => setMetric(option ? option.value as MetricType : "Age")}
                        />
                    </Col>
                    <Col>
                        <Select
                        value={ages
                        .map(a => ({ value: a.value, label: a.label }))
                        .find(a => a.value === selectedSex)}
                        options={ages.map(a => ({ value: a.value, label: a.label }))}
                        placeholder="Choisir un sexe"
                        onChange={(option) => setSelectedSex(option ? option.value : "All")}
                        />
                    </Col>                    
                </Row>
                <br/>
                <Row>
                    <Col>
                        <SportSelector 
                        allSports={sportsList} 
                        selectedSports={selectedSports} 
                        onAdd={addSport} 
                        onRemove={removeSport} />  
                    </Col>
                </Row>
                
            </Container>
        
        
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