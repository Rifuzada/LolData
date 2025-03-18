'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from "react";
import './style.css';
import useSummonerData from './useSummonerData';
import { fetchVersion } from './api'; // Certifique-se de que a importação está correta

export default function Summoner() {
    const { region, gameName, tagLine } = useParams();

    // Garanta que os parâmetros sejam strings ou tenham valores padrão
    const validRegion = typeof region === 'string' ? region : '';
    const validGameName = typeof gameName === 'string' ? gameName : '';
    const validTagLine = typeof tagLine === 'string' ? tagLine : '';

    const [versao, setVersao] = useState<string | null>(null);

    const {
        puuid,
        summonerLevel,
        iconID,
        eloSoloq,
        eloFlex,
        winsSoloq,
        losesSoloq,
        winsFlex,
        losesFlex,
        lpSoloq,
        lpFlex,
        winrateSoloq,
        winrateFlex,
        soloqImg,
        flexImg,
        championMastery,
        history,
        renderMatchHistory,
        fetchData
    } = useSummonerData(validRegion, validGameName, validTagLine);

    useEffect(() => {
        const getVersion = async () => {
            const version = await fetchVersion();
            setVersao(version);
        };

        getVersion();
    }, []);

    useEffect(() => {
        const searchButton = document.getElementById('search_button');
        const riotIdInput = document.getElementById('riotid') as HTMLInputElement | null;
        if (searchButton && riotIdInput) {
            const handleSearch = () => {
                const regionSelect = document.getElementById('region') as HTMLSelectElement | null;
                if (riotIdInput && regionSelect) {
                    const riotId = riotIdInput.value.split('#');
                    const gameName = riotId[0];
                    const tagLine = riotId[1];
                    const region = regionSelect.value;
                    if (gameName && tagLine) {
                        window.location.href = `https://lol-data-blond.vercel.app/summoner/${region}/${gameName}/${tagLine}`;
                    } else {
                        alert('Por favor, insira um Riot ID válido no formato Nome#Tag.');
                    }
                } else {
                    alert('Erro ao acessar os elementos de entrada.');
                }
            };

            searchButton.addEventListener('click', handleSearch);
            riotIdInput.addEventListener('keypress', (event) => {
                if (event.key === 'Enter') {
                    handleSearch();
                }
            });
        }
    }, []);

    // useEffect(() => {
    //     if (validGameName && validTagLine) {

    //         fetchData();
    //     }
    // }, [validGameName, validTagLine]);

    

    // if (!iconID) {
    //     return <div>Carregando...</div>; // Renderizar um loader ou mensagem enquanto a versão é carregada
    // }
    
    return (
        <div>
            <div id="generalContainer">
                <div id="icon">
                    <img id="iconImg" src={`https://ddragon.leagueoflegends.com/cdn/${versao}/img/profileicon/${iconID}.png`} />
                    <span id="container">
                        <span id="nickName">{gameName}#{tagLine}</span>
                        <span id="Lvl"><br />Level: {summonerLevel}</span>
                    </span>
                    <div id="containerRanked">
                        <div id="containerRankedSoloq">
                            <img id="rankedIcon" src={soloqImg ?? "https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/images/ranked-mini-crests/unranked.png"} />
                            <span id="rankedSoloqData">Ranqueada Solo/Duo: {eloSoloq}<br />Vitorias: {winsSoloq}<br /> Derrotas: {losesSoloq} - Winrate:{winrateSoloq?.toFixed()}% <br />PDL: {lpSoloq}</span>
                            <span id="rankedSoloqDataMobile">{winsSoloq} - {losesSoloq}<br />Winrate:{winrateSoloq?.toFixed()}% <br />PDL: {lpSoloq}</span>
                        </div>
                        <br />
                        <div id="containerRankedFlex">
                            <img id="rankedFlexIcon" src={flexImg ?? "https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/images/ranked-mini-crests/unranked.png"} />
                            <span id="rankedFlexData">Ranqueada Flexível: {eloFlex}<br />Vitorias: {winsFlex}<br /> Derrotas: {losesFlex} - Winrate:{winrateFlex?.toFixed()}% <br />PDL: {lpFlex}</span>
                            <span id="rankedFlexDataMobile">{winsFlex} - {losesFlex}<br />Winrate:{winrateFlex?.toFixed()}% <br />PDL: {lpFlex}</span>
                        </div>
                    </div>
                    <div id="containerMastery">
                        {championMastery.map((champion, index) => (
                            <div key={index} id={`containerMasteries${index + 1}`} className="containerMasteryClass">
                                <img
                                    src={`https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/${champion.id}.png`}
                                    id={`mastery${index + 1}`}
                                />
                                <div id={`masteryTxt${index + 1}`}>
                                    <span id="full-text">
                                        <br />Campeão: {champion.name}
                                        <br />{new Intl.NumberFormat('pt-BR').format(champion.points)} pontos de maestria
                                        <br />nível: {champion.level}
                                    </span>
                                    <span id="mobile-text">
                                        <br />{champion.name}
                                        <br />{new Intl.NumberFormat('pt-BR').format(champion.points)}
                                        <br />nível: {champion.level}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div id="mobile-input-container">
                    <button id="mobile-button-open-container-background" onClick={() => {
                        const containerBackground = document.getElementById('mobile-input-container-background');
                        const buttonOpen = document.getElementById('mobile-button-open-container-background');
                        if (containerBackground) {
                            containerBackground.style.display = 'block';
                        }
                        if (buttonOpen) {
                            buttonOpen.style.display = 'none';
                        }
                    }}>☰</button>
                    <div id="mobile-input-container-background">
                        <button id="mobile-button-close-container-background" onClick={() => {
                            const containerBackground = document.getElementById('mobile-input-container-background');
                            const buttonOpen = document.getElementById('mobile-button-open-container-background');
                            if (containerBackground) {
                                containerBackground.style.display = 'none';
                            }
                            if (buttonOpen) {
                                buttonOpen.style.display = 'flex';
                            }
                        }}>x</button>
                        <input className="input" type="text" id="riotid" placeholder="Riot#ID" />
                        <select className="input" id="region">
                            <optgroup label="Americas" className="Americas">
                                <option value="BR1">Brazil</option>
                                <option value="NA1">North America</option>
                                <option value="LA1">Latin America North</option>
                                <option value="LA2">Latin America South</option>
                            </optgroup>
                            <optgroup label="Europe" className="Europe">
                                <option value="EUW1">Europe West</option>
                                <option value="EUN1">Europe Nordic and East</option>
                                <option value="RU">Russia</option>
                            </optgroup>
                            <optgroup label="Asia" className="Asia">
                                <option value="KR">Republic of Korea</option>
                                <option value="JP1">Japan</option>
                                <option value="TW2">Taiwan, Hong Kong, and Macao</option>
                                <option value="TH2">Thailand</option>
                                <option value="VN2">Vietnam</option>
                                <option value="TR1">Turkey</option>
                                <option value="SG2">Singapore</option>
                            </optgroup>
                            <optgroup label="Oceania" className="Oceania">
                                <option value="OC1">Oceania</option>
                            </optgroup>
                        </select>
                        <input className="input" type="button" value="Pesquisar" id="search_button" />
                    </div>
                </div>
                <div id="input-container" className="input_containerSyle">
                    <input className="input" type="text" id="riotid" placeholder="Riot#ID" />
                    <select className="input" id="region">
                        <optgroup label="Americas" className="Americas">
                            <option value="BR1">Brazil</option>
                            <option value="NA1">North America</option>
                            <option value="LA1">Latin America North</option>
                            <option value="LA2">Latin America South</option>
                        </optgroup>
                        <optgroup label="Europe" className="Europe">
                            <option value="EUW1">Europe West</option>
                            <option value="EUN1">Europe Nordic and East</option>
                            <option value="RU">Russia</option>
                        </optgroup>
                        <optgroup label="Asia" className="Asia">
                            <option value="KR">Republic of Korea</option>
                            <option value="JP1">Japan</option>
                            <option value="TW2">Taiwan, Hong Kong, and Macao</option>
                            <option value="TH2">Thailand</option>
                            <option value="VN2">Vietnam</option>
                            <option value="TR1">Turkey</option>
                            <option value="SG2">Singapore</option>
                        </optgroup>
                        <optgroup label="Oceania" className="Oceania">
                            <option value="OC1">Oceania</option>
                        </optgroup>
                    </select>
                    <input className="input" type="button" value="Pesquisar Usuário" id="search_button" />
                </div>
                <div id="matchHistoryContainer">
                    <div id="match1" className="matches"></div>
                    <div id="match2" className="matches"></div>
                    <div id="match3" className="matches"></div>
                    <div id="match4" className="matches"></div>
                    <div id="match5" className="matches"></div>
                    <div id="match6" className="matches"></div>
                    <div id="match7" className="matches"></div>
                    <div id="match8" className="matches"></div>
                    <div id="match9" className="matches"></div>
                    <div id="match10" className="matches"></div>
                </div>
            </div>
        </div>
    );
}

