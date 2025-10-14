import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getRegionalApiUrl } from '@/app/utils/helpers';

const masteriesSchema = z.object({
  puuid: z.string().min(10),
  region: z.string().min(2).max(4)
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const puuid = searchParams.get('puuid');
    const region = searchParams.get('region');

    const validatedData = masteriesSchema.parse({ puuid, region });
    const { RIOT_API_KEY } = process.env;

    if (!RIOT_API_KEY) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    const regionalUrl = getRegionalApiUrl(validatedData.region);
    const response = await fetch(
      `${regionalUrl}/lol/champion-mastery/v4/champion-masteries/by-puuid/${validatedData.puuid}`,
      {
        headers: {
          'X-Riot-Token': RIOT_API_KEY
        }
      }
    );
    

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { error: error.status.message || 'Failed to fetch champion masteries' },
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
