'use client'

import { useState, useEffect } from "react";
import { fetchVersion, fetchAccount, fetchRanked, fetchProfile, fetchMastery, fetchHistory } from './api';
import { ChampionMastery } from './type';

const TRANSLATION_MAP = {
    "games": "",
    "Draft Pick": "Alternado",
    "Blind Pick": "Escolha às Cegas",
    "Ranked Solo": "Ranqueada Solo",
    "Ranked Flex": "Ranqueada Flex",
    "ARAM": "ARAM (Aleatório)",
    "Clash": "Torneio Clash",
    "Co-op vs. AI": "Cooperativo vs IA",
    "One for All": "Um por Todos",
    "ARURF": "Ultra Rápido e Furioso(Aleatório)",
    "URF": "Ultra Rápido e Furioso",
    "5v5": "5x5"
};

// Interface para histórico de partidas
interface MatchHistory {
    matchData: {
        info: {
            gameStartTimestamp: number;
            participants: any[];
            queueId: number;
        };
    }[];
    queueType: any[];
    itemData: any[];
    runeData: any[];
}

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
    const [history, setHistory] = useState<MatchHistory | null>(null);
    const [isHistoryRendered, setIsHistoryRendered] = useState(false);

    const fetchData = async () => {
        try {
            const version = await fetchVersion();
            const accountData = await fetchAccount(region, gameName, tagLine);
            const profileData = await fetchProfile(region, accountData.puuid);
            const rankedFlexData = document.getElementById("rankedFlexData");
            const rankedSoloqData = document.getElementById("rankedSoloqData");
            const rankedFlexDataMobile = document.getElementById("rankedFlexDataMobile");
            const rankedSoloqDataMobile = document.getElementById("rankedSoloqDataMobile");
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

                const soloqData = rankedData.find((queue: any) => queue.queueType === "RANKED_SOLO_5x5");
                if (soloqData) {
                    setEloSoloq(`${tierTranslation[soloqData.tier]} ${soloqData.rank}`);
                    setWinsSoloq(soloqData.wins);
                    setLosesSoloq(soloqData.losses);
                    setLpSoloq(soloqData.leaguePoints);
                    setWinrateSoloq((soloqData.wins / (soloqData.wins + soloqData.losses)) * 100);
                    setSoloqImg(`https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/images/ranked-mini-crests/${soloqData.tier.toLowerCase()}.svg`);
                } else if (rankedSoloqData) {
                    rankedSoloqData.innerHTML = "Não ranqueado";
                    if (rankedSoloqDataMobile) {
                        rankedSoloqDataMobile.innerHTML = "Não ranqueado";
                    }
                }

                const flexData = rankedData.find((queue: any) => queue.queueType === "RANKED_FLEX_SR");
                if (flexData) {
                    setEloFlex(`${tierTranslation[flexData.tier]} ${flexData.rank}`);
                    setWinsFlex(flexData.wins);
                    setLosesFlex(flexData.losses);
                    setLpFlex(flexData.leaguePoints);
                    setWinrateFlex((flexData.wins / (flexData.wins + flexData.losses)) * 100);
                    setFlexImg(`https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/images/ranked-mini-crests/${flexData.tier.toLowerCase()}.svg`);
                } else if (rankedFlexData) {
                    rankedFlexData.innerHTML = "Não ranqueado";
                    if (rankedFlexDataMobile) {
                        rankedFlexDataMobile.innerHTML = "Não ranqueado";
                    }
                }

                const masteryData = await fetchMastery(region, accountData.puuid, version);
                setMastery(masteryData);

                const historyData = await fetchHistory(region, accountData.puuid, version);
                setHistory(historyData);
            }
        } catch (error) {
            console.error("Erro ao buscar dados do invocador:", error);
        }
    };

    useEffect(() => {
        fetchData();
    }, [region, gameName, tagLine]);

    const renderMatchHistory = async () => {
        if (!history?.matchData || history.matchData.length === 0) {
            console.error("Nenhum dado de partida encontrado no histórico.");
            return;
        }

        // Verificar se o histórico já foi renderizado para evitar loop
        if (isHistoryRendered) return;

        for (let matchIndex = 0; matchIndex < history.matchData.length; matchIndex++) {
            const match = history.matchData[matchIndex];
            const matchDiv = document.getElementById(`match${matchIndex + 1}`);
            if (!matchDiv) {
                console.error(`Div de partida para a partida ${matchIndex + 1} não encontrada.`);
                continue;
            }

            await appendGameDateElement(matchDiv, match.info.gameStartTimestamp);

            const participants = match.info.participants;
            const queueName = getTranslatedQueueName(match.info.queueId, history.queueType);

            const arrowIcon = await createArrowIcon();
            matchDiv.appendChild(arrowIcon);
            if (puuid) {
                arrowIcon.addEventListener("click", () =>
                    toggleMatchDetails(matchIndex, puuid, participants, history.itemData, history.runeData, queueName)
                );
            } else {
                console.error("Puuid é nulo, não é possível alternar os detalhes da partida.");
            }

            const currentPlayer = participants.find((p: any) => p.puuid === puuid);
            if (currentPlayer) {
                const runeIcons = await createRuneIcons(currentPlayer, history.runeData);
                for (const icon of runeIcons) {
                    matchDiv.appendChild(icon);
                }

                matchDiv.appendChild(await createChampionIcon(currentPlayer));
                matchDiv.appendChild(await createGameStatsContainer(currentPlayer, queueName));
                matchDiv.appendChild(await createItemIcons(currentPlayer, history.itemData));
            }
        }
        setIsHistoryRendered(true);
    }

    useEffect(() => {
        if (history && !isHistoryRendered) {
            renderMatchHistory();
        }
    }, [history, isHistoryRendered]);


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
        history,
        renderMatchHistory,
        fetchData
    };
}

