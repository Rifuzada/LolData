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
    challenger: { cutoffLP: number };
    grandmaster: { cutoffLP: number };
  };
  regionMode?: string;
}

interface SummonerInfo {
  gameName: string;
  tagLine: string;
  profileIconId?: number;
}

export default function RankingsPage({
  params,
}: {
  params: { queueType: string; region: string; page: string };
}) {
  const router = useRouter();

  // Estados
  const [rankings, setRankings] = useState<RankingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingNames, setIsLoadingNames] = useState(false);
  const [isSortingAll, setIsSortingAll] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summonerNames, setSummonerNames] = useState<
    Record<string, SummonerInfo>
  >({});
  const [sortByWinRate, setSortByWinRate] = useState(false);

  // Parse page from URL params
  const currentPage = parseInt(params.page) || 1;
  const region = params.region;

  // Convert friendly URL names to API queue types
  const queueTypeMap: Record<string, string> = {
    soloduo: "RANKED_SOLO_5x5",
    flex: "RANKED_FLEX_SR",
  };

  const queueType = queueTypeMap[params.queueType] || "RANKED_SOLO_5x5";
  const friendlyQueueType = params.queueType;

  const itemsPerPage = 200;

  // Mapas de exibição
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

  // Cache management
  const summonerNamesCache = useRef<Record<string, SummonerInfo>>({});

  useEffect(() => {
    const savedCache = localStorage.getItem(`summonerCache_${region}`);
    if (savedCache) {
      const parsed = JSON.parse(savedCache);
      summonerNamesCache.current = parsed;
      setSummonerNames(parsed);
    }
  }, [region]);

  const updateCache = useCallback(
    (newData: Record<string, SummonerInfo>) => {
      const updatedCache = { ...summonerNamesCache.current, ...newData };
      summonerNamesCache.current = updatedCache;
      localStorage.setItem(
        `summonerCache_${region}`,
        JSON.stringify(updatedCache),
      );
      setSummonerNames((prev) => ({ ...prev, ...newData }));
    },
    [region],
  );

  // Fetch summoner names in batches
  const fetchSummonerNames = useCallback(
    async (puuids: string[]) => {
      if (!puuids.length) return;

      const uncachedPuuids = puuids.filter(
        (puuid) => !summonerNamesCache.current[puuid],
      );

      if (uncachedPuuids.length === 0) {
        setSummonerNames((prev) => ({
          ...prev,
          ...puuids.reduce(
            (acc, puuid) => {
              if (summonerNamesCache.current[puuid]) {
                acc[puuid] = summonerNamesCache.current[puuid];
              }
              return acc;
            },
            {} as Record<string, SummonerInfo>,
          ),
        }));
        return;
      }

      setIsLoadingNames(true);
      try {
        for (let i = 0; i < uncachedPuuids.length; i += 20) {
          const batch = uncachedPuuids.slice(i, i + 20);
          const batchPromises = batch.map(async (puuid) => {
            try {
              const summonerData = await getSummonerNameByPuuid(region, puuid);
              if (!summonerData?.name || !summonerData?.tagLine) return null;
              return {
                puuid,
                gameName: summonerData.name,
                tagLine: summonerData.tagLine,
                profileIconId: summonerData.profileIconId,
              };
            } catch (error) {
              console.error(
                `Error fetching summoner name for PUUID ${puuid}:`,
                error instanceof Error ? error.message : "Unknown error",
              );
              return null;
            }
          });

          const batchResults = await Promise.all(batchPromises);
          const validResults = batchResults.filter(
            (
              result,
            ): result is {
              puuid: string;
              gameName: string;
              tagLine: string;
              profileIconId: number;
            } => result !== null,
          );

          const newNames = validResults.reduce(
            (acc: Record<string, SummonerInfo>, result) => {
              acc[result.puuid] = {
                gameName: result.gameName,
                tagLine: result.tagLine,
                profileIconId: result.profileIconId,
              };
              return acc;
            },
            {},
          );

          updateCache(newNames);

          if (i + 20 < uncachedPuuids.length) {
            await new Promise((resolve) => setTimeout(resolve, 300));
          }
        }
      } finally {
        setIsLoadingNames(false);
      }
    },
    [region, updateCache],
  );

  // Fetch all rankings data
  const fetchAllRankings = useCallback(async () => {
    try {
      console.log("[fetchAllRankings] Iniciando busca de todos os dados...");
      console.log("[fetchAllRankings] region:", region);
      console.log("[fetchAllRankings] queueType:", queueType);
      console.log("[fetchAllRankings] itemsPerPage:", itemsPerPage);

      setIsSortingAll(true);
      setError(null);

      console.log("[fetchAllRankings] Fazendo fetch da primeira página...");
      const firstRes = await fetch(
        `/api/rankings?region=${region}&queueType=${queueType}&page=1&limit=${itemsPerPage}`,
      );
      console.log(
        "[fetchAllRankings] Status resposta primeira página:",
        firstRes.status,
        firstRes.ok,
      );

      if (!firstRes.ok) throw new Error("Failed to fetch first page");
      const firstData = await firstRes.json();
      console.log("[fetchAllRankings] firstData recebido:", firstData);

      const totalPages = firstData.pagination?.totalPages || 1;
      console.log("[fetchAllRankings] Total de páginas:", totalPages);

      let allEntries = [...firstData.entries];
      console.log(
        "[fetchAllRankings] Entradas da página 1:",
        allEntries.length,
      );

      for (let page = 2; page <= totalPages; page++) {
        console.log(
          `[fetchAllRankings] Iniciando busca página ${page}/${totalPages}...`,
        );
        const fetchUrl = `/api/rankings?region=${region}&queueType=${queueType}&page=${page}&limit=${itemsPerPage}`;
        console.log("[fetchAllRankings] URL:", fetchUrl);

        const res = await fetch(fetchUrl);
        console.log(
          `[fetchAllRankings] Status página ${page}:`,
          res.status,
          res.ok,
        );

        if (!res.ok) throw new Error(`Failed to fetch page ${page}`);
        const data = await res.json();
        console.log(
          `[fetchAllRankings] Página ${page} carregada com ${data.entries.length} entradas.`,
        );
        allEntries = allEntries.concat(data.entries);
        console.log("[fetchAllRankings] Total acumulado:", allEntries.length);

        await new Promise((r) => setTimeout(r, 200));
      }

      console.log(
        "[fetchAllRankings] Todas as páginas carregadas. Total:",
        allEntries.length,
      );

      const fullData = {
        ...firstData,
        entries: allEntries,
        pagination: {
          ...firstData.pagination,
          totalEntries: allEntries.length,
          totalPages: Math.ceil(allEntries.length / itemsPerPage),
        },
      };

      console.log("[fetchAllRankings] Chamando setRankings com:", {
        entriesCount: fullData.entries.length,
        totalPages: fullData.pagination?.totalPages,
      });

      setRankings(fullData);

      if (typeof window !== "undefined") {
        const storageKey = `rankings_${region}_${queueType}_all`;
        localStorage.setItem(storageKey, JSON.stringify(fullData));
        console.log(
          "[fetchAllRankings] Dados salvos no localStorage com chave:",
          storageKey,
        );
      }

      console.log("[fetchAllRankings] Fetch concluído com sucesso!");
    } catch (err) {
      console.error("[fetchAllRankings] Erro capturado:", err);
      console.error("[fetchAllRankings] Erro tipo:", typeof err);
      console.error(
        "[fetchAllRankings] Erro stack:",
        err instanceof Error ? err.stack : "Sem stack",
      );
      setError("Failed to load all rankings for sorting");
    } finally {
      console.log(
        "[fetchAllRankings] Finally block - setando isSortingAll para false",
      );
      setIsSortingAll(false);
    }
  }, [region, queueType, itemsPerPage]);

  // Fetch rankings data
  const fetchRankings = useCallback(
    async (pageToFetch: number = currentPage) => {
      try {
        console.log("[fetchRankings] Iniciando busca:", {
          pageToFetch,
          region,
          queueType,
        });
        setIsLoading(true);
        setError(null);

        // NÃO usar cache se estiver carregando tudo (após ordenar)
        if (typeof window !== "undefined" && !sortByWinRate) {
          const storageKey = `rankings_${region}_${queueType}_page_${pageToFetch}`;
          const cached = localStorage.getItem(storageKey);

          if (cached) {
            console.log(
              "[fetchRankings] Usando cache localStorage:",
              storageKey,
            );
            const parsed = JSON.parse(cached);
            setRankings(parsed);
            setIsLoading(false);
            return;
          }
        }

        // Busca normal (apenas uma página)
        console.log("[fetchRankings] Modo normal: página", pageToFetch);
        const response = await fetch(
          `/api/rankings?region=${region}&queueType=${queueType}&page=${pageToFetch}&limit=${itemsPerPage}`,
        );
        if (!response.ok) throw new Error("Failed to fetch rankings");
        const data = await response.json();
        console.log(
          "[fetchRankings] Página carregada com sucesso:",
          data.entries.length,
          "entradas",
        );

        setRankings(data);

        if (typeof window !== "undefined" && !sortByWinRate) {
          const storageKey = `rankings_${region}_${queueType}_page_${pageToFetch}`;
          localStorage.setItem(storageKey, JSON.stringify(data));
          console.log("[fetchRankings] Página salva no cache localStorage.");
        }
      } catch (err) {
        console.error("[fetchRankings] Erro:", err);
        setError("Failed to load rankings");
      } finally {
        setIsLoading(false);
        console.log("[fetchRankings] Finalizado!");
      }
    },
    [region, queueType, currentPage, itemsPerPage, sortByWinRate],
  );

  // Get display data based on sort state
  const getDisplayData = useCallback(() => {
    if (!rankings) return { entries: [], totalPages: 0, totalEntries: 0 };

    let entries = [...rankings.entries];

    if (sortByWinRate) {
      console.log(
        "[getDisplayData] Ordenando por Win Rate. Total:",
        entries.length,
      );
      entries.sort((a, b) => {
        const winRateA = a.wins / (a.wins + a.losses);
        const winRateB = b.wins / (b.wins + b.losses);
        return winRateB - winRateA;
      });
      console.log(
        "[getDisplayData] Após ordenação, primeiros 5:",
        entries.slice(0, 5),
      );
    }

    return {
      entries,
      totalPages: rankings.pagination?.totalPages || 0,
      totalEntries:
        rankings.pagination?.totalEntries || rankings.entries.length,
    };
  }, [rankings, sortByWinRate]);

  const displayData = getDisplayData();
  const totalPages = displayData.totalPages;

  // Paginate display data for current view
  const paginatedEntries = useMemo(() => {
    if (!sortByWinRate) {
      return displayData.entries;
    }
    // When sorted by win rate, paginate the sorted entries
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return displayData.entries.slice(start, end);
  }, [displayData, sortByWinRate, currentPage]);

  // Fetch rankings on mount and when dependencies change
  useEffect(() => {
    fetchRankings();
  }, [fetchRankings]);

  // Load names when rankings update
  useEffect(() => {
    console.log("[useEffect names] Acionado");
    console.log("[useEffect names] rankings:", rankings ? "EXISTS" : "NULL");
    console.log("[useEffect names] isLoading:", isLoading);
    console.log(
      "[useEffect names] paginatedEntries.length:",
      paginatedEntries.length,
    );

    if (!rankings || isLoading) {
      console.log("[useEffect names] Retornando - rankings ou isLoading");
      return;
    }
    const puuidsToFetch = paginatedEntries.map((entry) => entry.puuid);
    console.log(
      "[useEffect names] Buscando nomes para",
      puuidsToFetch.length,
      "puuids",
    );
    fetchSummonerNames(puuidsToFetch);
  }, [paginatedEntries, isLoading, fetchSummonerNames]);

  // Handle win rate sort button click
  const handleWinRateSort = async () => {
    console.log("[handleWinRateSort] Clicado no botão Win Rate");
    const newValue = !sortByWinRate;
    console.log("[handleWinRateSort] sortByWinRate anterior:", sortByWinRate);
    console.log("[handleWinRateSort] sortByWinRate novo:", newValue);
    console.log("[handleWinRateSort] rankings:", rankings);
    console.log(
      "[handleWinRateSort] totalPages:",
      rankings?.pagination?.totalPages,
    );

    if (newValue && rankings && rankings.pagination!.totalPages > 1) {
      console.log(
        "[handleWinRateSort] Múltiplas páginas detectadas - carregando tudo",
      );
      // Se há múltiplas páginas, busca todos os dados
      await fetchAllRankings();
    } else {
      console.log("[handleWinRateSort] Página única ou desativando sort");
    }

    setSortByWinRate(newValue);
  };

  // Get tier icon URL
  const getTierIconUrl = (tier: string) => {
    const tierLower = tier.toLowerCase();
    return `https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/images/ranked-mini-crests/${tierLower}.svg`;
  };

  // Navigation functions
  const navigateToPage = (page: number) => {
    router.push(`/rankings/${friendlyQueueType}/${region}/${page}`);
  };

  const changeQueueType = (newQueueType: string) => {
    router.push(`/rankings/${newQueueType}/${region}/1`);
  };

  const changeRegion = (newRegion: string) => {
    router.push(`/rankings/${friendlyQueueType}/${newRegion}/1`);
  };

  // Generate page numbers for pagination
  const generatePageNumbers = (currentPage: number, totalPages: number) => {
    const pages = [];
    const maxVisiblePages = 7;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      if (currentPage > 4) {
        pages.push("...");
      }

      const start = Math.max(2, currentPage - 2);
      const end = Math.min(totalPages - 1, currentPage + 2);

      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) {
          pages.push(i);
        }
      }

      if (currentPage < totalPages - 3) {
        pages.push("...");
      }

      if (!pages.includes(totalPages)) {
        pages.push(totalPages);
      }
    }

    return pages;
  };

  // Get tier for a player based on global rank
  const getTier = (globalRank: number) => {
    const normalizedRegion = region.toUpperCase().replace(/[0-9]/g, "");
    const extendedRegions = ["KR", "NA", "EUW", "VN"];
    const isExtendedRegion = extendedRegions.includes(normalizedRegion);

    const challengerLimit = isExtendedRegion
      ? itemsPerPage * 3
      : itemsPerPage * 2;
    const gmEndPage = 10;
    const grandmasterLimit = gmEndPage * itemsPerPage;

    if (globalRank <= challengerLimit) return "Challenger";
    if (
      globalRank > challengerLimit &&
      Math.ceil(globalRank / itemsPerPage) <= gmEndPage
    )
      return "Grandmaster";
    return "Master";
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

  // Get cutoffs from API response
  const cutoffs = rankings?.cutoffs
    ? {
        challenger: rankings.cutoffs.challenger?.cutoffLP || null,
        grandmaster: rankings.cutoffs.grandmaster?.cutoffLP || null,
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
            aria-label="Voltar para página inicial"
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
                High Elo Rankings -{" "}
                {displayRegionMap[region.toUpperCase()] || region.toUpperCase()}{" "}
                - {queueDisplayNames[friendlyQueueType] || friendlyQueueType}
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
            aria-label="Filtros"
          >
            <select
              value={region}
              onChange={(e) => changeRegion(e.target.value)}
              className="w-12 px-3 py-2 text-sm border rounded-md cursor-pointer border-input bg-background"
            >
              <optgroup label="Americas">
                <option value="BR1">🇧🇷 - Brazil</option>
                <option value="NA1">🇺🇸 - North America</option>
                <option value="LA1">🇲🇽 - Latin America North</option>
                <option value="LA2">🇦🇷 - Latin America South</option>
              </optgroup>
              <optgroup label="Europe">
                <option value="EUW1">🇪🇸 - Western Europe</option>
                <option value="EUN1">🇸🇪 - Northern & Eastern Europe</option>
                <option value="RU">🇷🇺 - Russia</option>
                <option value="ME1">🇪🇬 - Middle East</option>
                <option value="TR1">🇹🇷 - Turkey</option>
              </optgroup>
              <optgroup label="Asia">
                <option value="KR">🇰🇷 - Korea</option>
                <option value="JP1">🇯🇵 - Japan</option>
              </optgroup>
              <optgroup label="South Asia">
                <option value="OC1">🇦🇺 - Oceania</option>
                <option value="TW2">🇹🇼 - Taiwan, Hong Kong & Macau</option>
                <option value="VN2">🇻🇳 - Vietnam</option>
                <option value="SG2">🇸🇬 - Singapore</option>
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
                ? "Carregando todos os challengers para ordenação..."
                : isLoadingNames
                  ? "Carregando dados dos invocadores..."
                  : "Carregando ranking..."}
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
                        summonerInfo &&
                        summonerInfo.gameName &&
                        summonerInfo.tagLine
                          ? `${summonerInfo.gameName} #${summonerInfo.tagLine}`
                          : "Carregando...";

                      const globalRank = sortByWinRate
                        ? (currentPage - 1) * itemsPerPage + index + 1
                        : (currentPage - 1) * itemsPerPage + index + 1;

                      const tier = getTier(globalRank);

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
                                  {summonerInfo?.gameName || "Carregando..."}
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

                {/* Paginação */}
                <div className="flex items-center justify-between px-2 mt-4">
                  <div className="text-sm text-muted-foreground">
                    {`Mostrando ${(currentPage - 1) * itemsPerPage + 1} a ${Math.min(currentPage * itemsPerPage, displayData.totalEntries)} de ${displayData.totalEntries}`}
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
          © {new Date().getFullYear()} LolData - High Elo Rankings. Dados
          fornecidos pela Riot Games API.
        </p>
      </footer>
    </div>
  );
}
