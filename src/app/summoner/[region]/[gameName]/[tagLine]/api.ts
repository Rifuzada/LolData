const riotUrl = "https://americas.api.riotgames.com"
const endpointRiotId = "riot/account/v1/accounts/by-riot-id"
const endpointPuuIDtoName = "/riot/account/v1/accounts/by-puuid"
const endpointPuuid = "lol/champion-mastery/v4/champion-masteries/by-puuid"
const endpointSummonerPuuid = "lol/summoner/v4/summoners/by-puuid"
const endpointRankedID = "lol/league/v4/entries/by-summoner"
const endpointMatchIDS = "/lol/match/v5/matches/by-puuid/"
const endpointMatches = "/lol/match/v5/matches/"
require('dotenv').config();
 
const api_key = process.env.API_KEY || "";

import axios from 'axios';
import { ChampionMastery, ChampionsResponse, ChampionData } from './type';

export const fetchVersion = async () => {
    const response = await fetch("https://ddragon.leagueoflegends.com/api/versions.json");
    const data = await response.json();
    return data[0];
};

export const fetchAccount = async (region: string, gameName: string, tagLine: string) => {
    const response = await fetch(`${riotUrl}/${endpointRiotId}/${gameName}/${tagLine}?api_key=${api_key}`);
    const data = await response.json();
    console.log(data);
    return data;
};

export const fetchRanked = async (region: string, sumID: string) => {
    const riotUrlReg = `https://${region}.api.riotgames.com`
    const response = await fetch(`${riotUrlReg}/${endpointRankedID}/${sumID}?api_key=${api_key}`);
    const data = await response.json();


    return data;
};

export const fetchProfile = async (region: string, puuid: string) => {
    const riotUrlReg = `https://${region}.api.riotgames.com`
    const response = await fetch(`${riotUrlReg}/${endpointSummonerPuuid}/${puuid}?api_key=${api_key}`);
    const data = await response.json();
    return data;
};

export const fetchMastery = async (region: string, puuid: string, version: string) => {
    const riotUrlReg = `https://${region}.api.riotgames.com`
    const response = await fetch(`${riotUrlReg}/${endpointPuuid}/${puuid}?api_key=${api_key}`)
    const dataMastery = await response.json();

    const topChampions = dataMastery.slice(0, 5).map((champion: any) => ({
        id: champion.championId.toString(),
        level: champion.championLevel,
        points: champion.championPoints
    }));

    const championsUrl = `https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/champion.json`;
    const championsResponse = await fetch(championsUrl);
    const dataChampions: ChampionsResponse = await championsResponse.json();

    const championNames = topChampions.map((champion: ChampionMastery) => {
        const championData = Object.values(dataChampions.data).find((champ: ChampionData) => champ.key === champion.id);
        return {
            name: championData ? championData.name : "Desconhecido",
            id: champion.id,
            level: champion.level,
            points: champion.points
        };
    });

    return championNames;
};

export const fetchHistory = async (region: string, puuid: string, version: string) => {
    const response = await fetch(`${riotUrl}${endpointMatchIDS}${puuid}/ids?start=0&count=10&api_key=${api_key}`);
    const dataMatchIds = await response.json();
    console.log(dataMatchIds);

    // Chama o endpoint do servidor para obter os dados das partidas
    
    const matches = await dataMatchIds.slice(0, 10);
    const matchDataPromises = [];

    for (let i = 0; i < 10; i++) {
        const matchDataResponse = await fetch(`${riotUrl}${endpointMatches}${matches[i]}?api_key=${api_key}`);
        const matchData = matchDataResponse.json(); ;
        matchDataPromises.push(matchData);
    }

    const matchDataResponses = await Promise.all(matchDataPromises);
    const matchData = matchDataResponses.map(response => response.json());


    const [runeResponse, itemsResponse, matchTypeResponse] = await Promise.all([
        fetch(`https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/runesReforged.json`),
        fetch(`https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/items.json`),
        fetch("https://static.developer.riotgames.com/docs/lol/queues.json")
    ]);

    const runeData = await runeResponse.json();
    const itemData = await itemsResponse.json();
    const queueType = await matchTypeResponse.json();

    // Process and display each match
    await renderMatchHistory(matchData, puuid, itemData, runeData, queueType);

    return matchData;
};

