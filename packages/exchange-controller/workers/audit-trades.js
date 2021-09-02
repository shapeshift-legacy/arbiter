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

require('dotenv').config({path:"../.env"});
const TAG = " | audit-trade-worker | "
const log = require('@arbiter/dumb-lumberjack')()
const config = require("../configs/env")

//
const util = require('../modules/redis')
//const redis = util.redis
const Redis = require('then-redis')
const redis = Redis.createClient('redis://' + config.REDIS_IP + ':' + config.REDIS_PORT)
const publisher = util.publisher

let audit = require("../modules/audit.js")
let mongo = require('@arbiter/arb-mongo')

//mongo
let {reportLA,credits,debits,trades} = require('../modules/mongo.js')

/*
    INPUT

    Trade:

    {
    "_id" : ObjectId("5b823f9caa253e323424361b"),
    "symbol" : "ETHBTC",
    "id" : 19441156,
    "orderId" : 50981149,
    "price" : "0.08960800",
    "qty" : "0.12500000",
    "commission" : "0.00001120",
    "commissionAsset" : "BTC",
    "time" : 1515654538768.0,
    "isBuyer" : false,
    "isMaker" : false,
    "isBestMatch" : true
    }


    OUTPUT

    debit:

    {
    "_id" : ObjectId("5b82499050cbd631dd7ad2d4"),
    "id" : 19441156,
    "time" : 1515654538768.0,
    "tradeId" : 50981149,
    "amount" : 0.011201,
    "coin" : "BTC",
    "account" : "master:binance"
    }

    credit:

    {
        "_id" : ObjectId("5b82499050cbd631dd7ad2d3"),
        "id" : 19441156,
        "time" : 1515654538768.0,
        "tradeId" : 50981149,
        "amount" : 0.1249888,
        "coin" : "ETH",
        "account" : "master:binance"
    }

 */

// const digest_trade = async function(trade){
//     let tag = TAG + " | digest_trade | "
//     try{
//
//         //market info
//         let marketInfo = await redis.hget('binance:markets',trade.symbol)
//         marketInfo = JSON.parse(marketInfo)
//         log.debug(tag,'marketInfo: ',marketInfo)
//
//         let credit = {}
//         let debit = {}
//
//         credit.id = trade.id
//         debit.id = trade.id
//
//         credit.time = trade.time
//         debit.time = trade.time
//
//         credit.tradeId = trade.orderId
//         debit.tradeId = trade.orderId
//
//
//
//         //TODO multi-asset handle
//         if(trade.isBuyer){
//             log.info("IsBuyer acquiring quote disposing base")
//             credit.coin = marketInfo.baseAsset
//             debit.coin = marketInfo.quoteAsset
//
//             let amountBASE = trade.qty / (1/trade.price)
//             log.debug(tag,"amountBASE: ",amountBASE)
//
//             let amountQUOTE = trade.qty - trade.commission
//             log.debug(tag,"amountQUOTE: ",amountQUOTE)
//
//             credit.amount = amountQUOTE
//             debit.amount = amountBASE
//
//         }else{
//             log.info("IsSeller acquiring quote disposing base")
//             credit.coin = marketInfo.quoteAsset
//             debit.coin = marketInfo.baseAsset
//
//             let amountBASE = trade.qty / (1/trade.price)
//             log.debug(tag,"amountBASE: ",amountBASE)
//
//             let amountQUOTE = trade.qty - trade.commission
//             log.debug(tag,"amountQUOTE: ",amountQUOTE)
//
//             credit.amount = amountBASE
//             debit.amount = amountQUOTE
//         }
//
//
//         credit.account = "master:binance"
//         debit.account  = "master:binance"
//
//         //TODO summary
//         //only process each trade once
//         //let isNew = await redis.sadd("tradesProcessed",trade.id)
//         let isNew = true
//         if(isNew){
//             log.info(tag,"processed order: "+trade.id)
//             log.info(tag,"trade: ",trade)
//             log.info(tag,"credit: ",credit)
//             log.info(tag,"debit: ",debit)
//             //publish credit
//             publisher.publish("credits",JSON.stringify(credit))
//
//             //publish debit
//             publisher.publish("debits",JSON.stringify(debit))
//
//             //save to mongo
//             let isSaved = await credits.insert(credit)
//             log.debug(tag,'isSaved: ',isSaved)
//             let isSaved2 = await debits.insert(debit)
//             log.debug(tag,'isSaved2: ',isSaved2)
//             //insert into report
//
//         } else {
//             log.debug(tag," already processed ",trade.id)
//         }
//
//         return true
//     }catch(e){
//         log.error(e)
//     }
// }

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
