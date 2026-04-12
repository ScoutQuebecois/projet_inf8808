import { useEffect, useState } from "react";
import * as d3 from "d3";
import Select from "react-select";
import { Option } from "../types/Options";

type CountryDropdownProps = {
  onChange: (option: Option | null) => void;
};

const CountryDropdown = ({onChange} : CountryDropdownProps) => {
  const [data, setData] = useState<string[]>([]);
  useEffect(() => {
    d3.csv("/assets/noc_regions.csv").then((res) => {
      
      const cleaned = res.map((d: any) => ({
        ...d,
        NOC: d.NOC,
        region: d.region,
      })) as unknown as {NOC: string, region: string}[];

      const trimmedCountry = [...new Set(cleaned.map((d) => d.region))].sort();
      setData(trimmedCountry);
    });
  }, []);
  return (
    <>
        <Select
            options={data.map((country) => ({ value: country, label: country }))}
            placeholder="Rechercher un pays"
            isSearchable={true}
            onChange={onChange}
        />
    </>
  );
};

export default CountryDropdown;
