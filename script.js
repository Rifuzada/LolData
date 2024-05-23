import { requestRanked } from "./ranked.js";
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

var regionSelect = document.getElementById("region");
var rankedSoloIcon = document.getElementById("rankedIcon");
var containerRanked = document.getElementById("containerRanked");
var rankedStats = document.getElementById("rankedSoloqData");
var containerRankedFlex = document.getElementById("containerRankedFlex");
var rankedFlexData = document.getElementById("rankedFlexData");
var rankedFlexIcon = document.getElementById("rankedFlexIcon");
var containerContainer = document.getElementById("containerContainer")
let containerMasteryI = []
document.addEventListener("DOMContentLoaded", function () {
  containerMasteryI = []
  document
    .getElementById("search_button")
    .addEventListener("click", function () {
      const riotId = document.getElementById("riotId").value;
      var div = document.getElementById('containerContainer');
      while (div.firstChild) {
        div.removeChild(div.firstChild);
      }
      requestRanked(puuid, versao, region, img, title, container, btn, inputContainer, riotId, regionSelect, rankedSoloIcon, containerRanked, rankedStats, containerRankedFlex, rankedFlexData, rankedFlexIcon, containerContainer, containerMasteryI)
    });

})
