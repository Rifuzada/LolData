import { NextRequest, NextResponse } from "next/server";

// [FIX 1] "force-dynamic" foi removido.
//
// Por quê era um problema:
//   O Next.js interpreta `dynamic = "force-dynamic"` como "forçar cache: 'no-store'
//   em TODOS os fetch() desta rota", sobrescrevendo qualquer `next: { revalidate }`
//   que você colocar nos fetches individuais. Resultado: zero cache de fetch,
//   cold start re-busca tudo na Riot toda vez.
//
// Por que é seguro remover:
//   A rota já é dinamicamente renderizada porque lê `request.nextUrl.searchParams`.
//   O Next.js detecta isso automaticamente — não é necessário declarar explicitamente.
//   Agora os fetches individuais podem usar o Vercel Data Cache normalmente.

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

const DETAIL_BATCH_SIZE = 10;

// [FIX 2] A opção `next` do Next.js não faz parte do RequestInit padrão do TypeScript.
// Sem esse tipo, o TypeScript reclamaria ao passar { next: { revalidate } } no safeFetch.
// Isso garante que o cache de fetch seja reconhecido corretamente pelo compilador.
type RiotFetchOptions = RequestInit & {
  next?: { revalidate?: number | false; tags?: string[] };
};

async function fetchInBatches<T>(
  tasks: (() => Promise<T>)[],
  batchSize: number,
): Promise<T[]> {
  const results: T[] = [];
  for (let i = 0; i < tasks.length; i += batchSize) {
    const batch = tasks.slice(i, i + batchSize).map((fn) => fn());
    results.push(...(await Promise.all(batch)));

    // [FIX 3] O delay de 150ms entre batches foi removido.
    //
    // Por quê existia: tentativa de evitar rate-limit da Riot API.
    // Por quê era desnecessário agora:
    //   Com `next: { revalidate: 86400 }` nos detalhes, o Vercel Data Cache
    //   serve partidas já conhecidas em ~5ms sem tocar na Riot. O throttle
    //   só importa para IDs genuinamente novos, e 10 requests simultâneos
    //   está bem dentro dos limites (500 req/10s em dev keys, muito mais em prod).
    //   Remover economiza 150ms por batch adicional — para 20 partidas em 2 batches: -150ms.
    //   Para filtro de campeão com 5 páginas de 50 IDs: pode economizar 600ms+.
  }
  return results;
}

