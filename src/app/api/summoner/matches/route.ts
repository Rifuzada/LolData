import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { z } from "zod";
import {
  AMERICAS_API_URL,
  EUROPE_API_URL,
  ASIA_API_URL,
  SEA_API_URL,
} from "@/app/utils/helpers";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const matchesSchema = z.object({
  region: z.string().min(1),
  puuid: z.string().min(20),
  queueId: z.string().default("").transform(Number),
  start: z.number().default(0),
  count: z.number().default(20),
  championId: z.string().optional(),
  championName: z.string().optional(),
});

const matchCache = new Map<string, { data: any; expires: number }>();
const L1_TTL = 2 * 60 * 1000;
const L2_TTL_MINUTES = 30;
const MAX_RIOT_OFFSET = 200;

// Raised from 4 → 10: ~2.5x more concurrent detail fetches per page.
// Riot's app-rate-limit is 500/10s on dev keys and higher on prod — 10 is safe.
const DETAIL_BATCH_SIZE = 10;

async function fetchInBatches<T>(
  tasks: (() => Promise<T>)[],
  batchSize: number,
): Promise<T[]> {
  const results: T[] = [];
  for (let i = 0; i < tasks.length; i += batchSize) {
    const batch = tasks.slice(i, i + batchSize).map((fn) => fn());
    results.push(...(await Promise.all(batch)));
    if (i + batchSize < tasks.length)
      await new Promise((res) => setTimeout(res, 150));
  }
  return results;
}

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

function getRegionalUrl(region: string): string {
  const r = region.toLowerCase();
  if (["euw1", "eun1", "ru", "tr1", "me1"].some((k) => r.includes(k)))
    return EUROPE_API_URL;
  if (["jp1", "kr"].some((k) => r.includes(k))) return ASIA_API_URL;
  if (["oc1", "tw2", "vn2", "sg2"].some((k) => r.includes(k)))
    return SEA_API_URL;
  return AMERICAS_API_URL;
}

async function getFromSupabase(cacheKey: string): Promise<any | null> {
  try {
    const { data } = await supabaseAdmin
      .from("match_cache")
      .select("data, cached_at")
      .eq("id", cacheKey)
      .maybeSingle();

    if (!data) return null;

    const ageMinutes =
      (Date.now() - new Date(data.cached_at).getTime()) / 60000;

    if (ageMinutes > L2_TTL_MINUTES) return null;

    return data.data;
  } catch {
    return null;
  }
}

