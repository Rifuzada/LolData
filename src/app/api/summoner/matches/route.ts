import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { AMERICAS_API_URL, EUROPE_API_URL, ASIA_API_URL, SEA_API_URL } from '@/app/utils/helpers';

const matchesSchema = z.object({
  region: z.string().min(1),
  puuid: z.string().min(10),
  start: z.string().transform(val => Number(val || 0)).default('0'),
  count: z.string().transform(val => Number(val || 10)).default('10')
});

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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const puuid = searchParams.get('puuid');
    const region = searchParams.get('region');
    const start = searchParams.get('start') || '0';
    const count = searchParams.get('count') || '10';

    const validatedData = matchesSchema.parse({ region, puuid, start, count });
    const { RIOT_API_KEY } = process.env;

    if (!RIOT_API_KEY) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    let matchIdsResponse;
    let detailsApiUrl = AMERICAS_API_URL;

    if (validatedData.region.includes('euw1') || validatedData.region.includes('eun1') || validatedData.region.includes('ru') || validatedData.region.includes('tr1') || validatedData.region.includes('me1')) {
      matchIdsResponse = await fetch(
        `${EUROPE_API_URL}/lol/match/v5/matches/by-puuid/${validatedData.puuid}/ids?start=${validatedData.start}&count=${validatedData.count}`,
        {
          headers: {
            'X-Riot-Token': RIOT_API_KEY
          }
        }
      );
      detailsApiUrl = EUROPE_API_URL;
    } else if (validatedData.region.includes('jp1') || validatedData.region.includes('kr')) {
      matchIdsResponse = await fetch(
        `${ASIA_API_URL}/lol/match/v5/matches/by-puuid/${validatedData.puuid}/ids?start=${validatedData.start}&count=${validatedData.count}`,
        {
          headers: {
            'X-Riot-Token': RIOT_API_KEY
          }
        }
      );
      detailsApiUrl = ASIA_API_URL;
    } else if (validatedData.region.includes('oc1') || validatedData.region.includes('tw2') || validatedData.region.includes('vn2')) {
      matchIdsResponse = await fetch(
        `${SEA_API_URL}/lol/match/v5/matches/by-puuid/${validatedData.puuid}/ids?start=${validatedData.start}&count=${validatedData.count}`,
        {
          headers: {
            'X-Riot-Token': RIOT_API_KEY
          }
        }
      );
      detailsApiUrl = SEA_API_URL;
    } else {
      matchIdsResponse = await fetch(
        `${AMERICAS_API_URL}/lol/match/v5/matches/by-puuid/${validatedData.puuid}/ids?start=${validatedData.start}&count=${validatedData.count}`,
        {
          headers: {
            'X-Riot-Token': RIOT_API_KEY
          }
        }
      );
      detailsApiUrl = AMERICAS_API_URL;
    }

    if (!matchIdsResponse.ok) {
      const error = await matchIdsResponse.json();
      return NextResponse.json(
        { error: error.status.message || 'Failed to fetch match IDs' },
        { status: matchIdsResponse.status }
      );
    }

    const matchIds = await matchIdsResponse.json();

    // Busca os detalhes de cada partida em batches
    const matchDetailsPromises = matchIds.map((matchId: string) => () =>
      fetch(`${detailsApiUrl}/lol/match/v5/matches/${matchId}`, {
        headers: {
          'X-Riot-Token': RIOT_API_KEY
        }
      }).then(res => res.json())
    );

    const matchDetails = await fetchInBatches(matchDetailsPromises, 2); // 2 por vez
    return NextResponse.json({ data: matchDetails });
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
