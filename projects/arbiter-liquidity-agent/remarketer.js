
/*
    Arbiter liquidity agent

    Goals:
        Remarket orders onto arbiter that will trade at a profit


    RTS socket events

    strategy

    on startup cancel all orders

    get orderbook (exchange)

    get hotwallet balances

    get liquidity buffer size

    remarket tips of bids/asks at x profit

    on match event trade on exchange

 */
let TAG = " | app | "

const winston = require('winston');
const logger = new (winston.Logger)({
    transports: [
        new (winston.transports.Console)(),
        new (winston.transports.File)({ filename: 'match.log' })
    ]
});

const uuid = require('node-uuid');
const Redis = require('then-redis')
const redis = Redis.createClient('tcp://localhost:6379');

const exchanges = {}
exchanges.bittrex  = require('./exchanges/bittrex-client.js')

const pubsubLib = require("redis")
    , subscriber = pubsubLib.createClient()
    , publisher = pubsubLib.createClient();



//******************************************
// polling
//******************************************



let run_polling = async function () {
    let tag = TAG+" | run_polling | "
    let debug = true
    try{
        if(debug) console.log(tag," ")
        let now = new Date().getTime()

        //TODO cancel all order

        //get bittrix books
        let orderbook = await exchanges.bittrex.getorderbook('BTC_LTC')
        if(debug) console.log(tag,"orderbook:  ",orderbook)

        //place lowest ask / highest bid
        let lowestAsk = orderbook.sell[0]
        let highestBid = orderbook.buy[0]

        if(debug) console.log(tag,"lowestAsk:  ",lowestAsk)
        if(debug) console.log(tag,"highestBid:  ",highestBid)

        let buyEvent = {
            time:now,
            event:'submit',
            orderId:uuid.v4(),
            quantity:highestBid.Quantity,
            rate:highestBid.Rate,
            type:'bid'
        }
        publisher.publish('tradeAgent',JSON.stringify(buyEvent))

        let sellEvent = {
            time:now,
            event:'submit',
            orderId:uuid.v4(),
            quantity:lowestAsk.Quantity,
            rate:lowestAsk.Rate,
            type:'ask'
        }
        publisher.publish('tradeAgent',JSON.stringify(sellEvent))

    }catch(e){
        console.error(tag,"ERROR: ", e)
        throw "ERROR:BALANCE:100 failed to find balance"
    }
}

run_polling()
setInterval(run_polling,1000 * 10)