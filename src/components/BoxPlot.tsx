import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { Athlete } from "../types/Athlete";
import { Container, Spinner } from "react-bootstrap";
import { loadAthleteData } from "../utils/dataLoader";
import { useAltTextVisibility } from "./AltTextContext";

function buildBoxPlotAltText({
  type, count, min, q1, median, q3, max,
  userNumber, userSport, sexe, userBMI,
}: {
  type: "height" | "weight" | "age";
  count: number;
  min: number; q1: number; median: number; q3: number; max: number;
  userNumber: number | null;
  userSport: string | null | undefined;
  sexe: string;
  userBMI?: number | null;
}) {
  const metricLabel =
    type === "height" ? "taille" : type === "weight" ? "poids" : "âge";
  const unit =
    type === "height" ? "cm" : type === "weight" ? "kg" : "ans";

  const sexLabel =
    sexe === "M" ? "les athlètes masculins"
    : sexe === "F" ? "les athlètes féminines"
    : "tous les athlètes";

  const parts = [
    `Boîte à moustaches de ${metricLabel} parmi ${sexLabel} médaillés d'or${userSport ? ` en ${userSport}` : ""}.`,
    `Données issues de ${count} athlète${count > 1 ? "s" : ""}.`,
    `Distribution : minimum ${min}\u00a0${unit}, Q1 ${q1}\u00a0${unit}, médiane ${median}\u00a0${unit}, Q3 ${q3}\u00a0${unit}, maximum ${max}\u00a0${unit}.`,
    `L'intervalle interquartile s'étend de ${q1} à ${q3}\u00a0${unit} (étendue : ${q3 - q1}\u00a0${unit}).`,
  ];

  if (userNumber !== null) {
    const position =
      userNumber < min ? "en dessous du minimum observé"
      : userNumber < q1 ? "en dessous du premier quartile"
      : userNumber <= median ? "entre le premier quartile et la médiane"
      : userNumber <= q3 ? "entre la médiane et le troisième quartile"
      : userNumber <= max ? "au-dessus du troisième quartile"
      : "au-dessus du maximum observé";
    parts.push(
      `Votre valeur est ${userNumber}\u00a0${unit}, ce qui vous place ${position} de la distribution des médaillés.`
    );
  }

  if (type === "weight" && userBMI) {
    parts.push(`Votre IMC calculé est de ${userBMI.toFixed(1)}.`);
  }

  return parts.join(" ");
}

