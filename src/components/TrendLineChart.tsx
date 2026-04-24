import { useEffect, useRef } from "react";
import * as d3 from "d3";
import { THEME, applyTooltipStyle, styleAxis, addGrid } from "./charttheme";
import { useAltTextVisibility } from "./AltTextContext";

export interface YearlyIMC {
  year: number;
  imc: number;
}

interface TrendLineChartProps {
  data: YearlyIMC[];
  country: string;
  sport: string;
}

function buildTrendLineAltText(data: YearlyIMC[], country: string, sport: string) {
    if (!data.length) {
        return `Courbe d'évolution de l'IMC ajusté par l'âge pour ${country} en ${sport}. Aucune donnée disponible.`;
    }

    const sorted = [...data].sort((a, b) => a.year - b.year);
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const delta = last.imc - first.imc;
    const imcMin = d3.min(sorted, (d) => d.imc)?.toFixed(3);
    const imcMax = d3.max(sorted, (d) => d.imc)?.toFixed(3);
    const trend = delta > 0.01 ? "une tendance à la hausse" : delta < -0.01 ? "une tendance à la baisse" : "une tendance stable";

    return [
        `Courbe d'évolution de l'IMC ajusté par l'âge pour ${country} en ${sport}.`,
        `Période couverte : de ${first.year} à ${last.year}, soit ${sorted.length} éditions des Jeux olympiques.`,
        `L'IMC ajusté passe de ${first.imc.toFixed(3)} à ${last.imc.toFixed(3)}, une variation de ${delta >= 0 ? "+" : ""}${delta.toFixed(3)}.`,
        `Les valeurs s'étendent de ${imcMin} (minimum) à ${imcMax} (maximum).`,
        `La droite de régression en pointillés orange indique ${trend} sur la période.`,
    ].join(" ");
}

