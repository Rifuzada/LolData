function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
function remove() {
  var div = document.getElementById('containerContainer');
  var div1 = document.getElementById("icon");
  div1.style.display = "none"
  while (div.firstChild) {
    div.removeChild(div.firstChild);
  }
}
function show() {
  var div1 = document.getElementById("icon");
  div1.style.display = "flex"
}
function allRequest(puuid, versao, region, img, container, btn, inputContainer, riotId, regionSelect, rankedSoloIcon, containerRanked, rankedStats, containerRankedFlex, rankedFlexData, rankedFlexIcon, containerContainer, containerMasteryI) {
  region = region.value;
  region = region.toLowerCase();
  axios
    .get("http://localhost:4000/account", { params: { riotId } })
    .then((response) => {
      if (response.config.params.riotId != "") {
        puuid = response.data.puuid;
        regionSelect.style.marginLeft = "5px";
        btn.style.top = "-52vh";
        btn.style.left = "550px";
        btn.style.marginLeft = "2px";
        inputContainer.style.top = "-46vh";
        inputContainer.style.left = "300px";
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
                })
              });
            axios
              .get("http://localhost:4000/ranked", {
                params: { sumID, region },
              })
              .then((ranked) => {
                console.log(ranked.data)
                if (ranked.data[0]?.queueType == "CHERRY") {
                  ranked.data.splice(0, 1);
                  noArena()
                } else if (ranked.data[1]?.queueType == "CHERRY") {
                  ranked.data.splice(1, 1);
                  noArena()
                }
                else if (ranked.data[0] == undefined && ranked.data[1] == undefined) {
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
                            queueSolo = ranked.data[i].queueType
                              .replace("RANKED_SOLO_5x5", "Ranqueada Solo/Duo: ");
                            ranked.data[i].tier =
                              ranked.data[i].tier.toLowerCase();
                            ranked.data[i].tier = ranked.data[i].tier.replace("ferro", "iron");
                            ranked.data[i].tier = ranked.data[i].tier.replace("prata", "silver");
                            ranked.data[i].tier = ranked.data[i].tier.replace("ouro", "gold");
                            ranked.data[i].tier = ranked.data[i].tier.replace("platina", "platinum");
                            ranked.data[i].tier = ranked.data[i].tier.replace("esmeralda", "emerald");
                            ranked.data[i].tier = ranked.data[i].tier.replace("diamante", "diamond");
                            ranked.data[i].tier = ranked.data[i].tier.replace("mestre", "master");
                            ranked.data[i].tier = ranked.data[i].tier.replace("grão-mestre", "grandmaster");
                            ranked.data[i].tier = ranked.data[i].tier.replace("desafiante", "challenger");
                            let rankedIng = ranked.data[i].tier
                            console.log(rankedIng)
                            rankedSoloIcon.src = `https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/images/ranked-mini-crests/${rankedIng}.svg`;
                            rankedSoloIcon.style.display = "flex";
                            rankedSoloIcon.style.width = "68px";
                            rankedSoloIcon.style.height = "68px";
                            containerRanked.style.display = "block";
                            let winrateSoloq = ranked.data[i].wins / (ranked.data[i].wins + ranked.data[i].losses) * 100
                            ranked.data[i].tier = ranked.data[i].tier.replace("iron", "Ferro");
                            ranked.data[i].tier = ranked.data[i].tier.replace("silver", "Prata");
                            ranked.data[i].tier = ranked.data[i].tier.replace("gold", "Ouro");
                            ranked.data[i].tier = ranked.data[i].tier.replace("platinum", "Platina");
                            ranked.data[i].tier = ranked.data[i].tier.replace("emerald", "Esmeralda");
                            ranked.data[i].tier = ranked.data[i].tier.replace("diamond", "Diamante");
                            ranked.data[i].tier = ranked.data[i].tier.replace("master", "Mestre");
                            ranked.data[i].tier = ranked.data[i].tier.replace("grandmaster", "Grão-Mestre");
                            ranked.data[i].tier = ranked.data[i].tier.replace("challenger", "Desafiante");
                            rankedStats.innerHTML = `${queueSolo} ${ranked.data[i].tier} ${ranked.data[i].rank}<br>Vitorias: ${ranked.data[i].wins} <br>Derrotas: ${ranked.data[i].losses}<br>Winrate: ${winrateSoloq.toFixed()}%`;
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
                                    break
                                }
                              }
                            }
                            else {
                              if (ranked.data[i] == undefined) {
                                switch (ranked.data[i]) {
                                  case undefined:
                                    rankedFlexIcon.src = `https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/images/ranked-mini-crests/unranked.png`;
                                    rankedFlexIcon.style.display = "flex";
                                    rankedFlexIcon.style.width = "68px";
                                    rankedFlexIcon.style.height = "68px";
                                    containerRankedFlex.style.display = "block";
                                    rankedFlexData.innerHTML = "Unranked";
                                    break
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
                            queueFlex = ranked.data[i].queueType
                              .replace("RANKED_FLEX_SR", "Ranqueada Flexiviel: ")
                            ranked.data[i].tier =
                              ranked.data[i].tier.toLowerCase();
                            let rankedIng = ranked.data[i].tier
                            ranked.data[i].tier = ranked.data[i].tier.replace("ferro", "iron");
                            ranked.data[i].tier = ranked.data[i].tier.replace("prata", "silver");
                            ranked.data[i].tier = ranked.data[i].tier.replace("ouro", "gold");
                            ranked.data[i].tier = ranked.data[i].tier.replace("platina", "platinum");
                            ranked.data[i].tier = ranked.data[i].tier.replace("esmeralda", "emerald");
                            ranked.data[i].tier = ranked.data[i].tier.replace("diamante", "diamond");
                            ranked.data[i].tier = ranked.data[i].tier.replace("mestre", "master");
                            ranked.data[i].tier = ranked.data[i].tier.replace("grão-mestre", "grandmaster");
                            ranked.data[i].tier = ranked.data[i].tier.replace("desafiante", "challenger");
                            rankedFlexIcon.src = `https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/images/ranked-mini-crests/${rankedIng}.svg`;
                            ranked.data[i].tier = ranked.data[i].tier.replace("iron", "Ferro");
                            ranked.data[i].tier = ranked.data[i].tier.replace("silver", "Prata");
                            ranked.data[i].tier = ranked.data[i].tier.replace("gold", "Ouro");
                            ranked.data[i].tier = ranked.data[i].tier.replace("platinum", "Platina");
                            ranked.data[i].tier = ranked.data[i].tier.replace("emerald", "Esmeralda");
                            ranked.data[i].tier = ranked.data[i].tier.replace("diamond", "Diamante");
                            ranked.data[i].tier = ranked.data[i].tier.replace("master", "Mestre");
                            ranked.data[i].tier = ranked.data[i].tier.replace("grandmaster", "Grão-Mestre");
                            ranked.data[i].tier = ranked.data[i].tier.replace("challenger", "Desafiante");
                            rankedFlexIcon.style.display = "flex";
                            rankedFlexIcon.style.width = "68px";
                            rankedFlexIcon.style.height = "68px";
                            containerRankedFlex.style.display = "block";
                            let winrateFlex = ranked.data[i].wins / (ranked.data[i].wins + ranked.data[i].losses) * 100

                            rankedFlexData.innerHTML = `${queueSolo} ${ranked.data[i].tier} ${ranked.data[i].rank}<br>Vitorias: ${ranked.data[i].wins} <br>Derrotas: ${ranked.data[i].losses}<br>Winrate: ${winrateFlex.toFixed()}%`;
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
                                    break
                                }
                              }
                            }
                            else {
                              if (ranked.data[i] == undefined) {
                                switch (ranked.data[i]) {
                                  case undefined:
                                    rankedSoloIcon.src = `https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/images/ranked-mini-crests/unranked.png`;
                                    rankedSoloIcon.style.display = "flex";
                                    rankedSoloIcon.style.width = "68px";
                                    rankedSoloIcon.style.height = "68px";
                                    containerRanked.style.display = "block";
                                    rankedStats.innerHTML = "Unranked";
                                    break
                                }
                              }
                            }
                        }
                      }
                    }
                  }
                }
                sleep(200).then(() => {
                  noArena()
                })
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
                    `https://ddragon.leagueoflegends.com/cdn/${versao}/data/en_US/champion.json`,
                  )
                  .then((nomes) => {
                    for (let i = 0; i < arrayLength; i++) {
                      arrayIDS.push(maestrias.data[i].championId);
                    }
                    const allNames = Object.values(nomes.data.data);

                    for (const id of arrayIDS) {
                      const champion = allNames.find(
                        (obj) => obj.key == id,
                      );
                      const championName = champion.name;
                      arrayNOMES.push(championName);
                    }
                    let mastery1 = document.createElement("img");
                    let mastery2 = document.createElement("img");
                    let mastery3 = document.createElement("img");
                    let mastery4 = document.createElement("img");
                    let mastery5 = document.createElement("img");
                    let containerMasteries1 = document.createElement("div");
                    containerMasteries1.setAttribute("id", "containerMasteries1")
                    let containerMasteries2 = document.createElement("div");
                    containerMasteries2.setAttribute("id", "containerMasteries2")
                    let containerMasteries3 = document.createElement("div");
                    containerMasteries3.setAttribute("id", "containerMasteries3")
                    let containerMasteries4 = document.createElement("div");
                    containerMasteries4.setAttribute("id", "containerMasteries4")
                    let containerMasteries5 = document.createElement("div");
                    containerMasteries5.setAttribute("id", "containerMasteries5")
                    let texto1 = document.createElement("span")
                    let texto2 = document.createElement("span")
                    let texto3 = document.createElement("span")
                    let texto4 = document.createElement("span")
                    let texto5 = document.createElement("span")

                    function maestriaTela() {
                      if (containerMasteryI.length == 0) {
                        let maestriasI = [mastery1, mastery2, mastery3, mastery4, mastery5]
                        containerMasteryI = [containerMasteries1, containerMasteries2, containerMasteries3, containerMasteries4, containerMasteries5]
                        let textoI = [texto1, texto2, texto3, texto4, texto5]
                        for (let i = 0; i < 5; i++) {

                          if (maestrias.data[i].championLevel >= 10) {
                            containerContainer.appendChild(containerMasteryI[i])
                            textoI[i].innerHTML = `<br>Campeão: ${arrayNOMES[i]}<br>${formatter.format(maestrias.data[i].championPoints)} pontos de maestria<br>` +
                              `nível: ${maestrias.data[i].championLevel}`
                            maestriasI[i].src = `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/${arrayIDS[i]}.png`
                            //`https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-shared-components/global/default/mastery-10.png`;
                            containerMasteryI[i].appendChild(maestriasI[i]);
                            containerMasteryI[i].appendChild(textoI[i]);
                            containerMasteryI[i].style.display = ("block")
                          }
                          else if (maestrias.data[i].championLevel < 10) {
                            containerContainer.appendChild(containerMasteryI[i])
                            textoI[i].innerHTML = `<br>Campeão: ${arrayNOMES[i]}<br>${formatter.format(maestrias.data[i].championPoints)} pontos de maestria<br>` +
                              `nível: ${maestrias.data[i].championLevel}`
                            maestriasI[i].src = `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/${arrayIDS[i]}.png`
                            //`https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-shared-components/global/default/mastery-${maestrias.data[i].championLevel}.png`;
                            containerMasteryI[i].appendChild(maestriasI[i]);
                            containerMasteryI[i].appendChild(textoI[i]);
                            containerMasteryI[i].style.display = ("block")
                          }
                        }
                      }
                    }
                    if (containerMasteryI.length == 0) {
                      sleep(250).then(() => {
                        maestriaTela()
                      })
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