const HeightBoxPlot = ({ userNumber, userSport, type, sexe, userBMI }: { userNumber: number | null; userSport: string | null | undefined; type: "height" | "weight" | "age"; sexe: string; userBMI: number | null }) => {
    const [data, setData] = useState<Athlete[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [altText, setAltText] = useState("Boite a moustaches en cours de chargement.");
    const svgRef = useRef<SVGSVGElement | null>(null);
    const tooltipRef = useRef<d3.Selection<HTMLDivElement, unknown, HTMLElement, any> | null>(null);
    const { showAltText } = useAltTextVisibility();

    useEffect(() => {
        loadAthleteData().then((cleaned) => {
            setData(cleaned);
            setLoading(false);
        });
    }, []);

    useEffect(() => {
        if (loading) {
            setAltText("Boite a moustaches en cours de chargement.");
            return;
        }
        if (error) {
            setAltText(`Boite a moustaches. ${error}`);
        }
    }, [loading, error]);

    useEffect(() => {
            tooltipRef.current = d3
                .select("body")
                .append("div")
                .style("position", "absolute")
                .style("background", "white")
                .style("border", "1px solid #ccc")
                .style("padding", "8px")
                .style("border-radius", "6px")
                .style("pointer-events", "none")
                .style("opacity", 0);

            return () => {
                tooltipRef.current?.remove();
            };
        }, []);

    useEffect(() => {
        if (!data.length) return;
        setError(null);
        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove(); 

        const filtered = userSport ? data.filter((d) => d.Medal === "Gold" && d.Sport === userSport && (sexe === '' || d.Sex === sexe)) : data;
        const dataToShow = filtered
            .map((d) => type === "height" ? d.Height : type === "weight" ? d.Weight : d.Age)
            .filter((h): h is number => h !== null)
            .sort(d3.ascending);

        if (!dataToShow.length) {
            setError("Aucune donnée disponible pour les critères sélectionnés.");
            setAltText("Boite a moustaches. Aucune donnee disponible pour les criteres selectionnes.");
            return;
        } 

        const q1 = d3.quantile(dataToShow, 0.25)!;
        const median = d3.quantile(dataToShow, 0.5)!;
        const q3 = d3.quantile(dataToShow, 0.75)!;

        const min = d3.min(dataToShow)!;
        const max = d3.max(dataToShow)!;
        const nextAltText = buildBoxPlotAltText({ type, count: dataToShow.length, min, q1, median, q3, max, userNumber, userSport, sexe, userBMI });
        setAltText(nextAltText);

        const width = 400;
        const height = 225;
        const margin = { top: 0, right: 40, bottom: 40, left: 60 };



         const xScale = d3
            .scaleLinear()
            .domain([userNumber ? min > userNumber ? userNumber - 20 : min - 5 : min - 5, userNumber ? max < userNumber ? userNumber + 20 : max + 5 : max + 5])
            .range([0, width - margin.right]);

        const centerY = height / 2;

        svg
            .append("line")
            .attr("x1", xScale(min))
            .attr("x2", xScale(max))
            .attr("y1", centerY)
            .attr("y2", centerY)
            .attr("stroke", "black")
            .attr("stroke-width", 2.5)
            .on("mouseover", function (event) {
                tooltipRef.current
                    ?.style("opacity", 1)
                    .html(
                        `
                        <strong class="text-center">${type === 'height' ? 'Taille' : type === 'weight' ? 'Poids' : 'Âge'}</strong><br/>
                        Min: ${min} ${type === "height" ? "cm" : type === "weight" ? "kg" : "ans"} <br/>
                        Q1: ${q1} ${type === "height" ? "cm" : type === "weight" ? "kg" : "ans"}<br/>
                        Médiane: ${median} ${type === "height" ? "cm" : type === "weight" ? "kg" : "ans"}<br/>
                        Q3: ${q3} ${type === "height" ? "cm" : type === "weight" ? "kg" : "ans"}<br/>
                        Max: ${max} ${type === "height" ? "cm" : type === "weight" ? "kg" : "ans"}<br/>
                        <strong style="color: red">${userNumber !== null ? 'Vous : ' + userNumber + ' ' + (type === "height" ? "cm" : type === "weight" ? "kg" : "ans") : ""}</strong>
                        `
                    )
                    .style("left", `${event.pageX + 10}px`)
                    .style("top", `${event.pageY - 28}px`);
            })
            .on("mousemove", function (event) {
                tooltipRef.current
                    ?.style("left", `${event.pageX + 10}px`)
                    .style("top", `${event.pageY - 28}px`);
            })
            .on("mouseout", function () {
                tooltipRef.current?.style("opacity", 0);
            });

        svg
            .append("rect")
            .attr("x", xScale(q1))
            .attr("y", centerY - 30)
            .attr("width", xScale(q3) - xScale(q1))
            .attr("height", 60)
            .attr("fill", sexe === '' ? "lightgray" : sexe === 'M' ? "lightblue" : "pink")
            .attr("stroke", "black")
            .on("mouseover", function (event) {
                tooltipRef.current
                    ?.style("opacity", 1)
                    .html(
                        `
                        <strong class="text-center">${type === 'height' ? 'Taille' : type === 'weight' ? 'Poids' : 'Âge'}</strong><br/>
                        Min: ${min} ${type === "height" ? "cm" : type === "weight" ? "kg" : "ans"} <br/>
                        Q1: ${q1} ${type === "height" ? "cm" : type === "weight" ? "kg" : "ans"}<br/>
                        Médiane: ${median} ${type === "height" ? "cm" : type === "weight" ? "kg" : "ans"}<br/>
                        Q3: ${q3} ${type === "height" ? "cm" : type === "weight" ? "kg" : "ans"}<br/>
                        Max: ${max} ${type === "height" ? "cm" : type === "weight" ? "kg" : "ans"}<br/>
                        <strong style="color: red">${userNumber !== null ? 'Vous : ' + userNumber + ' ' + (type === "height" ? "cm" : type === "weight" ? "kg" : "ans") : ""}</strong>
                        `
                    )
                    .style("left", `${event.pageX + 10}px`)
                    .style("top", `${event.pageY - 28}px`);
            })
            .on("mousemove", function (event) {
                tooltipRef.current
                    ?.style("left", `${event.pageX + 10}px`)
                    .style("top", `${event.pageY - 28}px`);
            })
            .on("mouseout", function () {
                tooltipRef.current?.style("opacity", 0);
            });

        svg
            .append("line")
            .attr("x1", xScale(median))
            .attr("x2", xScale(median))
            .attr("y1", centerY - 30)
            .attr("y2", centerY + 30)
            .attr("stroke", "black")
            .attr("stroke-width", 2.5)
            .on("mouseover", function (event) {
                tooltipRef.current
                    ?.style("opacity", 1)
                    .html(
                        `
                        <strong class="text-center">${type === 'height' ? 'Taille' : type === 'weight' ? 'Poids' : 'Âge'}</strong><br/>
                        Min: ${min} ${type === "height" ? "cm" : type === "weight" ? "kg" : "ans"} <br/>
                        Q1: ${q1} ${type === "height" ? "cm" : type === "weight" ? "kg" : "ans"}<br/>
                        Médiane: ${median} ${type === "height" ? "cm" : type === "weight" ? "kg" : "ans"}<br/>
                        Q3: ${q3} ${type === "height" ? "cm" : type === "weight" ? "kg" : "ans"}<br/>
                        Max: ${max} ${type === "height" ? "cm" : type === "weight" ? "kg" : "ans"}<br/>
                        <strong style="color: red">${userNumber !== null ? 'Vous : ' + userNumber + ' ' + (type === "height" ? "cm" : type === "weight" ? "kg" : "ans") : ""}</strong>
                        `
                    )
                    .style("left", `${event.pageX + 10}px`)
                    .style("top", `${event.pageY - 28}px`);
            })
            .on("mousemove", function (event) {
                tooltipRef.current
                    ?.style("left", `${event.pageX + 10}px`)
                    .style("top", `${event.pageY - 28}px`);
            })
            .on("mouseout", function () {
                tooltipRef.current?.style("opacity", 0);
            });

        if (userNumber !== null) {
            svg
            .append("circle")
            .attr("cx", xScale(userNumber))
            .attr("cy", centerY)
            .attr("r", 6)
            .attr("fill", "red");
        }

        svg
            .append("g")
            .attr("transform", `translate(0, ${centerY + 50})`)
            .call(d3.axisBottom(xScale));


        svg
            .append("text")
            .attr("x", (width - margin.right) / 2)
            .attr("y", centerY + 90) 
            .attr("text-anchor", "middle")
            .style("font-size", "14px")
            .style("fill", "black")
            .text(type === "height" ? "Taille (cm)" : type === "weight" ? "Poids (kg)" : "Âge");
        
        svg
            .append("text")
            .attr("x", (width - margin.right) / 2)
            .attr("y", margin.top + 20) 
            .attr("text-anchor", "middle")
            .style("font-size", "14px")
            .style("fill", "black")
            .text('Nombre d\'athlètes considérés : ' + dataToShow.length);
        
            
        
        svg
            .append("text")
            .attr("x", (width - margin.right) / 2)
            .attr("y", centerY + 110) 
            .attr("text-anchor", "middle")
            .style("font-size", "14px")
            .style("fill", "black")
            .text(sexe === '' ? "" : sexe === 'M' ? "Hommes" : "Femmes");
        

    }, [data, userNumber, userSport, sexe, type]);
    return (
        <>  
        <Container className="text-center">
            {loading && <Spinner animation="border" variant="primary" />}
            {error && <p className="text-danger">{error}</p>}
            <figure className="chart-with-alt">
                <svg
                    ref={svgRef}
                    width={400}
                    height={225}
                />
                {showAltText && <figcaption className="chart-alt-text">{altText}</figcaption>}
            </figure>
        </Container>
        
        </>
    )
};

export default HeightBoxPlot;
