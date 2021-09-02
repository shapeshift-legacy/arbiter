/*

        Audit all transfer history

        Depsoits into binance

        Withdrawals from binanace


 */


//require('dotenv').config({path:"../.env"});
require('dotenv').config();
const TAG = " | audit-transfer-worker | "
const log = require('@arbiter/dumb-lumberjack')()
const config = require("../configs/env")

//redis
//redis
const util = require('@arbiter/arb-redis')
//const redis = util.redis
const Redis = require('then-redis')
const redis = Redis.createClient('redis://' + config.REDIS_IP + ':' + config.REDIS_PORT)
const publisher = util.publisher


/*
    MONGO

        fomo schema
  [
  'binance-balances',
  'binance-credits',
  'binance-debits',
  'binance-transfers',
  'binance-trades',
  'binance-txs',
  'binance-history'
  ]
 */

let mongo = require('@arbiter/arb-mongo')


let do_work = async function () {
    let tag = TAG + ' | do_work | '
    try {
        let workLeft = await redis.llen('queue:transfers:audit')
        log.debug('orders left in queue: ', workLeft)
        let transfer = await redis.blpop('queue:transfers:audit',10)

        if (transfer){
            log.info(tag, 'transfer: ', transfer)
            transfer = JSON.parse(transfer[1])
            mongo['binance-txs'].insert(transfer)


            //TODO more stuffs? (build checkpoints)
            //let normalizedTX = await audit.digestTransfer(transfer)


            let workLeft = await redis.llen('queue:transfers:audit')

            log.debug('orders left in queue: ', workLeft)
            do_work()
        } else {
            do_work()
        }
    } catch (e) {
        console.error(tag, 'e: ', e)
        console.error(tag, 'Bad action: ', e)
        do_work()
    }
}


do_work()
log.info(TAG+'worker started!')
