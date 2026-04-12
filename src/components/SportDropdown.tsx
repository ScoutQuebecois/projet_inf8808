import { useEffect, useState } from "react";
import Select from "react-select";
import { Option } from "../types/Options";
import { loadAthleteData } from "../utils/dataLoader";

type SportDropdownProps = {
  onChange: (option: Option | null) => void;
};

const SportDropdown = ({onChange} : SportDropdownProps) => {
  const [data, setData] = useState<string[]>([]);
  useEffect(() => {
    loadAthleteData().then((cleaned) => {
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
