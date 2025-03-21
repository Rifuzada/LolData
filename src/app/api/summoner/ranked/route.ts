import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getRegionalApiUrl } from '@/app/utils/helpers';

const rankedSchema = z.object({
  summonerId: z.string().min(10),
  region: z.string().min(2).max(4)
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const summonerId = searchParams.get('summonerId');
    const region = searchParams.get('region');

    const validatedData = rankedSchema.parse({ summonerId, region });
    const { RIOT_API_KEY } = process.env;

    if (!RIOT_API_KEY) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
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
      return NextResponse.json(
        { error: error.status.message || 'Failed to fetch ranked data' },
        { status: response.status }
      );
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