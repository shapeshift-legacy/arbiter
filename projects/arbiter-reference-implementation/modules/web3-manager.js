const config = require("../configs/env")

const Web3 = require('web3')
const web3 = new Web3()
const w3ws = new Web3()
const log = require('@arbiter/dumb-lumberjack')()
const { WEB3_HTTP_URL, WEB3_WS_URL } = config

let provider

if ( WEB3_HTTP_URL && WEB3_WS_URL ) {
  provider = new Web3.providers.HttpProvider(WEB3_HTTP_URL)
  const socketProvider = new Web3.providers.WebsocketProvider(WEB3_WS_URL)

  web3.setProvider(provider)
  w3ws.setProvider(socketProvider)
} else if ( process.env.NODE_ENV === "test" ) {
  log.warn(`Either WEB3_HTTP_URL or WEB3_WS_URL is not set, automated tests for ETH will not work`)
}

module.exports = { web3, provider, w3ws }
