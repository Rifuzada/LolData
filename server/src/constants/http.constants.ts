/**
 * Códigos de status HTTP
 */
export enum HttpStatus {
  OK = 200,
  CREATED = 201,
  NO_CONTENT = 204,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  METHOD_NOT_ALLOWED = 405,
  CONFLICT = 409,
  TOO_MANY_REQUESTS = 429,
  INTERNAL_SERVER_ERROR = 500,
  SERVICE_UNAVAILABLE = 503
}

/**
 * Métodos HTTP
 */
export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  PATCH = 'PATCH',
  DELETE = 'DELETE',
  OPTIONS = 'OPTIONS',
  HEAD = 'HEAD'
}

/**
 * Headers HTTP comuns
 */
export enum HttpHeader {
  CONTENT_TYPE = 'Content-Type',
  ACCEPT = 'Accept',
  AUTHORIZATION = 'Authorization',
  USER_AGENT = 'User-Agent',
  CORS_ORIGIN = 'Access-Control-Allow-Origin',
  CORS_METHODS = 'Access-Control-Allow-Methods',
  CORS_HEADERS = 'Access-Control-Allow-Headers',
  RATE_LIMIT = 'X-Rate-Limit-Limit',
  RATE_LIMIT_REMAINING = 'X-Rate-Limit-Remaining',
  RATE_LIMIT_RESET = 'X-Rate-Limit-Reset',
  CACHE_CONTROL = 'Cache-Control',
  ETAG = 'ETag'
}

/**
 * Tipos de conteúdo HTTP
 */
export enum ContentType {
  JSON = 'application/json',
  FORM = 'application/x-www-form-urlencoded',
  TEXT = 'text/plain',
  HTML = 'text/html',
  XML = 'application/xml',
  MULTIPART = 'multipart/form-data'
}