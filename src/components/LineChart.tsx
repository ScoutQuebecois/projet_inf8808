import { useEffect, useRef } from "react";
import * as d3 from "d3";

export interface SeriesData {
  sport: string;
  values: { year: number; value: number }[];
}

interface LineChartProps {
  data: SeriesData[];
  title: string;
  yLabel: string;
  colorScale: d3.ScaleOrdinal<string, string>;
  highlightedSport?: string | null;
  nonMedalData?: SeriesData[];
  showNonMedal?: boolean;
}

const LineChart = ({
  data,
  title,
  yLabel,
  colorScale,
  highlightedSport,
  nonMedalData,
  showNonMedal,
}: LineChartProps) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const tooltipRef = useRef<d3.Selection<HTMLDivElement, unknown, HTMLElement, any> | null>(null);

  useEffect(() => {
    tooltipRef.current = d3
      .select("body")
      .append("div")
      .attr("class", "line-tooltip")
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

    const width = 520;
    const height = 320;
    const margin = { top: 30, right: 100, bottom: 70, left: 55 };
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    const g = svg
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const allValues = data.flatMap((s) => s.values);
    const nonMedalValues = showNonMedal && nonMedalData ? nonMedalData.flatMap((s) => s.values) : [];
    const combined = [...allValues, ...nonMedalValues];

    const xExtent = d3.extent(combined, (d) => d.year) as [number, number];
    const yExtent = d3.extent(combined, (d) => d.value) as [number, number];
    const yPad = (yExtent[1] - yExtent[0]) * 0.1 || 5;

    const xScale = d3.scaleLinear().domain(xExtent).range([0, innerW]);
    const yScale = d3
      .scaleLinear()
      .domain([yExtent[0] - yPad, yExtent[1] + yPad])
      .range([innerH, 0]);

    g.append("g")
      .attr("transform", `translate(0,${innerH})`)
      .call(d3.axisBottom(xScale).tickFormat(d3.format("d")).ticks(5))
      .selectAll("text")
      .style("font-size", "10px");

    g.append("g")
      .call(d3.axisLeft(yScale).ticks(6))
      .selectAll("text")
      .style("font-size", "11px");

    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -45)
      .attr("x", -innerH / 2)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .text(yLabel);

    g.append("text")
      .attr("x", innerW / 2)
      .attr("y", -10)
      .attr("text-anchor", "middle")
      .style("font-size", "14px")
      .style("font-weight", "bold")
      .text(title);

    const line = d3
      .line<{ year: number; value: number }>()
      .x((d) => xScale(d.year))
      .y((d) => yScale(d.value))
      .curve(d3.curveMonotoneX);

    if (showNonMedal && nonMedalData) {
      nonMedalData.forEach((series) => {
        const color = colorScale(series.sport);
        g.append("path")
          .datum(series.values)
          .attr("fill", "none")
          .attr("stroke", color)
          .attr("stroke-width", 1.5)
          .attr("stroke-dasharray", "5,5")
          .attr("opacity", 0.6)
          .attr("d", line);
      });
    }

    data.forEach((series) => {
      const color = colorScale(series.sport);
      const isHighlighted = !highlightedSport || highlightedSport === series.sport;

      g.append("path")
        .datum(series.values)
        .attr("fill", "none")
        .attr("stroke", color)
        .attr("stroke-width", isHighlighted ? 2.5 : 1.5)
        .attr("opacity", isHighlighted ? 1 : 0.3)
        .attr("d", line);

      g.selectAll(`.dot-${series.sport.replace(/\s+/g, "-")}`)
        .data(series.values)
        .enter()
        .append("circle")
        .attr("cx", (d) => xScale(d.year))
        .attr("cy", (d) => yScale(d.value))
        .attr("r", 3)
        .attr("fill", color)
        .attr("opacity", isHighlighted ? 0.8 : 0.2)
        .on("mouseover", function (event, d) {
          d3.select(this).attr("r", 5).attr("opacity", 1);
          tooltipRef.current
            ?.style("opacity", 1)
            .html(
              `<strong>${series.sport}</strong><br/>Année: ${d.year}<br/>${yLabel}: ${d.value.toFixed(1)}`
            )
            .style("left", `${event.pageX + 12}px`)
            .style("top", `${event.pageY - 30}px`);
        })
        .on("mousemove", function (event) {
          tooltipRef.current
            ?.style("left", `${event.pageX + 12}px`)
            .style("top", `${event.pageY - 30}px`);
        })
        .on("mouseout", function () {
          d3.select(this).attr("r", 3).attr("opacity", isHighlighted ? 0.8 : 0.2);
          tooltipRef.current?.style("opacity", 0);
        });
    });

    if (showNonMedal && nonMedalData && nonMedalData.length > 0) {
      const legendY = innerH + 35;
      const legendG = g.append("g").attr("transform", `translate(${innerW - 200}, ${legendY - 45})`);

      legendG.append("line").attr("x1", 0).attr("x2", 20).attr("y1", 0).attr("y2", 0)
        .attr("stroke", "#666").attr("stroke-width", 2);
      legendG.append("text").attr("x", 25).attr("y", 4).text("Medaillés").style("font-size", "10px");

      legendG.append("line").attr("x1", 0).attr("x2", 20).attr("y1", 15).attr("y2", 15)
        .attr("stroke", "#666").attr("stroke-width", 1.5).attr("stroke-dasharray", "5,5");
      legendG.append("text").attr("x", 25).attr("y", 19).text("Non médaillés").style("font-size", "10px");
    }
  }, [data, title, yLabel, colorScale, highlightedSport, nonMedalData, showNonMedal]);

  return <svg ref={svgRef} />;
};

export default LineChart;
