// Home.tsx
'use client';

import React, { useState } from 'react';
import { useSearchHandler } from './searchHandler';
import { useSummonerContext } from './context/SummonerContext';

/**
 * Home page component
 * Implements the Single Responsibility Principle (S of SOLID)
 */
const Home: React.FC = () => {
  // Local state for form
  const [riotid, setRiotid] = useState<string>('');
  const [region, setRegion] = useState<string>('');

  // Context to manage global state
  const { clearData } = useSummonerContext();

  // Custom hook for search
  const { handleSearch, isLoading, error } = useSearchHandler();

  /**
   * Performs the search when called
   */
  const search = () => {
    // Clear previous data
    clearData();

    // Start new search
    handleSearch(riotid, region);
  };

  /**
   * Handles key down event on input
   * @param event - Keyboard event
   */
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      search();
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <header role="banner" className="w-full">
      </header>

      <main className="flex flex-col items-center justify-center flex-grow p-4" role="main">
        <div id="title" className="mb-8 text-center">
          <h1 className="mb-2 font-mono text-4xl">LoLData</h1>
          <p className="mb-2 text-lg text-gray-600">
            Search for League of Legends player information
          </p>
          {error && (
            <p className="font-medium text-red-500" role="alert" aria-live="assertive">{error}</p>
          )}
        </div>

        <div id="input-container" className="flex flex-col w-full max-w-lg gap-4" role="search" aria-label="Pesquisa de invocador">
        <input
          className="w-full p-3 transition border-2 border-gray-300 rounded input focus:outline-none focus:border-blue-500"
          type="text"
          id="riotid"
          placeholder="Riot ID (e.g.: Player#BR1)"
          value={riotid}
          onChange={(e) => setRiotid(e.target.value)}
          onKeyDown={handleKeyDown}
        />

        <select
          className="w-full p-3 transition border-2 border-gray-300 rounded cursor-pointer input focus:outline-none focus:border-blue-500"
          id="region"
          value={region}
          onChange={(e) => setRegion(e.target.value)}
        >
          <option className='cursor-pointer' value="">Region</option>
          <optgroup label="Americas">
            <option className='cursor-pointer' value="BR1">🇧🇷 - Brazil</option>
            <option className='cursor-pointer' value="NA1">🇺🇸 - North America</option>
            <option className='cursor-pointer' value="LA1">🇲🇽 - Latin America North</option>
            <option className='cursor-pointer' value="LA2">🇦🇷 - Latin America South</option>
          </optgroup>
          <optgroup label="Europe">
            <option className='cursor-pointer' value="EUW1">🇪🇸 - Western Europe</option>
            <option className='cursor-pointer' value="EUN1">🇸🇪 - Northern & Eastern Europe</option>
            <option className='cursor-pointer' value="RU">🇷🇺 - Russia</option>
            <option className='cursor-pointer' value="ME1">🇪🇬 - Middle East</option>
            <option className='cursor-pointer' value="TR1">🇹🇷 - Turkey</option>
          </optgroup>
          <optgroup label="Asia">
            <option className='cursor-pointer' value="KR">🇰🇷 - Korea</option>
            <option className='cursor-pointer' value="JP1">🇯🇵 - Japan</option>
          </optgroup>
          <optgroup label="South Asia">
            <option className='cursor-pointer' value="OC1">🇦🇺 - Oceania</option>
            <option className='cursor-pointer' value="TW2">🇹🇼 - Taiwan, Hong Kong & Macau</option>
            <option className='cursor-pointer' value="VN2">🇻🇳 - Vietnam</option>
            <option className='cursor-pointer' value="SG2">🇸🇬 - Singapore</option>
          </optgroup>
        </select>
        <button>
          <a
            href="/rankings/soloDuo/BR1/1"
            className="w-full p-3 m-auto transition bg-gray-700 border-2 border-gray-300 rounded input hover:bg-gray-600 focus:outline-none focus:border-blue-500"
          >
            View Rankings
          </a>
        </button>
        <button
          className="w-full p-3 font-medium text-white transition bg-blue-600 rounded input hover:bg-blue-700 disabled:bg-blue-400"
          id="search_button"
          type="button"
          onClick={search}
          disabled={isLoading}
        >
          {isLoading ? 'Searching...' : 'Search Summoner'}
        </button>
      </div>
    </main>
    <footer>
      <div className="mt-10 text-center text-gray-500">
        <p>
          LoLData is not endorsed by Riot Games and does not reflect the views or opinions of Riot Games
          or anyone officially involved in the production or management of League of Legends.
        </p>
      </div>
    </footer>
    </div>
  );
};

export default Home;
