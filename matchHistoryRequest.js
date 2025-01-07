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

    // Process matches concurrently
    await Promise.all(
        matchHistory.map(async (match, matchIndex) => {
            const currentMatchDiv = document.getElementById(`match${matchIndex + 1}`);
            const participants = match.info.participants;

            // Process participants concurrently
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
                        const championIcon = document.createElement("img");
                        championIcon.src = `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/${participant.championId}.png`;
                        championIcon.style.cssText = `
                            width: 60px; height: 60px; float: left; margin-left: 8px; margin-top: 8px;
                        `;
                        currentMatchDiv.appendChild(championIcon);

                        // Display win/loss
                        const gameStats = document.createElement("span");
                        gameStats.innerText = participant.win ? "Vitória" : "Derrota";
                        gameStats.style.cssText = `
                            float: left; margin-top: 27px; margin-left: 6px; color: ${participant.win ? "#2DEB90" : "#ff5859"};
                        `;
                        currentMatchDiv.appendChild(gameStats);

                        // Display KDA
                        const kda = `${participant.kills} / ${participant.deaths} / ${participant.assists}`;
                        const kdaTxt = document.createElement("span");
                        kdaTxt.innerText = kda;
                        kdaTxt.style.cssText = `
                            float: left; margin-top: 27px; margin-left: 20px; margin-right: 20px;
                        `;
                        currentMatchDiv.appendChild(kdaTxt);
                    }
                })
            );
        })
    );
}
