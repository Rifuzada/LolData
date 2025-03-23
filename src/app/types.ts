export interface Account {
  puuid: string;
  gameName: string;
  tagLine: string;
}

export interface Profile {
  id: string;
  accountId: string;
  puuid: string;
  name: string;
  profileIconId: number;
  revisionDate: number;
  summonerLevel: number;
}

export interface RankedData {
  leagueId: string;
  queueType: string;
  tier: string;
  rank: string;
  summonerId: string;
  summonerName: string;
  leaguePoints: number;
  wins: number;
  losses: number;
  veteran: boolean;
  inactive: boolean;
  freshBlood: boolean;
  hotStreak: boolean;
}

export interface ChampionMastery {
  championId: number;
  championLevel: number;
  championPoints: number;
  championName: string;
  lastPlayTime: number;
  championPointsSinceLastLevel: number;
  championPointsUntilNextLevel: number;
  chestGranted: boolean;
  tokensEarned: number;
}

export interface ChampionWithMastery {
  id: string;
  name: string;
  level: number;
  points: number;
}

export interface Participant {
  puuid: string;
  championId: number;
  championName: string;
  summonerName: string;
  teamId: number;
  kills: number;
  deaths: number;
  assists: number;
  totalMinionsKilled: number;
  neutralMinionsKilled: number;
  goldEarned: number;
  visionScore: number;
  totalDamageDealtToChampions: number;
  totalDamageTaken: number;
  item0: number;
  item1: number;
  item2: number;
  item3: number;
  item4: number;
  item5: number;
  item6: number;
  win: boolean;
}

export interface MatchInfo {
  gameMode: string;
  queueId: number;
  gameStartTimestamp: number;
  gameDuration: number;
  participants: Participant[];
}

export interface Match {
  info: {
    gameId: string;
    champion: number;
    // Adicione outras propriedades conforme necessário
  };
  metadata: {
    matchId: string;
    // Adicione outras propriedades conforme necessário
  };
}

export interface QueueType {
  queueId: number;
  map: string;
  description: string;
}