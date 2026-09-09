"use client";

import { Card } from "../ui/Card";
import Image from "next/image";

interface TftRank {
  tier?: string;
  rank?: string;
  leaguePoints?: number;
  wins?: number;
  losses?: number;
  hotStreak?: boolean;
  veteran?: boolean;
  queueType?: string;
}

interface TftProfileProps {
  name: string;
  gameName?: string;
  tagLine?: string;
  level: number;
  profileIconId: number;
  region: string;
  rank?: TftRank | null;
}

export function TftProfile({
  name,
  gameName,
  tagLine,
  level,
  profileIconId,
  region,
  rank,
}: TftProfileProps) {
  const displayName =
    gameName?.replace(/\s+/g, " ") && tagLine
      ? `${gameName.replace(/\s+/g, " ")}#${tagLine}`
      : name || "Carregando...";

  const tier = rank?.tier || null;
  const tierName = tier
    ? tier.charAt(0) + tier.slice(1).toLowerCase()
    : null;
  const division = rank?.rank || "";
  const lp = rank?.leaguePoints ?? null;
  const wins = rank?.wins ?? 0;
  const losses = rank?.losses ?? 0;
  const total = wins + losses;
  const winrate = total > 0 ? ((wins / total) * 100).toFixed(1) : null;

  const getTierIconUrl = (
    tier: string | null,
    tierName: string | null,
  ) => {
    if (!tier) return null;
    const iconKey =
      tierName?.toLowerCase() || tier.toLowerCase();
    return `https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/images/ranked-mini-crests/${iconKey}.svg`;
  };

  const tierIconUrl = getTierIconUrl(tier, tierName);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-6">
        <div className="relative w-24 h-24">
          <Image
            src={`https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/profile-icons/${profileIconId}.jpg`}
            alt={`${displayName}'s profile icon`}
            fill={true}
            sizes="80px"
            priority
            className="object-cover border-4 rounded-full border-accent"
          />
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-accent px-2 py-0.5 text-xs font-medium">
            {level}
          </div>
        </div>

        <div className="flex-1">
          <h1 className="mb-2 text-3xl font-bold text-primary">
            {displayName}
          </h1>
          <div className="flex flex-col gap-1">
            <p className="text-sm text-muted-foreground">Region: {region}</p>
            {tierName ? (
              <p className="flex items-center gap-2 text-sm">
                {tierIconUrl && (
                  <Image
                    src={tierIconUrl}
                    alt={`${tierName} tier`}
                    width={24}
                    height={24}
                    priority
                    className="inline-block"
                  />
                )}
                <span className="font-medium">
                  {tierName}
                  {division ? ` ${division}` : ""}
                </span>
                {lp !== null && <span>({lp} LP)</span>}
                <span>
                  {wins}W / {losses}L
                </span>
                {winrate && <span>({winrate}%)</span>}
                {rank?.hotStreak && (
                  <span className="font-medium text-green-500">🔥 Hot streak</span>
                )}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Não há dados ranqueados TFT para este invocador.
              </p>
            )}
          </div>
        </div>
      </div>

      {tierName && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">Ranked TFT</p>
            <p className="mt-1 font-semibold">
              {tierName}
              {division ? ` ${division}` : ""}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">LP</p>
            <p className="mt-1 font-semibold">{lp ?? "-"}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">Wins / Losses</p>
            <p className="mt-1 font-semibold">
              {wins} / {losses}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">Win Rate</p>
            <p className="mt-1 font-semibold">{winrate ? `${winrate}%` : "-"}</p>
          </Card>
        </div>
      )}
    </div>
  );
}