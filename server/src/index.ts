import express, { Express, Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import config from './config/config';
import { httpLogger, errorLogger, logger } from './middleware/logger.middleware';
import {
  zodErrorHandler,
  appErrorHandler,
  jsonSyntaxErrorHandler,
  unknownErrorHandler,
  notFoundHandler
} from './middleware/error.middleware';
import { ApiResponseUtils } from './utils/response.utils';
import summonerRoutes from './routes/summoner.routes';

/**
 * Classe principal que encapsula o servidor Express
 */
class Server {
  private app: Express;
  private server: any;
  private port: number;

  /**
   * Inicializa o servidor Express
   */
  constructor() {
    this.app = express();
    this.port = Number(config.server.port);
    this.configureMiddlewares();
    this.configureRoutes();
    this.configureErrorHandling();
  }

  /**
   * Configura os middlewares do Express
   */
  private configureMiddlewares(): void {
    // Segurança
    this.app.use(helmet());

    // CORS
    this.app.use(cors({
      origin: config.cors.origin,
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }));

    // Compressão
    this.app.use(compression());

    // Parsing de requisições
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Logging
    this.app.use(httpLogger);
  }

  /**
   * Configura as rotas da API
   */
  private configureRoutes(): void {
    // Rota de verificação de saúde (health check)
    this.app.get('/health', (req: Request, res: Response) => {
      const healthData = {
        status: 'UP',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: config.server.env,
      };

      ApiResponseUtils.success(res, healthData);
    });

    // Rotas da API
    this.app.use('/api/summoner', summonerRoutes);

    // Handler para rotas não encontradas - precisa estar após todas as outras rotas
    this.app.use('*', (req: Request, res: Response) => {
      notFoundHandler(req, res);
    });
  }

  /**
   * Configura os handlers de erro
   */
  private configureErrorHandling(): void {
    // Middlewares para tratamento de erros (devem ser registrados após as rotas)
    this.app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
      errorLogger(err, req, res, next);
    });

    this.app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
      zodErrorHandler(err, req, res, next);
    });

    this.app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
      appErrorHandler(err, req, res, next);
    });

    this.app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
      jsonSyntaxErrorHandler(err, req, res, next);
    });

    this.app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
      unknownErrorHandler(err, req, res, next);
    });
  }

  /**
   * Inicia o servidor na porta configurada
   */
  public start(): void {
    this.server = this.app.listen(this.port, () => {
      logger.info(`🚀 Servidor iniciado na porta ${this.port} em modo ${config.server.env}`);
      logger.info(`📝 API endpoint: http://localhost:${this.port}/api`);
      logger.info(`🔍 Health check: http://localhost:${this.port}/health`);
    });

    // Configurar tratamento de erros não capturados
    this.setupGracefulShutdown();
  }

  /**
   * Configura o tratamento de erros não capturados e desligamento gracioso
   */
  private setupGracefulShutdown(): void {
    // Tratamento de exceções não capturadas
    process.on('uncaughtException', (error) => {
      logger.error('Exceção não capturada', error);
      process.exit(1);
    });

    // Tratamento de rejeições de promises não tratadas
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Rejeição não tratada', { reason, promise });
    });

    // Desligamento gracioso
    const shutdown = () => {
      logger.info('Recebido sinal de desligamento');

      // Aqui você pode adicionar lógica para fechar conexões de banco de dados, etc.
      if (this.server) {
        this.server.close(() => {
          logger.info('Servidor desligado com sucesso');
          process.exit(0);
        });
      } else {
        process.exit(0);
      }
    };

    // Sinais para encerramento gracioso
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  }
}

// Instancia e inicia o servidor
const server = new Server();
server.start();