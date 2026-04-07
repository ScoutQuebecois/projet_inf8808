import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { Athlete } from "../types/Athlete";
import { Container, Spinner } from "react-bootstrap";


const HeightBoxPlot = ({ userNumber, userSport, type, sexe }: { userNumber: number | null; userSport: string | null | undefined; type: "height" | "weight" | "age"; sexe: string }) => {
    const [data, setData] = useState<Athlete[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const svgRef = useRef<SVGSVGElement | null>(null);
    const tooltipRef = useRef<d3.Selection<HTMLDivElement, unknown, HTMLElement, any> | null>(null);
    
    useEffect(() => {
        d3.csv("/assets/athlete_events.csv").then((res) => {
            const cleaned = res.map((d: any) => ({
                ...d,
                Year: d.Year ? parseInt(d.Year) : 0,
                Age: (d.Age && d.Age !== "NA") ? parseFloat(d.Age) : null,
                Height: (d.Height && d.Height !== "NA") ? parseFloat(d.Height) : null,
                Weight: (d.Weight && d.Weight !== "NA") ? parseFloat(d.Weight) : null,
                Sex: d.Sex,
                Sport: d.Sport
            })) as unknown as Athlete[];
            
            setData(cleaned);
            setLoading(false);
        });
    }, []);

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
            return;
        } 

        const q1 = d3.quantile(dataToShow, 0.25)!;
        const median = d3.quantile(dataToShow, 0.5)!;
        const q3 = d3.quantile(dataToShow, 0.75)!;

        const min = d3.min(dataToShow)!;
        const max = d3.max(dataToShow)!;

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
            <svg
                ref={svgRef}
                width={400}
                height={225}
            />
        </Container>
        
        </>
    )
};

export default HeightBoxPlot;