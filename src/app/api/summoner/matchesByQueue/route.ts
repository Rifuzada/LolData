import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { AMERICAS_API_URL, EUROPE_API_URL, ASIA_API_URL, SEA_API_URL } from '@/app/utils/helpers';

const matchesSchema = z.object({
  region: z.string().min(1),
  puuid: z.string().min(10),
  start: z.string().transform(val => Number(val || 0)).default('0'),
  count: z.string().transform(val => Number(val || 10)).default('10')
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

// Adicione a função safeFetch no topo do arquivo:
async function safeFetch(url: string, options: any, retries = 3): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    const res = await fetch(url, options);
    if (res.status !== 429) return res;
    const retryAfter = Number(res.headers.get('retry-after')) || 1;
    await new Promise(r => setTimeout(r, retryAfter * 1000));
  }
  return await fetch(url, options);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    // Crie uma chave única para o cache
    const cacheKey = request.url;
    const now = Date.now();

    // Verifica se existe cache válido
    if (matchCache.has(cacheKey)) {
      const cached = matchCache.get(cacheKey)!;
      if (cached.expires > now) {
        return NextResponse.json({ data: cached.data });
      } else {
        matchCache.delete(cacheKey);
      }
    }

    const puuid = searchParams.get('puuid');
    const start = searchParams.get('start') || '0';
    const count = searchParams.get('count') || '10';
    const queueId = searchParams.get('queueId') || '';
    const region = searchParams.get('region') || '';
    const championId = searchParams.get('championId'); // <- novo parâmetro
    const validatedData = matchesSchema.parse({ region, puuid, start, count });
    console.log("Validated Data:", validatedData);
    const { RIOT_API_KEY } = process.env;

    if (!RIOT_API_KEY) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }
    let matchIdsResponse: Response;
    let apiUrl: string = "";

    if (queueId === '') {
      apiUrl = AMERICAS_API_URL;
      matchIdsResponse = await safeFetch(
        `${apiUrl}/lol/match/v5/matches/by-puuid/${validatedData.puuid}/ids?start=${validatedData.start}&count=${validatedData.count}`,
        {
          headers: {
            'X-Riot-Token': RIOT_API_KEY
          }
        }
      );
      if (!matchIdsResponse.ok) {
        const error = await matchIdsResponse.json();
        return NextResponse.json(
          { error: error.status.message || 'Failed to fetch match IDs' },
          { status: matchIdsResponse.status }
        );
      }
      const matchIds = await matchIdsResponse.json();
      // Busca os detalhes de cada partida em lotes
      const matchDetailsPromises = matchIds.map((matchId: string) => () =>
        safeFetch(`${apiUrl}/lol/match/v5/matches/${matchId}`, {
          headers: {
            'X-Riot-Token': RIOT_API_KEY
          }
        }).then(res => res.json())
      );
      let matchDetails = await fetchInBatches(matchDetailsPromises, 2);

      // --- FILTRO PELO CAMPEÃO SE FOR PASSADO ---
      if (championId && championId !== "all") {
        matchDetails = matchDetails.filter((match: any) =>
          match.info?.participants?.some(
            (p: any) => String(p.championId) === String(championId)
          )
        );
      }

      // Antes de retornar, salve no cache:
      matchCache.set(cacheKey, { data: matchDetails, expires: Date.now() + CACHE_TTL });

      return NextResponse.json({ data: matchDetails });
    } else {
      if (validatedData.region.includes('euw1') || validatedData.region.includes('eun1') || validatedData.region.includes('ru') || validatedData.region.includes('tr1') || validatedData.region.includes('me1')) {
        apiUrl = EUROPE_API_URL;
        matchIdsResponse = await safeFetch(
          `${apiUrl}/lol/match/v5/matches/by-puuid/${validatedData.puuid}/ids?queue=${queueId}&start=${validatedData.start}&count=${validatedData.count}`,
          {
            headers: {
              'X-Riot-Token': RIOT_API_KEY
            }
          }
        );
      } else if (validatedData.region.includes('jp1') || validatedData.region.includes('kr')) {
        apiUrl = ASIA_API_URL;
        matchIdsResponse = await safeFetch(
          `${apiUrl}/lol/match/v5/matches/by-puuid/${validatedData.puuid}/ids?queue=${queueId}&start=${validatedData.start}&count=${validatedData.count}`,
          {
            headers: {
              'X-Riot-Token': RIOT_API_KEY
            }
          }
        );
      } else if (validatedData.region.includes('oc1') || validatedData.region.includes('tw2') || validatedData.region.includes('vn2')) {
        apiUrl = SEA_API_URL;
        matchIdsResponse = await safeFetch(
          `${apiUrl}/lol/match/v5/matches/by-puuid/${validatedData.puuid}/ids?queue=${queueId}&start=${validatedData.start}&count=${validatedData.count}`,
          {
            headers: {
              'X-Riot-Token': RIOT_API_KEY
            }
          }
        );
      } else {
        apiUrl = AMERICAS_API_URL;
        matchIdsResponse = await safeFetch(
          `${apiUrl}/lol/match/v5/matches/by-puuid/${validatedData.puuid}/ids?queue=${queueId}&start=${validatedData.start}&count=${validatedData.count}`,
          {
            headers: {
              'X-Riot-Token': RIOT_API_KEY
            }
          }
        );
      }
      if (!matchIdsResponse.ok) {
        const error = await matchIdsResponse.json();
        return NextResponse.json(
          { error: error.status.message || 'Failed to fetch match IDs' },
          { status: matchIdsResponse.status }
        );
      }
      const matchIds = await matchIdsResponse.json();
      // Busca os detalhes de cada partida em lotes
      const matchDetailsPromises = matchIds.map((matchId: string) => () =>
        safeFetch(`${apiUrl}/lol/match/v5/matches/${matchId}`, {
          headers: {
            'X-Riot-Token': RIOT_API_KEY
          }
        }).then(res => res.json())
      );
      let matchDetails = await fetchInBatches(matchDetailsPromises, 2);

      // --- FILTRO PELO CAMPEÃO SE FOR PASSADO ---
      if (championId && championId !== "all") {
        matchDetails = matchDetails.filter((match: any) =>
          match.info?.participants?.some(
            (p: any) => String(p.championId) === String(championId)
          )
        );
      }

      // Antes de retornar, salve no cache:
      matchCache.set(cacheKey, { data: matchDetails, expires: Date.now() + CACHE_TTL });

      return NextResponse.json({ data: matchDetails });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request parameters' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
