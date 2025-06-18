'use server';

import axios from 'axios';

const API_KEY = process.env.RIOT_API_KEY;
const BASE_URL = "https://americas.api.riotgames.com";
const EUROPE_URL = "https://europe.api.riotgames.com";
const ASIA_URL = "https://asia.api.riotgames.com";
const SEA_URL = "https://sea.api.riotgames.com";

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

// Função utilitária para tratar 429 com retry
async function safeAxios<T = any>(config: any, retries = 3): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await axios(config);
      return res.data as T;
    } catch (error: any) {
      if (error.response && error.response.status === 429) {
        const retryAfter = Number(error.response.headers['retry-after']) || 1;
        await new Promise(r => setTimeout(r, retryAfter * 1000));
        continue;
      }
      throw error;
    }
  }
  // Última tentativa, se ainda falhar, lança o erro
  const res = await axios(config);
  return res.data as T;
}

export async function getSummonerByRiotId(region: string, gameName: string, tagLine: string) {
  try {
    // Primeiro, obter o PUUID da conta
    const accountData = await safeAxios<RiotAccount>({
      method: 'get',
      url: `${BASE_URL}/riot/account/v1/accounts/by-riot-id/${gameName}/${tagLine}`,
      headers: { "X-Riot-Token": API_KEY }
    });

    const { puuid } = accountData;

    // Depois, obter os dados do invocador usando o PUUID
    const summonerData = await safeAxios<Summoner>({
      method: 'get',
      url: `https://${region}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}`,
      headers: { "X-Riot-Token": API_KEY }
    });
    // console.log(summonerData)

    return summonerData;
  } catch (error) {
    // console.error('Erro ao buscar dados do invocador:', error);
    throw new Error('Falha ao buscar dados do invocador');
  }
}

export async function getChampionMasteries(region: string, puuid: string) {
  try {
    return await safeAxios({
      method: 'get',
      url: `https://${region}.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-puuid/${puuid}`,
      headers: { "X-Riot-Token": API_KEY }
    });
  } catch (error) {
    // console.error('Erro ao buscar maestrias:', error);
    throw new Error('Falha ao buscar maestrias');
  }
}

export async function getMatchHistory(region: string, puuid: string) {
  try {
    let matchIds: string[] = [];
    let apiUrl = BASE_URL;
    if (region === 'euw1' || region === 'eun1' || region === 'ru' || region === 'tr1' || region === 'me1') apiUrl = EUROPE_URL;
    else if (region === 'kr' || region === 'jp1') apiUrl = ASIA_URL;
    else if (region === 'oc1' || region === 'sg2' || region === 'tw2' || region === 'vn2') apiUrl = SEA_URL;

    matchIds = await safeAxios<string[]>({
      method: 'get',
      url: `${apiUrl}/lol/match/v5/matches/by-puuid/${puuid}/ids`,
      headers: { "X-Riot-Token": API_KEY },
      params: { start: 0, count: 10 }
    });

    const matches = await Promise.all(
      matchIds.map((matchId: string) =>
        safeAxios({
          method: 'get',
          url: `${apiUrl}/lol/match/v5/matches/${matchId}`,
          headers: { "X-Riot-Token": API_KEY }
        })
      )
    );
    return matches;
  } catch (error) {
    // console.error('Erro ao buscar histórico de partidas:', error);
    throw new Error('Falha ao buscar histórico de partidas');
  }
}

export async function getMatchHistoryByQueue(region: string, puuid: string, queueId: string) {
  try {
    let matchIds: string[] = [];
    let apiUrl = BASE_URL;
    if (region === 'euw1' || region === 'eun1' || region === 'ru' || region === 'tr1' || region === 'me1') apiUrl = EUROPE_URL;
    else if (region === 'kr' || region === 'jp1') apiUrl = ASIA_URL;
    else if (region === 'oc1' || region === 'sg2' || region === 'tw2' || region === 'vn2') apiUrl = SEA_URL;

    matchIds = await safeAxios<string[]>({
      method: 'get',
      url: `${apiUrl}/lol/match/v5/matches/by-puuid/${puuid}/ids`,
      headers: { "X-Riot-Token": API_KEY },
      params: { start: 0, count: 10, queue: queueId }
    });

    const matches = await Promise.all(
      matchIds.map((matchId: string) =>
        safeAxios({
          method: 'get',
          url: `${apiUrl}/lol/match/v5/matches/${matchId}`,
          headers: { "X-Riot-Token": API_KEY }
        })
      )
    );
    return matches;
  } catch (error) {
    // console.error('Erro ao buscar histórico de partidas:', error);
    throw new Error('Falha ao buscar histórico de partidas');
  }
}

export async function getQueueTypes() {
  try {
    return await safeAxios({
      method: 'get',
      url: 'https://static.developer.riotgames.com/docs/lol/queues.json'
    });
  } catch (error) {
    // console.error('Erro ao buscar tipos de fila:', error);
    throw new Error('Falha ao buscar tipos de fila');
  }
}

export async function getRankedBySummonerId(region: string, summonerId: string) {
  try {
    const res = await safeAxios({
      method: 'get',
      url: `https://${region}.api.riotgames.com/lol/league/v4/entries/by-summoner/${summonerId}`,
      headers: { "X-Riot-Token": API_KEY }
    });
    // console.log('ranked data', res);
    return res;
  } catch (error) {
    // console.error('Erro ao buscar dados de ranked:', error);
    throw new Error('Falha ao buscar dados de ranked');
  }
  
}
