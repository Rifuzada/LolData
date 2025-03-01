const express = require('express');
require('dotenv').config(); // Carregar variáveis de ambiente
const cors = require('cors');
const axios = require('axios');

// Exportar base_url
module.exports.base_url = process.env.BASE_URL;

var app = express();

app.use(cors());

const api_key = process.env.API_KEY;

app.listen(process.env.PORT, function () {
  console.log("Server started on port 4000")
})

const riotUrl = "https://americas.api.riotgames.com"
const endpointRiotId = "riot/account/v1/accounts/by-riot-id"
const endpointPuuIDtoName = "/riot/account/v1/accounts/by-puuid"
const endpointPuuid = "lol/champion-mastery/v4/champion-masteries/by-puuid"
const endpointSummonerPuuid = "lol/summoner/v4/summoners/by-puuid"
const endpointRankedID = "lol/league/v4/entries/by-summoner"
const endpointMatchIDS = "/lol/match/v5/matches/by-puuid/"
const endpointMatches = "/lol/match/v5/matches/"

app.get('/config', (req, res) => {
  res.json({ base_url: process.env.BASE_URL });
});


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
  //console.log(rankedUrl)
  const response = await axios.get(rankedUrl)
    .then(response => response.data)
    .catch(err => err)
  res.json(response)
})
app.get('/matchIds', async (req, res) => {
  const { puuid } = req.query
  const matchIdUrl = `${riotUrl}${endpointMatchIDS}${puuid}/ids?start=0&count=20&api_key=${api_key}`
  const response = await axios.get(matchIdUrl)
    .then(response => response.data)
    .catch(err => err)
  res.json(response)
})
app.get('/matchHistory', async (req, res) => {
  try {
    const { matches } = req.query;
    const matchDataPromises = [];

    for (let i = 0; i < 10; i++) {
      const matchDataUrl = `${riotUrl}${endpointMatches}${matches[i]}?api_key=${api_key}`;
      matchDataPromises.push(axios.get(matchDataUrl));
    }

    const matchDataResponses = await Promise.all(matchDataPromises);
    const matchData = matchDataResponses.map(response => response.data);

    res.json(matchData);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
    console.error("Error fetching data from Riot API:", error);
  }
});
app.get('/PuuidToName', async (req, res) => {
  try {
    const { Ids } = req.query; // Assuming Ids parameter contains an array of IDs
    const puuIdPromises = [];
    for (let i = 0; i < 10; i++) {
      const fullUrl = `${riotUrl}${endpointPuuIDtoName}/${Ids[i]}?api_key=${api_key}`;
      puuIdPromises.push(axios.get(fullUrl));
    }
    const puuidDataResponses = await Promise.all(puuIdPromises);
    const puuidData = puuidDataResponses.map(response => response.data);

    res.json(puuidData);
  } catch (error) {
    console.error("Error fetching data from Riot API:", error);
    //res.status(500).json({ error: "Internal Server Error" });
  }
});
