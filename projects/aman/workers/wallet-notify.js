const request = require('request')
const { subscriber } = require('../modules/redis-manager')
const { WALLET_NOTIFY_URL } = require('../configs/env')
const log = require('@arbiter/dumb-lumberjack')()

var get_request = function(url) {
  return new Promise((resolve, reject) => {
    log.info("url:", url)
    request(url, function(error, response, body) {
      if (!error && response.statusCode === 200) {
        resolve(body)
      } else {
        log.error("error in get_request: ", error)
        reject(error)
      }
    })
  })
}

subscriber.subscribe("aman-credits");
subscriber.on("message", async function(channel, payloadS) {
  try {
    log.debug("payloadS: ", payloadS)
    let payload = JSON.parse(payloadS)
    log.debug("payload: ", payload)

    //push txid
    let url = WALLET_NOTIFY_URL + payload.txid
    await get_request(url)
  } catch (e) {
    log.error("Error: ", e)
  }
})
