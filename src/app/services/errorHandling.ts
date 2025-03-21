'use client';

import { ApiError } from './apiService';

/**
 * Tipo para diferentes categorias de erros da aplicação
 */
export type ErrorCategory =
  | 'network'   // Erros de rede/conexão
  | 'auth'      // Erros de autenticação
  | 'api'       // Erros da API
  | 'validation' // Erros de validação
  | 'timeout'   // Timeout de requisições
  | 'unknown';  // Erros desconhecidos

/**
 * Interface para retorno do handler de erros
 */
export interface ErrorResponse {
  message: string;
  category: ErrorCategory;
  technical?: string;
  retry?: boolean;
}

/**
 * Classe utilitária para tratamento de erros da aplicação
 */
export class ErrorHandler {
  /**
   * Processa um erro e retorna uma resposta padronizada
   * @param error Erro capturado
   * @returns Resposta padronizada com detalhes do erro
   */
  static handleError(error: unknown): ErrorResponse {
    // Se for um erro da API (criado pelo nosso service)
    if (error instanceof ApiError) {
      return this.handleApiError(error);
    }

    // Se for um erro genérico
    if (error instanceof Error) {
      return {
        message: 'Ocorreu um erro inesperado. Tente novamente mais tarde.',
        category: 'unknown',
        technical: error.message
      };
    }

    // Erros desconhecidos ou primitivos
    return {
      message: 'Erro desconhecido. Tente novamente mais tarde.',
      category: 'unknown',
      technical: String(error)
    };
  }

  /**
   * Trata erros específicos da API
   * @param error Erro da API
   * @returns Resposta padronizada
   */
  private static handleApiError(error: ApiError): ErrorResponse {
    // Erros de rede
    if (error.isNetworkError) {
      return {
        message: 'Falha na conexão com o servidor. Verifique sua conexão de internet.',
        category: 'network',
        technical: error.message,
        retry: true
      };
    }

    // Erros por código HTTP
    switch (error.status) {
      case 401:
      case 403:
        return {
          message: 'Você não tem permissão para acessar este recurso.',
          category: 'auth',
          technical: error.message
        };

      case 404:
        return {
          message: 'O recurso solicitado não foi encontrado.',
          category: 'api',
          technical: error.message
        };

      case 400:
        return {
          message: 'Os dados fornecidos são inválidos. Verifique as informações e tente novamente.',
          category: 'validation',
          technical: error.message
        };

      case 408:
      case 504:
        return {
          message: 'O servidor demorou muito para responder. Tente novamente mais tarde.',
          category: 'timeout',
          technical: error.message,
          retry: true
        };

      case 429:
        return {
          message: 'Muitas requisições em pouco tempo. Aguarde um momento e tente novamente.',
          category: 'api',
          technical: error.message,
          retry: true
        };

      case 500:
      case 502:
      case 503:
        return {
          message: 'Erro no servidor. Tente novamente mais tarde.',
          category: 'api',
          technical: error.message
        };

      default:
        return {
          message: 'Ocorreu um erro ao processar sua solicitação. Tente novamente mais tarde.',
          category: 'api',
          technical: error.message
        };
    }
  }

  /**
   * Registra o erro para análise (pode ser expandido com serviços como Sentry)
   * @param error Erro a ser registrado
   */
  static logError(error: unknown): void {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Erro capturado:', error);
    }

    // Aqui você pode adicionar integração com serviços de monitoramento
    // como Sentry, LogRocket, etc.
  }
}

/**
 * Hook para usar o ErrorHandler
 * @param error Erro capturado
 * @returns Resposta padronizada com detalhes do erro
 */
export function useErrorHandler(error: unknown): ErrorResponse {
  ErrorHandler.logError(error);
  return ErrorHandler.handleError(error);
}