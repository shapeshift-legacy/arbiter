const path = require('path')
const fs = require('fs')
const tokenDir = path.join(__dirname, '../eth-token-abis/')
const tokenListABI = fs.readdirSync(tokenDir)
const Web3 = require('web3')
const web3 = new Web3()
const coininfo = require('../coin-info')

let knownTokens = {/* addr: symbol */}
let knownTokensAddys = [/* addrs */]
let tokenAddressBySymbol = {/* symbol: addr */}
let tokenContracts = {}
let abis = {}
let tokens = []

for (let coin in coininfo) {
  if ( coininfo[coin].type === "ETH_TOKEN" ) {
    tokens.push(coin)
  }
}

for (let i = 0; i < tokenListABI.length; i++) {
    let token = tokenListABI[i]
    token = token.split(".")
    token = token[0].toUpperCase()

    let abiInfo = require("../eth-token-abis/"+token+".abi.js")
    let metaData = abiInfo.metaData
    let addr = metaData.contractAddress.toLowerCase()
    let contract = new web3.eth.Contract(abiInfo.ABI, metaData.contractAddress)

    abis[token] = abiInfo
    tokenContracts[token] = contract
    knownTokens[addr] = token
    knownTokensAddys.push(addr)
    tokenAddressBySymbol[token] = addr
}

const contractAddress = token => {
  return tokenAddressBySymbol[token.toUpperCase()]
}

const isKnownTokenAddress = addr => {
  return !!knownTokens[addr]
}

const tokenForAddress = addr => {
  return knownTokens[addr.toLowerCase()]
}

const isToken = symbol => {
  return tokens.includes(symbol.toUpperCase())
}

const contractForToken = symbol => {
  let contract = tokenContracts[symbol.toUpperCase()]

  if ( contract === undefined ) {
    throw `could not find contract for ${symbol}`
  }

  return contract
}

const baseForToken = symbol => {
  let abi = abis[symbol.toUpperCase()]

  if ( abi === undefined ) {
    throw `could not find abi for ${symbol}`
  }

  return abi.metaData.BASE
}

const isEthBased = coin => {
  coin = coin.toUpperCase()
  return coin === "ETH" || isToken(coin)
}

module.exports = {
  isEthBased,
  isToken,
  baseForToken,
  contractForToken,
  contractAddress,
  isKnownTokenAddress,
  tokenForAddress
}
