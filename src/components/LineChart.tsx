import { useEffect, useRef } from "react";
import * as d3 from "d3";
import { THEME, applyTooltipStyle, styleAxis, addGrid } from "./charttheme";
import { useAltTextVisibility } from "./AltTextContext";

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
  medalOnly?: boolean;
  seasonFilter?: "all" | "summer" | "winter";
  sortMetric?: "height" | "weight" | "age";
}

function buildLineChartAltText(
  data: SeriesData[],
  title: string,
  yLabel: string,
  highlightedSport?: string | null,
  nonMedalData?: SeriesData[],
  showNonMedal?: boolean,
  medalOnly?: boolean,
  seasonFilter?: "all" | "summer" | "winter",
) {
  if (!data.length) {
    return `Graphique en courbes : ${title}. Aucune donnée disponible pour l'indicateur ${yLabel}.`;
  }

  const allValues = data.flatMap((s) => s.values);
  const years = allValues.map((d) => d.year);
  const values = allValues.map((d) => d.value);
  const yearMin = d3.min(years);
  const yearMax = d3.max(years);
  const valMin = d3.min(values)?.toFixed(1);
  const valMax = d3.max(values)?.toFixed(1);

  const topSeries = [...data]
    .map((s) => ({
      sport: s.sport,
      latest: s.values[s.values.length - 1]?.value ?? -Infinity,
    }))
    .sort((a, b) => b.latest - a.latest)
    .slice(0, 3);

  const seasonLabel =
    seasonFilter === "summer" ? "jeux d'été"
    : seasonFilter === "winter" ? "jeux d'hiver"
    : "toutes saisons confondues";

  const parts = [
    `Graphique en courbes : ${title} — ${yLabel}.`,
    `${data.length} sport${data.length > 1 ? "s" : ""} affiché${data.length > 1 ? "s" : ""}, ${seasonLabel}, de ${yearMin} à ${yearMax}.`,
    medalOnly === false
      ? "Données incluant tous les athlètes, médaillés et non médaillés."
      : "Données limitées aux athlètes médaillés.",
    `Les valeurs de ${yLabel} s'étendent de ${valMin} à ${valMax}.`,
    `Sports avec les valeurs les plus élevées en fin de période : ${topSeries
      .map((s) => `${s.sport} (${s.latest.toFixed(1)})`)
      .join(", ")}.`,
  ];

  if (highlightedSport) {
    parts.push(`Sport mis en évidence : ${highlightedSport}.`);
  }

  if (showNonMedal && nonMedalData?.length) {
    parts.push(
      "Des courbes en pointillés représentent les athlètes non médaillés pour comparaison directe."
    );
  }

  return parts.join(" ");
}

