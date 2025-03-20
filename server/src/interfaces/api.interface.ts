import { Request } from 'express';

/**
 * Interface para estender Request com query tipada
 */
export interface TypedRequestQuery<T = Record<string, any>> extends Request {
  query: T;
}

/**
 * Interface para estender Request com body tipado
 */
export interface TypedRequestBody<T = Record<string, any>> extends Request {
  body: T;
}

/**
 * Interface para estender Request com params tipado
 */
export interface TypedRequestParams<T = Record<string, any>> extends Request {
  params: T;
}

/**
 * Interface para estender Request com query e body tipados
 */
export interface TypedRequest<
  QueryType = Record<string, any>,
  BodyType = Record<string, any>,
  ParamsType = Record<string, any>
> extends Request {
  query: QueryType;
  body: BodyType;
  params: ParamsType;
}

/**
 * Interface para parâmetros de paginação
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
}

/**
 * Interface para configuração do serviço
 */
export interface ServiceConfig {
  baseUrl: string;
  apiKey: string;
  timeout?: number;
}

/**
 * Interface para resposta de API
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  statusCode: number;
}

/**
 * Interface para resposta paginada
 */
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

/**
 * Interface para metadados de resposta de API
 */
export interface ApiResponseMetadata {
  timestamp: string;
  version: string;
  region?: string;
}