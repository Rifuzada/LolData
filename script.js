document.addEventListener('DOMContentLoaded', function () {
  document.getElementById('search_button').addEventListener('click', function () {
    // Obtém o valor do campo de entrada
    let puuid = ''


    const riotId = document.getElementById('riotId').value;
    nickName.innerHTML = riotId;
    axios.get('http://localhost:4000/account', { params: { riotId } })
      .then(response => {
        console.log('Dados recebidos da API de Account:', response.data);
        puuid = response.data.puuid;
        console.log(puuid)

        axios.get('http://localhost:4000/masteries', { params: { puuid } })
        .then(response => {
          console.log('Dados recebidos da API de Masteries:', response.data);
        })
        .catch(error => {
          console.error('Erro ao chamar a API de Masteries:', error);
        });
      })
      .catch(error => {
        console.error('Erro ao chamar a API de Account:', error);
      });

  });
});
