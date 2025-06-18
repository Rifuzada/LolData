import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getRegionalApiUrl } from '@/app/utils/helpers';
import { OptimisticCache } from '@/app/utils/optimisticCacheApi';

const accountSchema = z.object({
  summonerName: z.string().min(3).max(16),
  region: z.string().min(2).max(4)
});

const accountCache = new OptimisticCache<any>(60_000);

export async function GET(request: NextRequest) {
  try {
    const cacheKey = request.url;
    const cached = await accountCache.getOrFetch(cacheKey, async () => {
      const { searchParams } = new URL(request.url);
      const summonerName = searchParams.get('summonerName');
      const region = searchParams.get('region');

      const validatedData = accountSchema.parse({ summonerName, region });
      const { RIOT_API_KEY } = process.env;

      if (!RIOT_API_KEY) {
        throw new Error('API key not configured');
      }

      const regionalUrl = getRegionalApiUrl(validatedData.region);
      const response = await fetch(
        `${regionalUrl}/lol/summoner/v4/summoners/by-name/${encodeURIComponent(validatedData.summonerName)}`,
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
