/*
    Finds Forwarding contracts that have have unflushed funds

    Subscribes to all payments and checks

    iterates over all addresses on slow timer looking for straglers
 */

const {redis, publisher, subscriber} = require('../modules/redis-manager')
const log = require('@arbiter/dumb-lumberjack')()
let client = require('../modules/eth-wallet.js')

subscriber.subscribe("aman-credits");
subscriber.on("message", async function(channel, payloadS) {
  try {

    let payload = JSON.parse(payloadS)
    let address = payload.to

    //add for sweep
    let add_for_sweep = function(address) {
      redis.sadd("queue:eth:flush", address)
    }

    setTimeout(add_for_sweep, 1000 * 60, address)
  } catch (e) {
    log.error("Error: ", e)
  }
})

let scan_for_work = async function() {
  try {
    let allAddresses = await redis.smembers("eth:wallet")

    for (let i = 0; i < allAddresses.length; i++) {
      let address = allAddresses[i]
      let balance = await client.getBalanceAddress(address)

      if (balance > 0)
        redis.sadd("queue:eth:flush", address)
    }
  } catch (e) {
    log.error("Bad action: ", e)
  }
}

scan_for_work()
