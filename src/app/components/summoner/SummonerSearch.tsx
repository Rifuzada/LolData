'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface SummonerSearchProps {
  defaultRegion?: string;
}

export function SummonerSearch({ defaultRegion = 'br1' }: SummonerSearchProps) {
  const router = useRouter();
  const [region, setRegion] = useState(defaultRegion);
  const [summonerName, setSummonerName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!summonerName.trim()) return;

    // Dividir o nome em gameName e tagLine se contiver #
    const parts = summonerName.split('#');
    const gameName = encodeURIComponent(parts[0].trim());
    const tagLine = parts.length > 1 ? encodeURIComponent(parts[1].trim()) : 'BR1';
    //console.log(gameName, tagLine, region);
    const regionLower = region.toLowerCase();
    router.push(`/summoner/${regionLower}/${gameName}/${tagLine}`);
  };

  return (
    <div className="flex justify-between items-center mb-6 gap-4">
      <a
        href="/"
        className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm bg-background border border-input hover:bg-accent/50 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m15 18-6-6 6-6"/>
        </svg>
        Voltar
      </a>

      <form onSubmit={handleSubmit} className="flex items-center gap-2 flex-1 max-w-[700px]">
        <select
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          className="h-10 px-3 py-2 rounded-md text-sm border border-input bg-background w-24 cursor-pointer"
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
          </optgroup>
          <optgroup label="Ásia">
            <option className='cursor-pointer'  value="KR">🇰🇷 - Coreia</option>
            <option className='cursor-pointer'  value="JP1">🇯🇵 - Japão</option>
            <option className='cursor-pointer'  value="TW2">🇹🇼 - Taiwan, Hong Kong e Macau</option>
            <option className='cursor-pointer'  value="TH2">🇹🇭 - Tailândia</option>
            <option className='cursor-pointer'  value="VN2">🇻🇳 - Vietnã</option>
            <option className='cursor-pointer'  value="TR1">🇹🇷 - Turquia</option>
            <option className='cursor-pointer'  value="SG2">🇸🇬 - Singapura</option>
          </optgroup>
          <optgroup label="Oceania">
            <option className='cursor-pointer'  value="OC1">🇦🇺 - Oceania</option>
          </optgroup>
        </select>
        <div className="relative flex-1">
          <input
            type="text"
            value={summonerName}
            onChange={(e) => setSummonerName(e.target.value)}
            placeholder="Riot#ID"
            className="h-10 px-3 py-2 w-full rounded-md text-sm border focus:outline-none border-input bg-background"
            required
          />
        </div>
        <button
          type="submit"
          className="h-10 px-4 py-2 rounded-md text-sm bg-accent border border-input hover:bg-accent/80 font-medium"
        >
          Buscar
        </button>
      </form>
    </div>
  );
}