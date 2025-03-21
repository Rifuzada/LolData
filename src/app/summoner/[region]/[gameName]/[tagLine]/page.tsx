import { Suspense } from "react";
import { MatchHistory } from "@/app/components/match/MatchHistory";
import { SummonerProfile } from "@/app/components/summoner/SummonerProfile";
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
    // Buscar dados do invocador
    const summoner = await getSummonerByRiotId(region, gameName, tagLine);

    // Buscar dados em paralelo
    const [queueTypes, masteries, matches] = await Promise.all([
      getQueueTypes(),
      getChampionMasteries(region, summoner.puuid),
      getMatchHistory(region, summoner.puuid),
    ]);

    return (
      <main className="container mx-auto min-h-screen space-y-8 py-8">
        <div className="relative">
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background/80 to-background" />
          <SummonerProfile
            name={summoner.name}
            level={summoner.summonerLevel}
            profileIconId={summoner.profileIconId}
            region={region.toUpperCase()}
            masteries={masteries.slice(0, 5).map((mastery: ChampionMastery) => ({
              championId: mastery.championId,
              championName: mastery.championName,
              level: mastery.championLevel,
              points: mastery.championPoints
            }))}
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
              matches={matches}
              puuid={summoner.puuid}
              queueTypes={queueTypes}
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
