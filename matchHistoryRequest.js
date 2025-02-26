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

    const responseVersionPromise = axios.get("http://ddragon.leagueoflegends.com/api/versions.json");
    const responseRunePromise = responseVersionPromise.then((res) => {
        versao = res.data[0];
        return axios.get(`https://ddragon.leagueoflegends.com/cdn/${versao}/data/en_US/runesReforged.json`);
    });
    const responseItemsPromise = axios.get(
        `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/items.json`
    );

    const [responseVersion, responseRune, responseItems] = await Promise.all([
        responseVersionPromise,
        responseRunePromise,
        responseItemsPromise,
    ]);

    const runeData = responseRune.data;
    const itemData = responseItems.data;

    const matchHistoryContainer = document.getElementById("matchHistoryContainer");
    matchHistoryContainer.style.display = "grid";

    let matchType = await axios.get("https://static.developer.riotgames.com/docs/lol/queues.json")
    let queueType = matchType.data
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
    //console.log(queueType)
    //console.log(matchHistory[matchIndex].info.queueId)
    await Promise.all(
        matchHistory.map(async (match, matchIndex) => {
            const currentMatchDiv = document.getElementById(`match${matchIndex + 1}`);
            const participants = match.info.participants;
            //console.log(participants)

            let queueId = matchHistory[matchIndex].info.queueId;
            let queue = queueType.find(q => q.queueId === queueId);
            let queueName = queue ? queue.description : "Desconhecido";
            for (let key in translationMap) {
                if (queueName.includes(key)) {
                    queueName = queueName.replace(key, translationMap[key]);
                }
            }
            let existingDetails = document.getElementById(`matchDetails${matchIndex + 1}`);

            currentMatchDiv.style.cursor = "default"; // Remove o cursor de pointer
            currentMatchDiv.style.position = "relative"; // Adiciona posicionamento relativo

            // Cria a seta de expansão
            let arrowIcon = currentMatchDiv.querySelector(".arrow-icon");
            if (!arrowIcon) {
                arrowIcon = document.createElement("span");
                arrowIcon.classList.add("arrow-icon");
                arrowIcon.innerHTML = "▼"; // Seta para baixo (indica que pode expandir)
                arrowIcon.style.cssText = `
        position: absolute; /* Posicionamento absoluto */
        bottom: 10px; /* Distância do fundo */
        right: 10px; /* Distância da direita */
        font-size: 16px; 
        cursor: pointer;
        color: #d4af37;
    `;
                currentMatchDiv.appendChild(arrowIcon);
            }

            // Adiciona o evento de clique apenas à seta
            arrowIcon.addEventListener("click", () => {
                arrowIcon.classList.toggle("rotated");
                let body1 = document.body;
                body1.style.top = "140px";

                // Verifica se já existe uma div de detalhes para esta partida
                let existingDetails = document.getElementById(`matchDetails${matchIndex + 1}`);

                // Verifica se o existingDetails corresponde ao perfil pesquisado atualmente
                const currentPuuid = puuid; // Armazena o puuid atual
                const existingPuuid = existingDetails?.getAttribute("data-puuid"); // Obtém o puuid armazenado no existingDetails

                if (existingDetails && existingPuuid === currentPuuid) {
                    // Se o existingDetails já existe e corresponde ao perfil atual, alterna a visibilidade
                    if (existingDetails.style.display === "none" || existingDetails.style.display === "") {
                        existingDetails.style.display = "flex"; // Mostra o existingDetails
                        arrowIcon.innerHTML = "▲"; // Seta para cima (indica que pode recolher)
                    } else {
                        body1.style.top = "0px";
                        existingDetails.style.display = "none"; // Esconde o existingDetails
                        arrowIcon.innerHTML = "▼"; // Seta para baixo (indica que pode expandir)
                    }
                } else {
                    // Se o existingDetails não existe ou não corresponde ao perfil atual, cria/reconstroi
                    if (existingDetails) {
                        // Remove o existingDetails antigo se existir
                        existingDetails.remove();
                    }

                    // Cria um novo existingDetails
                    existingDetails = document.createElement("div");
                    existingDetails.id = `matchDetails${matchIndex + 1}`;
                    existingDetails.setAttribute("data-puuid", currentPuuid); // Armazena o puuid atual
                    existingDetails.style.cssText = `
            margin-top: 10px; padding: 10px; background-color: #2a2a2a; border-radius: 8px;
            display: flex; /* Layout flexível para organizar as colunas lado a lado */
            justify-content: space-between; /* Espaço entre as colunas */
            gap: 20px; /* Espaçamento entre as colunas */
        `;

                    // Separar participantes em times (vencedores e perdedores)
                    const winningTeam = participants.filter(p => p.win);
                    const losingTeam = participants.filter(p => !p.win);

                    // Função para criar a coluna de um time
                    const createTeamColumn = (team, isWinningTeam) => {
                        const teamColumn = document.createElement("div");
                        teamColumn.style.cssText = `
                flex: 1; /* Ocupa o espaço disponível */
                display: flex; 
                flex-direction: column; 
                gap: 10px; /* Espaçamento entre os participantes */
            `;

                        team.forEach((participant) => {
                            const participantDiv = document.createElement("div");
                            participantDiv.style.cssText = `
                    display: flex; 
                    align-items: center; 
                    padding: 5px; 
                    background-color: ${isWinningTeam ? "#2a5a2a" : "#5a2a2a"}; 
                    border-radius: 5px;
                `;

                            // Ícone do campeão
                            const championIcon = document.createElement("img");
                            championIcon.src = `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/${participant.championId}.png`;
                            championIcon.style.cssText = `
                    width: 40px; height: 40px; margin-right: 10px;
                `;
                            participantDiv.appendChild(championIcon);

                            // Nome do campeão e KDA
                            const participantInfo = document.createElement("div");
                            participantInfo.style.cssText = `
                    display: flex; 
                    flex-direction: column; 
                    gap: 2px;
                `;

                            const riotIdElement = document.createElement("span");
                            riotIdElement.innerText = participant.riotIdGameName + "#" + participant.riotIdTagline;
                            riotIdElement.style.cssText = `
                    color: #fff; font-weight: bold; font-size: 14px; cursor: pointer;
                `;
                            riotIdElement.addEventListener("click", (e) => {
                                e.stopPropagation(); // Impede que o evento de clique na seta seja acionado
                                performNewSearch(participant.riotIdGameName + "#" + participant.riotIdTagline);
                                body1.style.top = "0px";
                                existingDetails.remove();
                                return;
                            });
                            participantInfo.appendChild(riotIdElement);

                            const kda = document.createElement("span");
                            kda.innerText = `${participant.kills} / ${participant.deaths} / ${participant.assists}`;
                            kda.style.cssText = `
                    color: #ccc; font-size: 12px;
                `;
                            participantInfo.appendChild(kda);

                            participantDiv.appendChild(participantInfo);

                            // Ítens do campeão
                            const itemsDiv = document.createElement("div");
                            itemsDiv.style.cssText = `
                    display: flex; 
                    gap: 5px; 
                    margin-left: auto;
                `;
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
                                if (itemId !== 0) { // Ignorar slots vazios
                                    const item = itemData.find((i) => i.id === itemId);
                                    if (item) {
                                        const itemIcon = document.createElement("img");
                                        itemIcon.src = item.iconPath
                                            .toLowerCase()
                                            .replace("/lol-game-data/assets/", "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/");
                                        itemIcon.style.cssText = `
                                width: 30px; height: 30px; border-radius: 5px;
                            `;
                                        itemsDiv.appendChild(itemIcon);
                                    }
                                }
                            });
                            participantDiv.appendChild(itemsDiv);

                            // Adicionar o participante à coluna do time
                            teamColumn.appendChild(participantDiv);
                        });

                        return teamColumn;
                    };

                    // Adicionar coluna do time vencedor (esquerda)
                    const winningTeamColumn = createTeamColumn(winningTeam, true);
                    existingDetails.appendChild(winningTeamColumn);

                    // Adicionar coluna do time perdedor (direita)
                    const losingTeamColumn = createTeamColumn(losingTeam, false);
                    existingDetails.appendChild(losingTeamColumn);

                    // Inserir a div de detalhes abaixo da currentMatchDiv
                    currentMatchDiv.insertAdjacentElement("afterend", existingDetails);

                    // Atualiza a seta para indicar que os detalhes estão expandidos
                    arrowIcon.innerHTML = "▲"; // Seta para cima (indica que pode recolher)
                }
            });
            await Promise.all(
                participants.map(async (participant) => {
                    if (participant.puuid === puuid) {
                        const gameMainRune = participant.perks.styles[0].selections[0].perk;
                        const gameSecondaryRune = participant.perks.styles[1].style;

                        // Find main and secondary rune icons
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

                        // Create rune icons
                        gameMainRuneIcon = document.createElement("img");
                        gameMainRuneIcon.src = `https://ddragon.canisback.com/img/${gameMainRuneIconPath}`;
                        gameMainRuneIcon.style.cssText = `
                            width: 25px; height: 25px; float: left; margin-top: 25px; margin-left: 6px; 
                            border: 2px solid #d4af37; border-radius: 15px;
                        `;

                        gameSecondaryRuneIcon = document.createElement("img");
                        gameSecondaryRuneIcon.src = `https://ddragon.canisback.com/img/${gameSecondaryRuneIconPath}`;
                        gameSecondaryRuneIcon.style.cssText = `
                            width: 15px; height: 15px; float: left; margin-top: 30px; margin-left: 2px; 
                            padding: 2px; border: 2px solid #d4af37; border-radius: 15px;
                        `;

                        currentMatchDiv.appendChild(gameMainRuneIcon);
                        currentMatchDiv.appendChild(gameSecondaryRuneIcon);

                        // Fetch and display items
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
                            const item = itemData.find((i) => i.id === itemId);
                            if (item) {
                                const itemIcon = document.createElement("img");
                                itemIcon.src = item.iconPath
                                    .toLowerCase()
                                    .replace("/lol-game-data/assets/", "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/");
                                itemIcon.style.cssText = `
                                    border: 2px solid #d4af37; border-radius: 15px; width: 35px; height: 35px; margin-top: 20px;
                                `;
                                currentMatchDiv.appendChild(itemIcon);
                            }
                        });



                        // Display champion icon
                        // Display champion icon
                        const championIcon = document.createElement("img");
                        championIcon.src = `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/${participant.championId}.png`;
                        championIcon.style.cssText = `
    width: 60px; height: 60px; float: left; margin-left: 8px; margin-top: 8px;
`;
                        currentMatchDiv.appendChild(championIcon);

                        // Container for game stats (win/loss, queue type, and KDA)
                        const gameStatsContainer = document.createElement("div");
                        gameStatsContainer.style.cssText = `
    float: left; margin-left: 10px; margin-top: 8px; display: flex; align-items: center; height: 60px;
`;
                        currentMatchDiv.appendChild(gameStatsContainer);

                        // Display win/loss
                        const gameStats = document.createElement("span");
                        gameStats.innerText = participant.win ? "Vitória" : "Derrota";
                        gameStats.style.cssText = `
    color: ${participant.win ? "#2DEB90" : "#ff5859"}; font-weight: bold; font-size: 16px; margin-right: 10px;
`;
                        gameStatsContainer.appendChild(gameStats);

                        // Display queue type
                        const gameQueueType = document.createElement("span");
                        gameQueueType.innerText = queueName;
                        gameQueueType.style.cssText = `
    color: #ccc; font-size: 12px; margin-right: 10px;
`;
                        gameStatsContainer.appendChild(gameQueueType);

                        // Display KDA
                        const kda = `${participant.kills} / ${participant.deaths} / ${participant.assists}`;
                        const kdaTxt = document.createElement("span");
                        kdaTxt.innerText = `${kda}`;
                        kdaTxt.style.cssText = `
    color: #ccc; font-size: 14px;
`;
                        gameStatsContainer.appendChild(kdaTxt);
                    }
                })
            );

        })
    );
}
