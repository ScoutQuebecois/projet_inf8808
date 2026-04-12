import { useEffect, useRef } from "react";
import * as d3 from "d3";

export interface YearlyIMC {
  year: number;
  imc: number;
}

interface TrendLineChartProps {
  data: YearlyIMC[];
  country: string;
  sport: string;
}

const TrendLineChart = ({ data, country, sport }: TrendLineChartProps) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const tooltipRef = useRef<d3.Selection<HTMLDivElement, unknown, HTMLElement, any> | null>(null);

  useEffect(() => {
    tooltipRef.current = d3
      .select("body")
      .append("div")
      .style("position", "absolute")
      .style("background", "white")
      .style("border", "1px solid #ccc")
      .style("padding", "8px 12px")
      .style("border-radius", "6px")
      .style("pointer-events", "none")
      .style("opacity", 0)
      .style("font-size", "12px")
      .style("box-shadow", "0 2px 6px rgba(0,0,0,0.15)")
      .style("z-index", "1000");
    return () => {
      tooltipRef.current?.remove();
    };
  }, []);

  useEffect(() => {
    if (!data.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 600;
    const height = 300;
    const margin = { top: 40, right: 30, bottom: 50, left: 60 };
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    const g = svg
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const sorted = [...data].sort((a, b) => a.year - b.year);

    const xScale = d3
      .scaleLinear()
      .domain(d3.extent(sorted, (d) => d.year) as [number, number])
      .range([0, innerW]);

    const yExtent = d3.extent(sorted, (d) => d.imc) as [number, number];
    const yPad = (yExtent[1] - yExtent[0]) * 0.15 || 1;
    const yScale = d3
      .scaleLinear()
      .domain([yExtent[0] - yPad, yExtent[1] + yPad])
      .range([innerH, 0]);

    g.append("g")
      .attr("transform", `translate(0,${innerH})`)
      .call(d3.axisBottom(xScale).tickFormat(d3.format("d")).ticks(6));

    g.append("g").call(d3.axisLeft(yScale).ticks(6));

    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -45)
      .attr("x", -innerH / 2)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .text("IMC ajuste par l'age");

    g.append("text")
      .attr("x", innerW / 2)
      .attr("y", innerH + 40)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .text("Annee des Jeux Olympiques");

    g.append("text")
      .attr("x", innerW / 2)
      .attr("y", -18)
      .attr("text-anchor", "middle")
      .style("font-size", "14px")
      .style("font-weight", "bold")
      .text(`Evolution de l'IMC ajuste — ${country} — ${sport}`);

    g.append("text")
      .attr("x", innerW / 2)
      .attr("y", -4)
      .attr("text-anchor", "middle")
      .style("font-size", "11px")
      .style("fill", "#666")
      .text("IMC ajuste = IMC x (Age / 25)");

    const line = d3
      .line<YearlyIMC>()
      .x((d) => xScale(d.year))
      .y((d) => yScale(d.imc))
      .curve(d3.curveMonotoneX);

    g.append("path")
      .datum(sorted)
      .attr("fill", "none")
      .attr("stroke", "#4a90d9")
      .attr("stroke-width", 2.5)
      .attr("d", line);

    g.selectAll("circle")
      .data(sorted)
      .enter()
      .append("circle")
      .attr("cx", (d) => xScale(d.year))
      .attr("cy", (d) => yScale(d.imc))
      .attr("r", 4)
      .attr("fill", "#4a90d9")
      .on("mouseover", function (event, d) {
        d3.select(this).attr("r", 6);
        tooltipRef.current
          ?.style("opacity", 1)
          .html(`<strong>${d.year}</strong><br/>IMC ajuste: ${d.imc.toFixed(2)}`)
          .style("left", `${event.pageX + 12}px`)
          .style("top", `${event.pageY - 28}px`);
      })
      .on("mousemove", function (event) {
        tooltipRef.current
          ?.style("left", `${event.pageX + 12}px`)
          .style("top", `${event.pageY - 28}px`);
      })
      .on("mouseout", function () {
        d3.select(this).attr("r", 4);
        tooltipRef.current?.style("opacity", 0);
      });

    if (sorted.length >= 2) {
      const n = sorted.length;
      const sumX = d3.sum(sorted, (d) => d.year);
      const sumY = d3.sum(sorted, (d) => d.imc);
      const sumXY = d3.sum(sorted, (d) => d.year * d.imc);
      const sumX2 = d3.sum(sorted, (d) => d.year * d.year);
      const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
      const intercept = (sumY - slope * sumX) / n;

      const x1 = sorted[0].year;
      const x2 = sorted[sorted.length - 1].year;
      const y1 = slope * x1 + intercept;
      const y2 = slope * x2 + intercept;

      g.append("line")
        .attr("x1", xScale(x1))
        .attr("x2", xScale(x2))
        .attr("y1", yScale(y1))
        .attr("y2", yScale(y2))
        .attr("stroke", "#e8751a")
        .attr("stroke-width", 2)
        .attr("stroke-dasharray", "6,4")
        .attr("opacity", 0.8);

      const legendG = g.append("g").attr("transform", `translate(${innerW - 180}, 10)`);
      legendG
        .append("line")
        .attr("x1", 0).attr("x2", 20).attr("y1", 0).attr("y2", 0)
        .attr("stroke", "#4a90d9").attr("stroke-width", 2.5);
      legendG.append("text").attr("x", 25).attr("y", 4).text("IMC ajuste par l'age").style("font-size", "10px");

      legendG
        .append("line")
        .attr("x1", 0).attr("x2", 20).attr("y1", 18).attr("y2", 18)
        .attr("stroke", "#e8751a").attr("stroke-width", 2).attr("stroke-dasharray", "6,4");
      legendG.append("text").attr("x", 25).attr("y", 22).text("Tendance").style("font-size", "10px");
    }
  }, [data, country, sport]);

  return <svg ref={svgRef} />;
};

export default TrendLineChart;
