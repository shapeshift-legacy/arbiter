const log = require('@arbiter/dumb-lumberjack')()
const { redis } = require('@arbiter/arb-redis')
const fullfillment = require('../modules/fullfillment.js')
const views = require("@arbiter/arb-views")
const RedisQueue = require('../modules/redis-queue')
const Redis = require('ioredis')
const { REDIS_IP, REDIS_PORT } = require('../configs/env')

const facc = require('../modules/fulfillment-accounting')

const fulfillmentQueue = new RedisQueue('queue:orders:fullfillment', new Redis(REDIS_PORT, REDIS_IP))
const accountingQueue = new RedisQueue('queue:accounting:fulfillment', new Redis(REDIS_PORT, REDIS_IP))

fulfillmentQueue.onMessage(async orderId => {
  try {
    let txid = await fullfillment.fullfill(orderId)
    let workLeft = await redis.llen('queue:orders:fullfillment')
    log.debug(`${workLeft} items left in fulfillment queue`)

    views.displayJsonToChannel(txid, "fullment: " + orderId, "help")

    // push it onto the queue for sweeping
    redis.rpush('queue:orders:sweeping', orderId).then(res => {
      log.info(`${orderId} placed onto queue for sweeping`, res)
    }).catch(ex => {
      log.error(`${orderId} failed to get on sweeping queue`, ex)
    })
    redis.rpush('queue:accounting:fulfillment', JSON.stringify({ orderId, txid }))
  } catch (ex) {
    log.error(`Fulfillment Error ${orderId}: `, ex)

    redis.hset(orderId, "error:fulfillment", ex.message).catch(err => {
      log.error(`error setting fulfillment error`, err)
    })
  }
}).onError(ex => {
  log.error(`error reading from order queue`, ex)
})

accountingQueue.onMessage(async data => {
  let { orderId, txid } = data

  if ( !orderId || !txid ) {
    log.error(`Unexpected message format in queue:orders:accounting, expected "{ orderId, txid }"; data:`, data)
    return
  }

  try {
    await facc.accountForFulfillment(orderId, txid)
  } catch (ex) {
    log.error(`Error during accounting ${orderId}: `, ex)
    // retry if there was an error
    redis.rpush('queue:accounting:fulfillment', data)
  }
})
