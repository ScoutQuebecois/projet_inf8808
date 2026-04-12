import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { Athlete } from "../types/Athlete";

interface Props {
  data: Athlete[];
  selectedSports?: string[];
  nocRegions: Record<string, string>;
  scrollCountry? : string | null;
}

const MedalHeatmap: React.FC<Props> = ({ data, selectedSports, nocRegions, scrollCountry: scrollCountry }) => {

  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const legendRef = useRef<SVGSVGElement>(null);
  const [highlightedNation, setHighlightedNation] = useState<string | null>(null);
  const [maxCount, setMaxCount] = useState(0);




  useEffect(() => {

    if (!data.length || !svgRef.current) return;

    const medalists = data.filter(
      d => d.Medal && d.Medal !== "NA" && selectedSports?.includes(d.Sport)
    );

    const medalCounts = d3.rollups(
      medalists,
      v => v.length,
      d => d.NOC,
      d => d.Sport
    );

    const flatData: {
      nation: string;
      sport: string;
      count: number;
    }[] = [];

    medalCounts.forEach(([nation, sports]) => {
      sports.forEach(([sport, count]) => {
        flatData.push({
          nation,
          sport,
          count
        });
      });
    });

    const topNations = Array.from(
      d3.rollups(
        medalists,
        v => v.length,
        d => d.NOC
      )
    )
      .sort((a, b) => b[1] - a[1])
      .map(d => d[0]);

    const filtered = flatData.filter(d =>
      topNations.includes(d.nation)
    );

    const nations = Array.from(
      new Set(filtered.map(d => d.nation))
    ).sort((a, b) => {
      const nameA = nocRegions[a] || a;
      const nameB = nocRegions[b] || b;
      return nameA.localeCompare(nameB);
    });


    const sports = Array.from(
      new Set(filtered.map(d => d.sport))
    );

    const margin = {
      top: 60,
      right: 40,
      bottom: 120,
      left: 160
    };

    const cellSize = 25;

    const width =
      nations.length * cellSize +
      margin.left +
      margin.right;

    const height =
      sports.length * cellSize +
      margin.top +
      margin.bottom;

    const svg = d3.select(svgRef.current);

    svg.selectAll("*").remove();

    svg
      .attr("width", width)
      .attr("height", height);

    const g = svg
      .append("g")
      .attr(
        "transform",
        `translate(${margin.left},${margin.top})`
      );

    const x = d3.scaleBand()
      .domain(nations)
      .range([0, nations.length * cellSize])
      .padding(0.05);

    const y = d3.scaleBand()
      .domain(sports)
      .range([0, sports.length * cellSize])
      .padding(0.05);

    const maxCount = d3.max(filtered, d => d.count) || 0;
    setMaxCount(maxCount);
    const color = d3.scaleSequential(d3.interpolateBlues).domain([0, maxCount]);

    const tooltip = d3.select("body")
      .append("div")
      .attr("class", "heatmap-tooltip")
      .style("position", "absolute")
      .style("background", "white")
      .style("padding", "6px 10px")
      .style("border", "1px solid #ccc")
      .style("border-radius", "4px")
      .style("font-size", "12px")
      .style("pointer-events", "none")
      .style("opacity", 0);

    g.selectAll()
      .data(filtered)
      .enter()
      .append("rect")
      .attr("x", d => x(d.nation)!)
      .attr("y", d => y(d.sport)!)
      .attr("width", x.bandwidth())
      .attr("height", y.bandwidth())
      .attr("fill", d => color(d.count))
      .on("mouseover", function (event, d) {

        tooltip
          .style("opacity", 1)
          .html(`
            <strong>${d.sport}</strong><br/>
            ${nocRegions[d.nation] || d.nation}<br/>
            Médailles: ${d.count}
          `);

        d3.select(this)
          .attr("stroke", "#222")
          .attr("stroke-width", 1.5);

      })
      .on("mousemove", function (event) {

        tooltip
          .style("left", (event.pageX + 12) + "px")
          .style("top", (event.pageY - 28) + "px");

      })
      .on("mouseleave", function () {

        tooltip.style("opacity", 0);

        d3.select(this)
          .attr("stroke", "none");

      });

    g.append("g")
      .attr(
        "transform",
        `translate(0,${
          sports.length * cellSize
        })`
      )
      .call(d3.axisBottom(x).tickFormat(
        d => nocRegions[d as string] || d
      ))
      .selectAll("text")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end")
      

    g.append("g")
      .call(d3.axisLeft(y));


    const gradient = svg.append("defs")
      .append("linearGradient")
      .attr("id", "heat-gradient");

    gradient.selectAll("stop")
      .data(d3.range(0, 1.01, 0.1))
      .enter()
      .append("stop")
      .attr("offset", d => `${d * 100}%`)
      .attr("stop-color",
        d => color(d * maxCount)
      );

    

    if (!containerRef.current) return;


    if (!scrollCountry) return;
      const match = nations.find(n =>
          (nocRegions[n] || n)
            .toLowerCase()
            .includes(scrollCountry.toLowerCase())
    );

    if (match) {
      const index = nations.indexOf(match);
      const scrollPosition = index * cellSize + margin.left;
      containerRef.current.scrollTo({
        left: scrollPosition - 20,
        behavior: "smooth"
      });      
      setHighlightedNation(match);    
    }


  }, [data, selectedSports, scrollCountry, nocRegions]);

  useEffect(() => {
    if (!svgRef.current) return;


    const svg = d3.select(svgRef.current);

    svg.selectAll(".tick text")
        .style("fill", null)
        .style("font-weight", null);
    
    if (highlightedNation) {
      svg.selectAll(".tick text")
        .filter(d => d === highlightedNation)
        .style("fill", "red")
        .style("font-weight", "bold");
    }
  
    
  }, [highlightedNation, selectedSports, scrollCountry]);

  useEffect(() => {

  if (!legendRef.current) return;

  const svg = d3.select(legendRef.current);

  svg.selectAll("*").remove();

  const legendWidth = 200;
  const legendHeight = 10;


  const gradient = svg
    .append("defs")
    .append("linearGradient")
    .attr("id", "legend-gradient-heatmap");

  gradient.selectAll("stop")
    .data(d3.range(0, 1.01, 0.1))
    .enter()
    .append("stop")
    .attr("offset", d => `${d * 100}%`)
    .attr("stop-color", d => d3.interpolateBlues(d));

  svg.append("rect")
    .attr("x", 20)
    .attr("y", 10)
    .attr("width", legendWidth)
    .attr("height", legendHeight)
    .style("fill", "url(#legend-gradient-heatmap)");

  // SCALE
  const legendScale = d3.scaleLinear()
    .domain([0, maxCount])
    .range([20, legendWidth + 20]);

  // AXIS
  const legendAxis = d3.axisBottom(legendScale)
    .ticks(5);

  svg.append("g")
    .attr("transform", "translate(0,20)")
    .call(legendAxis);

}, [maxCount]);

  return (
  <div>

    <svg
      width={260}
      height={40}
      style={{
        display: "block",
        marginBottom: "8px"
      }}
      ref={legendRef}
    />

    <div
      ref={containerRef}
      style={{
        overflowX: "auto",
      }}
    >
      <svg ref={svgRef} />
    </div>

  </div>
);
};

export default MedalHeatmap;