async function appendGameDateElement(matchDiv: HTMLElement, timestamp: number) {
    const gameDate = new Date(timestamp).toLocaleString();
    const gameDateSpan = document.createElement("span");
    gameDateSpan.textContent = `Data do Jogo: ${gameDate}`;
    gameDateSpan.classList.add("gameDate");
    matchDiv.appendChild(gameDateSpan);
    return gameDateSpan;
}

function getTranslatedQueueName(queueId: number, queueTypes: any[]) {
    const queue = queueTypes.find(q => q.queueId === queueId);
    let queueName = queue ? queue.description : "Desconhecido";

    for (const [key, value] of Object.entries(TRANSLATION_MAP)) {
        if (queueName.includes(key)) {
            queueName = queueName.replace(key, value);
        }
    }

    return queueName;
}

async function createArrowIcon() {
    const arrowIcon = document.createElement("span");
    arrowIcon.classList.add("arrow-icon");
    arrowIcon.innerHTML = "▼";
    return arrowIcon;
}

async function createRuneIcons(participant: any, runeData: any) {
    const styles = participant.perks.styles;
    const gameMainRune = styles[0].selections[0].perk;
    const gameSecondaryRune = styles[1].style;

    let gameMainRuneIconPath = "";
    let gameSecondaryRuneIconPath = "";

    // Find rune icons
    for (const style of runeData) {
        // Check for secondary rune style
        if (style.id === gameSecondaryRune) {
            gameSecondaryRuneIconPath = style.icon;
        }

        // Search for main rune
        for (const slot of style.slots) {
            for (const rune of slot.runes) {
                if (rune.id === gameMainRune) {
                    gameMainRuneIconPath = rune.icon;
                }
            }
        }
    }

    // Create icons in parallel
    const [mainRuneIcon, secondaryRuneIcon] = await Promise.all([
        createMainRuneIcon(gameMainRuneIconPath),
        createSecondaryRuneIcon(gameSecondaryRuneIconPath)
    ]);

    return [mainRuneIcon, secondaryRuneIcon];
}

async function createMainRuneIcon(iconPath: string) {
    const mainRuneIcon = document.createElement("img");
    mainRuneIcon.src = `https://ddragon.canisback.com/img/${iconPath}`;
    mainRuneIcon.classList.add('main-rune-icon');

    return mainRuneIcon;
}

async function createSecondaryRuneIcon(iconPath: string) {
    const secondaryRuneIcon = document.createElement("img");
    secondaryRuneIcon.src = `https://ddragon.canisback.com/img/${iconPath}`;
    secondaryRuneIcon.classList.add('secondary-rune-icon');
    return secondaryRuneIcon;
}

