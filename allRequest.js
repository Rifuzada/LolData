function allRequest(puuid, versao, region, img, title, container, btn, inputContainer, riotId, regionSelect, rankedSoloIcon, containerRanked, rankedStats, containerRankedFlex, rankedFlexData, rankedFlexIcon, containerContainer, containerMasteryI) {
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
                img.style.display = "block";
                title.style.display = "none";
                container.style.display = "block";
                nickName.innerHTML = riotId;
                Lvl.innerHTML = "Level: " + Level;
              });
            axios
              .get("http://localhost:4000/ranked", {
                params: { sumID, region },
              })
              .then((ranked) => {
                function noArena() {
                  if (
                    ranked.data[0]?.queueType == "RANKED_SOLO_5x5" ||
                    ranked.data[1]?.queueType == "RANKED_SOLO_5x5" ||
                    ranked.data[0]?.queueType == "RANKED_FLEX_SR" ||
                    ranked.data[1]?.queueType == "RANKED_FLEX_SR" ||
                    ranked.data[0] == undefined ||
                    ranked.data1[1] == undefined ||
                    ranked.data == ""
                  ) {
                    if (
                      ranked.data[0] == undefined &&
                      ranked.data[1]?.queueType == "RANKED_FLEX_SR"
                    ) {
                      rankedStats.innerHTML = "Unranked";
                      rankedSoloIcon.src = `https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/images/ranked-mini-crests/unranked.png`;
                      rankedSoloIcon.style.display = "flex";
                      rankedSoloIcon.style.width = "40px";
                      rankedSoloIcon.style.height = "40px";
                      containerRanked.style.display = "block";
                      containerRanked.style.width = "260px";
                      containerRanked.style.height = "65px";
                      var queueFlex = ranked.data[1].queueType;
                      queueFlex = ranked.data[1].queueType
                        .replace("RANKED_FLEX_SR", "Ranqueada Flexiviel: ")
                        .replace("RANKED_SOLO_5x5", "Ranqueada Solo/Duo: ");
                      ranked.data[1].tier =
                        ranked.data[1].tier.toLowerCase();
                      rankedFlexIcon.src = `https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/images/ranked-mini-crests/${ranked.data[1].tier}.svg`;
                      rankedFlexIcon.style.display = "flex";
                      containerRankedFlex.style.display = "block";
                      rankedFlexData.innerHTML = `${queueFlex} ${ranked.data[1].tier} ${ranked.data[1].rank}\nVitorias: ${ranked.data[1].wins} <br>Derrotas: ${ranked.data[1].losses}`;
                    } else if (
                      ranked.data[1] == undefined &&
                      ranked.data[0]?.queueType == "RANKED_FLEX_SR"
                    ) {
                      rankedStats.innerHTML = "Unranked";
                      rankedSoloIcon.src = `https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/images/ranked-mini-crests/unranked.png`;
                      rankedSoloIcon.style.display = "flex";
                      rankedSoloIcon.style.width = "40px";
                      rankedSoloIcon.style.height = "40px";
                      containerRanked.style.display = "block";
                      var queueFlex = ranked.data[0].queueType;
                      queueFlex = ranked.data[0].queueType
                        .replace("RANKED_FLEX_SR", "Ranqueada Flexiviel: ")
                        .replace("RANKED_SOLO_5x5", "Ranqueada Solo/Duo: ");
                      ranked.data[0].tier =
                        ranked.data[0].tier.toLowerCase();
                      rankedFlexIcon.src = `https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/images/ranked-mini-crests/${ranked.data[0].tier}.svg`;
                      rankedFlexIcon.style.display = "flex";
                      containerRankedFlex.style.display = "block";
                      rankedFlexData.innerHTML = `${queueFlex} ${ranked.data[0].tier} ${ranked.data[0].rank}\nVitorias: ${ranked.data[0].wins} <br>Derrotas: ${ranked.data[0].losses}`;
                    } else if (
                      ranked.data[1] == undefined &&
                      ranked.data[0]?.queueType == "RANKED_SOLO_5x5"
                    ) {

                      rankedFlexIcon.src = `https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/images/ranked-mini-crests/unranked.png`;
                      rankedFlexIcon.style.display = "flex";
                      rankedFlexIcon.style.width = "40px";
                      rankedFlexIcon.style.height = "40px";
                      containerRankedFlex.style.display = "block";
                      rankedFlexData.innerHTML = "Unranked"
                      var queueSolo = ranked.data[0].queueType;
                      queueSolo = ranked.data[0].queueType
                        .replace("RANKED_FLEX_SR", "Ranqueada Flexiviel: ")
                        .replace("RANKED_SOLO_5x5", "Ranqueada Solo/Duo: ");
                      ranked.data[0].tier =
                        ranked.data[0].tier.toLowerCase();
                      rankedSoloIcon.src = `https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/images/ranked-mini-crests/${ranked.data[0].tier}.svg`;
                      rankedSoloIcon.style.display = "flex";
                      containerRanked.style.display = "block";
                      rankedStats.innerHTML = `${queueSolo} ${ranked.data[0].tier} ${ranked.data[0].rank}\nVitorias: ${ranked.data[0].wins} <br>Derrotas: ${ranked.data[0].losses}`;
                    } else if (
                      ranked.data[0] == undefined &&
                      ranked.data[1]?.queueType == "RANKED_SOLO_5x5"
                    ) {

                      rankedFlexData.innerHTML = "Unranked";
                      rankedFlexIcon.src = `https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/images/ranked-mini-crests/unranked.png`;
                      rankedFlexIcon.style.display = "flex";
                      rankedFlexIcon.style.width = "40px";
                      rankedFlexIcon.style.height = "40px";
                      containerRankedFlex.style.display = "block";
                      var queueSolo = ranked.data[1].queueType;
                      queueSolo = ranked.data[1].queueType
                        .replace("RANKED_FLEX_SR", "Ranqueada Flexiviel: ")
                        .replace("RANKED_SOLO_5x5", "Ranqueada Solo/Duo: ");
                      ranked.data[1].tier =
                        ranked.data[1].tier.toLowerCase();
                      rankedSoloIcon.src = `https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/images/ranked-mini-crests/${ranked.data[1].tier}.svg`;
                      rankedSoloIcon.style.display = "flex";
                      containerRanked.style.display = "block";
                      rankedStats.innerHTML = `${queueSolo} ${ranked.data[1].tier} ${ranked.data[1].rank}\nVitorias: ${ranked.data[1].wins} <br>Derrotas: ${ranked.data[1].losses}`;
                    } else if (
                      ranked.data[1] == undefined &&
                      ranked.data[0] == undefined
                    ) {

                      rankedStats.innerHTML = "Unranked";
                      rankedSoloIcon.src = `https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/images/ranked-mini-crests/unranked.png`;
                      rankedSoloIcon.style.display = "flex";
                      rankedSoloIcon.style.width = "40px";
                      rankedSoloIcon.style.height = "40px";
                      containerRanked.style.display = "block";
                      rankedStats.innerHTML = "Unranked";
                      rankedFlexIcon.src = `https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/images/ranked-mini-crests/unranked.png`;
                      rankedFlexIcon.style.display = "flex";
                      rankedFlexIcon.style.width = "40px";
                      rankedFlexIcon.style.height = "40px";
                      containerRankedFlex.style.display = "block";
                      rankedFlexData.innerHTML = "Unranked";
                    } else if (
                      ranked.data[0]?.queueType == "RANKED_FLEX_SR" &&
                      ranked.data[1]?.queueType == "RANKED_SOLO_5x5"
                    ) {

                      var queueFlex = ranked.data[0].queueType;
                      queueFlex = ranked.data[0].queueType
                        .replace("RANKED_FLEX_SR", "Ranqueada Flexiviel: ")
                        .replace("RANKED_SOLO_5x5", "Ranqueada Solo/Duo: ");
                      ranked.data[0].tier =
                        ranked.data[0].tier.toLowerCase();
                      rankedFlexIcon.src = `https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/images/ranked-mini-crests/${ranked.data[0].tier}.svg`;
                      rankedFlexIcon.style.display = "flex";
                      containerRankedFlex.style.display = "block";
                      rankedFlexData.innerHTML = `${queueFlex} ${ranked.data[0].tier} ${ranked.data[0].rank}\nVitorias: ${ranked.data[0].wins} <br>Derrotas: ${ranked.data[0].losses}`;
                      var queueSolo = ranked.data[1].queueType;
                      queueSolo = ranked.data[1].queueType
                        .replace("RANKED_FLEX_SR", "Ranqueada Flexiviel: ")
                        .replace("RANKED_SOLO_5x5", "Ranqueada Solo/Duo: ");
                      ranked.data[1].tier =
                        ranked.data[1].tier.toLowerCase();
                      rankedSoloIcon.src = `https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/images/ranked-mini-crests/${ranked.data[1].tier}.svg`;
                      rankedSoloIcon.style.display = "flex";
                      containerRanked.style.display = "block";
                      rankedStats.innerHTML = `${queueSolo} ${ranked.data[1].tier} ${ranked.data[1].rank}\nVitorias: ${ranked.data[1].wins} <br>Derrotas: ${ranked.data[1].losses}`;
                    } else if (ranked.data[0] == undefined) {

                      rankedStats.innerHTML = "Unranked";
                      rankedSoloIcon.src = `https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/images/ranked-mini-crests/unranked.png`;
                      rankedSoloIcon.style.display = "flex";
                      rankedSoloIcon.style.width = "40px";
                      rankedSoloIcon.style.height = "40px";
                      containerRanked.style.display = "block";
                      containerRanked.style.width = "260px";
                      containerRanked.style.height = "65px";
                      var queueFlex = ranked.data[1].queueType;
                      queueFlex = ranked.data[1].queueType
                        .replace("RANKED_FLEX_SR", "Ranqueada Flexiviel: ")
                        .replace("RANKED_SOLO_5x5", "Ranqueada Solo/Duo: ");
                      ranked.data[1].tier =
                        ranked.data[1].tier.toLowerCase();
                      rankedFlexIcon.src = `https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/images/ranked-mini-crests/${ranked.data[1].tier}.svg`;
                      rankedFlexIcon.style.display = "flex";
                      containerRankedFlex.style.display = "block";
                      rankedFlexData.innerHTML = `${queueFlex} ${ranked.data[1].tier} ${ranked.data[1].rank}\nVitorias: ${ranked.data[1].wins} <br>Derrotas: ${ranked.data[1].losses}`;
                    } else if (
                      ranked.data[0] == undefined &&
                      ranked.data[1]?.queueType == "RANKED_SOLO_5x5"
                    ) {

                      var queueSolo = ranked.data[1].queueType;
                      rankedStats.innerHTML = "Unranked";
                      rankedFlexIcon.src = `https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/images/ranked-mini-crests/unranked.png`;
                      rankedFlexIcon.style.display = "flex";
                      rankedFlexIcon.style.width = "40px";
                      rankedFlexIcon.style.height = "40px";
                      queueSolo = ranked.data[1].queueType
                        .replace("RANKED_FLEX_SR", "Ranqueada Flexiviel: ")
                        .replace("RANKED_SOLO_5x5", "Ranqueada Solo/Duo: ");
                      ranked.data[1].tier =
                        ranked.data[1].tier.toLowerCase();
                      rankedSoloIcon.src = `https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/images/ranked-mini-crests/${ranked.data[1].tier}.svg`;
                      rankedSoloIcon.style.display = "flex";
                      containerRanked.style.display = "block";
                      rankedStats.innerHTML = `${queueSolo} ${ranked.data[1].tier} ${ranked.data[1].rank}\nVitorias: ${ranked.data[1].wins} <br>Derrotas: ${ranked.data[1].losses}`;
                    } else if (
                      ranked.data[0]?.queueType == "RANKED_SOLO_5x5" &&
                      ranked.data[1]?.queueType == "RANKED_FLEX_SR"
                    ) {

                      var queueSolo = ranked.data[0].queueType;
                      queueSolo = ranked.data[0].queueType
                        .replace("RANKED_FLEX_SR", "Ranqueada Flexiviel: ")
                        .replace("RANKED_SOLO_5x5", "Ranqueada Solo/Duo: ");
                      ranked.data[0].tier =
                        ranked.data[0].tier.toLowerCase();
                      rankedSoloIcon.src = `https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/images/ranked-mini-crests/${ranked.data[0].tier}.svg`;
                      rankedSoloIcon.style.display = "flex";
                      containerRanked.style.display = "block";
                      rankedStats.innerHTML = `${queueSolo} ${ranked.data[0].tier} ${ranked.data[0].rank}\nVitorias: ${ranked.data[0].wins} <br>Derrotas: ${ranked.data[0].losses}`;
                      //daqui pra baixo flex
                      var queueFlex = ranked.data[1].queueType;
                      queueFlex = ranked.data[1].queueType.replace(
                        "RANKED_FLEX_SR",
                        "Ranqueada Flexiviel: ",
                      );
                      ranked.data[1].tier =
                        ranked.data[1].tier.toLowerCase();
                      rankedFlexIcon.src = `https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/images/ranked-mini-crests/${ranked.data[1].tier}.svg`;
                      rankedFlexIcon.style.display = "flex";
                      containerRankedFlex.style.display = "block";
                      rankedFlexData.innerHTML = `${queueFlex} ${ranked.data[1].tier} ${ranked.data[1].rank}\nVitorias: ${ranked.data[1].wins} <br>Derrotas: ${ranked.data[1].losses}`;
                    } else if (
                      ranked.data[0]?.queueType == "RANKED_FLEX_SR"
                    ) {
                      var queueFlex = ranked.data[0].queueType;
                      rankedSoloIcon.style.display = "none";
                      containerRanked.style.display = "none";
                      queueFlex = ranked.data[0].queueType
                        .replace("RANKED_FLEX_SR", "Ranqueada Flexiviel: ")
                        .replace("RANKED_SOLO_5x5", "Ranqueada Solo/Duo: ");
                      ranked.data[0].tier =
                        ranked.data[0].tier.toLowerCase();
                      rankedFlexIcon.src = `https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/images/ranked-mini-crests/${ranked.data[0].tier}.svg`;
                      rankedFlexIcon.style.display = "flex";
                      containerRankedFlex.style.display = "block";
                      rankedFlexData.innerHTML = `${queueFlex} ${ranked.data[0].tier} ${ranked.data[0].rank}\nVitorias: ${ranked.data[0].wins} <br>Derrotas: ${ranked.data[0].losses}`;
                    } else if (
                      ranked.data[1]?.queueType == "RANKED_FLEX_SR"
                    ) {
                      rankedSoloIcon.style.display = "none";
                      containerRanked.style.display = "none";
                      queueFlex = ranked.data[1].queueType.replace(
                        "RANKED_FLEX_SR",
                        "Ranqueada Flexiviel: ",
                      );
                      ranked.data[1].tier =
                        ranked.data[1].tier.toLowerCase();
                      rankedFlexIcon.src = `https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/images/ranked-mini-crests/${ranked.data[1].tier}.svg`;
                      rankedFlexIcon.style.display = "flex";
                      containerRankedFlex.style.display = "block";
                      rankedFlexData.innerHTML = `${queueFlex} ${ranked.data[1].tier} ${ranked.data[1].rank}\nVitorias: ${ranked.data[1].wins} <br>Derrotas: ${ranked.data[1].losses}`;
                    }
                  }
                }
                if (ranked.data[0]?.queueType == "CHERRY") {
                  delete ranked.data[0];
                  ranked.data[0] = undefined;
                  noArena()
                } else if (ranked.data[1]?.queueType == "CHERRY") {

                  delete ranked.data[1];
                  ranked.data[1] = undefined;
                  noArena()
                }
                noArena()
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
                            textoI[i].innerHTML = `<br>Champion: ${arrayNOMES[i]}<br>${formatter.format(maestrias.data[i].championPoints)} pontos de maestria<br>` +
                              `nível: ${maestrias.data[i].championLevel}`
                            maestriasI[i].src =
                              `https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-shared-components/global/default/mastery-10.png`;
                            containerMasteryI[i].appendChild(maestriasI[i]);
                            containerMasteryI[i].appendChild(textoI[i]);
                            containerMasteryI[i].style.display = ("block")
                          }
                          else if (maestrias.data[i].championLevel < 10) {
                            containerContainer.appendChild(containerMasteryI[i])
                            textoI[i].innerHTML = `<br>Champion: ${arrayNOMES[i]}<br>${formatter.format(maestrias.data[i].championPoints)} pontos de maestria<br>` +
                              `nível: ${maestrias.data[i].championLevel}`
                            maestriasI[i].src =
                              `https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-shared-components/global/default/mastery-${maestrias.data[i].championLevel}.png`;
                            containerMasteryI[i].appendChild(maestriasI[i]);
                            containerMasteryI[i].appendChild(textoI[i]);
                            containerMasteryI[i].style.display = ("block")
                          }
                        }
                      }
                    }
                    if (containerMasteryI.length == 0) {
                      maestriaTela()
                    }
                  });
              });
          })
          .catch(function (error) {
            if (error.response) {
              console.error("Erro ao chamar a API de Masteries:", error);
            }
          });
      } else {
        title.style.display = "block";
        title.innerHTML = "Antes de clicar no botao escreva um Riot ID!";
        title.style.color = ("")
      }
    });
}
export { requestRanked };
