export interface LocationIQPlace {
    place_id: string;
    licence: string;
    osm_type: string;
    osm_id: string;
    boundingbox: [string, string, string, string];
    lat: string;
    lon: string;
    display_name: string;
    class: string;
    type: string;
    importance: number;
    icon?: string; // Icon is optional as it's not present in all objects
    address: {
        city: string;
        state: string;
        country: string;
        country_code: string;
    };
}

export type LocationIQResults = LocationIQPlace[];
