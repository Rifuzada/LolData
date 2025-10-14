// src/lib/cache.ts

export interface CacheEntry {
  data: any; // can be array or object payload
  timestamp: number;
  region: string;
  queueType: string;
}

// TTL padrão de 10 minutos
export const CACHE_TTL = 10 * 60 * 1000;

export function cleanExpiredCache(
  cache: Map<string, CacheEntry>,
  ttl: number = CACHE_TTL
) {
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    if (now - entry.timestamp > ttl) {
      cache.delete(key);
    }
  }
}

export function getCacheStatus(
  cache: Map<string, CacheEntry>,
  ttl: number = CACHE_TTL
) {
  const status = Array.from(cache.entries()).map(([key, entry]) => ({
    key,
    entriesCount: Array.isArray(entry.data) ? entry.data.length : (entry.data?.allEntries ? entry.data.allEntries.length : 0),
    ageInMinutes: Math.floor((Date.now() - entry.timestamp) / (1000 * 60)),
    isExpired: (Date.now() - entry.timestamp) > ttl
  }));

  return {
    totalCacheEntries: cache.size,
    entries: status
  };
}
