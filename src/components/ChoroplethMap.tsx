import { useEffect, useRef } from "react";
import * as d3 from "d3";

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

const WORLD_GEOJSON_URL =
  "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

const ChoroplethMap = ({ data, onCountryClick, selectedCountry, sportName }: ChoroplethMapProps) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const tooltipRef = useRef<d3.Selection<HTMLDivElement, unknown, HTMLElement, any> | null>(null);

  useEffect(() => {
    tooltipRef.current = d3
      .select("body")
      .append("div")
      .attr("class", "map-tooltip")
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

    const width = 750;
    const height = 450;

    svg.attr("width", width).attr("height", height);

    const maxAbs = d3.max(data, (d) => Math.abs(d.delta)) || 1;

    const colorScale = d3
      .scaleDiverging<string>()
      .domain([-maxAbs, 0, maxAbs])
      .interpolator(d3.interpolateRgbBasis(["#e8751a", "#ffffff", "#4a90d9"]));

    const dataMap = new Map(data.map((d) => [d.iso3, d]));

    const projection = d3
      .geoNaturalEarth1()
      .scale(140)
      .translate([width / 2, height / 2 + 20]);

    const path = d3.geoPath().projection(projection);

    Promise.all([d3.json(WORLD_GEOJSON_URL)]).then(([world]: any) => {
      let countries: any;

      if (world.type === "Topology") {
        const objectKey = Object.keys(world.objects)[0];
        const geometries = world.objects[objectKey].geometries;
        const worldArcs = world.arcs;

        function decodeArc(arcIndex: number): [number, number][] {
          const arc = worldArcs[arcIndex < 0 ? ~arcIndex : arcIndex];
          const coords: [number, number][] = [];
          let x = 0,
            y = 0;
          for (const [dx, dy] of arc) {
            x += dx;
            y += dy;
            const point: [number, number] = [
              (x * world.transform.scale[0]) + world.transform.translate[0],
              (y * world.transform.scale[1]) + world.transform.translate[1],
            ];
            coords.push(point);
          }
          return arcIndex < 0 ? coords.reverse() : coords;
        }

        function arcsToCoords(arcRefs: any): any {
          if (typeof arcRefs[0] === "number") {
            let coords: [number, number][] = [];
            for (const arcRef of arcRefs) {
              const decoded = decodeArc(arcRef);
              coords = coords.concat(decoded);
            }
            return coords;
          } else {
            return arcRefs.map((r: any) => arcsToCoords(r));
          }
        }

        const features = geometries.map((geo: any) => {
          let geometry: any = null;
          if (geo.type === "Polygon") {
            geometry = {
              type: "Polygon",
              coordinates: geo.arcs.map((ring: number[]) => arcsToCoords(ring)),
            };
          } else if (geo.type === "MultiPolygon") {
            geometry = {
              type: "MultiPolygon",
              coordinates: geo.arcs.map((polygon: number[][]) =>
                polygon.map((ring: number[]) => arcsToCoords(ring))
              ),
            };
          }
          return {
            type: "Feature" as const,
            id: geo.id,
            properties: geo.properties || {},
            geometry,
          };
        });

        countries = { type: "FeatureCollection", features };
      } else {
        countries = world;
      }

      svg
        .selectAll("path")
        .data(countries.features)
        .enter()
        .append("path")
        .attr("d", (d: any) => path(d) || "")
        .attr("fill", (d: any) => {
          const iso = d.id || d.properties?.iso_a3;
          const isoFromNum = numericToIso3(iso);
          const entry = dataMap.get(isoFromNum) || dataMap.get(iso);
          if (entry) return colorScale(entry.delta);
          return "#eee";
        })
        .attr("stroke", (d: any) => {
          const iso = d.id || d.properties?.iso_a3;
          const isoFromNum = numericToIso3(iso);
          const matchCountry = dataMap.get(isoFromNum) || dataMap.get(iso);
          if (matchCountry && matchCountry.country === selectedCountry) return "#333";
          return "#ccc";
        })
        .attr("stroke-width", (d: any) => {
          const iso = d.id || d.properties?.iso_a3;
          const isoFromNum = numericToIso3(iso);
          const matchCountry = dataMap.get(isoFromNum) || dataMap.get(iso);
          if (matchCountry && matchCountry.country === selectedCountry) return 2;
          return 0.5;
        })
        .style("cursor", (d: any) => {
          const iso = d.id || d.properties?.iso_a3;
          const isoFromNum = numericToIso3(iso);
          const entry = dataMap.get(isoFromNum) || dataMap.get(iso);
          return entry ? "pointer" : "default";
        })
        .on("mouseover", function (event, d: any) {
          const iso = d.id || d.properties?.iso_a3;
          const isoFromNum = numericToIso3(iso);
          const entry = dataMap.get(isoFromNum) || dataMap.get(iso);
          if (!entry) return;
          d3.select(this).attr("stroke", "#333").attr("stroke-width", 2);
          tooltipRef.current
            ?.style("opacity", 1)
            .html(
              `<strong>${entry.country}</strong><br/>Variation IMC ajuste: ${entry.delta > 0 ? "+" : ""}${entry.delta.toFixed(2)}`
            )
            .style("left", `${event.pageX + 14}px`)
            .style("top", `${event.pageY - 30}px`);
        })
        .on("mousemove", function (event) {
          tooltipRef.current
            ?.style("left", `${event.pageX + 14}px`)
            .style("top", `${event.pageY - 30}px`);
        })
        .on("mouseout", function (_, d: any) {
          const iso = d.id || d.properties?.iso_a3;
          const isoFromNum = numericToIso3(iso);
          const matchCountry = dataMap.get(isoFromNum) || dataMap.get(iso);
          const isSelected = matchCountry && matchCountry.country === selectedCountry;
          d3.select(this)
            .attr("stroke", isSelected ? "#333" : "#ccc")
            .attr("stroke-width", isSelected ? 2 : 0.5);
          tooltipRef.current?.style("opacity", 0);
        })
        .on("click", function (_, d: any) {
          const iso = d.id || d.properties?.iso_a3;
          const isoFromNum = numericToIso3(iso);
          const entry = dataMap.get(isoFromNum) || dataMap.get(iso);
          if (entry) onCountryClick(entry.country, entry.iso3);
        });

      const legendWidth = 200;
      const legendHeight = 12;
      const legendX = width - legendWidth - 40;
      const legendY = height - 40;

      const legendScale = d3.scaleLinear().domain([-maxAbs, maxAbs]).range([0, legendWidth]);

      const defs = svg.append("defs");
      const gradient = defs
        .append("linearGradient")
        .attr("id", "choropleth-gradient");

      const nStops = 10;
      for (let i = 0; i <= nStops; i++) {
        const t = i / nStops;
        const val = -maxAbs + t * 2 * maxAbs;
        gradient
          .append("stop")
          .attr("offset", `${t * 100}%`)
          .attr("stop-color", colorScale(val));
      }

      svg
        .append("rect")
        .attr("x", legendX)
        .attr("y", legendY)
        .attr("width", legendWidth)
        .attr("height", legendHeight)
        .style("fill", "url(#choropleth-gradient)")
        .attr("stroke", "#ccc");

      const legendAxis = d3.axisBottom(legendScale).ticks(5).tickFormat(d3.format("+.1f"));
      svg
        .append("g")
        .attr("transform", `translate(${legendX}, ${legendY + legendHeight})`)
        .call(legendAxis)
        .selectAll("text")
        .style("font-size", "9px");

      svg
        .append("text")
        .attr("x", legendX + legendWidth / 2)
        .attr("y", legendY - 5)
        .attr("text-anchor", "middle")
        .style("font-size", "11px")
        .text("Δ IMC ajuste");

      svg
        .append("text")
        .attr("x", width / 2)
        .attr("y", 20)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .style("font-weight", "bold")
        .text(`Variation de l'IMC ajuste des medailles — ${sportName}`);

      svg
        .append("text")
        .attr("x", width / 2)
        .attr("y", 36)
        .attr("text-anchor", "middle")
        .style("font-size", "11px")
        .style("fill", "#666")
        .text("Difference entre la derniere et la premiere annee de donnees par pays");
    });
  }, [data, selectedCountry, sportName]);

  return <svg ref={svgRef} />;
};

