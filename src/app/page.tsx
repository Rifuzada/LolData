// Home.tsx
'use client';

import React, { useState } from 'react';
import { useSearchHandler } from './searchHandler';
import { useSummonerContext } from './context/SummonerContext';

/**
 * Componente da página inicial
 * Implementa o princípio de responsabilidade única (S do SOLID)
 */
const Home: React.FC = () => {
  // Estados locais para formulário
  const [riotid, setRiotid] = useState<string>('');
  const [region, setRegion] = useState<string>('');

  // Context para gerenciar estado global
  const { clearData } = useSummonerContext();

  // Hook personalizado para pesquisa
  const { handleSearch, isLoading, error } = useSearchHandler();

  /**
   * Realiza a pesquisa quando chamado
   */
  const search = () => {
    // Limpa os dados anteriores
    clearData();

    // Inicia nova pesquisa
    handleSearch(riotid, region);
  };

  /**
   * Manipula o evento de tecla pressionada no input
   * @param event - Evento de teclado
   */
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      search();
    }
  };
  

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4">
      <div id="title" className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2">LoLData</h1>
        <p className="text-lg text-gray-600 mb-2">
          Pesquise informações de jogadores de League of Legends
        </p>
        {error && (
          <p className="text-red-500 font-medium">{error}</p>
        )}
      </div>

      <div id="input-container" className="w-full max-w-lg flex flex-col gap-4">
        <input
          className="input p-3 rounded border-2 border-gray-300 w-full focus:outline-none focus:border-blue-500 transition"
          type="text"
          id="riotid"
          placeholder="Riot ID (ex: Jogador#BR1)"
          value={riotid}
          onChange={(e) => setRiotid(e.target.value)}
          onKeyDown={handleKeyDown}
        />

        <select
          className="input p-3 rounded border-2 border-gray-300 w-full focus:outline-none focus:border-blue-500 transition"
          id="region"
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          >
          <option className='cursor-pointer'  value="">🌎 Região</option>
          <optgroup label="Americas">
              <option className='cursor-pointer' value="BR1">🇧🇷 - Brasil</option>
              <option className='cursor-pointer'  value="NA1">🇺🇸 - América do Norte</option>
              <option className='cursor-pointer'  value="LA1">🇲🇽 - América Latina Norte</option>
              <option className='cursor-pointer'  value="LA2">🇦🇷 - América Latina Sul</option>
            </optgroup>
            <optgroup label="Europa">
              <option className='cursor-pointer'  value="EUW1">🇪🇸 - Europa Oeste</option>
              <option className='cursor-pointer'  value="EUN1">🇸🇪 - Europa Nórdica e Leste</option>
              <option className='cursor-pointer'  value="RU">🇷🇺 - Rússia</option>
              <option className='cursor-pointer'  value="ME1">🇪🇬 - Oriente Médio</option>
              <option className='cursor-pointer'  value="TR1">🇹🇷 - Turquia</option>
            </optgroup>
            <optgroup label="Ásia">
              <option className='cursor-pointer'  value="KR">🇰🇷 - Coreia</option>
              <option className='cursor-pointer'  value="JP1">🇯🇵 - Japão</option>
            </optgroup>
            <optgroup label="Asia do Sul">
              <option className='cursor-pointer'  value="OC1">🇦🇺 - Oceania</option>
              <option className='cursor-pointer'  value="TW2">🇹🇼 - Taiwan, Hong Kong e Macau</option>
              <option className='cursor-pointer'  value="VN2">🇻🇳 - Vietnã</option>
              <option className='cursor-pointer'  value="SG2">🇸🇬 - Singapura</option>
            </optgroup>
        </select>

        <button
          className="input p-3 rounded bg-blue-600 text-white font-medium hover:bg-blue-700 transition w-full disabled:bg-blue-400"
          id="search_button"
          type="button"
          onClick={search}
          disabled={isLoading}
        >
          {isLoading ? 'Pesquisando...' : 'Pesquisar Invocador'}
        </button>
      </div>

      <div className="mt-10 text-center text-gray-500">
        <p>
          LoLData não é endossado pela Riot Games e não reflete as visões ou opiniões da Riot Games
          ou de qualquer pessoa oficialmente envolvida na produção ou gerenciamento de League of Legends.
        </p>
      </div>
    </main>
  );
};

export default Home;
