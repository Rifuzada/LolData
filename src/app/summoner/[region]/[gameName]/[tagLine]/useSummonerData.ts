import { useState, useEffect } from "react";
import { fetchVersion, fetchAccount, fetchRanked, fetchProfile, fetchMastery, fetchHistory } from './api';
import { ChampionMastery } from './type';

const useSummonerData = (region: string, gameName: string, tagLine: string) => {
    const [puuid, setPuuid] = useState<string | null>(null);
    const [summonerLevel, setSummonerLevel] = useState<number | null>(null);
    const [iconID, setIconID] = useState<string | null>(null);
    const [eloSoloq, setEloSoloq] = useState<string | null>(null);
    const [eloFlex, setEloFlex] = useState<string | null>(null);
    const [winsSoloq, setWinsSoloq] = useState<number | null>(null);
    const [losesSoloq, setLosesSoloq] = useState<number | null>(null);
    const [winsFlex, setWinsFlex] = useState<number | null>(null);
    const [losesFlex, setLosesFlex] = useState<number | null>(null);
    const [lpSoloq, setLpSoloq] = useState<number | null>(null);
    const [lpFlex, setLpFlex] = useState<number | null>(null);
    const [winrateSoloq, setWinrateSoloq] = useState<number | null>(null);
    const [winrateFlex, setWinrateFlex] = useState<number | null>(null);
    const [soloqImg, setSoloqImg] = useState<string | null>(null);
    const [flexImg, setFlexImg] = useState<string | null>(null);
    const [championMastery, setMastery] = useState<ChampionMastery[]>([]);
    const [history, setHistory] = useState<string | null>(null);

    const fetchData = async () => {
        try {
            const version = await fetchVersion();
            const accountData = await fetchAccount(region, gameName, tagLine);
            const historyData = await fetchHistory(region, accountData.puuid, version);
            const profileData = await fetchProfile(region, accountData.puuid);
            setPuuid(accountData.puuid);
            if (accountData.puuid) {
                
                setSummonerLevel(profileData.summonerLevel);
                setIconID(profileData.profileIconId);

                const rankedData = await fetchRanked(region, profileData.id);
                const tierTranslation: { [key: string]: string } = {
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

                // Process rankedData for Solo/Duo
                const soloqData = rankedData.find((queue: any) => queue.queueType === "RANKED_SOLO_5x5");
                if (soloqData) {
                    setEloSoloq(`${tierTranslation[soloqData.tier]} ${soloqData.rank}`);
                    setWinsSoloq(soloqData.wins);
                    setLosesSoloq(soloqData.losses);
                    setLpSoloq(soloqData.leaguePoints);
                    setWinrateSoloq((soloqData.wins / (soloqData.wins + soloqData.losses)) * 100);
                    setSoloqImg(`https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/images/ranked-mini-crests/${soloqData.tier.toLowerCase()}.svg`);
                }

                // Process rankedData for Flex
                const flexData = rankedData.find((queue: any) => queue.queueType === "RANKED_FLEX_SR");
                if (flexData) {
                    setEloFlex(`${tierTranslation[flexData.tier]} ${flexData.rank}`);
                    setWinsFlex(flexData.wins);
                    setLosesFlex(flexData.losses);
                    setLpFlex(flexData.leaguePoints);
                    setWinrateFlex((flexData.wins / (flexData.wins + flexData.losses)) * 100);
                    setFlexImg(`https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/images/ranked-mini-crests/${flexData.tier.toLowerCase()}.svg`);
                }

                const masteryData = await fetchMastery(region, accountData.puuid, version);
                setMastery(masteryData);
            }
        } catch (error) {
            console.error("Erro ao buscar dados:", error);
        }
    };

    return {
        puuid,
        summonerLevel,
        iconID,
        eloSoloq,
        eloFlex,
        winsSoloq,
        losesSoloq,
        winsFlex,
        losesFlex,
        lpSoloq,
        lpFlex,
        winrateSoloq,
        winrateFlex,
        soloqImg,
        flexImg,
        championMastery,
        fetchData
    };
};

export default useSummonerData;
