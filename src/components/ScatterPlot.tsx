import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import { Athlete } from "../types/Athlete";

interface Props {
  data: Athlete[];
  selectedSport: string;
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

  useEffect(() => {
    if (!data.length || !selectedSport) return;
    if (!svgRef.current) return;

    const filtered = data.filter(
      (d) => d.Sport === selectedSport && d.Height != null && d.Weight != null,
    );

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    if (!filtered.length) return;

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

    const margin = { top: 40, right: 40, bottom: 60, left: 70 };

    const width = 500;
    const height = 350;

    svg.attr("width", width).attr("height", height);

    const innerWidth = width - margin.left - margin.right;

    const innerHeight = height - margin.top - margin.bottom;

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // scales

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

    // title

    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", 25)
      .attr("text-anchor", "middle")
      .style("font-size", "18px")
      .style("font-weight", "bold")
      .text(`Taille et Poids moyens — ${selectedSport}`);

    // draw points

    const circles = g.selectAll("circle")
      .data(countryAverages)
      .enter()
      .append("circle")
      .attr("cx", (d) => x(d.avgHeight))
      .attr("cy", (d) => y(d.avgWeight))
      .attr("r", (d) =>
        nocRegions[d.NOC] === selectedCountry ? 8 : 4)
      .attr("fill", (d) =>
        nocRegions[d.NOC] === selectedCountry ? "white" : color(d.NOC),
      )
      .attr("stroke", (d) =>
        nocRegions[d.NOC] === selectedCountry ? "red" : "black")
      .attr("stroke-width", 0.6)

      .on("mouseover", function (event, d) {
        tooltip.style("opacity", 1).html(`
            <strong>${nocRegions[d.NOC]}</strong><br/>
            Taille: ${d.avgHeight.toFixed(1)} cm<br/>
            Poids: ${d.avgWeight.toFixed(1)} kg
          `);

        d3.select(this).attr("stroke-width", 2).attr("fill", "white");
      })

      .on("mousemove", function (event) {
        tooltip
          .style("left", event.pageX + 12 + "px")
          .style("top", event.pageY - 28 + "px");
      })

      .on("mouseleave", function (event, d) {
        tooltip.style("opacity", 0);

        d3.select(this)
          .attr("stroke-width", 0.6)
          .attr(
            "fill",
            nocRegions[d.NOC] === selectedCountry ? "white" : color(d.NOC),
          );
      });
    
    circles
      .filter(d => nocRegions[d.NOC] === selectedCountry)
      .raise();

    // axes

    g.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x));

    g.append("g").call(d3.axisLeft(y));

    // labels

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

    return () => {
      tooltip.remove();
    };
  }, [data, selectedSport, selectedCountry, nocRegions]);

  // fallback message

  const filtered = data.filter(
    (d) => d.Sport === selectedSport && d.Height != null && d.Weight != null,
  );

  if (!filtered.length) {
    return (
      <div
        style={{
          backgroundColor: "rgba(255,255,255,0.9)",
          padding: "15px 25px",
          border: "2px solid #ff4d4f",
          borderRadius: "8px",
          color: "#ff4d4f",
          fontWeight: "bold",
          textAlign: "center",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        }}
      >
        ⚠️ Aucune donnée disponible
        <br />
        <span
          style={{
            fontSize: "0.8em",
            color: "#666",
          }}
        >
          Aucune donnée significative pour {selectedSport}
        </span>
      </div>
    );
  }

  return <svg ref={svgRef}></svg>;
};

export default CountryAvgScatter;
