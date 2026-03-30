import { Suspense } from "react";
import { SummonerProfile } from "@/app/components/summoner/SummonerProfile";
import { SummonerSearch } from "@/app/components/summoner/SummonerSearch";
import {
  getChampionMasteries,
  getQueueTypes,
  getSummonerByRiotId,
  getRankedByPuuid,
} from "@/app/actions/summoner";
import { MatchFilter } from "@/app/components/match/MatchFilter";
import { MatchHistoryFiltred } from "@/app/components/match/MatchHistoryFiltred";
import { MatchStatsText } from "@/app/components/match/MatchStatsText";

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
    .replace(/^br1$/i, "BR")
    .replace(/^la1$/i, "LAN")
    .replace(/^la2$/i, "LAS")
    .replace(/^na1$/i, "NA")
    .replace(/^euw1$/i, "EUW")
    .replace(/^eun1$/i, "EUNE")
    .replace(/^kr$/i, "KR")
    .replace(/^jp1$/i, "JP")
    .replace(/^ru$/i, "RU")
    .replace(/^tr1$/i, "TR")
    .replace(/^oc1$/i, "OCE")
    .replace(/^tw2$/i, "TW")
    .replace(/^vn2$/i, "VN")
    .replace(/^sg2$/i, "SG")
    .replace(/^me1$/i, "ME");
}

export async function generateMetadata({ params }: SummonerPageProps) {
  const { gameName, tagLine, region } = await params;
  const regionDisplay = getRegionDisplay(region);
  return {
    icons: {
      icon: "/favicon.ico",
    },
    title: `${gameName}#${tagLine}(${regionDisplay}) - LolData `,
    description:
      `${gameName}#${tagLine}(${regionDisplay}) - LolData\n` +
      "Visualize suas estatísticas do League of Legends",
  };
}

