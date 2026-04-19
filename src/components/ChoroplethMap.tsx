import { useEffect, useRef } from "react";
import * as d3 from "d3";
import { THEME, applyTooltipStyle } from "./charttheme";

export interface CountryIMCData {
  country: string;
  iso3: string;
  delta: number;
}

interface ChoroplethMapProps {
  data: CountryIMCData[];
  onCountryClick: (country: string, iso3: string) => void;
  selectedCountry: string | null;
  sportName: string;
}

const WORLD_GEOJSON_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

const ChoroplethMap = ({ data, onCountryClick, selectedCountry, sportName }: ChoroplethMapProps) => {
  const svgRef     = useRef<SVGSVGElement | null>(null);
  const tooltipRef = useRef<d3.Selection<HTMLDivElement, unknown, HTMLElement, any> | null>(null);

  useEffect(() => {
    tooltipRef.current = applyTooltipStyle(d3.select("body").append("div"));
    return () => { tooltipRef.current?.remove(); };
  }, []);

  useEffect(() => {
    if (!data.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width  = 800;
    const height = 460;

    svg
      .attr("width", width)
      .attr("height", height)
      .style("background", THEME.bg1)
      .style("border-radius", "8px");

    const maxAbs = d3.max(data, (d) => Math.abs(d.delta)) || 1;

    const colorScale = d3.scaleDiverging<string>()
      .domain([-maxAbs, 0, maxAbs])
      .interpolator(d3.interpolateRgbBasis([THEME.orange, "#f8fbff", THEME.blue]));

    const dataMap = new Map(data.map((d) => [d.iso3, d]));

    const projection = d3.geoNaturalEarth1()
      .scale(148)
      .translate([width / 2, height / 2 + 18]);

    const path = d3.geoPath().projection(projection);

    svg.append("path")
      .datum(d3.geoGraticule()())
      .attr("d", path as any)
      .attr("fill", "none")
      .attr("stroke", "rgba(36,48,68,0.10)")
      .attr("stroke-width", 0.5);

    svg.append("path")
      .datum({ type: "Sphere" })
      .attr("d", path as any)
      .attr("fill", "#edf3fb");

    Promise.all([d3.json(WORLD_GEOJSON_URL)]).then(([world]: any) => {
      let countries: any;

      if (world.type === "Topology") {
        const objectKey = Object.keys(world.objects)[0];
        const geometries = world.objects[objectKey].geometries;
        const worldArcs = world.arcs;

        function decodeArc(arcIndex: number): [number, number][] {
          const arc = worldArcs[arcIndex < 0 ? ~arcIndex : arcIndex];
          const coords: [number, number][] = [];
          let x = 0, y = 0;
          for (const [dx, dy] of arc) {
            x += dx; y += dy;
            coords.push([
              x * world.transform.scale[0] + world.transform.translate[0],
              y * world.transform.scale[1] + world.transform.translate[1],
            ] as [number, number]);
          }
          return arcIndex < 0 ? coords.reverse() : coords;
        }

        function arcsToCoords(arcRefs: any): any {
          if (typeof arcRefs[0] === "number") {
            let coords: [number, number][] = [];
            for (const ref of arcRefs) coords = coords.concat(decodeArc(ref));
            return coords;
          }
          return arcRefs.map((r: any) => arcsToCoords(r));
        }

        const features = geometries.map((geo: any) => {
          let geometry: any = null;
          if (geo.type === "Polygon")
            geometry = { type: "Polygon", coordinates: geo.arcs.map((ring: number[]) => arcsToCoords(ring)) };
          else if (geo.type === "MultiPolygon")
            geometry = { type: "MultiPolygon", coordinates: geo.arcs.map((poly: number[][]) => poly.map((ring: number[]) => arcsToCoords(ring))) };
          return { type: "Feature" as const, id: geo.id, properties: geo.properties || {}, geometry };
        });

        countries = { type: "FeatureCollection", features };
      } else {
        countries = world;
      }

      const getEntry = (d: any) => {
        const iso = d.id || d.properties?.iso_a3;
        return dataMap.get(numericToIso3(iso)) || dataMap.get(iso);
      };

      svg.selectAll("path.country")
        .data(countries.features)
        .enter()
        .append("path")
        .attr("class", "country")
        .attr("d", (d: any) => path(d) || "")
        .attr("fill", (d: any) => {
          const entry = getEntry(d);
          return entry ? colorScale(entry.delta) : "rgba(36,48,68,0.06)";
        })
        .attr("stroke", (d: any) => {
          const entry = getEntry(d);
          if (entry && entry.country === selectedCountry) return THEME.yellow;
          return "rgba(36,48,68,0.14)";
        })
        .attr("stroke-width", (d: any) => {
          const entry = getEntry(d);
          return entry && entry.country === selectedCountry ? 2.5 : 0.4;
        })
        .style("cursor", (d: any) => (getEntry(d) ? "pointer" : "default"))
        .on("mouseover", function (event, d: any) {
          const entry = getEntry(d);
          if (!entry) return;
          d3.select(this)
            .attr("stroke", THEME.yellow)
            .attr("stroke-width", 1.5);
          tooltipRef.current
            ?.style("opacity", "1")
            .html(
              `<span style="font-weight:600">${entry.country}</span><br/>
               <span style="color:${THEME.text};font-size:10px">VARIATION IMC AJUSTÉ</span><br/>
               <span style="color:${entry.delta > 0 ? THEME.blue : THEME.orange};font-size:1.1em;font-weight:600">
                 ${entry.delta > 0 ? "+" : ""}${entry.delta.toFixed(3)}
               </span>`
            )
            .style("left", `${event.pageX + 14}px`)
            .style("top",  `${event.pageY - 40}px`);
        })
        .on("mousemove", function (event) {
          tooltipRef.current
            ?.style("left", `${event.pageX + 14}px`)
            .style("top",  `${event.pageY - 40}px`);
        })
        .on("mouseout", function (_, d: any) {
          const entry = getEntry(d);
          const isSelected = entry && entry.country === selectedCountry;
          d3.select(this)
            .attr("stroke", isSelected ? THEME.yellow : "rgba(36,48,68,0.14)")
            .attr("stroke-width", isSelected ? 2.5 : 0.4);
          tooltipRef.current?.style("opacity", "0");
        })
        .on("click", function (_, d: any) {
          const entry = getEntry(d);
          if (entry) onCountryClick(entry.country, entry.iso3);
        });

      const lgW  = 200;
      const lgH  = 10;
      const lgX  = width - lgW - 16;
      const lgY  = height - 46;

      const defs = svg.append("defs");
      const grad = defs.append("linearGradient").attr("id", "choro-grad");
      for (let i = 0; i <= 10; i++) {
        const t = i / 10;
        grad.append("stop")
          .attr("offset", `${t * 100}%`)
          .attr("stop-color", colorScale(-maxAbs + t * 2 * maxAbs));
      }

      svg.append("rect")
        .attr("x", lgX - 1).attr("y", lgY - 1)
        .attr("width", lgW + 2).attr("height", lgH + 2)
        .attr("fill", "none").attr("stroke", THEME.borderColor).attr("rx", 3);

      svg.append("rect")
        .attr("x", lgX).attr("y", lgY)
        .attr("width", lgW).attr("height", lgH)
        .attr("fill", "url(#choro-grad)").attr("rx", 2);

      const lgScale = d3.scaleLinear().domain([-maxAbs, maxAbs]).range([0, lgW]);
      svg.append("g")
        .attr("transform", `translate(${lgX},${lgY + lgH})`)
        .call(d3.axisBottom(lgScale).ticks(4).tickFormat(d3.format("+.2f")))
        .call((g) => g.select(".domain").remove())
        .call((g) =>
          g.selectAll("text")
            .style("fill", THEME.text)
            .style("font-family", THEME.fontBody)
            .style("font-size", "9px")
        )
        .call((g) => g.selectAll("line").style("stroke", THEME.axisLine));

      svg.append("text")
        .attr("x", lgX + lgW / 2).attr("y", lgY - 7)
        .attr("text-anchor", "middle")
        .style("fill", THEME.text)
        .style("font-family", THEME.fontBody)
        .style("font-size", "9px")
        .style("letter-spacing", "0.1em")
        .text("VARIATION IMC AJUSTÉ");

      svg.append("text")
        .attr("x", 16).attr("y", height - 16)
        .style("fill", THEME.text)
        .style("font-family", THEME.fontBody)
        .style("font-size", "11px")
        .text(`Sport sélectionné : ${sportName}`);
    });
  }, [data, selectedCountry, sportName]);

  return <svg ref={svgRef} style={{ display: "block", width: "100%" }} />;
};

function numericToIso3(id: string | number): string {
  const map: Record<string, string> = {
    "4":"AFG","8":"ALB","12":"DZA","20":"AND","24":"AGO","28":"ATG","32":"ARG","36":"AUS","40":"AUT","44":"BHS",
    "48":"BHR","50":"BGD","51":"ARM","52":"BRB","56":"BEL","64":"BTN","68":"BOL","70":"BIH","72":"BWA","76":"BRA",
    "84":"BLZ","90":"SLB","96":"BRN","100":"BGR","104":"MMR","108":"BDI","112":"BLR","116":"KHM","120":"CMR","124":"CAN",
    "132":"CPV","140":"CAF","144":"LKA","148":"TCD","152":"CHL","156":"CHN","170":"COL","174":"COM","178":"COG","180":"COD",
    "188":"CRI","191":"HRV","192":"CUB","196":"CYP","203":"CZE","204":"BEN","208":"DNK","212":"DMA","214":"DOM","218":"ECU",
    "222":"SLV","226":"GNQ","231":"ETH","232":"ERI","233":"EST","242":"FJI","246":"FIN","250":"FRA","262":"DJI","266":"GAB",
    "268":"GEO","270":"GMB","276":"DEU","288":"GHA","300":"GRC","308":"GRD","320":"GTM","324":"GIN","328":"GUY","332":"HTI",
    "340":"HND","348":"HUN","352":"ISL","356":"IND","360":"IDN","364":"IRN","368":"IRQ","372":"IRL","376":"ISR","380":"ITA",
    "384":"CIV","388":"JAM","392":"JPN","398":"KAZ","400":"JOR","404":"KEN","408":"PRK","410":"KOR","414":"KWT","417":"KGZ",
    "418":"LAO","422":"LBN","426":"LSO","428":"LVA","430":"LBR","434":"LBY","440":"LTU","442":"LUX","450":"MDG","454":"MWI",
    "458":"MYS","462":"MDV","466":"MLI","470":"MLT","478":"MRT","480":"MUS","484":"MEX","496":"MNG","498":"MDA","499":"MNE",
    "504":"MAR","508":"MOZ","512":"OMN","516":"NAM","520":"NRU","524":"NPL","528":"NLD","540":"NCL","548":"VUT","554":"NZL",
    "558":"NIC","562":"NER","566":"NGA","578":"NOR","586":"PAK","591":"PAN","598":"PNG","600":"PRY","604":"PER","608":"PHL",
    "616":"POL","620":"PRT","624":"GNB","626":"TLS","634":"QAT","642":"ROU","643":"RUS","646":"RWA","659":"KNA","662":"LCA",
    "670":"VCT","674":"SMR","678":"STP","682":"SAU","686":"SEN","688":"SRB","690":"SYC","694":"SLE","702":"SGP","703":"SVK",
    "704":"VNM","705":"SVN","706":"SOM","710":"ZAF","716":"ZWE","724":"ESP","728":"SSD","729":"SDN","740":"SUR","748":"SWZ",
    "752":"SWE","756":"CHE","760":"SYR","762":"TJK","764":"THA","768":"TGO","776":"TON","780":"TTO","784":"ARE","788":"TUN",
    "792":"TUR","795":"TKM","798":"TUV","800":"UGA","804":"UKR","807":"MKD","818":"EGY","826":"GBR","834":"TZA","840":"USA",
    "854":"BFA","858":"URY","860":"UZB","862":"VEN","882":"WSM","887":"YEM","894":"ZMB","10":"ATA","260":"ATF","732":"ESH","-99":"XKX",
  };
  return map[String(id)] || String(id);
}

export default ChoroplethMap;
