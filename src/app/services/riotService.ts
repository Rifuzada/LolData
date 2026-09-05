// src/app/actions/summoner.ts
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

// ================================================================
// 🔥 CORREÇÃO: agora usa a BASE_URL (regional) para summoner
// ================================================================
export async function getSummonerByRiotId(
  region: string,
  gameName: string,
  tagLine: string
): Promise<Summoner> {
  // 1. Busca a conta (já está correto)
  const accountResponse = await axios.get<RiotAccount>(
    `${BASE_URL}/riot/account/v1/accounts/by-riot-id/${gameName}/${tagLine}`,
    {
      headers: { "X-Riot-Token": API_KEY },
    }
  );

  const { puuid } = accountResponse.data;

  // 2. Busca o summoner usando a MESMA BASE_URL (regional)
  //    ❌ Antes: `https://${region}.api.riotgames.com/...`
  //    ✅ Agora: `${BASE_URL}/lol/summoner/v4/summoners/by-puuid/${puuid}`
  const summonerResponse = await axios.get<Summoner>(
    `${BASE_URL}/lol/summoner/v4/summoners/by-puuid/${puuid}`,
    {
      headers: { "X-Riot-Token": API_KEY },
    }
  );

  return summonerResponse.data;
}

// ================================================================
// Queue types (sem alterações)
// ================================================================
export async function getQueueTypes(): Promise<QueueType[]> {
  const response = await axios.get<QueueType[]>(
    "https://static.developer.riotgames.com/docs/lol/queues.json"
  );
  return response.data;
}

// ================================================================
// Match history (já estava correto, mas vou otimizar levemente)
// ================================================================
export async function getMatchHistory(
  region: string,
  puuid: string,
  start = 0,
  count = 20
): Promise<Match[]> {
  // Busca os IDs das partidas
  const matchIdsResponse = await axios.get<string[]>(
    `${BASE_URL}/lol/match/v5/matches/by-puuid/${puuid}/ids`,
    {
      headers: { "X-Riot-Token": API_KEY },
      params: { start, count },
    }
  );

  const matchIds = matchIdsResponse.data;

  if (matchIds.length === 0) return [];

  // 🔥 OTIMIZAÇÃO: Busca os detalhes em paralelo com Promise.allSettled
  // para não quebrar se uma partida falhar
  const matchPromises = matchIds.map((matchId) =>
    axios
      .get<Match>(`${BASE_URL}/lol/match/v5/matches/${matchId}`, {
        headers: { "X-Riot-Token": API_KEY },
      })
      .then((response) => response.data)
      .catch(() => null) // se falhar, retorna null
  );

  const results = await Promise.all(matchPromises);
  // Filtra os nulos (partidas que falharam) e retorna apenas as válidas
  return results.filter((match): match is Match => match !== null);
}
