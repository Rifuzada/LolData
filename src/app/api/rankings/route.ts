import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const API_KEY = process.env.RIOT_API_KEY;

// Função utilitária para tratar 429 com retry
async function safeAxios<T = any>(config: any, retries = 3): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await axios(config);
      return res.data as T;
    } catch (error: any) {
      if (error.response && error.response.status === 429) {
        const retryAfter = Number(error.response.headers['retry-after']) || 1;
        await new Promise(r => setTimeout(r, retryAfter * 1000));
        continue;
      }
      throw error;
    }
  }
  // Última tentativa, se ainda falhar, lança o erro
  const res = await axios(config);
  return res.data as T;
}

async function getChallengerLeague(region: string, queueType: string) {
  try {
    const data = await safeAxios({
      method: 'get',
      url: `https://${region}.api.riotgames.com/lol/league/v4/challengerleagues/by-queue/${queueType}`,
      headers: {
        "X-Riot-Token": API_KEY
      }
    });
    return data;
  } catch (error) {
    throw new Error('Falha ao buscar dados do ranking Challenger');
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const region = searchParams.get('region');
  const queueType = searchParams.get('queueType') || 'RANKED_SOLO_5x5'; // valor default é solo

  if (!region) {
    return NextResponse.json({ error: 'Missing region parameter' }, { status: 400 });
  }

  // Validar queueType
  if (queueType !== 'RANKED_SOLO_5x5' && queueType !== 'RANKED_FLEX_SR') {
    return NextResponse.json({ error: 'Invalid queue type. Must be RANKED_SOLO_5x5 or RANKED_FLEX_SR' }, { status: 400 });
  }

  try {
    const rankings = await getChallengerLeague(region, queueType);
    return NextResponse.json(rankings);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
