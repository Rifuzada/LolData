"use client";

import { MatchHistoryItem } from "./MatchHistoryItem";
import { useEffect, useState, useMemo, useCallback, useRef } from "react";
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

interface Perk {
  selections: any;
  id: number;
  style: number;
  icon: string;
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
  region: string;
  queueId: number | string;
  gameName?: string;
  tagLine?: string;
  queueType?: string;
  championName?: string;
}

export function MatchHistoryFiltred({
  matchesByQueue,
  puuid,
  queueTypes,
  isLoading = false,
  region,
  queueId,
  gameName,
  tagLine,
  championName,
}: MatchHistoryProps) {
  const [leagueVersion, setLeagueVersion] = useState<string | null>(null);
  const [runesData, setRunesData] = useState<any[]>([]);
  const [spellsData, setSpellsData] = useState<Record<string, any>>({});
  const [matches, setMatches] = useState<Match[]>(matchesByQueue);
  const [start, setStart] = useState(matchesByQueue.length);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(matchesByQueue.length >= 10);

  const abortControllerRef = useRef<AbortController | null>(null);

  // 1. Carregar Versão e Dados Estáticos (DDragon)
  useEffect(() => {
    const loadStaticData = async () => {
      try {
        // Pega a versão mais recente
        const version = await apiService.getLatestVersion();
        setLeagueVersion(version);

        const [runesRes, spellsRes] = await Promise.all([
          fetch(
            `https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/runesReforged.json`,
          ),
          fetch(
            `https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/summoner.json`,
          ),
        ]);

        const runes = await runesRes.json();
        const spells = await spellsRes.json();

        setRunesData(runes);
        setSpellsData(spells.data);
      } catch (e) {
        console.error("Erro ao carregar dados do DDragon:", e);
      }
    };
    loadStaticData();
  }, []);

  // 2. Resetar lista quando os filtros principais mudam via URL/Props
  useEffect(() => {
    setMatches(matchesByQueue);
    setStart(matchesByQueue.length);
    setHasMore(matchesByQueue.length >= 10);
  }, [matchesByQueue, queueId, championName]);

  // 3. Atualizar estatísticas Globais (Wins/Losses)
  useEffect(() => {
    const wins = matches.filter((m) => {
      const p = m.info?.participants?.find((p) => p.puuid === puuid);
      return p?.win === true;
    }).length;

    window.dispatchEvent(
      new CustomEvent("matchStatsUpdate", {
        detail: { wins, losses: matches.length - wins },
      }),
    );
  }, [matches, puuid]);

  // 4. Buscar mais partidas (Paginação)
  const fetchMoreMatches = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);

    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();

    try {
      const params = new URLSearchParams({
        region,
        puuid,
        start: start.toString(),
        count: "10",
        gameName: gameName || "",
        tagLine: tagLine || "",
      });

      if (queueId && queueId !== "all")
        params.append("queueId", String(queueId));
      if (championName && championName !== "all")
        params.append("championName", championName);

      const res = await fetch(`/api/summoner/matches?${params.toString()}`, {
        signal: abortControllerRef.current.signal,
      });

      if (!res.ok) throw new Error("Erro na API de partidas");

      const json = await res.json();
      const newMatches: Match[] = json.data || [];

      if (newMatches.length === 0) {
        setHasMore(false);
      } else {
        setMatches((prev) => {
          const existingIds = new Set(prev.map((m) => m.metadata.matchId));
          const uniqueNew = newMatches.filter(
            (m) => !existingIds.has(m.metadata.matchId),
          );
          return [...prev, ...uniqueNew];
        });
        setStart((prev) => prev + newMatches.length);
        setHasMore(newMatches.length >= 10);
      }
    } catch (error: any) {
      if (error.name !== "AbortError") {
        console.error("Erro ao carregar mais partidas:", error);
        setHasMore(false);
      }
    } finally {
      setLoadingMore(false);
    }
  }, [
    loadingMore,
    hasMore,
    start,
    region,
    puuid,
    queueId,
    championName,
    gameName,
    tagLine,
  ]);

  // Helpers de Imagem (aguarda leagueVersion estar carregado)
  const getSummonerSpellImageUrl = useCallback(
    (spellId: string | number) => {
      if (!leagueVersion) return null;
      const spell = Object.values(spellsData).find(
        (s: any) => String(s.key) === String(spellId),
      );
      return spell
        ? `https://ddragon.leagueoflegends.com/cdn/${leagueVersion}/img/spell/${spell.image.full}`
        : null;
    },
    [spellsData, leagueVersion],
  );

  const getRuneImageUrl = useCallback(
    (id: number) => {
      if (!runesData.length) return null;
      for (const perk of runesData) {
        if (perk.id === id)
          return `https://ddragon.leagueoflegends.com/cdn/img/${perk.icon}`;
        for (const slot of perk.slots || []) {
          for (const rune of slot.runes || []) {
            if (rune.id === id)
              return `https://ddragon.leagueoflegends.com/cdn/img/${rune.icon}`;
          }
        }
      }
      return null;
    },
    [runesData],
  );

  if (!leagueVersion || isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-32 rounded-lg animate-pulse bg-muted/50" />
        ))}
      </div>
    );
  }

  if (!matches?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 border rounded-lg bg-card/50">
        <p className="text-muted-foreground mb-4">
          Nenhuma partida encontrada.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="text-sm font-medium text-primary hover:underline"
        >
          Recarregar página
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {matches.map((match) => {
        const participant = match.info?.participants?.find(
          (p) => p.puuid === puuid,
        );
        if (!participant) return null;

        const spell1Url = getSummonerSpellImageUrl(participant.summoner1Id);
        const spell2Url = getSummonerSpellImageUrl(participant.summoner2Id);
        const perk1Url = getRuneImageUrl(
          participant.perks?.styles?.[0]?.selections?.[0]?.perk,
        );
        const perk2Url = getRuneImageUrl(participant.perks?.styles?.[1]?.style);

        const matchData = {
          champion: {
            name: participant.championName,
            imageUrl: `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/${participant.championId}.png`,
            spell1Url,
            spell2Url,
            mainStyle: perk1Url,
            subStyle: perk2Url,
          },
          gameMode: match.info.gameMode,
          gameType:
            queueTypes.find((q) => q.queueId === match.info.queueId)
              ?.description || "Partida",
          isWin: participant.win,
          kills: participant.kills,
          deaths: participant.deaths,
          assists: participant.assists,
          creepScore:
            participant.totalMinionsKilled + participant.neutralMinionsKilled,
          items: [0, 1, 2, 3, 4, 5, 6].map((i) => ({
            id: (participant as any)[`item${i}`],
            imageUrl: (participant as any)[`item${i}`]
              ? `https://ddragon.leagueoflegends.com/cdn/${leagueVersion}/img/item/${
                  (participant as any)[`item${i}`]
                }.png`
              : null,
          })),
          gameDuration: `${Math.floor(match.info.gameDuration / 60)}m ${
            match.info.gameDuration % 60
          }s`,
          gameCreation: new Date(
            match.info.gameStartTimestamp,
          ).toLocaleDateString(),
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
            spell1Url: getSummonerSpellImageUrl(p.summoner1Id),
            spell2Url: getSummonerSpellImageUrl(p.summoner2Id),
            mainStyle: getRuneImageUrl(
              p.perks?.styles?.[0]?.selections?.[0]?.perk,
            ),
            subStyle: getRuneImageUrl(p.perks?.styles?.[1]?.style),
            items: [0, 1, 2, 3, 4, 5, 6].map((i) => ({
              id: (p as any)[`item${i}`],
              imageUrl: (p as any)[`item${i}`]
                ? `https://ddragon.leagueoflegends.com/cdn/${leagueVersion}/img/item/${
                    (p as any)[`item${i}`]
                  }.png`
                : null,
            })),
          })),
        };

        return (
          <div key={match.metadata.matchId} className="transition-all">
            <MatchHistoryItem {...(matchData as any)} />
          </div>
        );
      })}

      <div className="flex justify-center pt-4">
        {hasMore && (
          <button
            type="button"
            className="h-10 px-6 py-2 text-sm font-medium border rounded-md bg-accent hover:bg-accent/80 disabled:opacity-50 transition-colors"
            onClick={fetchMoreMatches}
            disabled={loadingMore}
          >
            {loadingMore ? "Carregando..." : "Carregar mais partidas"}
          </button>
        )}
      </div>
    </div>
  );
}
