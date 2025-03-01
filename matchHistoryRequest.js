import { performNewSearch } from "./script.js";
import { base_url } from 'env.js';

export async function matchHistoryRequest(
    riotId,
    puuid,
    region,
    regionSelect,
    inputContainer,
    versao,
    gameMainRuneIcon,
    gameSecondaryRuneIcon
) {
    try {
        // Get latest version once
        const versionResponse = await axios.get("https://ddragon.leagueoflegends.com/api/versions.json");
        versao = versionResponse.data[0];

        // Format parameters
        region = region.value.toLowerCase();
        riotId = riotId.replace(/\s/g, "");

        // Early return if no riotId
        if (!riotId) return;

        // Fetch account data
        const response = await axios.get(`${base_url}/account`, { params: { riotId } });
        puuid = response.data.puuid;

        // Update UI
        regionSelect.style.marginLeft = "5px";
        inputContainer.style.top = "-50px";
        inputContainer.style.left = "376px";

        // Fetch match data
        const matchIdsResponse = await axios.get(`${base_url}/matchIds`, { params: { puuid } });
        const matchIds = matchIdsResponse.data.slice(0, 10); // Limit to 10 matches
        const matchHistoryResponse = await axios.get(`${base_url}/matchHistory`, { params: { matches: matchIds } });
        const matchHistory = matchHistoryResponse.data;

        // Fetch necessary data in parallel
        const [responseRune, responseItems, matchTypeResponse] = await Promise.all([
            axios.get(`https://ddragon.leagueoflegends.com/cdn/${versao}/data/en_US/runesReforged.json`),
            axios.get(`https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/items.json`),
            axios.get("https://static.developer.riotgames.com/docs/lol/queues.json")
        ]);

        const runeData = responseRune.data;
        const itemData = responseItems.data;
        const queueType = matchTypeResponse.data;

        // Display match history container
        const matchHistoryContainer = document.getElementById("matchHistoryContainer");
        matchHistoryContainer.style.display = "grid";

        // Process and display each match
        await renderMatchHistory(matchHistory, puuid, itemData, runeData, queueType);

    } catch (error) {
        console.error("Error in matchHistoryRequest:", error);
    }
}

