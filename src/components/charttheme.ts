import * as d3 from "d3";

export const THEME = {
    bg: "#edf3fb",
    bg1: "#f8fbff",
    bg2: "#ffffff",
    bg3: "#dfe8f4",

    text: "#243044",
    text2: "rgba(36,48,68,0.72)",
    text3: "rgba(36,48,68,0.48)",

    blue: "#0085C7",
    yellow: "#F4C300",
    green: "#009F6B",
    red: "#DF0024",
    orange: "#c78748", 

    gridLine: "rgba(36,48,68,0.10)",
    axisLine: "rgba(36,48,68,0.40)",
    tickColor: "rgba(36,48,68,0.58)",
    borderColor: "rgba(36,48,68,0.14)",

    fontDisplay: "'Bebas Neue', sans-serif",
    fontBody: "'DM Sans', sans-serif",
    fontMono: "'DM Mono', monospace",
} as const;

export function applyTooltipStyle(
    selection: d3.Selection<HTMLDivElement, unknown, HTMLElement, any>,
) {
    return selection
        .style("position", "absolute")
        .style("background", "#ffffff")
        .style("border", "1px solid rgba(36,48,68,0.16)")
        .style("padding", "9px 13px")
        .style("border-radius", "8px")
        .style("pointer-events", "none")
        .style("opacity", "0")
        .style("font-family", "'DM Sans', sans-serif")
        .style("font-size", "12px")
        .style("color", THEME.text)
        .style("box-shadow", "0 12px 28px rgba(31,56,84,0.18)")
        .style("line-height", "1.6")
        .style("z-index", "1000")
        .style("max-width", "220px");
}

export function styleAxis(
    g: d3.Selection<SVGGElement, unknown, null, undefined>,
    opts?: { hideLine?: boolean },
) {
    g.selectAll("text")
        .style("fill", THEME.tickColor)
        .style("font-family", THEME.fontBody)
        .style("font-size", "10px");

    g.selectAll("line").style("stroke", THEME.axisLine);

    g.select(".domain").style(
        "stroke",
        opts?.hideLine ? "none" : THEME.axisLine,
    );
}

export function addGrid(
    g: d3.Selection<SVGGElement, unknown, null, undefined>,
    yScale: d3.ScaleLinear<number, number>,
    width: number,
    ticks = 5,
) {
    g.append("g")
        .attr("class", "grid")
        .call(
            d3
                .axisLeft(yScale)
                .ticks(ticks)
                .tickSize(-width)
                .tickFormat(() => ""),
        )
        .call((g) => g.select(".domain").remove())
        .call((g) =>
            g
                .selectAll("line")
                .style("stroke", THEME.gridLine)
                .style("stroke-dasharray", "3,4"),
        );
}
