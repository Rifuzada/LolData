import axios from 'axios';
import config from '../config/config';
import { getRegionalApiUrl } from '../utils/helpers';
import { Account, Profile, RankedData, ChampionMastery } from '../types';
import { logger } from '../middleware/logger.middleware';
import { AppError } from '../utils/error.class';

// Interfaces para tipagem do axios
interface AxiosResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  config: any;
}

interface AxiosError {
  response?: {
    data: any;
    status: number;
    headers: Record<string, string>;
    statusText: string;
  };
  request?: any;
  message: string;
  config?: any;
  isAxiosError?: boolean;
}

// Função utilitária para verificar se um erro é do Axios
function isAxiosError(error: unknown): error is AxiosError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'isAxiosError' in error
  );
}

/**
 * Serviço para comunicação com a API da Riot Games
 * Implementa o princípio de responsabilidade única (S do SOLID)
 */
class RiotService {
  private apiKey: string;
  private americasUrl: string;

  /**
   * Inicializa o serviço com a chave de API
   */
  constructor() {
    this.apiKey = config.api.riotKey;
    this.americasUrl = config.riotApi.americas;
  }

  /**
   * Busca dados da conta de um jogador pelo Riot ID
   * @param gameName - Nome do jogador
   * @param tagLine - Tag do jogador
   * @returns Dados da conta do jogador
   */
  async getAccountByRiotId(gameName: string, tagLine: string): Promise<Account> {
    try {
      const url = `${this.americasUrl}/${config.endpoints.riotId}/${gameName}/${tagLine}`;
      const response = await axios.get<Account>(url, {
        headers: { 'X-Riot-Token': this.apiKey }
      });
      return response.data;
    } catch (error) {
      logger.error('Erro ao buscar conta pelo Riot ID:', error);
      if (isAxiosError(error)) {
        if (error.response) {
          const message = error.response.data?.status?.message || error.message;
          throw new AppError(
            `Erro ao buscar conta: ${message}`,
            error.response.status,
            'RIOT_API_ERROR'
          );
        }
        throw new AppError('Erro na conexão com a API da Riot', 500, 'NETWORK_ERROR');
      }
      throw new AppError('Erro ao buscar conta', 500, 'UNKNOWN_ERROR');
    }
  }

  /**
   * Busca dados do perfil de um jogador pelo PUUID
   * @param region - Região do servidor
   * @param puuid - PUUID do jogador
   * @returns Dados do perfil do jogador
   */
  async getProfileByPuuid(region: string, puuid: string): Promise<Profile> {
    try {
      const regionalUrl = getRegionalApiUrl(region);
      const url = `${regionalUrl}/${config.endpoints.summonerByPuuid}/${puuid}`;
      const response = await axios.get<Profile>(url, {
        headers: { 'X-Riot-Token': this.apiKey }
      });
      return response.data;
    } catch (error) {
      logger.error('Erro ao buscar perfil pelo PUUID:', error);
      if (isAxiosError(error)) {
        if (error.response) {
          const message = error.response.data?.status?.message || error.message;
          throw new AppError(
            `Erro ao buscar perfil: ${message}`,
            error.response.status,
            'RIOT_API_ERROR'
          );
        }
        throw new AppError('Erro na conexão com a API da Riot', 500, 'NETWORK_ERROR');
      }
      throw new AppError('Erro ao buscar perfil', 500, 'UNKNOWN_ERROR');
    }
  }

  /**
   * Busca dados de ranqueadas de um jogador pelo ID do invocador
   * @param region - Região do servidor
   * @param summonerId - ID do invocador
   * @returns Dados de ranqueadas do jogador
   */
  async getRankedBySummonerId(region: string, summonerId: string): Promise<RankedData[]> {
    try {
      const regionalUrl = getRegionalApiUrl(region);
      const url = `${regionalUrl}/${config.endpoints.rankedBySummonerId}/${summonerId}`;
      const response = await axios.get<RankedData[]>(url, {
        headers: { 'X-Riot-Token': this.apiKey }
      });
      return response.data;
    } catch (error) {
      logger.error('Erro ao buscar dados de ranqueadas:', error);
      if (isAxiosError(error)) {
        if (error.response) {
          const message = error.response.data?.status?.message || error.message;
          throw new AppError(
            `Erro ao buscar dados de ranqueadas: ${message}`,
            error.response.status,
            'RIOT_API_ERROR'
          );
        }
        throw new AppError('Erro na conexão com a API da Riot', 500, 'NETWORK_ERROR');
      }
      throw new AppError('Erro ao buscar dados de ranqueadas', 500, 'UNKNOWN_ERROR');
    }
  }

