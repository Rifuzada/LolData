'use client';

import { cn } from "@/lib/utils"
import Image from "next/image"
import { useRouter } from "next/navigation";
import { useParams } from 'next/navigation';
import { useState } from "react"

interface MatchHistoryItemProps {
  champion: {
    name: string
    imageUrl: string
    spell1Url: string
    spell2Url: string
    mainStyle: string
    subStyle: string
  }
  gameMode: string
  gameType: string
  isWin: boolean
  kills: number
  deaths: number
  assists: number
  creepScore: number
  items: Array<{
    id: number
    imageUrl: string
  }>
  gameDuration: string
  gameCreation: string
  goldEarned?: number
  visionScore?: number
  totalDamageDealt?: number
  totalDamageTaken?: number
  summonerName: string
  participants?: Array<{
    subStyle: string ;
    mainStyle: string;
    championName: string
    championId: number
    summonerName: string
    team: number
    kills: number
    deaths: number
    assists: number
    riotIdGameName: string
    riotIdTagline: string
    items: Array<{
      id: number
      imageUrl: string
    }>
    spell1Url?: string
    spell2Url?: string
  }>
}

export function MatchHistoryItem({
  champion,
  gameMode,
  gameType,
  isWin,
  kills,
  deaths,
  assists,
  creepScore,
  items,
  gameDuration,
  gameCreation,
  goldEarned,
  visionScore,
  totalDamageDealt,
  totalDamageTaken,
  summonerName,
  participants,
}: MatchHistoryItemProps) {
  const params = useParams();
  const region = params.region as string;
  const [isExpanded, setIsExpanded] = useState(false)
  const kda = ((kills + assists) / Math.max(1, deaths)).toFixed(2)    
  const csPerMin = (() => {
  const [minStr, secStr] = gameDuration.split(' ');
  const minutes = parseInt(minStr.replace('m', ''), 10) || 0;
  const seconds = parseInt(secStr.replace('s', ''), 10) || 0;
  const totalMinutes = minutes + seconds / 60;
  return (creepScore / Math.max(1, totalMinutes)).toFixed(1);
  })();


  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg border p-4 animate-fadeIn cursor-pointer",
        "transition-all duration-200 ease-in-out hover:scale-[1.02]",
        "bg-gradient-to-r",
        isWin
          ? "from-win/10 to-win/5 border-win/20 hover:border-win/40"
          : "from-loss/10 to-loss/5 border-loss/20 hover:border-loss/40"
      )}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className="flex flex-col space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium sm:text-sm text-muted-foreground">
            {gameMode} • {gameType}
          </span>
          <span className={cn(
            "text-sm font-semibold",
            isWin ? "text-win" : "text-loss"
          )}>
            {isWin ? "Victory" : "Defeat"}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex items-center gap-1">
            {champion.mainStyle && (
              <Image
                src={champion.mainStyle}
                alt=""
                width={25}
                height={25}
                className="object-cover rounded-md"
              />
            )}
            {champion.subStyle && (
              <Image
                src={champion.subStyle}
                alt=""
                width={15}
                height={15}
                className="object-cover rounded-md"
              />
            )}
          </div>
          <div className="relative flex-shrink-0 w-16 h-16">
            <Image
              src={champion.imageUrl}
              alt={champion.name}
              fill
              className="object-cover border-4 rounded-full"
              style={{
                clipPath: "inset(10% 10% round 50%)"
              }}
            />
          </div>
          <div className="flex-wrap items-center gap-1 flexbox">
              <Image
                src={champion.spell1Url}
                alt="Spell 1"
                width={25}
                height={25}
                className="object-cover mb-1 rounded-md"
              />
              <Image
                src={champion.spell2Url}
                alt="Spell 2"
                width={25}
                height={25}
                className="object-cover rounded-md"
              />
            </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1">
              <h3 className="text-sm font-semibold">{champion.name}</h3>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <span className="text-xs font-medium">{kills}</span>
                <span className="text-xs text-muted-foreground">/</span>
                <span className="text-xs font-medium text-loss">{deaths}</span>
                <span className="text-xs text-muted-foreground">/</span>
                <span className="text-xs font-medium">{assists}</span>
              </div>
              <span className="text-xs text-muted-foreground">
                ({kda} KDA)
              </span>
              <span className="text-xs text-muted-foreground">
                CS: {creepScore} ({csPerMin}/min)
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 ml-auto mr-auto">
          <div className="flex flex-wrap items-center gap-1">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="relative rounded-md h-9 w-9 bg-background/50"
                >
                  {item.imageUrl && (
                    <Image
                      src={item.imageUrl}
                      alt={`Item ${item.id}`}
                      fill
                      className="object-cover rounded-md "
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <div className="flex flex-col items-end ml-2">
              <span className="text-xs font-medium">
                {gameDuration}
              </span>
              <span className="text-xs text-muted-foreground">
                {gameCreation}
              </span>
            </div>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="pt-4 mt-4 border-t border-border/50 animate-fadeIn">
          <div className="flex flex-wrap items-center justify-between w-full mb-4">
            <div className="text-left">
              <p className="text-xs sm:text-sm text-muted-foreground">Damage Dealt</p>
              <p className="text-xl font-bold">{totalDamageDealt?.toLocaleString() || 0}</p>
            </div>
            <div className="text-center">
              <p className="text-xs sm:text-sm text-muted-foreground">Gold Earned</p>
              <p className="text-base font-medium">{goldEarned?.toLocaleString()}</p>
            </div>
            <div className="text-center">
              <p className="text-xs sm:text-sm text-muted-foreground">Vision Score</p>
              <p className="text-base font-medium">{visionScore}</p>
            </div>
            <div className="text-right">
              <p className="text-xs sm:text-sm text-muted-foreground">Damage Taken</p>
              <p className="text-xl font-bold">{totalDamageTaken?.toLocaleString() || 0}</p>
            </div>
          </div>

          <div className="w-full h-px mb-4 bg-border"></div>

          {participants && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <h4 className="mb-2 text-xs font-medium sm:text-sm text-muted-foreground">Team 1</h4>
                {participants
                  .filter(p => p.team === 100)
                  .map(participant => (
                    <div key={participant.summonerName} className="flex items-center gap-2 mb-2">
                      <div className="relative flex items-center gap-1">
                        {participant.mainStyle && (
                          <Image
                            src={participant.mainStyle}
                            alt="Main Style"
                            width={25}
                            height={25}
                            className="object-cover rounded-md"
                          />
                        )}
                        {participant.subStyle && (
                          <Image
                            src={participant.subStyle}
                            alt="Sub Style"
                            width={15}
                            height={15}
                            className="hidden object-cover rounded-md sm:inline"
                          />
                        )}
                      </div>
                      <div className="relative flex-shrink-0 w-8 h-8 cursor-pointer" onClick={(e) => {
                        e.stopPropagation()
                        window.location.href = `/summoner/${region}/${participant.riotIdGameName}/${participant.riotIdTagline}/all`
                      }}>
                        <Image
                          src={`https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/${participant.championId}.png`}
                          alt={participant.championName}
                          fill
                          className="rounded-full"
                        />
                      </div>
                      <div className="flex-wrap items-center gap-1 flexbox">
                        <Image
                          src={participant.spell1Url || ''}
                          alt="Spell 1"
                          width={15}
                          height={15}
                          className="object-cover mb-1 rounded"
                        />
                        <Image
                          src={participant.spell2Url || ''}
                          alt="Spell 2"
                          width={15}
                          height={15}
                          className="object-cover rounded"
                        />
                      </div>
                      <div className="flex flex-col flex-1 min-w-0">
                        <span
                          className="hidden sm:inline text-sm truncate cursor-pointer hover:underline max-w-[120px] inline-block"
                          onClick={(e) => {
                            e.stopPropagation()
                            window.location.href = `/summoner/${region}/${participant.riotIdGameName}/${participant.riotIdTagline}/all`
                          }}
                          title={participant.summonerName}
                        >
                          {participant.summonerName}
                        </span>
                        <span
                          className="text-sm font-medium cursor-pointer sm:hidden hover:underline"
                          onClick={(e) => {
                            e.stopPropagation()
                            window.location.href = `/summoner/${region}/${participant.riotIdGameName}/${participant.riotIdTagline}/all`
                          }}
                        >
                          {participant.summonerName.slice(0, 3)}
                        </span>
                        <span className="text-xs text-left sm:text-sm text-muted-foreground">
                          {participant.kills}/{participant.deaths}/{participant.assists}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 ml-auto">
                        {participant.items.slice(0, 7).map((item) => (
                        <div
                          key={item.id}
                          className="relative w-5 h-5 rounded-md bg-background/50"
                        >
                          {item.imageUrl && (
                            <Image
                              src={item.imageUrl}
                              alt={`Item ${item.id}`}
                              fill
                              className="object-cover rounded-md "
                            />
                          )}
                        </div>
                      ))}
                      </div>
                    </div>
                  ))}
              </div>
              <div className="space-y-2 md:border-l md:border-border/50 md:pl-4">
                <h4 className="mb-2 text-xs font-medium sm:text-sm text-muted-foreground">Team 2</h4>
                {participants
                  .filter(p => p.team === 200)
                  .map(participant => (
                    <div key={participant.summonerName} className="flex items-center gap-2 mb-2">
                      <div className="relative flex items-center gap-1">
                        {participant.mainStyle && (
                          <Image
                            src={participant.mainStyle}
                            alt="Main Style"
                            width={25}
                            height={25}
                            className="object-cover rounded-md"
                          />
                        )}
                        {participant.subStyle && (
                          <Image
                            src={participant.subStyle}
                            alt="Sub Style"
                            width={15}
                            height={15}
                            className="hidden object-cover rounded-md sm:inline"
                          />
                        )}
                      </div>
                      <div className="relative flex-shrink-0 w-8 h-8 cursor-pointer" onClick={(e) => {
                        e.stopPropagation()
                        window.location.href = `/summoner/${region}/${participant.riotIdGameName}/${participant.riotIdTagline}/all`
                      }}>
                        <Image
                          src={`https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/${participant.championId}.png`}
                          alt={participant.championName}
                          fill
                          className="rounded-full"
                        />
                      </div>
                      <div className="flex-wrap items-center gap-1 flexbox">
                        <Image
                          src={participant.spell1Url || ''}
                          alt="Spell 1"
                          width={15}
                          height={15}
                          className="object-cover mb-1 rounded"
                        />
                        <Image
                          src={participant.spell2Url || ''}
                          alt="Spell 2"
                          width={15}
                          height={15}
                          className="object-cover rounded"
                        />
                      </div>
                      <div className="flex flex-col flex-1 min-w-0">
                        <span
                          className="hidden sm:inline text-sm truncate cursor-pointer hover:underline max-w-[120px] inline-block"
                          onClick={(e) => {
                            e.stopPropagation()
                            window.location.href = `/summoner/${region}/${participant.riotIdGameName}/${participant.riotIdTagline}/all`
                          }}
                          title={participant.summonerName}
                        >
                          {participant.summonerName}
                        </span>
                        <span
                          className="text-sm font-medium cursor-pointer sm:hidden hover:underline"
                          onClick={(e) => {
                            e.stopPropagation()
                            window.location.href = `/summoner/${region}/${participant.riotIdGameName}/${participant.riotIdTagline}/all`
                          }}
                        >
                          {participant.summonerName.slice(0, 3)}
                        </span>
                        <span className="text-xs text-left sm:text-sm text-muted-foreground">
                          {participant.kills}/{participant.deaths}/{participant.assists}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 ml-auto">
                        {participant.items.slice(0, 7).map((item) => (
                          <div
                            key={item.id}
                            className="relative w-5 h-5 rounded-md bg-background/50"
                          >
                            {item.imageUrl && (
                              <Image
                                src={item.imageUrl}
                                alt={`Item ${item.id}`}
                                fill
                                className="object-cover rounded-md "
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
