import { Request, Response, NextFunction } from 'express';
import { TypedRequestQuery } from '../interfaces/api.interface';
import { AppError } from '../utils/error.class';
import { ApiResponseUtils } from '../utils/response.utils';
import { logger } from '../middleware/logger.middleware';
import { summonerSchemas } from '../validators/summonerValidators';
import { z } from 'zod';
import { apiService } from '../services/api.service';
import { cacheService } from '../services/cache.service';

// Interfaces para tipar as respostas da API
interface SummonerDTO {
  id: string;
  accountId: string;
  puuid: string;
  name: string;
  profileIconId: number;
  revisionDate: number;
  summonerLevel: number;
}

interface ChampionMasteryDTO {
  championId: number;
  championLevel: number;
  championPoints: number;
  lastPlayTime: number;
  championPointsSinceLastLevel: number;
  championPointsUntilNextLevel: number;
  chestGranted: boolean;
  tokensEarned: number;
  summonerId: string;
}

interface LeagueEntryDTO {
  leagueId: string;
  summonerId: string;
  summonerName: string;
  queueType: string;
  tier: string;
  rank: string;
  leaguePoints: number;
  wins: number;
  losses: number;
  hotStreak: boolean;
  veteran: boolean;
  freshBlood: boolean;
  inactive: boolean;
}

/**
 * Controlador para operações relacionadas a invocadores
 * Implementa o princípio de responsabilidade única (S do SOLID)
 */
