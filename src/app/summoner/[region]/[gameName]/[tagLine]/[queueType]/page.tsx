import { Suspense, useEffect } from "react";
import { MatchHistory } from "@/app/components/match/MatchHistory";
import { SummonerProfile } from "@/app/components/summoner/SummonerProfile";
import { SummonerSearch } from "@/app/components/summoner/SummonerSearch";
import { getChampionMasteries, getMatchHistory, getQueueTypes, getSummonerByRiotId, getMatchHistoryByQueue } from "@/app/actions/summoner";
import { MatchFilter } from "@/app/components/match/MatchFilter";
import { MatchHistoryFiltred } from "@/app/components/match/MatchHistoryFiltred";

interface ChampionMastery {
  championId: number;
  championLevel: number;
  championPoints: number;
  championName: string;
}

interface SummonerPageProps {
  params: {
    region: string;
    gameName: string;
    tagLine: string;
    queueType: string;
  };
}

export default async function SummonerPage({ params }: SummonerPageProps) {
  const { region, gameName, tagLine, queueType } = params;
  const queueId = queueType.replace('soloDuo', '420').replace('flex', '440').replace('aram', '450').replace('normal', '400').replace('quickplay', '490').replace('arena', '1700');

  try {
    // Buscar dados do invocador
    const summoner = await getSummonerByRiotId(region, gameName, tagLine);

    // Decodificar o tagLine
    const decodedGameName = decodeURIComponent(gameName);
    const decodedTagLine = decodeURIComponent(tagLine);

    // Buscar dados em paralelo
    const [queueTypes, masteries, matchesByQueue, rankedData] = await Promise.all([
      getQueueTypes(),
      getChampionMasteries(region, summoner.puuid),
      getMatchHistoryByQueue(region, summoner.puuid, queueId),
      fetch(`https://${region}.api.riotgames.com/lol/league/v4/entries/by-summoner/${summoner.id}`, {
        headers: {
          'X-Riot-Token': process.env.RIOT_API_KEY as string
        }
      }).then(res => res.json())
    ]);

    // Processa dados de ranqueadas
    const soloQData = rankedData.find((queue: any) => queue.queueType === "RANKED_SOLO_5x5");
    const flexData = rankedData.find((queue: any) => queue.queueType === "RANKED_FLEX_SR");

    // Formata informações de elo
    const formatElo = (entry: any) => entry ? `${entry.tier.charAt(0) + entry.tier.slice(1).toLowerCase()} ${entry.rank}` : null;
    const eloSoloq = formatElo(soloQData);
    const eloFlex = formatElo(flexData);

    // Garante que os pontos de liga sejam números válidos
    const lpSoloq = soloQData && typeof soloQData.leaguePoints === 'number' ? soloQData.leaguePoints : null;
    const lpFlex = flexData && typeof flexData.leaguePoints === 'number' ? flexData.leaguePoints : null;
    const regionTranslated = region.slice(0, 2).toUpperCase();
    
    return (
      <main className="container mx-auto min-h-screen space-y-8 py-8">
        <SummonerSearch defaultRegion={region} />
        <div className="relative">
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background/80 to-background" />
          <SummonerProfile
            name={summoner.name}
            gameName={decodedGameName}
            tagLine={decodedTagLine} // Use o tagLine decodificado
            level={summoner.summonerLevel}
            profileIconId={summoner.profileIconId}
            region={regionTranslated}
            masteries={(masteries as ChampionMastery[]).slice(0, 5).map((mastery) => ({
              championId: mastery.championId,
              championName: mastery.championName,
              level: mastery.championLevel,
              points: mastery.championPoints
            }))}
            eloSoloq={eloSoloq}
            eloFlex={eloFlex}
            lpSoloq={lpSoloq}
            lpFlex={lpFlex}
            winsSoloq={soloQData?.wins}
            losesSoloq={soloQData?.losses}
            winsFlex={flexData?.wins}
            losesFlex={flexData?.losses}
          />
        </div>

        <div className="rounded-lg border bg-card p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold">Match History</h2>
            <p className="text-sm text-muted-foreground">
              Recent games played by {summoner.name}
            </p>
            <MatchFilter />
          </div>
          <Suspense
            fallback={
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-32 animate-pulse rounded-lg bg-muted/50"
                  />
                ))}
              </div>
            }
          >
            <MatchHistoryFiltred
              matchesByQueue={(matchesByQueue as any[])}
              puuid={summoner.puuid}
              queueTypes={(queueTypes as any)}
            />
          </Suspense>
        </div>
      </main>
    );
  } catch (error) {
    console.error('Erro ao carregar dados:', error);
    return (
      <main className="container mx-auto min-h-screen py-8">
        <div className="rounded-lg border border-destructive bg-destructive/10 p-6 text-destructive">
          <h2 className="text-lg font-semibold">Erro ao carregar dados</h2>
          <p>Não foi possível carregar os dados do invocador. Por favor, tente novamente mais tarde.</p>
        </div>
      </main>
    );
  }
}
