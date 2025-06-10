'use client';

import { MatchHistoryItem } from "./MatchHistoryItem";
import { useEffect, useState, Suspense } from "react";
import apiService from "@/app/services/apiService";

interface Participant {
  puuid: string
  championId: number
  championName: string
  kills: number
  deaths: number
  assists: number
  totalMinionsKilled: number
  neutralMinionsKilled: number
  item0: number
  item1: number
  item2: number
  item3: number
  item4: number
  item5: number
  item6: number
  win: boolean
  goldEarned: number
  visionScore: number
  totalDamageDealtToChampions: number
  totalDamageTaken: number
  summonerName: string
  teamId: number
  riotIdGameName: string
  riotIdTagline: string
  summoner1Id: string
  summoner2Id: string
  perks: {
    styles: Perk[]
  }
}

interface MatchInfo {
  gameMode: string
  queueId: number
  gameStartTimestamp: number
  gameDuration: number
  participants: Participant[]
}

interface Match {
  info: MatchInfo
  metadata: {
    matchId: string
  }
}

interface MatchHistoryProps {
  matchesByQueue: Match[]
  puuid: string
  queueTypes: Array<{
    queueId: number
    map: string
    description: string
  }>
  isLoading?: boolean
}

interface Spell {
  id: string;
  name: string;
  key: string;
  image: {
    full: string;
    // Adicione outras propriedades conforme necessário
  };
}
interface Perk {
  selections: any;
  slots: {
    runes: {
      id: number;
      icon: string;
    }[]
  }[]
  id: number;
  style: number;
  icon: string;
  // Adicione outras propriedades conforme necessário
}