async function createChampionIcon(participant: any) {
    const championIcon = document.createElement("img");
    championIcon.src = `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/${participant.championId}.png`;
    championIcon.classList.add('champion-icon');
    return championIcon;
}

async function createGameStatsContainer(participant: any, queueName: string) {
    const gameStatsContainer = document.createElement("div");
    gameStatsContainer.classList.add("gamestatsContainer");
    gameStatsContainer.style.cssText = `
        float: left;
        margin-left: 10px;
        display: flex;
        align-items: center;
        height: 60px;
    `;

    // Create elements in parallel
    const [gameStats, gameQueueType, kdaTxt] = await Promise.all([
        createGameResult(participant.win),
        createQueueTypeElement(queueName),
        createKDAElement(participant)
    ]);

    gameStatsContainer.appendChild(gameStats);
    gameStatsContainer.appendChild(gameQueueType);
    gameStatsContainer.appendChild(kdaTxt);

    return gameStatsContainer;
}

async function createGameResult(isWin: boolean) {
    const gameStats = document.createElement("span");
    gameStats.textContent = isWin ? "Vitória" : "Derrota";
    gameStats.classList.add("gamestats");
    gameStats.style.cssText = `
        color: ${isWin ? "#2DEB90" : "#ff5859"};
    `;
    return gameStats;
}

async function createQueueTypeElement(queueName: string) {
    const gameQueueType = document.createElement("span");
    gameQueueType.classList.add("gameQueueType");
    gameQueueType.textContent = queueName;
    return gameQueueType;
}

async function createKDAElement(participant: any) {
    const kdaTxt = document.createElement("span");
    kdaTxt.id = "kdaTxt";
    kdaTxt.textContent = `${participant.kills} / ${participant.deaths} / ${participant.assists}`;
    return kdaTxt;
}

async function createItemIcons(participant: any, itemData: any) {
    const itemDivMatch = document.createElement("div");
    itemDivMatch.classList.add("items");

    const itemIds = [
        participant.item0,
        participant.item1,
        participant.item2,
        participant.item3,
        participant.item4,
        participant.item5,
        participant.item6
    ];

    // Process all items in parallel
    const itemElements = await Promise.all(
        itemIds.map(async itemId => {
            if (itemId) {
                const item = itemData.find((i: any) => i.id === itemId);
                if (item) {
                    const itemIcon = document.createElement("img");
                    itemIcon.src = formatItemIconPath(item.iconPath);
                    itemIcon.classList.add("itemIcon");
                    return itemIcon;
                }
            }
            return null;
        })
    );

    // Add only valid items to the div
    itemElements.filter(item => item !== null).forEach(item => {
        itemDivMatch.appendChild(item);
    });

    return itemDivMatch;
}

function formatItemIconPath(iconPath: string) {
    return iconPath
        .toLowerCase()
        .replace(
            "/lol-game-data/assets/",
            "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/"
        );
}

async function toggleMatchDetails(matchIndex: number, puuid: string, participants: any[], itemData: any, runeData: any, queueName: string) {
    const body = document.body;
    const matchId = `match${matchIndex + 1}`;
    const detailsId = `matchDetails${matchIndex + 1}`;
    const existingDetails = document.getElementById(detailsId);
    const arrowIcon = document.querySelector(`#${matchId} .arrow-icon`);

    if (!arrowIcon) {
        console.error(`Arrow icon for match ${matchId} not found.`);
        return;
    }

    // If details exist for this player
    if (existingDetails && existingDetails.getAttribute("data-puuid") === puuid) {
        const isVisible = existingDetails.style.display === "flex";
        existingDetails.style.display = isVisible ? "none" : "flex";
        arrowIcon.innerHTML = isVisible ? "▼" : "▲";
        body.style.top = isVisible ? "0px" : "200px";
    } else {
        // Remove existing details if they're for a different player
        if (existingDetails) {
            existingDetails.remove();
        }

        // Create new details asynchronously
        const newDetails = await createMatchDetails(matchIndex, puuid, participants, itemData, runeData, queueName);
        document.getElementById(matchId)?.insertAdjacentElement("afterend", newDetails);
        arrowIcon.innerHTML = "▲";
        body.style.top = "200px";
    }
}

