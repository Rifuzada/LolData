document.addEventListener('DOMContentLoaded', function () {
  document.getElementById('search_button').addEventListener('click', function () {
    // Obtém o valor do campo de entrada

    const riotId = document.getElementById('riotId').value;
    nickName.innerHTML = riotId;
    // Cria o objeto de dados para enviar na requisição
    // Faz a chamada à API usando Axios
    axios.get('http://localhost:4000/account', { params: { riotId } })
      .then(response => {
        console.log('Dados recebidos da API:', response.data);
      })
      .catch(error => {
        console.error('Erro ao chamar a API:', error);
      });
    axios.get('http://localhost:4000/masteries')
      .then(response => {
        const { puuid } = response.data
        console.log('Dados: ', puuid)
      })
  });
});