export interface ChampionMastery {
    id: string;
    name: string;
    level: number;
    points: number;
}

export interface ChampionData {
    id: string;
    key: string;
    name: string;
}

export interface ChampionsResponse {
    data: {
        [key: string]: ChampionData;
    };
}
