'use client';

import { useState, useCallback } from 'react';
import { useErrorHandler } from '../services/errorHandling';
import apiService from '../services/apiService';
import { useSummonerContext } from '../context/SummonerContext';
import { Account, RankedData, ChampionMastery, ChampionWithMastery, MatchHistory } from '../types';

/**
 * Interface para parâmetros de busca
 */
interface SummonerLookupParams {
  summonerName: string;
  region: string;
  platform: string;
}

/**
 * Tipo auxiliar para dados de campeões do Data Dragon
 */
interface ChampionData {
  id: string;
  key: string;
  name: string;
  [key: string]: any;
}

/**
 * Hook customizado para gerenciar dados de invocadores
 * Implementa tratamento de erros
 */
export function useSummonerData() {
  const {
    setProfileData,
    setRankedData,
    setChampionMastery,
    setHistory,
    clearData
  } = useSummonerContext();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Função para buscar dados completos do invocador
   */
  const lookupSummoner = useCallback(async (params: SummonerLookupParams) => {
    const { summonerName, region, platform } = params;

    // Limpa dados anteriores
    clearData();

    try {
      setIsLoading(true);
      setError(null);

      // 1. Primeiro busca os dados básicos do invocador
      const summonerResponse = await apiService.getAccount(summonerName, region);

      if (!summonerResponse) {
        throw new Error(`Invocador '${summonerName}' não encontrado na região ${region}`);
      }

      const puuid = summonerResponse.puuid;

      // Atualiza os dados básicos de perfil
      setProfileData({
        puuid: puuid,
        summonerLevel: 0, // Será atualizado com os dados completos
        iconID: null // Será atualizado com os dados completos
      });

      // 2. Busca dados detalhados do perfil, ranqueadas e maestrias em paralelo
      const [profileData, rankedData, masteryData] = await Promise.all([
        // Perfil detalhado
        apiService.getProfile(region, puuid)
          .then(profile => {
            // Atualiza os dados completos do perfil
            setProfileData({
              puuid,
              summonerLevel: profile.summonerLevel,
              iconID: profile.profileIconId.toString()
            });
            return profile;
          }),

        // Dados de ranqueadas
        apiService.getRanked(region, puuid)
          .then(rankedEntries => {
            // Processa e formata os dados de ranqueadas
            const soloQ = rankedEntries.find(entry => entry.queueType === 'RANKED_SOLO_5x5');
            const flex = rankedEntries.find(entry => entry.queueType === 'RANKED_FLEX_SR');

            // Calcula taxas de vitória
            const winrateSoloq = soloQ ? Math.round((soloQ.wins / (soloQ.wins + soloQ.losses)) * 100) : null;
            const winrateFlex = flex ? Math.round((flex.wins / (flex.wins + flex.losses)) * 100) : null;

            // Gera URLs de imagens para emblemas
            const soloqImg = soloQ ?
              `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/content/src/leagueclient/rankedicons/01_${soloQ.tier.toLowerCase()}/1.png`.toLowerCase() :
              null;
            const flexImg = flex ?
              `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/content/src/leagueclient/rankedicons/01_${flex.tier.toLowerCase()}/1.png`.toLowerCase() :
              null;

            // Formata elo para exibição
            const formatElo = (entry: RankedData | undefined) =>
              entry ? `${entry.tier.charAt(0) + entry.tier.slice(1).toLowerCase()} ${entry.rank}` : null;

            // Atualiza os dados de ranqueadas no contexto
            setRankedData({
              eloSoloq: formatElo(soloQ),
              eloFlex: formatElo(flex),
              winsSoloq: soloQ?.wins || null,
              losesSoloq: soloQ?.losses || null,
              winsFlex: flex?.wins || null,
              losesFlex: flex?.losses || null,
              lpSoloq: soloQ?.leaguePoints || null,
              lpFlex: flex?.leaguePoints || null,
              winrateSoloq,
              winrateFlex,
              soloqImg,
              flexImg
            });

            return rankedEntries;
          }),

        // Dados de maestria de campeões
        apiService.getMasteries(region, puuid)
          .then(async (masteries) => {
            // Busca a versão mais recente do Data Dragon
            const version = await apiService.getLatestVersion();
            // Busca dados de todos os campeões
            const championsData = await apiService.getChampionsData(version);

            // Processa os dados de campeões para obter os nomes e imagens
            const championsWithMastery: ChampionWithMastery[] = [];
            const champList = championsData.data as Record<string, ChampionData>;

            // Mapeia IDs para nomes e adiciona aos dados de maestria
            for (const mastery of masteries) {
              // Encontra o campeão pelo ID
              const champion = Object.values(champList).find(
                (champ: ChampionData) => champ.key === mastery.championId.toString()
              );

              if (champion) {
                championsWithMastery.push({
                  id: champion.id,
                  name: champion.name,
                  level: mastery.championLevel,
                  points: mastery.championPoints
                });
              }
            }

            // Ordena por pontos de maestria (do maior para o menor)
            championsWithMastery.sort((a, b) => b.points - a.points);

            // Atualiza dados de maestria no contexto
            setChampionMastery(championsWithMastery);

            return masteries;
          })
      ]);

      // 3. Busca histórico de partidas
      await loadMatchHistory(puuid, platform);

      return {
        profile: profileData,
        ranked: rankedData,
        mastery: masteryData
      };

    } catch (err) {
      // Trata e registra o erro
      const handledError = useErrorHandler(err);
      setError(new Error(handledError.message));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [clearData, setProfileData, setRankedData, setChampionMastery, setHistory]);

  /**
   * Função para carregar o histórico de partidas
   */
  const loadMatchHistory = useCallback(async (puuid: string, platform: string, start = 0, count = 10) => {
    try {
      // Busca IDs de partidas
      const matchIds = await apiService.getMatchIds(puuid, platform, start, count);

      if (!matchIds || matchIds.length === 0) {
        // Se não houver partidas, atualiza com array vazio
        setHistory({
          matchData: [],
          runeData: null,
          itemData: null,
          queueType: null
        });
        return;
      }

      // Carrega dados adicionais necessários em paralelo
      const [runesData, itemsData, queueTypes] = await Promise.all([
        apiService.getLatestVersion().then(version => apiService.getRunesData(version)),
        apiService.getItemsData(),
        apiService.getQueueTypes()
      ]);

      // Carrega detalhes das partidas usando o método getMatchHistory
      const matches = await apiService.getMatchHistory(
        puuid,
        platform.toLowerCase(),
        platform,
        start,
        count
      );

      // Atualiza o estado com todos os dados
      setHistory({
        matchData: matches,
        runeData: runesData,
        itemData: itemsData,
        queueType: queueTypes
      });

      return matches;
    } catch (err) {
      const handledError = useErrorHandler(err);
      console.error(handledError);
    }
  }, [setHistory]);

  return {
    lookupSummoner,
    loadMatchHistory,
    isLoading,
    error
  };
}