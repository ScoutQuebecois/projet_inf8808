import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Athlete, MetricType } from '../types/Athlete';

interface Props {
    data: Athlete[];
    metric?: MetricType;
    selectedSports?: string[];
    selectedSex: string;
}

const LineChart: React.FC<Props> = ({ 
    data, 
    metric = "Age", 
    selectedSports = ["Speed Skating"],
    selectedSex
}) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const [hasData, setHasData] = useState<boolean>(true);

    const margin = { top: 40, right: 120, bottom: 60, left: 60 };
    const width = 1050 - margin.left - margin.right;
    const height = 450 - margin.top - margin.bottom;

    useEffect(() => {
        if (!data || data.length === 0 || !svgRef.current) return;

        const filtered = data.filter(d => {
            const matchSport = selectedSports.includes(d.Sport);
            const val = d[metric];
            const matchMetric = val !== null && val !== undefined && val !== "" && !isNaN(Number(val));
            const matchSex = selectedSex === "All" ? true : d.Sex === selectedSex;
            
            return matchSport && matchMetric && matchSex;
        });

        if (filtered.length === 0) {
            setHasData(false); 
            d3.select(svgRef.current).selectAll("*").remove();
            return;
        }
        setHasData(true);

        const rolled = d3.flatRollup(
            filtered,
            v => d3.mean(v, d => Number(d[metric])),
            d => d.Sport,
            d => Number(d.Year)
        );

        const formattedData = d3.groups(rolled, d => d[0]).map(([sport, values]) => ({
            sport,
            values: values.map(v => ({ 
                year: v[1] as number, 
                avg: v[2] as number 
            })).sort((a, b) => a.year - b.year)
        }));

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();

        const g = svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        const x = d3.scaleLinear()
            .domain(d3.extent(data, d => Number(d.Year)) as [number, number])
            .range([0, width]);

        const allAverages = formattedData.flatMap(s => s.values.map(v => v.avg));
        const yMin = d3.min(allAverages) || 0;
        const yMax = d3.max(allAverages) || 0;

        const y = d3.scaleLinear()
            .domain([yMin * 0.95, yMax * 1.05])
            .range([height, 0]);

        const color = d3.scaleOrdinal(d3.schemeCategory10);

        const xAxisGroup = g.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x).tickFormat(d3.format("d")));

        xAxisGroup.append("text")
            .attr("x", width / 2)
            .attr("y", 45)
            .attr("fill", "#666")
            .style("font-size", "14px")
            .style("font-weight", "bold")
            .text("Année");

        const yAxisGroup = g.append("g")
            .call(d3.axisLeft(y));

        const yLabel = metric === "Height" ? "Taille (cm)" : 
                       metric === "Weight" ? "Poids (kg)" : 
                       "Âge moyen";

        yAxisGroup.append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", -height / 2)
            .attr("y", -45)
            .attr("fill", "#666")
            .style("text-anchor", "middle")
            .style("font-size", "14px")
            .style("font-weight", "bold")
            .text(yLabel);

        const lineGenerator = d3.line<{year: number, avg: number}>()
            .x(d => x(d.year))
            .y(d => y(d.avg))
            .curve(d3.curveMonotoneX);

        formattedData.forEach((s) => {
            const sportColor = color(s.sport);
            
            g.append("path")
                .datum(s.values)
                .attr("fill", "none")
                .attr("stroke", sportColor)
                .attr("stroke-width", 2.5)
                .attr("d", lineGenerator);
            
            const lastPoint = s.values[s.values.length - 1];
            if (lastPoint) {
                g.append("text")
                    .attr("x", x(lastPoint.year) + 5)
                    .attr("y", y(lastPoint.avg))
                    .attr("fill", sportColor)
                    .style("font-size", "12px")
                    .style("font-weight", "bold")
                    .style("alignment-baseline", "middle")
                    .text(s.sport);
            }
        });

    }, [data, metric, selectedSports, selectedSex]);

    return (
        <div style={{ position: 'relative', display: 'inline-block' }}>
            
            {!hasData && (
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    padding: '15px 25px',
                    border: '2px solid #ff4d4f',
                    borderRadius: '8px',
                    color: '#ff4d4f',
                    fontWeight: 'bold',
                    zIndex: 10,
                    textAlign: 'center',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}>
                    ⚠️ Aucune donnée disponible <br/> 
                    <span style={{ fontSize: '0.8em', fontWeight: 'normal', color: '#666' }}>
                        (Aucune donnée disponible pour les critères sélectionnés)
                    </span>
                </div>
            )}

            <svg 
                ref={svgRef} 
                width={width + margin.left + margin.right} 
                height={height + margin.top + margin.bottom} 
                style={{ display: 'block', backgroundColor: '#fff' }}
            />
        </div>
    );
};

export default LineChart;