import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { Athlete, MetricType } from "../types/Athlete";

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
    const [hasData, setHasData] = useState(true);

    const margin = { top: 40, right: 250, bottom: 60, left: 60 };
    const width = 1050 - margin.left - margin.right;
    const height = 450 - margin.top - margin.bottom;

    useEffect(() => {

        if (!data.length || !svgRef.current) return;
        const filtered = data.filter(d => {

            const matchSport = selectedSports.includes(d.Sport);

            const val = d[metric];
            const matchMetric =
                val !== null &&
                val !== undefined &&
                val !== "" &&
                !isNaN(Number(val));

            const matchSex =
                selectedSex === "All"
                    ? true
                    : d.Sex === selectedSex;

            return matchSport && matchMetric && matchSex;
        });

        if (!filtered.length) {
            setHasData(false);
            d3.select(svgRef.current).selectAll("*").remove();
            return;
        }

        setHasData(true);

        const enriched = filtered.map(d => ({
            ...d,
            medalStatus:
                d.Medal && d.Medal !== "NA"
                    ? "Medalists"
                    : "Non-medalists"
        }));

        const rolled = d3.flatRollup(
            enriched,
            v => d3.mean(v, d => Number(d[metric])),
            d => d.Sport,
            d => d.medalStatus,
            d => Number(d.Year)
        );

        const formattedData: any[] = [];

        rolled.forEach(([sport, medalStatus, year, avg]) => {

            let group = formattedData.find(
                g =>
                    g.sport === sport &&
                    g.medalStatus === medalStatus
            );

            if (!group) {
                group = {
                    sport,
                    medalStatus,
                    values: []
                };
                formattedData.push(group);
            }

            group.values.push({ year, avg });
        });

        formattedData.forEach(g =>
            g.values.sort((a: { year: number; }, b: { year: number; }) => a.year - b.year)
        );

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();

        const g = svg.append("g")
            .attr("transform",
                `translate(${margin.left},${margin.top})`
            );

        const x = d3.scaleLinear()
            .domain(d3.extent(filtered,
                d => Number(d.Year)
            ) as [number, number])
            .range([0, width]);

        const allValues =
            formattedData.flatMap(d =>
                d.values.map((v: { avg: any; }) => v.avg)
            );

        const y = d3.scaleLinear()
            .domain([
                d3.min(allValues)! * 0.95,
                d3.max(allValues)! * 1.05
            ])
            .range([height, 0]);

        const color =
            d3.scaleOrdinal<string>()
                .domain(selectedSports)
                .range(d3.schemeCategory10);

        g.append("g")
            .attr("transform",
                `translate(0,${height})`)
            .call(
                d3.axisBottom(x)
                    .tickFormat(d3.format("d"))
            );

        g.append("g")
            .call(d3.axisLeft(y));
        
        g.append("text")
            .attr("x", width / 2)
            .attr("y", height + 45)
            .attr("text-anchor", "middle")
            .attr("fill", "#666")
            .style("font-size", "14px")
            .style("font-weight", "bold")
            .text("Année");
        
            const yLabel =
            metric === "Height"
                ? "Taille (cm)"
                : metric === "Weight"
                ? "Poids (kg)"
                : "Âge moyen";

            g.append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", -height / 2)
            .attr("y", -45)
            .attr("text-anchor", "middle")
            .attr("fill", "#666")
            .style("font-size", "14px")
            .style("font-weight", "bold")
            .text(yLabel);

        // LINE GENERATOR
        const line = d3.line<{year:number,avg:number}>()
            .x(d => x(d.year))
            .y(d => y(d.avg))
            .curve(d3.curveMonotoneX);
        

        // LEGEND PANEL
        const legend = svg
            .append("g")
            .attr(
                "transform",
                `translate(${width + 100}, ${margin.top})`
            );

        legend.append("text")
            .text("Légende")
            .style("font-weight", "bold")
            .attr("y", 0);

        selectedSports.forEach((sport, i) => {

            legend.append("rect")
                .attr("x", 0)
                .attr("y", 20 + i * 20)
                .attr("width", 14)
                .attr("height", 14)
                .attr("fill", color(sport));

            legend.append("text")
                .attr("x", 24)
                .attr("y", 32 + i * 20)
                .text(sport);
        });

        const medalOffset = selectedSports.length * 20 + 40;

        legend.append("line")
            .attr("x1", 0)
            .attr("x2", 30)
            .attr("y1", medalOffset)
            .attr("y2", medalOffset)
            .attr("stroke", "black")
            .attr("stroke-width", 2);

        legend.append("text")
            .attr("x", 40)
            .attr("y", medalOffset + 5)
            .text("Médaillés");

        legend.append("line")
            .attr("x1", 0)
            .attr("x2", 30)
            .attr("y1", medalOffset + 20)
            .attr("y2", medalOffset + 20)
            .attr("stroke", "black")
            .attr("stroke-width", 2)
            .attr("stroke-dasharray", "6,4");

        legend.append("text")
            .attr("x", 40)
            .attr("y", medalOffset + 25)
            .text("Non-médaillés");

        // DRAW LINES
        formattedData.forEach(series => {

            const sportColor =
                color(series.sport);

            g.append("path")
                .datum(series.values)
                .attr("fill", "none")
                .attr("stroke", sportColor)
                .attr("stroke-width", 2.5)
                .attr(
                    "stroke-dasharray",
                    series.medalStatus === "Medalists"
                        ? "0"
                        : "6,4"
                )
                .attr("d", line);

            // const last =
            //     series.values[
            //         series.values.length - 1
            //     ];

            // if (last) {

            //     g.append("text")
            //         .attr("x",
            //             x(last.year) + 6
            //         )
            //         .attr("y",
            //             y(last.avg)
            //         )
            //         .attr("fill",
            //             sportColor
            //         )
            //         .style("font-size", "12px")
            //         .style("font-weight", "bold")
            //         .text(
            //             `${series.sport} (${series.medalStatus})`
            //         );
            // }
            
        });

    }, [data, metric, selectedSports, selectedSex]);

    return (
        <div style={{
            position: "relative",
            display: "inline-block"
        }}>
            {!hasData && (
                <div style={{
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
                       (Aucune donnée correspondant à vos critères de sélection n'est disponible.)
                    </span>
                </div>
            )}

            <svg
                ref={svgRef}
                width={
                    width +
                    margin.left +
                    margin.right
                }
                height={
                    height +
                    margin.top +
                    margin.bottom
                }
            />
        </div>
    );
};

export default LineChart;