import { Suspense } from "react";
import { SummonerProfile } from "@/app/components/summoner/SummonerProfile";
import { SummonerSearch } from "@/app/components/summoner/SummonerSearch";
import { getChampionMasteries, getQueueTypes, getSummonerByRiotId, getRankedByPuuid } from "@/app/actions/summoner";
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
    championName: string;
  };
}

// Função para traduzir region para sigla "bonita"
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

export async function generateMetadata({ params }: SummonerPageProps) {
  const { gameName, tagLine, region } = params;
  const regionDisplay = getRegionDisplay(region);
  return {
    icons: {
      icon: '/favicon.ico',
    },
    title: `${gameName}#${tagLine}(${regionDisplay}) - LolData `,
    description: `${gameName}#${tagLine}(${regionDisplay}) - LolData\n` + 'Visualize suas estatísticas do League of Legends',
  };
}

export default async function SummonerPage({ params }: SummonerPageProps) {
  const { region, gameName, tagLine, queueType, championName } = params;
  const queueIdFromUrl = queueType
    .replace('soloDuo', '420')
    .replace('flex', '440')
    .replace('aram', '450')
    .replace('normal', '400')
    .replace('quickplay', '490')
    .replace('arena', '1700');
  const queueId = queueIdFromUrl;

  try {
    // Buscar dados do invocador
    const summoner = await getSummonerByRiotId(region, gameName, tagLine);

    // Decodificar o tagLine
    const decodedGameName = decodeURIComponent(gameName);
    const decodedTagLine = decodeURIComponent(tagLine);

    // Buscar dados em paralelo
    const [queueTypes, masteries, rankedData] = await Promise.all([
      getQueueTypes(),
      getChampionMasteries(region, summoner.puuid),
      getRankedByPuuid(region, summoner.puuid)
    ]);

    // Defina a base da URL do seu site
    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`) ||
      "http://localhost:3000";

    // Buscar histórico de partidas já filtrado via API interna
    const matchesRes = await fetch(
      queueId === "all"
        ? `${baseUrl}/api/summoner/matches?region=${region}&puuid=${summoner.puuid}&count=10`
        : `${baseUrl}/api/summoner/matchesByQueue?region=${region}&puuid=${summoner.puuid}&queueId=${queueId}&count=10`,
      { cache: "no-store" }
    );
    const contentType = matchesRes.headers.get('content-type');
    if (!matchesRes.ok || !contentType?.includes('application/json')) {
      const text = await matchesRes.text();
      throw new Error(`Erro na API de partidas: ${matchesRes.status} - ${text}`);
    }
    const matchesJson = await matchesRes.json();
    let filteredMatches = matchesJson.data || [];

    // Agora filtre manualmente pelo championName, se necessário
    if (championName && championName.toLowerCase() !== "all") {
      filteredMatches = filteredMatches.filter(
        (match: any) =>
          match.info?.participants?.some((p: any) => {
            if (!p.puuid || !p.championName) return false;
            // Normaliza para evitar problemas de case/acentuação
            const champA = String(p.championName).normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
            const champB = championName.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
            return p.puuid === summoner.puuid && champA === champB;
          })
      );
    }

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
    const regionTranslated = getRegionDisplay(region);

    return (
      <main className="container min-h-screen py-8 mx-auto space-y-8">
        <SummonerSearch defaultRegion={region} />
        <div className="relative">
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background/80 to-background" />
          <SummonerProfile
            name={summoner.name}
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
        </div>

        <div className="p-6 border rounded-lg bg-card">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold">Match History</h2>
            <p className="text-sm text-muted-foreground">
              Recent games played by {decodedGameName} on {queueType} with {championName}
            </p>
            <MatchFilter />
          </div>
          <Suspense
            fallback={
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-32 rounded-lg animate-pulse bg-muted/50"
                  />
                ))}
              </div>
            }
          >
            <MatchHistoryFiltred
              matchesByQueue={filteredMatches as any[]}
              puuid={summoner.puuid}
              queueTypes={queueTypes as any}
              region={region}
              queueId={queueId}
            />
          </Suspense>
        </div>
      </main>
    );
  } catch (error) {
    console.error('Erro ao carregar dados:', error);
    return (
      <main className="container min-h-screen py-8 mx-auto">
        <div className="p-6 border rounded-lg border-destructive bg-destructive/10 text-destructive">
          <h2 className="text-lg font-semibold">Erro ao carregar dados</h2>
          <p>Não foi possível carregar os dados do invocador. Por favor, tente novamente mais tarde.</p>
        </div>
      </main>
    );
  }
}
