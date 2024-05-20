document.addEventListener('DOMContentLoaded', function () {
  document.getElementById('search_button').addEventListener('click', function () {
    let puuid = ''
    let versao = ''
    let region = document.querySelector('#region');
    region = region.value;
    region = region.toLowerCase()
    var img = document.getElementById("iconImg")
    var title = document.getElementById("title")
    var container = document.getElementById("container")
    const riotId = document.getElementById('riotId').value;
    axios.get('http://localhost:4000/account', { params: { riotId } })
      .then(response => {
        console.log('Dados recebidos da API de Account:', response.data);
        puuid = response.data.puuid;
        axios.get('http://localhost:4000/profile', { params: { puuid, region } })
          .then(response => {
            var iconID = response.data.profileIconId
            var Level = response.data.summonerLevel
            axios.get('http://ddragon.leagueoflegends.com/api/versions.json')
              .then(response => {
                versao = response.data[0]
                img.src = `https://ddragon.leagueoflegends.com/cdn/${versao}/img/profileicon/${iconID}.png`;
                img.style.display = 'block'
                title.style.display = "none"
                container.style.display = "block"
                nickName.innerHTML = riotId + " -";
                Lvl.innerHTML = "Level: " + Level;
              });
          });
        axios.get('http://localhost:4000/masteries', { params: { puuid, region } })
          .then(maestrias => {
            var formatter = new Intl.NumberFormat("pt-BR");
            let arrayIDS = []
            let arrayNOMES = []
            var maestriaData = Object.keys(maestrias.data)
            let arrayLength = maestriaData.length
            axios.get('http://ddragon.leagueoflegends.com/api/versions.json')
              .then(response => {
                versao = response.data[0]
                axios.get(`https://ddragon.leagueoflegends.com/cdn/${versao}/data/en_US/champion.json`)
                  .then(nomes => {
                    for (let i = 0; i < arrayLength; i++) {
                      arrayIDS.push(maestrias.data[i].championId);
                    }
                    const allNames = Object.values(nomes.data.data)

                    for (const id of arrayIDS) {
                      const champion = allNames.find(obj => obj.key == id)
                      const championName = champion.name
                      arrayNOMES.push(championName)
                    }
                    console.log(`Champion: ${arrayNOMES[0]}, Possui ${formatter.format(maestrias.data[0].championPoints)} pontos de maestria` + `, com nível: ${maestrias.data[0].championLevel}`);
                    console.log(`Champion: ${arrayNOMES[1]}, Possui ${formatter.format(maestrias.data[1].championPoints)} pontos de maestria` + `, com nível: ${maestrias.data[1].championLevel}`);
                    console.log(`Champion: ${arrayNOMES[2]}, Possui ${formatter.format(maestrias.data[2].championPoints)} pontos de maestria` + `, com nível: ${maestrias.data[2].championLevel}`);
                    console.log(`Champion: ${arrayNOMES[3]}, Possui ${formatter.format(maestrias.data[3].championPoints)} pontos de maestria` + `, com nível: ${maestrias.data[3].championLevel}`);
                    console.log(`Champion: ${arrayNOMES[4]}, Possui ${formatter.format(maestrias.data[4].championPoints)} pontos de maestria` + `, com nível: ${maestrias.data[4].championLevel}`);
                  })
              })


          })
          .catch(function (error) {
            if (error.response) {
              console.error('Erro ao chamar a API de Masteries:', error);
            }
          });
      })
  });
});
