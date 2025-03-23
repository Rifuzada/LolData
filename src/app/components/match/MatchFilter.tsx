'use client'

import { useState, useEffect } from 'react'
import { getMatchHistoryByQueue, getSummonerByRiotId } from '@/app/actions/summoner'
import { useParams, useRouter } from 'next/navigation';

export function MatchFilter() {
  const [queueId, setQueueId] = useState<string>('')
  const [summoner, setSummoner] = useState<any>(null);
  const params = useParams();
  const router = useRouter();
  const region = params.region as string;
  const gameName = params.gameName as string;
  const tagLine = params.tagLine as string;

  useEffect(() => {
    const fetchSummoner = async () => {
      const fetchedSummoner = await getSummonerByRiotId(region, gameName, tagLine);
      setSummoner(fetchedSummoner);
    };

    fetchSummoner();
  }, [region, gameName, tagLine]);

  useEffect(() => {
    if (queueId && summoner) {
      const queueIdTranslated = queueId.replace('420', 'soloDuo').replace('440', 'flex').replace('450', 'aram').replace('400', 'normal').replace('490', 'quickplay');
      router.push(`/summoner/${region}/${gameName}/${tagLine}/${queueIdTranslated}`);
    }
  }, [queueId, summoner, region, gameName, tagLine, router]);

  return (
    <div>
        <select
            value={queueId}
            onChange={(e) => setQueueId(e.target.value)}
            className="cursor-pointer w-1/5 p-2 rounded-md border border-input bg-background">
            <option className="cursor-pointer">All</option>
            <option className="cursor-pointer" value="420">Solo/Duo</option>
            <option className="cursor-pointer" value="440">Flex</option>
            <option className="cursor-pointer" value="450">ARAM</option>
            <option className="cursor-pointer" value="400">Normal Game</option>
            <option className="cursor-pointer" value="490">Quickplay</option>
        </select>
    </div>
  )
}
