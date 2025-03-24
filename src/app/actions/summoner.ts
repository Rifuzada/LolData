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
    if(region === 'na1' || region === 'br1' || region === 'la1' || region === 'la2'){
    const matchIdsResponse = await axios.get<string[]>(
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
    }else if(region === 'euw1' || region === 'eun1' || region === 'ru'|| region === 'tr1'|| region === 'me1'){
      const matchIdsResponse = await axios.get<string[]>(
        `${EUROPE_URL}/lol/match/v5/matches/by-puuid/${puuid}/ids`,
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
      const matches = await Promise.all(
        matchIdsResponse.data.map((matchId: string) =>
          axios
            .get(`${EUROPE_URL}/lol/match/v5/matches/${matchId}`, {
              headers: {
                "X-Riot-Token": API_KEY,
              },
            })
            .then((response) => response.data)
        )
      );
      return matches;
    }else if(region === 'kr' || region === 'jp1'){
      const matchIdsResponse = await axios.get<string[]>(
        `${ASIA_URL}/lol/match/v5/matches/by-puuid/${puuid}/ids`,
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
      const matches = await Promise.all(
        matchIdsResponse.data.map((matchId: string) =>
          axios
            .get(`${ASIA_URL}/lol/match/v5/matches/${matchId}`, {
              headers: {
                "X-Riot-Token": API_KEY,
              },
            })
            .then((response) => response.data)
        )
      );
      return matches;
    }else if(region === 'oc1' || region === 'sg2' || region === 'tw2' || region === 'vn2'){
        const matchIdsResponse = await axios.get<string[]>(
        `${SEA_URL}/lol/match/v5/matches/by-puuid/${puuid}/ids`,
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
      const matches = await Promise.all(
        matchIdsResponse.data.map((matchId: string) =>
          axios
            .get(`${SEA_URL}/lol/match/v5/matches/${matchId}`, {
              headers: {
                "X-Riot-Token": API_KEY,
              },
              params: {
                start: 0,
                count: 10,
              },
            })
            .then((response) => response.data)
        )
      );
  
      return matches;
    }
  } catch (error) {
    console.error('Erro ao buscar histórico de partidas:', error);
    throw new Error('Falha ao buscar histórico de partidas');
  }
}

export async function getMatchHistoryByQueue(region: string, puuid: string, queueId: string) {
  try {
    // Primeiro, obter os IDs das partidas
    if(region === 'na1' || region === 'br1' || region === 'la1' || region === 'la2'){
    const matchIdsResponse = await axios.get<string[]>(
      `${BASE_URL}/lol/match/v5/matches/by-puuid/${puuid}/ids`,
      {
        headers: {
          "X-Riot-Token": API_KEY,
        },
        params: {
          start: 0, 
          count: 10,
          queue: queueId,
        },
      }
    );
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
    }else if(region === 'euw1' || region === 'eun1' || region === 'ru'|| region === 'tr1'|| region === 'me1'){
      const matchIdsResponse = await axios.get<string[]>(
        `${EUROPE_URL}/lol/match/v5/matches/by-puuid/${puuid}/ids`,
        {
          headers: {
            "X-Riot-Token": API_KEY,
          },
          params: {
            start: 0,
            count: 10,
            queue: queueId,
          },
        }
      );
      const matches = await Promise.all(
        matchIdsResponse.data.map((matchId: string) =>
          axios
            .get(`${EUROPE_URL}/lol/match/v5/matches/${matchId}`, {
              headers: {
                "X-Riot-Token": API_KEY,
              },
            })
            .then((response) => response.data)
        )
      );
      // console.log(matches);
      return matches;
    }else if(region === 'kr' || region === 'jp1'){
      const matchIdsResponse = await axios.get<string[]>(
        `${ASIA_URL}/lol/match/v5/matches/by-puuid/${puuid}/ids`,
        {
          headers: {
            "X-Riot-Token": API_KEY,
          },          
          params: {
            start: 0,
            count: 10,
            queue: queueId,
          },
        }
      );
      const matches = await Promise.all(
        matchIdsResponse.data.map((matchId: string) =>
          axios
            .get(`${ASIA_URL}/lol/match/v5/matches/${matchId}`, {
              headers: {
                "X-Riot-Token": API_KEY,
              },
            })
            .then((response) => response.data)
        )
      );
      return matches;
    }else if(region === 'oc1' || region === 'sg2' || region === 'tw2' || region === 'vn2'){
        const matchIdsResponse = await axios.get<string[]>(
        `${SEA_URL}/lol/match/v5/matches/by-puuid/${puuid}/ids`,
        {
          headers: {
            "X-Riot-Token": API_KEY,
          },
          params: {
            start: 0,
            count: 10,
            queue: queueId,
          },
        }
      );
      const matches = await Promise.all(
        matchIdsResponse.data.map((matchId: string) =>
          axios
            .get(`${SEA_URL}/lol/match/v5/matches/${matchId}`, {
              headers: {
                "X-Riot-Token": API_KEY,
              }
            })
            .then((response) => response.data)
        )
      );
  
      return matches;
    }
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