// Atualizado para aceitar RiotFetchOptions (com o campo `next` do Next.js).
async function safeFetch(
  url: string,
  options: RiotFetchOptions,
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

// Busca detalhes de várias partidas em lote pelo matchId.
//
// Por que existe:
//   Detalhes de uma partida encerrada são IMUTÁVEIS para sempre.
//   Faz sentido guardá-los individualmente no Supabase (chave: "match:<matchId>")
//   para que qualquer busca futura — de qualquer jogador que tenha jogado aquela partida,
//   em qualquer filtro de campeão — não precise bater na Riot novamente.
//
// Usa a mesma tabela match_cache com uma convenção de chave diferente.
// Não precisa de TTL — esses dados nunca ficam desatualizados.
async function getMatchDetailsBatch(
  matchIds: string[],
): Promise<Map<string, any>> {
  const detailMap = new Map<string, any>();
  if (matchIds.length === 0) return detailMap;

  try {
    const keys = matchIds.map((id) => `match:${id}`);
    const { data } = await supabaseAdmin
      .from("match_cache")
      .select("id, data")
      .in("id", keys);

    for (const row of data || []) {
      const matchId = (row.id as string).replace("match:", "");
      detailMap.set(matchId, row.data);
    }
  } catch {
    // Cache miss silencioso — os IDs faltantes irão à Riot normalmente.
  }

  return detailMap;
}

// Salva detalhes individuais de partidas no Supabase em lote (fire-and-forget).
//
// Chamado após buscar detalhes novos na Riot. O upsert em lote é muito mais
// eficiente do que N upserts individuais — o Supabase processa tudo em 1 round-trip.
async function saveMatchDetailsBatch(matches: any[]): Promise<void> {
  if (matches.length === 0) return;

  const rows = matches
    .filter((m) => m?.metadata?.matchId)
    .map((m) => ({
      id: `match:${m.metadata.matchId}`,
      data: m,
      cached_at: new Date().toISOString(),
      game_name: null,
      tagline: null,
    }));

  if (rows.length === 0) return;

  await supabaseAdmin.from("match_cache").upsert(rows);
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

    // ================= BASE CACHE REUSE (filtro de campeão) =================
    //
    // Problema resolvido:
    //   Quando o jogador abre o perfil, o código baixa as últimas N partidas e
    //   salva tudo no baseCacheKey (ex: matches:br1:<puuid>:all:all).
    //   Ao trocar para filtro "sett", o código criava uma chave nova e começava
    //   do zero — riotOffset = 0 — re-baixando 100–250 detalhes que já existiam.
    //
    // O que fazemos agora:
    //   1. Lemos o base cache (matches sem filtro) do Supabase — ele já existe.
    //   2. Filtramos localmente por campeão (zero requests de rede).
    //   3. Definimos riotOffset como o ponto onde o base cache parou de buscar.
    //      Isso faz o loop da Riot começar DEPOIS dos matches já conhecidos,
    //      evitando buscar detalhes que já foram baixados anteriormente.
    //
    // Resultado prático:
    //   Base cache com 20 matches → filtramos ~2-4 setts localmente → offset = 20.
    //   O loop da Riot começa no offset 20 em vez de 0.
    //   Saves: re-download de 20 detalhes + 1 página de matchIds = ~10–30s a menos.
    if (isFilteringByChampion && existingMatches.length < start + count) {
      const baseCached = await getFromSupabase(baseCacheKey);

      if (baseCached) {
        const baseMatches: any[] = baseCached.matches || [];
        const baseRiotOffset: number =
          baseCached.riotOffset ?? baseMatches.length;

        // Filtra os matches do base cache pelo campeão pedido — sem rede.
        const champFromBase = baseMatches.filter((match: any) => {
          const participant = match.info?.participants?.find(
            (p: any) => p.puuid === puuid,
          );
          return participant?.championName?.toLowerCase() === championKey;
        });

        // Mescla com o que já tínhamos no cache específico do campeão (se houver),
        // removendo duplicatas pelo matchId.
        const merged = [...existingMatches, ...champFromBase].filter(
          (match, index, self) =>
            index ===
            self.findIndex(
              (m) => m.metadata.matchId === match.metadata.matchId,
            ),
        );

        existingMatches = merged;

        // Avança o offset para onde o base cache parou.
        // O loop da Riot só buscará a partir daí — não re-baixa nada já visto.
        if (baseRiotOffset > riotOffset) {
          riotOffset = baseRiotOffset;
        }
      }
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

    const PAGE_SIZE = isFilteringByChampion ? 50 : count;
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

      if (queueId) {
        matchIdsUrl.searchParams.set("queue", String(queueId));
      }

      // [FIX 4a] Cache de fetch para a lista de matchIds — revalidate: 60s.
      //
      // Por quê 60 segundos:
      //   Uma partida de LoL dura no mínimo ~20 minutos. Cachear os IDs por 60s
      //   é seguro e não vai exibir dados desatualizados de forma perceptível.
      //   Benefício principal: instâncias serverless que sofreram cold start
      //   servem a lista do Vercel Data Cache (~5ms) em vez de bater na Riot (~200–400ms).
      const matchIdsResponse = await safeFetch(matchIdsUrl.toString(), {
        headers: { "X-Riot-Token": RIOT_API_KEY },
        next: { revalidate: 60 },
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

      const existingIds = new Set(
        existingMatches.map((m: any) => m.metadata?.matchId),
      );
      const newMatchIds = matchIds.filter((id) => !existingIds.has(id));

      if (newMatchIds.length > 0) {
        // ---- Etapa 1: consulta Supabase pelos detalhes que já foram baixados ----
        //
        // Antes de ir à Riot, verifica se esses matchIds já foram baixados
        // em algum momento anterior (qualquer jogador, qualquer filtro de campeão).
        // Detalhes de partida encerrada são imutáveis — o cache nunca fica desatualizado.
        //
        // Impacto principal:
        //   Busca "sett" → baixa 250 detalhes da Riot → salva no Supabase.
        //   Busca "shen" logo depois → os mesmos 250 IDs já estão no Supabase.
        //   Supabase retorna tudo em ~80ms num único round-trip → 0 requests à Riot.
        //   De 3.6 minutos → < 1 segundo.
        const cachedDetailsMap = await getMatchDetailsBatch(newMatchIds);

        const fromSupabaseDetails: any[] = [];
        const trulyNewMatchIds: string[] = [];

        for (const id of newMatchIds) {
          if (cachedDetailsMap.has(id)) {
            fromSupabaseDetails.push(cachedDetailsMap.get(id));
          } else {
            trulyNewMatchIds.push(id);
          }
        }

        // ---- Etapa 2: só vai à Riot para o que realmente não existe em lugar nenhum ----
        let riotMatchDetails: any[] = [];

        if (trulyNewMatchIds.length > 0) {
          const matchDetailsPromises = trulyNewMatchIds.map(
            (matchId: string) => () =>
              // revalidate: 86400 para o Vercel Data Cache em produção.
              // Em dev local, o Supabase resolve o mesmo problema (cache permanente).
              safeFetch(`${detailsApiUrl}/lol/match/v5/matches/${matchId}`, {
                headers: { "X-Riot-Token": RIOT_API_KEY },
                next: { revalidate: 86400 },
              }).then((res) => res.json()),
          );

          const raw = await fetchInBatches(
            matchDetailsPromises,
            DETAIL_BATCH_SIZE,
          );

          riotMatchDetails = raw.filter(
            (m: any) => m?.metadata?.matchId && m?.info?.participants,
          );

          // Salva os detalhes novos no Supabase em lote (fire-and-forget).
          // Qualquer filtro futuro que topar esses matchIds vai servir do Supabase.
          saveMatchDetailsBatch(riotMatchDetails).catch(() => {});
        }

        // ---- Etapa 3: combina Supabase + Riot e aplica o filtro de campeão ----
        const allDetails = [
          ...fromSupabaseDetails.filter(
            (m: any) => m?.metadata?.matchId && m?.info?.participants,
          ),
          ...riotMatchDetails,
        ];

        const filtered = allDetails.filter((match: any) => {
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

    const hasMore = !(hitOffsetLimit && mergedMatches.length < start + count);

    // ================= SAVE =================
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
