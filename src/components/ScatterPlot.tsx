import { useEffect, useRef } from "react";
import * as d3 from "d3";
import { THEME, applyTooltipStyle, styleAxis, addGrid } from "./charttheme";

export interface BubbleData {
  country: string;
  sport: string;
  avgHeight: number;
  avgWeight: number;
  avgAge: number;
  medalCount: number;
  isDominant: boolean;
}

interface ScatterPlotProps {
  data: BubbleData[];
  highlightSport: string | null;
  highlightCountry: string | null;
}

const ScatterPlot = ({ data, highlightSport, highlightCountry }: ScatterPlotProps) => {
  const svgRef     = useRef<SVGSVGElement | null>(null);
  const tooltipRef = useRef<d3.Selection<HTMLDivElement, unknown, HTMLElement, any> | null>(null);

  useEffect(() => {
    tooltipRef.current = applyTooltipStyle(d3.select("body").append("div"));
    return () => { tooltipRef.current?.remove(); };
  }, []);

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    if (!data.length) return;

    const width  = 760;
    const height = 500;
    const margin = { top: 28, right: 28, bottom: 58, left: 62 };
    const innerW = width  - margin.left - margin.right;
    const innerH = height - margin.top  - margin.bottom;

    svg
      .attr("width", width)
      .attr("height", height)
      .style("background", THEME.bg1)
      .style("border-radius", "8px");

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const heightExtent = d3.extent(data, (d) => d.avgHeight) as [number, number];
    const weightExtent = d3.extent(data, (d) => d.avgWeight) as [number, number];
    const medalExtent  = d3.extent(data, (d) => d.medalCount) as [number, number];

    const xPad = (heightExtent[1] - heightExtent[0]) * 0.05 || 5;
    const yPad = (weightExtent[1] - weightExtent[0]) * 0.05 || 5;

    const xScale = d3.scaleLinear()
      .domain([heightExtent[0] - xPad, heightExtent[1] + xPad])
      .range([0, innerW]);

    const yScale = d3.scaleLinear()
      .domain([weightExtent[0] - yPad, weightExtent[1] + yPad])
      .range([innerH, 0]);

    const rScale = d3.scaleSqrt()
      .domain([medalExtent[0], medalExtent[1]])
      .range([4, 30]);

    addGrid(g, yScale, innerW, 6);

    g.append("g")
      .attr("class", "grid-v")
      .call(
        d3.axisBottom(xScale)
          .ticks(6)
          .tickSize(innerH)
          .tickFormat(() => "")
      )
      .call((gg) => gg.select(".domain").remove())
      .call((gg) =>
        gg.selectAll("line")
          .style("stroke", THEME.gridLine)
          .style("stroke-dasharray", "3,4")
      );

    const xAxis = g.append("g")
      .attr("transform", `translate(0,${innerH})`)
      .call(d3.axisBottom(xScale).ticks(7));
    styleAxis(xAxis as any);

    const yAxis = g.append("g").call(d3.axisLeft(yScale).ticks(7));
    styleAxis(yAxis as any);

    g.append("text")
      .attr("x", innerW / 2).attr("y", innerH + 44)
      .attr("text-anchor", "middle")
      .style("fill", THEME.text)
      .style("font-family", THEME.fontBody)
      .style("font-size", "11px")
      .style("letter-spacing", "0.07em")
      .text("TAILLE MOYENNE (cm)");

    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -48).attr("x", -innerH / 2)
      .attr("text-anchor", "middle")
      .style("fill", THEME.text)
      .style("font-family", THEME.fontBody)
      .style("font-size", "11px")
      .style("letter-spacing", "0.07em")
      .text("POIDS MOYEN (kg)");

    const getColor = (d: BubbleData) => {
      if (highlightCountry && d.country !== highlightCountry) return "#ddd";
      if (highlightSport && d.sport !== highlightSport) return "#ddd";
      return d.isDominant ? "#4a90d9" : "#bbb";
    };

    const getOpacity = (d: BubbleData) => {
      if (highlightCountry) return d.country === highlightCountry ? 1 : 0.2;
      if (highlightSport) return d.sport === highlightSport ? 1 : 0.2;
      return 0.75;
    };

    const getStroke = (d: BubbleData) => {
      if (highlightCountry && d.country === highlightCountry) return "#2c5f99";
      if (highlightSport && d.sport === highlightSport) return "#2c5f99";
      return d.isDominant ? "#2c5f99" : "#999";
    };

    const getStrokeWidth = (d: BubbleData) => {
      if ((highlightCountry && d.country === highlightCountry) || (highlightSport && d.sport === highlightSport)) return 2;
      return 1;
    };

    const sorted = [...data].sort((a, b) => b.medalCount - a.medalCount);

    const circles = g.selectAll<SVGCircleElement, BubbleData>("circle.bubble")
      .data(sorted)
      .enter()
      .append("circle")
      .attr("class", "bubble")
      .attr("cx", (d) => xScale(d.avgHeight))
      .attr("cy", (d) => yScale(d.avgWeight))
      .attr("r",  (d) => rScale(d.medalCount))
      .attr("fill",    getColor)
      .attr("stroke",  getStroke)
      .attr("stroke-width", getStrokeWidth)
      .attr("opacity", getOpacity)
      .style("cursor", "pointer")
      .on("mouseover", function (event, d) {
        d3.select(this).raise().attr("opacity", 1).attr("stroke-width", 2);
        tooltipRef.current
          ?.style("opacity", "1")
          .html(
            `<span style="font-weight:600;color:${THEME.text}">${d.country}</span>
             <span style="color:${THEME.text}"> — ${d.sport}</span><br/>
             <span style="color:${THEME.text};font-size:10px">TAILLE</span> <strong>${d.avgHeight.toFixed(1)} cm</strong><br/>
             <span style="color:${THEME.text};font-size:10px">POIDS</span> <strong>${d.avgWeight.toFixed(1)} kg</strong><br/>
             <span style="color:${THEME.text};font-size:10px">ÂGE</span> <strong>${d.avgAge.toFixed(1)} ans</strong><br/>
             <span style="color:${THEME.yellow}">${d.medalCount} médaillé${d.medalCount > 1 ? "s" : ""}</span>`
          )
          .style("left", `${event.pageX + 14}px`)
          .style("top",  `${event.pageY - 40}px`);
      })
      .on("mousemove", function (event) {
        tooltipRef.current
          ?.style("left", `${event.pageX + 14}px`)
          .style("top",  `${event.pageY - 40}px`);
      })
      .on("mouseout", function (_, d) {
        d3.select(this)
          .attr("opacity", getOpacity(d))
          .attr("stroke-width", getStrokeWidth(d));
        tooltipRef.current?.style("opacity", "0");
      });

    if (highlightCountry) {
      circles.filter((d) => d.country === highlightCountry).raise();
    } else if (highlightSport) {
      circles.filter((d) => d.sport === highlightSport).raise();
    }

    const lgX = innerW - 90;
    const lgY = innerH - 90;
    const sizes = [medalExtent[0], Math.round((medalExtent[0] + medalExtent[1]) / 2), medalExtent[1]];
    const lgG = g.append("g").attr("transform", `translate(${lgX},${lgY})`);

    lgG.append("text")
      .attr("x", 0).attr("y", -rScale(medalExtent[1]) - 12)
      .style("fill", THEME.text).style("font-family", THEME.fontBody).style("font-size", "9px")
      .style("letter-spacing", "0.1em").style("text-transform", "uppercase")
      .text("Médaillés");

    sizes.forEach((size) => {
      const r  = rScale(size);
      const cy = -r;
      lgG.append("circle")
        .attr("cx", 0).attr("cy", cy).attr("r", r)
        .attr("fill", "none").attr("stroke", THEME.axisLine).attr("stroke-width", 1);
      lgG.append("text")
        .attr("x", rScale(medalExtent[1]) + 6).attr("y", cy + 4)
        .style("fill", THEME.text).style("font-family", THEME.fontBody).style("font-size", "9px")
        .text(String(size));
    });

    const lgG2 = g.append("g").attr("transform", `translate(10, ${innerH + 38})`);
    [
      { color: THEME.blue,                         label: "Sport dominant" },
      { color: "rgba(255,255,255,0.18)",            label: "Autre sport" },
    ].forEach(({ color, label }, i) => {
      const gx = lgG2.append("g").attr("transform", `translate(${i * 130},0)`);
      gx.append("circle").attr("cx", 5).attr("cy", -4).attr("r", 5)
        .attr("fill", color).attr("stroke", THEME.axisLine).attr("stroke-width", 1);
      gx.append("text").attr("x", 14).attr("y", 0)
        .style("fill", THEME.text).style("font-family", THEME.fontBody).style("font-size", "10px")
        .text(label);
    });
  }, [data, highlightSport, highlightCountry]);

  return <svg ref={svgRef} style={{ display: "block", width: "100%" }} />;
};

export default ScatterPlot;
