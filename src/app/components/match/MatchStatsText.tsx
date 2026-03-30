"use client";

import { useEffect, useState } from "react";

interface Props {
  initialWins: number;
  initialLosses: number;
  gameName: string;
  queueType: string;
  championName: string;
}

export function MatchStatsText({
  initialWins,
  initialLosses,
  gameName,
  queueType,
  championName,
}: Props) {
  const [wins, setWins] = useState(initialWins);
  const [losses, setLosses] = useState(initialLosses);

  useEffect(() => {
    const handler = (e: CustomEvent) => {
      setWins(e.detail.wins);
      setLosses(e.detail.losses);
    };
    window.addEventListener("matchStatsUpdate", handler as EventListener);
    return () =>
      window.removeEventListener("matchStatsUpdate", handler as EventListener);
  }, []);

  const total = wins + losses;
  const winrate = total > 0 ? Math.round((wins / total) * 100) : 0;

  return (
    <p className="text-sm text-muted-foreground">
      Recent games played by {gameName} on {queueType} with {championName} -
      last {total} games: {wins} - {losses} - {winrate}%
    </p>
  );
}
