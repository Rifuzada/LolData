import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Carrega variáveis de ambiente do arquivo .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Schema de validação para variáveis de ambiente
const envSchema = z.object({
  // Configurações do servidor
  PORT: z.string().default('4000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // API Riot Games
  RIOT_API_KEY: z.string(),

  // CORS
  CORS_ORIGIN: z.string().default('http://localhost:3000'),

  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'http', 'debug']).default('info'),
  LOG_DIR: z.string().default('logs'),

  // Cache
  CACHE_TTL: z.string().default('600'),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().default('900000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().default('100'),
});

// Extrai e valida as variáveis de ambiente
const envVars = envSchema.safeParse(process.env);

if (!envVars.success) {
  console.error('❌ Configuração de ambiente inválida:', envVars.error.format());
  throw new Error('Configuração de ambiente inválida');
}

/**
 * Configurações do servidor e APIs externas
 */
const config = {
  server: {
    port: parseInt(envVars.data.PORT, 10),
    env: envVars.data.NODE_ENV,
  },
  api: {
    riotKey: envVars.data.RIOT_API_KEY,
  },
  cors: {
    origin: envVars.data.CORS_ORIGIN,
  },
  logging: {
    level: envVars.data.LOG_LEVEL,
    dir: envVars.data.LOG_DIR,
  },
  cache: {
    ttl: parseInt(envVars.data.CACHE_TTL, 10),
  },
  rateLimit: {
    windowMs: parseInt(envVars.data.RATE_LIMIT_WINDOW_MS, 10),
    max: parseInt(envVars.data.RATE_LIMIT_MAX_REQUESTS, 10),
  },

  // URLs base da API da Riot Games
  riotApi: {
    americas: 'https://americas.api.riotgames.com',
    ddragon: 'https://ddragon.leagueoflegends.com',
    communityDragon: 'https://raw.communitydragon.org/latest'
  },

  // Endpoints da API da Riot Games
  endpoints: {
    riotId: 'riot/account/v1/accounts/by-riot-id',
    puuidToName: '/riot/account/v1/accounts/by-puuid',
    championMastery: 'lol/champion-mastery/v4/champion-masteries/by-puuid',
    summonerByPuuid: 'lol/summoner/v4/summoners/by-puuid',
    rankedBySummonerId: 'lol/league/v4/entries/by-summoner',
    matchesByPuuid: '/lol/match/v5/matches/by-puuid/',
    match: '/lol/match/v5/matches/',
  }
};

export default config;