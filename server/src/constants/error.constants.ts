/**
 * Códigos de erro da aplicação
 */
export enum ErrorCode {
  // Erros de usuário 1xxx
  VALIDATION_ERROR = '1000',
  INVALID_PARAMETERS = '1001',
  MISSING_PARAMETERS = '1002',
  INVALID_RIOT_ID = '1003',
  INVALID_REGION = '1004',

  // Erros de API externa 2xxx
  RIOT_API_ERROR = '2000',
  RIOT_RATE_LIMIT = '2001',
  RIOT_UNAUTHORIZED = '2002',
  RIOT_NOT_FOUND = '2003',
  RIOT_SERVER_ERROR = '2004',
  RIOT_TIMEOUT = '2005',
  DDRAGON_API_ERROR = '2010',

  // Erros internos 3xxx
  INTERNAL_SERVER_ERROR = '3000',
  DATABASE_ERROR = '3001',
  CACHE_ERROR = '3002',
  RATE_LIMIT_EXCEEDED = '3003',
  REQUEST_TIMEOUT = '3004',
  NOT_IMPLEMENTED = '3005'
}

/**
 * Mensagens de erro padrão
 */
export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  [ErrorCode.VALIDATION_ERROR]: 'Erro de validação nos dados',
  [ErrorCode.INVALID_PARAMETERS]: 'Parâmetros inválidos',
  [ErrorCode.MISSING_PARAMETERS]: 'Parâmetros obrigatórios não fornecidos',
  [ErrorCode.INVALID_RIOT_ID]: 'Riot ID inválido. Formato esperado: nome#tag',
  [ErrorCode.INVALID_REGION]: 'Região inválida',

  [ErrorCode.RIOT_API_ERROR]: 'Erro na API da Riot Games',
  [ErrorCode.RIOT_RATE_LIMIT]: 'Limite de requisições da API da Riot atingido',
  [ErrorCode.RIOT_UNAUTHORIZED]: 'Acesso não autorizado à API da Riot',
  [ErrorCode.RIOT_NOT_FOUND]: 'Recurso não encontrado na API da Riot',
  [ErrorCode.RIOT_SERVER_ERROR]: 'Erro no servidor da Riot Games',
  [ErrorCode.RIOT_TIMEOUT]: 'Tempo limite excedido na requisição à API da Riot',
  [ErrorCode.DDRAGON_API_ERROR]: 'Erro na API do Data Dragon',

  [ErrorCode.INTERNAL_SERVER_ERROR]: 'Erro interno do servidor',
  [ErrorCode.DATABASE_ERROR]: 'Erro de banco de dados',
  [ErrorCode.CACHE_ERROR]: 'Erro de cache',
  [ErrorCode.RATE_LIMIT_EXCEEDED]: 'Limite de requisições excedido',
  [ErrorCode.REQUEST_TIMEOUT]: 'Tempo limite da requisição excedido',
  [ErrorCode.NOT_IMPLEMENTED]: 'Funcionalidade não implementada'
};