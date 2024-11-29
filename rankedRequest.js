import { remove, sleep, show } from "./utils.js";
export function rankedRequest(
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
                                                            "grão-mestre",
                                                            "grandmaster"
                                                        );
                                                        // ranked.data[i].tier = ranked.data[i].tier.replace(
                                                        //     "mestre",
                                                        //     "master"
                                                        // );
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
                                                            "grandmaster",
                                                            "Grão-Mestre"
                                                        );
                                                        ranked.data[i].tier = ranked.data[i].tier.replace(
                                                            "master",
                                                            "Mestre"
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
                                                        // ranked.data[i].tier = ranked.data[i].tier.replace(
                                                        //     "mestre",
                                                        //     "master"
                                                        // );
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
                                                            "grandmaster",
                                                            "Grão-Mestre"
                                                        );
                                                        ranked.data[i].tier = ranked.data[i].tier.replace(
                                                            "master",
                                                            "Mestre"
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
            }
        });
}
