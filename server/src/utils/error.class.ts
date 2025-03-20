/**
 * Tipo que define os códigos de erro da aplicação
 */
export type ErrorCode =
  // Erros de cliente (4xx)
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'METHOD_NOT_ALLOWED'
  | 'NOT_ACCEPTABLE'
  | 'REQUEST_TIMEOUT'
  | 'CONFLICT'
  | 'GONE'
  | 'PAYLOAD_TOO_LARGE'
  | 'UNSUPPORTED_MEDIA_TYPE'
  | 'TOO_MANY_REQUESTS'
  | 'RATE_LIMIT_EXCEEDED'
  | 'VALIDATION_ERROR'

  // Erros de servidor (5xx)
  | 'INTERNAL_SERVER_ERROR'
  | 'NOT_IMPLEMENTED'
  | 'BAD_GATEWAY'
  | 'SERVICE_UNAVAILABLE'
  | 'GATEWAY_TIMEOUT'
  | 'NETWORK_ERROR'
  | 'DB_ERROR'
  | 'EXTERNAL_SERVICE_ERROR'

  // Erros específicos da API da Riot
  | 'RIOT_SERVER_ERROR'
  | 'RIOT_API_ERROR'
  | 'NO_RESPONSE'
  | 'REQUEST_ERROR'

  // Outros erros
  | 'UNKNOWN_ERROR';

/**
 * Classe de erro customizada para a aplicação
 * Estende a classe Error nativa
 */
export class AppError extends Error {
  /**
   * Código HTTP do erro
   */
  public readonly statusCode: number;

  /**
   * Código de erro da aplicação
   */
  public readonly code: ErrorCode;

  /**
   * Dados adicionais do erro (opcional)
   */
  public readonly data?: any;

  /**
   * Timestamp do erro
   */
  public readonly timestamp: string;

  /**
   * Construtor da classe AppError
   * @param message Mensagem de erro
   * @param statusCode Código HTTP do erro
   * @param code Código de erro da aplicação
   * @param data Dados adicionais (opcional)
   */
  constructor(
    message: string,
    statusCode: number = 500,
    code: ErrorCode = 'INTERNAL_SERVER_ERROR',
    data?: any
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.data = data;
    this.timestamp = new Date().toISOString();

    // Configura o nome da classe corretamente para o stack trace
    this.name = this.constructor.name;

    // Mantém o stack trace funcionando corretamente
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Serializa o erro para JSON
   * @returns Objeto JSON com os detalhes do erro
   */
  public toJSON(): Record<string, any> {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      code: this.code,
      stack: this.stack,
      data: this.data,
      timestamp: this.timestamp
    };
  }

  /**
   * Verifica se um objeto é uma instância de AppError
   * @param error Objeto a ser verificado
   * @returns true se for uma instância de AppError
   */
  public static isAppError(error: any): error is AppError {
    return error instanceof AppError;
  }

  /**
   * Cria um erro de validação
   * @param message Mensagem descritiva do erro
   * @param details Detalhes da validação
   * @returns Uma instância de AppError configurada como erro de validação
   */
  static validation(message: string, details?: unknown): AppError {
    return new AppError(message, 400, 'VALIDATION_ERROR', details);
  }

  /**
   * Cria um erro de recurso não encontrado
   * @param message Mensagem descritiva do erro
   * @returns Uma instância de AppError configurada como recurso não encontrado
   */
  static notFound(message: string): AppError {
    return new AppError(message, 404, 'NOT_FOUND');
  }

  /**
   * Cria um erro de autorização
   * @param message Mensagem descritiva do erro
   * @returns Uma instância de AppError configurada como erro de autorização
   */
  static unauthorized(message: string): AppError {
    return new AppError(message, 401, 'UNAUTHORIZED');
  }

  /**
   * Cria um erro de acesso proibido
   * @param message Mensagem descritiva do erro
   * @returns Uma instância de AppError configurada como acesso proibido
   */
  static forbidden(message: string): AppError {
    return new AppError(message, 403, 'FORBIDDEN');
  }

  /**
   * Cria um erro interno do servidor
   * @param message Mensagem descritiva do erro
   * @param details Detalhes do erro
   * @returns Uma instância de AppError configurada como erro interno
   */
  static internal(message: string, details?: unknown): AppError {
    return new AppError(message, 500, 'INTERNAL_SERVER_ERROR', details);
  }

  /**
   * Cria um erro de serviço externo
   * @param message Mensagem descritiva do erro
   * @param details Detalhes do erro
   * @returns Uma instância de AppError configurada como erro de serviço externo
   */
  static externalService(message: string, details?: unknown): AppError {
    return new AppError(message, 502, 'EXTERNAL_SERVICE_ERROR', details);
  }

  /**
   * Cria um erro de rate limit excedido
   * @param message Mensagem descritiva do erro
   * @param details Detalhes do erro
   * @returns Uma instância de AppError configurada como erro de rate limit
   */
  static rateLimitExceeded(message: string, details?: unknown): AppError {
    return new AppError(message, 429, 'RATE_LIMIT_EXCEEDED', details);
  }
}