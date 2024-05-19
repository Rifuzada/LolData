var express = require('express');
var cors = require('cors');
const axios = require('axios');

var app = express();

app.use(cors());

const api_key = "";

app.listen(4000, function () {
  console.log("Server started on port 4000")
})

const riotUrl = "https://americas.api.riotgames.com/"
const region = "br1"
const riotUrlReg = `https://${region}.api.riotgames.com`
const endpointRiotId = "riot/account/v1/accounts/by-riot-id"
const endpointPuuid = "lol/champion-mastery/v4/champion-masteries/by-puuid"

app.get('/account', async (req, res) => {
  const { riotId } = req.query
  const formattedRiotId = riotId.replace("#", "/");
  const fullUrl = `${riotUrl}/${endpointRiotId}/${formattedRiotId}?api_key = ${api_key}`
  const response = await axios.get(fullUrl)
    .then(response => response.data)
    .catch(err => err)

  return res.json(response)
});
app.get('/masteries', async (req, res) => {
  const { puuid } = response.puuid
  const puuidUrl = `${riotUrlReg}/${endpointPuuid}/${puuid}?api_key = ${api_key}`
  const response = await axios.get(puuidUrl)
    .then(response => response.data)
    .catch(err => err)
  res.json(response)
});
//https://americas.api.riotgames.com/riot/account/v1/accounts/by-riot-id/rifu/god?api_key=RGAPI-2f53d5c1-3c2f-49c9-90dd-66e5b3867b68
