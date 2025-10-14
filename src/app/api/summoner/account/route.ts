import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getRegionalApiUrl } from '@/app/utils/helpers';
import { OptimisticCache } from '@/app/utils/optimisticCacheApi';

const accountSchema = z.object({
  summonerName: z.string().min(3).max(16).optional(),
  region: z.string().min(2).max(4),
  puuid: z.string().optional(),
});

const accountCache = new OptimisticCache<any>(60_000);

export async function GET(request: NextRequest) {
  try {
    // Use nextUrl to access parsed URL/search params safely in Next.js app routes
    const { searchParams } = request.nextUrl;
    const summonerName = searchParams.get('summonerName');
    const region = searchParams.get('region');
    const puuid = searchParams.get('puuid');

    // Build a deterministic cache key from relevant params (avoid using full request.url)
    const cacheKey = `account:${region || 'unknown'}:name:${summonerName || ''}:puuid:${puuid || ''}`;

    const cached = await accountCache.getOrFetch(cacheKey, async () => {
      const validatedData = accountSchema.parse({ summonerName, region, puuid });
      const { RIOT_API_KEY } = process.env;

      if (!RIOT_API_KEY) {
        throw new Error('API key not configured');
      }

      const regionalUrl = getRegionalApiUrl(validatedData.region);
      let endpoint = '';
      
      // Determina qual endpoint usar baseado nos parâmetros fornecidos
      if (validatedData.puuid) {
        endpoint = `/lol/summoner/v4/summoners/by-puuid/${validatedData.puuid}`;
      } else if (validatedData.summonerName) {
        endpoint = `/lol/summoner/v4/summoners/by-name/${encodeURIComponent(validatedData.summonerName)}`;
      } else {
        throw new Error('Either summonerName or puuid must be provided');
      }

      const response = await fetch(
        `${regionalUrl}${endpoint}`,
        {
          headers: {
            'X-Riot-Token': RIOT_API_KEY
          }
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.status.message || 'Failed to fetch summoner data');
      }

      const data = await response.json();
      return data;
    });

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
