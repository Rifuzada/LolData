'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation'; // Use 'next/navigation' for the app directory

const Home: React.FC = () => {
  const router = useRouter();

  const [riotid, setriotid] = useState('');
  const [region, setRegion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    if (riotid === '' || region === '') {
      setError('Antes de clicar no botão, escreva um Riot ID ou selecione uma Região!');
      return;
    }
  
    // Remover todos os espaços antes de dividir o Riot ID
    const sanitizedRiotId = riotid.replace(/\s+/g, '');
    
    // Separar o nome e a tag, garantindo que ambos existam
    const [gameName, tagLine = 'default'] = sanitizedRiotId.split('#');
  
    // Converter a região para lowercase
    const sanitizedRegion = region.toLowerCase();
  
    console.log(sanitizedRiotId, sanitizedRegion);
    setError('');
  
    // Navega para a rota dinâmica
    router.push(`/summoner/${sanitizedRegion}/${gameName}/${tagLine}`);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div>
      <div id="title">
        <h1>LoLData</h1>
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </div>
      <div id="input-container">
        <input
          className="input"
          type="text"
          id="riotid"
          placeholder="Riot#ID"
          value={riotid}
          onChange={(e) => setriotid(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <select
          className="input"
          id="region"
          value={region}
          onChange={(e) => setRegion(e.target.value)}
        >
          <option value="">REGIÃO</option>
          <optgroup label="Americas">
            <option value="BR1">Brazil</option>
            <option value="NA1">North America</option>
            <option value="LA1">Latin America North</option>
            <option value="LA2">Latin America South</option>
          </optgroup>
          <optgroup label="Europe">
            <option value="EUW1">Europe West</option>
            <option value="EUN1">Europe Nordic and East</option>
            <option value="RU">Russia</option>
          </optgroup>
          <optgroup label="Asia">
            <option value="KR">Republic of Korea</option>
            <option value="JP1">Japan</option>
            <option value="TW2">Taiwan, Hong Kong, and Macao</option>
            <option value="TH2">Thailand</option>
            <option value="VN2">Vietnam</option>
            <option value="TR1">Turkey</option>
            <option value="SG2">Singapore</option>
          </optgroup>
          <optgroup label="Oceania">
            <option value="OC1">Oceania</option>
          </optgroup>
        </select>
        <button
          className="input"
          id="search_button"
          type="button"
          onClick={handleSearch}
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Pesquisar Usuário'}
        </button>
      </div>
    </div>
  );
};

export default Home;