const TrendLineChart = ({ data, country, sport }: TrendLineChartProps) => {
  const svgRef     = useRef<SVGSVGElement | null>(null);
  const tooltipRef = useRef<d3.Selection<HTMLDivElement, unknown, HTMLElement, any> | null>(null);
  const { showAltText } = useAltTextVisibility();
  const altText = buildTrendLineAltText(data, country, sport);

  useEffect(() => {
    tooltipRef.current = applyTooltipStyle(d3.select("body").append("div"));
    return () => { tooltipRef.current?.remove(); };
  }, []);

  useEffect(() => {
    if (!data.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width  = 700;
    const height = 280;
    const margin = { top: 32, right: 28, bottom: 52, left: 58 };
    const innerW = width  - margin.left - margin.right;
    const innerH = height - margin.top  - margin.bottom;

    svg
      .attr("width", width)
      .attr("height", height)
      .style("background", THEME.bg1)
      .style("border-radius", "8px");

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const sorted = [...data].sort((a, b) => a.year - b.year);
    const xExtent = d3.extent(sorted, (d) => d.year) as [number, number];
    const yExtent = d3.extent(sorted, (d) => d.imc)  as [number, number];
    const yPad    = (yExtent[1] - yExtent[0]) * 0.18 || 1;

    const xScale = d3.scaleLinear().domain(xExtent).range([0, innerW]);
    const yScale = d3.scaleLinear().domain([yExtent[0] - yPad, yExtent[1] + yPad]).range([innerH, 0]);

    addGrid(g, yScale, innerW, 5);

    const area = d3.area<YearlyIMC>()
      .x((d) => xScale(d.year))
      .y0(innerH)
      .y1((d) => yScale(d.imc))
      .curve(d3.curveMonotoneX);

    g.append("path")
      .datum(sorted)
      .attr("fill", `${THEME.blue}18`)
      .attr("d", area);

    const xAxis = g.append("g")
      .attr("transform", `translate(0,${innerH})`)
      .call(d3.axisBottom(xScale).tickFormat(d3.format("d")).ticks(6));
    styleAxis(xAxis as any);

    const yAxis = g.append("g").call(d3.axisLeft(yScale).ticks(5));
    styleAxis(yAxis as any);

    g.append("text")
      .attr("x", innerW / 2).attr("y", innerH + 40)
      .attr("text-anchor", "middle")
      .style("fill", THEME.text).style("font-family", THEME.fontBody)
      .style("font-size", "10px").style("letter-spacing", "0.07em")
      .text("ANNÉE DES JEUX OLYMPIQUES");

    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -46).attr("x", -innerH / 2)
      .attr("text-anchor", "middle")
      .style("fill", THEME.text).style("font-family", THEME.fontBody)
      .style("font-size", "10px").style("letter-spacing", "0.06em")
      .text("IMC AJUSTÉ PAR L'ÂGE");

    g.append("text")
      .attr("x", innerW / 2).attr("y", -14)
      .attr("text-anchor", "middle")
      .style("fill", THEME.text).style("font-family", THEME.fontBody).style("font-size", "10px")
      .text(`IMC ajusté = IMC × (âge / 25) — ${country} — ${sport}`);

    const line = d3.line<YearlyIMC>()
      .x((d) => xScale(d.year))
      .y((d) => yScale(d.imc))
      .curve(d3.curveMonotoneX);

    g.append("path")
      .datum(sorted)
      .attr("fill", "none")
      .attr("stroke", THEME.blue)
      .attr("stroke-width", 2.5)
      .attr("d", line);

    if (sorted.length >= 2) {
      const n    = sorted.length;
      const sumX = d3.sum(sorted, (d) => d.year);
      const sumY = d3.sum(sorted, (d) => d.imc);
      const sumXY = d3.sum(sorted, (d) => d.year * d.imc);
      const sumX2 = d3.sum(sorted, (d) => d.year * d.year);
      const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
      const intercept = (sumY - slope * sumX) / n;

      const x1 = sorted[0].year;
      const x2 = sorted[sorted.length - 1].year;

      g.append("line")
        .attr("x1", xScale(x1)).attr("x2", xScale(x2))
        .attr("y1", yScale(slope * x1 + intercept))
        .attr("y2", yScale(slope * x2 + intercept))
        .attr("stroke", THEME.orange).attr("stroke-width", 1.8)
        .attr("stroke-dasharray", "6,4").attr("opacity", 0.85);
    }

    g.selectAll("circle.dot")
      .data(sorted)
      .enter()
      .append("circle")
      .attr("class", "dot")
      .attr("cx", (d) => xScale(d.year))
      .attr("cy", (d) => yScale(d.imc))
      .attr("r", 4)
      .attr("fill", THEME.blue)
      .attr("stroke", THEME.bg1)
      .attr("stroke-width", 1.5)
      .on("mouseover", function (event, d) {
        d3.select(this).attr("r", 6);
        tooltipRef.current
          ?.style("opacity", "1")
          .html(
            `<span style="color:${THEME.text};font-size:10px">ANNÉE</span> <strong>${d.year}</strong><br/>
             <span style="color:${THEME.text};font-size:10px">IMC AJUSTÉ</span>
             <strong style="color:${THEME.blue}">${d.imc.toFixed(3)}</strong>`
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
        d3.select(this).attr("r", 4);
        tooltipRef.current?.style("opacity", "0");
      });

    const lgG = g.append("g").attr("transform", `translate(${innerW - 180}, 4)`);
    [
      { dash: "",     color: THEME.blue,   label: "IMC ajusté" },
      { dash: "6,4",  color: THEME.orange, label: "Tendance" },
    ].forEach(({ dash, color, label }, i) => {
      const gx = lgG.append("g").attr("transform", `translate(${i * 100},0)`);
      gx.append("line")
        .attr("x1", 0).attr("x2", 18).attr("y1", 0).attr("y2", 0)
        .attr("stroke", color).attr("stroke-width", 2).attr("stroke-dasharray", dash);
      gx.append("text")
        .attr("x", 22).attr("y", 4)
        .style("fill", THEME.text).style("font-family", THEME.fontBody).style("font-size", "9px")
        .text(label);
    });
  }, [data, country, sport]);

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

export default TrendLineChart;
