import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { logger } from './logger.middleware';
import { ApiResponseUtils } from '../utils/response.utils';
import { AppError } from '../utils/error.class';
import config from '../config/config';

/**
 * Middleware para limite global de requisições
 * Protege a API contra ataques de força bruta ou uso excessivo
 */
export const globalRateLimiter = () => {
  return rateLimit({
    windowMs: 60 * 1000, // 1 minuto
    max: 60, // 60 requisições por minuto
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      message: 'Muitas requisições, tente novamente mais tarde',
      code: 'RATE_LIMIT_EXCEEDED'
    },
    handler: (req: Request, res: Response) => {
      logger.warn('Limite de requisições excedido', {
        ip: req.ip,
        path: req.path,
        headers: req.headers,
      });

      return ApiResponseUtils.error(
        res,
        new AppError(
          'Muitas requisições. Por favor, tente novamente mais tarde.',
          429,
          'RATE_LIMIT_EXCEEDED',
          { retryAfter: '60 segundos' }
        )
      );
    }
  });
};

/**
 * Middleware para limite de requisições à API da Riot Games
 * Evita que sejam feitas muitas requisições, o que poderia resultar em bloqueio da chave de API
 */
export const riotApiRateLimiter = () => {
  return rateLimit({
    windowMs: config.rateLimit.windowMs, // 15 minutos padrão, configurável
    max: config.rateLimit.max, // 100 requisições padrão, configurável
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: Request) => {
      // Usando a região + path como chave para separar os limites por região
      return `${req.query.region || 'global'}:${req.path}`;
    },
    handler: (req: Request, res: Response) => {
      logger.warn('Limite de requisições à API da Riot excedido', {
        ip: req.ip,
        path: req.path,
        region: req.query.region,
      });

      return ApiResponseUtils.error(
        res,
        new AppError(
          'Limite de requisições à API da Riot Games excedido. Por favor, tente novamente mais tarde.',
          429,
          'RATE_LIMIT_EXCEEDED',
          {
            retryAfter: `${Math.floor(config.rateLimit.windowMs / (1000 * 60))} minutos`,
            region: req.query.region
          }
        )
      );
    }
  });
};