async function saveToSupabase(
  cacheKey: string,
  value: any,
  gameName?: string,
  tagLine?: string,
): Promise<void> {
  await supabaseAdmin.from("match_cache").upsert({
    id: cacheKey,
    data: value,
    cached_at: new Date().toISOString(),
    game_name: gameName || null,
    tagline: tagLine || null,
  });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const region = searchParams.get("region");
    const puuid = searchParams.get("puuid");
    const start = Number(searchParams.get("start") || "0");
    const count = Number(searchParams.get("count") || "20");
    const queueId = searchParams.get("queueId") || "";
    const championName = searchParams.get("championName") || "";
    const championId = searchParams.get("championId") || "";
    const gameName = searchParams.get("gameName") || "";
    const tagLine = searchParams.get("tagLine") || "";

    const championKey = (championName || championId).toLowerCase();
    const isFilteringByChampion = !!championKey && championKey !== "all";

    const baseCacheKey = `matches:${region}:${puuid}:${queueId || "all"}:all`;
    const cacheKey = isFilteringByChampion
      ? `matches:${region}:${puuid}:${queueId || "all"}:${championKey}`
      : baseCacheKey;

    const now = Date.now();

    // ================= L1 CACHE (in-memory) =================
    const l1 = matchCache.get(cacheKey);
    if (l1 && l1.expires > now) {
      return NextResponse.json({
        data: l1.data,
        cache: "L1_HIT",
        hasMore: true,
      });
    }

    // ================= L2 CACHE (Supabase) =================
    const supabaseCached = await getFromSupabase(cacheKey);

    let existingMatches: any[] = [];
    let riotOffset = 0;

    if (supabaseCached) {
      existingMatches = supabaseCached.matches || [];
      riotOffset = supabaseCached.riotOffset ?? existingMatches.length;
    }

    // ================= FULL CACHE HIT =================
    if (existingMatches.length >= start + count) {
      const paginated = existingMatches.slice(start, start + count);
      matchCache.set(cacheKey, { data: paginated, expires: now + L1_TTL });
      return NextResponse.json({
        data: paginated,
        cache: "FULL_CACHE",
        hasMore: true,
      });
    }

    // ================= FETCH RIOT =================
    const validatedData = matchesSchema.parse({
      region,
      puuid,
      start,
      queueId,
      count,
      championId,
      championName,
    });

    const { RIOT_API_KEY } = process.env;
    if (!RIOT_API_KEY) {
      return NextResponse.json(
        { error: "API key not configured" },
        { status: 500 },
      );
    }

    const detailsApiUrl = getRegionalUrl(validatedData.region);

    // When filtering by champion we ask Riot for larger pages to find enough
    // matches, but we already pass the queueId so Riot pre-filters server-side,
    // meaning far fewer irrelevant IDs come back.
    const PAGE_SIZE = isFilteringByChampion ? 100 : count;
    const MAX_PAGES = isFilteringByChampion ? 5 : 1;

    let collectedMatches: any[] = [];
    let currentStart = riotOffset;
    let hitOffsetLimit = false;

    for (let page = 0; page < MAX_PAGES; page++) {
      if (currentStart >= MAX_RIOT_OFFSET) {
        hitOffsetLimit = true;
        break;
      }

      const matchIdsUrl = new URL(
        `${detailsApiUrl}/lol/match/v5/matches/by-puuid/${validatedData.puuid}/ids`,
      );

      matchIdsUrl.searchParams.set("start", String(currentStart));
      matchIdsUrl.searchParams.set("count", String(PAGE_SIZE));

      // Key optimisation: pass queue to Riot so it pre-filters server-side.
      // This reduces the number of match IDs (and therefore detail fetches)
      // dramatically when the player has mixed-queue history.
      if (queueId) {
        matchIdsUrl.searchParams.set("queue", String(queueId));
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

      const matchIdsRaw = await matchIdsResponse.json();

      if (!Array.isArray(matchIdsRaw) || matchIdsRaw.length === 0) break;

      const matchIds: string[] = matchIdsRaw;

      // Only fetch details for IDs we haven't cached already.
      const existingIds = new Set(
        existingMatches.map((m: any) => m.metadata?.matchId),
      );
      const newMatchIds = matchIds.filter((id) => !existingIds.has(id));

      if (newMatchIds.length > 0) {
        const matchDetailsPromises = newMatchIds.map(
          (matchId: string) => () =>
            safeFetch(`${detailsApiUrl}/lol/match/v5/matches/${matchId}`, {
              headers: { "X-Riot-Token": RIOT_API_KEY },
            }).then((res) => res.json()),
        );

        // Raised to 10 concurrent requests (was 4) — ~2.5x faster per page.
        const matchDetailsRaw = await fetchInBatches(
          matchDetailsPromises,
          DETAIL_BATCH_SIZE,
        );

        const matchDetails = matchDetailsRaw.filter(
          (m: any) => m?.metadata?.matchId && m?.info?.participants,
        );

        const filtered = matchDetails.filter((match: any) => {
          const participant = match.info?.participants?.find(
            (p: any) => p.puuid === validatedData.puuid,
          );
          if (!participant) return false;
          if (!isFilteringByChampion) return true;
          return participant.championName?.toLowerCase() === championKey;
        });

        collectedMatches.push(...filtered);
      }

      currentStart += matchIds.length;

      // Early exit: no need to fetch more pages if we already have enough.
      if (collectedMatches.length >= count) break;
      if (matchIds.length < PAGE_SIZE) break;
    }

    // ================= MERGE =================
    const mergedMatches = [...existingMatches, ...collectedMatches].filter(
      (match, index, self) =>
        index ===
        self.findIndex((m) => m.metadata.matchId === match.metadata.matchId),
    );

    mergedMatches.sort((a, b) => b.info.gameCreation - a.info.gameCreation);

    const finalMatches = mergedMatches.slice(start, start + count);

    // hasMore: false when Riot's 200-offset ceiling was hit AND we still don't
    // have enough — lets the client stop retrying immediately.
    const hasMore = !(hitOffsetLimit && mergedMatches.length < start + count);

    // ================= SAVE =================
    // Fire-and-forget — don't await the write on the critical path.
    saveToSupabase(
      cacheKey,
      { matches: mergedMatches, riotOffset: currentStart },
      gameName,
      tagLine,
    ).catch(() => {});

    matchCache.set(cacheKey, { data: finalMatches, expires: now + L1_TTL });

    return NextResponse.json({
      data: finalMatches,
      cache: "MISS_UPDATE",
      hasMore,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request parameters" },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
