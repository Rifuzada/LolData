/**
 * Retorna a URL da API regional da Riot Games
 * @param region - Região do servidor (BR1, NA1, etc)
 * @returns URL da API regional
 */
export function getRegionalApiUrl(region: string): string {
  const regionalUrls: Record<string, string> = {
    br1: 'https://br1.api.riotgames.com',
    eun1: 'https://eun1.api.riotgames.com',
    euw1: 'https://euw1.api.riotgames.com',
    jp1: 'https://jp1.api.riotgames.com',
    kr: 'https://kr.api.riotgames.com',
    la1: 'https://la1.api.riotgames.com',
    la2: 'https://la2.api.riotgames.com',
    na1: 'https://na1.api.riotgames.com',
    oc1: 'https://oc1.api.riotgames.com',
    tr1: 'https://tr1.api.riotgames.com',
    ru: 'https://ru.api.riotgames.com',
  };

  const normalizedRegion = region.toLowerCase();
  return regionalUrls[normalizedRegion] || regionalUrls.br1;
}

/**
 * Retorna a URL da API das Américas da Riot Games
 */
export const AMERICAS_API_URL = 'https://americas.api.riotgames.com';
export const EUROPE_API_URL = 'https://europe.api.riotgames.com';
export const ASIA_API_URL = 'https://asia.api.riotgames.com';
export const SEA_API_URL = 'https://sea.api.riotgames.com';

/**
 * Formata um timestamp para uma data legível
 * @param timestamp - Timestamp em milissegundos
 * @returns Data formatada
 */
export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/**
 * Formata uma duração em minutos e segundos
 * @param duration - Duração em segundos
 * @returns Duração formatada
 */
export function formatDuration(duration: number): string {
  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;
  return `${minutes}m ${seconds}s`;
}