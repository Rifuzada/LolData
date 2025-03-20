import { Router } from 'express';
import { RequestHandler } from 'express';
import { summonerController } from '../controllers/summoner.controller';
import { validateQuery } from '../middleware/validator.middleware';
import { riotApiRateLimiter } from '../middleware/rate-limit.middleware';
import { summonerSchemas } from '../validators/summoner.validator';

/**
 * Router para endpoints relacionados a invocadores do League of Legends
 * Implementa o princípio de responsabilidade única (S do SOLID)
 */
const router = Router();

/**
 * @route   GET /api/summoner/account
 * @desc    Obtém informações de conta de um invocador pelo nome
 * @access  Public
 */
router.get(
  '/account',
  validateQuery(summonerSchemas.summonerName) as RequestHandler,
  riotApiRateLimiter(),
  summonerController.getSummonerByName
);

/**
 * @route   GET /api/summoner/masteries
 * @desc    Obtém as maestrias de campeões de um invocador pelo nome
 * @access  Public
 */
router.get(
  '/masteries',
  validateQuery(summonerSchemas.summonerName) as RequestHandler,
  riotApiRateLimiter(),
  summonerController.getMasteriesBySummonerName
);

/**
 * @route   GET /api/summoner/profile
 * @desc    Obtém o perfil completo de um invocador pelo nome
 * @access  Public
 */
router.get(
  '/profile',
  validateQuery(summonerSchemas.summonerName) as RequestHandler,
  riotApiRateLimiter(),
  summonerController.getProfileBySummonerName
);

/**
 * @route   GET /api/summoner/ranked
 * @desc    Obtém informações de ranqueada de um invocador pelo nome
 * @access  Public
 */
router.get(
  '/ranked',
  validateQuery(summonerSchemas.summonerName) as RequestHandler,
  riotApiRateLimiter(),
  summonerController.getRankedBySummonerName
);

/**
 * @route   GET /api/summoner/matchIds
 * @desc    Obtém IDs de partidas de um invocador por puuid
 * @access  Public
 */
router.get(
  '/matchIds',
  validateQuery(summonerSchemas.matchIds) as RequestHandler,
  riotApiRateLimiter(),
  summonerController.getMatchIdsByPuuid
);

/**
 * @route   GET /api/summoner/matchHistory
 * @desc    Obtém histórico de partidas de um invocador pelo nome
 * @access  Public
 */
router.get(
  '/matchHistory',
  validateQuery(summonerSchemas.matchHistory) as RequestHandler,
  riotApiRateLimiter(),
  summonerController.getMatchHistoryBySummonerName
);

/**
 * @route   GET /api/summoner/puuidToName
 * @desc    Converte PUUID para nome de invocador
 * @access  Public
 */
router.get(
  '/puuidToName',
  validateQuery(summonerSchemas.puuid) as RequestHandler,
  riotApiRateLimiter(),
  summonerController.getSummonerNameByPuuid
);

/**
 * Exporta o router de summoner
 */
export default router;