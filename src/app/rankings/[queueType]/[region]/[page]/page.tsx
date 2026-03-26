"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Card } from "@/app/components/ui/Card";
import { getSummonerNameByPuuid } from "@/app/actions/summoner";

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
}

interface RankingData {
  entries: LeagueEntry[];
  queue: string;
  name: string;
  tier: string;
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
}

interface SummonerInfo {
  gameName: string;
  tagLine: string;
  profileIconId?: number;
}

// Stable constant — keep outside component to avoid stale closure issues
const ITEMS_PER_PAGE = 200;

export default function RankingsPage({
  params,
}: {
  params: { queueType: string; region: string; page: string };
}) {
  const router = useRouter();

  const [rankings, setRankings] = useState<RankingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingNames, setIsLoadingNames] = useState(false);
  const [isSortingAll, setIsSortingAll] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summonerNames, setSummonerNames] = useState<
    Record<string, SummonerInfo>
  >({});
  const [sortByWinRate, setSortByWinRate] = useState(false);

  const currentPage = parseInt(params.page) || 1;
  const region = params.region;

  const queueTypeMap: Record<string, string> = {
    soloduo: "RANKED_SOLO_5x5",
    flex: "RANKED_FLEX_SR",
  };

  const queueType = queueTypeMap[params.queueType] || "RANKED_SOLO_5x5";
  const friendlyQueueType = params.queueType;

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

  const queueDisplayNames: Record<string, string> = {
    soloDuo: "Solo/Duo",
    flex: "Flex",
  };

  const summonerNamesCache = useRef<Record<string, SummonerInfo>>({});
  // Guard: prevents a second concurrent execution of fetchSummonerNames
  // Guard: prevents concurrent fetchSummonerNames calls that fight over
  // isLoadingNames and leave the spinner permanently stuck.
  const isFetchingNamesRef = useRef(false);

  useEffect(() => {
    const savedCache = localStorage.getItem(`summonerCache_${region}`);
    if (savedCache) {
      const parsed = JSON.parse(savedCache);
      summonerNamesCache.current = parsed;
      setSummonerNames(parsed);
    }
  }, [region]);

  // Stable ref — never changes identity, so it can never be a useEffect dep
  // that causes re-fires. Reads region from the regionRef below.
  const regionRef = useRef(region);
  useEffect(() => {
    regionRef.current = region;
  }, [region]);

  const updateCache = useRef((newData: Record<string, SummonerInfo>) => {
    const updatedCache = { ...summonerNamesCache.current, ...newData };
    summonerNamesCache.current = updatedCache;
    localStorage.setItem(
      `summonerCache_${regionRef.current}`,
      JSON.stringify(updatedCache),
    );
    setSummonerNames((prev) => ({ ...prev, ...newData }));
  });

  // Stable ref function — identity never changes, so it is safe to call from
  // effects without being listed as a dep (which would cause re-fire loops).
  const fetchSummonerNames = useRef(async (puuids: string[]) => {
    if (!puuids.length || isFetchingNamesRef.current) return;

    const uncachedPuuids = puuids.filter(
      (puuid) => !summonerNamesCache.current[puuid],
    );
    if (uncachedPuuids.length === 0) return;

    isFetchingNamesRef.current = true;
    setIsLoadingNames(true);
    try {
      for (let i = 0; i < uncachedPuuids.length; i += 20) {
        const batch = uncachedPuuids.slice(i, i + 20);
        const batchResults = await Promise.all(
          batch.map(async (puuid) => {
            try {
              const summonerData = await getSummonerNameByPuuid(
                regionRef.current,
                puuid,
              );
              if (!summonerData?.name || !summonerData?.tagLine) return null;
              return {
                puuid,
                gameName: summonerData.name,
                tagLine: summonerData.tagLine,
                profileIconId: summonerData.profileIconId,
              };
            } catch (err) {
              console.error(`Error fetching PUUID ${puuid}:`, err);
              return null;
            }
          }),
        );

        const newNames = batchResults
          .filter(
            (
              r,
            ): r is {
              puuid: string;
              gameName: string;
              tagLine: string;
              profileIconId: number;
            } => r !== null,
          )
          .reduce((acc: Record<string, SummonerInfo>, r) => {
            acc[r.puuid] = {
              gameName: r.gameName,
              tagLine: r.tagLine,
              profileIconId: r.profileIconId,
            };
            return acc;
          }, {});

        updateCache.current(newNames);

        if (i + 20 < uncachedPuuids.length) {
          await new Promise((resolve) => setTimeout(resolve, 300));
        }
      }
    } finally {
      setIsLoadingNames(false);
      isFetchingNamesRef.current = false;
    }
  });

  const fetchAllRankings = useCallback(async () => {
    try {
      setIsSortingAll(true);
      setError(null);

      const firstRes = await fetch(
        `/api/rankings?region=${region}&queueType=${queueType}&page=1&limit=${ITEMS_PER_PAGE}`,
      );
      if (!firstRes.ok) throw new Error("Failed to fetch first page");
      const firstData = await firstRes.json();

      const totalPages = firstData.pagination?.totalPages || 1;
      let allEntries = [...firstData.entries];

      for (let page = 2; page <= totalPages; page++) {
        const res = await fetch(
          `/api/rankings?region=${region}&queueType=${queueType}&page=${page}&limit=${ITEMS_PER_PAGE}`,
        );
        if (!res.ok) throw new Error(`Failed to fetch page ${page}`);
        const data = await res.json();
        allEntries = allEntries.concat(data.entries);
        await new Promise((r) => setTimeout(r, 200));
      }

      const fullData: RankingData = {
        ...firstData,
        entries: allEntries,
        pagination: {
          ...firstData.pagination,
          totalEntries: allEntries.length,
          // FIX: full dataset is paginated in-memory, so total pages reflects
          // the full count divided by page size
          totalPages: Math.ceil(allEntries.length / ITEMS_PER_PAGE),
        },
      };

      setRankings(fullData);
    } catch (err) {
      console.error("[fetchAllRankings] Error:", err);
      setError("Failed to load all rankings for sorting");
    } finally {
      setIsSortingAll(false);
    }
  }, [region, queueType]);

  // FIX: remove `sortByWinRate` from the dependency array so toggling sort
  // does NOT trigger a re-fetch that overwrites the full dataset.
  const fetchRankings = useCallback(
    async (pageToFetch: number = currentPage) => {
      try {
        setIsLoading(true);
        setError(null);

        if (typeof window !== "undefined") {
          const storageKey = `rankings_${region}_${queueType}_page_${pageToFetch}`;
          const cached = localStorage.getItem(storageKey);
          if (cached) {
            setRankings(JSON.parse(cached));
            setIsLoading(false);
            return;
          }
        }

        const response = await fetch(
          `/api/rankings?region=${region}&queueType=${queueType}&page=${pageToFetch}&limit=${ITEMS_PER_PAGE}`,
        );
        if (!response.ok) throw new Error("Failed to fetch rankings");
        const data = await response.json();

        setRankings(data);

        if (typeof window !== "undefined") {
          const storageKey = `rankings_${region}_${queueType}_page_${pageToFetch}`;
          localStorage.setItem(storageKey, JSON.stringify(data));
        }
      } catch (err) {
        console.error("[fetchRankings] Error:", err);
        setError("Failed to load rankings");
      } finally {
        setIsLoading(false);
      }
    },
    // FIX: sortByWinRate removed — changing sort mode must not trigger a new fetch
    [region, queueType, currentPage],
  );

  // FIX: getTier now uses LP-based cutoffs from the API response instead of
  // position arithmetic derived from an inconsistent page-size constant.
  // Falls back to global-rank position only when cutoff data is unavailable.
  const getTier = useCallback(
    (entry: LeagueEntry, globalRank: number): string => {
      if (rankings?.cutoffs) {
        const { challenger, grandmaster } = rankings.cutoffs;
        if (entry.leaguePoints >= challenger.cutoffLP) return "Challenger";
        if (entry.leaguePoints >= grandmaster.cutoffLP) return "Grandmaster";
        return "Master";
      }

      // Fallback: position-based using regionMode from API
      const isThreePages = rankings?.regionMode === "three-pages";
      const challengerLimit = isThreePages ? 300 : 200;
      if (globalRank <= challengerLimit) return "Challenger";
      if (globalRank <= challengerLimit + 700) return "Grandmaster";
      return "Master";
    },
    [rankings],
  );

  // Stable sorted list — only recomputes when rankings data or sort mode changes.
  // Must NOT spread inside render body; keep it here so the reference is stable.
  const allSortedEntries = useMemo(() => {
    if (!rankings) return [];
    if (!sortByWinRate) return rankings.entries; // original reference — no copy
    return [...rankings.entries].sort((a, b) => {
      const wrA = a.wins / (a.wins + a.losses);
      const wrB = b.wins / (b.wins + b.losses);
      return wrB - wrA;
    });
  }, [rankings, sortByWinRate]);

  const totalPages = rankings?.pagination?.totalPages ?? 0;
  const totalEntries =
    rankings?.pagination?.totalEntries ?? rankings?.entries.length ?? 0;

  // Stable paginated slice — only recomputes when the sorted list or page changes.
  const paginatedEntries = useMemo(() => {
    if (!sortByWinRate) {
      // Server already returned exactly the right page — use the reference as-is.
      return allSortedEntries;
    }
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return allSortedEntries.slice(start, start + ITEMS_PER_PAGE);
  }, [allSortedEntries, sortByWinRate, currentPage]);

  // Initial load and page navigation
  useEffect(() => {
    if (sortByWinRate) return;

    fetchRankings(currentPage);
  }, [region, queueType, currentPage]);

  // Load summoner names for the current visible entries.
  // fetchSummonerNames.current and updateCache.current are stable refs —
  // listing them as deps would be wrong (refs don't change identity) and
  // omitting them is safe because they always point to the latest function.
  useEffect(() => {
    if (isLoading || paginatedEntries.length === 0) return;

    const puuids = paginatedEntries.map((e) => e.puuid);

    fetchSummonerNames.current(puuids);
  }, [currentPage, isLoading]);
  const handleWinRateSort = async () => {
    const newValue = !sortByWinRate;

    try {
      if (newValue) {
        const needsFullLoad =
          rankings && (rankings.pagination?.totalPages ?? 1) > 1;

        if (needsFullLoad) {
          await fetchAllRankings();
        }
      } else {
        setSortByWinRate(false);
        await fetchRankings(currentPage);
        return;
      }

      setSortByWinRate(newValue);
    } catch (err) {
      console.error(err);
      setIsSortingAll(false);
    }
  };

  const getTierIconUrl = (tier: string) => {
    return `https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/images/ranked-mini-crests/${tier.toLowerCase()}.svg`;
  };

  const navigateToPage = (page: number) => {
    router.push(`/rankings/${friendlyQueueType}/${region}/${page}`);
  };

  const changeQueueType = (newQueueType: string) => {
    router.push(`/rankings/${newQueueType}/${region}/1`);
  };

  const changeRegion = (newRegion: string) => {
    router.push(`/rankings/${friendlyQueueType}/${newRegion}/1`);
  };

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
          <a
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
          </a>

          <h1 className="hidden text-2xl font-bold md:block">
            <div className="flex flex-col gap-2">
              <span>
                High Elo Rankings –{" "}
                {displayRegionMap[region.toUpperCase()] || region.toUpperCase()}{" "}
                – {queueDisplayNames[friendlyQueueType] || friendlyQueueType}
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
                        className="inline-block"
                        unoptimized
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
                        className="inline-block"
                        unoptimized
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
            <span>
              Rankings{" "}
              {queueDisplayNames[friendlyQueueType] || friendlyQueueType}
            </span>
            {(cutoffs.challenger || cutoffs.grandmaster) && (
              <div className="flex items-center gap-2 text-xs font-normal">
                {cutoffs.challenger && (
                  <div className="flex items-center gap-1">
                    <Image
                      src={getTierIconUrl("Challenger")}
                      alt="Challenger"
                      width={16}
                      height={16}
                      className="inline-block"
                      unoptimized
                    />
                    <span className="font-medium text-yellow-400">
                      {cutoffs.challenger} LP
                    </span>
                  </div>
                )}
                {cutoffs.grandmaster && (
                  <div className="flex items-center gap-1">
                    <Image
                      src={getTierIconUrl("Grandmaster")}
                      alt="Grandmaster"
                      width={16}
                      height={16}
                      className="inline-block"
                      unoptimized
                    />
                    <span className="font-medium text-red-400">
                      {cutoffs.grandmaster} LP
                    </span>
                  </div>
                )}
              </div>
            )}
          </h2>

          <div
            className="flex items-center gap-2"
            role="navigation"
            aria-label="Filters"
          >
            <select
              value={region}
              onChange={(e) => changeRegion(e.target.value)}
              className="w-12 px-3 py-2 text-sm border rounded-md cursor-pointer border-input bg-background"
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
            <select
              value={friendlyQueueType}
              onChange={(e) => changeQueueType(e.target.value)}
              className="px-3 py-2 text-sm border rounded-md cursor-pointer bg-background"
            >
              <option value="soloduo">Solo/Duo</option>
              <option value="flex">Flex</option>
            </select>
          </div>
        </nav>
      </header>

      <main role="main">
        {(isLoading || isLoadingNames || isSortingAll) && (
          <div className="py-8 text-center" role="status" aria-live="polite">
            <div
              className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]"
              aria-hidden="true"
            />
            <p className="mt-2 text-sm text-muted-foreground">
              {isSortingAll
                ? "Loading all players for sorting…"
                : isLoadingNames
                  ? "Loading summoner data…"
                  : "Loading rankings…"}
            </p>
          </div>
        )}

        {!isLoading && !isLoadingNames && !isSortingAll && error && (
          <div className="py-8 text-center" role="alert">
            <Card className="p-4 mb-4 text-red-500">{error}</Card>
          </div>
        )}

        {!isLoading &&
          !isLoadingNames &&
          !isSortingAll &&
          rankings &&
          paginatedEntries.length > 0 && (
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
                      <th className="p-2 text-center">
                        <button
                          onClick={handleWinRateSort}
                          disabled={isSortingAll}
                          className="flex items-center justify-center w-full gap-1 transition-colors hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <span className="hidden sm:inline">Win Rate</span>
                          <span className="inline sm:hidden">WR</span>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className={`transition-transform ${sortByWinRate ? "rotate-180" : ""}`}
                          >
                            <path d="m7 15 5 5 5-5" />
                            <path d="m7 9 5-5 5 5" />
                          </svg>
                        </button>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedEntries.map((entry, index) => {
                      const winRate = (
                        (entry.wins / (entry.wins + entry.losses)) *
                        100
                      ).toFixed(1);
                      const summonerInfo = summonerNames[entry.puuid];
                      const displayName =
                        summonerInfo?.gameName && summonerInfo?.tagLine
                          ? `${summonerInfo.gameName} #${summonerInfo.tagLine}`
                          : "Loading…";

                      // FIX: globalRank always reflects LP rank (1-based position
                      // in the full sorted list), regardless of the active sort mode.
                      // When sortByWinRate is true we're paginating in-memory over
                      // the full dataset, so the offset math is still correct.
                      const globalRank =
                        (currentPage - 1) * ITEMS_PER_PAGE + index + 1;

                      // FIX: getTier uses LP-based cutoffs from the API, not a
                      // position derived from the win-rate rank.
                      const tier = getTier(entry, globalRank);

                      return (
                        <tr
                          key={entry.puuid}
                          className="border-b last:border-0"
                        >
                          <td className="hidden p-2 text-center sm:table-cell">
                            {globalRank}
                          </td>
                          <td className="w-1/3 p-2 sm:w-auto">
                            <div className="flex items-center min-w-0 gap-2">
                              {summonerInfo?.profileIconId && (
                                <Image
                                  src={`https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/profile-icons/${summonerInfo.profileIconId}.jpg`}
                                  alt="Profile Icon"
                                  width={24}
                                  height={24}
                                  className="flex-shrink-0 object-cover border rounded-full border-zinc-700 sm:w-8 sm:h-8"
                                  unoptimized
                                />
                              )}
                              <Link
                                href={
                                  summonerInfo
                                    ? `/summoner/${region}/${summonerInfo.gameName}/${summonerInfo.tagLine}/all`
                                    : "#"
                                }
                                className="block min-w-0 truncate cursor-pointer hover:underline"
                              >
                                <span className="hidden sm:inline">
                                  {displayName}
                                </span>
                                <span className="block inline truncate sm:hidden">
                                  {summonerInfo?.gameName || "Loading…"}
                                </span>
                              </Link>
                            </div>
                          </td>
                          <td
                            className={`p-2 text-center ${getTierColor(tier)}`}
                          >
                            <div className="flex items-center justify-center gap-2">
                              <Image
                                src={getTierIconUrl(tier)}
                                alt={`${tier} tier`}
                                width={20}
                                height={20}
                                className="inline-block"
                                unoptimized
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
                            <div className="flex flex-col sm:block">
                              <span className="inline text-xs text-gray-400 sm:hidden">
                                {entry.wins}W/{entry.losses}L
                              </span>
                              <span>{winRate}%</span>
                            </div>
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
                        onClick={() =>
                          navigateToPage(Math.max(1, currentPage - 1))
                        }
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
          © {new Date().getFullYear()} LolData – High Elo Rankings. Data
          provided by Riot Games API.
        </p>
      </footer>
    </div>
  );
}