// Helper functions
function convertTimestamp(timestamp) {
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
function getTranslatedQueueName(queueId, queueTypes) {
    const queue = queueTypes.find(q => q.queueId === queueId);
    let queueName = queue ? queue.description : "Desconhecido";

    for (const [key, value] of Object.entries(TRANSLATION_MAP)) {
        if (queueName.includes(key)) {
            queueName = queueName.replace(key, value);
        }
    }

    return queueName;
}

// Main render function - async to handle parallel processing
async function renderMatchHistory(matchHistory, puuid, itemData, runeData, queueType) {
    // Process matches in parallel for better performance
    await Promise.all(
        matchHistory.map(async (match, matchIndex) => {
            const matchDiv = document.getElementById(`match${matchIndex + 1}`);
            if (!matchDiv) return;

            // Set up match container
            matchDiv.style.cursor = "default";
            matchDiv.style.position = "relative";

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
            const currentPlayer = participants.find(p => p.puuid === puuid);
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

// UI Elements creation functions - made async for potential future improvements with lazy loading
async function appendGameDateElement(matchDiv, timestamp) {
    const gameDate = convertTimestamp(timestamp);
    const gameDateSpan = document.createElement("span");
    gameDateSpan.innerText = `Data do Jogo: ${gameDate}`;
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
async function toggleMatchDetails(matchIndex, puuid, participants, itemData, runeData, queueName) {
    const body = document.body;
    const matchId = `match${matchIndex + 1}`;
    const detailsId = `matchDetails${matchIndex + 1}`;
    const existingDetails = document.getElementById(detailsId);
    const arrowIcon = document.querySelector(`#${matchId} .arrow-icon`);

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
        document.getElementById(matchId).insertAdjacentElement("afterend", newDetails);
        arrowIcon.innerHTML = "▲";
        body.style.top = "200px";
    }
}

async function createMatchDetails(matchIndex, puuid, participants, itemData, runeData, queueName) {
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

async function createTeamColumn(team, isWinningTeam, itemData) {
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

async function createParticipantInfo(participant) {
    const participantInfo = document.createElement("div");
    participantInfo.style.cssText = `
        display: flex; 
        flex-direction: column; 
        gap: 2px;
        margin-left: 1.5em;
    `;

    // Create Riot ID element
    const riotIdElement = document.createElement("span");
    const riotId = `${participant.riotIdGameName}#${participant.riotIdTagline}`;
    riotIdElement.innerText = riotId;
    riotIdElement.style.cssText = `
        color: #fff; 
        font-weight: bold; 
        font-size: 14px; 
        cursor: pointer;
    `;

    // Add click event for player search
    riotIdElement.addEventListener("click", async (e) => {
        e.stopPropagation();
        await performNewSearch(riotId);
        document.body.style.top = "0px";

        // Hide all match details
        document.querySelectorAll('.matchesDetails').forEach(detail => {
            detail.style.display = "none";
        });
    });

    participantInfo.appendChild(riotIdElement);

    // Create KDA element
    const kda = document.createElement("span");
    kda.innerText = `${participant.kills} / ${participant.deaths} / ${participant.assists}`;
    kda.style.cssText = `
        color: #ccc; 
        font-size: 12px;
    `;
    participantInfo.appendChild(kda);

    return participantInfo;
}

async function createItemsDiv(participant, itemData) {
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

    // Common style for all item icons
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
                const item = itemData.find(i => i.id === itemId);
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

function formatItemIconPath(iconPath) {
    return iconPath
        .toLowerCase()
        .replace(
            "/lol-game-data/assets/",
            "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/"
        );
}

async function createRuneIcons(participant, runeData) {
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

async function createMainRuneIcon(iconPath) {
    const mainRuneIcon = document.createElement("img");
    mainRuneIcon.src = `https://ddragon.canisback.com/img/${iconPath}`;
    mainRuneIcon.style.cssText = `
        width: 25px; 
        height: 25px; 
        float: left; 
        margin-top: 15px; 
        margin-left: 6px;
        border: 2px solid #d4af37; 
        border-radius: 15px;
    `;
    return mainRuneIcon;
}

async function createSecondaryRuneIcon(iconPath) {
    const secondaryRuneIcon = document.createElement("img");
    secondaryRuneIcon.src = `https://ddragon.canisback.com/img/${iconPath}`;
    secondaryRuneIcon.style.cssText = `
        width: 15px; 
        height: 15px; 
        float: left; 
        margin-top: 20px; 
        margin-left: 2px;
        padding: 2px; 
        border: 2px solid #d4af37; 
        border-radius: 15px;
    `;
    return secondaryRuneIcon;
}

async function createItemIcons(participant, itemData) {
    const itemDivMatch = document.createElement("div");
    itemDivMatch.className = "items";
    itemDivMatch.style.cssText = ` 
        width: 500px;
        left: 10%;
        top: -10%;
        display: flex;
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

    // Process all items in parallel
    const itemElements = await Promise.all(
        itemIds.map(async itemId => {
            if (itemId) {
                const item = itemData.find(i => i.id === itemId);
                if (item) {
                    const itemIcon = document.createElement("img");
                    itemIcon.src = formatItemIconPath(item.iconPath);
                    itemIcon.style.cssText = `
                        border: 2px solid #d4af37; 
                        border-radius: 15px; 
                        width: 35px; 
                        height: 35px; 
                        margin-top: 20px;
                    `;
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

async function createChampionIcon(participant) {
    const championIcon = document.createElement("img");
    championIcon.src = `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/${participant.championId}.png`;
    championIcon.style.cssText = `
        width: 60px; 
        height: 60px; 
        float: left; 
        margin-left: 8px; 
    `;
    return championIcon;
}

async function createGameStatsContainer(participant, queueName) {
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

async function createGameResult(isWin) {
    const gameStats = document.createElement("span");
    gameStats.innerText = isWin ? "Vitória" : "Derrota";
    gameStats.style.cssText = `
        color: ${isWin ? "#2DEB90" : "#ff5859"}; 
        font-weight: bold; 
        font-size: 18px; 
        margin-right: 10px;
    `;
    return gameStats;
}

async function createQueueTypeElement(queueName) {
    const gameQueueType = document.createElement("span");
    gameQueueType.innerText = queueName;
    gameQueueType.style.cssText = `
        color: #ccc; 
        font-size: 14px; 
        margin-right: 10px;
    `;
    return gameQueueType;
}

async function createKDAElement(participant) {
    const kdaTxt = document.createElement("span");
    kdaTxt.innerText = `${participant.kills} / ${participant.deaths} / ${participant.assists}`;
    kdaTxt.style.cssText = `
        color: #ccc; 
        font-size: 14px;
    `;
    return kdaTxt;
}