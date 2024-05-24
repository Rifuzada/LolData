import { allRequest, remove, sleep, show } from "./allRequest.js";
let puuid = "";
let versao = "";
var region = document.querySelector("#region");
var img = document.getElementById("iconImg");
var title = document.getElementById("title");
var container = document.getElementById("container");
var btn = document.getElementById("search_button");
var inputContainer = document.getElementById("input-container");
var regionSelect = document.getElementById("region");
var rankedSoloIcon = document.getElementById("rankedIcon");
var containerRanked = document.getElementById("containerRanked");
var rankedStats = document.getElementById("rankedSoloqData");
var containerRankedFlex = document.getElementById("containerRankedFlex");
var rankedFlexData = document.getElementById("rankedFlexData");
var rankedFlexIcon = document.getElementById("rankedFlexIcon");
var containerContainer = document.getElementById("containerContainer")
let containerMasteryI = []
var dotflashing = document.getElementById("dot-flashing");
var preloaderBg = document.getElementById("preloaderBg");

document.addEventListener("DOMContentLoaded", function () {
  dotflashing.style.display = "none"
  preloaderBg.style.display = "none"
  containerMasteryI = []
  document
    .getElementById("search_button")
    .addEventListener("click", function () {
      const riotId = document.getElementById("riotId").value;
      if (riotId == "") {
        title.style.display = "block";
        title.innerHTML = "Antes de clicar no botao escreva um Riot ID!";
        title.style.color = ("red")
      }
      title.style.display = "none";
      dotflashing.style.display = "flex"
      sleep(1000).then(() => {
        remove()
      })
      allRequest(puuid, versao, region, img, title, container, btn, inputContainer, riotId, regionSelect, rankedSoloIcon, containerRanked, rankedStats, containerRankedFlex, rankedFlexData, rankedFlexIcon, containerContainer, containerMasteryI)
      sleep(2800).then(() => {
        dotflashing.style.display = "none"
        show()
      })
    });
})
