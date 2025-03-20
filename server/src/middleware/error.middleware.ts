import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/error.class';
import { ApiResponseUtils } from '../utils/response.utils';
import { logger } from './logger.middleware';

/**
 * Middleware para tratar erros de validação do Zod
 */
export const zodErrorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof ZodError) {
    const formattedErrors = err.errors.map(error => ({
      path: error.path.join('.'),
      message: error.message,
    }));

    logger.warn('Erro de validação', { errors: formattedErrors });

    return ApiResponseUtils.badRequest(res, 'Erro de validação', {
      validationErrors: formattedErrors,
    });
  }

  return next(err);
};

/**
 * Middleware para tratar erros da aplicação (AppError)
 */
export const appErrorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  if (AppError.isAppError(err)) {
    return ApiResponseUtils.error(res, err as AppError);
  }

  return next(err);
};

/**
 * Middleware para tratar erros de sintaxe JSON
 */
export const jsonSyntaxErrorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof SyntaxError && 'body' in err) {
    logger.warn('Erro de sintaxe JSON', { message: err.message });

    return ApiResponseUtils.badRequest(res, 'JSON inválido: ' + err.message);
  }

  return next(err);
};

/**
 * Middleware para tratar erros desconhecidos ou não tratados
 */
export const unknownErrorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  // Não precisamos verificar tipo, pois este é o último handler
  logger.error('Erro não tratado', {
    error: err,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Não expõe o stack trace em produção
  const isProduction = process.env.NODE_ENV === 'production';
  const errorData = isProduction ? undefined : { stack: err.stack };

  return ApiResponseUtils.error(
    res,
    new AppError(
      isProduction ? 'Erro interno do servidor' : err.message,
      500,
      'INTERNAL_SERVER_ERROR',
      errorData
    )
  );
};

/**
 * Middleware para tratar erros 404 (rotas não encontradas)
 */
export const notFoundHandler = (req: Request, res: Response) => {
  logger.warn(`Rota não encontrada: ${req.method} ${req.originalUrl}`);

  return ApiResponseUtils.notFound(
    res,
    `Rota não encontrada: ${req.method} ${req.originalUrl}`
  );
};