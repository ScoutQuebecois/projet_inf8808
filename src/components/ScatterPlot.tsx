// import { useEffect, useRef } from "react";
// import * as d3 from "d3";

// export interface BubbleData {
//   country: string;
//   sport: string;
//   avgHeight: number;
//   avgWeight: number;
//   avgAge: number;
//   medalCount: number;
//   isDominant: boolean;
// }

// interface ScatterPlotProps {
//   data: BubbleData[];
//   highlightSport: string | null;
//   highlightCountry: string | null;
// }

// const ScatterPlot = ({ data, highlightSport, highlightCountry }: ScatterPlotProps) => {
//   const svgRef = useRef<SVGSVGElement | null>(null);
//   const tooltipRef = useRef<d3.Selection<HTMLDivElement, unknown, HTMLElement, any> | null>(null);

//   useEffect(() => {
//     tooltipRef.current = d3
//       .select("body")
//       .append("div")
//       .attr("class", "scatter-tooltip")
//       .style("position", "absolute")
//       .style("background", "white")
//       .style("border", "1px solid #ccc")
//       .style("padding", "10px 14px")
//       .style("border-radius", "6px")
//       .style("pointer-events", "none")
//       .style("opacity", 0)
//       .style("font-size", "12px")
//       .style("box-shadow", "0 2px 6px rgba(0,0,0,0.15)")
//       .style("z-index", "1000");

//     return () => {
//       tooltipRef.current?.remove();
//     };
//   }, []);

//   useEffect(() => {
//     if (!data.length) return;

//     const svg = d3.select(svgRef.current);
//     svg.selectAll("*").remove();

//     const width = 700;
//     const height = 500;
//     const margin = { top: 30, right: 30, bottom: 60, left: 65 };
//     const innerW = width - margin.left - margin.right;
//     const innerH = height - margin.top - margin.bottom;

//     const g = svg
//       .attr("width", width)
//       .attr("height", height)
//       .append("g")
//       .attr("transform", `translate(${margin.left},${margin.top})`);

//     const heightExtent = d3.extent(data, (d) => d.avgHeight) as [number, number];
//     const weightExtent = d3.extent(data, (d) => d.avgWeight) as [number, number];
//     const medalExtent = d3.extent(data, (d) => d.medalCount) as [number, number];

//     const xPad = (heightExtent[1] - heightExtent[0]) * 0.05 || 5;
//     const yPad = (weightExtent[1] - weightExtent[0]) * 0.05 || 5;

//     const xScale = d3
//       .scaleLinear()
//       .domain([heightExtent[0] - xPad, heightExtent[1] + xPad])
//       .range([0, innerW]);
//     const yScale = d3
//       .scaleLinear()
//       .domain([weightExtent[0] - yPad, weightExtent[1] + yPad])
//       .range([innerH, 0]);
//     const rScale = d3
//       .scaleSqrt()
//       .domain([medalExtent[0], medalExtent[1]])
//       .range([4, 30]);

//     g.append("g")
//       .attr("transform", `translate(0,${innerH})`)
//       .call(d3.axisBottom(xScale).ticks(8))
//       .selectAll("text")
//       .style("font-size", "11px");

//     g.append("g")
//       .call(d3.axisLeft(yScale).ticks(8))
//       .selectAll("text")
//       .style("font-size", "11px");

//     g.append("text")
//       .attr("x", innerW / 2)
//       .attr("y", innerH + 45)
//       .attr("text-anchor", "middle")
//       .style("font-size", "13px")
//       .text("Taille moyenne (cm)");

//     g.append("text")
//       .attr("transform", "rotate(-90)")
//       .attr("y", -50)
//       .attr("x", -innerH / 2)
//       .attr("text-anchor", "middle")
//       .style("font-size", "13px")
//       .text("Poids moyen (kg)");

//     g.append("text")
//       .attr("x", innerW / 2)
//       .attr("y", -10)
//       .attr("text-anchor", "middle")
//       .style("font-size", "15px")
//       .style("font-weight", "bold")
//       .text("Profil physique des médaillés par nation et par sport");

//     const sorted = [...data].sort((a, b) => b.medalCount - a.medalCount);

