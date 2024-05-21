document.addEventListener("DOMContentLoaded", function () {
  document
    .getElementById("search_button")
    .addEventListener("click", function () {
      let puuid = "";
      let versao = "";
      let region = document.querySelector("#region");
      region = region.value;
      region = region.toLowerCase();
      var img = document.getElementById("iconImg");
      var title = document.getElementById("title");
      var container = document.getElementById("container");
      var btn = document.getElementById("search_button");
      var inputContainer = document.getElementById("input-container");
      const riotId = document.getElementById("riotId").value;
      var regionSelect = document.getElementById("region");
      var rankedSoloIcon = document.getElementById("rankedIcon");
      var containerRanked = document.getElementById("containerRanked");
      var rankedStats = document.getElementById("rankedSoloqData");
      var containerRankedFlex = document.getElementById("containerRankedFlex");
      var rankedFlexData = document.getElementById("rankedFlexData");
      var rankedFlexIcon = document.getElementById("rankedFlexIcon");
      var containerMastery = document.getElementById("containerMasteries");

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
                    console.log(ranked.data)
                    function noArena() {
                      if (
                        ranked.data[0]?.queueType == "RANKED_SOLO_5x5" ||
                        ranked.data[1]?.queueType == "RANKED_SOLO_5x5" ||
                        ranked.data[0]?.queueType == "RANKED_FLEX_SR" ||
                        ranked.data[1]?.queueType == "RANKED_FLEX_SR" ||
                        ranked.data[0] == undefined ||
                        ranked.data1[1] == undefined
                      ) {
                        if (
                          ranked.data[0] == undefined &&
                          ranked.data[1].queueType == "RANKED_FLEX_SR"
                        ) {
                          console.log("melaos");
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
                          ranked.data[0].queueType == "RANKED_FLEX_SR"
                        ) {
                          console.log("1melaos");
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
                          ranked.data[0].queueType == "RANKED_SOLO_5x5"
                        ) {
                          console.log("13melaos");
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
                          ranked.data[1].queueType == "RANKED_SOLO_5x5"
                        ) {
                          console.log("1melaos3");
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
                          console.log("2melaos");
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
                        } else if (
                          ranked.data[0].queueType == "RANKED_FLEX_SR" &&
                          ranked.data[1].queueType == "RANKED_SOLO_5x5"
                        ) {
                          console.log("umitams33");
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
                          console.log("mel3aos");
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
                          ranked.data[1].queueType == "RANKED_SOLO_5x5"
                        ) {
                          console.log("u1111mitams");
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
                          ranked.data[0].queueType == "RANKED_SOLO_5x5" &&
                          ranked.data[1]?.queueType == "RANKED_FLEX_SR"
                        ) {
                          console.log("aqui");
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
                          ranked.data[0].queueType == "RANKED_FLEX_SR"
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
                    if (ranked.data[0].queueType == "CHERRY") {
                      console.log("que");
                      delete ranked.data[0];
                      ranked.data[0] = undefined;
                      noArena()
                    } else if (ranked.data[1]?.queueType == "CHERRY") {
                      console.log("qu111e");
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
                        mastery1.src =
                          "https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-shared-components/global/default/mastery-9.png";
                        containerMastery.appendChild(mastery1);
                        containerMastery.style.display = ("block")
                        console.log(
                          `Champion: ${arrayNOMES[0]}, Possui ${formatter.format(maestrias.data[0].championPoints)} pontos de maestria` +
                          `, com nível: ${maestrias.data[0].championLevel}`,
                        );
                        console.log(
                          `Champion: ${arrayNOMES[1]}, Possui ${formatter.format(maestrias.data[1].championPoints)} pontos de maestria` +
                          `, com nível: ${maestrias.data[1].championLevel}`,
                        );
                        console.log(
                          `Champion: ${arrayNOMES[2]}, Possui ${formatter.format(maestrias.data[2].championPoints)} pontos de maestria` +
                          `, com nível: ${maestrias.data[2].championLevel}`,
                        );
                        console.log(
                          `Champion: ${arrayNOMES[3]}, Possui ${formatter.format(maestrias.data[3].championPoints)} pontos de maestria` +
                          `, com nível: ${maestrias.data[3].championLevel}`,
                        );
                        console.log(
                          `Champion: ${arrayNOMES[4]}, Possui ${formatter.format(maestrias.data[4].championPoints)} pontos de maestria` +
                          `, com nível: ${maestrias.data[4].championLevel}`,
                        );
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
          }
        });
    });
});
