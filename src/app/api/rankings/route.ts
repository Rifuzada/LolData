import { NextResponse, NextRequest } from "next/server";
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

  // Minimum counts to enforce for tiers when computing cutoffs
  const PAGE_SIZE = 100; // must match frontend itemsPerPage

  try {
    const [challenger, grandmaster, master] = await Promise.all([
      fetchLeague(region, queueType, "challenger"),
      fetchLeague(region, queueType, "grandmaster"),
      fetchLeague(region, queueType, "master"),
    ]);

  // Keep per-tier arrays (make sure to sort them by LP desc — Riot may not guarantee order)
  const challengerEntries = (Array.isArray(challenger.entries) ? challenger.entries : []).slice().sort((a: any, b: any) => b.leaguePoints - a.leaguePoints);
  const grandmasterEntries = (Array.isArray(grandmaster.entries) ? grandmaster.entries : []).slice().sort((a: any, b: any) => b.leaguePoints - a.leaguePoints);
  const masterEntries = (Array.isArray(master.entries) ? master.entries : []).slice().sort((a: any, b: any) => b.leaguePoints - a.leaguePoints);

    // Combined and globally sorted list
    const allEntries = [
      ...challengerEntries,
      ...grandmasterEntries,
      ...masterEntries,
    ].sort((a, b) => b.leaguePoints - a.leaguePoints);

    // Determine region-specific mode: pages-based or default
    const regionsUsingThreePages = new Set(['KR', 'NA1', 'EUW1', 'VN2']);
    const normalizedRegion = region.toUpperCase();
    const regionMode = regionsUsingThreePages.has(normalizedRegion) ? 'three-pages' : 'two-pages';

    // For three-pages mode: challenger covers pages 1..3 (PAGE_SIZE * 3)
    // For two-pages mode: challenger covers pages 1..2 (PAGE_SIZE * 2)
    const challengerPageLimit = regionMode === 'three-pages' ? (PAGE_SIZE * 3) : (PAGE_SIZE * 2);

    // Compute cutoff as the LP at the combined global index = challengerPageLimit
    const getLPAtGlobalIndex = (idx: number) => {
      if (allEntries.length >= idx) return allEntries[idx - 1].leaguePoints || 0;
      // fallback to last challenger LP if index not available
      return challengerEntries.length ? challengerEntries[challengerEntries.length - 1].leaguePoints || 0 : (allEntries.length ? allEntries[allEntries.length - 1].leaguePoints || 0 : 0);
    };

    // Calculate cutoffs differently based on region mode
    let challengerCutoffLP = 0;
    let grandmasterCutoffLP = 0;

    if (regionMode === 'three-pages') {
      // KR, NA, EUW, VN: use position-based cutoffs (at 300)
      // Get LP at position 300 from combined allEntries (more accurate than using only challenger tier)
      if (allEntries.length >= 300) {
        challengerCutoffLP = allEntries[299].leaguePoints;  // index 299 = position 300
      } else if (allEntries.length > 0) {
        // If less than 300 total players, use last available LP
        challengerCutoffLP = allEntries[allEntries.length - 1].leaguePoints;
      }
    } else {
      // Other regions: use actual challenger tier entries
      // Use position 200 if available
      if (challengerEntries.length >= 200) {
        challengerCutoffLP = challengerEntries[199].leaguePoints || 0;  // index 199 = position 200
      } else if (challengerEntries.length > 0) {
        challengerCutoffLP = challengerEntries[challengerEntries.length - 1].leaguePoints || 0;
      }
    }

    // Grandmaster cutoff calculation
    if (regionMode === 'three-pages') {
      // KR, NA, EUW, VN: GM starts after position 300
      // Get players between positions 301-800 who are in GM
      const gmStartIndex = 300;  // after first 300 challengers
      const relevantGMs = grandmasterEntries.filter((entry: { puuid: string; leaguePoints: number }) => {
        // Find this entry's position in the global list
        const globalIndex = allEntries.findIndex(e => e.puuid === entry.puuid);
        // Keep only GMs that are after position 300 but in the first 800 players
        return globalIndex >= gmStartIndex && globalIndex < 1000;
      });
      
      if (relevantGMs.length > 0) {
        // Use the lowest LP among the relevant GMs
        grandmasterCutoffLP = relevantGMs[relevantGMs.length - 1].leaguePoints;
      } else if (grandmasterEntries.length > 0) {
        // Fallback to lowest GM LP if we couldn't filter properly
        grandmasterCutoffLP = grandmasterEntries[grandmasterEntries.length - 1].leaguePoints;
      }
    } else {
      // Other regions: Simply use the lowest LP in GM tier
      if (grandmasterEntries.length > 0) {
        grandmasterCutoffLP = grandmasterEntries[grandmasterEntries.length - 1].leaguePoints;
      }
    }
    
    // Ensure we have a valid number, default to 0 if all else fails
    grandmasterCutoffLP = grandmasterCutoffLP || 0;

    // 🔥 Apply minimum cutoff values
    // Challenger must be at least 500 LP
    challengerCutoffLP = Math.max(challengerCutoffLP, 500);
    // Grandmaster must be at least 200 LP
    grandmasterCutoffLP = Math.max(grandmasterCutoffLP, 200);

    const sampleLP = (entries: any[]) => ({
      top: entries.length ? entries[0].leaguePoints || 0 : null,
      at200: entries.length >= 200 ? entries[199].leaguePoints || 0 : null,
      at300: entries.length >= 300 ? entries[299].leaguePoints || 0 : null,
      at500: entries.length >= 500 ? entries[499].leaguePoints || 0 : null,
      last: entries.length ? entries[entries.length - 1].leaguePoints || 0 : null,
      count: entries.length,
    });

    const cutoffs = {
      challenger: {
        actualCount: challengerEntries.length,
        pageLimit: challengerPageLimit,
        cutoffLP: challengerCutoffLP,
        sample: sampleLP(challengerEntries),
      },
      grandmaster: {
        actualCount: grandmasterEntries.length,
        pageLimit: (regionMode === 'three-pages' ? 300 : 200) + 700, // GM extends ~700 players after challenger section
        cutoffLP: grandmasterCutoffLP,
        sample: sampleLP(grandmasterEntries),
      },
      master: {
        actualCount: masterEntries.length,
        cutoffLP: masterEntries.length ? masterEntries[masterEntries.length - 1].leaguePoints || 0 : 0,
        sample: sampleLP(masterEntries),
      },
    };

    const payload = {
      allEntries,
      challengerEntries,
      grandmasterEntries,
      masterEntries,
      cutoffs,
    };

    cache.set(cacheKey, {
      data: payload,
      timestamp: now,
      region,
      queueType,
    });

    const finalPayload = {
      ...payload,
      regionMode,
    };

    return finalPayload;
  } catch (error) {
    if (cachedEntry) {
      return cachedEntry.data;
    }
    throw error;
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const region = searchParams.get("region");
    const queueType = searchParams.get("queueType") || "RANKED_SOLO_5x5";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "500");

    if (!region) {
      return NextResponse.json({ error: "Missing region" }, { status: 400 });
    }

  const data = await getAllRankings(region, queueType);

  // `data` may be the new payload shape or the old array shape (from cache) - normalize to `allEntries`
  const allEntries = Array.isArray(data) ? data : data.allEntries;

  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedEntries = allEntries.slice(startIndex, endIndex);

  const cacheKey = `rankings:${region}-${queueType}`;
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
      cutoffs: !Array.isArray(data) ? data.cutoffs : undefined,
      counts: !Array.isArray(data)
        ? {
            challenger: data.challengerEntries.length,
            grandmaster: data.grandmasterEntries.length,
            master: data.masterEntries.length,
          }
        : undefined,
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