class SummonerController {
  /**
   * Obtém informações básicas de um invocador pelo nome
   */
  async getSummonerByName(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { summonerName, region } = req.query as { summonerName: string, region: string };
      logger.info(`Buscando invocador: ${summonerName} (${region})`);

      const endpoint = `https://${region}.api.riotgames.com/lol/summoner/v4/summoners/by-name/${encodeURIComponent(summonerName)}`;
      const data = await apiService.get<SummonerDTO>(endpoint);

      ApiResponseUtils.success(res, data);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtém maestrias de campeões de um invocador pelo nome
   */
  async getMasteriesBySummonerName(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { summonerName, region } = req.query as { summonerName: string, region: string };
      logger.info(`Buscando maestrias para: ${summonerName} (${region})`);

      // Primeiro busca os dados do invocador para obter o ID
      const summonerEndpoint = `https://${region}.api.riotgames.com/lol/summoner/v4/summoners/by-name/${encodeURIComponent(summonerName)}`;
      const summoner = await apiService.get<SummonerDTO>(summonerEndpoint);

      // Depois busca as maestrias usando o ID
      const masteriesEndpoint = `https://${region}.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-summoner/${summoner.id}`;
      const masteries = await apiService.get<ChampionMasteryDTO[]>(masteriesEndpoint);

      ApiResponseUtils.success(res, masteries);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtém informações de perfil completo de um invocador pelo nome
   */
  async getProfileBySummonerName(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { summonerName, region } = req.query as { summonerName: string, region: string };
      logger.info(`Buscando perfil para: ${summonerName} (${region})`);

      // Primeiro busca os dados básicos do invocador
      const summonerEndpoint = `https://${region}.api.riotgames.com/lol/summoner/v4/summoners/by-name/${encodeURIComponent(summonerName)}`;
      const summoner = await apiService.get<SummonerDTO>(summonerEndpoint);

      // Busca dados de maestria
      const masteriesEndpoint = `https://${region}.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-summoner/${summoner.id}`;
      const masteries = await apiService.get<ChampionMasteryDTO[]>(masteriesEndpoint);

      // Busca dados de ranqueadas
      const rankedEndpoint = `https://${region}.api.riotgames.com/lol/league/v4/entries/by-summoner/${summoner.id}`;
      const ranked = await apiService.get<LeagueEntryDTO[]>(rankedEndpoint);

      // Combina todos os dados
      const profile = {
        summoner,
        masteries: masteries.slice(0, 10), // Retornamos apenas as 10 melhores
        ranked
      };

      ApiResponseUtils.success(res, profile);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtém informações de ranqueada de um invocador pelo nome
   */
  async getRankedBySummonerName(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { summonerName, region } = req.query as { summonerName: string, region: string };
      logger.info(`Buscando ranqueadas para: ${summonerName} (${region})`);

      // Primeiro busca os dados básicos do invocador
      const summonerEndpoint = `https://${region}.api.riotgames.com/lol/summoner/v4/summoners/by-name/${encodeURIComponent(summonerName)}`;
      const summoner = await apiService.get<SummonerDTO>(summonerEndpoint);

      // Busca dados de ranqueadas
      const rankedEndpoint = `https://${region}.api.riotgames.com/lol/league/v4/entries/by-summoner/${summoner.id}`;
      const ranked = await apiService.get<LeagueEntryDTO[]>(rankedEndpoint);

      ApiResponseUtils.success(res, ranked);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtém IDs de partidas de um invocador por PUUID
   */
  async getMatchIdsByPuuid(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = req.query;
      const puuid = query.puuid as string;
      const platform = query.platform as string;
      const queue = query.queue ? Number(query.queue) : undefined;
      const type = query.type as string | undefined;
      const start = Number(query.start || 0);
      const count = Number(query.count || 20);

      logger.info(`Buscando IDs de partidas para PUUID: ${puuid.substring(0, 8)}... (${platform})`);

      let endpoint = `https://${platform}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?start=${start}&count=${count}`;

      if (queue) {
        endpoint += `&queue=${queue}`;
      }

      if (type) {
        endpoint += `&type=${type}`;
      }

      const matchIds = await apiService.get<string[]>(endpoint);

      ApiResponseUtils.success(res, matchIds);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtém detalhes de uma partida pelo ID
   * Método interno, não exposto como rota
   */
  private async getMatchById(matchId: string, platform: string) {
    const endpoint = `https://${platform}.api.riotgames.com/lol/match/v5/matches/${matchId}`;
    return apiService.get<any>(endpoint);
  }

  /**
   * Obtém histórico de partidas de um invocador pelo nome
   */
  async getMatchHistoryBySummonerName(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = req.query;
      const summonerName = query.summonerName as string;
      const region = query.region as string;
      const platform = query.platform as string;
      const start = Number(query.start || 0);
      const count = Number(query.count || 10);

      logger.info(`Buscando histórico de partidas para: ${summonerName} (${region})`);

      // Primeiro busca os dados básicos do invocador
      const summonerEndpoint = `https://${region}.api.riotgames.com/lol/summoner/v4/summoners/by-name/${encodeURIComponent(summonerName)}`;
      const summoner = await apiService.get<SummonerDTO>(summonerEndpoint);

      // Busca IDs das últimas partidas
      const matchIdsEndpoint = `https://${platform}.api.riotgames.com/lol/match/v5/matches/by-puuid/${summoner.puuid}/ids?start=${start}&count=${count}`;
      const matchIds = await apiService.get<string[]>(matchIdsEndpoint);

      if (!matchIds.length) {
        ApiResponseUtils.success(res, []);
        return;
      }

      // Busca detalhes de cada partida
      const matchPromises = matchIds.map((id: string) => this.getMatchById(id, platform));
      const matches = await Promise.all(matchPromises);

      ApiResponseUtils.success(res, matches);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Converte um PUUID para nome de invocador
   */
  async getSummonerNameByPuuid(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { puuid, region } = req.query as { puuid: string, region: string };
      logger.info(`Convertendo PUUID para nome: ${puuid.substring(0, 8)}... (${region})`);

      const endpoint = `https://${region}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}`;
      const summoner = await apiService.get<SummonerDTO>(endpoint);

      ApiResponseUtils.success(res, {
        name: summoner.name,
        summonerLevel: summoner.summonerLevel,
        profileIconId: summoner.profileIconId
      });
    } catch (error) {
      next(error);
    }
  }
}

// Exporta uma instância única do controlador (padrão Singleton)
export const summonerController = new SummonerController();