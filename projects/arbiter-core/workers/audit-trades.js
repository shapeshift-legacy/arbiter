/*
    Digest trade history

    input:

     { id: 13668569,
    orderId: 52514636,
    price: '0.01313400',
    qty: '0.01000000',
    commission: '0.00001000',
    commissionAsset: 'LTC',
    time: 1530124289025,
    isBuyer: true,
    isMaker: false,
    isBestMatch: true }

    output:


        Credit
            qty - fee

        Debit
            qty/price

 */

// require('dotenv').config({path:"../.env"});
require('dotenv').config();
const TAG = " | audit-trade-worker | "
const log = require('@arbiter/dumb-lumberjack')()
const config = require("../configs/env")

//
const util = require('@arbiter/arb-redis')
//const redis = util.redis
const Redis = require('then-redis')
const redis = Redis.createClient('redis://' + config.REDIS_IP + ':' + config.REDIS_PORT)
const publisher = util.publisher

let mongo = require('@arbiter/arb-mongo')




let do_work = async function () {
    let tag = TAG + ' | do_work | '
    try {
        let workLeft = await redis.llen('queue:trades:audit')
        log.debug('orders left in queue: ', workLeft)
        let trade = await redis.blpop('queue:trades:audit',10)

        if (trade){
            log.info(tag, 'trade: ', trade)
            trade = JSON.parse(trade[1])
            mongo['binance-txs'].insert(trade)

            //TODO more stuff? (build checkpoints)
            //await audit.digest(trade)


            let workLeft = await redis.llen('queue:trades:audit')
            log.debug('orders left in queue: ', workLeft)
            do_work()
        } else {
            do_work()
        }
    } catch (e) {
        // if error try again

        console.error(tag, 'e: ', e)
        console.error(tag, 'Bad action: ', e)
        do_work()
    }
}


do_work()
log.info(TAG+'worker started!')
