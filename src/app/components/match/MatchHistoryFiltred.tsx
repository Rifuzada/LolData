'use client';

import { MatchHistoryItem } from "./MatchHistoryItem";
import { useEffect, useState, useMemo, useCallback } from "react";
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

  // Cache runes and spells data
  const [runesData, setRunesData] = useState<any[]>([]);
  const [spellsData, setSpellsData] = useState<Record<string, Spell>>({});

  // Estados para paginação e carregamento incremental
  const [matches, setMatches] = useState<Match[]>([]);
  const [start, setStart] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [championFilter, setChampionFilter] = useState<string>("");

  // Extrair filtro de campeão da URL
  const getChampionFromUrl = useCallback(() => {
    if (typeof window !== "undefined") {
      const urlParts = window.location.pathname.split("/");
      const lastPart = urlParts[urlParts.length - 1];
      // Se não é "all" e não é um número (queueId), então é um nome de campeão
      if (lastPart !== "all" && isNaN(Number(lastPart)) && lastPart.length > 2) {
        return decodeURIComponent(lastPart).toLowerCase();
      }
    }
    return "";
  }, []);

  // Atualizar filtro de campeão quando URL mudar
  useEffect(() => {
    const champion = getChampionFromUrl();
    setChampionFilter(champion);
  }, [getChampionFromUrl]);

  // Memoizar filteredMatches com filtro de campeão e queue
  const filteredMatches = useMemo(() => {
    if (!matchesByQueue) return [];
    
    let filtered = queueId === "all"
      ? matchesByQueue
      : matchesByQueue.filter(m => m.info.queueId === Number(queueId));

    // Aplicar filtro de campeão se existir
    if (championFilter && championFilter !== "all") {
      filtered = filtered.filter(match => {
        const participant = match.info?.participants?.find(p => p.puuid === puuid);
        if (!participant) return false;
        
        const championName = participant.championName?.toLowerCase() || "";
        const championId = String(participant.championId || "").toLowerCase();
        
        return championName === championFilter || 
               championId === championFilter ||
               championName.includes(championFilter) ||
               championFilter.includes(championName);
      });
    }

    return filtered;
  }, [matchesByQueue, queueId, championFilter, puuid]);

  // Buscar versão da liga (apenas uma vez)
  useEffect(() => {
    let mounted = true;

    const fetchLeagueVersion = async () => {
      try {
        setIsLoadingVersion(true);
        const version = await apiService.getLatestVersion();
        if (mounted) {
          setLeagueVersion(version);
        }
      } catch (error) {
        console.error("Erro ao buscar versão da liga:", error);
      } finally {
        if (mounted) {
          setIsLoadingVersion(false);
        }
      }
    };

    fetchLeagueVersion();

    return () => {
      mounted = false;
    };
  }, []);

  // Buscar runas e feitiços só uma vez por versão
  useEffect(() => {
    let mounted = true;

    const fetchStaticData = async () => {
      if (!leagueVersion || isLoadingVersion) return;

      try {
        const [runesRes, spellsRes] = await Promise.all([
          fetch(`https://ddragon.leagueoflegends.com/cdn/${leagueVersion}/data/en_US/runesReforged.json`),
          fetch(`https://ddragon.leagueoflegends.com/cdn/${leagueVersion}/data/en_US/summoner.json`)
        ]);

        const [runes, spellsJson] = await Promise.all([
          runesRes.json(),
          spellsRes.json()
        ]);

        if (mounted) {
          setRunesData(runes);
          setSpellsData(spellsJson.data);
        }
      } catch (error) {
        console.error("Erro ao buscar dados estáticos:", error);
        if (mounted) {
          setRunesData([]);
          setSpellsData({});
        }
      }
    };

    fetchStaticData();

    return () => {
      mounted = false;
    };
  }, [leagueVersion, isLoadingVersion]);

  // Inicializar matches quando filteredMatches mudar
  useEffect(() => {
    setMatches(filteredMatches);
    setStart(filteredMatches.length);
    setHasMore(filteredMatches.length > 0);
  }, [filteredMatches]);

  // Memoizar funções helper para evitar recriações
  const getSummonerSpellImageUrl = useCallback((summonerId: string | number) => {
    const spell = Object.values(spellsData).find(
      (s: any) => String(s.key) === String(summonerId)
    );
    return spell
      ? `https://ddragon.leagueoflegends.com/cdn/${leagueVersion}/img/spell/${spell.image.full}`
      : "";
  }, [spellsData, leagueVersion]);

  const getSummonerPerkImageUrl = useCallback((id: number) => {
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
  }, [runesData]);

  const getTranslatedQueueName = useCallback((queueId: number) => {
    const queue = queueTypes.find(q => q.queueId === queueId);
    return queue?.description || "Custom Game";
  }, [queueTypes]);

  const formatGameDuration = useCallback((duration: number) => {
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}m ${seconds}s`;
  }, []);

  const formatGameCreation = useCallback((timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString();
  }, []);

  const getItemImageUrl = useCallback((itemId: number) => {
    if (itemId === 0) return "";
    return `https://ddragon.leagueoflegends.com/cdn/${leagueVersion}/img/item/${itemId}.png`;
  }, [leagueVersion]);

  const getChampionImageUrl = useCallback((championId: number) => {
    return `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/${championId}.png`;
  }, []);

  // Função para carregar mais partidas filtradas
  const fetchMoreMatches = useCallback(async () => {
    if (loadingMore) return;
    
    setLoadingMore(true);

    try {
      let collectedMatches: Match[] = [];
      let localStart = start;
      let keepFetching = true;
      const maxAttempts = 50; // Limite de tentativas para evitar loop infinito
      let attempts = 0;

      // Se estamos filtrando por campeão, precisamos buscar mais partidas até encontrar suficientes
      const needsChampionFiltering = championFilter && championFilter !== "all";
      const targetMatches = needsChampionFiltering ? 10 : 10;

      while (collectedMatches.length < targetMatches && keepFetching && attempts < maxAttempts) {
        attempts++;
        
        const params = new URLSearchParams({
          puuid,
          region,
          start: localStart.toString(),
          count: needsChampionFiltering ? "20" : "10", // Buscar mais se filtrando por campeão
        });

        if (queueId !== "all") {
          params.append("queueId", String(queueId));
        }

        // Adicionar filtro de campeão como parâmetro da API
        if (needsChampionFiltering) {
          params.append("championName", championFilter);
        }

        const endpoint =
          queueId === "all"
            ? `/api/summoner/matches?${params.toString()}`
            : `/api/summoner/matchesByQueue?${params.toString()}`;

        const res = await fetch(endpoint);
        if (!res.ok) {
          console.error("Erro na API:", res.status, res.statusText);
          break;
        }

        const data = await res.json();
        let newMatches: Match[] = data.data || [];

        console.log(`Tentativa ${attempts}: ${newMatches.length} partidas recebidas${needsChampionFiltering ? ` para campeão ${championFilter}` : ''}`);

        // Se não há mais partidas da API, para
        if (newMatches.length === 0) {
          keepFetching = false;
          break;
        }

        // A API já fez o filtro, então só adicionamos as partidas
        collectedMatches = [...collectedMatches, ...newMatches];
        localStart += (needsChampionFiltering ? 20 : newMatches.length);

        // Se recebemos menos partidas que o solicitado, provavelmente acabaram
        if (newMatches.length < (needsChampionFiltering ? 10 : 10)) {
          keepFetching = false;
        }
      }

      console.log(`Total coletado: ${collectedMatches.length} partidas`);

      if (collectedMatches.length > 0) {
        setMatches(prev => [...prev, ...collectedMatches]);
        setStart(localStart);
      }
      
      setHasMore(collectedMatches.length === targetMatches && attempts < maxAttempts);
      
    } catch (error) {
      console.error("Erro ao carregar mais partidas:", error);
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, start, puuid, region, queueId, championFilter]);

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

        const perk1Url = getSummonerPerkImageUrl(participant.perks.styles[0]?.selections?.[0]?.perk) || "";
        const perk2Url = getSummonerPerkImageUrl(participant.perks.styles[1]?.style) || "";
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
            mainStyle: getSummonerPerkImageUrl(p.perks?.styles?.[0]?.selections?.[0]?.perk),
            subStyle: getSummonerPerkImageUrl(p.perks?.styles?.[1]?.style),
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
