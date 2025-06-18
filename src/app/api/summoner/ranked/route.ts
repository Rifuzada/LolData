import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getRegionalApiUrl } from '@/app/utils/helpers';
import { OptimisticCache } from '@/app/utils/optimisticCacheApi';

const rankedSchema = z.object({
  summonerId: z.string().min(10),
  region: z.string().min(2).max(4)
});

export const rankedCache = new OptimisticCache<any>(60_000);

export async function GET(request: NextRequest) {
  try {
    // Padroniza a chave do cache para ser apenas path + search (sem domínio)
    const urlObj = new URL(request.url);
    const refresh = urlObj.searchParams.get('refresh') === '1';
    const cacheKey = urlObj.pathname + urlObj.search;

    const cached = await rankedCache.getOrFetch(
      cacheKey,
      async () => {
        const { searchParams } = urlObj;
        const summonerId = searchParams.get('summonerId');
        const region = searchParams.get('region');

        const validatedData = rankedSchema.parse({ summonerId, region });
        const { RIOT_API_KEY } = process.env;

        if (!RIOT_API_KEY) {
          throw new Error('API key not configured');
        }

        const regionalUrl = getRegionalApiUrl(validatedData.region);
        const response = await fetch(
          `${regionalUrl}/lol/league/v4/entries/by-summoner/${validatedData.summonerId}`,
          {
            headers: {
              'X-Riot-Token': RIOT_API_KEY
            }
          }
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.status.message || 'Failed to fetch ranked data');
        }

        const data = await response.json();
        // console.log('[API] /api/summoner/ranked request:', {
        //   method: request.method,
        //   url: request.url,
        //   pathname: urlObj.pathname,
        //   search: urlObj.search,
        //   searchParams: Object.fromEntries(urlObj.searchParams.entries())
        // });
        // console.log("[API] Ranked Data for SummonerId:", validatedData.summonerId, JSON.stringify(data));
        // Força o log a aparecer imediatamente
        // if (typeof process !== 'undefined' && process.stdout && process.stdout.write) {
        //   process.stdout.write('');
        // }
        return data;
      },
      { forceRefresh: refresh }
    );

    return NextResponse.json({ data: cached });
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
