import { performNewSearch } from "./script.js";

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
    let versionresponse = await axios
        .get("http://ddragon.leagueoflegends.com/api/versions.json")
    versao = versionresponse.data[0];
    region = region.value.toLowerCase();
    riotId = riotId.replace(/\s/g, "");

    let response = await axios.get("http://localhost:4000/account", { params: { riotId } });
    if (response.config.params.riotId === "") return;

    puuid = response.data.puuid;
    regionSelect.style.marginLeft = "5px";
    inputContainer.style.top = "-50px";
    inputContainer.style.left = "376px";

    let matchIdsResponse = await axios.get("http://localhost:4000/matchIds", { params: { puuid } });
    let matchIds = matchIdsResponse.data.slice(0, 10); // Limit to 10 matches
    let matchHistoryResponse = await axios.get("http://localhost:4000/matchHistory", { params: { matches: matchIds } });
    let matchHistory = matchHistoryResponse.data;


    const [responseVersion, responseRune, responseItems] = await Promise.all([
        axios.get("http://ddragon.leagueoflegends.com/api/versions.json"),
        axios.get(`https://ddragon.leagueoflegends.com/cdn/${versao}/data/en_US/runesReforged.json`),
        axios.get(`https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/items.json`)
    ]);

    const runeData = responseRune.data;
    const itemData = responseItems.data;

    const matchHistoryContainer = document.getElementById("matchHistoryContainer");
    matchHistoryContainer.style.display = "grid";

    let matchType = await axios.get("https://static.developer.riotgames.com/docs/lol/queues.json");
    let queueType = matchType.data;
    const translationMap = {
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
    function convertTimestamp(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleString(); // Formata a data de acordo com a localidade padrão
    }
    await Promise.all(
        matchHistory.map(async (match, matchIndex) => {
            let dataDoJogo = convertTimestamp(match.info.gameStartTimestamp);
            const currentMatchDiv = document.getElementById(`match${matchIndex + 1}`);
            const gameDateSpan = document.createElement("span");
            gameDateSpan.innerText = `Data do Jogo: ${dataDoJogo}`;
            gameDateSpan.style.cssText = `
                font-size: 12px;
                color: rgb(204, 204, 204);
                margin-left: 260px;
                justify-content: right;
                display: flex;
                margin-right: 30px;
            `;
            currentMatchDiv.appendChild(gameDateSpan);

            console.log(dataDoJogo)

            const participants = match.info.participants;

            let queueId = match.info.queueId;
            let queue = queueType.find(q => q.queueId === queueId);
            let queueName = queue ? queue.description : "Desconhecido";
            for (let key in translationMap) {
                if (queueName.includes(key)) {
                    queueName = queueName.replace(key, translationMap[key]);
                }
            }

            let existingDetails = document.getElementById(`matchDetails${matchIndex + 1}`);
            currentMatchDiv.style.cursor = "default";
            currentMatchDiv.style.position = "relative";

            let arrowIcon = currentMatchDiv.querySelector(".arrow-icon") || createArrowIcon();
            currentMatchDiv.appendChild(arrowIcon);

            arrowIcon.addEventListener("click", () => toggleMatchDetails(matchIndex, puuid, participants, itemData, runeData, queueName));


            // Seu código aqui
            participants.forEach((participant) => {
                if (participant.puuid === puuid) {
                    const runeIcons = createRuneIcons(participant, runeData);
                    runeIcons.forEach(icon => currentMatchDiv.appendChild(icon));


                    const championIcon = createChampionIcon(participant);
                    currentMatchDiv.appendChild(championIcon);

                    const gameStatsContainer = createGameStatsContainer(participant, queueName);
                    currentMatchDiv.appendChild(gameStatsContainer);
                    const itemDivMatch = createItemIcons(participant, itemData);
                    currentMatchDiv.appendChild(itemDivMatch)
                }
            });

            return dataDoJogo;
        })
    );
}
function createArrowIcon() {
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

function toggleMatchDetails(matchIndex, puuid, participants, itemData, runeData, queueName) {
    const body = document.body;
    const existingDetails = document.getElementById(`matchDetails${matchIndex + 1}`);
    const arrowIcon = document.querySelector(`#match${matchIndex + 1} .arrow-icon`);

    if (existingDetails && existingDetails.getAttribute("data-puuid") === puuid) {
        if (existingDetails.style.display === "none" || existingDetails.style.display === "") {
            existingDetails.style.display = "flex";
            arrowIcon.innerHTML = "▲";
            body.style.top = "200px";
        } else {
            existingDetails.style.display = "none";
            arrowIcon.innerHTML = "▼";
            body.style.top = "0px";
        }
    } else {
        if (existingDetails) {
            existingDetails.remove();
        }

        const newDetails = createMatchDetails(matchIndex, puuid, participants, itemData, runeData, queueName);
        const currentMatchDiv = document.getElementById(`match${matchIndex + 1}`);
        currentMatchDiv.insertAdjacentElement("afterend", newDetails);
        arrowIcon.innerHTML = "▲";
        body.style.top = "200px";
    }
}

function createMatchDetails(matchIndex, puuid, participants, itemData, runeData, queueName) {
    const existingDetails = document.createElement("div");
    existingDetails.id = `matchDetails${matchIndex + 1}`;
    existingDetails.className = "matchesDetails";
    existingDetails.setAttribute("data-puuid", puuid);
    existingDetails.style.cssText = `
        margin-top: 10px; padding: 10px; background-color: #2a2a2a; border-radius: 8px;
        display: flex; justify-content: space-between; gap: 20px;
    `;

    const winningTeam = participants.filter(p => p.win);
    const losingTeam = participants.filter(p => !p.win);

    const winningTeamColumn = createTeamColumn(winningTeam, true, itemData);
    const losingTeamColumn = createTeamColumn(losingTeam, false, itemData);

    existingDetails.appendChild(winningTeamColumn);
    existingDetails.appendChild(losingTeamColumn);

    return existingDetails;
}

function createTeamColumn(team, isWinningTeam, itemData) {
    const teamColumn = document.createElement("div");
    teamColumn.style.cssText = `
        flex: 1; display: flex; flex-direction: column; gap: 10px;
    `;

    team.forEach((participant) => {
        const participantDiv = document.createElement("div");
        participantDiv.style.cssText = `
            display: flex; align-items: center; padding: 5px;
            background-color: ${isWinningTeam ? "#2a5a2a" : "#5a2a2a"}; border-radius: 5px;
        `;

        const championIcon = createChampionIcon(participant);
        participantDiv.appendChild(championIcon);

        const participantInfo = createParticipantInfo(participant);
        participantDiv.appendChild(participantInfo);

        const itemsDiv = createItemsDiv(participant, itemData);
        participantDiv.appendChild(itemsDiv);

        teamColumn.appendChild(participantDiv);
    });

    return teamColumn;
}

function createParticipantInfo(participant) {
    const participantInfo = document.createElement("div");
    participantInfo.style.cssText = `
        display: flex; flex-direction: column; gap: 2px;
    `;

    const riotIdElement = document.createElement("span");
    riotIdElement.innerText = `${participant.riotIdGameName}#${participant.riotIdTagline}`;
    riotIdElement.style.cssText = `
        color: #fff; font-weight: bold; font-size: 14px; cursor: pointer;
    `;
    riotIdElement.addEventListener("click", (e) => {
        e.stopPropagation();
        performNewSearch(`${participant.riotIdGameName}#${participant.riotIdTagline}`);
        document.body.style.top = "0px";

        // Correctly iterate over the collection of elements with class 'matchesDetails'
        const existingDetails = document.getElementsByClassName("matchesDetails");
        for (let detail of existingDetails) {
            detail.style.display = "none";
        }
    });
    participantInfo.appendChild(riotIdElement);

    const kda = document.createElement("span");
    kda.innerText = `${participant.kills} / ${participant.deaths} / ${participant.assists}`;
    kda.style.cssText = `
        color: #ccc; font-size: 12px;
    `;
    participantInfo.appendChild(kda);

    return participantInfo;
}


function createItemsDiv(participant, itemData) {
    const itemsDiv = document.createElement("div");
    itemsDiv.style.cssText = `
        display: flex; gap: 5px; margin-left: auto;
    `;
    itemsDiv.id = "itemsDiv";

    const matchItems = [
        participant.item0,
        participant.item1,
        participant.item2,
        participant.item3,
        participant.item4,
        participant.item5,
        participant.item6,
    ];

    matchItems.forEach((itemId) => {
        if (itemId !== 0) {
            const item = itemData.find((i) => i.id === itemId);
            if (item) {
                const itemIcon = document.createElement("img");
                itemIcon.style = "width: 30px; height: 30px; border-radius: 5px;";
                itemIcon.src = item.iconPath
                    .toLowerCase()
                    .replace("/lol-game-data/assets/", "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/");
                itemIcon.style.cssText = `
                    border: 2px solid #d4af37; border-radius: 15px; width: 35px; height: 35px; margin-top: 20px;
                `;
                itemsDiv.appendChild(itemIcon);
            }
        }
    });

    return itemsDiv;
}

function createRuneIcons(participant, runeData) {
    const gameMainRune = participant.perks.styles[0].selections[0].perk;
    const gameSecondaryRune = participant.perks.styles[1].style;

    let gameMainRuneIconPath = "";
    let gameSecondaryRuneIconPath = "";

    for (let style of runeData) {
        for (let slot of style.slots) {
            for (let rune of slot.runes) {
                if (rune.id === gameMainRune) gameMainRuneIconPath = rune.icon;
                if (style.id === gameSecondaryRune) gameSecondaryRuneIconPath = style.icon;
            }
        }
    }

    const gameMainRuneIcon = document.createElement("img");
    gameMainRuneIcon.src = `https://ddragon.canisback.com/img/${gameMainRuneIconPath}`;
    gameMainRuneIcon.style.cssText = `
        width: 25px; height: 25px; float: left; margin-top: 15px; margin-left: 6px;
        border: 2px solid #d4af37; border-radius: 15px;
    `;

    const gameSecondaryRuneIcon = document.createElement("img");
    gameSecondaryRuneIcon.src = `https://ddragon.canisback.com/img/${gameSecondaryRuneIconPath}`;
    gameSecondaryRuneIcon.style.cssText = `
        width: 15px; height: 15px; float: left; margin-top: 20px; margin-left: 2px;
        padding: 2px; border: 2px solid #d4af37; border-radius: 15px;
    `;

    return [gameMainRuneIcon, gameSecondaryRuneIcon];
}

function createItemIcons(participant, itemData) {
    // Cria uma nova div com a classe "items"
    const itemDivMatch = document.createElement("div");
    itemDivMatch.className = "items";
    itemDivMatch.style.cssText = ` 
            width: 500px;
            left: 10%;
            top: -10%;
            display: flex;
  `

    // Lista de itens do participante
    const matchItems = [
        participant.item0,
        participant.item1,
        participant.item2,
        participant.item3,
        participant.item4,
        participant.item5,
        participant.item6,
    ];

    // Itera sobre os itens e cria os ícones
    matchItems.forEach((itemId) => {
        if (itemId) { // Verifica se o itemId é válido
            const item = itemData.find((i) => i.id === itemId);
            if (item) {
                const itemIcon = document.createElement("img");
                itemIcon.src = item.iconPath
                    .toLowerCase()
                    .replace(
                        "/lol-game-data/assets/",
                        "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/"
                    );
                itemIcon.style.cssText = `
                    border: 2px solid #d4af37; 
                    border-radius: 15px; 
                    width: 35px; 
                    height: 35px; 
                    margin-top: 20px;
                `;
                itemDivMatch.appendChild(itemIcon); // Adiciona o ícone à div
            }
        }
    });

    return itemDivMatch; // Retorna a div com os ícones
}
function createChampionIcon(participant) {
    const championIcon = document.createElement("img");
    championIcon.src = `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/${participant.championId}.png`;
    championIcon.style.cssText = `
        width: 60px; height: 60px; float: left; margin-left: 8px; 
    `;
    return championIcon;
}

function createGameStatsContainer(participant, queueName, dataDoJogo) {

    const gameStatsContainer = document.createElement("div");
    gameStatsContainer.style.cssText = `
        float: left; margin-left: 10px; display: flex; align-items: center; height: 60px;
    `;

    const gameStats = document.createElement("span");
    gameStats.innerText = participant.win ? "Vitória" : "Derrota";
    gameStats.style.cssText = `
        color: ${participant.win ? "#2DEB90" : "#ff5859"}; font-weight: bold; font-size: 16px; margin-right: 10px;
    `;
    gameStatsContainer.appendChild(gameStats);
    const gameQueueType = document.createElement("span");
    gameQueueType.innerText = queueName;
    gameQueueType.style.cssText = `
        color: #ccc; font-size: 12px; margin-right: 10px;
    `;
    gameStatsContainer.appendChild(gameQueueType);

    const kda = `${participant.kills} / ${participant.deaths} / ${participant.assists}`;
    const kdaTxt = document.createElement("span");
    kdaTxt.innerText = kda;
    kdaTxt.style.cssText = `
        color: #ccc; font-size: 14px;
    `;
    gameStatsContainer.appendChild(kdaTxt);

    return gameStatsContainer;
}
