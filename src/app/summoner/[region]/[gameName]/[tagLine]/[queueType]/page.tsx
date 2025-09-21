import { Suspense, useEffect } from "react";
import { SummonerProfile } from "@/app/components/summoner/SummonerProfile";
import { SummonerSearch } from "@/app/components/summoner/SummonerSearch";
import { getChampionMasteries, getMatchHistory, getQueueTypes, getSummonerByRiotId, getMatchHistoryByQueue, getRankedByPuuid } from "@/app/actions/summoner";
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

function getRegionDisplay(region: string) {
  return region
    .replace(/^br1$/i, 'BR')
    .replace(/^la1$/i, 'LAN')
    .replace(/^la2$/i, 'LAS')
    .replace(/^na1$/i, 'NA')
    .replace(/^euw1$/i, 'EUW')
    .replace(/^eun1$/i, 'EUNE')
    .replace(/^kr$/i, 'KR')
    .replace(/^jp1$/i, 'JP')
    .replace(/^ru$/i, 'RU')
    .replace(/^tr1$/i, 'TR')
    .replace(/^oc1$/i, 'OCE')
    .replace(/^tw2$/i, 'TW')
    .replace(/^vn2$/i, 'VN')
    .replace(/^sg2$/i, 'SG')
    .replace(/^me1$/i, 'ME');
}

export default async function SummonerPage({ params }: SummonerPageProps) {
  const { region, gameName, tagLine, queueType } = params;
  const queueId = queueType
    .replace('soloDuo', '420')
    .replace('flex', '440')
    .replace('aram', '450')
    .replace('normal', '400')
    .replace('quickplay', '490')
    .replace('arena', '1700');

  try {
    // Buscar dados do invocador
    const summoner = await getSummonerByRiotId(region, gameName, tagLine);
    
    if (!summoner || !summoner.puuid) {
      throw new Error('Não foi possível encontrar o invocador');
    }

    // Decodificar o tagLine
    const decodedGameName = decodeURIComponent(gameName);
    const decodedTagLine = decodeURIComponent(tagLine);

    // Buscar dados em paralelo
    const [queueTypes, masteries, matchesByQueue, rankedData] = await Promise.all([
      getQueueTypes(),
      getChampionMasteries(region, summoner.puuid),
      queueId === "all"
        ? getMatchHistory(region, summoner.puuid)
        : getMatchHistoryByQueue(region, summoner.puuid, queueId),
      getRankedByPuuid(region, summoner.puuid)
    ]);

    // Processa dados de ranqueadas
    const soloQData = rankedData.find((queue: any) => queue.queueType === "RANKED_SOLO_5x5");
    const flexData = rankedData.find((queue: any) => queue.queueType === "RANKED_FLEX_SR");

    // Formata informações de elo
    const formatElo = (entry: any) => {
      if (!entry) return null;
      
      const tier = entry.tier.charAt(0) + entry.tier.slice(1).toLowerCase();
      const highTiers = ['CHALLENGER', 'GRANDMASTER', 'MASTER'];
      
      return highTiers.includes(entry.tier) ? tier : `${tier} ${entry.rank}`;
    };

    const eloSoloq = formatElo(soloQData);
    const eloFlex = formatElo(flexData);

    // Garante que os pontos de liga sejam números válidos
    const lpSoloq = soloQData && typeof soloQData.leaguePoints === 'number' ? soloQData.leaguePoints : null;
    const lpFlex = flexData && typeof flexData.leaguePoints === 'number' ? flexData.leaguePoints : null;
    const regionTranslated = getRegionDisplay(region);
    
    return (
      <div className="flex flex-col min-h-screen">
        <header role="banner" className="w-full">
          <nav role="navigation" aria-label="Pesquisa de invocador">
            <SummonerSearch defaultRegion={region} />
          </nav>
        </header>

        <main className="container flex-grow py-8 mx-auto space-y-8" role="main">
          <div className="relative">
            <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background/80 to-background" />
            <section aria-label="Perfil do Invocador">
              <SummonerProfile
                name={summoner.name ?? decodedGameName}
                gameName={decodedGameName}
                tagLine={decodedTagLine}
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
            </section>
          </div>

          <section className="p-6 border rounded-lg bg-card" aria-label="Histórico de Partidas">
            <header className="mb-6">
              <h2 className="text-2xl font-semibold">Match History</h2>
              <p className="text-sm text-muted-foreground">
                Recent games played by {decodedGameName} on {queueType} with all champions
              </p>
              <MatchFilter />
            </header>
            <Suspense
              fallback={
                <div className="space-y-4" role="status" aria-label="Carregando partidas">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-32 rounded-lg animate-pulse bg-muted/50"
                      aria-hidden="true"
                    />
                  ))}
                </div>
              }
            >
              <MatchHistoryFiltred
                matchesByQueue={(matchesByQueue as any[])}
                puuid={summoner.puuid}
                queueTypes={(queueTypes as any)}
                region={region}
                queueId={queueId}
              />
            </Suspense>
          </section>
        </main>

        <footer role="contentinfo" className="w-full py-4 mt-auto">
          <div className="container mx-auto">
            <div className="p-6 text-sm text-center text-muted-foreground">
              <p>© {new Date().getFullYear()} LolData - Dados fornecidos pela API da Riot Games</p>
            </div>
          </div>
        </footer>
      </div>
    );
  } catch (error) {
    console.error('Erro ao carregar dados:', error);
    return (
      <div className="flex flex-col min-h-screen">
        <main className="container flex-grow py-8 mx-auto" role="main">
          <div 
            className="p-6 border rounded-lg border-destructive bg-destructive/10 text-destructive"
            role="alert"
            aria-live="assertive"
          >
            <h2 className="text-lg font-semibold">Erro ao carregar dados</h2>
            <p>Não foi possível carregar os dados do invocador. Por favor, tente novamente mais tarde.</p>
          </div>
        </main>
      </div>
    );
  }
}
