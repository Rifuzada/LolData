"use client";

import { use, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Card } from "@/app/components/ui/Card";

interface LeagueEntry {
  puuid: string;
  leaguePoints: number;
  rank: string;
  wins: number;
  losses: number;
  veteran: boolean;
  inactive: boolean;
  freshBlood: boolean;
  hotStreak: boolean;
  summonerId?: string;
}

interface CacheMeta {
  isFromCache: boolean;
  isStale: boolean;
  updatedAt: string;
  ageInMinutes: number;
  expiresInMinutes: number;
  ttlDays: number;
}

interface RankingData {
  entries: LeagueEntry[];
  queue: string;
  name: string;
  tier: string;
  summonerNames?: Record<
    string,
    { gameName: string; tagLine: string; profileIconId: number | null }
  >;
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalEntries: number;
    entriesPerPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  cutoffs?: {
    challenger: { cutoffLP: number; cutoffPosition: number };
    grandmaster: { cutoffLP: number };
  };
  regionMode?: string;
  cache?: CacheMeta;
}

interface SummonerInfo {
  gameName: string;
  tagLine: string;
  profileIconId?: number | null;
}

const RANKINGS_CACHE_TTL_MS = 10 * 60 * 1000; // 10 min (mesmo TTL do servidor)
const SUMMONER_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

const ITEMS_PER_PAGE = 200;

