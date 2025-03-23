import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { AMERICAS_API_URL, EUROPE_API_URL, ASIA_API_URL, SEA_API_URL } from '@/app/utils/helpers';

const matchesSchema = z.object({
  region: z.string().min(1),
  puuid: z.string().min(10),
  start: z.string().transform(val => Number(val || 0)).default('0'),
  count: z.string().transform(val => Number(val || 20)).default('20')
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const puuid = searchParams.get('puuid');
    const region = searchParams.get('region');
    const start = searchParams.get('start') || '0';
    const count = searchParams.get('count') || '20';

    const validatedData = matchesSchema.parse({ region, puuid, start, count });
    const { RIOT_API_KEY } = process.env;

    if (!RIOT_API_KEY) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    let matchIdsResponse;

    if (validatedData.region.includes('euw1') || validatedData.region.includes('eun1') || validatedData.region.includes('ru') || validatedData.region.includes('tr1') || validatedData.region.includes('me1')) {
      matchIdsResponse = await fetch(
        `${EUROPE_API_URL}/lol/match/v5/matches/by-puuid/${validatedData.puuid}/ids?start=${validatedData.start}&count=${validatedData.count}`,
        {
          headers: {
            'X-Riot-Token': RIOT_API_KEY
          }
        }
      );
    } else if (validatedData.region.includes('jp1') || validatedData.region.includes('kr')) {
      matchIdsResponse = await fetch(
        `${ASIA_API_URL}/lol/match/v5/matches/by-puuid/${validatedData.puuid}/ids?start=${validatedData.start}&count=${validatedData.count}`,
        {
          headers: {
            'X-Riot-Token': RIOT_API_KEY
          }
        }
      );
    } else if (validatedData.region.includes('oc1') || validatedData.region.includes('tw2') || validatedData.region.includes('vn2')) {
      matchIdsResponse = await fetch(
        `${SEA_API_URL}/lol/match/v5/matches/by-puuid/${validatedData.puuid}/ids?start=${validatedData.start}&count=${validatedData.count}`,
        {
          headers: {
            'X-Riot-Token': RIOT_API_KEY
          }
        }
      );
    } else {
      matchIdsResponse = await fetch(
        `${AMERICAS_API_URL}/lol/match/v5/matches/by-puuid/${validatedData.puuid}/ids?start=${validatedData.start}&count=${validatedData.count}`,
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

    // Busca os detalhes de cada partida
    const matchDetailsPromises = matchIds.map((matchId: string) =>
      fetch(`${AMERICAS_API_URL}/lol/match/v5/matches/${matchId}`, {
        headers: {
          'X-Riot-Token': RIOT_API_KEY
        }
      }).then(res => res.json())
    );

    const matchDetails = await Promise.all(matchDetailsPromises);
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