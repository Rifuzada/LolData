'use client';

import { MatchHistoryItem } from "./MatchHistoryItem"
import { useEffect, useState } from "react"
import apiService from "@/app/services/apiService"

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

export async function MatchHistoryFiltred({ matchesByQueue, puuid, queueTypes, isLoading = false }: MatchHistoryProps) {
  const [leagueVersion, setLeagueVersion] = useState<string>("15.6.1") // Versão padrão
  const [isLoadingVersion, setIsLoadingVersion] = useState<boolean>(true)

  const fetchLeagueVersion: () => Promise<void> = async () => {
    try {
      setIsLoadingVersion(true)
      const version = await apiService.getLatestVersion()
      setLeagueVersion(version)
    } catch (error) {
      console.error("Erro ao buscar versão da liga:", error)
    } finally {
      setIsLoadingVersion(false)
    }
  }

  useEffect(() => {
    fetchLeagueVersion()
  }, [])

  function getTranslatedQueueName(queueId: number) {
    const queue = queueTypes.find(q => q.queueId === queueId)
    return queue?.description || "Custom Game"
  }

  function formatGameDuration(duration: number) {
    const minutes = Math.floor(duration / 60)
    const seconds = duration % 60
    return `${minutes}m ${seconds}s`
  }

  function formatGameCreation(timestamp: number) {
    const date = new Date(timestamp)
    return date.toLocaleDateString()
  }

  function getItemImageUrl(itemId: number) {
    if (itemId === 0) return ""
    return `https://ddragon.leagueoflegends.com/cdn/${leagueVersion}/img/item/${itemId}.png`
  }

  function getChampionImageUrl(championId: number) {
    return `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/${championId}.png`;
  }

  async function getSummonerSpellImageUrl(summonerId: string) {
    const url = `https://ddragon.leagueoflegends.com/cdn/${leagueVersion}/data/en_US/summoner.json`;
  
    try {
      const response = await fetch(url);
      const data: { data: Record<string, Spell> } = await response.json();
  
      for (const spell of Object.values(data.data)) {
        if (spell.key == summonerId) {
          return `https://ddragon.leagueoflegends.com/cdn/${leagueVersion}/img/spell/${spell.image.full}`;
        }
      }
    } catch (error) {
      console.error("Erro ao buscar imagem do feitiço de invocador:", error);
    }
  
    console.warn(`Feitiço com ID ${summonerId} não encontrado.`);
    return ""; // Retorna uma string vazia se não encontrar o feitiço
  }

  if (isLoading || isLoadingVersion) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-32 animate-pulse rounded-lg bg-muted/50"
          />
        ))}
      </div>
    )
  }

  if (!matchesByQueue?.length) {
    return (
      <div className="flex min-h-[200px] items-center justify-center rounded-lg border bg-card text-card-foreground">
        <p className="text-sm text-muted-foreground">
          No matches found
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {await Promise.all(matchesByQueue.map(async (match, index) => {
        const participant = match.info.participants.find(p => p.puuid === puuid);
        if (!participant) return null;

        const spell1Url = await getSummonerSpellImageUrl(participant.summoner1Id);
        const spell2Url = await getSummonerSpellImageUrl(participant.summoner2Id);

        const matchData = {
          champion: {
            name: participant.championName,
            imageUrl: getChampionImageUrl(participant.championId),
            spell1Url: spell1Url,
            spell2Url: spell2Url,
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
          participants: await Promise.all(match.info.participants.map(async p => ({
            championName: p.championName,
            championId: p.championId,
            summonerName: p.riotIdGameName,
            team: p.teamId,
            kills: p.kills,
            deaths: p.deaths,
            assists: p.assists,
            riotIdGameName: p.riotIdGameName,
            riotIdTagline: p.riotIdTagline,
            spell1Url: await getSummonerSpellImageUrl(p.summoner1Id),
            spell2Url: await getSummonerSpellImageUrl(p.summoner2Id),
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
          })))
        };

        return (
          <div
            key={`${match.metadata.matchId}-${index}`}
            style={{
              animationDelay: `${index * 100}ms`,
            }}
          >
            <MatchHistoryItem {...matchData} />
          </div>
        );
      }))}
      <div className="flex justify-center">
        <button
          type="submit"
          className="h-10 px-4 py-2 rounded-md text-sm bg-accent border border-input hover:bg-accent/80 font-medium"
        >
          Carregar mais
        </button>
      </div>
    </div>
  )
}