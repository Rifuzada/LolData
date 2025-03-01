import { remove, sleep, show } from "./utils.js"
import { base_url } from './server.js';

const response = await fetch('https://rifuzada.github.io/LolData/config');
const data = await response.json();
const base_url = data.base_url;


export async function masteryRequest(
    riotId,
    puuid,
    region,
    regionSelect,
    inputContainer,
    versao,
    containerContainer,
    containerMasteryI,
) {
    region = region.value;
    region = region.toLowerCase();
    riotId = riotId.replace(/\s/g, "");
    let response = await axios
        .get(`${base_url}/account`, { params: { riotId } })
    if (response.config.params.riotId != "") {
        puuid = response.data.puuid;
        regionSelect.style.marginLeft = "5px";
        inputContainer.style.top = "-50px";
        inputContainer.style.left = "376px";
        let maestrias = await axios
            .get(`${base_url}/masteries`, {
                params: { puuid, region },
            })
        var formatter = new Intl.NumberFormat("pt-BR");
        var arrayIDS = [];
        var arrayNOMES = [];
        var maestriaData = await Object.keys(maestrias.data);
        var arrayLength = maestriaData.length;
        let versionresponse = await axios
            .get("https://ddragon.leagueoflegends.com/api/versions.json")
        versao = versionresponse.data[0];
        let nomes = await axios
            .get(
                `https://ddragon.leagueoflegends.com/cdn/${versao}/data/en_US/champion.json`
            )
        for (var i = 0; i < arrayLength; i++) {
            await arrayIDS.push(maestrias.data[i].championId);
        }
        var allNames = Object.values(nomes.data.data);

        for (var id of arrayIDS) {
            var champion = allNames.find((obj) => obj.key == id);
            var championName = champion.name;
            arrayNOMES.push(championName);
        }
        var mastery1 = document.createElement("img");
        var mastery2 = document.createElement("img");
        var mastery3 = document.createElement("img");
        var mastery4 = document.createElement("img");
        var mastery5 = document.createElement("img");
        var containerMasteries1 = document.createElement("div");
        containerMasteries1.setAttribute(
            "id",
            "containerMasteries1"
        );
        var containerMasteries2 = document.createElement("div");
        containerMasteries2.setAttribute(
            "id",
            "containerMasteries2"
        );
        var containerMasteries3 = document.createElement("div");
        containerMasteries3.setAttribute(
            "id",
            "containerMasteries3"
        );
        var containerMasteries4 = document.createElement("div");
        containerMasteries4.setAttribute(
            "id",
            "containerMasteries4"
        );
        var containerMasteries5 = document.createElement("div");
        containerMasteries5.setAttribute(
            "id",
            "containerMasteries5"
        );
        var texto1 = document.createElement("span");
        var texto2 = document.createElement("span");
        var texto3 = document.createElement("span");
        var texto4 = document.createElement("span");
        var texto5 = document.createElement("span");

        function maestriaTela() {
            if (containerMasteryI.length == 0) {
                var maestriasI = [
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
                var textoI = [texto1, texto2, texto3, texto4, texto5];
                for (var i = 0; i < 5; i++) {
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



    }


}
