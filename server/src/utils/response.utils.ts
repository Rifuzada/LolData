import { Response } from 'express';
import { AppError } from '../utils/error.class';
import { HttpStatus } from '../constants/http.constants';
import { ValidationError } from '../interfaces/error.interface';
import { ErrorCode } from '../constants/error.constants';

/**
 * Interface para padronizar as respostas da API
 */
interface ApiResponseType<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  statusCode?: number;
  error?: {
    code: string;
    details?: unknown;
  };
}

/**
 * Utilitário para criar respostas da API
 * Implementa o princípio de responsabilidade única (S do SOLID)
 */
export class ApiResponseUtils {
  /**
   * Resposta de sucesso
   * @param res Objeto de resposta do Express
   * @param data Dados a serem retornados
   * @param message Mensagem opcional
   * @param statusCode Código HTTP (padrão 200)
   */
  static success<T>(res: Response, data: T, message?: string, statusCode = 200): Response {
    const response: ApiResponseType<T> = {
      success: true,
      statusCode,
      data,
    };

    if (message) {
      response.message = message;
    }

    return res.status(statusCode).json(response);
  }

  /**
   * Resposta de erro
   * @param res Objeto de resposta do Express
   * @param error Erro da aplicação
   */
  static error(res: Response, error: AppError): Response {
    const response: ApiResponseType = {
      success: false,
      message: error.message,
      statusCode: error.statusCode,
      error: {
        code: error.code,
        details: error.data,
      },
    };

    return res.status(error.statusCode).json(response);
  }

  /**
   * Resposta de erro 400 (Bad Request)
   * @param res Objeto de resposta do Express
   * @param message Mensagem de erro
   * @param details Detalhes do erro (opcional)
   */
  static badRequest(res: Response, message: string, details?: unknown): Response {
    return this.error(res, new AppError(message, 400, 'BAD_REQUEST', details));
  }

  /**
   * Resposta de erro 401 (Unauthorized)
   * @param res Objeto de resposta do Express
   * @param message Mensagem de erro
   */
  static unauthorized(res: Response, message: string): Response {
    return this.error(res, new AppError(message, 401, 'UNAUTHORIZED'));
  }

  /**
   * Resposta de erro 403 (Forbidden)
   * @param res Objeto de resposta do Express
   * @param message Mensagem de erro
   */
  static forbidden(res: Response, message: string): Response {
    return this.error(res, new AppError(message, 403, 'FORBIDDEN'));
  }

  /**
   * Resposta de erro 404 (Not Found)
   * @param res Objeto de resposta do Express
   * @param message Mensagem de erro
   */
  static notFound(res: Response, message: string): Response {
    return this.error(res, new AppError(message, 404, 'NOT_FOUND'));
  }

  /**
   * Resposta de erro 429 (Too Many Requests)
   * @param res Objeto de resposta do Express
   * @param message Mensagem de erro
   * @param details Detalhes do erro (opcional)
   */
  static tooManyRequests(res: Response, message: string, details?: unknown): Response {
    return this.error(res, new AppError(message, 429, 'RATE_LIMIT_EXCEEDED', details));
  }

  /**
   * Resposta de erro 500 (Internal Server Error)
   * @param res Objeto de resposta do Express
   * @param message Mensagem de erro
   * @param details Detalhes do erro (opcional)
   */
  static internalError(res: Response, message: string, details?: unknown): Response {
    return this.error(res, new AppError(message, 500, 'INTERNAL_SERVER_ERROR', details));
  }

  /**
   * Envia uma resposta de erro de validação
   * @param res - Objeto de resposta do Express
   * @param errors - Erros de validação
   */
  static validationError(res: Response, errors: ValidationError[]): Response {
    return this.error(
      res,
      new AppError('Erro de validação nos dados', 400, 'VALIDATION_ERROR', errors)
    );
  }

  /**
   * Envia uma resposta vazia (204 No Content)
   * @param res - Objeto de resposta do Express
   */
  static noContent(res: Response): Response {
    return res.status(204).end();
  }

  /**
   * Envia uma resposta de criação bem-sucedida (201 Created)
   * @param res - Objeto de resposta do Express
   * @param data - Dados do recurso criado
   * @param message - Mensagem de sucesso (opcional)
   */
  static created<T>(res: Response, data: T, message?: string): Response {
    return this.success(res, data, message, 201);
  }
}