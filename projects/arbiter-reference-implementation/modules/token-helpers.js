
const log = require('@arbiter/dumb-lumberjack')()
const config = require("../configs/env")

const isToken = coin => {
  return config.ETH_TOKENS.includes(coin.toUpperCase())
}

module.exports = { isToken }
