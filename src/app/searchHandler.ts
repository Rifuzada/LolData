import { useRouter } from 'next/navigation';
import { useState } from 'react';

export const useSearchHandler = () => {
  const router = useRouter();
  const [lastRegion, setLastRegion] = useState('');

  const handleSearch = async (riotid: string, region: string) => {
    if (riotid === '' || region === '') {
      console.error('Antes de clicar no botão, escreva um Riot ID ou selecione uma Região!');
      return;
    }

    // Remover todos os espaços antes de dividir o Riot ID
    const sanitizedRiotId = riotid.replace(/\s+/g, '');

    // Separar o nome e a tag, garantindo que ambos existam
    const [gameName, tagLine = 'default'] = sanitizedRiotId.split('#');

    // Converter a região para lowercase
    const sanitizedRegion = region.toLowerCase();

    // Atualizar a última região usada
    setLastRegion(sanitizedRegion);

    console.log(sanitizedRiotId, sanitizedRegion);

    // Navega para a rota dinâmica
    router.push(`/summoner/${sanitizedRegion}/${gameName}/${tagLine}`);
  };

  const handleNewSearch = async (riotid: string) => {
    if (riotid === '') {
      console.error('Antes de clicar no botão, escreva um Riot ID!');
      return;
    }
    if (lastRegion === '') {
      console.error('Nenhuma região foi usada anteriormente. Faça uma busca inicial primeiro!');
      return;
    }
    console.log(lastRegion)

    // Remover todos os espaços antes de dividir o Riot ID
    const sanitizedRiotId = riotid.replace(/\s+/g, '');

    // Separar o nome e a tag, garantindo que ambos existam
    const [gameName, tagLine = 'default'] = sanitizedRiotId.split('#');

    // Navega para a rota dinâmica com a última região usada
    router.push(`/summoner/${lastRegion}/${gameName}/${tagLine}`);
  };

  return { handleSearch, handleNewSearch };
};