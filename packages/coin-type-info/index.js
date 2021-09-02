const coininfo = require('./coin-info')
const ethTokenUtils = require('./lib/eth-token-utils')

const info = coin => {
  return coininfo[coin]
}

const utils = Object.assign({}, ethTokenUtils)

module.exports = {
  info,
  utils
}