async function renderMatchHistory(matchData: any[], puuid: string, itemData: any, runeData: any, queueType: any) {
    // Process matches in parallel for better performance
    await Promise.all(
        matchData.map(async (match, matchIndex) => {
            const matchDiv = document.getElementById(`match${matchIndex + 1}`);
            if (!matchDiv) {
                console.error(`Match div for match ${matchIndex + 1} not found.`);
                return;
            }

            // Add game date
            await appendGameDateElement(matchDiv, match.info.gameStartTimestamp);

            // Get participants and queue name
            const participants = match.info.participants;
            const queueName = getTranslatedQueueName(match.info.queueId, queueType);

            // Add toggle arrow
            const arrowIcon = await createArrowIcon();
            matchDiv.appendChild(arrowIcon);
            arrowIcon.addEventListener("click", () =>
                toggleMatchDetails(matchIndex, puuid, participants, itemData, runeData, queueName)
            );

            // Find current player and add their data
            const currentPlayer = participants.find((p: any) => p.puuid === puuid);
            if (currentPlayer) {
                // Add rune icons - can be processed in parallel
                const runeIcons = await createRuneIcons(currentPlayer, runeData);
                await Promise.all(runeIcons.map(icon => matchDiv.appendChild(icon)));

                // Add champion icon
                matchDiv.appendChild(await createChampionIcon(currentPlayer));

                // Add stats container
                matchDiv.appendChild(await createGameStatsContainer(currentPlayer, queueName));

                // Add item icons
                matchDiv.appendChild(await createItemIcons(currentPlayer, itemData));
            }
        })
    );
}


// Helper functions
function convertTimestamp(timestamp: number) {
    return new Date(timestamp).toLocaleString();
}

// Translation map - define outside of functions to avoid recreation
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

// Queue name translation function
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

// UI Elements creation functions - made async for potential future improvements with lazy loading
async function appendGameDateElement(matchDiv: HTMLElement, timestamp: number) {
    const gameDate = convertTimestamp(timestamp);
    const gameDateSpan = document.createElement("span");
    gameDateSpan.textContent = `Data do Jogo: ${gameDate}`;
    gameDateSpan.style.cssText = `
    font-size: 12px;
    color: rgb(204, 204, 204);
    margin-left: 260px;
    justify-content: right;
    display: flex;
    margin-right: 30px;
`;
    matchDiv.appendChild(gameDateSpan);
    return gameDateSpan;
}

async function createArrowIcon() {
    const arrowIcon = document.createElement("span");
    arrowIcon.classList.add("arrow-icon");
    arrowIcon.innerHTML = "▼";
    arrowIcon.style.cssText = `
        position: absolute;
        bottom: 10px;
        right: 10px;
        font-size: 16px;
        cursor: pointer;
        color: #d4af37;
    `;
    return arrowIcon;
}

// Toggle function made async to improve UI responsiveness
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
    //console.log(participant)

    const riotId = `${participant.riotIdGameName}#${participant.riotIdTagline}`;
   
    //console.log(riotIdElement)
    riotIdElement.textContent = riotId;
    riotIdElement.style.cssText = `
        color: #fff;
        font-weight: bold;
        font-size: 14px;
        cursor: pointer;
    `;
    participantLink.target = "_blank"
    participantLink.href = `localhost:3000/summoner/br1/${participant.riotIdGameName}/${participant.riotIdTagline}`
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

function formatItemIconPath(iconPath: string) {
    return iconPath
        .toLowerCase()
        .replace(
            "/lol-game-data/assets/",
            "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/"
        );
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

async function createChampionIcon(participant: any) {
    const championIcon = document.createElement("img");
    championIcon.src = `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/${participant.championId}.png`;
    championIcon.classList.add('champion-icon');
    return championIcon;
}

async function createGameStatsContainer(participant: any, queueName: string) {
    const gameStatsContainer = document.createElement("div");
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
    font-weight: bold; 
    font-size: 18px; 
    margin-right: 10px;
`;
    return gameStats;
}

async function createQueueTypeElement(queueName: string) {
    const gameQueueType = document.createElement("span");
    gameQueueType.textContent = queueName;
    gameQueueType.style.cssText = `
    color: #ccc; 
    font-size: 14px; 
    margin-right: 10px;
`;
    return gameQueueType;
}

async function createKDAElement(participant: any) {
    const kdaTxt = document.createElement("span");
    kdaTxt.id = "kdaTxt"
    kdaTxt.textContent = `${participant.kills} / ${participant.deaths} / ${participant.assists}`;
    return kdaTxt;
}
