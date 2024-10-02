function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function remove() {
  // Limpa o container de perfil
  var div1 = document.getElementById("icon");
  var div2 = document.getElementById("containerContainer");

  // Oculta o container do perfil
  div1.style.display = "none";

  // Remove as crianças do container (maestrias, etc.)
  while (div2.firstChild) {
    div2.removeChild(div2.firstChild);
  }

  // Limpa os dados do histórico de partidas, mas mantém a estrutura para receber os novos dados
  var matchHistoryContainer = document.getElementById("matchHistoryContainer");
  var matches = document.getElementsByClassName("matches");
  for (let i = 0; i < matches.length; i++) {
    matches[i].innerHTML = ""; // Limpa o conteúdo de cada partida sem remover a estrutura
  }
}

function show() {
  var div1 = document.getElementById("icon");
  div1.style.display = "flex";
}
function allRequest(
  puuid,
  versao,
  region,
  img,
  container,
  btn,
  inputContainer,
  riotId,
  regionSelect,
  rankedSoloIcon,
  containerRanked,
  rankedStats,
  containerRankedFlex,
  rankedFlexData,
  rankedFlexIcon,
  containerContainer,
  containerMasteryI,
  gameMainRuneIcon,
  gameSecondaryRuneIcon
) {
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
          .get("http://localhost:4000/profile", {
            params: { puuid, region },
          })
          .then((response) => {
            var iconID = response.data.profileIconId;
            var Level = response.data.summonerLevel;
            var sumID = response.data.id;
            axios
              .get("http://ddragon.leagueoflegends.com/api/versions.json")
              .then((response) => {
                versao = response.data[0];
                img.src = `https://ddragon.leagueoflegends.com/cdn/${versao}/img/profileicon/${iconID}.png`;
                sleep(300).then(() => {
                  img.style.display = "block";
                  container.style.display = "block";
                  nickName.innerHTML = riotId;
                  Lvl.innerHTML = "Level: " + Level;
                });
              });
            axios
              .get("http://localhost:4000/ranked", {
                params: { sumID, region },
              })
              .then((ranked) => {
                if (ranked.data[0]?.queueType == "CHERRY") {
                  ranked.data.splice(0, 1);
                  noArena();
                } else if (ranked.data[1]?.queueType == "CHERRY") {
                  ranked.data.splice(1, 1);
                  noArena();
                } else if (
                  ranked.data[0] == undefined &&
                  ranked.data[1] == undefined
                ) {
                  rankedSoloIcon.src = `https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/images/ranked-mini-crests/unranked.png`;
                  rankedSoloIcon.style.display = "flex";
                  rankedSoloIcon.style.width = "68px";
                  rankedSoloIcon.style.height = "68px";
                  containerRanked.style.display = "block";
                  rankedStats.innerHTML = "Unranked";
                  rankedFlexIcon.src = `https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/images/ranked-mini-crests/unranked.png`;
                  rankedFlexIcon.style.display = "flex";
                  rankedFlexIcon.style.width = "68px";
                  rankedFlexIcon.style.height = "68px";
                  containerRankedFlex.style.display = "block";
                  rankedFlexData.innerHTML = "Unranked";
                }

                function noArena() {
                  if (
                    ranked.data[0]?.queueType == "RANKED_SOLO_5x5" ||
                    ranked.data[1]?.queueType == "RANKED_SOLO_5x5" ||
                    ranked.data[0]?.queueType == "RANKED_FLEX_SR" ||
                    ranked.data[1]?.queueType == "RANKED_FLEX_SR" ||
                    ranked.data[0] == undefined ||
                    ranked.data[1] == undefined ||
                    ranked.data1[2] == undefined ||
                    ranked.data == ""
                  ) {
                    for (let i = 0; i <= 2; i++) {
                      if (ranked.data[i] != undefined) {
                        switch (ranked.data[i].queueType) {
                          case "RANKED_SOLO_5x5":
                            var queueSolo = ranked.data[i].queueType;
                            queueSolo = ranked.data[i].queueType.replace(
                              "RANKED_SOLO_5x5",
                              "Ranqueada Solo/Duo: "
                            );
                            ranked.data[i].tier =
                              ranked.data[i].tier.toLowerCase();
                            ranked.data[i].tier = ranked.data[i].tier.replace(
                              "ferro",
                              "iron"
                            );
                            ranked.data[i].tier = ranked.data[i].tier.replace(
                              "prata",
                              "silver"
                            );
                            ranked.data[i].tier = ranked.data[i].tier.replace(
                              "ouro",
                              "gold"
                            );
                            ranked.data[i].tier = ranked.data[i].tier.replace(
                              "platina",
                              "platinum"
                            );
                            ranked.data[i].tier = ranked.data[i].tier.replace(
                              "esmeralda",
                              "emerald"
                            );
                            ranked.data[i].tier = ranked.data[i].tier.replace(
                              "diamante",
                              "diamond"
                            );
                            ranked.data[i].tier = ranked.data[i].tier.replace(
                              "mestre",
                              "master"
                            );
                            ranked.data[i].tier = ranked.data[i].tier.replace(
                              "grão-mestre",
                              "grandmaster"
                            );
                            ranked.data[i].tier = ranked.data[i].tier.replace(
                              "desafiante",
                              "challenger"
                            );
                            let rankedIng = ranked.data[i].tier;
                            rankedSoloIcon.src = `https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/images/ranked-mini-crests/${rankedIng}.svg`;
                            rankedSoloIcon.style.display = "flex";
                            rankedSoloIcon.style.width = "68px";
                            rankedSoloIcon.style.height = "68px";
                            containerRanked.style.display = "block";
                            let winrateSoloq =
                              (ranked.data[i].wins /
                                (ranked.data[i].wins + ranked.data[i].losses)) *
                              100;
                            ranked.data[i].tier = ranked.data[i].tier.replace(
                              "iron",
                              "Ferro"
                            );
                            ranked.data[i].tier = ranked.data[i].tier.replace(
                              "silver",
                              "Prata"
                            );
                            ranked.data[i].tier = ranked.data[i].tier.replace(
                              "gold",
                              "Ouro"
                            );
                            ranked.data[i].tier = ranked.data[i].tier.replace(
                              "platinum",
                              "Platina"
                            );
                            ranked.data[i].tier = ranked.data[i].tier.replace(
                              "emerald",
                              "Esmeralda"
                            );
                            ranked.data[i].tier = ranked.data[i].tier.replace(
                              "diamond",
                              "Diamante"
                            );
                            ranked.data[i].tier = ranked.data[i].tier.replace(
                              "master",
                              "Mestre"
                            );
                            ranked.data[i].tier = ranked.data[i].tier.replace(
                              "grandmaster",
                              "Grão-Mestre"
                            );
                            ranked.data[i].tier = ranked.data[i].tier.replace(
                              "challenger",
                              "Desafiante"
                            );
                            rankedStats.innerHTML = `${queueSolo} ${ranked.data[i].tier
                              } ${ranked.data[i].rank}<br>Vitorias: ${ranked.data[i].wins
                              } <br>Derrotas: ${ranked.data[i].losses
                              } - Winrate: ${winrateSoloq.toFixed()}%`;
                            if (i == 0) {
                              if (ranked.data[i + 1] == undefined) {
                                switch (ranked.data[i + 1]) {
                                  case undefined:
                                    rankedFlexIcon.src = `https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/images/ranked-mini-crests/unranked.png`;
                                    rankedFlexIcon.style.display = "flex";
                                    rankedFlexIcon.style.width = "68px";
                                    rankedFlexIcon.style.height = "68px";
                                    containerRankedFlex.style.display = "block";
                                    rankedFlexData.innerHTML = "Unranked";
                                    break;
                                }
                              }
                            } else {
                              if (ranked.data[i] == undefined) {
                                switch (ranked.data[i]) {
                                  case undefined:
                                    rankedFlexIcon.src = `https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/images/ranked-mini-crests/unranked.png`;
                                    rankedFlexIcon.style.display = "flex";
                                    rankedFlexIcon.style.width = "68px";
                                    rankedFlexIcon.style.height = "68px";
                                    containerRankedFlex.style.display = "block";
                                    rankedFlexData.innerHTML = "Unranked";
                                    break;
                                }
                              }
                            }
                        }
                      }
                    }
                    for (let i = 0; i <= 2; i++) {
                      if (ranked.data[i] != undefined) {
                        switch (ranked.data[i].queueType) {
                          case "RANKED_FLEX_SR":
                            var queueFlex = ranked.data[i].queueType;
                            queueFlex = ranked.data[i].queueType.replace(
                              "RANKED_FLEX_SR",
                              "Ranqueada Flexível: "
                            );
                            ranked.data[i].tier =
                              ranked.data[i].tier.toLowerCase();
                            let rankedIng = ranked.data[i].tier;
                            ranked.data[i].tier = ranked.data[i].tier.replace(
                              "ferro",
                              "iron"
                            );
                            ranked.data[i].tier = ranked.data[i].tier.replace(
                              "prata",
                              "silver"
                            );
                            ranked.data[i].tier = ranked.data[i].tier.replace(
                              "ouro",
                              "gold"
                            );
                            ranked.data[i].tier = ranked.data[i].tier.replace(
                              "platina",
                              "platinum"
                            );
                            ranked.data[i].tier = ranked.data[i].tier.replace(
                              "esmeralda",
                              "emerald"
                            );
                            ranked.data[i].tier = ranked.data[i].tier.replace(
                              "diamante",
                              "diamond"
                            );
                            ranked.data[i].tier = ranked.data[i].tier.replace(
                              "mestre",
                              "master"
                            );
                            ranked.data[i].tier = ranked.data[i].tier.replace(
                              "grão-mestre",
                              "grandmaster"
                            );
                            ranked.data[i].tier = ranked.data[i].tier.replace(
                              "desafiante",
                              "challenger"
                            );
                            rankedFlexIcon.src = `https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/images/ranked-mini-crests/${rankedIng}.svg`;
                            ranked.data[i].tier = ranked.data[i].tier.replace(
                              "iron",
                              "Ferro"
                            );
                            ranked.data[i].tier = ranked.data[i].tier.replace(
                              "silver",
                              "Prata"
                            );
                            ranked.data[i].tier = ranked.data[i].tier.replace(
                              "gold",
                              "Ouro"
                            );
                            ranked.data[i].tier = ranked.data[i].tier.replace(
                              "platinum",
                              "Platina"
                            );
                            ranked.data[i].tier = ranked.data[i].tier.replace(
                              "emerald",
                              "Esmeralda"
                            );
                            ranked.data[i].tier = ranked.data[i].tier.replace(
                              "diamond",
                              "Diamante"
                            );
                            ranked.data[i].tier = ranked.data[i].tier.replace(
                              "master",
                              "Mestre"
                            );
                            ranked.data[i].tier = ranked.data[i].tier.replace(
                              "grandmaster",
                              "Grão-Mestre"
                            );
                            ranked.data[i].tier = ranked.data[i].tier.replace(
                              "challenger",
                              "Desafiante"
                            );
                            rankedFlexIcon.style.display = "flex";
                            rankedFlexIcon.style.width = "68px";
                            rankedFlexIcon.style.height = "68px";
                            containerRankedFlex.style.display = "block";
                            let winrateFlex =
                              (ranked.data[i].wins /
                                (ranked.data[i].wins + ranked.data[i].losses)) *
                              100;

                            rankedFlexData.innerHTML = `${queueFlex} ${ranked.data[i].tier
                              } ${ranked.data[i].rank}<br>Vitorias: ${ranked.data[i].wins
                              } <br>Derrotas: ${ranked.data[i].losses
                              } - Winrate: ${winrateFlex.toFixed()}%`;
                            if (i == 0) {
                              if (ranked.data[i + 1] == undefined) {
                                switch (ranked.data[i + 1]) {
                                  case undefined:
                                    rankedSoloIcon.src = `https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/images/ranked-mini-crests/unranked.png`;
                                    rankedSoloIcon.style.display = "flex";
                                    rankedSoloIcon.style.width = "68px";
                                    rankedSoloIcon.style.height = "68px";
                                    containerRanked.style.display = "block";
                                    rankedStats.innerHTML = "Unranked";
                                    break;
                                }
                              }
                            } else {
                              if (ranked.data[i] == undefined) {
                                switch (ranked.data[i]) {
                                  case undefined:
                                    rankedSoloIcon.src = `https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/images/ranked-mini-crests/unranked.png`;
                                    rankedSoloIcon.style.display = "flex";
                                    rankedSoloIcon.style.width = "68px";
                                    rankedSoloIcon.style.height = "68px";
                                    containerRanked.style.display = "block";
                                    rankedStats.innerHTML = "Unranked";
                                    break;
                                }
                              }
                            }
                        }
                      }
                    }
                  }
                }
                sleep(200).then(() => {
                  noArena();
                });
              });
          });
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
                    for (let participantIndex = 0; participantIndex < participants.length; participantIndex++) {
                      if (participants[participantIndex].puuid === puuid) {
                        axios.get("http://ddragon.leagueoflegends.com/api/versions.json")
                          .then((response) => {
                            versao = response.data[0];
                            axios.get(`https://ddragon.leagueoflegends.com/cdn/${versao}/data/en_US/runesReforged.json`)
                              .then((response) => {
                                let runeData = response.data[0];
                                gameMainRuneIcon = document.createElement("img");
                                gameSecondaryRuneIcon = document.createElement("img");
                                const gameMainRune = participants[participantIndex].perks.styles[0].selections[0].perk;
                                const gameSecondaryRune = participants[participantIndex].perks.styles[1].style;
                                for (let x = 0; x < 5; x++) {
                                  //conqueror so existe aqui(?)
                                  let runeData2 = response.data[x].id
                                  for (let c = 0; c < 4; c++) {
                                    let runeData4 = response.data[2].slots[0].runes[c].id
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
                            for (let x = 0; x < 6; x++) {
                              var itemFound = itemData.find(item => item.id == matchItems[x])
                              if (itemFound) {
                                var itemIconPath = itemFound.iconPath
                                for (let x = 0; x < 6; x++) {
                                  var itemFound = itemData.find(item => item.id == matchItems[x])
                                  if (itemFound) {
                                    var itemIconPath = itemFound.iconPath
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
        axios
          .get("http://localhost:4000/masteries", {
            params: { puuid, region },
          })
          .then((maestrias) => {
            var formatter = new Intl.NumberFormat("pt-BR");
            let arrayIDS = [];
            let arrayNOMES = [];
            var maestriaData = Object.keys(maestrias.data);
            let arrayLength = maestriaData.length;
            axios
              .get("http://ddragon.leagueoflegends.com/api/versions.json")
              .then((response) => {
                versao = response.data[0];
                axios
                  .get(
                    `https://ddragon.leagueoflegends.com/cdn/${versao}/data/en_US/champion.json`
                  )
                  .then((nomes) => {
                    for (let i = 0; i < arrayLength; i++) {
                      arrayIDS.push(maestrias.data[i].championId);
                    }
                    var allNames = Object.values(nomes.data.data);

                    for (var id of arrayIDS) {
                      var champion = allNames.find((obj) => obj.key == id);
                      var championName = champion.name;
                      arrayNOMES.push(championName);
                    }
                    let mastery1 = document.createElement("img");
                    let mastery2 = document.createElement("img");
                    let mastery3 = document.createElement("img");
                    let mastery4 = document.createElement("img");
                    let mastery5 = document.createElement("img");
                    let containerMasteries1 = document.createElement("div");
                    containerMasteries1.setAttribute(
                      "id",
                      "containerMasteries1"
                    );
                    let containerMasteries2 = document.createElement("div");
                    containerMasteries2.setAttribute(
                      "id",
                      "containerMasteries2"
                    );
                    let containerMasteries3 = document.createElement("div");
                    containerMasteries3.setAttribute(
                      "id",
                      "containerMasteries3"
                    );
                    let containerMasteries4 = document.createElement("div");
                    containerMasteries4.setAttribute(
                      "id",
                      "containerMasteries4"
                    );
                    let containerMasteries5 = document.createElement("div");
                    containerMasteries5.setAttribute(
                      "id",
                      "containerMasteries5"
                    );
                    let texto1 = document.createElement("span");
                    let texto2 = document.createElement("span");
                    let texto3 = document.createElement("span");
                    let texto4 = document.createElement("span");
                    let texto5 = document.createElement("span");

                    function maestriaTela() {
                      if (containerMasteryI.length == 0) {
                        let maestriasI = [
                          mastery1,
                          mastery2,
                          mastery3,
                          mastery4,
                          mastery5,
                        ];
                        containerMasteryI = [
                          containerMasteries1,
                          containerMasteries2,
                          containerMasteries3,
                          containerMasteries4,
                          containerMasteries5,
                        ];
                        let textoI = [texto1, texto2, texto3, texto4, texto5];
                        for (let i = 0; i < 5; i++) {
                          if (maestrias.data[i].championLevel >= 10) {
                            containerContainer.appendChild(
                              containerMasteryI[i]
                            );
                            textoI[i].innerHTML =
                              `<br>Campeão: ${arrayNOMES[i]
                              }<br>${formatter.format(
                                maestrias.data[i].championPoints
                              )} pontos de maestria<br>` +
                              `nível: ${maestrias.data[i].championLevel}`;
                            maestriasI[
                              i
                            ].src = `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/${arrayIDS[i]}.png`;
                            containerMasteryI[i].appendChild(maestriasI[i]);
                            containerMasteryI[i].appendChild(textoI[i]);
                            containerMasteryI[i].style.display = "block";
                          } else if (maestrias.data[i].championLevel < 10) {
                            containerContainer.appendChild(
                              containerMasteryI[i]
                            );
                            textoI[i].innerHTML =
                              `<br>Campeão: ${arrayNOMES[i]
                              }<br>${formatter.format(
                                maestrias.data[i].championPoints
                              )} pontos de maestria<br>` +
                              `nível: ${maestrias.data[i].championLevel}`;
                            maestriasI[
                              i
                            ].src = `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/${arrayIDS[i]}.png`;
                            containerMasteryI[i].appendChild(maestriasI[i]);
                            containerMasteryI[i].appendChild(textoI[i]);
                            containerMasteryI[i].style.display = "block";
                          }
                        }
                      }
                    }
                    if (containerMasteryI.length == 0) {
                      sleep(250).then(() => {
                        maestriaTela();
                      });
                    }
                  });
              });
          })
          .catch(function (error) {
            if (error.response) {
              console.error("Erro ao chamar a API de Masteries:", error);
            }
          });
      }
    });
}
export { allRequest, remove, sleep, show };