const LineChart = ({
  data,
  title,
  yLabel,
  colorScale,
  highlightedSport,
  nonMedalData,
  showNonMedal,
  medalOnly,
  seasonFilter,
}: LineChartProps) => {
  const svgRef   = useRef<SVGSVGElement | null>(null);
  const tooltipRef = useRef<d3.Selection<HTMLDivElement, unknown, HTMLElement, any> | null>(null);
  const { showAltText } = useAltTextVisibility();
  const altText = buildLineChartAltText(data, title, yLabel, highlightedSport, nonMedalData, showNonMedal, medalOnly, seasonFilter);

  useEffect(() => {
    tooltipRef.current = applyTooltipStyle(d3.select("body").append("div"));
    return () => { tooltipRef.current?.remove(); };
  }, []);

  useEffect(() => {
    if (!data.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width  = 520;
    const height = 300;
    const margin = { top: 36, right: 24, bottom: 52, left: 52 };
    const innerW = width  - margin.left - margin.right;
    const innerH = height - margin.top  - margin.bottom;

    svg
      .attr("width", width)
      .attr("height", height)
      .style("background", THEME.bg1)
      .style("border-radius", "8px");

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const allValues      = data.flatMap((s) => s.values);
    const nonMedalValues = showNonMedal && nonMedalData ? nonMedalData.flatMap((s) => s.values) : [];
    const combined       = [...allValues, ...nonMedalValues];

    const xExtent = d3.extent(combined, (d) => d.year) as [number, number];
    const yExtent = d3.extent(combined, (d) => d.value) as [number, number];
    const yPad    = (yExtent[1] - yExtent[0]) * 0.12 || 5;

    const xScale = d3.scaleLinear().domain(xExtent).range([0, innerW]);
    const yScale = d3.scaleLinear().domain([yExtent[0] - yPad, yExtent[1] + yPad]).range([innerH, 0]);

    addGrid(g, yScale, innerW, 5);

    const xAxis = g.append("g")
      .attr("transform", `translate(0,${innerH})`)
      .call(d3.axisBottom(xScale).tickFormat(d3.format("d")).ticks(5));
    styleAxis(xAxis as any);

    const yAxis = g.append("g").call(d3.axisLeft(yScale).ticks(5));
    styleAxis(yAxis as any);

    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -42).attr("x", -innerH / 2)
      .attr("text-anchor", "middle")
      .style("fill", THEME.text)
      .style("font-family", THEME.fontBody)
      .style("font-size", "10px")
      .style("letter-spacing", "0.06em")
      .text(yLabel.toUpperCase());

    g.append("text")
      .attr("x", innerW / 2).attr("y", -16)
      .attr("text-anchor", "middle")
      .style("fill", THEME.text)
      .style("font-family", THEME.fontBody)
      .style("font-size", "12px")
      .style("font-weight", "600")
      .text(title);

    const line = d3.line<{ year: number; value: number }>()
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
          .attr("stroke-width", 1.2)
          .attr("stroke-dasharray", "5,4")
          .attr("opacity", 0.4)
          .attr("d", line);
      });
    }

    data.forEach((series) => {
      const color        = colorScale(series.sport);
      const isHighlighted = !highlightedSport || highlightedSport === series.sport;
      const opacity       = isHighlighted ? 1 : 0.2;

      g.append("path")
        .datum(series.values)
        .attr("fill", "none")
        .attr("stroke", color)
        .attr("stroke-width", isHighlighted ? 2.2 : 1.2)
        .attr("opacity", opacity)
        .attr("d", line);

      g.selectAll(`.dot-${series.sport.replace(/[^a-zA-Z0-9]/g, "-")}`)
        .data(series.values)
        .enter()
        .append("circle")
        .attr("cx", (d) => xScale(d.year))
        .attr("cy", (d) => yScale(d.value))
        .attr("r", 2.5)
        .attr("fill", color)
        .attr("opacity", isHighlighted ? 0.85 : 0.15)
        .on("mouseover", function (event, d) {
          d3.select(this).attr("r", 5).attr("opacity", 1);
          tooltipRef.current
            ?.style("opacity", "1")
            .html(
              `<span style="color:${color};font-weight:600">${series.sport}</span><br/>
               <span style="color:${THEME.text};font-size:10px">ANNÉE</span> ${d.year}<br/>
               <span style="color:${THEME.text};font-size:10px">${yLabel.toUpperCase()}</span> <strong>${d.value.toFixed(1)}</strong>`
            )
            .style("left", `${event.pageX + 14}px`)
            .style("top",  `${event.pageY - 36}px`);
        })
        .on("mousemove", function (event) {
          tooltipRef.current
            ?.style("left", `${event.pageX + 14}px`)
            .style("top",  `${event.pageY - 36}px`);
        })
        .on("mouseout", function () {
          d3.select(this).attr("r", 2.5).attr("opacity", isHighlighted ? 0.85 : 0.15);
          tooltipRef.current?.style("opacity", "0");
        });
    });

    if (showNonMedal && nonMedalData && nonMedalData.length > 0) {
      const lgY = innerH + 32;
      const lgG = g.append("g").attr("transform", `translate(${innerW - 170},${lgY})`);

      const items = [
        { dash: "", label: "Médaillés", opacity: 1 },
        { dash: "5,4", label: "Non médaillés", opacity: 0.5 },
      ];
      items.forEach(({ dash, label, opacity }, i) => {
        const gx = lgG.append("g").attr("transform", `translate(${i * 88},0)`);
        gx.append("line")
          .attr("x1", 0).attr("x2", 18).attr("y1", 0).attr("y2", 0)
          .attr("stroke", THEME.text).attr("stroke-width", 1.5)
          .attr("stroke-dasharray", dash).attr("opacity", opacity);
        gx.append("text")
          .attr("x", 22).attr("y", 4)
          .style("fill", THEME.text).style("font-family", THEME.fontBody).style("font-size", "9px")
          .text(label);
      });
    }
  }, [data, title, yLabel, colorScale, highlightedSport, nonMedalData, showNonMedal]);

  return (
    <figure className="chart-with-alt">
      <svg
        ref={svgRef}
        style={{ display: "block", width: "100%" }}
      />
      {showAltText && <figcaption className="chart-alt-text">{altText}</figcaption>}
    </figure>
  );
};

export default LineChart;