  /**
   * Busca dados de maestria de campeões de um jogador
   * @param region - Região do servidor
   * @param puuid - PUUID do jogador
   * @returns Dados de maestria de campeões
   */
  async getChampionMasteries(region: string, puuid: string): Promise<ChampionMastery[]> {
    try {
      const regionalUrl = getRegionalApiUrl(region);
      const url = `${regionalUrl}/${config.endpoints.championMastery}/${puuid}`;
      const response = await axios.get<ChampionMastery[]>(url, {
        headers: { 'X-Riot-Token': this.apiKey }
      });
      return response.data;
    } catch (error) {
      logger.error('Erro ao buscar maestrias de campeões:', error);
      if (isAxiosError(error)) {
        if (error.response) {
          const message = error.response.data?.status?.message || error.message;
          throw new AppError(
            `Erro ao buscar maestrias: ${message}`,
            error.response.status,
            'RIOT_API_ERROR'
          );
        }
        throw new AppError('Erro na conexão com a API da Riot', 500, 'NETWORK_ERROR');
      }
      throw new AppError('Erro ao buscar maestrias de campeões', 500, 'UNKNOWN_ERROR');
    }
  }

  /**
   * Busca IDs de partidas recentes de um jogador
   * @param puuid - PUUID do jogador
   * @param count - Quantidade de partidas a serem buscadas
   * @returns Lista de IDs de partidas
   */
  async getMatchIds(puuid: string, count: number = 10): Promise<string[]> {
    try {
      const url = `${this.americasUrl}${config.endpoints.matchesByPuuid}${puuid}/ids?start=0&count=${count}`;
      const response = await axios.get<string[]>(url, {
        headers: { 'X-Riot-Token': this.apiKey }
      });
      return response.data;
    } catch (error) {
      logger.error('Erro ao buscar IDs de partidas:', error);
      if (isAxiosError(error)) {
        if (error.response) {
          const message = error.response.data?.status?.message || error.message;
          throw new AppError(
            `Erro ao buscar IDs de partidas: ${message}`,
            error.response.status,
            'RIOT_API_ERROR'
          );
        }
        throw new AppError('Erro na conexão com a API da Riot', 500, 'NETWORK_ERROR');
      }
      throw new AppError('Erro ao buscar IDs de partidas', 500, 'UNKNOWN_ERROR');
    }
  }

  /**
   * Busca dados detalhados de uma partida
   * @param matchId - ID da partida
   * @returns Dados da partida
   */
  async getMatchDetails(matchId: string): Promise<any> {
    try {
      const url = `${this.americasUrl}${config.endpoints.match}${matchId}`;
      const response = await axios.get(url, {
        headers: { 'X-Riot-Token': this.apiKey }
      });
      return response.data;
    } catch (error) {
      logger.error(`Erro ao buscar detalhes da partida ${matchId}:`, error);
      if (isAxiosError(error)) {
        if (error.response) {
          const message = error.response.data?.status?.message || error.message;
          throw new AppError(
            `Erro ao buscar detalhes da partida: ${message}`,
            error.response.status,
            'RIOT_API_ERROR'
          );
        }
        throw new AppError('Erro na conexão com a API da Riot', 500, 'NETWORK_ERROR');
      }
      throw new AppError('Erro ao buscar detalhes da partida', 500, 'UNKNOWN_ERROR');
    }
  }

  /**
   * Busca informações de conta pelo PUUID
   * @param puuid - PUUID do jogador
   * @returns Dados da conta
   */
  async getAccountByPuuid(puuid: string): Promise<Account> {
    try {
      const url = `${this.americasUrl}${config.endpoints.puuidToName}/${puuid}`;
      const response = await axios.get<Account>(url, {
        headers: { 'X-Riot-Token': this.apiKey }
      });
      return response.data;
    } catch (error) {
      logger.error('Erro ao buscar conta pelo PUUID:', error);
      if (isAxiosError(error)) {
        if (error.response) {
          const message = error.response.data?.status?.message || error.message;
          throw new AppError(
            `Erro ao buscar conta pelo PUUID: ${message}`,
            error.response.status,
            'RIOT_API_ERROR'
          );
        }
        throw new AppError('Erro na conexão com a API da Riot', 500, 'NETWORK_ERROR');
      }
      throw new AppError('Erro ao buscar conta pelo PUUID', 500, 'UNKNOWN_ERROR');
    }
  }
}

// Exporta uma instância única do serviço (padrão Singleton)
export const riotService = new RiotService();