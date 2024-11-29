export function matchHistoryRequest(
    riotId,
    puuid,
    region,
    regionSelect,
    inputContainer,
    versao,
    gameMainRuneIcon,
    gameSecondaryRuneIcon) {
    region = region.value;
    region = region.toLowerCase();
    riotId = riotId.replace(/\s/g, "");
    axios
        .get("http://localhost:4000/account", { params: { riotId } })
        .then((response) => {
            if (response.config.params.riotId != "") {
                puuid = response.data.puuid;
                regionSelect.style.marginLeft = "5px";
                inputContainer.style.top = "-50px";
                inputContainer.style.left = "376px";
                axios
                    .get("http://localhost:4000/matchIds", { params: { puuid } })
                    .then((response) => {
                        let matchI = []
                        for (let i = 0; i < 10; i++) {
                            matchI.push(response.data[i]);
                        }
                        axios
                            .get("http://localhost:4000/matchHistory", { params: { matches: matchI } })
                            .then((response) => {
                                var matchHistoryContainer = document.getElementById("matchHistoryContainer")
                                matchHistoryContainer.style.display = "grid";
                                for (let matchIndex = 0; matchIndex < response.data.length; matchIndex++) {
                                    const currentMatchDiv = document.getElementById(`match${matchIndex + 1}`);
                                    const currentParticipants = response.data[matchIndex].info.participants;

                                    (function (matchDiv, participants) {
                                        let runeData = [];
                                        let runeData2 = [];
                                        let runeData4 = [];
                                        for (let participantIndex = 0; participantIndex < participants.length; participantIndex++) {
                                            if (participants[participantIndex].puuid === puuid) {
                                                axios.get("http://ddragon.leagueoflegends.com/api/versions.json")
                                                    .then((response) => {
                                                        versao = response.data[0];
                                                        axios.get(`https://ddragon.leagueoflegends.com/cdn/${versao}/data/en_US/runesReforged.json`)
                                                            .then((response) => {
                                                                runeData = response.data[0];
                                                                gameMainRuneIcon = document.createElement("img");
                                                                gameSecondaryRuneIcon = document.createElement("img");
                                                                const gameMainRune = participants[participantIndex].perks.styles[0].selections[0].perk;
                                                                const gameSecondaryRune = participants[participantIndex].perks.styles[1].style;
                                                                for (let x = 0; x < 5; x++) {
                                                                    //conqueror so existe aqui(?)
                                                                    runeData2 = response.data[x].id
                                                                    for (let c = 0; c < 4; c++) {
                                                                        runeData4 = response.data[2].slots[0].runes[c].id
                                                                        if (gameMainRune == 8010) {
                                                                            runeData4 = response.data[2].slots[0].runes[3].icon

                                                                            gameMainRuneIcon.style.width = " 25px";
                                                                            gameMainRuneIcon.style.height = " 25px";
                                                                            gameMainRuneIcon.style.float = "left";
                                                                            gameMainRuneIcon.style.marginTop = " 25px";
                                                                            gameMainRuneIcon.style.marginLeft = "6px";
                                                                            gameMainRuneIcon.style.border = "2px solid #d4af37";

                                                                            gameMainRuneIcon.style.borderRadius = "15px";
                                                                            gameMainRuneIcon.src = `https://ddragon.canisback.com/img/${runeData4}`

                                                                        }
                                                                        if (gameSecondaryRune == runeData2) {
                                                                            runeData2 = response.data[x].icon
                                                                            gameSecondaryRuneIcon.style.width = " 15px";
                                                                            gameSecondaryRuneIcon.style.height = " 15px";
                                                                            gameSecondaryRuneIcon.style.float = "left";
                                                                            gameSecondaryRuneIcon.style.marginTop = " 30px";
                                                                            gameSecondaryRuneIcon.style.marginLeft = "2px";
                                                                            gameSecondaryRuneIcon.style.padding = "2px 2px 2px 2px";
                                                                            gameSecondaryRuneIcon.style.border = "2px solid #d4af37";
                                                                            gameSecondaryRuneIcon.style.borderRadius = "15px";
                                                                            gameSecondaryRuneIcon.src = `https://ddragon.canisback.com/img/${runeData2}`
                                                                            matchDiv.appendChild(gameMainRuneIcon);
                                                                            matchDiv.appendChild(gameSecondaryRuneIcon);
                                                                        }
                                                                    }
                                                                    for (let y = 0; y < 3; y++) {
                                                                        runeData = response.data[x].slots[0].runes[y].id
                                                                        if (gameMainRune == runeData) {
                                                                            runeData = response.data[x].slots[0].runes[y].icon
                                                                            gameMainRuneIcon.style.width = " 25px";
                                                                            gameMainRuneIcon.style.height = " 25px";
                                                                            gameMainRuneIcon.style.float = "left";
                                                                            gameMainRuneIcon.style.marginTop = " 25px";
                                                                            gameMainRuneIcon.style.marginLeft = "6px";

                                                                            gameMainRuneIcon.style.border = "2px solid #d4af37";
                                                                            gameMainRuneIcon.style.borderRadius = "15px";
                                                                            gameMainRuneIcon.src = `https://ddragon.canisback.com/img/${runeData}`

                                                                        }
                                                                        if (gameSecondaryRune == runeData2) {
                                                                            runeData2 = response.data[x].icon
                                                                            gameSecondaryRuneIcon.style.width = " 15px";
                                                                            gameSecondaryRuneIcon.style.height = " 15px";
                                                                            gameSecondaryRuneIcon.style.float = "left";
                                                                            gameSecondaryRuneIcon.style.marginTop = " 30px";
                                                                            gameSecondaryRuneIcon.style.marginLeft = "2px";
                                                                            gameSecondaryRuneIcon.style.padding = "2px 2px 2px 2px";
                                                                            gameSecondaryRuneIcon.style.border = "2px solid #d4af37";
                                                                            gameSecondaryRuneIcon.style.borderRadius = "15px";
                                                                            gameSecondaryRuneIcon.src = `https://ddragon.canisback.com/img/${runeData2}`
                                                                            matchDiv.appendChild(gameMainRuneIcon);
                                                                            matchDiv.appendChild(gameSecondaryRuneIcon);
                                                                        }
                                                                    }
                                                                }
                                                            })
                                                    })
                                                axios.get(`https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/items.json`)

                                                    .then((response) => {
                                                        var itemData = response.data;
                                                        //console.log(itemData)
                                                        const matchItemIcons = Array.from({ length: 6 }, () => document.createElement('img'));
                                                        const pick = (object, keys) => keys.reduce((obj, key) => {
                                                            if (object && object.hasOwnProperty(key)) {
                                                                obj[key] = object[key];
                                                            }
                                                            return obj;
                                                        }, {});

                                                        const matchItems = Object.values(pick(participants[participantIndex], [
                                                            'item0',
                                                            'item1',
                                                            'item2',
                                                            'item3',
                                                            'item4',
                                                            'item5',
                                                            'item6',
                                                        ]));
                                                        var itemFound = [];
                                                        var itemIconPath = [];
                                                        for (let x = 0; x < 6; x++) {
                                                            itemFound = itemData.find(item => item.id == matchItems[x])
                                                            if (itemFound) {
                                                                itemIconPath = itemFound.iconPath
                                                                for (let x = 0; x < 6; x++) {
                                                                    itemFound = itemData.find(item => item.id == matchItems[x])
                                                                    if (itemFound) {
                                                                        itemIconPath = itemFound.iconPath
                                                                        itemIconPath = itemIconPath.toLowerCase().replace("/lol-game-data/assets/", "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/")
                                                                        switch (x) {
                                                                            case 0:
                                                                                matchItemIcons[0].src = itemIconPath
                                                                                break;
                                                                            case 1:
                                                                                matchItemIcons[1].src = itemIconPath
                                                                                break;
                                                                            case 2:
                                                                                matchItemIcons[2].src = itemIconPath
                                                                                break;
                                                                            case 3:
                                                                                matchItemIcons[3].src = itemIconPath
                                                                                break;
                                                                            case 4:
                                                                                matchItemIcons[4].src = itemIconPath
                                                                                break;
                                                                            case 5:
                                                                                matchItemIcons[5].src = itemIconPath
                                                                                break;
                                                                            case 6:
                                                                                matchItemIcons[6].src = itemIconPath
                                                                                break;
                                                                        }

                                                                        matchItemIcons.forEach(icon => {
                                                                            if (icon.src) {
                                                                                icon.style.border = "2px solid #d4af37";
                                                                                icon.style.borderRadius = "15px";
                                                                                icon.style.width = "35px";
                                                                                icon.style.height = "35px";
                                                                                icon.style.marginTop = "20px";
                                                                            }
                                                                        });
                                                                        matchItemIcons.forEach(icon => matchDiv.appendChild(icon));
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    })
                                                const gameStat = response.data[matchIndex].info.participants[participantIndex].win;
                                                // Create gameStats span element
                                                const gameStats = document.createElement("span");
                                                gameStats.style.float = "left";
                                                gameStats.style.marginTop = " 27px";
                                                gameStats.style.marginLeft = "6px";
                                                // Map to replace "true" with "Vitória" and "false" with "Derrota"
                                                const gameStatText = {
                                                    true: "Vitória",
                                                    false: "Derrota"
                                                };
                                                if (gameStatText[gameStat] == "Vitória") {
                                                    gameStats.style.color = "#2DEB90"
                                                }
                                                else if (gameStatText[gameStat] == "Derrota") {
                                                    gameStats.style.color = "#ff5859"
                                                }
                                                // Set the innerText of gameStats based on gameStat value
                                                gameStats.innerText = gameStatText[gameStat];

                                                // Create img element for champion icon
                                                const championId = participants[participantIndex].championId;
                                                const championIconUrl = `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/${championId}.png`;
                                                const imgElement = document.createElement("img");
                                                imgElement.src = championIconUrl;
                                                imgElement.style.width = "60px";
                                                imgElement.style.height = "60px";
                                                imgElement.style.float = 'left';
                                                imgElement.style.marginLeft = '8px';
                                                imgElement.style.marginTop = "8px";

                                                // Append img and gameStats elements to matchDiv
                                                matchDiv.appendChild(imgElement);
                                                matchDiv.appendChild(gameStats);
                                                var kills = participants[participantIndex].kills
                                                var deaths = participants[participantIndex].deaths
                                                var assists = participants[participantIndex].assists
                                                var kda = `${kills} / ${deaths} / ${assists}`
                                                var kdaTxt = document.createElement("span");
                                                kdaTxt.innerHTML = kda;
                                                kdaTxt.style.marginTop = " 27px";
                                                kdaTxt.style.float = "left";
                                                kdaTxt.style.marginLeft = "20px";
                                                kdaTxt.style.marginRight = "20px";

                                                matchDiv.appendChild(kdaTxt);
                                            }
                                        }
                                    })(currentMatchDiv, currentParticipants);
                                    let allPuuIds = response.data[0].metadata.participants;
                                    axios
                                        .get("http://localhost:4000/PuuidToName", {
                                            params: { Ids: allPuuIds },
                                        })
                                        .then((response) => {
                                            //console.log(response.data)
                                        });
                                }
                            });
                    });
            }
        })
}