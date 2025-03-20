import NodeCache from 'node-cache';
import { logger } from '../middleware/logger.middleware';

/**
 * Serviço para gerenciar cache em memória
 */
class CacheService {
  private cache: NodeCache;
  private defaultTtl: number;

  /**
   * Inicializa o serviço de cache
   * @param defaultTtl Tempo padrão de vida dos itens em cache (em segundos)
   */
  constructor(defaultTtl = 600) {
    this.defaultTtl = defaultTtl;
    this.cache = new NodeCache({
      stdTTL: defaultTtl,
      checkperiod: 120, // Verifica itens expirados a cada 2 minutos
      useClones: false, // Não clonar objetos para melhor performance
    });

    logger.info(`Serviço de cache inicializado com TTL padrão de ${defaultTtl}s`);

    // Listener para eventos de expiração
    this.cache.on('expired', (key, value) => {
      logger.debug(`Cache expirado para chave: ${key}`);
    });
  }

  /**
   * Obtém um valor do cache
   * @param key Chave do item
   * @returns Valor armazenado ou undefined se não encontrado
   */
  async get<T>(key: string): Promise<T | undefined> {
    const value = this.cache.get<T>(key);
    return value;
  }

  /**
   * Armazena um valor no cache
   * @param key Chave do item
   * @param value Valor a ser armazenado
   * @param ttl Tempo de vida personalizado (em segundos)
   * @returns true se o item foi armazenado com sucesso
   */
  async set<T>(key: string, value: T, ttl = this.defaultTtl): Promise<boolean> {
    return this.cache.set(key, value, ttl);
  }

  /**
   * Obtém um valor do cache ou executa uma função para obtê-lo
   * @param key Chave do item
   * @param fn Função que retorna o valor caso não esteja em cache
   * @param ttl Tempo de vida personalizado (em segundos)
   * @returns Valor armazenado ou obtido pela função
   */
  async getOrSet<T>(key: string, fn: () => Promise<T>, ttl = this.defaultTtl): Promise<T> {
    const cachedValue = await this.get<T>(key);

    if (cachedValue !== undefined) {
      return cachedValue;
    }

    const value = await fn();
    await this.set(key, value, ttl);
    return value;
  }

  /**
   * Remove um item do cache
   * @param key Chave do item
   * @returns 1 se removido, 0 se não encontrado
   */
  async del(key: string): Promise<number> {
    return this.cache.del(key);
  }

  /**
   * Remove todos os itens do cache
   * @returns Número de itens removidos
   */
  async flush(): Promise<void> {
    this.cache.flushAll();
    logger.info('Cache limpo completamente');
  }

  /**
   * Obtém estatísticas do cache
   * @returns Estatísticas do cache
   */
  getStats() {
    return this.cache.getStats();
  }
}

// Exporta uma instância única do serviço de cache
export const cacheService = new CacheService();