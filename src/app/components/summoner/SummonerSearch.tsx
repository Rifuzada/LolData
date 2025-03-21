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

    router.push(`/summoner/${region}/${gameName}/${tagLine}`);
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
          className="h-10 px-3 py-2 rounded-md text-sm border border-input bg-background w-20"
        >
          <option value="br1">BR</option>
          <option value="na1">NA</option>
          <option value="euw1">EUW</option>
          <option value="eun1">EUNE</option>
          <option value="kr">KR</option>
          <option value="jp1">JP</option>
          <option value="la1">LAN</option>
          <option value="la2">LAS</option>
          <option value="oc1">OCE</option>
          <option value="tr1">TR</option>
          <option value="ru">RU</option>
        </select>
        <div className="relative flex-1">
          <input
            type="text"
            value={summonerName}
            onChange={(e) => setSummonerName(e.target.value)}
            placeholder="Nome#TAG ou Nome do invocador"
            className="h-10 px-3 py-2 w-full rounded-md text-sm border border-input bg-background"
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