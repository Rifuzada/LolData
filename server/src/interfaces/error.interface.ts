/**
 * Interface para erro personalizado da aplicação
 */
export interface AppError extends Error {
  statusCode: number;
  isOperational: boolean;
  code?: string;
  details?: unknown;
}

/**
 * Interface para erro de validação
 */
export interface ValidationError {
  field: string;
  message: string;
  code: string;
  value?: unknown;
}

/**
 * Interface para as restrições de rate limiting
 */
export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  message: string;
  statusCode: number;
  skipMethods?: string[];
  skipPaths?: string[];
}

/**
 * Interface para resposta de erro da API
 */
export interface ErrorResponse {
  success: boolean;
  error: {
    code: string;
    message: string;
    statusCode: number;
    timestamp: string;
    details?: ValidationError[] | unknown;
  };
}