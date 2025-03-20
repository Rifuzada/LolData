import { z } from 'zod';

/**
 * Esquemas de validação para as rotas de invocadores
 */
export const summonerSchemas = {
  /**
   * Validação para consulta de nome de invocador
   * Requer summonerName e region
   */
  summonerName: z.object({
    summonerName: z.string().min(3).max(16),
    region: z.string().min(2).max(4)
  }),

  /**
   * Validação para consulta de IDs de partidas
   * Requer puuid, platform e opcionalmente filtros
   */
  matchIds: z.object({
    puuid: z.string().min(10),
    platform: z.string().min(2).max(4),
    queue: z.string().optional(),
    type: z.string().optional(),
    start: z.preprocess(
      (val) => Number(val || 0),
      z.number().nonnegative().default(0)
    ),
    count: z.preprocess(
      (val) => Number(val || 20),
      z.number().positive().default(20)
    )
  }),

  /**
   * Validação para histórico de partidas
   * Requer summonerName, region, platform
   */
  matchHistory: z.object({
    summonerName: z.string().min(3).max(16),
    region: z.string().min(2).max(4),
    platform: z.string().min(2).max(4),
    start: z.preprocess(
      (val) => Number(val || 0),
      z.number().nonnegative().default(0)
    ),
    count: z.preprocess(
      (val) => Number(val || 10),
      z.number().positive().default(10)
    )
  }),

  /**
   * Validação para busca por PUUID
   * Requer puuid e region
   */
  puuid: z.object({
    puuid: z.string().min(10),
    region: z.string().min(2).max(4)
  })
};