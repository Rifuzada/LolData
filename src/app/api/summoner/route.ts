import { NextRequest, NextResponse } from 'next/server';
import { getSummonerByRiotId, getChampionMasteries, getMatchHistory, getQueueTypes, getMatchHistoryByQueue, getRankedBySummonerId } from '@/app/actions/summoner';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get('action');
  const region = searchParams.get('region');
  const gameName = searchParams.get('gameName');
  const tagLine = searchParams.get('tagLine');
  const puuid = searchParams.get('puuid');
  const queueId = searchParams.get('queueId');
  const summonerId = searchParams.get('summonerId');

  if (!action) {
    return NextResponse.json({ error: 'Missing action parameter' }, { status: 400 });
  }

  try {
    switch (action) {
      case 'summoner':
        if (!region || !gameName || !tagLine) {
          return NextResponse.json(
            { error: 'Missing required parameters' },
            { status: 400 }
          );
        }
        const summoner = await getSummonerByRiotId(region, gameName, tagLine);
        return NextResponse.json(summoner);

      case 'masteries':
        if (!region || !puuid) {
          return NextResponse.json(
            { error: 'Missing required parameters' },
            { status: 400 }
          );
        }
        const masteries = await getChampionMasteries(region, puuid);
        return NextResponse.json(masteries);

      case 'matches':
        if (!region || !puuid) {
          return NextResponse.json(
            { error: 'Missing required parameters' },
            { status: 400 }
          );
        }
        const matches = await getMatchHistory(region, puuid);
        return NextResponse.json(matches);

      case 'matchesByQueue':
        if (!region || !puuid || !queueId) {
          return NextResponse.json(
            { error: 'Missing required parameters' },
            { status: 400 }
          );
        }
        const matchesByQueue = await getMatchHistoryByQueue(region, puuid, queueId);
        return NextResponse.json(matchesByQueue);

      case 'queueTypes':
        const queueTypes = await getQueueTypes();
        return NextResponse.json(queueTypes);

      case 'ranked':
        if (!region || !summonerId) {
          return NextResponse.json(
            { error: 'Missing required parameters' },
            { status: 400 }
          );
        }
        const ranked = await getRankedBySummonerId(region, summonerId);
        return NextResponse.json(ranked);

      default:
        return NextResponse.json(
          { error: 'Invalid action parameter' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
