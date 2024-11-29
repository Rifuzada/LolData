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

document.addEventListener("DOMContentLoaded", function () {
  dotflashing.style.display = "none";
  preloaderBg.style.display = "none";
  var containerMasteryI = [];

  function performSearch() {
    const riotId = document.getElementById("riotId").value;
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
    dotflashing.style.display = "flex";

    // Chama a função para buscar e exibir os novos dados
    rankedRequest(
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
    );
    matchHistoryRequest(
      riotId,
      puuid,
      region,
      regionSelect,
      inputContainer,
      versao,
      gameMainRuneIcon,
      gameSecondaryRuneIcon);
    masteryRequest(
      riotId,
      puuid,
      region,
      regionSelect,
      inputContainer,
      versao,
      containerContainer,
      containerMasteryI,)

    // Esconde o preloader depois de carregar os dados
    sleep(2000).then(() => {
      dotflashing.style.display = "none";
      show();
    });
  }

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