import { useEffect, useState } from "react";
import * as d3 from "d3";
import { Athlete } from "../types/Athlete";
import Select from "react-select";
import { Option } from "../types/Options";

type SportDropdownProps = {
  onChange: (option: Option | null) => void;
};

const SportDropdown = ({onChange} : SportDropdownProps) => {
  const [data, setData] = useState<string[]>([]);
  useEffect(() => {
    d3.csv("/assets/athlete_events.csv").then((res) => {
      const cleaned = res.map((d: any) => ({
        ...d,
        Year: d.Year ? parseInt(d.Year) : 0,
        Age: d.Age && d.Age !== "NA" ? parseFloat(d.Age) : null,
        Height: d.Height && d.Height !== "NA" ? parseFloat(d.Height) : null,
        Weight: d.Weight && d.Weight !== "NA" ? parseFloat(d.Weight) : null,
        Sex: d.Sex,
        Season: d.Season,
        Sport: d.Sport,
      })) as unknown as Athlete[];

      const trimmedSport = [...new Set(cleaned.map((d) => d.Sport))].sort();
      setData(trimmedSport);
    });
  }, []);
  return (
    <>
        <Select
            options={data.map((sport) => ({ value: sport, label: sport }))}
            placeholder="Choisir un sport"
            isSearchable={true}
            onChange={onChange}
        />
    </>
  );
};

export default SportDropdown;
