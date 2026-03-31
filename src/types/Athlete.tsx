export interface Athlete {
    ID: string;
    Name: string;
    Sex: 'M' | 'F';
    Age: string | number;
    Height: string | number;
    Weight: string | number;
    Team: string;
    NOC: string;
    Games: string;
    Year: string | number;
    Season: string;
    City: string;
    Sport: string;
    Event: string;
    Medal: string | null;
}

export type MetricType = 'Age' | 'Height' | 'Weight';