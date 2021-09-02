const path = require('path')
const fs = require('fs')
const log = require('@arbiter/dumb-lumberjack')()
const tokenDir = path.join(__dirname, '../coins/')
const tokenListABI = fs.readdirSync(tokenDir)
const { TOKENS } = require('../configs/env')
const { web3 } = require('./web3-manager')
const Contract = require('./contract')

let knownTokens = {/* addr: symbol */}
let knownTokensAddys = [/* addrs */]
let tokenAddressBySymbol = {/* symbol: addr */}
let tokenContracts = {}
let abis = {}

for (let i = 0; i < tokenListABI.length; i++) {
    let token = tokenListABI[i]
    token = token.split(".")
    token = token[0].toUpperCase()

    let abiInfo = require("../coins/"+token+".abi.js")
    let metaData = abiInfo.metaData
    let addr = metaData.contractAddress.toLowerCase()
    let contract = new Contract({
      abi: abiInfo.ABI,
      address: metaData.contractAddress
    })

    abis[token] = abiInfo
    tokenContracts[token] = contract
    knownTokens[addr] = token
    knownTokensAddys.push(addr)
    tokenAddressBySymbol[token] = addr
}

log.debug(`knownTokens`, knownTokens)
log.debug(`knownTokensAddys`, knownTokensAddys)

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
  return TOKENS.includes(symbol.toUpperCase())
}

const contractForToken = symbol => {
  let contract = tokenContracts[symbol.toUpperCase()]

  if ( contract === undefined ) {
    throw Error(`could not find contract for ${symbol}`)
  }

  return contract
}

const baseForToken = symbol => {
  let abi = abis[symbol.toUpperCase()]

  if ( abi === undefined ) {
    throw Error(`could not find abi for ${symbol}`)
  }

  return abi.metaData.BASE
}

module.exports = {
  isToken,
  baseForToken,
  contractForToken,
  contractAddress,
  isKnownTokenAddress,
  tokenForAddress
}
