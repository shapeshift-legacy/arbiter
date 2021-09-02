

const log = require('@arbiter/dumb-lumberjack')()
const { w3ws } = require('../modules/web3-manager')

const FUNCTIONS_TO_RESTART = []

module.exports = function(func) {
  FUNCTIONS_TO_RESTART.push(func)

  w3ws._provider.on('end', ev => {
    log.error(`socket disconnected, restarting ${FUNCTIONS_TO_RESTART.length} listeners`, ev)

    try {
      w3ws.eth.clearSubscriptions()
    } catch (ex) {
      log.error(`error attempting to clear subscriptions, assuming it's because there are no subs`, ex)
    }

    for (let f of FUNCTIONS_TO_RESTART) {
      f()
    }
  })
}
