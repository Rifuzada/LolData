import winston from 'winston';
import { Request, Response, NextFunction } from 'express';
import morgan from 'morgan';
import path from 'path';
import fs from 'fs';
import config from '../config/config';

// Cria o diretório de logs se não existir
const logDir = path.join(process.cwd(), config.logging.dir);
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Formatos customizados para o Winston
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(info => {
    return `${info.timestamp} [${info.level.toUpperCase()}]: ${info.message}${info.stack ? '\n' + info.stack : ''}`;
  })
);

// Configuração do logger
export const logger = winston.createLogger({
  level: config.logging.level,
  format: customFormat,
  transports: [
    // Logs no console para todos os níveis
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        customFormat
      ),
    }),
    // Logs de erros em arquivo
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
    }),
    // Logs combinados em arquivo
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
    }),
  ],
  exitOnError: false,
});

// Morgan stream para redirecionamento ao Winston
const morganStream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};

// Middleware para logging de requisições HTTP
export const httpLogger = morgan(
  config.server.env === 'production'
    ? ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"'
    : 'dev',
  { stream: morganStream }
);

// Middleware para logging de erros
export const errorLogger = (err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error(`${req.method} ${req.url} - ${err.message}`, {
    error: err,
    body: req.body,
    params: req.params,
    query: req.query,
    ip: req.ip,
    user: (req as any).user // Caso você implemente autenticação
  });
  next(err);
};

// Middleware para logging de operações de banco de dados (pode ser implementado conforme necessário)
export const dbLogger = {
  log: (message: string) => logger.debug(`[DB] ${message}`),
  error: (message: string, error?: any) => logger.error(`[DB] ${message}`, { error }),
  warn: (message: string) => logger.warn(`[DB] ${message}`),
  info: (message: string) => logger.info(`[DB] ${message}`),
};