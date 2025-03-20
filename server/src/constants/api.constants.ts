/**
 * Regiões da API da Riot Games
 */
export enum RiotRegion {
  BR1 = 'br1',
  EUN1 = 'eun1',
  EUW1 = 'euw1',
  JP1 = 'jp1',
  KR = 'kr',
  LA1 = 'la1',
  LA2 = 'la2',
  NA1 = 'na1',
  OC1 = 'oc1',
  TR1 = 'tr1',
  RU = 'ru',
  PH2 = 'ph2',
  SG2 = 'sg2',
  TH2 = 'th2',
  TW2 = 'tw2',
  VN2 = 'vn2'
}

/**
 * Plataformas da API da Riot Games
 */
export enum RiotPlatform {
  AMERICAS = 'americas',
  ASIA = 'asia',
  EUROPE = 'europe',
  SEA = 'sea'
}

/**
 * Mapeamento de regiões para plataformas
 */
export const REGION_TO_PLATFORM: Record<RiotRegion, RiotPlatform> = {
  [RiotRegion.BR1]: RiotPlatform.AMERICAS,
  [RiotRegion.NA1]: RiotPlatform.AMERICAS,
  [RiotRegion.LA1]: RiotPlatform.AMERICAS,
  [RiotRegion.LA2]: RiotPlatform.AMERICAS,
  [RiotRegion.EUN1]: RiotPlatform.EUROPE,
  [RiotRegion.EUW1]: RiotPlatform.EUROPE,
  [RiotRegion.TR1]: RiotPlatform.EUROPE,
  [RiotRegion.RU]: RiotPlatform.EUROPE,
  [RiotRegion.KR]: RiotPlatform.ASIA,
  [RiotRegion.JP1]: RiotPlatform.ASIA,
  [RiotRegion.OC1]: RiotPlatform.SEA,
  [RiotRegion.PH2]: RiotPlatform.SEA,
  [RiotRegion.SG2]: RiotPlatform.SEA,
  [RiotRegion.TH2]: RiotPlatform.SEA,
  [RiotRegion.TW2]: RiotPlatform.SEA,
  [RiotRegion.VN2]: RiotPlatform.SEA
};

/**
 * Tipos de filas do League of Legends
 */
export enum QueueType {
  RANKED_SOLO_5x5 = 'RANKED_SOLO_5x5',
  RANKED_FLEX_SR = 'RANKED_FLEX_SR',
  RANKED_TFT = 'RANKED_TFT',
  NORMAL_BLIND_5x5 = 'NORMAL_BLIND_5x5',
  NORMAL_DRAFT_5x5 = 'NORMAL_DRAFT_5x5',
  ARAM = 'ARAM',
  CLASH = 'CLASH'
}

/**
 * Mapeamento de tradução de nomes de filas
 */
export const QUEUE_TYPE_TRANSLATIONS: Record<string, string> = {
  "games": "",
  "Draft Pick": "Alternado",
  "Blind Pick": "Escolha às Cegas",
  "Ranked Solo": "Ranqueada Solo",
  "Ranked Flex": "Ranqueada Flex",
  "ARAM": "ARAM (Aleatório)",
  "Clash": "Torneio Clash",
  "Co-op vs. AI": "Cooperativo vs IA",
  "One for All": "Um por Todos",
  "ARURF": "Ultra Rápido e Furioso(Aleatório)",
  "URF": "Ultra Rápido e Furioso",
  "5v5": "5x5"
};

/**
 * Tiers do League of Legends
 */
export enum Tier {
  IRON = 'IRON',
  BRONZE = 'BRONZE',
  SILVER = 'SILVER',
  GOLD = 'GOLD',
  PLATINUM = 'PLATINUM',
  EMERALD = 'EMERALD',
  DIAMOND = 'DIAMOND',
  MASTER = 'MASTER',
  GRANDMASTER = 'GRANDMASTER',
  CHALLENGER = 'CHALLENGER'
}

/**
 * Mapeamento de tradução de tiers
 */
export const TIER_TRANSLATIONS: Record<Tier, string> = {
  [Tier.IRON]: 'Ferro',
  [Tier.BRONZE]: 'Bronze',
  [Tier.SILVER]: 'Prata',
  [Tier.GOLD]: 'Ouro',
  [Tier.PLATINUM]: 'Platina',
  [Tier.EMERALD]: 'Esmeralda',
  [Tier.DIAMOND]: 'Diamante',
  [Tier.MASTER]: 'Mestre',
  [Tier.GRANDMASTER]: 'Grão Mestre',
  [Tier.CHALLENGER]: 'Desafiante'
};

/**
 * Divisões do League of Legends
 */
export enum Division {
  I = 'I',
  II = 'II',
  III = 'III',
  IV = 'IV'
}