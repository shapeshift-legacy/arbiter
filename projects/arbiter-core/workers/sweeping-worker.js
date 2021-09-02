const log = require('@arbiter/dumb-lumberjack')()
const { redis, newClient } = require('@arbiter/arb-redis')
const fullfillment = require('../modules/fullfillment.js')
const views = require("@arbiter/arb-views")
const RedisQueue = require('../modules/redis-queue')
const facc = require('../modules/fulfillment-accounting')

const sweepingQueue = new RedisQueue('queue:orders:sweeping', newClient())
const accountingQueue = new RedisQueue('queue:accounting:sweeping', newClient())

sweepingQueue.onMessage(async orderId => {
  try {
    let sweepData = await fullfillment.sweep(orderId)
    let workLeft = await redis.llen('queue:orders:sweeping')
    log.debug(`${workLeft} items left in fulfillment queue`)

    views.displayJsonToChannel(sweepData.txidSweep, "sweep: " + orderId, "help")

    redis.rpush('queue:accounting:sweeping', JSON.stringify(sweepData))
  } catch (ex) {
    log.error(`Sweep Error ${orderId}: `, ex)

    redis.hset(orderId, "errorSweep", ex).catch(err => {
      log.error(`error setting fulfillment error`, err)
    })

    if ( /missing inputs/i.test(ex.message) ) {
      redis.rpush('queue:orders:sweeping', orderId).then(res => {
        log.info(`${orderId} requeued for sweeping`, res)
      }).catch(ex => {
        log.error(`${orderId} failed to requeue for sweeping`, ex)
      })
    }
  }
}).onError(ex => {
  log.error(`error reading from order queue`, ex)
})

accountingQueue.onMessage(async data => {
  try {
    await facc.accountForSweep(data.orderId, data)
  } catch (ex) {
    log.error(`Error during sweep accounting ${data.orderId}: `, ex)
    // retry if there was an error
    redis.rpush('queue:accounting:sweeping', data)
  }
})
