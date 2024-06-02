import { allRequest, remove, sleep, show } from "./allRequest.js";
import { puuid, versao, region, img, title, container, btn, inputContainer, regionSelect, rankedSoloIcon, containerRanked, rankedStats, containerRankedFlex, rankedFlexData, rankedFlexIcon, containerContainer, dotflashing, preloaderBg } from "./allVars.js";

document.addEventListener("DOMContentLoaded", function () {
  dotflashing.style.display = "none";
  preloaderBg.style.display = "none";
  let containerMasteryI = [];

  function performSearch() {
    const riotId = document.getElementById("riotId").value;
    if (riotId === "") {
      title.style.display = "block";
      title.innerHTML = "Antes de clicar no botao escreva um Riot ID!";
      title.style.color = "red";
      return;
    }
    title.style.display = "none";
    dotflashing.style.display = "flex";
    sleep(800).then(() => {
      remove();
    });
    allRequest(puuid, versao, region, img, container, btn, inputContainer, riotId, regionSelect, rankedSoloIcon, containerRanked, rankedStats, containerRankedFlex, rankedFlexData, rankedFlexIcon, containerContainer, containerMasteryI);
    sleep(2000).then(() => {
      dotflashing.style.display = "none";
      show();
    });
  }

  document.getElementById("search_button").addEventListener("click", performSearch);

  document.getElementById("riotId").addEventListener("keydown", (event) => {
    if (event.key === 'Enter') {
      performSearch();
      event.preventDefault(); // prevent default behavior
    }
  });
});
