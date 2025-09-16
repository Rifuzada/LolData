import { NextResponse } from "next/server";

const RIOT_API_KEY = process.env.RIOT_API_KEY;

async function fetchLeague(region: string, queueType: string, tier: "challenger" | "grandmaster" | "master") {
  const url = `https://${region}.api.riotgames.com/lol/league/v4/${tier}leagues/by-queue/${queueType}?api_key=${RIOT_API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Erro ao buscar ${tier}: ${res.status}`);
  return res.json();
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const region = searchParams.get("region");
    const queueType = searchParams.get("queueType") || "RANKED_SOLO_5x5";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "100");

    if (!region) {
      return NextResponse.json({ error: "Missing region" }, { status: 400 });
    }

    // Buscar Challenger, GM e Master
    const [challenger, grandmaster, master] = await Promise.all([
      fetchLeague(region, queueType, "challenger"),
      fetchLeague(region, queueType, "grandmaster"),
      fetchLeague(region, queueType, "master"),
    ]);

    // Unir e ordenar por LP
    const allEntries = [
      ...challenger.entries,
      ...grandmaster.entries,
      ...master.entries,
    ].sort((a, b) => b.leaguePoints - a.leaguePoints);

    // Calcular paginação
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedEntries = allEntries.slice(startIndex, endIndex);

    const response = {
      tier: "CHALLENGER+GM+MASTER",
      queue: queueType,
      name: `${region} Combined Leaderboard`,
      entries: paginatedEntries,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(allEntries.length / limit),
        totalEntries: allEntries.length,
        entriesPerPage: limit,
        hasNextPage: endIndex < allEntries.length,
        hasPreviousPage: page > 1
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Erro no endpoint /api/rankings:", error);
    return NextResponse.json({ error: "Failed to fetch rankings" }, { status: 500 });
  }
}
