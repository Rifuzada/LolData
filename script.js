import { masteryRequest } from "./masteryRequest.js";
import { matchHistoryRequest } from "./matchHistoryRequest.js";
import { rankedRequest } from "./rankedRequest.js";
import { remove, sleep, show } from "./utils.js";
import {
  puuid,
  versao,
  region,
  img,
  body,
  title,
  container,
  btn,
  inputContainer,
  regionSelect,
  rankedSoloIcon,
  containerRanked,
  rankedStats,
  containerRankedFlex,
  rankedFlexData,
  rankedFlexIcon,
  containerContainer,
  dotflashing,
  preloaderBg,
  gameMainRuneIcon,
  gameSecondaryRuneIcon,
} from "./allVars.js";

var containerMasteryI = [];
let riotId = document.getElementById("riotId").value;
export function performSearch() {
  console.log("ola")
  document.querySelectorAll('.matchesDetails').forEach(detail => {
    detail.style.display = "none";
    document.body.style.top = "0px";
  });
  riotId = document.getElementById("riotId").value;
  body.style.overflowY = "scroll";
  if (riotId === "") {
    title.style.display = "block";
    title.innerHTML = "Antes de clicar no botão, escreva um Riot ID!";
    title.style.color = "red";
    return;
  }
  title.style.display = "none";

  // Remove os elementos antigos antes de carregar os novos
  remove();

  // Cria uma div para cada partida


  // Mostra o preloader enquanto faz a nova requisição
  //dotflashing.style.display = "flex";

  // Chama a função para buscar e exibir os novos dados
  const requests = [
    { func: rankedRequest, params: [puuid, versao, region, img, container, btn, inputContainer, riotId, regionSelect, rankedSoloIcon, containerRanked, rankedStats, containerRankedFlex, rankedFlexData, rankedFlexIcon] },
    { func: matchHistoryRequest, params: [riotId, puuid, region, regionSelect, inputContainer, versao, gameMainRuneIcon, gameSecondaryRuneIcon] },
    { func: masteryRequest, params: [riotId, puuid, region, regionSelect, inputContainer, versao, containerContainer, containerMasteryI] }
  ];

  requests.forEach(({ func, params }) => func(...params));

  // Esconde o preloader depois de carregar os dados
  sleep(2000).then(() => {
    dotflashing.style.display = "none";
    show();
  });
}
export function performNewSearch(riotId) {
  body.style.overflowY = "scroll";
  if (riotId === "") {
    title.style.display = "block";
    title.innerHTML = "Antes de clicar no botão, escreva um Riot ID!";
    title.style.color = "red";
    return;
  }
  title.style.display = "none";

  // Remove os elementos antigos antes de carregar os novos
  remove();


  // Mostra o preloader enquanto faz a nova requisição
  //dotflashing.style.display = "flex";

  // Chama a função para buscar e exibir os novos dados
  const requests = [
    { func: rankedRequest, params: [puuid, versao, region, img, container, btn, inputContainer, riotId, regionSelect, rankedSoloIcon, containerRanked, rankedStats, containerRankedFlex, rankedFlexData, rankedFlexIcon] },
    { func: matchHistoryRequest, params: [riotId, puuid, region, regionSelect, inputContainer, versao, gameMainRuneIcon, gameSecondaryRuneIcon] },
    { func: masteryRequest, params: [riotId, puuid, region, regionSelect, inputContainer, versao, containerContainer, containerMasteryI] }
  ];

  requests.forEach(({ func, params }) => func(...params));

  // Esconde o preloader depois de carregar os dados
  sleep(2000).then(() => {
    dotflashing.style.display = "none";
    show();
  });

}

document.addEventListener("DOMContentLoaded", function () {
  dotflashing.style.display = "none";
  preloaderBg.style.display = "none";


  document
    .getElementById("search_button")
    .addEventListener("click", performSearch);

  document.getElementById("riotId").addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      performSearch();
      event.preventDefault(); // prevent default behavior
    }
  });
});