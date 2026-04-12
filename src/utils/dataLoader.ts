import * as d3 from "d3";
import { Athlete } from "../types/Athlete";

let cachedData: Athlete[] | null = null;
let loadingPromise: Promise<Athlete[]> | null = null;

export function loadAthleteData(): Promise<Athlete[]> {
  if (cachedData) return Promise.resolve(cachedData);
  if (loadingPromise) return loadingPromise;

  loadingPromise = d3.csv("/assets/athlete_events.csv").then((res) => {
    const cleaned = res.map((d: any) => ({
      ...d,
      Year: d.Year ? parseInt(d.Year) : 0,
      Age: d.Age && d.Age !== "NA" ? parseFloat(d.Age) : null,
      Height: d.Height && d.Height !== "NA" ? parseFloat(d.Height) : null,
      Weight: d.Weight && d.Weight !== "NA" ? parseFloat(d.Weight) : null,
      Sex: d.Sex as "M" | "F",
      Sport: d.Sport,
      Medal: d.Medal === "NA" ? null : d.Medal,
    })) as unknown as Athlete[];

    cachedData = cleaned;
    return cleaned;
  });

  return loadingPromise;
}
