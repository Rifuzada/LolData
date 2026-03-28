import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { z } from "zod";
import {
  AMERICAS_API_URL,
  EUROPE_API_URL,
  ASIA_API_URL,
  SEA_API_URL,
} from "@/app/utils/helpers";

const matchesSchema = z.object({
  region: z.string().min(1),
  puuid: z.string().min(10),
  start: z
    .string()
    .transform((val) => Number(val || 0))
    .default("0"),
  count: z
    .string()
    .transform((val) => Number(val || 20))
    .default("20"),
  queueId: z.string().optional(),
  championId: z.string().optional(),
});

const matchCache = new Map<string, { data: any; expires: number }>();
const CACHE_TTL = 2 * 60 * 1000; // 2 minutes

// Utility to limit concurrency
async function fetchInBatches<T>(
  tasks: (() => Promise<T>)[],
  batchSize: number,
): Promise<T[]> {
  const results: T[] = [];
  for (let i = 0; i < tasks.length; i += batchSize) {
    const batch = tasks.slice(i, i + batchSize).map((fn) => fn());
    results.push(...(await Promise.all(batch)));
    if (i + batchSize < tasks.length) {
      await new Promise((res) => setTimeout(res, 150));
    }
  }
  return results;
}

// Fetch with retry on 429
async function safeFetch(
  url: string,
  options: RequestInit,
  retries = 3,
): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    const res = await fetch(url, options);
    if (res.status !== 429) return res;
    const retryAfter = Number(res.headers.get("retry-after")) || 1;
    await new Promise((r) => setTimeout(r, retryAfter * 1000));
  }
  return await fetch(url, options);
}

// Resolve the regional routing URL based on region
function getRegionalUrl(region: string): string {
  const r = region.toLowerCase();
  if (["euw1", "eun1", "ru", "tr1", "me1"].some((k) => r.includes(k)))
    return EUROPE_API_URL;
  if (["jp1", "kr"].some((k) => r.includes(k))) return ASIA_API_URL;
  if (["oc1", "tw2", "vn2", "sg2"].some((k) => r.includes(k)))
    return SEA_API_URL;
  return AMERICAS_API_URL;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    const region = searchParams.get("region") || "";
    const puuid = searchParams.get("puuid");
    const start = searchParams.get("start") || "0";
    const count = searchParams.get("count") || "20";
    const queueId = searchParams.get("queueId") || "";
    const championId = searchParams.get("championId") || "";

    const cacheKey = `matchesByQueue:${region}:${puuid}:${queueId}:${championId || "all"}:${start}:${count}`;
    const now = Date.now();

    // Return cached response if still valid
    if (matchCache.has(cacheKey)) {
      const cached = matchCache.get(cacheKey)!;
      if (cached.expires > now) {
        return NextResponse.json({
          data: cached.data,
          meta: { fromCache: true },
        });
      }
      matchCache.delete(cacheKey);
    }

    const validatedData = matchesSchema.parse({
      region,
      puuid,
      start,
      count,
      queueId,
      championId,
    });

    const { RIOT_API_KEY } = process.env;
    if (!RIOT_API_KEY) {
      return NextResponse.json(
        { error: "API key not configured" },
        { status: 500 },
      );
    }

    const apiUrl = getRegionalUrl(region);
    const isFilteringByChampion = !!championId && championId !== "all";
    const targetCount = Number(count);

    // When filtering by champion we paginate until we have enough matching games.
    // Each page fetches 100 IDs (Riot's max) to minimise round-trips.
    const PAGE_SIZE = isFilteringByChampion ? 100 : targetCount;
    const MAX_PAGES = isFilteringByChampion ? 5 : 1; // cap at 500 history lookback

    let collectedMatches: any[] = [];
    let currentStart = validatedData.start;

    for (let page = 0; page < MAX_PAGES; page++) {
      // Build match IDs URL
      const matchIdsUrl = new URL(
        `${apiUrl}/lol/match/v5/matches/by-puuid/${validatedData.puuid}/ids`,
      );
      matchIdsUrl.searchParams.set("start", String(currentStart));
      matchIdsUrl.searchParams.set("count", String(PAGE_SIZE));

      if (queueId && queueId !== "" && queueId !== "all") {
        matchIdsUrl.searchParams.set("queue", queueId);
      }

      const matchIdsResponse = await safeFetch(matchIdsUrl.toString(), {
        headers: { "X-Riot-Token": RIOT_API_KEY },
      });

      if (!matchIdsResponse.ok) {
        const error = await matchIdsResponse.json();
        return NextResponse.json(
          { error: error.status?.message || "Failed to fetch match IDs" },
          { status: matchIdsResponse.status },
        );
      }

      const matchIds: string[] = await matchIdsResponse.json();

      // No more matches available
      if (matchIds.length === 0) break;

      // Fetch full match details for this page
      const matchDetailsPromises = matchIds.map(
        (matchId: string) => () =>
          safeFetch(`${apiUrl}/lol/match/v5/matches/${matchId}`, {
            headers: { "X-Riot-Token": RIOT_API_KEY },
          }).then((res) => res.json()),
      );

      const matchDetails = await fetchInBatches(matchDetailsPromises, 4);

      // Filter by champion — find the participant matching puuid and check championId
      const filtered = isFilteringByChampion
        ? matchDetails.filter((match: any) => {
            const participant = match.info?.participants?.find(
              (p: any) => p.puuid === validatedData.puuid,
            );
            return (
              participant &&
              String(participant.championId) === String(championId)
            );
          })
        : matchDetails;

      collectedMatches.push(...filtered);
      currentStart += matchIds.length;

      // Stop early if we already have enough
      if (collectedMatches.length >= targetCount) break;

      // Riot returned fewer IDs than requested — no more pages
      if (matchIds.length < PAGE_SIZE) break;
    }

    const finalMatches = collectedMatches.slice(0, targetCount);

    // Save to cache
    matchCache.set(cacheKey, {
      data: finalMatches,
      expires: Date.now() + CACHE_TTL,
    });

    return NextResponse.json({
      data: finalMatches,
      meta: {
        requested: targetCount,
        returned: finalMatches.length,
        championFilter: championId || null,
        fromCache: false,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request parameters", details: error.errors },
        { status: 400 },
      );
    }

    console.error("[matchesByQueue API error]", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
