// src/lib/cache.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface CacheEntry {
  key: string;
  value: any;
  expires_at: string;
}

export async function getCached<T>(key: string): Promise<T | null> {
  const { data, error } = await supabase
    .from('cache')
    .select('value')
    .eq('key', key)
    .gte('expires_at', new Date().toISOString())
    .maybeSingle();

  if (error || !data) return null;
  return data.value as T;
}

export async function setCached<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
  const expires_at = new Date(Date.now() + ttlSeconds * 1000).toISOString();
  await supabase
    .from('cache')
    .upsert({ key, value, expires_at }, { onConflict: 'key' });
}

// Função específica para rankings (já com TTL definido)
const RANKING_TTL = 120; // 2 minutos (use 60 se quiser mais fresco)
export async function getCachedRanking(key: string) {
  return getCached<any>(`ranking:${key}`);
}

export async function setCachedRanking(key: string, data: any) {
  return setCached(`ranking:${key}`, data, RANKING_TTL);
}