function numericToIso3(id: string | number): string {
  const map: Record<string, string> = {
    "4": "AFG", "8": "ALB", "12": "DZA", "20": "AND", "24": "AGO",
    "28": "ATG", "32": "ARG", "36": "AUS", "40": "AUT", "44": "BHS",
    "48": "BHR", "50": "BGD", "51": "ARM", "52": "BRB", "56": "BEL",
    "64": "BTN", "68": "BOL", "70": "BIH", "72": "BWA", "76": "BRA",
    "84": "BLZ", "90": "SLB", "96": "BRN", "100": "BGR", "104": "MMR",
    "108": "BDI", "112": "BLR", "116": "KHM", "120": "CMR", "124": "CAN",
    "132": "CPV", "140": "CAF", "144": "LKA", "148": "TCD", "152": "CHL",
    "156": "CHN", "170": "COL", "174": "COM", "178": "COG", "180": "COD",
    "188": "CRI", "191": "HRV", "192": "CUB", "196": "CYP", "203": "CZE",
    "204": "BEN", "208": "DNK", "212": "DMA", "214": "DOM", "218": "ECU",
    "222": "SLV", "226": "GNQ", "231": "ETH", "232": "ERI", "233": "EST",
    "242": "FJI", "246": "FIN", "250": "FRA", "262": "DJI", "266": "GAB",
    "268": "GEO", "270": "GMB", "276": "DEU", "288": "GHA", "300": "GRC",
    "308": "GRD", "320": "GTM", "324": "GIN", "328": "GUY", "332": "HTI",
    "340": "HND", "348": "HUN", "352": "ISL", "356": "IND", "360": "IDN",
    "364": "IRN", "368": "IRQ", "372": "IRL", "376": "ISR", "380": "ITA",
    "384": "CIV", "388": "JAM", "392": "JPN", "398": "KAZ", "400": "JOR",
    "404": "KEN", "408": "PRK", "410": "KOR", "414": "KWT", "417": "KGZ",
    "418": "LAO", "422": "LBN", "426": "LSO", "428": "LVA", "430": "LBR",
    "434": "LBY", "440": "LTU", "442": "LUX", "450": "MDG", "454": "MWI",
    "458": "MYS", "462": "MDV", "466": "MLI", "470": "MLT", "478": "MRT",
    "480": "MUS", "484": "MEX", "496": "MNG", "498": "MDA", "499": "MNE",
    "504": "MAR", "508": "MOZ", "512": "OMN", "516": "NAM", "520": "NRU",
    "524": "NPL", "528": "NLD", "540": "NCL", "548": "VUT", "554": "NZL",
    "558": "NIC", "562": "NER", "566": "NGA", "578": "NOR", "586": "PAK",
    "591": "PAN", "598": "PNG", "600": "PRY", "604": "PER", "608": "PHL",
    "616": "POL", "620": "PRT", "624": "GNB", "626": "TLS", "634": "QAT",
    "642": "ROU", "643": "RUS", "646": "RWA", "659": "KNA", "662": "LCA",
    "670": "VCT", "674": "SMR", "678": "STP", "682": "SAU", "686": "SEN",
    "688": "SRB", "690": "SYC", "694": "SLE", "702": "SGP", "703": "SVK",
    "704": "VNM", "705": "SVN", "706": "SOM", "710": "ZAF", "716": "ZWE",
    "724": "ESP", "728": "SSD", "729": "SDN", "740": "SUR", "748": "SWZ",
    "752": "SWE", "756": "CHE", "760": "SYR", "762": "TJK", "764": "THA",
    "768": "TGO", "776": "TON", "780": "TTO", "784": "ARE", "788": "TUN",
    "792": "TUR", "795": "TKM", "798": "TUV", "800": "UGA", "804": "UKR",
    "807": "MKD", "818": "EGY", "826": "GBR", "834": "TZA", "840": "USA",
    "854": "BFA", "858": "URY", "860": "UZB", "862": "VEN", "882": "WSM",
    "887": "YEM", "894": "ZMB", "10": "ATA", "260": "ATF", "732": "ESH",
    "-99": "XKX",
  };
  return map[String(id)] || String(id);
}

export default ChoroplethMap;
