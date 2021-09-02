/*

        Audit all transfer history

        Depsoits into binance

        Withdrawals from binanace


 */


require('dotenv').config({path:"../.env"});
const TAG = " | audit-transfer-worker | "
const log = require('@arbiter/dumb-lumberjack')()
const config = require("../configs/env")

//redis
//redis
const util = require('../modules/redis')
//const redis = util.redis
const Redis = require('then-redis')
const redis = Redis.createClient('redis://' + config.REDIS_IP + ':' + config.REDIS_PORT)
const publisher = util.publisher

let audit = require("../modules/audit.js")

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
let views = require('../../views')

//mongo
// let {reportLA,credits,debits,trades} = require('../modules/mongo.js')
//
// const digest_transfer = async function(transfer){
//     let tag = TAG + " | digest_trade | "
//     try{
//         let credit = {}
//
//         //params
//         credit.coin = transfer.asset
//         credit.amount = transfer.amount
//         credit.account = config.AGENT_BTC_MASTER+":binance"
//         credit.onChain = true
//         credit.txid = transfer.txId
//         credit.id = transfer.txId
//         credit.time = transfer.insertTime
//
//         //TODO this is redundant if index is enforced in mongo
//         //if isNew
//         //let isNew = await redis.sadd("transfersProcessed",credit.id)
//         let isNew = true
//         if(isNew){
//             log.info(tag," Discovered new deposit! txid: ",credit.txid)
//             //publish
//             await publisher.publish("credits",JSON.stringify(credit))
//             //save
//             let isSaved = await credits.insert(credit)
//             log.info(tag,"isSaved: ",isSaved)
//
//             //ONLY on chain txids should be saved in redis
//             log.debug(tag,"credit: ",credit)
//             credit._id = credit._id.toString()
//             redis.hmset(credit.txid,credit)
//         } else {
//             log.debug(tag,"already processed txid: ",credit.id)
//         }
//         return true
//     }catch(e){
//         log.error(e)
//     }
// }


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
