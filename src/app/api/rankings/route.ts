import { NextResponse } from "next/server";
import { CACHE_TTL, CacheEntry, cleanExpiredCache, getCacheStatus } from "@/lib/cache";

const RIOT_API_KEY = process.env.RIOT_API_KEY;

// Cache em memória
const cache = new Map<string, CacheEntry>();

async function fetchLeague(
  region: string,
  queueType: string,
  tier: "challenger" | "grandmaster" | "master"
) {
  const url = `https://${region}.api.riotgames.com/lol/league/v4/${tier}leagues/by-queue/${queueType}?api_key=${RIOT_API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Erro ao buscar ${tier}: ${res.status}`);
  return res.json();
}

async function getAllRankings(region: string, queueType: string) {
  const cacheKey = `${region}-${queueType}`;
  const now = Date.now();

  const cachedEntry = cache.get(cacheKey);
  if (cachedEntry && now - cachedEntry.timestamp < CACHE_TTL) {
    return cachedEntry.data;
  }


  try {
    const [challenger, grandmaster, master] = await Promise.all([
      fetchLeague(region, queueType, "challenger"),
      fetchLeague(region, queueType, "grandmaster"),
      fetchLeague(region, queueType, "master"),
    ]);

    const allEntries = [
      ...challenger.entries,
      ...grandmaster.entries,
      ...master.entries,
    ].sort((a, b) => b.leaguePoints - a.leaguePoints);

    cache.set(cacheKey, {
      data: allEntries,
      timestamp: now,
      region,
      queueType,
    });


    return allEntries;
  } catch (error) {
    if (cachedEntry) {
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

    const allEntries = await getAllRankings(region, queueType);

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedEntries = allEntries.slice(startIndex, endIndex);

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
        hasPreviousPage: page > 1,
      },
      cache: {
        isFromCache: cacheAge < CACHE_TTL,
        ageInMinutes: Math.floor(cacheAge / (1000 * 60)),
        expiresInMinutes: Math.floor((CACHE_TTL - cacheAge) / (1000 * 60)),
        status: getCacheStatus(cache), // 👈 debug opcional
      },
    };

    // Opcional: limpeza automática de caches expirados
    cleanExpiredCache(cache);

    return NextResponse.json(response);
  } catch (error) {
    console.error("Erro no endpoint /api/rankings:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch rankings",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
