// Utilitário de cache otimista para rotas de API (server)
// Uso: import { OptimisticCache } from '@/app/utils/optimisticCacheApi';

type CacheEntry<T> = {
  data: T;
  expires: number;
  promise?: Promise<T>;
};

export class OptimisticCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  constructor(private ttlMs: number = 60_000) {}

  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (entry && entry.expires > Date.now()) {
      return entry.data;
    }
    if (entry) this.cache.delete(key);
    return undefined;
  }

  async getOrFetch(key: string, fetcher: () => Promise<T>, options?: { forceRefresh?: boolean }): Promise<T> {
    const now = Date.now();
    const entry = this.cache.get(key);
    if (!options?.forceRefresh) {
      if (entry && entry.expires > now) {
        return entry.data;
      }
      if (entry?.promise) {
        return entry.promise;
      }
    }
    const promise = fetcher().then(data => {
      this.cache.set(key, { data, expires: now + this.ttlMs });
      return data;
    }).finally(() => {
      const e = this.cache.get(key);
      if (e) delete e.promise;
    });
    this.cache.set(key, { data: entry?.data as T, expires: now + this.ttlMs, promise });
    return promise;
  }

  clear(key?: string) {
    if (key) this.cache.delete(key);
    else this.cache.clear();
  }
}
