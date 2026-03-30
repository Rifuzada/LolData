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
  queueId: z.string().transform(Number),
  start: z.number().default(0),
  count: z.number().default(20),
  championId: z.string().optional(),
});

const matchCache = new Map<string, { data: any; expires: number }>();
const L1_TTL = 2 * 60 * 1000;
const L2_TTL_MINUTES = 30;

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
    const { data, error } = await supabaseAdmin
      .from("match_cache")
      .select("data, cached_at")
      .eq("id", cacheKey)
      .single();

    if (error || !data) return null;

    const ageMinutes =
      (Date.now() - new Date(data.cached_at).getTime()) / 60000;

    if (ageMinutes > L2_TTL_MINUTES) return null;

    return data.data;
  } catch {
    return null;
  }
}

async function saveToSupabase(cacheKey: string, value: any): Promise<void> {
  await supabaseAdmin.from("match_cache").upsert({
    id: cacheKey,
    data: value,
    cached_at: new Date().toISOString(),
  });
}

// Salva cache específico de campeão com riotOffset para saber
// onde parou no histórico total da Riot (independente do filtro)
async function saveChampionCache(
  cacheKey: string,
  matches: any[],
  riotOffset: number,
): Promise<void> {
  await saveToSupabase(cacheKey, {
    matches,
    riotOffset, // posição real no histórico total da Riot
  });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const region = searchParams.get("region");
    const puuid = searchParams.get("puuid");
    const start = Number(searchParams.get("start") || "0");
    const count = Number(searchParams.get("count") || "20");
    const championId = searchParams.get("championId") || "";

    const isFilteringByChampion = !!championId && championId !== "all";

    // Chave base (sem filtro) e chave específica de campeão
    const baseCacheKey = `matches:${region}:${puuid}:all`;
    const cacheKey = isFilteringByChampion
      ? `matches:${region}:${puuid}:${championId}`
      : baseCacheKey;

    const now = Date.now();

    // ================= L2 CACHE (Supabase) =================
    const supabaseCached = await getFromSupabase(cacheKey);

    let existingMatches: any[] = [];
    let riotOffset = 0;

    if (supabaseCached) {
      if (isFilteringByChampion) {
        // cache específico de campeão
        existingMatches = supabaseCached.matches || [];
        riotOffset = supabaseCached.riotOffset ?? 0;
      } else {
        // cache geral (sem filtro)
        existingMatches = supabaseCached.matches || [];
        riotOffset = existingMatches.length; // opcional
      }
    }

    // ================= CACHE COMPLETO =================
    if (existingMatches.length >= start + count) {
      const paginated = existingMatches.slice(start, start + count);

      matchCache.set(cacheKey, { data: paginated, expires: now + L1_TTL });

      return NextResponse.json({ data: paginated, cache: "FULL_CACHE" });
    }

    // ================= FETCH RIOT =================
    const validatedData = matchesSchema.parse({
      region,
      puuid,
      start,
      count,
      championId,
    });

    const { RIOT_API_KEY } = process.env;
    if (!RIOT_API_KEY) {
      return NextResponse.json(
        { error: "API key not configured" },
        { status: 500 },
      );
    }

    const detailsApiUrl = getRegionalUrl(validatedData.region);

    const PAGE_SIZE = isFilteringByChampion ? 100 : count;
    const MAX_PAGES = isFilteringByChampion ? 5 : 1;

    let collectedMatches: any[] = [];

    // Usa riotOffset para continuar de onde parou no histórico total
    // (não usa existingMatches.length, que seria a contagem filtrada)
    let currentStart = riotOffset;

    for (let page = 0; page < MAX_PAGES; page++) {
      const matchIdsUrl = new URL(
        `${detailsApiUrl}/lol/match/v5/matches/by-puuid/${validatedData.puuid}/ids`,
      );

      matchIdsUrl.searchParams.set("queue", String(queueId));
      matchIdsUrl.searchParams.set("start", String(currentStart));
      matchIdsUrl.searchParams.set("count", String(PAGE_SIZE));

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
      if (matchIds.length === 0) break;

      const matchDetailsPromises = matchIds.map(
        (matchId: string) => () =>
          safeFetch(`${detailsApiUrl}/lol/match/v5/matches/${matchId}`, {
            headers: { "X-Riot-Token": RIOT_API_KEY },
          }).then((res) => res.json()),
      );

      const matchDetails = await fetchInBatches(matchDetailsPromises, 4);

      const filtered = matchDetails.filter((match: any) => {
        const participant = match.info?.participants?.find(
          (p: any) => p.puuid === validatedData.puuid,
        );

        if (!participant) return false;
        if (!isFilteringByChampion) return true;

        return (
          Number(participant.championId) === Number(validatedData.championId)
        );
      });

      collectedMatches.push(...filtered);

      // Avança no histórico TOTAL da Riot (não no filtrado)
      currentStart += matchIds.length;

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

    // ================= SAVE =================
    if (isFilteringByChampion) {
      // Salva cache do campeão com o offset real no histórico da Riot
      await saveChampionCache(cacheKey, mergedMatches, currentStart);
    } else {
      // Cache base sem filtro não precisa de riotOffset
      await saveToSupabase(cacheKey, {
        matches: mergedMatches,
        riotOffset: mergedMatches.length, // opcional (consistência)
      });
    }

    // ================= L1 =================
    matchCache.set(cacheKey, { data: finalMatches, expires: now + L1_TTL });

    return NextResponse.json({ data: finalMatches, cache: "MISS_UPDATE" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.log(error);
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
