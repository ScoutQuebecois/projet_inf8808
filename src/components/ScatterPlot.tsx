import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { Athlete } from "../types/Athlete";

interface Props {
  data: Athlete[];
  selectedSport: string; // single sport
  selectedCountry?: string | null;
  nocRegions: Record<string, string>;
}

const CountryAvgScatter: React.FC<Props> = ({
  data,
  selectedSport,
  selectedCountry,
  nocRegions,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [athletes, setAthletes] = useState<Athlete[]>([]);

  useEffect(() => {
    if (!data.length || !selectedSport) return;

    const filtered = data.filter(
      (d) => d.Sport === selectedSport && d.Height && d.Weight,
    );
    setAthletes(filtered);

    const countryAverages = d3
      .rollups(
        filtered,
        (athletes) => ({
          avgHeight: d3.mean(athletes, (d) => d.Height as number)!,
          avgWeight: d3.mean(athletes, (d) => d.Weight as number)!,
        }),
        (d) => d.NOC,
      )
      .map(([NOC, values]) => ({
        NOC,
        ...values,
      }));

    const margin = {
      top: 40,
      right: 40,
      bottom: 60,
      left: 70,
    };

    const width = 500;
    const height = 350;

    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);

    svg.selectAll("*").remove();

    svg.attr("width", width).attr("height", height);

    const innerWidth = width - margin.left - margin.right;

    const innerHeight = height - margin.top - margin.bottom;

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3
      .scaleLinear()
      .domain(
        d3.extent(countryAverages, (d) => d.avgHeight) as [number, number],
      )
      .nice()
      .range([0, innerWidth]);

    const y = d3
      .scaleLinear()
      .domain(
        d3.extent(countryAverages, (d) => d.avgWeight) as [number, number],
      )
      .nice()
      .range([innerHeight, 0]);

    const allCountries = Array.from(new Set(data.map((d) => d.NOC)));

    const color = d3
      .scaleOrdinal<string, string>()
      .domain(allCountries)
      .range(
        allCountries.map((_, i) => {
          const hue = (i * 360) / allCountries.length;
          const lightness = i % 2 === 0 ? 55 : 70;
          return d3.hcl(hue, 65, lightness).formatHex();
        }),
      );

    const tooltip = d3
      .select("body")
      .append("div")
      .style("position", "absolute")
      .style("background", "white")
      .style("padding", "6px 10px")
      .style("border", "1px solid #ccc")
      .style("border-radius", "4px")
      .style("font-size", "12px")
      .style("pointer-events", "none")
      .style("opacity", 0);

    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", 25)
      .attr("text-anchor", "middle")
      .style("font-size", "18px")
      .style("font-weight", "bold")
      .text(
        `Taille et Poids moyens — ${selectedSport} (${data.filter((d) => d.Sport == selectedSport).map((d) => d.Season)[0]})`,
      );

    g.selectAll("circle")
      .data(countryAverages)
      .enter()
      .append("circle")
      .attr("cx", (d) => x(d.avgHeight))
      .attr("cy", (d) => y(d.avgWeight))
      .attr("r", 5)
      .attr("fill", (d) =>
        nocRegions[d.NOC] === selectedCountry ? "black" : color(d.NOC),
      )
      .attr("stroke", "black")
      .attr("stroke-width", (d) =>
        nocRegions[d.NOC] === selectedCountry ? 2 : 0.6,
      )
      .on("mouseover", function (event, d) {
        tooltip.style("opacity", 1).html(`
            <strong>${nocRegions[d.NOC]}</strong><br/>
            Taille: ${d.avgHeight.toFixed(1)} cm<br/>
            Poids: ${d.avgWeight.toFixed(1)} kg
          `);

        d3.select(this).attr("stroke-width", 2).attr("fill", "black");
      })
      .on("mousemove", function (event) {
        tooltip
          .style("left", event.pageX + 12 + "px")
          .style("top", event.pageY - 28 + "px");
      })
      .on("mouseleave", function (event, d) {
        tooltip.style("opacity", 0);

        d3.select(this)
          .attr("stroke-width", d.NOC === selectedCountry ? 2 : 0.6)
          .attr(
            "fill",
            nocRegions[d.NOC] === selectedCountry ? "black" : color(d.NOC),
          );
      });

    g.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x));

    g.append("g").call(d3.axisLeft(y));

    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", height - 10)
      .attr("text-anchor", "middle")
      .text("Taille moyenne (cm)");

    svg
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", 20)
      .attr("text-anchor", "middle")
      .text("Poids moyen (kg)");
  }, [data, selectedSport, selectedCountry]);

  return (
    <>
      {athletes.length == 0 && <div 
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.9)",
              padding: "15px 25px",
              border: "2px solid #ff4d4f",
              borderRadius: "8px",
              color: "#ff4d4f",
              fontWeight: "bold",
              zIndex: 10,
              textAlign: "center",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            }}
          >
            ⚠️ Aucune donnée disponible de taille et poids moyen<br />
            <span
              style={{
                fontSize: "0.8em",
                fontWeight: "normal",
                color: "#666",
              }}
            > Aucune donnée significative pour {selectedSport}</span>
          </div>}
      {athletes.length > 0 && <svg ref={svgRef}></svg>}
    </>
  )
};

export default CountryAvgScatter;
