'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation';

export function MatchFilter() {
  const [queueId, setQueueId] = useState<string>('');
  const params = useParams();
  const router = useRouter();
  const region = params.region as string;
  const gameName = params.gameName as string;
  const tagLine = params.tagLine as string;

  useEffect(() => {
    // console.log(queueId);
  }, []); // Adicionando useEffect para evitar múltiplas execuções

  function handleQueueChange(queueId: string) {
    // console.log(queueId);
    if (queueId !== "All" && queueId !== "") {
      const queueIdTranslated = queueId.replace('420', 'soloDuo')
                                        .replace('440', 'flex')
                                        .replace('450', 'aram')
                                        .replace('400', 'normal')
                                        .replace('490', 'quickplay')
                                        .replace('1700', 'arena');
      router.push(`/summoner/${region}/${gameName}/${tagLine}/${queueIdTranslated}`);
    } else if (queueId === "All") {
      //console.log('Selecionado: All');
      router.push(`/summoner/${region}/${gameName}/${tagLine}`);
    } else if (queueId === "") {
      //console.log('Selecionado: All');
    }
  }

  return (
    <div>
        <select
            value={queueId}
            onChange={(e) => handleQueueChange(e.target.value)}
            className="cursor-pointer w-1/5 p-2 rounded-md border border-input bg-background">
            <option className='cursor-pointer' value="">Filtro de Partidas</option>
            <option className="cursor-pointer" value="All">Todos</option>
            <option className="cursor-pointer" value="420">Solo/Duo</option>
            <option className="cursor-pointer" value="440">Flex</option>
            <option className="cursor-pointer" value="450">ARAM</option>
            <option className="cursor-pointer" value="400">Normal Game</option>
            <option className="cursor-pointer" value="490">Quickplay</option>
            <option className="cursor-pointer" value="1710">Arena</option>
        </select>
    </div>
  )
}