function readRankingsCache(key: string): RankingData | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { data, savedAt } = JSON.parse(raw);
    if (Date.now() - savedAt > RANKINGS_CACHE_TTL_MS) {
      localStorage.removeItem(key);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

function writeRankingsCache(key: string, data: RankingData) {
  try {
    localStorage.setItem(key, JSON.stringify({ data, savedAt: Date.now() }));
  } catch {
    // ignore quota errors
  }
}

function readSummonerCache(region: string): Record<string, SummonerInfo> {
  try {
    const raw = localStorage.getItem(`tftSummonerCache_${region}`);
    if (!raw) return {};
    const parsed: Record<string, { info: SummonerInfo; savedAt: number }> =
      JSON.parse(raw);
    const now = Date.now();
    const valid: Record<string, SummonerInfo> = {};
    for (const [puuid, entry] of Object.entries(parsed)) {
      const info = entry?.info;
      const isValid = Boolean(
        info?.gameName &&
          info.gameName !== "Unknown" &&
          info.gameName !== "Loading…" &&
          info?.tagLine &&
          info.tagLine !== "???",
      );
      if (now - entry.savedAt <= SUMMONER_CACHE_TTL_MS && isValid) {
        valid[puuid] = info;
      }
    }
    return valid;
  } catch {
    return {};
  }
}

function writeSummonerCache(
  region: string,
  cache: Record<string, SummonerInfo>,
) {
  try {
    const now = Date.now();
    const withTimestamps: Record<
      string,
      { info: SummonerInfo; savedAt: number }
    > = {};
    for (const [puuid, info] of Object.entries(cache)) {
      withTimestamps[puuid] = { info, savedAt: now };
    }
    localStorage.setItem(
      `tftSummonerCache_${region}`,
      JSON.stringify(withTimestamps),
    );
  } catch {
    // ignore quota errors
  }
}

export default function TftRankingsPage({
  params,
}: {
  params: Promise<{ region: string; page: string }>;
}) {
  const router = useRouter();

  const { region, page: pageParam } = use(params);

  const [rankings, setRankings] = useState<RankingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summonerNames, setSummonerNames] = useState<
    Record<string, SummonerInfo>
  >({});

  const currentPage = parseInt(pageParam) || 1;

  const displayRegionMap: Record<string, string> = {
    BR1: "BR",
    NA1: "NA",
    LA1: "LAN",
    LA2: "LAS",
    EUW1: "EUW",
    EUN1: "EUNE",
    KR: "KR",
    JP1: "JP",
    OC1: "OCE",
    TR1: "TR",
    RU: "RU",
    TW2: "TW",
    VN2: "VN",
    SG2: "SG",
    ME1: "ME",
  };

  const updateLocalSummonerCache = useCallback(
    (newData: Record<string, SummonerInfo>) => {
      const current = readSummonerCache(region);
      writeSummonerCache(region, { ...current, ...newData });
    },
    [region],
  );

  const fetchRankings = useCallback(
    async (pageToFetch: number = currentPage) => {
      try {
        setIsLoading(true);
        setError(null);

        if (typeof window !== "undefined") {
          const storageKey = `tft_rankings_${region}_page_${pageToFetch}`;
          const cached = readRankingsCache(storageKey);
          if (cached) {
            setSummonerNames(cached.summonerNames ?? {});
            setRankings(cached);
            setIsLoading(false);
            return;
          }
        }

        const response = await fetch(
          `/api/tft/rankings?region=${region}&page=${pageToFetch}&limit=${ITEMS_PER_PAGE}`,
        );
        if (!response.ok) throw new Error("Failed to fetch TFT rankings");

        const data: RankingData = await response.json();

        setSummonerNames(data.summonerNames ?? {});
        updateLocalSummonerCache(data.summonerNames ?? {});
        setRankings(data);

        if (typeof window !== "undefined") {
          const storageKey = `tft_rankings_${region}_page_${pageToFetch}`;
          writeRankingsCache(storageKey, data);
        }
      } catch (err) {
        console.error("[fetchRankings] Error:", err);
        setError("Failed to load TFT rankings");
      } finally {
        setIsLoading(false);
      }
    },
    [region, currentPage, updateLocalSummonerCache],
  );

  useEffect(() => {
    setRankings(null);
    setSummonerNames({});
    fetchRankings(currentPage);
  }, [region, currentPage, fetchRankings]);

  const getTier = useCallback(
    (entry: LeagueEntry, globalRank: number): string => {
      if (rankings?.cutoffs) {
        const { challenger, grandmaster } = rankings.cutoffs;
        if (entry.leaguePoints >= challenger.cutoffLP) return "Challenger";
        if (entry.leaguePoints >= grandmaster.cutoffLP) return "Grandmaster";
        return "Master";
      }

      const isThreePages = rankings?.regionMode === "three-pages";
      const challengerLimit = isThreePages ? 300 : 200;
      if (globalRank <= challengerLimit) return "Challenger";
      if (globalRank <= challengerLimit + 700) return "Grandmaster";
      return "Master";
    },
    [rankings],
  );

  const totalPages = rankings?.pagination?.totalPages ?? 0;
  const totalEntries =
    rankings?.pagination?.totalEntries ?? rankings?.entries.length ?? 0;

  const getTierIconUrl = (tier: string) =>
    `https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/images/ranked-mini-crests/${tier.toLowerCase()}.svg`;

  const navigateToPage = (page: number) =>
    router.push(`/tft/rankings/${region}/${page}`);

  const changeRegion = (newRegion: string) =>
    router.push(`/tft/rankings/${newRegion}/1`);

  const generatePageNumbers = (currentPage: number, totalPages: number) => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 7;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 4) pages.push("...");
      const start = Math.max(2, currentPage - 2);
      const end = Math.min(totalPages - 1, currentPage + 2);
      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) pages.push(i);
      }
      if (currentPage < totalPages - 3) pages.push("...");
      if (!pages.includes(totalPages)) pages.push(totalPages);
    }

    return pages;
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "Challenger":
        return "text-yellow-400 font-bold";
      case "Grandmaster":
        return "text-red-400 font-semibold";
      case "Master":
        return "text-purple-400 font-medium";
      default:
        return "text-gray-400";
    }
  };

  const cutoffs = rankings?.cutoffs
    ? {
        challenger: rankings.cutoffs.challenger?.cutoffLP ?? null,
        grandmaster: rankings.cutoffs.grandmaster?.cutoffLP ?? null,
      }
    : { challenger: null, grandmaster: null };

  return (
    <div className="container p-4 mx-auto">
      <header role="banner" className="mb-4">
        <nav
          className="flex items-center justify-between"
          role="navigation"
          aria-label="Principal"
        >
          <div className="flex gap-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-3 py-2 text-sm transition-colors border rounded-md bg-background border-input hover:bg-accent/50"
              aria-label="Back to home"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="m15 18-6-6 6-6" />
              </svg>
              Back
            </Link>
            <Link
              href={`/rankings/soloDuo/${region}/1`}
              className="inline-flex items-center px-3 py-2 text-sm transition-colors border rounded-md bg-background border-input hover:bg-accent/50"
            >
              LoL Rankings
            </Link>
          </div>

          <h1 className="hidden text-2xl font-bold md:block">
            <div className="flex flex-col gap-2">
              <span>
                TFT High Elo Rankings –{" "}
                {displayRegionMap[region.toUpperCase()] || region.toUpperCase()}
              </span>
              {(cutoffs.challenger || cutoffs.grandmaster) && (
                <div className="flex items-center gap-4 text-base font-normal">
                  <span>Cutoff:</span>
                  {cutoffs.challenger && (
                    <div className="flex items-center gap-1.5">
                      <Image
                        src={getTierIconUrl("Challenger")}
                        alt="Challenger"
                        width={24}
                        height={24}
                        unoptimized
                        className="inline-block"
                      />
                      <span className="font-semibold text-yellow-400">
                        {cutoffs.challenger} LP
                      </span>
                    </div>
                  )}
                  {cutoffs.grandmaster && (
                    <div className="flex items-center gap-1.5">
                      <Image
                        src={getTierIconUrl("Grandmaster")}
                        alt="Grandmaster"
                        width={24}
                        height={24}
                        unoptimized
                        className="inline-block"
                      />
                      <span className="font-semibold text-red-400">
                        {cutoffs.grandmaster} LP
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </h1>

          <h2 className="flex flex-col gap-1 text-xs font-bold md:hidden">
            <span>TFT Rankings</span>
            {(cutoffs.challenger || cutoffs.grandmaster) && (
              <div className="flex items-center gap-2 text-xs font-normal">
                {cutoffs.challenger && (
                  <span className="font-medium text-yellow-400">
                    Challenger {cutoffs.challenger} LP
                  </span>
                )}
                {cutoffs.grandmaster && (
                  <span className="font-medium text-red-400">
                    GM {cutoffs.grandmaster} LP
                  </span>
                )}
              </div>
            )}
          </h2>

          <select
            value={region}
            onChange={(e) => changeRegion(e.target.value)}
            className="w-12 px-3 py-2 text-sm border rounded-md cursor-pointer border-input bg-background"
            aria-label="Região"
          >
            <optgroup label="Americas">
              <option value="BR1">🇧🇷 – Brazil</option>
              <option value="NA1">🇺🇸 – North America</option>
              <option value="LA1">🇲🇽 – Latin America North</option>
              <option value="LA2">🇦🇷 – Latin America South</option>
            </optgroup>
            <optgroup label="Europe">
              <option value="EUW1">🇪🇸 – Western Europe</option>
              <option value="EUN1">🇸🇪 – Northern & Eastern Europe</option>
              <option value="RU">🇷🇺 – Russia</option>
              <option value="ME1">🇪🇬 – Middle East</option>
              <option value="TR1">🇹🇷 – Turkey</option>
            </optgroup>
            <optgroup label="Asia">
              <option value="KR">🇰🇷 – Korea</option>
              <option value="JP1">🇯🇵 – Japan</option>
            </optgroup>
            <optgroup label="South Asia">
              <option value="OC1">🇦🇺 – Oceania</option>
              <option value="TW2">🇹🇼 – Taiwan, HK & Macau</option>
              <option value="VN2">🇻🇳 – Vietnam</option>
              <option value="SG2">🇸🇬 – Singapore</option>
            </optgroup>
          </select>
        </nav>
      </header>

      <main role="main">
        {isLoading && (
          <div className="py-8 text-center" role="status" aria-live="polite">
            <div
              className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]"
              aria-hidden="true"
            />
            <p className="mt-2 text-sm text-muted-foreground">
              Loading TFT rankings and summoner names…
            </p>
          </div>
        )}

        {!isLoading && error && (
          <div className="py-8 text-center" role="alert">
            <Card className="p-4 mb-4 text-red-500">{error}</Card>
          </div>
        )}

        {!isLoading && !error && rankings && rankings.entries.length > 0 && (
          <div className="grid gap-4">
            <Card className="p-4">
              <table className="w-full mx-auto">
                <thead>
                  <tr className="border-b">
                    <th className="hidden p-2 text-center sm:table-cell">
                      Rank
                    </th>
                    <th className="w-1/5 p-2 text-left sm:text-center sm:w-auto">
                      Name
                    </th>
                    <th className="p-2 text-center">Tier</th>
                    <th className="p-2 text-center">LP</th>
                    <th className="hidden p-2 text-center sm:table-cell">
                      Wins
                    </th>
                    <th className="hidden p-2 text-center sm:table-cell">
                      Losses
                    </th>
                    <th className="p-2 text-center">Win Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {rankings.entries.map((entry, index) => {
                    const winRate = (
                      (entry.wins / (entry.wins + entry.losses)) *
                      100
                    ).toFixed(1);
                    const summonerInfo = summonerNames[entry.puuid];
                    const displayName = summonerInfo
                      ? `${summonerInfo.gameName} #${summonerInfo.tagLine}`
                      : entry.puuid.slice(0, 8);

                    const globalRank =
                      (currentPage - 1) * ITEMS_PER_PAGE + index + 1;

                    const tier = getTier(entry, globalRank);

                    return (
                      <tr key={entry.puuid} className="border-b last:border-0">
                        <td className="hidden p-2 text-center sm:table-cell">
                          {globalRank}
                        </td>
                        <td className="w-1/3 p-2 sm:w-auto">
                          <div className="flex items-center min-w-0 gap-2">
                            {summonerInfo?.profileIconId != null &&
                              summonerInfo.profileIconId > 0 && (
                                <Image
                                  src={`https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/profile-icons/${summonerInfo.profileIconId}.jpg`}
                                  alt="Profile Icon"
                                  width={24}
                                  height={24}
                                  className="flex-shrink-0 object-cover border rounded-full border-zinc-700 sm:w-8 sm:h-8"
                                  unoptimized
                                  priority={index < 5}
                                  loading={index < 5 ? "eager" : "lazy"}
                                />
                              )}
                            <Link
                              href={
                                summonerInfo
                                  ? `/tft/${region}/${summonerInfo.gameName}/${summonerInfo.tagLine}`
                                  : "#"
                              }
                              className="block min-w-0 truncate cursor-pointer hover:underline"
                            >
                              <span className="hidden sm:inline">
                                {displayName}
                              </span>
                              <span className="block inline truncate sm:hidden">
                                {summonerInfo?.gameName ?? displayName}
                              </span>
                            </Link>
                          </div>
                        </td>
                        <td className={`p-2 text-center ${getTierColor(tier)}`}>
                          <div className="flex items-center justify-center gap-2">
                            <Image
                              src={getTierIconUrl(tier)}
                              alt={`${tier} tier`}
                              width={20}
                              height={20}
                              unoptimized
                              className="inline-block"
                              loading={index < 5 ? "eager" : "lazy"}
                            />
                            <span className="hidden md:inline">{tier}</span>
                          </div>
                        </td>
                        <td className="p-2 text-center">
                          {entry.leaguePoints}
                          <span className="hidden sm:inline"> LP</span>
                        </td>
                        <td className="hidden p-2 text-center sm:table-cell">
                          {entry.wins}
                        </td>
                        <td className="hidden p-2 text-center sm:table-cell">
                          {entry.losses}
                        </td>
                        <td className="p-2 text-center">
                          <span>{winRate}%</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Pagination */}
              <div className="flex items-center justify-between px-2 mt-4">
                <div className="text-sm text-muted-foreground">
                  {`Showing ${(currentPage - 1) * ITEMS_PER_PAGE + 1}–${Math.min(
                    currentPage * ITEMS_PER_PAGE,
                    totalEntries,
                  )} of ${totalEntries}`}
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => navigateToPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 text-sm border rounded-md bg-background hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      ‹
                    </button>

                    {generatePageNumbers(currentPage, totalPages).map(
                      (page, index) => (
                        <button
                          key={index}
                          onClick={() =>
                            typeof page === "number" && navigateToPage(page)
                          }
                          disabled={page === "..." || page === currentPage}
                          className={`px-3 py-1 text-sm border rounded-md ${
                            page === currentPage
                              ? "bg-primary text-primary-foreground border-primary"
                              : page === "..."
                                ? "bg-background border-input cursor-default"
                                : "bg-background hover:bg-accent border-input"
                          } ${page === "..." ? "cursor-default" : "cursor-pointer"}`}
                        >
                          {page}
                        </button>
                      ),
                    )}

                    <button
                      onClick={() =>
                        navigateToPage(Math.min(totalPages, currentPage + 1))
                      }
                      disabled={currentPage >= totalPages}
                      className="px-3 py-1 text-sm border rounded-md bg-background hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      ›
                    </button>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}
      </main>

      <footer
        role="contentinfo"
        className="mt-8 text-sm text-center text-muted-foreground"
      >
        <p>
          © {new Date().getFullYear()} LolData – TFT High Elo Rankings. Data
          provided by Riot Games API.
        </p>
      </footer>
    </div>
  );
}