
const config = require('../configs/env')
const { web3 } = require('./web3-manager')
const log = require('@arbiter/dumb-lumberjack')()

let NETWORK

const getNetworkType = () => {
  return new Promise((resolve, reject) => {
    if ( NETWORK ) {
      resolve(NETWORK)
    } else {
      web3.eth.net.getNetworkType().then(network => resolve(network)).catch(reject)
    }
  })
}

web3.eth.net.getNetworkType().then(network => {
  NETWORK = network
}).catch(ex => {
  log.error(`error checking network, this will probably not end well...`, ex)
})


module.exports = getNetworkType
