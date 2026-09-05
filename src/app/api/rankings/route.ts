// src/app/api/rankings/route.ts
import { NextResponse, NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// 🔥 REMOVIDO: export const dynamic = "force-dynamic";
// Agora a rota pode ser cacheada no CDN (ISR) se você adicionar revalidate na página

const RIOT_API_KEY = process.env.RIOT_API_KEY;

// 🔥 REDUZIDO: de 2 dias para 10 minutos – rankings mudam rápido!
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutos
const SUPABASE_TIMEOUT_MS = 5_000;
const RIOT_FETCH_TIMEOUT_MS = 15_000;

// 🔥 AUMENTADO: de 5 para 10 – mais paralelismo seguro
const SUMMONER_CONCURRENCY = 10;
const SUMMONER_BATCH_DELAY_MS = 300;

// ---------------------------------------------------------------------------
// Regional routing (mantido igual)
// ---------------------------------------------------------------------------

const REGIONAL_ROUTING: Record<string, string> = {
  euw1: "europe",
  eun1: "europe",
  ru: "europe",
  tr1: "europe",
  me1: "europe",
  kr: "asia",
  jp1: "asia",
  oc1: "sea",
  sg2: "sea",
  tw2: "sea",
  vn2: "sea",
  br1: "americas",
  na1: "americas",
  la1: "americas",
  la2: "americas",
};

function regionalBaseUrl(region: string) {
  const cluster = REGIONAL_ROUTING[region.toLowerCase()] ?? "americas";
  return `https://${cluster}.api.riotgames.com`;
}

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([
    promise,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
  ]);
}

// ---------------------------------------------------------------------------
// Riot API helpers
// ---------------------------------------------------------------------------

async function fetchLeague(
  region: string,
  queueType: string,
  tier: "challenger" | "grandmaster" | "master",
) {
  if (!RIOT_API_KEY)
    throw new Error("RIOT_API_KEY not configured on the server");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), RIOT_FETCH_TIMEOUT_MS);

  const url = `https://${region}.api.riotgames.com/lol/league/v4/${tier}leagues/by-queue/${queueType}?api_key=${RIOT_API_KEY}`;
  const res = await fetch(url, { signal: controller.signal }).finally(() =>
    clearTimeout(timeout),
  );

  if (!res.ok) {
    let detail = "";
    try {
      const body = await res.json();
      if (body?.status?.message) detail = ` - ${body.status.message}`;
    } catch {}

    if (res.status === 401)
      throw new Error(`Riot API unauthorized (401).${detail}`);
    if (res.status === 429)
      throw new Error(`Riot API rate limit (429).${detail}`);
    throw new Error(`Error fetching ${tier}: ${res.status}${detail}`);
  }

  return res.json();
}

