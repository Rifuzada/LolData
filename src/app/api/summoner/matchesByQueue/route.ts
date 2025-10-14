import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { z } from 'zod';
import { AMERICAS_API_URL, EUROPE_API_URL, ASIA_API_URL, SEA_API_URL } from '@/app/utils/helpers';

const matchesSchema = z.object({
  region: z.string().min(1),
  puuid: z.string().min(10),
  start: z.string().transform(val => Number(val || 0)).default('0'),
  count: z.string().transform(val => Number(val || 10)).default('10'),
  queueId: z.string().optional(),
  championName: z.string().optional(),
  champion: z.string().optional()
});

const matchCache = new Map<string, { data: any, expires: number }>();
const CACHE_TTL = 60 * 1000; // 1 minuto

// Função utilitária para limitar concorrência
async function fetchInBatches<T>(tasks: (() => Promise<T>)[], batchSize: number): Promise<T[]> {
  const results: T[] = [];
  for (let i = 0; i < tasks.length; i += batchSize) {
    const batch = tasks.slice(i, i + batchSize).map(fn => fn());
    results.push(...(await Promise.all(batch)));
    // Pequeno delay opcional para ser ainda mais seguro
    await new Promise(res => setTimeout(res, 250));
  }
  return results;
}

async function safeFetch(url: string, options: any, retries = 3): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    const res = await fetch(url, options);
    if (res.status !== 429) return res;
    const retryAfter = Number(res.headers.get('retry-after')) || 1;
    await new Promise(r => setTimeout(r, retryAfter * 1000));
  }
  return await fetch(url, options);
}

// Função para normalizar nomes de campeões
function normalizeChampionName(name: string): string {
  return name.toLowerCase()
    .replace(/[^a-z0-9]/g, '') // Remove caracteres especiais
    .replace(/\s+/g, '') // Remove espaços
    .replace(/'/g, '') // Remove apóstrofos (para nomes como Kai'Sa)
    .replace(/\./g, ''); // Remove pontos (para nomes como Dr. Mundo)
}

