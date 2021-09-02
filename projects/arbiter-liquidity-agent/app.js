
/*
 Arbiter liquidity agent

 Goals:
 Remarket orders onto arbiter that will trade at a profit

 Logics:
 on startup cancel all orders

 start ws events and queue it

 get exchange orderbook

 this is in a loop:

 replay ws events until wsQue is empty

 store exchangeOrderbook in mongo

 create laOrderbook

 get hotwallet balances

 get liquidity buffer size

 remarket tips of bids/asks at x profit

 publish orders

 store orders in laOrderbookCurrent for different markets

 on match event trade on exchange

 */
// require('dotenv').config()

// require('dotenv').config();
// const config = require("./configs/env")

let TAG = " | app | "

const log = require('@arbiter/dumb-lumberjack')()

try
{

    let state = {
        wsEvent: {
            queue: []
        },
        process: {
            isRunning: false,
            finishedFirstRound: false
        }
    }

    let params = process.argv
    log.debug("params: ", params)

    let market = params[2]
    // market = "LTC_BTC"
    if (!market) throw Error('100: market MUST be configured manually!')

    state.market = market

// const config = require('./configs/env')
//console.log(config)
// const Redis = require('then-redis')
// const pubsub = require('redis')
// const subscriber = pubsub.createClient('redis://' + config.REDIS_IP + ':' + config.REDIS_PORT)

    let liquidityAgent = require('./modules/binance/orderBook')

    liquidityAgent.start(state)


} catch (e) {
    console.error(TAG, e)
}
