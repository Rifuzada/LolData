import axios from 'axios';
import { AppError } from '../utils/error.class';
import { logger } from '../middleware/logger.middleware';
import config from '../config/config';
import { cacheService } from './cache.service';

// Definindo tipos internos com base no que o axios usa
interface AxiosConfig {
  method?: string;
  url?: string;
  headers?: Record<string, string>;
  data?: any;
  timeout?: number;
  params?: any;
}

interface AxiosErrorResponse {
  status: number;
  data: any;
  config: AxiosConfig;
}

interface AxiosErrorType {
  response?: AxiosErrorResponse;
  request?: any;
  message?: string;
  config?: AxiosConfig;
}

interface AxiosResponseType<T = any> {
  status: number;
  data: T;
  config: AxiosConfig;
}

/**
 * Serviço para fazer requisições HTTP
 */
class ApiService {
  private readonly apiKey: string;
  private readonly apiKeyHeader: string;
  private client: any;

  constructor() {
    this.apiKey = process.env.API_KEY || '';
    this.apiKeyHeader = 'X-Riot-Token';

    // Configuração base do cliente Axios
    this.client = axios.create({
      timeout: 10000, // 10 segundos
      headers: {
        [this.apiKeyHeader]: this.apiKey,
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept-Charset': 'application/x-www-form-urlencoded; charset=UTF-8',
      },
    });

    // Adiciona interceptadores para logging e tratamento de erros
    this.setupInterceptors();
  }

