'use server';

import axios from 'axios';

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

export async function getSummonerByRiotId(region: string, gameName: string, tagLine: string) {
  try {
    // Primeiro, obter o PUUID da conta
    const accountResponse = await axios.get<RiotAccount>(
      `${BASE_URL}/riot/account/v1/accounts/by-riot-id/${gameName}/${tagLine}`,
      {
        headers: {
          "X-Riot-Token": API_KEY,
        },
      }
    );

    const { puuid } = accountResponse.data;

    // Depois, obter os dados do invocador usando o PUUID
    const summonerResponse = await axios.get<Summoner>(
      `https://${region}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}`,
      {
        headers: {
          "X-Riot-Token": API_KEY,
        },
      }
    );

    return summonerResponse.data;
  } catch (error) {
    console.error('Erro ao buscar dados do invocador:', error);
    throw new Error('Falha ao buscar dados do invocador');
  }
}

export async function getChampionMasteries(region: string, puuid: string) {
  try {
    const response = await axios.get(
      `https://${region}.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-puuid/${puuid}`,
      {
        headers: {
          "X-Riot-Token": API_KEY,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar maestrias:', error);
    throw new Error('Falha ao buscar maestrias');
  }
}

export async function getMatchHistory(region: string, puuid: string) {
  try {
    // Primeiro, obter os IDs das partidas
    const matchIdsResponse = await axios.get(
      `${BASE_URL}/lol/match/v5/matches/by-puuid/${puuid}/ids`,
      {
        headers: {
          "X-Riot-Token": API_KEY,
        },
        params: {
          start: 0,
          count: 10,
        },
      }
    );

    // Depois, obter os detalhes de cada partida
    const matches = await Promise.all(
      matchIdsResponse.data.map((matchId: string) =>
        axios
          .get(`${BASE_URL}/lol/match/v5/matches/${matchId}`, {
            headers: {
              "X-Riot-Token": API_KEY,
            },
          })
          .then((response) => response.data)
      )
    );

    return matches;
  } catch (error) {
    console.error('Erro ao buscar histórico de partidas:', error);
    throw new Error('Falha ao buscar histórico de partidas');
  }
}

export async function getQueueTypes() {
  try {
    const response = await axios.get(
      'https://static.developer.riotgames.com/docs/lol/queues.json'
    );
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar tipos de fila:', error);
    throw new Error('Falha ao buscar tipos de fila');
  }
}