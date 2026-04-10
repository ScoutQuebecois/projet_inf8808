import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import { Athlete } from "../types/Athlete";

interface Props {
  data: Athlete[];
}

const MedalHeatmap: React.FC<Props> = ({ data }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!data.length || !svgRef.current) return;

    // FILTER MEDALISTS ONLY
    const medalists = data.filter(
      d => d.Medal && d.Medal !== "NA"
    );

    // COUNT medals by Nation × Sport
    const medalCounts = d3.rollups(
      medalists,
      v => v.length,
      d => d.NOC,
      d => d.Sport
    );

    // Flatten structure
    const flatData: {
      nation: string;
      sport: string;
      count: number;
    }[] = [];

    medalCounts.forEach(([nation, sports]) => {
      sports.forEach(([sport, count]) => {
        flatData.push({ nation, sport, count });
      });
    });

    // SELECT top nations (optional but recommended)
    const topNations = Array.from(
      d3.rollups(
        medalists,
        v => v.length,
        d => d.NOC
      )
    )
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(d => d[0]);

    const filtered = flatData.filter(d =>
      topNations.includes(d.nation)
    );

    const nations = Array.from(
      new Set(filtered.map(d => d.nation))
    );

    const sports = Array.from(
      new Set(filtered.map(d => d.sport))
    );

    const margin = {
      top: 60,
      right: 40,
      bottom: 120,
      left: 80
    };

    const cellSize = 25;

    const width =
      sports.length * cellSize +
      margin.left +
      margin.right;

    const height =
      nations.length * cellSize +
      margin.top +
      margin.bottom;

    const svg = d3.select(svgRef.current);

    svg.selectAll("*").remove();

    svg.attr("width", width).attr("height", height);

    const g = svg
      .append("g")
      .attr(
        "transform",
        `translate(${margin.left},${margin.top})`
      );

    // SCALES
    const x = d3
      .scaleBand()
      .domain(sports)
      .range([0, sports.length * cellSize])
      .padding(0.05);

    const y = d3
      .scaleBand()
      .domain(nations)
      .range([0, nations.length * cellSize])
      .padding(0.05);

    const maxCount =
      d3.max(filtered, d => d.count) || 0;

    const color = d3
      .scaleSequential(d3.interpolateBlues)
      .domain([0, maxCount]);

    // DRAW CELLS
    g.selectAll()
      .data(filtered)
      .enter()
      .append("rect")
      .attr("x", d => x(d.sport)!)
      .attr("y", d => y(d.nation)!)
      .attr("width", x.bandwidth())
      .attr("height", y.bandwidth())
      .attr("fill", d => color(d.count));

    // X AXIS
    g.append("g")
      .attr(
        "transform",
        `translate(0,${
          nations.length * cellSize
        })`
      )
      .call(d3.axisBottom(x))
      .selectAll("text")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end");

    // Y AXIS
    g.append("g").call(d3.axisLeft(y));

    // TITLE
    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", 30)
      .attr("text-anchor", "middle")
      .style("font-size", "18px")
      .style("font-weight", "bold")
      .text(
        "Dominance des nations par sport (médailles)"
      );

  }, [data]);

  return <svg ref={svgRef}></svg>;
};

export default MedalHeatmap;