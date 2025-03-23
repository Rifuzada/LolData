'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

/**
 * Interface para o hook de manipulação de pesquisa
 */
interface SearchHandlerHook {
  /**
   * Função para lidar com a pesquisa de invocador
   * @param riotid - ID do Riot (no formato "nome#tag")
   * @param region - Região do servidor
   * @returns Promise void
   */
  handleSearch: (riotid: string, region: string) => Promise<void>;

  /**
   * Estado indicando se está carregando
   */
  isLoading: boolean;

  /**
   * Estado para mensagem de erro
   */
  error: string | null;
}

/**
 * Hook personalizado para gerenciar a pesquisa de invocadores
 * Implementa o princípio de responsabilidade única (S do SOLID)
 * @returns Interface SearchHandlerHook
 */
export function useSearchHandler(): SearchHandlerHook {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Manipula a pesquisa de invocador, validando e redirecionando para a página de perfil
   * @param riotid - ID do Riot (no formato "nome#tag")
   * @param region - Região do servidor
   */
  async function handleSearch(riotid: string, region: string): Promise<void> {
    try {
      setIsLoading(true);
      setError(null);

      // Validação de entrada
      if (riotid === '' || region === '') {
        setError('Antes de clicar no botão, escreva um Riot ID ou selecione uma Região!');
        return;
      }

      // Remover todos os espaços antes de dividir o Riot ID
      const sanitizedRiotId = riotid.replace(/\s+/g, ' ');

      // Separar o nome e a tag, garantindo que ambos existam
      const parts = sanitizedRiotId.split('#');

      if (parts.length !== 2 || !parts[0] || !parts[1]) {
        setError('Por favor, insira um Riot ID válido no formato Nome#Tag');
        return;
      }

      const [gameName, tagLine] = parts;

      // Converter a região para lowercase
      const sanitizedRegion = region.toLowerCase();

      // Navega para a rota dinâmica
      router.push(`/summoner/${sanitizedRegion}/${gameName}/${tagLine}`);
    } catch (error) {
      console.error('Erro ao processar a pesquisa:', error);
      setError('Ocorreu um erro ao processar sua pesquisa. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // async function handleNewSearch(riotid: string){
  //   if (riotid === '') {
  //     console.error('Antes de clicar no botão, escreva um Riot ID!');
  //     return;
  //   }
  //   if (lastRegion === '') {
  //     console.error('Nenhuma região foi usada anteriormente. Faça uma busca inicial primeiro!');
  //     return;
  //   }
  //   console.log(lastRegion)

  //   // Remover todos os espaços antes de dividir o Riot ID
  //   const sanitizedRiotId = riotid.replace(/\s+/g, '');

  //   // Separar o nome e a tag, garantindo que ambos existam
  //   const [gameName, tagLine = 'default'] = sanitizedRiotId.split('#');

  //   // Navega para a rota dinâmica com a última região usada
  //   router.push(`/summoner/${lastRegion}/${gameName}/${tagLine}`);
  // };

  return {
    handleSearch,
    isLoading,
    error
  };
};