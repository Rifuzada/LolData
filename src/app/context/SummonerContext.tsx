'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import {
  Account,
  Profile,
  RankedData,
  ChampionWithMastery,
  MatchHistory
} from '../types';

/**
 * Interface para o contexto de invocador
 */
interface SummonerContextType {
  // Dados do perfil
  puuid: string | null;
  summonerLevel: number | null;
  iconID: string | null;

  // Dados de ranqueadas
  eloSoloq: string | null;
  eloFlex: string | null;
  winsSoloq: number | null;
  losesSoloq: number | null;
  winsFlex: number | null;
  losesFlex: number | null;
  lpSoloq: number | null;
  lpFlex: number | null;
  winrateSoloq: number | null;
  winrateFlex: number | null;
  soloqImg: string | null;
  flexImg: string | null;

  // Dados de maestria
  championMastery: ChampionWithMastery[];

  // Histórico de partidas
  history: MatchHistory | null;

  // Função para definir os dados de perfil
  setProfileData: (data: {
    puuid: string | null;
    summonerLevel: number | null;
    iconID: string | null;
  }) => void;

  // Função para definir os dados de ranqueadas
  setRankedData: (data: {
    eloSoloq: string | null;
    eloFlex: string | null;
    winsSoloq: number | null;
    losesSoloq: number | null;
    winsFlex: number | null;
    losesFlex: number | null;
    lpSoloq: number | null;
    lpFlex: number | null;
    winrateSoloq: number | null;
    winrateFlex: number | null;
    soloqImg: string | null;
    flexImg: string | null;
  }) => void;

  // Função para definir os dados de maestria
  setChampionMastery: (data: ChampionWithMastery[]) => void;

  // Função para definir o histórico de partidas
  setHistory: (data: MatchHistory | null) => void;

  // Função para limpar todos os dados
  clearData: () => void;
}

/**
 * Valores iniciais para o contexto
 */
const initialContext: SummonerContextType = {
  puuid: null,
  summonerLevel: null,
  iconID: null,
  eloSoloq: null,
  eloFlex: null,
  winsSoloq: null,
  losesSoloq: null,
  winsFlex: null,
  losesFlex: null,
  lpSoloq: null,
  lpFlex: null,
  winrateSoloq: null,
  winrateFlex: null,
  soloqImg: null,
  flexImg: null,
  championMastery: [],
  history: null,
  setProfileData: () => {},
  setRankedData: () => {},
  setChampionMastery: () => {},
  setHistory: () => {},
  clearData: () => {}
};

/**
 * Criação do contexto
 */
const SummonerContext = createContext<SummonerContextType>(initialContext);

/**
 * Hook personalizado para acessar o contexto
 */
export const useSummonerContext = () => useContext(SummonerContext);

/**
 * Propriedades do provider
 */
interface SummonerProviderProps {
  children: ReactNode;
}

/**
 * Provider para o contexto de invocador
 * Implementa o princípio de responsabilidade única (S do SOLID)
 */
export const SummonerProvider: React.FC<SummonerProviderProps> = ({ children }) => {
  // Estados para dados de perfil
  const [puuid, setPuuid] = useState<string | null>(null);
  const [summonerLevel, setSummonerLevel] = useState<number | null>(null);
  const [iconID, setIconID] = useState<string | null>(null);

  // Estados para dados de ranqueadas
  const [eloSoloq, setEloSoloq] = useState<string | null>(null);
  const [eloFlex, setEloFlex] = useState<string | null>(null);
  const [winsSoloq, setWinsSoloq] = useState<number | null>(null);
  const [losesSoloq, setLosesSoloq] = useState<number | null>(null);
  const [winsFlex, setWinsFlex] = useState<number | null>(null);
  const [losesFlex, setLosesFlex] = useState<number | null>(null);
  const [lpSoloq, setLpSoloq] = useState<number | null>(null);
  const [lpFlex, setLpFlex] = useState<number | null>(null);
  const [winrateSoloq, setWinrateSoloq] = useState<number | null>(null);
  const [winrateFlex, setWinrateFlex] = useState<number | null>(null);
  const [soloqImg, setSoloqImg] = useState<string | null>(null);
  const [flexImg, setFlexImg] = useState<string | null>(null);

  // Estados para dados de maestria
  const [championMastery, setChampionMastery] = useState<ChampionWithMastery[]>([]);

  // Estados para histórico de partidas
  const [history, setHistory] = useState<MatchHistory | null>(null);

  /**
   * Define os dados de perfil
   */
  const setProfileData = (data: {
    puuid: string | null;
    summonerLevel: number | null;
    iconID: string | null;
  }) => {
    setPuuid(data.puuid);
    setSummonerLevel(data.summonerLevel);
    setIconID(data.iconID);
  };

  /**
   * Define os dados de ranqueadas
   */
  const setRankedData = (data: {
    eloSoloq: string | null;
    eloFlex: string | null;
    winsSoloq: number | null;
    losesSoloq: number | null;
    winsFlex: number | null;
    losesFlex: number | null;
    lpSoloq: number | null;
    lpFlex: number | null;
    winrateSoloq: number | null;
    winrateFlex: number | null;
    soloqImg: string | null;
    flexImg: string | null;
  }) => {
    setEloSoloq(data.eloSoloq);
    setEloFlex(data.eloFlex);
    setWinsSoloq(data.winsSoloq);
    setLosesSoloq(data.losesSoloq);
    setWinsFlex(data.winsFlex);
    setLosesFlex(data.losesFlex);
    setLpSoloq(data.lpSoloq);
    setLpFlex(data.lpFlex);
    setWinrateSoloq(data.winrateSoloq);
    setWinrateFlex(data.winrateFlex);
    setSoloqImg(data.soloqImg);
    setFlexImg(data.flexImg);
  };

  /**
   * Limpa todos os dados
   */
  const clearData = () => {
    setPuuid(null);
    setSummonerLevel(null);
    setIconID(null);
    setEloSoloq(null);
    setEloFlex(null);
    setWinsSoloq(null);
    setLosesSoloq(null);
    setWinsFlex(null);
    setLosesFlex(null);
    setLpSoloq(null);
    setLpFlex(null);
    setWinrateSoloq(null);
    setWinrateFlex(null);
    setSoloqImg(null);
    setFlexImg(null);
    setChampionMastery([]);
    setHistory(null);
  };

  const value = {
    puuid,
    summonerLevel,
    iconID,
    eloSoloq,
    eloFlex,
    winsSoloq,
    losesSoloq,
    winsFlex,
    losesFlex,
    lpSoloq,
    lpFlex,
    winrateSoloq,
    winrateFlex,
    soloqImg,
    flexImg,
    championMastery,
    history,
    setProfileData,
    setRankedData,
    setChampionMastery,
    setHistory,
    clearData
  };

  return (
    <SummonerContext.Provider value={value}>
      {children}
    </SummonerContext.Provider>
  );
};