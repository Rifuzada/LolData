"use client";

import { MatchHistoryItem } from "./MatchHistoryItem";
import { useEffect, useState, useMemo, useCallback } from "react";
import apiService from "@/app/services/apiService";

interface Participant {
  puuid: string;
  championId: number;
  championName: string;
  kills: number;
  deaths: number;
  assists: number;
  totalMinionsKilled: number;
  neutralMinionsKilled: number;
  item0: number;
  item1: number;
  item2: number;
  item3: number;
  item4: number;
  item5: number;
  item6: number;
  win: boolean;
  goldEarned: number;
  visionScore: number;
  totalDamageDealtToChampions: number;
  totalDamageTaken: number;
  summonerName: string;
  teamId: number;
  riotIdGameName: string;
  riotIdTagline: string;
  summoner1Id: string;
  summoner2Id: string;
  perks: {
    styles: Perk[];
  };
}

interface MatchInfo {
  gameMode: string;
  queueId: number;
  gameStartTimestamp: number;
  gameDuration: number;
  participants: Participant[];
}

interface Match {
  info: MatchInfo;
  metadata: {
    matchId: string;
  };
}

interface MatchHistoryProps {
  matchesByQueue: Match[];
  puuid: string;
  queueTypes: Array<{
    queueId: number;
    map: string;
    description: string;
  }>;
  isLoading?: boolean;
  gameName?: string;
  queueType?: string;
  championName?: string;
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
    }[];
  }[];
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
  gameName,
  queueType,
  championName,
}: MatchHistoryProps & { region: string; queueId: number | string }) {
  const [leagueVersion, setLeagueVersion] = useState<string>("15.6.1");
  const [isLoadingVersion, setIsLoadingVersion] = useState<boolean>(true);

  const [runesData, setRunesData] = useState<any[]>([]);
  const [spellsData, setSpellsData] = useState<Record<string, Spell>>({});

  const [matches, setMatches] = useState<Match[]>([]);
  const [start, setStart] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [championFilter, setChampionFilter] = useState<string>("");

  const getChampionFromUrl = useCallback(() => {
    if (typeof window !== "undefined") {
      const urlParts = window.location.pathname.split("/");
      const lastPart = urlParts[urlParts.length - 1];
      if (
        lastPart !== "all" &&
        isNaN(Number(lastPart)) &&
        lastPart.length > 2
      ) {
        return decodeURIComponent(lastPart).toLowerCase();
      }
    }
    return "";
  }, []);

  useEffect(() => {
    const champion = getChampionFromUrl();
    setChampionFilter(champion);
  }, [getChampionFromUrl]);

  const filteredMatches = useMemo(() => {
    if (!matchesByQueue) return [];

    let filtered =
      queueId === "all"
        ? matchesByQueue
        : matchesByQueue.filter((m) => m.info.queueId === Number(queueId));

    if (championFilter && championFilter !== "all") {
      filtered = filtered.filter((match) => {
        const participant = match.info?.participants?.find(
          (p) => p.puuid === puuid,
        );
        if (!participant) return false;
        const championName = participant.championName?.toLowerCase() || "";
        const championId = String(participant.championId || "").toLowerCase();
        return (
          championName === championFilter ||
          championId === championFilter ||
          championName.includes(championFilter) ||
          championFilter.includes(championName)
        );
      });
    }

    return filtered;
  }, [matchesByQueue, queueId, championFilter, puuid]);

  useEffect(() => {
    let mounted = true;
    const fetchLeagueVersion = async () => {
      try {
        setIsLoadingVersion(true);
        const version = await apiService.getLatestVersion();
        if (mounted) setLeagueVersion(version);
      } catch (error) {
        console.error("Erro ao buscar versão da liga:", error);
      } finally {
        if (mounted) setIsLoadingVersion(false);
      }
    };
    fetchLeagueVersion();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    const fetchStaticData = async () => {
      if (!leagueVersion || isLoadingVersion) return;
      try {
        const [runesRes, spellsRes] = await Promise.all([
          fetch(
            `https://ddragon.leagueoflegends.com/cdn/${leagueVersion}/data/en_US/runesReforged.json`,
          ),
          fetch(
            `https://ddragon.leagueoflegends.com/cdn/${leagueVersion}/data/en_US/summoner.json`,
          ),
        ]);
        const [runes, spellsJson] = await Promise.all([
          runesRes.json(),
          spellsRes.json(),
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

  useEffect(() => {
    setMatches(filteredMatches);
    setStart(filteredMatches.length);
    setHasMore(filteredMatches.length > 0);
  }, [filteredMatches]);

  useEffect(() => {
    const w = matches.filter((match) => {
      const p = match?.info?.participants?.find((p) => p.puuid === puuid);
      return p?.win === true;
    }).length;

    window.dispatchEvent(
      new CustomEvent("matchStatsUpdate", {
        detail: { wins: w, losses: matches.length - w },
      }),
    );
  }, [matches, puuid]);

  const filterMatchClientSide = useCallback(
    (rawMatches: Match[]): Match[] => {
      let filtered =
        queueId === "all"
          ? rawMatches
          : rawMatches.filter((m) => m.info.queueId === Number(queueId));

      if (championFilter && championFilter !== "all") {
        filtered = filtered.filter((match) => {
          const participant = match.info?.participants?.find(
            (p) => p.puuid === puuid,
          );
          if (!participant) return false;
          const champName = participant.championName?.toLowerCase() || "";
          const champId = String(participant.championId || "").toLowerCase();
          return (
            champName === championFilter ||
            champId === championFilter ||
            champName.includes(championFilter) ||
            championFilter.includes(champName)
          );
        });
      }

      return filtered;
    },
    [queueId, championFilter, puuid],
  );

  const fetchMoreMatches = useCallback(async () => {
    if (loadingMore) return;
    setLoadingMore(true);

    try {
      const BATCH_SIZE = 50;
      const TARGET = 10;

      let dbStart = start;
      let collectedMatches: Match[] = [];
      let attempts = 0;
      const MAX_ATTEMPTS = 10;

      // 🔥 Determina championId para enviar
      let championIdToSend: number | undefined = undefined;
      let championNameToSend: string | undefined = undefined;

      if (championFilter && championFilter !== "all") {
        for (const match of matches) {
          const p = match.info.participants.find((p) => p.puuid === puuid);
          if (!p) continue;
          if (
            p.championName.toLowerCase() === championFilter.toLowerCase() ||
            String(p.championId) === championFilter
          ) {
            championIdToSend = p.championId;
            championNameToSend = p.championName; // 🔥 captura o nome
            break;
          }
        }
      }

      while (collectedMatches.length < TARGET && attempts < MAX_ATTEMPTS) {
        attempts++;

        const params = new URLSearchParams({
          puuid,
          region,
          start: dbStart.toString(),
          count: String(BATCH_SIZE),
        });

        if (championNameToSend) {
          championNameToSend = championNameToSend.toLowerCase();
          params.append("championName", championNameToSend);
        } else if (championIdToSend) {
          params.append("championId", String(championIdToSend)); // fallback
        }

        const res = await fetch(`/api/summoner/matches?${params.toString()}`);

        if (!res.ok) {
          console.error("Erro na API:", res.status);
          break;
        }

        const data = await res.json();
        const rawMatches: Match[] = data.data || [];

        if (rawMatches.length === 0) break;

        const filtered = filterMatchClientSide(rawMatches);

        const unique = filtered.filter(
          (newMatch) =>
            !matches.some(
              (existing) =>
                existing.metadata.matchId === newMatch.metadata.matchId,
            ) &&
            !collectedMatches.some(
              (c) => c.metadata.matchId === newMatch.metadata.matchId,
            ),
        );

        collectedMatches = [...collectedMatches, ...unique];

        dbStart += rawMatches.length;

        if (rawMatches.length < BATCH_SIZE) break;
      }

      if (collectedMatches.length > 0) {
        setMatches((prev) => [...prev, ...collectedMatches]);
      }

      setStart(dbStart);
      setHasMore(collectedMatches.length >= TARGET);
    } catch (error) {
      console.error("Erro ao carregar mais partidas:", error);
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  }, [
    loadingMore,
    start,
    puuid,
    region,
    matches,
    filterMatchClientSide,
    championFilter,
  ]);

  // 🔥 O restante do arquivo permanece inalterado (renderização, imagens, etc.)
  const getSummonerSpellImageUrl = useCallback(
    (summonerId: string | number): string | null => {
      const spell = Object.values(spellsData).find(
        (s: any) => String(s.key) === String(summonerId),
      );
      return spell
        ? `https://ddragon.leagueoflegends.com/cdn/${leagueVersion}/img/spell/${spell.image.full}`
        : null;
    },
    [spellsData, leagueVersion],
  );

  const getSummonerPerkImageUrl = useCallback(
    (id: number): string | null => {
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
      return null;
    },
    [runesData],
  );

  const getTranslatedQueueName = useCallback(
    (queueId: number) => {
      const queue = queueTypes.find((q) => q.queueId === queueId);
      return queue?.description || "Custom Game";
    },
    [queueTypes],
  );

  const formatGameDuration = useCallback((duration: number) => {
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}m ${seconds}s`;
  }, []);

  const formatGameCreation = useCallback((timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  }, []);

  const getItemImageUrl = useCallback(
    (itemId: number): string | null => {
      if (!itemId || itemId === 0) return null;
      return `https://ddragon.leagueoflegends.com/cdn/${leagueVersion}/img/item/${itemId}.png`;
    },
    [leagueVersion],
  );

  const getChampionImageUrl = useCallback((championId: number) => {
    return `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/${championId}.png`;
  }, []);

  const mapItems = useCallback(
    (itemIds: number[]) =>
      itemIds.map((itemId, index) => ({
        id: `${itemId}-${index}`,
        imageUrl: getItemImageUrl(itemId),
      })),
    [getItemImageUrl],
  );

  if (isLoading || isLoadingVersion) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-32 rounded-lg animate-pulse bg-muted/50" />
        ))}
      </div>
    );
  }

  if (!matches?.length) {
    return (
      <div className="flex min-h-[200px] items-center justify-center rounded-lg border bg-card text-card-foreground">
        <p className="text-sm text-muted-foreground">No matches found</p>
        <div className="flex min-h-[200px] items-center justify-center rounded-lg border bg-card text-card-foreground">
          <button
            type="button"
            className="h-10 px-4 py-2 text-sm font-medium border rounded-md bg-accent border-input hover:bg-accent/80"
            onClick={fetchMoreMatches}
            disabled={loadingMore}
          >
            Load more
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {matches.map((match, index) => {
        if (!match?.info?.participants) return null;

        const participant = match.info.participants.find(
          (p) => p.puuid === puuid,
        );
        if (!participant?.perks?.styles) return null;

        const perk1Url = getSummonerPerkImageUrl(
          participant.perks.styles[0]?.selections?.[0]?.perk,
        );
        const perk2Url = getSummonerPerkImageUrl(
          participant.perks.styles[1]?.style,
        );
        const spell1Url = getSummonerSpellImageUrl(participant.summoner1Id);
        const spell2Url = getSummonerSpellImageUrl(participant.summoner2Id);

        const matchData = {
          champion: {
            name: participant.championName,
            imageUrl: getChampionImageUrl(participant.championId),
            spell1Url,
            spell2Url,
            mainStyle: perk1Url,
            subStyle: perk2Url,
          },
          gameMode: match.info.gameMode,
          gameType: getTranslatedQueueName(match.info.queueId),
          isWin: participant.win,
          kills: participant.kills,
          deaths: participant.deaths,
          assists: participant.assists,
          creepScore:
            participant.totalMinionsKilled + participant.neutralMinionsKilled,
          items: mapItems([
            participant.item0,
            participant.item1,
            participant.item2,
            participant.item3,
            participant.item4,
            participant.item5,
            participant.item6,
          ]),
          gameDuration: formatGameDuration(match.info.gameDuration),
          gameCreation: formatGameCreation(match.info.gameStartTimestamp),
          goldEarned: participant.goldEarned,
          visionScore: participant.visionScore,
          totalDamageDealt: participant.totalDamageDealtToChampions,
          totalDamageTaken: participant.totalDamageTaken,
          summonerName: participant.riotIdGameName,
          participants: match.info.participants.map((p) => ({
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
            mainStyle: getSummonerPerkImageUrl(
              p.perks?.styles?.[0]?.selections?.[0]?.perk,
            ),
            subStyle: getSummonerPerkImageUrl(p.perks?.styles?.[1]?.style),
            items: mapItems([
              p.item0,
              p.item1,
              p.item2,
              p.item3,
              p.item4,
              p.item5,
              p.item6,
            ]),
          })),
        };

        return (
          <div
            key={`${match.metadata.matchId}-${index}`}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <MatchHistoryItem {...matchData} />
          </div>
        );
      })}

      <div className="flex justify-center">
        {hasMore &&
          (loadingMore ? (
            <div className="flex items-center h-10 px-4 py-2 text-sm rounded-md">
              <span className="px-4 font-medium animate-pulse">Loading...</span>
            </div>
          ) : (
            <button
              type="button"
              className="h-10 px-4 py-2 text-sm font-medium border rounded-md bg-accent border-input hover:bg-accent/80"
              onClick={fetchMoreMatches}
              disabled={loadingMore}
            >
              Load more
            </button>
          ))}
      </div>
    </div>
  );
}