//     g.selectAll("circle")
//       .data(sorted)
//       .enter()
//       .append("circle")
//       .attr("cx", (d) => xScale(d.avgHeight))
//       .attr("cy", (d) => yScale(d.avgWeight))
//       .attr("r", (d) => rScale(d.medalCount))
//       .attr("fill", (d) => {
//         if (highlightSport && d.sport !== highlightSport) return "#ddd";
//         if (highlightCountry && d.country !== highlightCountry) return "#ddd";
//         return d.isDominant ? "#4a90d9" : "#bbb";
//       })
//       .attr("stroke", (d) => {
//         if (highlightSport && d.sport === highlightSport) return "#2c5f99";
//         if (highlightCountry && d.country === highlightCountry) return "#2c5f99";
//         return d.isDominant ? "#2c5f99" : "#999";
//       })
//       .attr("stroke-width", (d) => {
//         if (
//           (highlightSport && d.sport === highlightSport) ||
//           (highlightCountry && d.country === highlightCountry)
//         )
//           return 2;
//         return 1;
//       })
//       .attr("opacity", (d) => {
//         if (highlightSport && d.sport !== highlightSport) return 0.2;
//         if (highlightCountry && d.country !== highlightCountry) return 0.3;
//         return 0.75;
//       })
//       .on("mouseover", function (event, d) {
//         d3.select(this).attr("opacity", 1).attr("stroke-width", 2.5);
//         tooltipRef.current
//           ?.style("opacity", 1)
//           .html(
//             `<strong>${d.country}</strong> — ${d.sport}<br/>
//             Taille moy.: ${d.avgHeight.toFixed(1)} cm<br/>
//             Poids moy.: ${d.avgWeight.toFixed(1)} kg<br/>
//             Âge moy.: ${d.avgAge.toFixed(1)} ans<br/>
//             Médaillés: ${d.medalCount}`
//           )
//           .style("left", `${event.pageX + 14}px`)
//           .style("top", `${event.pageY - 30}px`);
//       })
//       .on("mousemove", function (event) {
//         tooltipRef.current
//           ?.style("left", `${event.pageX + 14}px`)
//           .style("top", `${event.pageY - 30}px`);
//       })
//       .on("mouseout", function (_, d) {
//         const opacity =
//           highlightSport && d.sport !== highlightSport
//             ? 0.2
//             : highlightCountry && d.country !== highlightCountry
//             ? 0.3
//             : 0.75;
//         d3.select(this).attr("opacity", opacity).attr("stroke-width", 1);
//         tooltipRef.current?.style("opacity", 0);
//       });

//     const legendX = innerW - 80;
//     const legendY = innerH - 80;
//     const legendSizes = [medalExtent[0], Math.round((medalExtent[0] + medalExtent[1]) / 2), medalExtent[1]];
//     const legendG = g.append("g").attr("transform", `translate(${legendX}, ${legendY})`);

//     legendG
//       .append("text")
//       .attr("x", 0)
//       .attr("y", -rScale(medalExtent[1]) - 10)
//       .style("font-size", "10px")
//       .style("font-weight", "bold")
//       .text("Médaillés");

//     legendSizes.forEach((size) => {
//       const r = rScale(size);
//       const cy = -r;
//       legendG
//         .append("circle")
//         .attr("cx", 0)
//         .attr("cy", cy)
//         .attr("r", r)
//         .attr("fill", "none")
//         .attr("stroke", "#999");
//       legendG
//         .append("text")
//         .attr("x", rScale(medalExtent[1]) + 5)
//         .attr("y", cy + 4)
//         .style("font-size", "9px")
//         .text(String(size));
//     });
//   }, [data, highlightSport, highlightCountry]);

//   return <svg ref={svgRef} />;
// };

// export default ScatterPlot;

