let puuid = "";
let versao = "";

var region = document.querySelector("#region");
var regionSelect = document.getElementById("region");

var img = document.getElementById("iconImg");

var title = document.getElementById("title");
var container = document.getElementById("container");

var btn = document.getElementById("search_button");
var inputContainer = document.getElementById("input-container");

var rankedSoloIcon = document.getElementById("rankedIcon");
var containerRanked = document.getElementById("containerRanked");
var rankedStats = document.getElementById("rankedSoloqData");

var containerRankedFlex = document.getElementById("containerRankedFlex");
var rankedFlexData = document.getElementById("rankedFlexData");
var rankedFlexIcon = document.getElementById("rankedFlexIcon");
var containerContainer = document.getElementById("containerContainer")

var dotflashing = document.getElementById("dot-flashing");
var preloaderBg = document.getElementById("preloaderBg");

var gameMainRuneIcon = document.createElement("img");
var gameSecondaryRuneIcon = document.createElement("img");

export { puuid, versao, region, img, title, container, btn, inputContainer, regionSelect, rankedSoloIcon, containerRanked, rankedStats, containerRankedFlex, rankedFlexData, rankedFlexIcon, containerContainer, dotflashing, preloaderBg, gameMainRuneIcon, gameSecondaryRuneIcon }