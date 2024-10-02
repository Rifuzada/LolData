import { allRequest, remove, sleep, show } from "./allRequest.js";
import {
  puuid,
  versao,
  region,
  img,
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
} from "./allVars.js";

document.addEventListener("DOMContentLoaded", function () {
  dotflashing.style.display = "none";
  preloaderBg.style.display = "none";
  let containerMasteryI = [];

  function performSearch() {
    const riotId = document.getElementById("riotId").value;
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
    allRequest(
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
      containerMasteryI
    );

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