async function riotFetch(url: string): Promise<any> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 8_000);
  try {
    const res = await fetch(url, {
      headers: { "X-Riot-Token": RIOT_API_KEY! },
      signal: controller.signal,
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

// ---------------------------------------------------------------------------
// Summoner name fetching + cache (otimizado)
// ---------------------------------------------------------------------------

interface SummonerNameEntry {
  puuid: string;
  gameName: string;
  tagLine: string;
  profileIconId: number | null;
  region: string; // ← adicione esta linha
}
/**
 * 🔥 VERSÃO OTIMIZADA: busca os nomes em paralelo com limite de concorrência
 * e usa Promise.allSettled para não quebrar se uma falhar.
 */
async function fetchOneSummonerName(
  region: string,
  puuid: string,
): Promise<SummonerNameEntry | null> {
  const baseUrl = regionalBaseUrl(region);

  const [summoner, account] = await Promise.all([
    riotFetch(
      `https://${region}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}`,
    ),
    riotFetch(`${baseUrl}/riot/account/v1/accounts/by-puuid/${puuid}`),
  ]);

  if (!account) return null;

  return {
    puuid,
    gameName: account.gameName ?? summoner?.name ?? "Unknown",
    tagLine: account.tagLine ?? "???",
    profileIconId: summoner?.profileIconId ?? null,
    region, // ← adicione esta linha
  };
}

/**
 * 🔥 OTIMIZADO: agora usa upsert direto na tabela summoner_names_cache
 * em vez de guardar dentro de rankings_cache. Isso separa as responsabilidades
 * e evita o crescimento do JSONB.
 *
 * Se preferir manter dentro de rankings_cache, comente essa função e use a anterior.
 * MAS RECOMENDO essa abordagem por ser mais performática.
 */
async function fetchAndCacheSummonerNamesSeparate(
  supabase: any,
  region: string,
  puuids: string[],
) {
  if (puuids.length === 0) return;

  // Filtra os que já estão no cache (opcional, mas evita chamadas desnecessárias)
  const { data: existing } = await supabase
    .from("summoner_names_cache")
    .select("puuid")
    .in("puuid", puuids);
  const existingSet = new Set(existing?.map((row: any) => row.puuid) ?? []);
  const toFetch = puuids.filter((p) => !existingSet.has(p));

  if (toFetch.length === 0) return;

  const baseUrl = regionalBaseUrl(region);
  const results: SummonerNameEntry[] = [];

  for (let i = 0; i < toFetch.length; i += SUMMONER_CONCURRENCY) {
    const batch = toFetch.slice(i, i + SUMMONER_CONCURRENCY);
    const batchResults = await Promise.allSettled(
      batch.map((puuid) =>
        (async () => {
          const [summoner, account] = await Promise.all([
            riotFetch(
              `https://${region}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}`,
            ),
            riotFetch(`${baseUrl}/riot/account/v1/accounts/by-puuid/${puuid}`),
          ]);
          if (!account) return null;
          return {
            puuid,
            gameName: account.gameName ?? summoner?.name ?? "Unknown",
            tagLine: account.tagLine ?? "???",
            profileIconId: summoner?.profileIconId ?? null,
            region,
          } as SummonerNameEntry & { region: string };
        })(),
      ),
    );

    for (const result of batchResults) {
      if (result.status === "fulfilled" && result.value) {
        results.push(result.value);
      }
    }

    if (i + SUMMONER_CONCURRENCY < toFetch.length)
      await new Promise((r) => setTimeout(r, SUMMONER_BATCH_DELAY_MS));
  }

  // Upsert em lote (se sua versão do Supabase suportar)
  if (results.length > 0) {
    await supabase.from("summoner_names_cache").upsert(
      results.map((r) => ({
        puuid: r.puuid,
        region: r.region,
        game_name: r.gameName,
        tag_line: r.tagLine,
        profile_icon_id: r.profileIconId,
        updated_at: new Date().toISOString(),
      })),
      { onConflict: "puuid" },
    );
  }
}

// ---------------------------------------------------------------------------
// Build the rankings payload (mantido igual)
// ---------------------------------------------------------------------------

function buildPayload(
  region: string,
  challenger: any,
  grandmaster: any,
  master: any,
) {
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
  ].sort((a: any, b: any) => b.leaguePoints - a.leaguePoints);

  const regionsUsingThreePages = new Set(["KR", "NA1", "EUW1", "VN2"]);
  const regionMode = regionsUsingThreePages.has(region.toUpperCase())
    ? "three-pages"
    : "two-pages";

  const challengerCutoffPosition = regionMode === "three-pages" ? 300 : 200;

  let challengerCutoffLP = 0;
  if (allEntries.length >= challengerCutoffPosition) {
    challengerCutoffLP = allEntries[challengerCutoffPosition - 1].leaguePoints;
  } else if (allEntries.length > 0) {
    challengerCutoffLP = allEntries[allEntries.length - 1].leaguePoints;
  }

  let grandmasterCutoffLP = 0;
  if (regionMode === "three-pages") {
    const globalIndexByPuuid = new Map<string, number>(
      allEntries.map((e, i) => [e.puuid, i]),
    );
    const relevantGMs = grandmasterEntries.filter((entry: any) => {
      const idx = globalIndexByPuuid.get(entry.puuid) ?? -1;
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

  return {
    allEntries,
    challengerEntries,
    grandmasterEntries,
    masterEntries,
    regionMode,
    cutoffs: {
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
    },
  };
}

// ---------------------------------------------------------------------------
// Supabase rankings cache helpers
// ---------------------------------------------------------------------------

async function getFromSupabase(supabase: any, cacheKey: string) {
  const { data, error } = await supabase
    .from("rankings_cache")
    .select("data, updated_at")
    .eq("cache_key", cacheKey)
    .single();

  if (error || !data) return null;
  return data as {
    data: any;
    updated_at: string;
  };
}

async function upsertToSupabase(
  supabase: any,
  cacheKey: string,
  region: string,
  queueType: string,
  payload: any,
) {
  const { error } = await supabase.from("rankings_cache").upsert(
    {
      cache_key: cacheKey,
      region,
      queue_type: queueType,
      data: payload,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "cache_key" },
  );

  if (error) console.error("[rankings_cache] upsert error:", error.message);
}

// ---------------------------------------------------------------------------
// Busca os summoner names diretamente da tabela separada (mais rápido)
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// Busca os summoner names diretamente da tabela separada (mais rápido)
// ---------------------------------------------------------------------------

async function getSummonerNamesFromTable(
  supabase: any,
  puuids: string[],
): Promise<Record<string, { gameName: string; tagLine: string }>> {
  if (puuids.length === 0) return {};

  const { data, error } = await supabase
    .from("summoner_names_cache")
    .select("puuid, game_name, tag_line")
    .in("puuid", puuids);

  if (error || !data) return {};

  // 🔥 CORREÇÃO: define o tipo do resultado com assinatura de índice
  const result: Record<string, { gameName: string; tagLine: string }> = {};
  for (const row of data) {
    result[row.puuid] = {
      gameName: row.game_name,
      tagLine: row.tag_line,
    };
  }
  return result;
}
// ---------------------------------------------------------------------------
// Core orchestrator (OTIMIZADO)
// ---------------------------------------------------------------------------

async function getAllRankings(
  supabase: any,
  region: string,
  queueType: string,
) {
  const cacheKey = `${region}-${queueType}`;
  const now = Date.now();

  const cached = await withTimeout(
    getFromSupabase(supabase, cacheKey),
    SUPABASE_TIMEOUT_MS,
  );

  if (cached) {
    const age = now - new Date(cached.updated_at).getTime();
    // Se o cache ainda é válido, retorna imediatamente (com os nomes já inclusos)
    if (age < CACHE_TTL_MS) {
      // 🔥 Busca os nomes dos summoners em paralelo (tabela separada)
      const allPuuids: string[] = (cached.data?.allEntries ?? []).map(
        (e: any) => e.puuid,
      );
      const summonerNames = await getSummonerNamesFromTable(supabase, allPuuids);

      // Dispara a atualização em background se faltar algum nome
      const missing = allPuuids.filter((p) => !summonerNames[p]);
      if (missing.length > 0) {
        fetchAndCacheSummonerNamesSeparate(supabase, region, missing).catch(
          (err) =>
            console.error("[summoner_cache] background fetch failed:", err),
        );
      }

      return {
        payload: cached.data,
        summonerNames,
        fromCache: true,
        updatedAt: cached.updated_at,
        ageMs: age,
      };
    }
  }

  // Cache expirado ou ausente -> busca da Riot
  try {
    const [challenger, grandmaster, master] = await Promise.all([
      fetchLeague(region, queueType, "challenger"),
      fetchLeague(region, queueType, "grandmaster"),
      fetchLeague(region, queueType, "master"),
    ]);

    const payload = buildPayload(region, challenger, grandmaster, master);

    // Persist rankings — fire-and-forget
    await upsertToSupabase(
      supabase,
      cacheKey,
      region,
      queueType,
      payload,
    ).catch((err) => console.error("[rankings_cache] upsert failed:", err));

    // 🔥 Busca os nomes dos summoners em paralelo (tabela separada) – AGORA SINCRONO
    const allPuuids: string[] = payload.allEntries.map((e: any) => e.puuid);
    const summonerNames = await getSummonerNamesFromTable(supabase, allPuuids);

    // Dispara a atualização em background para os que faltam
    const missing = allPuuids.filter((p) => !summonerNames[p]);
    if (missing.length > 0) {
      fetchAndCacheSummonerNamesSeparate(supabase, region, missing).catch(
        (err) =>
          console.error("[summoner_cache] background fetch failed:", err),
      );
    }

    return {
      payload,
      summonerNames,
      fromCache: false,
      updatedAt: new Date().toISOString(),
      ageMs: 0,
    };
  } catch (error) {
    // Fallback: se a Riot falhar, serve o cache mesmo que expirado
    if (cached) {
      console.warn(
        "[rankings] Riot fetch failed, serving stale Supabase cache:",
        error,
      );
      const allPuuids: string[] = (cached.data?.allEntries ?? []).map(
        (e: any) => e.puuid,
      );
      const summonerNames = await getSummonerNamesFromTable(supabase, allPuuids);
      return {
        payload: cached.data,
        summonerNames,
        fromCache: true,
        stale: true,
        updatedAt: cached.updated_at,
        ageMs: now - new Date(cached.updated_at).getTime(),
      };
    }
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Route handler (OTIMIZADO com cabeçalhos de cache)
// ---------------------------------------------------------------------------

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

    const { payload, summonerNames, fromCache, stale, updatedAt, ageMs } =
      await getAllRankings(supabaseAdmin, region, queueType);

    const { allEntries } = payload;

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedEntries = allEntries.slice(startIndex, endIndex);

    const ageMinutes = Math.floor((ageMs ?? 0) / (1000 * 60));
    const expiresInMinutes = Math.max(
      0,
      Math.floor((CACHE_TTL_MS - (ageMs ?? 0)) / (1000 * 60)),
    );

    const response = NextResponse.json({
      tier: "CHALLENGER+GM+MASTER",
      queue: queueType,
      name: `${region} Combined Leaderboard`,
      entries: paginatedEntries,
      summonerNames, // 🔥 AGORA VEM PREENCHIDO!
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(allEntries.length / limit),
        totalEntries: allEntries.length,
        entriesPerPage: limit,
        hasNextPage: endIndex < allEntries.length,
        hasPreviousPage: page > 1,
      },
      cutoffs: payload.cutoffs,
      regionMode: payload.regionMode,
      counts: {
        challenger: payload.challengerEntries.length,
        grandmaster: payload.grandmasterEntries.length,
        master: payload.masterEntries.length,
      },
      cache: {
        isFromCache: fromCache,
        isStale: stale ?? false,
        updatedAt,
        ageInMinutes: ageMinutes,
        expiresInMinutes,
        ttlDays: 2,
      },
    });

    // 🔥 ADICIONADO: cabeçalho Cache-Control para permitir caching no CDN
    // O navegador pode cachear por 60 segundos, mas o conteúdo é revalidado no servidor
    response.headers.set(
      "Cache-Control",
      "public, s-maxage=60, stale-while-revalidate=120",
    );

    return response;
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
