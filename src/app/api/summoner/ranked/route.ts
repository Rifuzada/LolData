import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { z } from 'zod';
import { getRegionalApiUrl } from '@/app/utils/helpers';

const rankedSchema = z.object({
  summonerId: z.string().min(10),
  region: z.string().min(2).max(4)
});

export async function GET(request: NextRequest) {
  try {
  // Use request.nextUrl to safely access the parsed URL/search params
  const urlObj = request.nextUrl;
    const refresh = urlObj.searchParams.get('refresh') === '1';

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
    return NextResponse.json({ data });
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
