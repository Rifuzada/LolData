import { NextResponse, NextRequest } from "next/server";

export const dynamic = "force-dynamic";
import {
  CACHE_TTL,
  CacheEntry,
  cleanExpiredCache,
  getCacheStatus,
} from "@/lib/cache";

const RIOT_API_KEY = process.env.RIOT_API_KEY;

// In-memory cache
const cache = new Map<string, CacheEntry>();

async function fetchLeague(
  region: string,
  queueType: string,
  tier: "challenger" | "grandmaster" | "master",
) {
  if (!RIOT_API_KEY) {
    throw new Error("RIOT_API_KEY not configured on the server");
  }

  const url = `https://${region}.api.riotgames.com/lol/league/v4/${tier}leagues/by-queue/${queueType}?api_key=${RIOT_API_KEY}`;
  const res = await fetch(url);

  if (!res.ok) {
    let detail = "";
    try {
      const body = await res.json();
      if (body?.status?.message) detail = ` - ${body.status.message}`;
    } catch {
      // ignore JSON parse errors
    }

    if (res.status === 401) {
      throw new Error(
        `Riot API unauthorized (401). Check RIOT_API_KEY is valid and configured.${detail}`,
      );
    }
    if (res.status === 429) {
      throw new Error(
        `Riot API rate limit (429). Consider retrying later.${detail}`,
      );
    }

    throw new Error(`Error fetching ${tier}: ${res.status}${detail}`);
  }

  return res.json();
}

async function getAllRankings(region: string, queueType: string) {
  // FIX 1: use a single consistent cache key everywhere
  const cacheKey = `${region}-${queueType}`;
  const now = Date.now();

  const cachedEntry = cache.get(cacheKey);
  if (cachedEntry && now - cachedEntry.timestamp < CACHE_TTL) {
    // FIX 2: cached payload now always includes regionMode (stored below)
    return cachedEntry.data;
  }

  try {
    const [challenger, grandmaster, master] = await Promise.all([
      fetchLeague(region, queueType, "challenger"),
      fetchLeague(region, queueType, "grandmaster"),
      fetchLeague(region, queueType, "master"),
    ]);

    const sort = (entries: any[]) =>
      (Array.isArray(entries) ? entries : [])
        .slice()
        .sort((a: any, b: any) => b.leaguePoints - a.leaguePoints);

    const challengerEntries = sort(challenger.entries);
    const grandmasterEntries = sort(grandmaster.entries);
    const masterEntries = sort(master.entries);

    const allEntries = [
      ...challengerEntries,
      ...grandmasterEntries,
      ...masterEntries,
    ].sort((a, b) => b.leaguePoints - a.leaguePoints);

    // FIX 3: use actual region codes as returned by Riot (e.g. "NA1", "EUW1")
    // PAGE_SIZE constant removed — cutoff positions are fixed at 300 / 200, not derived from page size
    const regionsUsingThreePages = new Set(["KR", "NA1", "EUW1", "VN2"]);
    const regionMode = regionsUsingThreePages.has(region.toUpperCase())
      ? "three-pages"
      : "two-pages";

    // Challenger cutoff: position 300 for three-pages regions, 200 for others
    const challengerCutoffPosition = regionMode === "three-pages" ? 300 : 200;

    let challengerCutoffLP = 0;
    if (allEntries.length >= challengerCutoffPosition) {
      challengerCutoffLP =
        allEntries[challengerCutoffPosition - 1].leaguePoints;
    } else if (allEntries.length > 0) {
      challengerCutoffLP = allEntries[allEntries.length - 1].leaguePoints;
    }

    // Grandmaster cutoff: lowest LP among GM players ranked after the challenger block
    let grandmasterCutoffLP = 0;
    if (regionMode === "three-pages") {
      // Build a fast lookup for global index by puuid
      const globalIndexByPuuid = new Map<string, number>(
        allEntries.map((e, i) => [e.puuid, i]),
      );

      const relevantGMs = grandmasterEntries.filter((entry: any) => {
        const idx = globalIndexByPuuid.get(entry.puuid) ?? -1;
        // GM window: after the 300-player challenger block, up to position 1000
        return idx >= challengerCutoffPosition && idx < 1000;
      });

      grandmasterCutoffLP =
        relevantGMs.length > 0
          ? relevantGMs[relevantGMs.length - 1].leaguePoints
          : grandmasterEntries.length > 0
            ? grandmasterEntries[grandmasterEntries.length - 1].leaguePoints
            : 0;
    } else {
      grandmasterCutoffLP =
        grandmasterEntries.length > 0
          ? grandmasterEntries[grandmasterEntries.length - 1].leaguePoints
          : 0;
    }

    // Apply minimum floors
    challengerCutoffLP = Math.max(challengerCutoffLP, 500);
    grandmasterCutoffLP = Math.max(grandmasterCutoffLP, 200);

    const sampleLP = (entries: any[]) => ({
      top: entries.length ? (entries[0].leaguePoints ?? 0) : null,
      at200: entries.length >= 200 ? (entries[199].leaguePoints ?? 0) : null,
      at300: entries.length >= 300 ? (entries[299].leaguePoints ?? 0) : null,
      at500: entries.length >= 500 ? (entries[499].leaguePoints ?? 0) : null,
      last: entries.length
        ? (entries[entries.length - 1].leaguePoints ?? 0)
        : null,
      count: entries.length,
    });

    const cutoffs = {
      challenger: {
        actualCount: challengerEntries.length,
        cutoffPosition: challengerCutoffPosition,
        cutoffLP: challengerCutoffLP,
        sample: sampleLP(challengerEntries),
      },
      grandmaster: {
        actualCount: grandmasterEntries.length,
        cutoffLP: grandmasterCutoffLP,
        sample: sampleLP(grandmasterEntries),
      },
      master: {
        actualCount: masterEntries.length,
        cutoffLP: masterEntries.length
          ? (masterEntries[masterEntries.length - 1].leaguePoints ?? 0)
          : 0,
        sample: sampleLP(masterEntries),
      },
    };

    // FIX 2: include regionMode in the cached payload so cache hits return it too
    const payload = {
      allEntries,
      challengerEntries,
      grandmasterEntries,
      masterEntries,
      cutoffs,
      regionMode,
    };

    cache.set(cacheKey, {
      data: payload,
      timestamp: now,
      region,
      queueType,
    });

    return payload;
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

    if (!RIOT_API_KEY) {
      return NextResponse.json(
        { error: "RIOT_API_KEY not configured on server" },
        { status: 500 },
      );
    }

    const data = await getAllRankings(region, queueType);

    const allEntries = Array.isArray(data) ? data : data.allEntries;

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedEntries = allEntries.slice(startIndex, endIndex);

    // FIX 1: use the same key format as getAllRankings
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
      cutoffs: !Array.isArray(data) ? data.cutoffs : undefined,
      regionMode: !Array.isArray(data) ? data.regionMode : undefined,
      counts: !Array.isArray(data)
        ? {
            challenger: data.challengerEntries.length,
            grandmaster: data.grandmasterEntries.length,
            master: data.masterEntries.length,
          }
        : undefined,
      cache: {
        isFromCache: cacheAge > 0 && cacheAge < CACHE_TTL,
        ageInMinutes: Math.floor(cacheAge / (1000 * 60)),
        expiresInMinutes: Math.floor((CACHE_TTL - cacheAge) / (1000 * 60)),
        status: getCacheStatus(cache),
      },
    };

    cleanExpiredCache(cache);

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error in /api/rankings:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch rankings",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
