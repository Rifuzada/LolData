'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Card } from '@/app/components/ui/Card';
import { getSummonerNameByPuuid } from '@/app/actions/summoner';

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
}

interface SummonerInfo {
  gameName: string;
  tagLine: string;
  profileIconId?: number;
}

export default function RankingsPage({ params }: { params: { queueType: string; region: string; page: string } }) {
  const router = useRouter();

  // Estados
  const [rankings, setRankings] = useState<RankingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingNames, setIsLoadingNames] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summonerNames, setSummonerNames] = useState<Record<string, SummonerInfo>>({});
  
  // Parse page from URL params
  const currentPage = parseInt(params.page) || 1;
  const region = params.region;
  
  // Convert friendly URL names to API queue types
  const queueTypeMap: Record<string, string> = {
    'soloduo': 'RANKED_SOLO_5x5',
    'flex': 'RANKED_FLEX_SR'
  };
  
  const reverseQueueTypeMap: Record<string, string> = {
    'RANKED_SOLO_5x5': 'soloduo',
    'RANKED_FLEX_SR': 'flex'
  };
  
  const queueType = queueTypeMap[params.queueType] || 'RANKED_SOLO_5x5';
  const friendlyQueueType = params.queueType;
  
  // Configurações
  const itemsPerPage = 100;
  // Mapa para exibição no título
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

  // Queue type display names
  const queueDisplayNames: Record<string, string> = {
    'soloDuo': 'Solo/Duo',
    'flex': 'Flex'
  };

  // Fetch rankings data
  const fetchRankings = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(`/api/rankings?region=${region}&queueType=${queueType}&page=${currentPage}&limit=${itemsPerPage}`);
      if (!response.ok) {
        throw new Error('Failed to fetch rankings');
      }
      const data = await response.json();
      
      setRankings(data);
    } catch (err) {
      setError('Failed to load rankings');
      console.error('Error fetching rankings:', err);
    } finally {
      setIsLoading(false);
    }
  }, [region, queueType, currentPage, itemsPerPage]);

  // Fetch rankings on mount and when region/queue changes
  useEffect(() => {
    fetchRankings();
  }, [fetchRankings]);

  // Persistent cache using localStorage
  const summonerNamesCache = useRef<Record<string, SummonerInfo>>({});
  
  // Load cache from localStorage on mount
  useEffect(() => {
    const savedCache = localStorage.getItem(`summonerCache_${region}`);
    if (savedCache) {
      const parsed = JSON.parse(savedCache);
      summonerNamesCache.current = parsed;
      setSummonerNames(parsed);
    }
  }, [region]);

  // Function to update cache both in memory and localStorage
  const updateCache = useCallback((newData: Record<string, SummonerInfo>) => {
    const updatedCache = { ...summonerNamesCache.current, ...newData };
    summonerNamesCache.current = updatedCache;
    localStorage.setItem(`summonerCache_${region}`, JSON.stringify(updatedCache));
    setSummonerNames(prev => ({ ...prev, ...newData }));
  }, [region]);

  // Function to fetch summoner names in batches
  const fetchSummonerNames = useCallback(async (puuids: string[], isPreFetch = false) => {
    if (!puuids.length) return;
    
    if (!isPreFetch) setIsLoadingNames(true);
    try {
      // Filter out PUUIDs that are already in cache
      const uncachedPuuids = puuids.filter(puuid => !summonerNamesCache.current[puuid]);
      
      if (uncachedPuuids.length === 0) {
        // If all PUUIDs are cached, just update state from cache
        setSummonerNames(prev => ({
          ...prev,
          ...puuids.reduce((acc, puuid) => {
            if (summonerNamesCache.current[puuid]) {
              acc[puuid] = summonerNamesCache.current[puuid];
            }
            return acc;
          }, {} as Record<string, SummonerInfo>)
        }));
        return;
      }

      // Process in larger batches (20 instead of 10) to speed up loading
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
              profileIconId: summonerData.profileIconId
            };
          } catch (error) {
            console.error(`Error fetching summoner name for PUUID ${puuid}:`, error instanceof Error ? error.message : 'Unknown error');
            return null;
          }
        });

        const batchResults = await Promise.all(batchPromises);
        const validResults = batchResults.filter((result): result is { puuid: string; gameName: string; tagLine: string; profileIconId: number } => result !== null);
        
        const newNames = validResults.reduce((acc: Record<string, SummonerInfo>, result) => {
          acc[result.puuid] = {
            gameName: result.gameName,
            tagLine: result.tagLine,
            profileIconId: result.profileIconId
          };
          return acc;
        }, {});

        // Update both memory and localStorage cache
        updateCache(newNames);

        // Reduced delay between batches (300ms instead of 1000ms)
        if (i + 20 < uncachedPuuids.length) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }
    } finally {
      setIsLoadingNames(false);
    }
  }, [region]);

  // Effect to load names when page changes or rankings update
  useEffect(() => {
    if (!rankings || isLoading) return;
    
    const currentPagePuuids = rankings.entries.map(entry => entry.puuid);
    
    // Fetch current page data
    fetchSummonerNames(currentPagePuuids);
  }, [currentPage, rankings, isLoading, fetchSummonerNames]);

  // Function to get tier icon URL
  const getTierIconUrl = (tier: string) => {
    const tierLower = tier.toLowerCase();
    return `https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/images/ranked-mini-crests/${tierLower}.svg`;
  };

  // Function to navigate to page
  const navigateToPage = (page: number) => {
    router.push(`/rankings/${friendlyQueueType}/${region}/${page}`);
  };

  // Function to change queue type
  const changeQueueType = (newQueueType: string) => {
    router.push(`/rankings/${newQueueType}/${region}/1`);
  };

  // Function to change region
  const changeRegion = (newRegion: string) => {
    router.push(`/rankings/${friendlyQueueType}/${newRegion}/1`);
  };

  // Function to generate page numbers for pagination
  const generatePageNumbers = (currentPage: number, totalPages: number) => {
    const pages = [];
    const maxVisiblePages = 7;
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is less than max visible
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);
      
      if (currentPage > 4) {
        pages.push('...');
      }
      
      // Show pages around current page
      const start = Math.max(2, currentPage - 2);
      const end = Math.min(totalPages - 1, currentPage + 2);
      
      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) {
          pages.push(i);
        }
      }
      
      if (currentPage < totalPages - 3) {
        pages.push('...');
      }
      
      // Always show last page
      if (!pages.includes(totalPages)) {
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  const totalPages = rankings?.pagination?.totalPages || 0;

  return (
    <div className="container p-4 mx-auto">
      <div className="flex items-center justify-between mb-4">
        <a
          href="/"
          className="inline-flex items-center gap-2 px-3 py-2 text-sm transition-colors border rounded-md bg-background border-input hover:bg-accent/50"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6"/>
          </svg>
          Back
        </a>
        <h1 className="hidden text-2xl font-bold md:block">
          High Elo Rankings - {displayRegionMap[region.toUpperCase()] || region.toUpperCase()} - {queueDisplayNames[friendlyQueueType] || friendlyQueueType}
        </h1>
        <h1 className="text-xs font-bold md:block">
          Rankings {queueDisplayNames[friendlyQueueType] || friendlyQueueType}
        </h1>
        <div className="flex items-center gap-2">
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
            value={queueType}
            onChange={(e) => changeQueueType(e.target.value)}
            className="px-3 py-2 text-sm border rounded-md cursor-pointer bg-background"
          >
            <option value="soloDuo">Solo/Duo</option>
            <option value="flex">Flex</option>
          </select>
        </div>
      </div>

      {(isLoading || isLoadingNames) && (
        <div className="py-8 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-2 text-sm text-muted-foreground">
            {isLoadingNames ? 'Carregando dados dos invocadores...' : 'Carregando ranking...'}
          </p>
        </div>
      )}

      {!isLoading && !isLoadingNames && error && (
        <Card className="p-4 mb-4 text-red-500">
          {error}
        </Card>
      )}

      {!isLoading && !isLoadingNames && rankings && rankings.entries.length > 0 && (
        <div className="grid gap-4">
          <Card className="p-4">
          <table className="w-full mx-auto">
            <thead>
              <tr className="border-b">
                <th className="hidden p-2 text-center sm:table-cell">Rank</th>
                <th className="w-1/5 p-2 text-left sm:text-center sm:w-auto">Name</th>
                <th className="p-2 text-center">Tier</th>
                <th className="p-2 text-center">LP</th>
                <th className="hidden p-2 text-center sm:table-cell">Wins</th>
                <th className="hidden p-2 text-center sm:table-cell">Losses</th>
                <th className="p-2 text-center">
                  <span className="hidden sm:inline">Win Rate</span>
                  <span className="inline sm:hidden">WR</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rankings.entries.map((entry, index) => {
                const winRate = ((entry.wins / (entry.wins + entry.losses)) * 100).toFixed(1);
                const summonerInfo = summonerNames[entry.puuid];
                const displayName = summonerInfo && summonerInfo.gameName && summonerInfo.tagLine
                  ? `${summonerInfo.gameName} #${summonerInfo.tagLine}`
                  : 'Carregando...';

                const getTier = (globalRank: number) => {
                  if (globalRank <= 200) return 'Challenger';
                  if (globalRank <= 700) return 'Grandmaster';
                  return 'Master';
                };

                const globalRank = ((currentPage - 1) * itemsPerPage) + index + 1;
                const tier = getTier(globalRank);
                
                const getTierColor = (tier: string) => {
                  switch (tier) {
                    case 'Challenger': return 'text-yellow-400 font-bold';
                    case 'Grandmaster': return 'text-red-400 font-semibold';
                    case 'Master': return 'text-purple-400 font-medium';
                    default: return 'text-gray-400';
                  }
                };

                return (
                  <tr key={entry.puuid} className="border-b last:border-0">
                    <td className="hidden p-2 text-center sm:table-cell">{globalRank}</td>
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
                        href={summonerInfo ? `/summoner/${region}/${summonerInfo.gameName}/${summonerInfo.tagLine}/all` : '#'}
                        className="block min-w-0 truncate cursor-pointer hover:underline"
                      >
                        <span className="hidden sm:inline">{displayName}</span>
                        <span className="block inline truncate sm:hidden">{summonerInfo?.gameName || 'Carregando...'}</span>
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
                          className="inline-block"
                          unoptimized
                        />
                        <span className="hidden md:inline">{tier}</span>
                      </div>
                    </td>
                    <td className="p-2 text-center">
                      {entry.leaguePoints}<span className="hidden sm:inline"> LP</span>
                    </td>
                    <td className="hidden p-2 text-center sm:table-cell">{entry.wins}</td>
                    <td className="hidden p-2 text-center sm:table-cell">{entry.losses}</td>
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
            
            {/* Paginação Numérica */}
            <div className="flex items-center justify-between px-2 mt-4">
              <div className="text-sm text-muted-foreground">
                {rankings?.pagination ? 
                  `Mostrando ${((currentPage - 1) * itemsPerPage) + 1} a ${Math.min(currentPage * itemsPerPage, rankings.pagination.totalEntries)} de ${rankings.pagination.totalEntries}` :
                  `Mostrando ${((currentPage - 1) * itemsPerPage) + 1} a ${Math.min(currentPage * itemsPerPage, rankings.entries?.length || 0)} de ${rankings.entries?.length || 0}`
                }
              </div>
              
              {totalPages > 1 && (
                <div className="flex items-center gap-1">
                  {/* Botão Anterior */}
                  <button
                    onClick={() => navigateToPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm border rounded-md bg-background hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ‹
                  </button>
                  
                  {/* Números das páginas */}
                  {generatePageNumbers(currentPage, totalPages).map((page, index) => (
                    <button
                      key={index}
                      onClick={() => typeof page === 'number' && navigateToPage(page)}
                      disabled={page === '...' || page === currentPage}
                      className={`px-3 py-1 text-sm border rounded-md ${
                        page === currentPage
                          ? 'bg-primary text-primary-foreground border-primary'
                          : page === '...'
                          ? 'bg-background border-input cursor-default'
                          : 'bg-background hover:bg-accent border-input'
                      } ${page === '...' ? 'cursor-default' : 'cursor-pointer'}`}
                    >
                      {page}
                    </button>
                  ))}
                  
                  {/* Botão Próximo */}
                  <button
                    onClick={() => navigateToPage(Math.min(totalPages, currentPage + 1))}
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
    </div>
  );
}
