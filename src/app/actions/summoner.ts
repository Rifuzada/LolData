'use server';

import axios from 'axios';
import { getRegionalApiUrl } from '../utils/helpers';

const API_KEY = process.env.RIOT_API_KEY;
const BASE_URL = "https://americas.api.riotgames.com";
const EUROPE_URL = "https://europe.api.riotgames.com";
const ASIA_URL = "https://asia.api.riotgames.com";
const SEA_URL = "https://sea.api.riotgames.com";

interface RiotAccount {
  summonerLevel: any;
  puuid: string;
  gameName?: string;
  name?: string;
  tagLine: string;
  profileIconId: number;
  revisionDate: number;
}

interface Summoner {
  puuid: string;
  name: string;
  tagLine: string;
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
  const res = await axios(config);
  return res.data as T;
}

export async function getSummonerNameByPuuid(region: string, puuid: string): Promise<Summoner | null> {
  if (!puuid) throw new Error('PUUID is required to fetch summoner data');
  try {
    const summonerResponse = await safeAxios<RiotAccount>({
      method: 'get',
      url: `https://${region}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}`,
      headers: { "X-Riot-Token": API_KEY }
    });

    if (!summonerResponse) return null;

    const accountResponse = await safeAxios<RiotAccount>({
      method: 'get',
      url: `${BASE_URL}/riot/account/v1/accounts/by-puuid/${puuid}`,
      headers: { "X-Riot-Token": API_KEY }
    });

    if (!accountResponse) return null;

    const name = accountResponse.gameName || summonerResponse.name || 'unknown';

    return {
      puuid: summonerResponse.puuid,
      name,
      tagLine: accountResponse.tagLine || 'unknown',
      profileIconId: summonerResponse.profileIconId,
      revisionDate: summonerResponse.revisionDate,
      summonerLevel: summonerResponse.summonerLevel
    };
  } catch (error) {
    console.error('Error fetching summoner data:', error);
    return null;
  }
}

export async function getSummonerByRiotId(region: string, gameName: string, tagLine: string) {
  const accountData = await safeAxios<RiotAccount>({
    method: 'get',
    url: `${BASE_URL}/riot/account/v1/accounts/by-riot-id/${gameName}/${tagLine}`,
    headers: { "X-Riot-Token": API_KEY }
  });

  if (!accountData?.puuid) throw new Error('PUUID não encontrado');

  const profileData = await safeAxios<RiotAccount>({
    method: 'get',
    url: `https://${region}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${accountData.puuid}`,
    headers: { "X-Riot-Token": API_KEY }
  });

  return {
    puuid: accountData.puuid,
    name: profileData.name || profileData.gameName,
    tagLine: accountData.tagLine,
    profileIconId: profileData.profileIconId,
    summonerLevel: profileData.summonerLevel,
    revisionDate: Date.now()
  };
}

export async function getChampionMasteries(region: string, puuid: string) {
  try {
    return await safeAxios({
      method: 'get',
      url: `https://${region}.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-puuid/${puuid}`,
      headers: { "X-Riot-Token": API_KEY }
    });
  } catch {
    throw new Error('Falha ao buscar maestrias');
  }
}

export async function getMatchHistory(region: string, puuid: string) {
  try {
    //console.log("🔍 Iniciando getMatchHistory:", { region, puuid });
    
    let apiUrl = BASE_URL;
    if (['euw1','eun1','ru','tr1','me1'].includes(region)) apiUrl = EUROPE_URL;
    else if (['kr','jp1'].includes(region)) apiUrl = ASIA_URL;
    else if (['oc1','sg2','tw2','vn2'].includes(region)) apiUrl = SEA_URL;

    //console.log("🌐 URL base escolhida:", apiUrl);

    const matchIds = await safeAxios<string[]>({
      method: 'get',
      url: `${apiUrl}/lol/match/v5/matches/by-puuid/${puuid}/ids`,
      headers: { "X-Riot-Token": API_KEY },
      params: { start: 0, count: 10 }
    });

    //console.log("✅ matchIds retornados:", matchIds);

    const matches = await Promise.all(
      matchIds.map(id => 
        safeAxios({ 
          method: 'get', 
          url: `${apiUrl}/lol/match/v5/matches/${id}`, 
          headers: { "X-Riot-Token": API_KEY } 
        })
      )
    );

    //console.log("✅ Histórico completo retornado com sucesso");
    return matches;

  } catch (error: any) {
    console.error("❌ Erro em getMatchHistory:", error.response?.data || error.message || error);
    throw new Error('Falha ao buscar histórico de partidas');
  }
}

export async function getMatchHistoryByQueue(region: string, puuid: string, queueId: string) {
  try {
    let apiUrl = BASE_URL;
    if (['euw1','eun1','ru','tr1','me1'].includes(region)) apiUrl = EUROPE_URL;
    else if (['kr','jp1'].includes(region)) apiUrl = ASIA_URL;
    else if (['oc1','sg2','tw2','vn2'].includes(region)) apiUrl = SEA_URL;

    const matchIds = await safeAxios<string[]>({
      method: 'get',
      url: `${apiUrl}/lol/match/v5/matches/by-puuid/${puuid}/ids`,
      headers: { "X-Riot-Token": API_KEY },
      params: { start: 0, count: 10, queue: queueId }
    });

    return await Promise.all(matchIds.map(id =>
      safeAxios({ method: 'get', url: `${apiUrl}/lol/match/v5/matches/${id}`, headers: { "X-Riot-Token": API_KEY } })
    ));
  } catch {
    throw new Error('Falha ao buscar histórico de partidas');
  }
}

export async function getQueueTypes() {
  try {
    return await safeAxios({ method: 'get', url: 'https://static.developer.riotgames.com/docs/lol/queues.json' });
  } catch {
    throw new Error('Falha ao buscar tipos de fila');
  }
}

// AQUI: substituímos getRankedBySummonerId por getRankedByPuuid
export async function getRankedByPuuid(region: string, puuid: string) {
  if (!puuid) throw new Error('PUUID do invocador não fornecido');

  const data = await safeAxios<any[]>({
    method: 'get',
    url: `https://${region}.api.riotgames.com/lol/league/v4/entries/by-puuid/${puuid}`,
    headers: { "X-Riot-Token": API_KEY }
  });

  return Array.isArray(data) ? data : [];
}
