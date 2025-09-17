import { NextResponse } from "next/server";

const RIOT_API_KEY = process.env.RIOT_API_KEY;

// Cache em memória
interface CacheEntry {
  data: any[];
  timestamp: number;
  region: string;
  queueType: string;
}

// Cache com TTL de 10 minutos (600000ms)
const CACHE_TTL = 10 * 60 * 1000;
const cache = new Map<string, CacheEntry>();

async function fetchLeague(region: string, queueType: string, tier: "challenger" | "grandmaster" | "master") {
  const url = `https://${region}.api.riotgames.com/lol/league/v4/${tier}leagues/by-queue/${queueType}?api_key=${RIOT_API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Erro ao buscar ${tier}: ${res.status}`);
  return res.json();
}

async function getAllRankings(region: string, queueType: string) {
  const cacheKey = `${region}-${queueType}`;
  const now = Date.now();
  
  // Verificar se existe cache válido
  const cachedEntry = cache.get(cacheKey);
  if (cachedEntry && (now - cachedEntry.timestamp) < CACHE_TTL) {
    console.log(`Cache hit para ${cacheKey}`);
    return cachedEntry.data;
  }

  console.log(`Cache miss ou expirado para ${cacheKey}, fazendo requests...`);

  try {
    // Buscar todos os dados de uma vez
    const [challenger, grandmaster, master] = await Promise.all([
      fetchLeague(region, queueType, "challenger"),
      fetchLeague(region, queueType, "grandmaster"),
      fetchLeague(region, queueType, "master"),
    ]);

    // Unir e ordenar por LP
    const allEntries = [
      ...challenger.entries,
      ...grandmaster.entries,
      ...master.entries,
    ].sort((a, b) => b.leaguePoints - a.leaguePoints);

    // Salvar no cache
    cache.set(cacheKey, {
      data: allEntries,
      timestamp: now,
      region,
      queueType
    });

    console.log(`Dados salvos no cache para ${cacheKey}. Total de entradas: ${allEntries.length}`);
    return allEntries;

  } catch (error) {
    // Se houver erro e existir cache expirado, usar dados antigos
    if (cachedEntry) {
      console.log(`Erro na API, usando cache expirado para ${cacheKey}`);
      return cachedEntry.data;
    }
    throw error;
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const region = searchParams.get("region");
    const queueType = searchParams.get("queueType") || "RANKED_SOLO_5x5";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "500");

    if (!region) {
      return NextResponse.json({ error: "Missing region" }, { status: 400 });
    }

    // Buscar dados (do cache ou API)
    const allEntries = await getAllRankings(region, queueType);

    // Calcular paginação
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedEntries = allEntries.slice(startIndex, endIndex);

    // Informações do cache
    const cacheKey = `${region}-${queueType}`;
    const cachedEntry = cache.get(cacheKey);
    const cacheAge = cachedEntry ? Date.now() - cachedEntry.timestamp : 0;

    const response = {
      tier: "CHALLENGER+GM+MASTER",
      queue: queueType,
      name: `${region} Combined Leaderboard`,
      entries: paginatedEntries,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(allEntries.length / limit),
        totalEntries: allEntries.length,
        entriesPerPage: limit,
        hasNextPage: endIndex < allEntries.length,
        hasPreviousPage: page > 1
      },
      cache: {
        isFromCache: cacheAge < CACHE_TTL,
        ageInMinutes: Math.floor(cacheAge / (1000 * 60)),
        expiresInMinutes: Math.floor((CACHE_TTL - cacheAge) / (1000 * 60))
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Erro no endpoint /api/rankings:", error);
    return NextResponse.json({ 
      error: "Failed to fetch rankings",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}

// Função para limpar cache expirado periodicamente (opcional)
export function cleanExpiredCache() {
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    if (now - entry.timestamp > CACHE_TTL) {
      cache.delete(key);
      console.log(`Cache expirado removido: ${key}`);
    }
  }
}

// Função para verificar status do cache (útil para debugging)
export function getCacheStatus() {
  const status = Array.from(cache.entries()).map(([key, entry]) => ({
    key,
    entriesCount: entry.data.length,
    ageInMinutes: Math.floor((Date.now() - entry.timestamp) / (1000 * 60)),
    isExpired: (Date.now() - entry.timestamp) > CACHE_TTL
  }));
  
  return {
    totalCacheEntries: cache.size,
    entries: status
  };
}
