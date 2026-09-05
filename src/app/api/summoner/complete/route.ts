// src/app/api/summoner/complete/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getRegionalApiUrl } from "@/app/utils/helpers";

const schema = z.object({
  summonerName: z.string().min(3).max(16),
  region: z.string().min(2).max(4),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const summonerName = searchParams.get("summonerName");
    const region = searchParams.get("region");

    const { summonerName: name, region: reg } = schema.parse({ summonerName, region });
    const RIOT_API_KEY = process.env.RIOT_API_KEY;
    if (!RIOT_API_KEY) throw new Error("Missing API key");

    const regionalUrl = getRegionalApiUrl(reg);

    // 1. Buscar summoner (para obter puuid)
    const summonerRes = await fetch(
      `${regionalUrl}/lol/summoner/v4/summoners/by-name/${encodeURIComponent(name)}`,
      { headers: { "X-Riot-Token": RIOT_API_KEY } }
    );
    if (!summonerRes.ok) throw new Error("Summoner not found");
    const summoner = await summonerRes.json();
    const puuid = summoner.puuid;

    // 2. Buscar masteries e partidas em PARALELO
    const [masteriesRes, matchesRes] = await Promise.all([
      fetch(
        `${regionalUrl}/lol/champion-mastery/v4/champion-masteries/by-puuid/${puuid}`,
        { headers: { "X-Riot-Token": RIOT_API_KEY } }
      ),
      fetch(
        `${regionalUrl}/lol/match/v5/matches/by-puuid/${puuid}/ids?start=0&count=20`,
        { headers: { "X-Riot-Token": RIOT_API_KEY } }
      )
    ]);

    const masteries = masteriesRes.ok ? await masteriesRes.json() : null;
    const matchIds = matchesRes.ok ? await matchesRes.json() : [];

    return NextResponse.json({
      summoner,
      masteries,
      matchIds,
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
