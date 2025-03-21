import { Suspense } from "react";
import { MatchHistory } from "@/app/components/match/MatchHistory";
import { SummonerProfile } from "@/app/components/summoner/SummonerProfile";
import { SummonerSearch } from "@/app/components/summoner/SummonerSearch";
import { getChampionMasteries, getMatchHistory, getQueueTypes, getSummonerByRiotId } from "@/app/actions/summoner";

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
  };
}

export default async function SummonerPage({ params }: SummonerPageProps) {
  const { region, gameName, tagLine } = params;

  try {
    // Log dos parâmetros antes da decodificação
    console.log("Parâmetros da URL:", {
      region,
      gameName: decodeURIComponent(gameName),
      tagLine: decodeURIComponent(tagLine)
    });

    // Buscar dados do invocador
    const summoner = await getSummonerByRiotId(region, gameName, tagLine);

    // Log para depuração
    console.log("Dados do invocador:", JSON.stringify(summoner, null, 2));

    // Buscar dados em paralelo
    const [queueTypes, masteries, matches, rankedData] = await Promise.all([
      getQueueTypes(),
      getChampionMasteries(region, summoner.puuid),
      getMatchHistory(region, summoner.puuid),
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

    // Log para depuração dos dados de elo
    console.log("Dados de elo:", {
      soloQ: { elo: eloSoloq, lp: lpSoloq, raw: soloQData },
      flex: { elo: eloFlex, lp: lpFlex, raw: flexData }
    });

    return (
      <main className="container mx-auto min-h-screen space-y-8 py-8">
        <SummonerSearch defaultRegion={region} />

        <div className="relative">
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background/80 to-background" />
          <SummonerProfile
            name={summoner.name}
            gameName={gameName}
            tagLine={tagLine}
            level={summoner.summonerLevel}
            profileIconId={summoner.profileIconId}
            region={region.toUpperCase()}
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
          />
        </div>

        <div className="rounded-lg border bg-card p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold">Match History</h2>
            <p className="text-sm text-muted-foreground">
              Recent games played by {summoner.name}
            </p>
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
            <MatchHistory
              matches={(matches as any[])}
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
