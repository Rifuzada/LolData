var express = require('express');
var cors = require('cors');
const axios = require('axios');

var app = express();

app.use(cors());

const api_key = "";

app.listen(4000, function () {
  console.log("Server started on port 4000")
})

const riotUrl = "https://americas.api.riotgames.com"
const endpointRiotId = "riot/account/v1/accounts/by-riot-id"
const endpointPuuid = "lol/champion-mastery/v4/champion-masteries/by-puuid"
const endpointSummonerPuuid = "lol/summoner/v4/summoners/by-puuid"
const endpointRankedID = "lol/league/v4/entries/by-summoner"

app.get('/account', async (req, res) => {
  const { riotId } = req.query
  const formattedRiotId = riotId.replace("#", "/");
  const fullUrl = `${riotUrl}/${endpointRiotId}/${formattedRiotId}?api_key=${api_key}`
  const response = await axios.get(fullUrl)
    .then(response => response.data)
    .catch(err => err)
  res.json(response)
});

app.get('/masteries', async (req, res) => {
  const { puuid } = req.query
  const { region } = req.query;
  const riotUrlReg = `https://${region}.api.riotgames.com`
  const puuidUrl = `${riotUrlReg}/${endpointPuuid}/${puuid}?api_key=${api_key}`
  const response = await axios.get(puuidUrl)
    .then(response => response.data)
    .catch(err => err)
  res.json(response)
});

app.get('/profile', async (req, res) => {
  const { puuid } = req.query
  const { region } = req.query;
  const riotUrlReg = `https://${region}.api.riotgames.com`
  const profileUrl = `${riotUrlReg}/${endpointSummonerPuuid}/${puuid}?api_key=${api_key}`
  const response = await axios.get(profileUrl)
    .then(response => response.data)
    .catch(err => err)
  res.json(response)
})
app.get('/ranked', async (req, res) => {
  const { region } = req.query;
  const { sumID } = req.query
  const riotUrlReg = `https://${region}.api.riotgames.com`
  const rankedUrl = `${riotUrlReg}/${endpointRankedID}/${sumID}?api_key=${api_key}`
  const response = await axios.get(rankedUrl)
    .then(response => response.data)
    .catch(err => err)
  res.json(response)
})
