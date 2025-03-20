import { Request, Response, NextFunction } from 'express';
import { ZodType, ZodError } from 'zod';
import { logger } from './logger.middleware';
import { ApiResponseUtils } from '../utils/response.utils';
import { AppError } from '../utils/error.class';

/**
 * Factory de middleware para validar body de requisições
 * @param schema Schema Zod para validação
 * @returns Middleware de validação
 */
export const validateBody = <T>(schema: ZodType<T>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = schema.parse(req.body);
      // Substitui o body original pelo validado
      req.body = result;
      next();
    } catch (error) {
      logger.warn('Erro de validação de body', {
        error,
        body: req.body,
        path: req.path
      });

      if (error instanceof ZodError) {
        return ApiResponseUtils.error(
          res,
          new AppError('Dados de entrada inválidos', 400, 'VALIDATION_ERROR', {
            validationErrors: error.errors
          })
        );
      }

      return ApiResponseUtils.error(
        res,
        new AppError('Erro na validação do corpo da requisição', 400, 'VALIDATION_ERROR')
      );
    }
  };
};

/**
 * Factory de middleware para validar parâmetros de rota
 * @param schema Schema Zod para validação
 * @returns Middleware de validação
 */
export const validateParams = <T>(schema: ZodType<T>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = schema.parse(req.params);
      // Substitui os params originais pelos validados
      req.params = result as any;
      next();
    } catch (error) {
      logger.warn('Erro de validação de parâmetros', {
        error,
        params: req.params,
        path: req.path
      });

      if (error instanceof ZodError) {
        return ApiResponseUtils.error(
          res,
          new AppError('Parâmetros de rota inválidos', 400, 'VALIDATION_ERROR', {
            validationErrors: error.errors
          })
        );
      }

      return ApiResponseUtils.error(
        res,
        new AppError('Erro na validação dos parâmetros da rota', 400, 'VALIDATION_ERROR')
      );
    }
  };
};

/**
 * Factory de middleware para validar query params
 * @param schema Schema Zod para validação
 * @returns Middleware de validação
 */
export const validateQuery = <T>(schema: ZodType<T>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = schema.parse(req.query);
      // Substitui a query original pela validada
      req.query = result as any;
      next();
    } catch (error) {
      logger.warn('Erro de validação de query', {
        error,
        query: req.query,
        path: req.path
      });

      if (error instanceof ZodError) {
        return ApiResponseUtils.error(
          res,
          new AppError('Parâmetros de consulta inválidos', 400, 'VALIDATION_ERROR', {
            validationErrors: error.errors
          })
        );
      }

      return ApiResponseUtils.error(
        res,
        new AppError('Erro na validação dos parâmetros de consulta', 400, 'VALIDATION_ERROR')
      );
    }
  };
};