import { Card } from "../ui/Card"
import Image from "next/image"

interface ChampionMastery {
  championId: number
  championName: string
  level: number
  points: number
}

interface SummonerProfileProps {
  name: string
  level: number
  profileIconId: number
  region: string
  masteries: ChampionMastery[]
}

export function SummonerProfile({
  name,
  level,
  profileIconId,
  region,
  masteries,
}: SummonerProfileProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-6 p-6">
        <div className="relative h-24 w-24">
          <Image
            src={`https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/profile-icons/${profileIconId}.jpg`}
            alt={`${name}'s profile icon`}
            fill
            className="rounded-full border-4 border-accent object-cover"
          />
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-accent px-2 py-0.5 text-xs font-medium">
            {level}
          </div>
        </div>

        <div>
          <h1 className="text-3xl font-bold">{name}</h1>
          <p className="text-sm text-muted-foreground">
            Region: {region}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 p-6 md:grid-cols-5">
        {masteries.map((champion) => (
          <Card key={champion.championId} className="overflow-hidden">
            <div className="flex flex-col items-center gap-2 p-4">
              <div className="relative h-16 w-16">
                <Image
                  src={`https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/${champion.championId}.png`}
                  alt={champion.championName}
                  fill
                  className="rounded-full border-2 border-accent/50"
                />
                <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border border-accent/50 bg-background text-xs font-medium">
                  {champion.level}
                </div>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">{champion.championName}</p>
                <p className="text-xs text-muted-foreground">
                  {new Intl.NumberFormat().format(champion.points)} pts
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}