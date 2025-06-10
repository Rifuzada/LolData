import axios from "axios";

const API_KEY = process.env.RIOT_API_KEY;
const BASE_URL = "https://americas.api.riotgames.com";

interface RiotAccount {
  puuid: string;
  gameName: string;
  tagLine: string;
}

interface Summoner {
  id: string;
  accountId: string;
  puuid: string;
  name: string;
  profileIconId: number;
  revisionDate: number;
  summonerLevel: number;
}

interface QueueType {
  queueId: number;
  map: string;
  description: string;
}

interface Match {
  metadata: {
    matchId: string;
  };
  info: {
    gameMode: string;
    queueId: number;
    gameStartTimestamp: number;
    gameDuration: number;
    participants: Array<{
      puuid: string;
      championId: number;
      championName: string;
      kills: number;
      deaths: number;
      assists: number;
      totalMinionsKilled: number;
      neutralMinionsKilled: number;
      item0: number;
      item1: number;
      item2: number;
      item3: number;
      item4: number;
      item5: number;
      item6: number;
      win: boolean;
    }>;
  };
}

export async function getSummonerByRiotId(region: string, gameName: string, tagLine: string): Promise<Summoner> {
  const response = await axios.get<RiotAccount>(
    `${BASE_URL}/riot/account/v1/accounts/by-riot-id/${gameName}/${tagLine}`,
    {
      headers: {
        "X-Riot-Token": API_KEY,
      },
    }
  );

  const { puuid } = response.data;

  const summonerResponse = await axios.get<Summoner>(
    `https://${region}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}`,
    {
      headers: {
        "X-Riot-Token": API_KEY,
      },
    }
  );

  return summonerResponse.data;
}

export async function getQueueTypes(): Promise<QueueType[]> {
  const response = await axios.get<QueueType[]>(
    "https://static.developer.riotgames.com/docs/lol/queues.json"
  );
  return response.data;
}

export async function getMatchHistory(region: string, puuid: string): Promise<Match[]> {
  const matchIdsResponse = await axios.get<string[]>(
    `${BASE_URL}/lol/match/v5/matches/by-puuid/${puuid}/ids`,
    {
      headers: {
        "X-Riot-Token": API_KEY,
      },
      params: {
        start: 0,
        count: 20,
      },
    }
  );

  const matchIds = matchIdsResponse.data;

  const matches = await Promise.all(
    matchIds.map((matchId) =>
      axios
        .get<Match>(`${BASE_URL}/lol/match/v5/matches/${matchId}`, {
          headers: {
            "X-Riot-Token": API_KEY,
          },
        })
        .then((response) => response.data)
    )
  );

  return matches;
}