export function MatchHistoryFiltred({
  matchesByQueue,
  puuid,
  queueTypes,
  isLoading = false,
  region,
  queueId,
}: MatchHistoryProps & { region: string; queueId: number | string }) {
  const [leagueVersion, setLeagueVersion] = useState<string>("15.6.1");
  const [isLoadingVersion, setIsLoadingVersion] = useState<boolean>(true);

  // Filtra as partidas só se queueId não for "all"
  const filteredMatches = queueId === "all"
    ? matchesByQueue
    : matchesByQueue.filter(m => m.info.queueId === Number(queueId));

  // Estados para paginação e carregamento incremental
  const [matches, setMatches] = useState<Match[]>(filteredMatches || []);
  const [start, setStart] = useState(filteredMatches?.length || 0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // Cache runes and spells data
  const [runesData, setRunesData] = useState<any[]>([]);
  const [spellsData, setSpellsData] = useState<Record<string, Spell>>({});

  // Buscar versão da liga
  useEffect(() => {
    const fetchLeagueVersion = async () => {
      try {
        setIsLoadingVersion(true);
        const version = await apiService.getLatestVersion();
        setLeagueVersion(version);
      } catch (error) {
        console.error("Erro ao buscar versão da liga:", error);
      } finally {
        setIsLoadingVersion(false);
      }
    };
    fetchLeagueVersion();
  }, []);

  // Buscar runas e feitiços só uma vez por versão
  useEffect(() => {
    const fetchStaticData = async () => {
      try {
        const runesRes = await fetch(`https://ddragon.leagueoflegends.com/cdn/${leagueVersion}/data/en_US/runesReforged.json`);
        const runes = await runesRes.json();
        setRunesData(runes);

        const spellsRes = await fetch(`https://ddragon.leagueoflegends.com/cdn/${leagueVersion}/data/en_US/summoner.json`);
        const spellsJson = await spellsRes.json();
        setSpellsData(spellsJson.data);
      } catch (error) {
        setRunesData([]);
        setSpellsData({});
      }
    };
    if (leagueVersion) fetchStaticData();
  }, [leagueVersion]);

  // Atualiza matches ao trocar o filtro
  useEffect(() => {
    setMatches(filteredMatches || []);
    setStart(filteredMatches?.length || 0);
    setHasMore(true);
  }, [filteredMatches]);

  // Função para carregar mais partidas filtradas
  const fetchMoreMatches = async () => {
    setLoadingMore(true);

    let collectedMatches: Match[] = [];
    let localStart = start;
    let keepFetching = true;
    let championName = "";

    if (typeof window !== "undefined") {
      const urlParts = window.location.pathname.split("/");
      championName = urlParts[urlParts.length - 1];
    }

    // Se não está filtrando por campeão, busca normalmente
    if (!championName || championName === "all") {
      const params = new URLSearchParams({
        puuid,
        region,
        start: localStart.toString(),
        count: "10",
      });

      if (queueId !== "all") {
        params.append("queueId", String(queueId));
      }

      const endpoint =
        queueId === "all"
          ? `/api/summoner/matches?${params.toString()}`
          : `/api/summoner/matchesByQueue?${params.toString()}`;

      const res = await fetch(endpoint);
      const data = await res.json();
      const newMatches = data.data || [];

      setMatches(prev => [...prev, ...newMatches]);
      setStart(prev => prev + 10);
      setHasMore(newMatches.length === 10);
      setLoadingMore(false);
      return;
    }

    // Se está filtrando por campeão, busca até preencher 10 partidas do campeão
    while (collectedMatches.length < 10 && keepFetching) {
      const params = new URLSearchParams({
        puuid,
        region,
        start: localStart.toString(),
        count: "10",
      });

      if (queueId !== "all") {
        params.append("queueId", String(queueId));
      }

      const endpoint =
        queueId === "all"
          ? `/api/summoner/matches?${params.toString()}`
          : `/api/summoner/matchesByQueue?${params.toString()}`;

      const res = await fetch(endpoint);
      const data = await res.json();
      let newMatches: Match[] = data.data || [];

      // Filtra pelo campeão no client
      newMatches = newMatches.filter(
        (match) =>
          match.info?.participants?.some(
            (p) =>
              p.puuid === puuid &&
              String(p.championName).toLowerCase() === championName.toLowerCase()
          )
      );

      collectedMatches = [...collectedMatches, ...newMatches];

      // Se retornou menos de 10 do endpoint, acabou as partidas
      if ((data.data?.length ?? 0) < 10) {
        keepFetching = false;
      } else {
        localStart += 10;
      }
    }

    setMatches(prev => [...prev, ...collectedMatches]);
    setStart(localStart);
    setHasMore(collectedMatches.length === 10);
    setLoadingMore(false);
  };

  // Helpers
  function getSummonerSpellImageUrl(summonerId: string | number) {
    const spell = Object.values(spellsData).find(
      (s: any) => String(s.key) === String(summonerId)
    );
    return spell
      ? `https://ddragon.leagueoflegends.com/cdn/${leagueVersion}/img/spell/${spell.image.full}`
      : "";
  }

  function getSummonerPerkImageUrl(id: number) {
    for (const perk of runesData) {
      if (perk.id === id) {
        return `https://ddragon.leagueoflegends.com/cdn/img/${perk.icon}`;
      }
      for (const slot of perk.slots) {
        for (const rune of slot.runes) {
          if (rune.id === id) {
            return `https://ddragon.leagueoflegends.com/cdn/img/${rune.icon}`;
          }
        }
      }
    }
    return "";
  }

  function getTranslatedQueueName(queueId: number) {
    const queue = queueTypes.find(q => q.queueId === queueId);
    return queue?.description || "Custom Game";
  }

  function formatGameDuration(duration: number) {
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}m ${seconds}s`;
  }

  function formatGameCreation(timestamp: number) {
    const date = new Date(timestamp);
    return date.toLocaleDateString();
  }

  function getItemImageUrl(itemId: number) {
    if (itemId === 0) return "";
    return `https://ddragon.leagueoflegends.com/cdn/${leagueVersion}/img/item/${itemId}.png`;
  }

  function getChampionImageUrl(championId: number) {
    return `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/${championId}.png`;
  }

  if (isLoading || isLoadingVersion) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-32 rounded-lg animate-pulse bg-muted/50"
          />
        ))}
      </div>
    );
  }

  if (!matches?.length) {
    return (
      <div className="flex min-h-[200px] items-center justify-center rounded-lg border bg-card text-card-foreground">
        <p className="text-sm text-muted-foreground">
          No matches found
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {matches.map((match, index) => {
        if (!match || !match.info || !match.info.participants) return null;

        const participant = match.info.participants.find(p => p.puuid === puuid);
        if (!participant || !participant.perks || !participant.perks.styles) return null;

        const perk1Url = getSummonerPerkImageUrl(participant.perks.styles[0].selections[0].perk) || "";
        const perk2Url = getSummonerPerkImageUrl(participant.perks.styles[1].style) || "";
        const spell1Url = getSummonerSpellImageUrl(participant.summoner1Id) || "";
        const spell2Url = getSummonerSpellImageUrl(participant.summoner2Id) || "";

        const matchData = {
          champion: {
            name: participant.championName,
            imageUrl: getChampionImageUrl(participant.championId),
            spell1Url: spell1Url,
            spell2Url: spell2Url,
            mainStyle: perk1Url,
            subStyle: perk2Url
          },
          gameMode: match.info.gameMode,
          gameType: getTranslatedQueueName(match.info.queueId),
          isWin: participant.win,
          kills: participant.kills,
          deaths: participant.deaths,
          assists: participant.assists,
          creepScore: participant.totalMinionsKilled + participant.neutralMinionsKilled,
          items: [
            participant.item0,
            participant.item1,
            participant.item2,
            participant.item3,
            participant.item4,
            participant.item5,
            participant.item6,
          ].map(itemId => ({
            id: itemId,
            imageUrl: getItemImageUrl(itemId),
          })),
          gameDuration: formatGameDuration(match.info.gameDuration),
          gameCreation: formatGameCreation(match.info.gameStartTimestamp),
          goldEarned: participant.goldEarned,
          visionScore: participant.visionScore,
          totalDamageDealt: participant.totalDamageDealtToChampions,
          totalDamageTaken: participant.totalDamageTaken,
          summonerName: participant.riotIdGameName,
          participants: match.info.participants.map(p => ({
            championName: p.championName,
            championId: p.championId,
            summonerName: p.riotIdGameName,
            team: p.teamId,
            kills: p.kills,
            deaths: p.deaths,
            assists: p.assists,
            riotIdGameName: p.riotIdGameName,
            riotIdTagline: p.riotIdTagline,
            spell1Url: getSummonerSpellImageUrl(p.summoner1Id),
            spell2Url: getSummonerSpellImageUrl(p.summoner2Id),
            mainStyle: getSummonerPerkImageUrl(p.perks.styles[0].selections[0].perk),
            subStyle: getSummonerPerkImageUrl(p.perks.styles[1].style),
            items: [
              p.item0,
              p.item1,
              p.item2,
              p.item3,
              p.item4,
              p.item5,
              p.item6,
            ].map(itemId => ({
              id: itemId,
              imageUrl: getItemImageUrl(itemId),
            }))
          }))
        };

        return (
          <div
            key={`${match.metadata.matchId}-${index}`}
            style={{
              animationDelay: `${index * 50}ms`,
            }}
          >
            <MatchHistoryItem {...matchData} />
          </div>
        );
      })}
      <div className="flex justify-center">
        {hasMore && (
          loadingMore ? (
              <div className="flex items-center h-10 px-4 py-2 text-sm rounded-md">
                <span className="px-4 font-medium animate-pulse">Carregando...</span>
            </div>
          ) : (
            <button
              type="button"
              className="h-10 px-4 py-2 text-sm font-medium border rounded-md bg-accent border-input hover:bg-accent/80"
              onClick={fetchMoreMatches}
              disabled={loadingMore}
            >
              Carregar mais
            </button>
          )
        )}
      </div>
    </div>
  );
}