// Função para verificar se uma partida corresponde ao filtro de campeão
function matchesChampionFilter(match: any, puuid: string, championFilter: string): boolean {
  if (!championFilter || championFilter === "all") return true;
  
  // Encontra o participante correto na partida
  const participant = match.info?.participants?.find((p: any) => p.puuid === puuid);
  if (!participant) return false;

  // Normaliza o nome do campeão do participante e o filtro
  const championName = normalizeChampionName(participant.championName || "");
  const championId = String(participant.championId || "");
  const normalizedFilter = normalizeChampionName(championFilter);

  // Lista de aliases comuns para alguns campeões
  const championAliases: { [key: string]: string[] } = {
    'wukong': ['monkeyking'],
    'asol': ['aurelionsol'],
    'mundo': ['drmundo'],
    'jarvan': ['jarvaniv'],
    'yi': ['masteryi'],
    'mf': ['missfortune'],
    'tf': ['twistedfate']
  };

  // Verifica correspondência direta
  if (championName === normalizedFilter || championId === championFilter) {
    return true;
  }

  // Verifica aliases
  for (const [champion, aliases] of Object.entries(championAliases)) {
    if ((normalizedFilter === champion || aliases.includes(normalizedFilter)) && 
        (championName === champion || aliases.includes(championName))) {
      return true;
    }
  }

  // Verifica correspondência parcial (mais flexível)
  return championName.includes(normalizedFilter) || normalizedFilter.includes(championName);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    // Parâmetros da requisição
    const puuid = searchParams.get('puuid');
    const start = searchParams.get('start') || '0';
    const count = searchParams.get('count') || '10';
    const queueId = searchParams.get('queueId') || '';
    const region = searchParams.get('region') || '';
    const championFilter = searchParams.get('championName') || searchParams.get('champion') || '';
    
    const validatedData = matchesSchema.parse({ region, puuid, start, count });

    const { RIOT_API_KEY } = process.env;
    if (!RIOT_API_KEY) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    // Criar chave de cache considerando todos os parâmetros importantes
  const cacheKey = `matchesByQueue:${region}:${puuid}:${queueId}:${championFilter}:${start}:${count}`;
    const now = Date.now();

    // Verificar cache
    if (matchCache.has(cacheKey)) {
      const cached = matchCache.get(cacheKey)!;
      if (cached.expires > now) {
        return NextResponse.json({ data: cached.data });
      } else {
        matchCache.delete(cacheKey);
      }
    }

    // Determinar API URL baseada na região
    let apiUrl: string = AMERICAS_API_URL;
    
    if (region.includes('euw1') || region.includes('eun1') || region.includes('ru') || region.includes('tr1') || region.includes('me1')) {
      apiUrl = EUROPE_API_URL;
    } else if (region.includes('jp1') || region.includes('kr')) {
      apiUrl = ASIA_API_URL;
    } else if (region.includes('oc1') || region.includes('tw2') || region.includes('vn2')) {
      apiUrl = SEA_API_URL;
    }

    let collectedMatches: any[] = [];
    let currentStart = validatedData.start;
    let requestCount = Math.max(parseInt(count), championFilter ? 20 : 10); // Buscar mais se filtrando por campeão
    const maxIterations = championFilter ? 10 : 1; // Máximo de iterações para evitar loop infinito
    let iterations = 0;

    // Loop para coletar partidas suficientes (especialmente útil para filtro de campeão)
    while (collectedMatches.length < parseInt(count) && iterations < maxIterations) {
      iterations++;

      // Construir URL da API
      let matchIdsUrl: string;
      if (queueId === '' || queueId === 'all') {
        matchIdsUrl = `${apiUrl}/lol/match/v5/matches/by-puuid/${validatedData.puuid}/ids?start=${currentStart}&count=${requestCount}`;
      } else {
        matchIdsUrl = `${apiUrl}/lol/match/v5/matches/by-puuid/${validatedData.puuid}/ids?queue=${queueId}&start=${currentStart}&count=${requestCount}`;
      }

      // Buscar IDs das partidas
      const matchIdsResponse = await safeFetch(matchIdsUrl, {
        headers: { 'X-Riot-Token': RIOT_API_KEY }
      });

      if (!matchIdsResponse.ok) {
        const error = await matchIdsResponse.json();
        return NextResponse.json(
          { error: error.status?.message || 'Failed to fetch match IDs' },
          { status: matchIdsResponse.status }
        );
      }

      const matchIds = await matchIdsResponse.json();
      
      // Se não há mais partidas, parar
      if (matchIds.length === 0) {
        break;
      }

      // Buscar detalhes das partidas em lotes
      const matchDetailsPromises = matchIds.map((matchId: string) => () =>
        safeFetch(`${apiUrl}/lol/match/v5/matches/${matchId}`, {
          headers: { 'X-Riot-Token': RIOT_API_KEY }
        }).then(res => res.json())
      );

      let matchDetails = await fetchInBatches(matchDetailsPromises, 2);

      // Aplicar filtro de campeão se especificado
      if (championFilter && championFilter !== "all") {
        matchDetails = matchDetails.filter((match: any) => 
          matchesChampionFilter(match, puuid!, championFilter)
        );
        
      }

      collectedMatches = [...collectedMatches, ...matchDetails];
      currentStart += matchIds.length;

      // Se não estamos filtrando por campeão ou já temos suficientes, parar
      if (!championFilter || collectedMatches.length >= parseInt(count)) {
        break;
      }

      // Se recebemos menos partidas que o solicitado, provavelmente acabaram
      if (matchIds.length < requestCount) {
        break;
      }
    }

    // Limitar ao número solicitado
    const finalMatches = collectedMatches.slice(0, parseInt(count));

    // Salvar no cache
    matchCache.set(cacheKey, { 
      data: finalMatches, 
      expires: now + CACHE_TTL 
    });

    return NextResponse.json({ 
      data: finalMatches,
      meta: {
        requested: parseInt(count),
        returned: finalMatches.length,
        championFilter: championFilter || null,
        iterations,
        fromCache: false
      }
    });

  } catch (error) {
    console.error('API Error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request parameters', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
