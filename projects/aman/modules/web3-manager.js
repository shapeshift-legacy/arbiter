const config = require("../configs/env")

const Web3 = require('web3');
const web3 = new Web3();
const w3ws = new Web3();
const { ETH_DAEMON_HTTP_URL, ETH_DAEMON_WS_URL } = config

const provider = new Web3.providers.HttpProvider(ETH_DAEMON_HTTP_URL)
const socketProvider = new Web3.providers.WebsocketProvider(ETH_DAEMON_WS_URL)

web3.setProvider(provider);
w3ws.setProvider(socketProvider);

module.exports = { web3, provider, w3ws }
