/*
    perform trades

    trade
        * queue based intake
        * Modes
            * safe: market sell all (oversell on dust)
            * safe-practical: market sell all (drop off dust)
            * greedy: ONLY trade at x percentage profit
            * smart: hold pct in reserve, intelgently select when to hodl


     Smart HODL algo
        * TODO


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

let app = require("../modules/liquidity.js")

const SATOSHI = 100000000

//mongo
let {reportLA,credits,debits,trades} = require('../modules/mongo.js')


/*
    Notes:
        So this digest gets called ONLY when a match event on arbiter hits
        AND one side of the trade is the L Agent

        We inverse because we are arbitaging

        Example:
         match = {
            market: 'LTC_BTC',
            orderId: '9b68203c-a2de-4e2d-92f2-49406bc07a74',
            partial:true,
            event: 'trade',
            time: 1530907455128,
            type: 'bid',
            quantity: 0.0043364232558
        }

        state = {
        market: 'LTC_BTC',
          orderId: '9b68203c-a2de-4e2d-92f2-49406bc07a74',
          quantity: '-0.05042',
          rate: '0.012605',
          type: 'ask',
          owner: 'liquidityAgent',
          LTC: '4608358',
          price: '0.012605',
          BTC: '5466'
       }


       Summary
            We disposed of LTC
            We need to aquire some LTC to replace

       Response transaction:


 */

const digest_trade = async function(trade){
    let tag = TAG + " | digest_trade | "
    try{
        log.debug("trade: ",trade)

        let type
        let coin
        let amount
        let price

        //getorderInfo
        let orderInfo = await redis.hgetall(trade.orderId)
        log.debug("orderInfo: ",orderInfo)

        //find coin
        let coins = trade.market.split("_")
        //reverse type
        if(trade.type === "ask"){
            type = "bid"

        }
        if(trade.type === "bid"){
            type = "ask"
            coin = coins[0]

            let amountSatoshi =  orderInfo[coins[1]]
            log.debug("amountSatoshi: ",amountSatoshi)
            let amountCountAsset = amountSatoshi / SATOSHI
            log.debug("amountCountAsset: ",amountCountAsset)
            amount = amountCountAsset / parseFloat(trade.price)
            log.debug("amount: ",amount)
            amount = amount.toFixed(8)
        }


        price = trade.price

        //perform
        log.debug(tag,"trade: ",{type, coin, amount, price})
        app.trade("binance", type, coin, amount, price)


        return true
    }catch(e){
        log.error(e)
    }
}

let do_work = async function () {
    let tag = TAG + ' | do_work | '
    try {
        let workLeft = await redis.llen('queue:tradeing')
        log.debug('orders left in queue: ', workLeft)
        let trade = await redis.blpop('queue:tradeing',10)

        if (trade){
            log.info(tag, 'trade: ', trade)
            trade = JSON.parse(trade[1])

            await digest_trade(trade)
            let workLeft = await redis.llen('queue:tradeing')
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
