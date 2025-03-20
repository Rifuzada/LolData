/**
 * Converte um timestamp para um formato de data legível
 * @param timestamp - O timestamp a ser convertido
 * @returns Data formatada como string
 */
export const formatTimestamp = (timestamp: number): string => {
  return new Date(timestamp).toLocaleString();
};

/**
 * Obtém o URL da API regional da Riot
 * @param region - A região do servidor de LoL
 * @returns URL base para a região especificada
 */
export const getRegionalApiUrl = (region: string): string => {
  return `https://${region}.api.riotgames.com`;
};

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
 * Mapeamento de tradução de tiers/divisões
 */
export const TIER_TRANSLATIONS: Record<string, string> = {
  'IRON': 'Ferro',
  'BRONZE': 'Bronze',
  'SILVER': 'Prata',
  'GOLD': 'Ouro',
  'PLATINUM': 'Platina',
  'EMERALD': 'Esmeralda',
  'DIAMOND': 'Diamante',
  'GRANDMASTER': 'Grão Mestre',
  'MASTER': 'Mestre',
  'CHALLENGER': 'Desafiante'
};

/**
 * Obtém o nome traduzido da fila com base no ID
 * @param queueId - ID da fila
 * @param queueTypes - Array com os tipos de fila disponíveis
 * @returns Nome traduzido da fila
 */
export const getTranslatedQueueName = (queueId: number, queueTypes: any[]): string => {
  const queue = queueTypes.find(q => q.queueId === queueId);
  let queueName = queue ? queue.description : "Desconhecido";

  // Aplicar tradução se disponível
  for (const [key, value] of Object.entries(QUEUE_TYPE_TRANSLATIONS)) {
    if (queueName.includes(key)) {
      queueName = queueName.replace(key, value);
    }
  }

  return queueName;
};