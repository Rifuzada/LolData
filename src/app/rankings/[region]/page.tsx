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
}

interface SummonerInfo {
  gameName: string;
  tagLine: string;
  profileIconId?: number;
}

export default function RankingsPage({ params }: { params: { region: string } }) {
  const router = useRouter();

  // Estados
  const [rankings, setRankings] = useState<RankingData | null>(null);
  const [queueType, setQueueType] = useState('RANKED_SOLO_5x5');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingNames, setIsLoadingNames] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summonerNames, setSummonerNames] = useState<Record<string, SummonerInfo>>({});
  const [currentPage, setCurrentPage] = useState(1);
  
  // Configurações
  const itemsPerPage = 50;

  // Fetch rankings data
  const fetchRankings = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(`/api/rankings?region=${params.region}&queueType=${queueType}`);
      if (!response.ok) {
        throw new Error('Failed to fetch rankings');
      }
      const data = await response.json();
      
      // Sort by LP
      const sortedEntries = [...data.entries].sort((a, b) => b.leaguePoints - a.leaguePoints);
      setRankings({
        ...data,
        entries: sortedEntries
      });
    } catch (err) {
      setError('Failed to load rankings');
      console.error('Error fetching rankings:', err);
    } finally {
      setIsLoading(false);
    }
  }, [params.region, queueType]);

  // Fetch rankings on mount and when region/queue changes
  useEffect(() => {
    fetchRankings();
  }, [fetchRankings]);

  // Persistent cache using localStorage
  const summonerNamesCache = useRef<Record<string, SummonerInfo>>({});
  
  // Load cache from localStorage on mount
  useEffect(() => {
    const savedCache = localStorage.getItem(`summonerCache_${params.region}`);
    if (savedCache) {
      const parsed = JSON.parse(savedCache);
      summonerNamesCache.current = parsed;
      setSummonerNames(parsed);
    }
  }, [params.region]);

  // Function to update cache both in memory and localStorage
  const updateCache = useCallback((newData: Record<string, SummonerInfo>) => {
    const updatedCache = { ...summonerNamesCache.current, ...newData };
    summonerNamesCache.current = updatedCache;
    localStorage.setItem(`summonerCache_${params.region}`, JSON.stringify(updatedCache));
    setSummonerNames(prev => ({ ...prev, ...newData }));
  }, [params.region]);

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
            const summonerData = await getSummonerNameByPuuid(params.region, puuid);
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
  }, [params.region]);

  // Effect to load names when page changes or rankings update
  useEffect(() => {
    if (!rankings || isLoading) return;

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentPagePuuids = rankings.entries
      .slice(startIndex, endIndex)
      .map(entry => entry.puuid);
    
    // Fetch current page data
    fetchSummonerNames(currentPagePuuids);

    // Pre-fetch next page data
    const nextPageStartIndex = currentPage * itemsPerPage;
    const nextPageEndIndex = nextPageStartIndex + itemsPerPage;
    if (nextPageEndIndex <= rankings.entries.length) {
      const nextPagePuuids = rankings.entries
        .slice(nextPageStartIndex, nextPageEndIndex)
        .map(entry => entry.puuid);
      
      // Use setTimeout to not compete with current page fetch
      setTimeout(() => {
        fetchSummonerNames(nextPagePuuids, true);
      }, 1000);
    }
  }, [currentPage, rankings, isLoading, fetchSummonerNames]);



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
        <h1 className="text-2xl font-bold">
        Challenger Rankings - {params.region.replace(/[0-9]/g, '').toUpperCase()}
        </h1>
        <div className="flex items-center gap-2">
          <select
            value={params.region}
            onChange={(e) => router.push(`/rankings/${e.target.value.toLowerCase()}`)}
            className="px-3 py-2 text-sm border rounded-md cursor-pointer border-input bg-background"
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
            onChange={(e) => setQueueType(e.target.value)}
            className="px-3 py-2 text-sm border rounded-md bg-background"
          >
            <option value="RANKED_SOLO_5x5">Solo/Duo</option>
            <option value="RANKED_FLEX_SR">Flex</option>
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

      {!isLoading && !isLoadingNames && rankings && Object.keys(summonerNames).length > 0 && (
        <div className="grid gap-4">
          <Card className="p-4">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="p-2 text-left">Rank</th>
                  <th className="p-2 text-left">Summoner</th>
                  <th className="p-2 text-left">LP</th>
                  <th className="p-2 text-left">Wins/Losses</th>
                  <th className="p-2 text-left">Win Rate</th>
                </tr>
              </thead>
              <tbody>
                {rankings.entries
                  .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                  .map((entry, index) => {
                  const winRate = ((entry.wins / (entry.wins + entry.losses)) * 100).toFixed(1);
                  const summonerInfo = summonerNames[entry.puuid];
                  const displayName = summonerInfo && summonerInfo.gameName && summonerInfo.tagLine
                    ? `${summonerInfo.gameName} #${summonerInfo.tagLine}`
                    : 'Carregando...';

                  return (
                    <tr key={entry.puuid} className="border-b last:border-0">
                      <td className="p-2">{((currentPage - 1) * itemsPerPage) + index + 1}</td>
                      <td className="p-2">
                        <div className="flex items-center gap-2">
                          {summonerInfo?.profileIconId && (
                            <Image
                              src={`https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/profile-icons/${summonerInfo.profileIconId}.jpg`}
                              alt="Profile Icon"
                              width={32}
                              height={32}
                              className="object-cover border rounded-full border-zinc-700"
                              unoptimized
                            />
                          )}
                          <Link 
                            href={summonerInfo ? `/summoner/${params.region}/${summonerInfo.gameName}/${summonerInfo.tagLine}/all` : '#'}
                            className="cursor-pointer hover:underline"
                          >
                            {displayName}
                          </Link>
                        </div>
                      </td>
                      <td className="p-2">{entry.leaguePoints} LP</td>
                      <td className="p-2">{entry.wins}/{entry.losses}</td>
                      <td className="p-2">{winRate}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {/* Paginação */}
            <div className="flex items-center justify-between px-2 mt-4">
              <div className="text-sm text-muted-foreground">
                Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, rankings.entries.length)} de {rankings.entries.length}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border rounded-md bg-background hover:bg-accent disabled:opacity-50"
                >
                  Anterior
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.min(Math.ceil(rankings.entries.length / itemsPerPage), p + 1))}
                  disabled={currentPage >= Math.ceil(rankings.entries.length / itemsPerPage)}
                  className="px-3 py-1 border rounded-md bg-background hover:bg-accent disabled:opacity-50"
                >
                  Próxima
                </button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
