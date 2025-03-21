import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { AMERICAS_API_URL } from '@/app/utils/helpers';

const matchesSchema = z.object({
  puuid: z.string().min(10),
  start: z.string().transform(val => Number(val || 0)).default('0'),
  count: z.string().transform(val => Number(val || 20)).default('20')
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const puuid = searchParams.get('puuid');
    const start = searchParams.get('start') || '0';
    const count = searchParams.get('count') || '20';

    const validatedData = matchesSchema.parse({ puuid, start, count });
    const { RIOT_API_KEY } = process.env;

    if (!RIOT_API_KEY) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    // Busca os IDs das partidas
    const matchIdsResponse = await fetch(
      `${AMERICAS_API_URL}/lol/match/v5/matches/by-puuid/${validatedData.puuid}/ids?start=${validatedData.start}&count=${validatedData.count}`,
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