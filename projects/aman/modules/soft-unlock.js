
const { web3 } = require('./web3-manager')
const { ETH_UNLOCK_PW } = require('../configs/env')
const log = require('@arbiter/dumb-lumberjack')()

async function softUnlock(account) {
  try {
    let unlocked = await web3.eth.personal.unlockAccount(account, ETH_UNLOCK_PW)

    if ( !unlocked ) {
      log.warn(`failed to unlock ${account} with ETH_UNLOCK_PW`)
    } else {
      log.debug('successfully unlocked ', account)
    }
  } catch (ex) {
    log.warn(`error attempting to unlock account`)
    log.debug(ex.message)
  }
}

module.exports = softUnlock
