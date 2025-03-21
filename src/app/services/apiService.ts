'use client';

import axios from 'axios';
import { Account, Profile, RankedData, ChampionMastery, ChampionWithMastery, Match } from '../types';

/**
 * Interface para erros customizados da API
 */
export class ApiError extends Error {
  public status: number;
  public isNetworkError: boolean;
  public errorCode?: string;
  public data?: unknown;

  constructor(message: string, status: number, isNetworkError = false, errorCode?: string, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.isNetworkError = isNetworkError;
    this.errorCode = errorCode;
    this.data = data;
  }

  static fromAxiosError(error: any): ApiError {
    if (error.response) {
      // O servidor respondeu com um status fora do intervalo 2xx
      const status = error.response.status;
      const data = error.response.data;
      const message = typeof data === 'object' && data && 'message' in data
        ? String(data.message)
        : `Erro ${status}`;
      const errorCode = typeof data === 'object' && data && 'code' in data
        ? String(data.code)
        : undefined;

      return new ApiError(message, status, false, errorCode, data);
    } else if (error.request) {
      // A requisição foi feita mas não houve resposta
      return new ApiError(
        'Falha na comunicação com o servidor. Verifique sua conexão.',
        0,
        true,
        'NETWORK_ERROR'
      );
    } else {
      // Erro durante a configuração da requisição
      return new ApiError(
        error.message || 'Erro desconhecido ao fazer requisição',
        0,
        false,
        'REQUEST_ERROR'
      );
    }
  }
}

/**
 * URL base da API do servidor
 */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

/**
 * Função auxiliar para verificar se um erro é do tipo Axios Error
 */
const isAxiosError = (error: any): boolean => {
  return error && error.isAxiosError === true;
};

/**
 * Classe de serviço para comunicação com a API do servidor
 * Implementa o princípio de responsabilidade única (S do SOLID)
 */