export default async function SummonerPage({
  params,
}: {
  params: Promise<SummonerPageProps["params"]>;
}) {
  console.log("🔥 [PAGE] Entrou na SummonerPage");

  const { region, gameName, tagLine, queueType, championName } = await params;

  const decodedGameName = decodeURIComponent(gameName);
  const decodedTagLine = decodeURIComponent(tagLine);

  console.log("📥 Params:", {
    region,
    gameName,
    tagLine,
    queueType,
    championName,
  });

  const queueIdFromUrl = (queueType || "")
    .replace("soloDuo", "420")
    .replace("flex", "440")
    .replace("aram", "450")
    .replace("normal", "400")
    .replace("quickplay", "490")
    .replace("arena", "1700");

  const queueId = queueIdFromUrl;

  try {
    console.log("🚀 [1] Buscando summoner...");

    const summoner = await getSummonerByRiotId(region, gameName, tagLine);

    console.log("✅ [2] Summoner:", summoner?.puuid);

    const [queueTypes, masteries, rankedData] = await Promise.all([
      getQueueTypes(),
      getChampionMasteries(region, summoner.puuid),
      getRankedByPuuid(region, summoner.puuid),
    ]);

    console.log("📊 [3] Dados paralelos carregados");

    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`) ||
      "http://localhost:3000";

    let url = `${baseUrl}/api/summoner/matches?region=${region}&puuid=${summoner.puuid}&count=20`;

    // Se o usuário escolheu um queue específico, adiciona queueId
    if (queueId && queueId !== "all") {
      url += `&queueId=${queueId}`;
    }

    // Adiciona filtro por campeão, se houver
    if (championName && championName !== "all") {
      url += `&championName=${championName}`;
    }

    // Adiciona filtro por gameName, se houver
    if (gameName && gameName !== "all") {
      url += `&gameName=${gameName}`;
    }

    // Adiciona filtro por tagLine, se houver
    if (tagLine && tagLine !== "all") {
      url += `&tagLine=${tagLine}`;
    }

    console.log("🌐 [4] Fetch URL:", url);

    const matchesRes = await fetch(url, { cache: "no-store" });

    console.log("📡 [5] Status:", matchesRes.status);

    const contentType = matchesRes.headers.get("content-type");
    console.log("📦 [6] Content-Type:", contentType);

    if (!matchesRes.ok || !contentType?.includes("application/json")) {
      const text = await matchesRes.text();
      console.error("❌ [ERRO API]:", text);
      throw new Error(
        `Erro na API de partidas: ${matchesRes.status} - ${text}`,
      );
    }

    const matchesJson = await matchesRes.json();

    console.log("🎮 [7] Matches recebidos:", matchesJson);

    let filteredMatches = matchesJson.data || [];

    console.log("🧹 [8] Total matches:", filteredMatches.length);

    // Agora filtre manualmente pelo championName, se necessário
    if (championName && championName.toLowerCase() !== "all") {
      filteredMatches = filteredMatches.filter((match: any) =>
        match.info?.participants?.some((p: any) => {
          if (!p.puuid || !p.championName) return false;
          // Normaliza para evitar problemas de case/acentuação
          const champA = String(p.championName)
            .normalize("NFD")
            .replace(/\p{Diacritic}/gu, "")
            .toLowerCase();
          const champB = championName
            .normalize("NFD")
            .replace(/\p{Diacritic}/gu, "")
            .toLowerCase();
          return p.puuid === summoner.puuid && champA === champB;
        }),
      );
    }

    // Processa dados de ranqueadas
    const soloQData = rankedData.find(
      (queue: any) => queue.queueType === "RANKED_SOLO_5x5",
    );
    const flexData = rankedData.find(
      (queue: any) => queue.queueType === "RANKED_FLEX_SR",
    );

    // Formata informações de elo
    const formatElo = (entry: any) => {
      if (!entry) return null;

      const tier = entry.tier.charAt(0) + entry.tier.slice(1).toLowerCase();
      const highTiers = ["CHALLENGER", "GRANDMASTER", "MASTER"];

      return highTiers.includes(entry.tier) ? tier : `${tier} ${entry.rank}`;
    };
    const eloSoloq = formatElo(soloQData);
    const eloFlex = formatElo(flexData);

    // Garante que os pontos de liga sejam números válidos
    const lpSoloq =
      soloQData && typeof soloQData.leaguePoints === "number"
        ? soloQData.leaguePoints
        : null;
    const lpFlex =
      flexData && typeof flexData.leaguePoints === "number"
        ? flexData.leaguePoints
        : null;
    const regionTranslated = getRegionDisplay(region);

    const last20Matches = filteredMatches.slice(0, 20);

    const lastWins = last20Matches.filter((match: any) => {
      const participant = match?.info?.participants?.find(
        (p: any) => p.puuid === summoner.puuid,
      );
      return participant?.win === true;
    }).length;

    const lastLoses = last20Matches.length - lastWins;

    return (
      <div className="flex flex-col min-h-screen">
        <header role="banner" className="w-full">
          <nav role="navigation" aria-label="Pesquisa de invocador">
            <SummonerSearch defaultRegion={region} />
          </nav>
        </header>

        <main
          className="container flex-grow py-8 mx-auto space-y-8"
          role="main"
        >
          <div className="relative">
            <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background/80 to-background" />
            <section aria-label="Perfil do Invocador">
              <SummonerProfile
                name={summoner.name ?? ""}
                gameName={decodedGameName}
                tagLine={decodedTagLine}
                level={summoner.summonerLevel}
                profileIconId={summoner.profileIconId}
                region={regionTranslated}
                masteries={(masteries as ChampionMastery[])
                  .slice(0, 5)
                  .map((mastery) => ({
                    championId: mastery.championId,
                    championName: mastery.championName,
                    level: mastery.championLevel,
                    points: mastery.championPoints,
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

          <div className="p-6 border rounded-lg bg-card">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold">Match History</h2>
              <MatchStatsText
                initialWins={lastWins}
                initialLosses={lastLoses}
                gameName={decodedGameName}
                queueType={queueType}
                championName={championName}
              />
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
                gameName={decodedGameName}
                queueType={queueType}
                championName={championName}
              />
            </Suspense>
          </div>
        </main>

        <footer role="contentinfo" className="w-full py-4 mt-auto">
          <div className="container mx-auto">
            <div className="p-6 text-sm text-center text-muted-foreground">
              <p>
                © {new Date().getFullYear()} LolData - Dados fornecidos pela API
                da Riot Games
              </p>
            </div>
          </div>
        </footer>
      </div>
    );
  } catch (error) {
    console.error("Erro ao carregar dados:", error);
    return (
      <main className="container min-h-screen py-8 mx-auto">
        <div className="p-6 border rounded-lg border-destructive bg-destructive/10 text-destructive">
          <h2 className="text-lg font-semibold">Erro ao carregar dados</h2>
          <p>
            Não foi possível carregar os dados do invocador. Por favor, tente
            novamente mais tarde.
          </p>
        </div>
      </main>
    );
  }
}