  /**
   * Configura interceptors para o cliente Axios
   */
  private setupInterceptors(): void {
    // Interceptador de requisição para logging
    this.client.interceptors.request.use(
      (config: AxiosConfig) => {
        logger.debug(`Requisição: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error: any) => {
        logger.error('Erro ao preparar requisição', error);
        return Promise.reject(error);
      }
    );

    // Interceptador de resposta para logging e tratamento de erros
    this.client.interceptors.response.use(
      (response: AxiosResponseType) => {
        logger.debug(`Resposta: ${response.status} ${response.config.url}`);
        return response;
      },
      (error: AxiosErrorType) => {
        return this.handleApiError(error);
      }
    );
  }

  /**
   * Trata erros da API da Riot Games
   * @param error Erro do Axios
   * @returns Promise rejeitada com um AppError
   */
  private handleApiError(error: AxiosErrorType): Promise<never> {
    if (error.response) {
      const { status, data, config } = error.response;
      const url = config?.url || 'unknown URL';

      logger.error(`Erro ${status} na API: ${url}`, { data });

      switch (status) {
        case 400:
          return Promise.reject(new AppError('Requisição inválida', 400, 'BAD_REQUEST', data));
        case 401:
          return Promise.reject(new AppError('API key inválida ou expirada', 401, 'UNAUTHORIZED', data));
        case 403:
          return Promise.reject(new AppError('Acesso negado', 403, 'FORBIDDEN', data));
        case 404:
          return Promise.reject(new AppError('Recurso não encontrado', 404, 'NOT_FOUND', data));
        case 429:
          return Promise.reject(new AppError('Limite de requisições excedido', 429, 'RATE_LIMIT_EXCEEDED', data));
        case 500:
        case 502:
        case 503:
        case 504:
          return Promise.reject(new AppError('Erro no servidor da Riot Games', status, 'RIOT_SERVER_ERROR', data));
        default:
          return Promise.reject(new AppError(`Erro inesperado: ${status}`, status, 'UNKNOWN_ERROR', data));
      }
    } else if (error.request) {
      logger.error('Sem resposta da API', error);
      return Promise.reject(new AppError('Sem resposta da API', 500, 'NO_RESPONSE', error.request));
    } else {
      logger.error('Erro na configuração da requisição', error);
      return Promise.reject(new AppError('Erro na requisição', 500, 'REQUEST_ERROR', error.message));
    }
  }

  /**
   * Faz uma requisição GET para a API
   * @param url URL da requisição
   * @param useCache Indica se deve usar cache
   * @param cacheTTL Tempo de vida do cache em segundos
   * @returns Dados da resposta
   */
  async get<T>(url: string, useCache = true, cacheTTL = 600): Promise<T> {
    try {
      // Verifica se há dados em cache
      if (useCache) {
        const cacheKey = `api_get_${url}`;
        const cachedData = await cacheService.get<T>(cacheKey);

        if (cachedData) {
          logger.debug(`Dados obtidos do cache: ${cacheKey}`);
          return cachedData;
        }
      }

      // Faz a requisição
      logger.debug(`Fazendo requisição GET para: ${url}`);
      const response: AxiosResponseType<T> = await this.client.get(url);

      // Armazena em cache se necessário
      if (useCache) {
        const cacheKey = `api_get_${url}`;
        await cacheService.set(cacheKey, response.data, cacheTTL);
      }

      return response.data;
    } catch (error) {
      this.handleError(error as AxiosErrorType, url);
      throw error; // Este throw nunca será alcançado pois handleError sempre lança uma exceção
    }
  }

  /**
   * Realiza uma requisição POST
   * @param url URL da requisição
   * @param data Dados para enviar
   * @param config Configurações adicionais para o Axios
   * @returns Promise com o dado da resposta
   */
  async post<T>(url: string, data?: any, config?: AxiosConfig): Promise<T> {
    return this.request<T>('POST', url, data, config);
  }

  /**
   * Realiza uma requisição PUT
   * @param url URL da requisição
   * @param data Dados para enviar
   * @param config Configurações adicionais para o Axios
   * @returns Promise com o dado da resposta
   */
  async put<T>(url: string, data?: any, config?: AxiosConfig): Promise<T> {
    return this.request<T>('PUT', url, data, config);
  }

  /**
   * Realiza uma requisição DELETE
   * @param url URL da requisição
   * @param config Configurações adicionais para o Axios
   * @returns Promise com o dado da resposta
   */
  async delete<T>(url: string, config?: AxiosConfig): Promise<T> {
    return this.request<T>('DELETE', url, undefined, config);
  }

  /**
   * Método genérico para realizar requisições HTTP
   * @param method Método HTTP
   * @param url URL da requisição
   * @param data Dados para enviar (opcional)
   * @param config Configurações adicionais para o Axios
   * @returns Promise com o dado da resposta
   */
  private async request<T>(
    method: string,
    url: string,
    data?: any,
    config?: AxiosConfig
  ): Promise<T> {
    try {
      const response: AxiosResponseType<T> = await this.client.request({
        method,
        url,
        data,
        ...config,
      });

      return response.data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new AppError('Erro desconhecido na requisição', 500, 'UNKNOWN_ERROR');
    }
  }

  /**
   * Trata erros de requisição HTTP
   * @param error Erro da requisição
   * @param url URL da requisição
   */
  private handleError(error: AxiosErrorType, url: string): never {
    const status = error.response?.status || 500;
    const errorData = error.response?.data as Record<string, any> || {};
    const message = errorData.message || error.message || 'Erro ao comunicar com o servidor';

    logger.error(`Erro na requisição para ${url}`, {
      status,
      message,
      url,
    });

    // Trata erros específicos
    switch (status) {
      case 400:
        throw new AppError(`Requisição inválida: ${message}`, 400, 'BAD_REQUEST');
      case 401:
        throw new AppError('API key inválida ou expirada', 401, 'UNAUTHORIZED');
      case 403:
        throw new AppError('Acesso negado', 403, 'FORBIDDEN');
      case 404:
        throw new AppError(`Recurso não encontrado: ${url}`, 404, 'NOT_FOUND');
      case 429:
        throw new AppError('Limite de requisições excedido. Tente novamente mais tarde.', 429, 'RATE_LIMIT_EXCEEDED');
      default:
        throw new AppError(`Erro ao comunicar com a API externa: ${message}`, 502, 'EXTERNAL_SERVICE_ERROR');
    }
  }
}

// Exporta instância única do serviço (padrão Singleton)
export const apiService = new ApiService();