class ApiService {
  private client;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000, // 10 segundos
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    // Adiciona interceptor para tratamento de erros
    this.setupInterceptors();
  }

  /**
   * Configura interceptores para o Axios
   */
  private setupInterceptors(): void {
    this.client.interceptors.response.use(
      (response: any) => response,
      (error: any) => {
        if (isAxiosError(error)) {
          throw ApiError.fromAxiosError(error);
        }
        throw new ApiError(
          error.message || 'Erro desconhecido',
          500,
          false,
          'UNKNOWN_ERROR'
        );
      }
    );
  }

  /**
   * Busca dados da conta de um jogador pelo Riot ID
   * @param gameName - Nome do jogador
   * @param tagLine - Tag do jogador
   * @returns Dados da conta do jogador
   */
  async getAccount(gameName: string, tagLine: string): Promise<Account> {
    try {
      const response = await this.client.get<Account>('/api/summoner/account', {
        params: { summonerName: gameName, region: tagLine }
      });
      return response.data;
    } catch (error: any) {
      if (error instanceof ApiError) {
        throw error;
      }
      if (isAxiosError(error)) {
        throw ApiError.fromAxiosError(error);
      }
      throw new ApiError(
        'Erro ao buscar conta',
        500,
        false,
        'UNKNOWN_ERROR'
      );
    }
  }

  /**
   * Busca dados do perfil de um jogador pelo PUUID
   * @param region - Região do servidor
   * @param puuid - PUUID do jogador
   * @returns Dados do perfil do jogador
   */
  async getProfile(region: string, puuid: string): Promise<Profile> {
    try {
      const response = await this.client.get<Profile>('/api/summoner/profile', {
        params: { region, puuid }
      });
      return response.data;
    } catch (error: any) {
      if (error instanceof ApiError) {
        throw error;
      }
      if (isAxiosError(error)) {
        throw ApiError.fromAxiosError(error);
      }
      throw new ApiError(
        'Erro ao buscar perfil',
        500,
        false,
        'UNKNOWN_ERROR'
      );
    }
  }

  /**
   * Busca dados de ranqueadas de um jogador
   * @param region - Região do servidor
   * @param summonerId - ID do invocador
   * @returns Dados de ranqueadas do jogador
   */
  async getRanked(region: string, sumID: string): Promise<RankedData[]> {
    try {
      const response = await this.client.get<RankedData[]>('/api/summoner/ranked', {
        params: { region, sumID }
      });
      return response.data;
    } catch (error: any) {
      if (error instanceof ApiError) {
        throw error;
      }
      if (isAxiosError(error)) {
        throw ApiError.fromAxiosError(error);
      }
      throw new ApiError(
        'Erro ao buscar dados de ranqueadas',
        500,
        false,
        'UNKNOWN_ERROR'
      );
    }
  }

  /**
   * Busca dados de maestria de campeões de um jogador
   * @param region - Região do servidor
   * @param puuid - PUUID do jogador
   * @returns Dados de maestria de campeões
   */
  async getMasteries(region: string, puuid: string): Promise<ChampionMastery[]> {
    try {
      const response = await this.client.get<ChampionMastery[]>('/api/summoner/masteries', {
        params: { region, puuid }
      });
      return response.data;
    } catch (error: any) {
      if (error instanceof ApiError) {
        throw error;
      }
      if (isAxiosError(error)) {
        throw ApiError.fromAxiosError(error);
      }
      throw new ApiError(
        'Erro ao buscar maestrias de campeões',
        500,
        false,
        'UNKNOWN_ERROR'
      );
    }
  }

  /**
   * Busca IDs de partidas recentes de um jogador
   * @param puuid - PUUID do jogador
   * @param platform - Plataforma/região da partida
   * @param start - Índice inicial para paginação
   * @param count - Quantidade de partidas a buscar
   * @returns Lista de IDs de partidas
   */
  async getMatchIds(
    puuid: string,
    platform: string,
    start: number = 0,
    count: number = 20
  ): Promise<string[]> {
    try {
      const response = await this.client.get<string[]>('/api/summoner/matchIds', {
        params: { puuid, platform, start, count }
      });
      return response.data;
    } catch (error: any) {
      if (error instanceof ApiError) {
        throw error;
      }
      if (isAxiosError(error)) {
        throw ApiError.fromAxiosError(error);
      }
      throw new ApiError(
        'Erro ao buscar IDs de partidas',
        500,
        false,
        'UNKNOWN_ERROR'
      );
    }
  }

  /**
   * Busca histórico de partidas de um invocador pelo nome
   * @param summonerName - Nome do invocador
   * @param region - Região do servidor
   * @param platform - Plataforma da partida
   * @param start - Índice inicial para paginação
   * @param count - Quantidade de partidas a buscar
   * @returns Histórico de partidas
   */
  async getMatchHistory(
    summonerName: string,
    region: string,
    platform: string,
    start: number = 0,
    count: number = 10
  ): Promise<Match[]> {
    try {
      const response = await this.client.get<Match[]>('/api/summoner/matchHistory', {
        params: { summonerName, region, platform, start, count }
      });
      return response.data;
    } catch (error: any) {
      if (error instanceof ApiError) {
        throw error;
      }
      if (isAxiosError(error)) {
        throw ApiError.fromAxiosError(error);
      }
      throw new ApiError(
        'Erro ao buscar histórico de partidas',
        500,
        false,
        'UNKNOWN_ERROR'
      );
    }
  }

  /**
   * Converte PUUID para nome de invocador
   * @param puuid - PUUID do jogador
   * @param region - Região do servidor
   * @returns Dados da conta
   */
  async getSummonerByPuuid(puuid: string, region: string): Promise<{ name: string; summonerLevel: number; profileIconId: number }> {
    try {
      const response = await this.client.get<{ name: string; summonerLevel: number; profileIconId: number }>('/api/summoner/puuidToName', {
        params: { puuid, region }
      });
      return response.data;
    } catch (error: any) {
      if (error instanceof ApiError) {
        throw error;
      }
      if (isAxiosError(error)) {
        throw ApiError.fromAxiosError(error);
      }
      throw new ApiError(
        'Erro ao converter PUUID para nome',
        500,
        false,
        'UNKNOWN_ERROR'
      );
    }
  }

  /**
   * Busca a versão mais recente do Data Dragon
   * @returns Versão mais recente
   */
  async getLatestVersion(): Promise<string> {
    try {
      const response = await axios.get<string[]>('https://ddragon.leagueoflegends.com/api/versions.json');
      return response.data[0];
    } catch (error: any) {
      if (isAxiosError(error)) {
        throw ApiError.fromAxiosError(error);
      }
      throw new ApiError(
        'Erro ao buscar versão do Data Dragon',
        500,
        false,
        'UNKNOWN_ERROR'
      );
    }
  }

  /**
   * Busca dados de todos os campeões
   * @param version - Versão do Data Dragon
   * @returns Dados de todos os campeões
   */
  async getChampionsData(version: string): Promise<any> {
    try {
      const response = await axios.get(
        `https://ddragon.leagueoflegends.com/cdn/${version}/data/pt_BR/champion.json`
      );
      return response.data;
    } catch (error: any) {
      if (isAxiosError(error)) {
        throw ApiError.fromAxiosError(error);
      }
      throw new ApiError(
        'Erro ao buscar dados de campeões',
        500,
        false,
        'UNKNOWN_ERROR'
      );
    }
  }

  /**
   * Busca dados de runas
   * @param version - Versão do Data Dragon
   * @returns Dados de runas
   */
  async getRunesData(version: string): Promise<any> {
    try {
      const response = await axios.get(
        `https://ddragon.leagueoflegends.com/cdn/${version}/data/pt_BR/runesReforged.json`
      );
      return response.data;
    } catch (error: any) {
      if (isAxiosError(error)) {
        throw ApiError.fromAxiosError(error);
      }
      throw new ApiError(
        'Erro ao buscar dados de runas',
        500,
        false,
        'UNKNOWN_ERROR'
      );
    }
  }

  /**
   * Busca dados de itens
   * @returns Dados de itens do Community Dragon
   */
  async getItemsData(): Promise<any> {
    try {
      const response = await axios.get(
        'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/items.json'
      );
      return response.data;
    } catch (error: any) {
      if (isAxiosError(error)) {
        throw ApiError.fromAxiosError(error);
      }
      throw new ApiError(
        'Erro ao buscar dados de itens',
        500,
        false,
        'UNKNOWN_ERROR'
      );
    }
  }

  /**
   * Busca dados dos tipos de fila
   * @returns Dados dos tipos de fila
   */
  async getQueueTypes(): Promise<any> {
    try {
      const response = await axios.get(
        'https://static.developer.riotgames.com/docs/lol/queues.json'
      );
      return response.data;
    } catch (error: any) {
      if (isAxiosError(error)) {
        throw ApiError.fromAxiosError(error);
      }
      throw new ApiError(
        'Erro ao buscar tipos de fila',
        500,
        false,
        'UNKNOWN_ERROR'
      );
    }
  }
}

// Exporta uma instância única do serviço (padrão Singleton)
const apiService = new ApiService();
export default apiService;