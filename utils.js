
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function remove() {
  // Limpa o container de perfil
  var div1 = document.getElementById("icon");
  var div2 = document.getElementById("containerContainer");

  // Oculta o container do perfil
  div1.style.display = "none";

  // Remove as crianças do container (maestrias, etc.)
  while (div2.firstChild) {
    div2.removeChild(div2.firstChild);
  }

  // Limpa os dados do histórico de partidas, mas mantém a estrutura para receber os novos dados
  var matchHistoryContainer = document.getElementById("matchHistoryContainer");
  var matches = document.getElementsByClassName("matches");
  for (let i = 0; i < matches.length; i++) {
    matches[i].innerHTML = ""; // Limpa o conteúdo de cada partida sem remover a estrutura
  }
}

function show() {
  var div1 = document.getElementById("icon");
  div1.style.display = "flex";
}

export { remove, sleep, show };