async function createMatchDetails(matchIndex: number, puuid: string, participants: any[], itemData: any, runeData: any, queueName: string) {
    const detailsContainer = document.createElement("div");
    detailsContainer.id = `matchDetails${matchIndex + 1}`;
    detailsContainer.className = "matchesDetails";
    detailsContainer.setAttribute("data-puuid", puuid);
    detailsContainer.style.cssText = `
    margin-top: 10px;
    padding: 10px;
    background-color: #2a2a2a;
    border-radius: 8px;
    display: flex;
    justify-content: space-between;
    gap: 20px;
`;

    const winningTeam = participants.filter(p => p.win);
    const losingTeam = participants.filter(p => !p.win);

    // Create team columns in parallel
    const [winningColumn, losingColumn] = await Promise.all([
        createTeamColumn(winningTeam, true, itemData),
        createTeamColumn(losingTeam, false, itemData)
    ]);

    detailsContainer.appendChild(winningColumn);
    detailsContainer.appendChild(losingColumn);

    return detailsContainer;
}

async function createTeamColumn(team: any[], isWinningTeam: boolean, itemData: any) {
    const teamColumn = document.createElement("div");
    teamColumn.id = isWinningTeam ? "winningTeam" : "losingTeam";
    teamColumn.style.cssText = `
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 10px;
`;

    // Process all team members in parallel for better performance
    const teamElements = await Promise.all(
        team.map(async participant => {
            const participantDiv = document.createElement("div");
            participantDiv.className = "participant";
            participantDiv.style.cssText = `
            display: flex;
            align-items: center;
            padding: 5px;
            background-color: ${isWinningTeam ? "#2a5a2a" : "#5a2a2a"};
            border-radius: 5px;
        `;

            // Create elements in parallel
            const [championIcon, participantInfo, itemsDiv] = await Promise.all([
                createChampionIcon(participant),
                createParticipantInfo(participant),
                createItemsDiv(participant, itemData)
            ]);

            participantDiv.appendChild(championIcon);
            participantDiv.appendChild(participantInfo);
            participantDiv.appendChild(itemsDiv);

            return participantDiv;
        })
    );

    // Add all team members to the column
    teamElements.forEach(element => teamColumn.appendChild(element));

    return teamColumn;
}

async function createParticipantInfo(participant: any) {
    const participantInfo = document.createElement("div");

    // Create Riot ID element
    const riotIdElement = document.createElement("span");
    const participantLink = document.createElement("a");
    participantInfo.appendChild(participantLink);

    const riotId = `${participant.riotIdGameName}#${participant.riotIdTagline}`;

    riotIdElement.textContent = riotId;
    riotIdElement.style.cssText = `
        color: #fff;
        font-weight: bold;
        font-size: 14px;
        cursor: pointer;
    `;
    participantLink.target = "_blank"
    participantLink.href = `https://lol-data-blond.vercel.app/summoner/br1/${participant.riotIdGameName}/${participant.riotIdTagline}`
    participantLink.appendChild(riotIdElement);

    const kda = document.createElement("span");
    kda.textContent = `${participant.kills} / ${participant.deaths} / ${participant.assists}`;
    participantInfo.appendChild(kda);

    return participantInfo;
}

async function createItemsDiv(participant: any, itemData: any) {
    const itemsDiv = document.createElement("div");
    itemsDiv.style.cssText = `
    display: flex;
    gap: 5px;
    margin-left: auto;
`;

    const itemIds = [
        participant.item0,
        participant.item1,
        participant.item2,
        participant.item3,
        participant.item4,
        participant.item5,
        participant.item6
    ];
    const itemIconStyle = `
    border: 2px solid #d4af37;
    border-radius: 15px;
    width: 35px;
    height: 35px;
    margin-top: 20px;
`;

    // Create all item icons in parallel
    const itemElements = await Promise.all(
        itemIds.map(async itemId => {
            if (itemId && itemId !== 0) {
                const item = itemData.find((i: any) => i.id === itemId);
                if (item) {
                    const itemIcon = document.createElement("img");
                    itemIcon.src = formatItemIconPath(item.iconPath);
                    itemIcon.style.cssText = itemIconStyle;
                    return itemIcon;
                }
            }
            return null;
        })
    );

    // Add only valid items to the div
    itemElements.filter(item => item !== null).forEach(item => {
        itemsDiv.appendChild(item);
    });

    return itemsDiv;
}

export default useSummonerData;
