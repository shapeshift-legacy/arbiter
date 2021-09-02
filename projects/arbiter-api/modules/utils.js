
const log = require('@arbiter/dumb-lumberjack')()
const config = require("../configs/env")

const pause = function(seconds) {
  log.debug(`pausing ${seconds} seconds`)
  return new Promise((resolve, reject) => {
    setTimeout(resolve, seconds*1000)
  })
}

const isClone = coin => {
  return config.BTC_CLONES.includes(coin.toUpperCase())
}

module.exports = { pause, isClone }