import { useEffect, useRef } from "react";
import * as d3 from "d3";

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
  const svgRef = useRef<SVGSVGElement | null>(null);
  const tooltipRef = useRef<d3.Selection<HTMLDivElement, unknown, HTMLElement, any> | null>(null);

  useEffect(() => {
    tooltipRef.current = d3
      .select("body")
      .append("div")
      .attr("class", "scatter-tooltip")
      .style("position", "absolute")
      .style("background", "white")
      .style("border", "1px solid #ccc")
      .style("padding", "10px 14px")
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
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    if (!data.length) return;

    const width = 700;
    const height = 500;
    const margin = { top: 30, right: 30, bottom: 60, left: 65 };
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    const g = svg
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const heightExtent = d3.extent(data, (d) => d.avgHeight) as [number, number];
    const weightExtent = d3.extent(data, (d) => d.avgWeight) as [number, number];
    const medalExtent = d3.extent(data, (d) => d.medalCount) as [number, number];

    const xPad = (heightExtent[1] - heightExtent[0]) * 0.05 || 5;
    const yPad = (weightExtent[1] - weightExtent[0]) * 0.05 || 5;

    const xScale = d3
      .scaleLinear()
      .domain([heightExtent[0] - xPad, heightExtent[1] + xPad])
      .range([0, innerW]);

    const yScale = d3
      .scaleLinear()
      .domain([weightExtent[0] - yPad, weightExtent[1] + yPad])
      .range([innerH, 0]);

    const rScale = d3
      .scaleSqrt()
      .domain([medalExtent[0], medalExtent[1]])
      .range([4, 30]);

    g.append("g")
      .attr("transform", `translate(0,${innerH})`)
      .call(d3.axisBottom(xScale).ticks(8))
      .selectAll("text")
      .style("font-size", "11px");

    g.append("g")
      .call(d3.axisLeft(yScale).ticks(8))
      .selectAll("text")
      .style("font-size", "11px");

    g.append("text")
      .attr("x", innerW / 2)
      .attr("y", innerH + 45)
      .attr("text-anchor", "middle")
      .style("font-size", "13px")
      .text("Taille moyenne (cm)");

    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -50)
      .attr("x", -innerH / 2)
      .attr("text-anchor", "middle")
      .style("font-size", "13px")
      .text("Poids moyen (kg)");

    g.append("text")
      .attr("x", innerW / 2)
      .attr("y", -10)
      .attr("text-anchor", "middle")
      .style("font-size", "15px")
      .style("font-weight", "bold")
      .text("Profil physique des médaillés par nation et par sport");

    const sorted = [...data].sort((a, b) => b.medalCount - a.medalCount);

    const circles = g
      .selectAll<SVGCircleElement, BubbleData>("circle.data-bubble")
      .data(sorted)
      .enter()
      .append("circle")
      .attr("class", "data-bubble")
      .attr("cx", (d) => xScale(d.avgHeight))
      .attr("cy", (d) => yScale(d.avgWeight))
      .attr("r", (d) => rScale(d.medalCount))
      .attr("fill", (d) => {
        if (highlightCountry && d.country !== highlightCountry) return "#ddd";
        if (highlightSport && d.sport !== highlightSport) return "#ddd";
        return d.isDominant ? "#4a90d9" : "#bbb";
      })
      .attr("stroke", (d) => {
        if (highlightCountry && d.country === highlightCountry) return "#2c5f99";
        if (highlightSport && d.sport === highlightSport) return "#2c5f99";
        return d.isDominant ? "#2c5f99" : "#999";
      })
      .attr("stroke-width", (d) => {
        if (
          (highlightCountry && d.country === highlightCountry) ||
          (highlightSport && d.sport === highlightSport)
        ) {
          return 2;
        }
        return 1;
      })
      .attr("opacity", (d) => {
        if (highlightCountry) {
          return d.country === highlightCountry ? 1 : 0.2;
        }
        if (highlightSport) {
          return d.sport === highlightSport ? 1 : 0.2;
        }
        return 0.75;
      })
      .on("mouseover", function (event, d) {
        d3.select(this).raise().attr("opacity", 1).attr("stroke-width", 2.5);

        tooltipRef.current
          ?.style("opacity", 1)
          .html(
            `<strong>${d.country}</strong> — ${d.sport}<br/>
            Taille moy.: ${d.avgHeight.toFixed(1)} cm<br/>
            Poids moy.: ${d.avgWeight.toFixed(1)} kg<br/>
            Âge moy.: ${d.avgAge.toFixed(1)} ans<br/>
            Médaillés: ${d.medalCount}`
          )
          .style("left", `${event.pageX + 14}px`)
          .style("top", `${event.pageY - 30}px`);
      })
      .on("mousemove", function (event) {
        tooltipRef.current
          ?.style("left", `${event.pageX + 14}px`)
          .style("top", `${event.pageY - 30}px`);
      })
      .on("mouseout", function (_, d) {
        const defaultOpacity =
          highlightCountry && d.country !== highlightCountry
            ? 0.1
            : highlightSport && d.sport !== highlightSport
            ? 0.1
            : highlightCountry && d.country === highlightCountry
            ? 1
            : highlightSport && d.sport === highlightSport
            ? 1
            : 0.75;

        const defaultStrokeWidth =
          (highlightCountry && d.country === highlightCountry) ||
          (highlightSport && d.sport === highlightSport)
            ? 2
            : 1;

        d3.select(this).attr("opacity", defaultOpacity).attr("stroke-width", defaultStrokeWidth);
        tooltipRef.current?.style("opacity", 0);
      });

    if (highlightCountry) {
      circles.filter((d) => d.country === highlightCountry).raise();
    }

    const legendX = innerW - 80;
    const legendY = innerH - 80;
    const legendSizes = [
      medalExtent[0],
      Math.round((medalExtent[0] + medalExtent[1]) / 2),
      medalExtent[1],
    ];

    const legendG = g.append("g").attr("transform", `translate(${legendX}, ${legendY})`);

    legendG
      .append("text")
      .attr("x", 0)
      .attr("y", -rScale(medalExtent[1]) - 10)
      .style("font-size", "10px")
      .style("font-weight", "bold")
      .text("Médaillés");

    legendSizes.forEach((size) => {
      const r = rScale(size);
      const cy = -r;

      legendG
        .append("circle")
        .attr("cx", 0)
        .attr("cy", cy)
        .attr("r", r)
        .attr("fill", "none")
        .attr("stroke", "#999");

      legendG
        .append("text")
        .attr("x", rScale(medalExtent[1]) + 5)
        .attr("y", cy + 4)
        .style("font-size", "9px")
        .text(String(size));
    });
  }, [data, highlightSport, highlightCountry]);

  return <svg ref={svgRef} />;
};

export default ScatterPlot;