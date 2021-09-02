
/*
        Match engine API
                    -highlander

        Single threaded in memory match engine
        * High performance (1000+ trades per second)
        * multi-market scalable 1 thread per market

*/

const TAG = ' | TRADE ENGINE | '
require('dotenv').config()
const parse = require('co-body')
const koa = require('koa')
const _ = require('koa-route')
const cors = require('kcors')
const bodyParser = require('koa-bodyparser')
const util = require('@arbiter/arb-redis')
const redis = util.redis
const publisher = util.publisher
const log = require('@arbiter/dumb-lumberjack')()
//
const matchEngine = require('./modules/match.js')
const Accounting = require('@arbiter/arb-accounting')
const accounting = new Accounting(redis)

const config = require("./configs/env")
if(!config.AGENT_BTC_MASTER) throw Error("invalid configs! missing AGENT_BTC_MASTER")

let params = process.argv
let port = params[2]
let market = params[3]

// let port   = 5001
// let market = "ETH_BTC"
if (!port) throw Error('100: ports MUST be configured manually!')
if (!market) throw Error('100: market MUST be configured manually!')

// Create the app
const Koa = require('koa')
const app = new Koa()
app.use(cors())
app.use(bodyParser())

// init engine
let engine = matchEngine.createEngine(market)

// Mongo modules
// const collections = require('./modules/mongo.js')
// let match = collections.match

let mongo = require('@arbiter/arb-mongo')

// globals
let maxInputSize = '1kb'

/*
    Routes:
        * lastprice
        * status
        * limit
        * cancel

    TODO:
        More trade types! enforced atomically
 */

let isOnline = false

const controler = {

    //
    shutdown: async (ctx) => {
        let tag = TAG + ' | orderbook | '
        let debug = true
        let output = {}
        try {
            isOnline = false
            ctx.body = true
        } catch (e) {
            output.success = false
            output.error = e
            ctx.body = output
        }
    },

    orderbook: async (ctx) => {
        let tag = TAG + ' | orderbook | '
        let debug = true
        let output = {}
        try {
            log.debug(tag, 'body: ', ctx.request.body)
            let orderBook = engine.getMarketData()
            ctx.body = orderBook
        } catch (e) {
            console.error(tag,e)
            output.success = false
            output.error = e
            ctx.body = output
        }
    },
    lastprice: async (ctx) => {
        let tag = TAG + ' | lastprice | '
        let debug = true
        let output = {}
        try {
            // log.debug(tag, 'body: ', ctx.request.body)

            ctx.body = engine.lastprice()
        } catch (e) {
            output.success = false
            output.error = e
            ctx.body = output
        }
    },
    globals: async (ctx) => {
        let tag = TAG + ' | orderbook | '
        let debug = true
        let output = {}
        try {
            //get global
            let global = {
                lastPrice:0.00848,
                volume24h:1336.30,
                pctChange24h:-0.51,
                pctChange1h:0.01,
                lowBid:0.00848,
                highAsk:0.00818,
                high24:0.0086348,
                low24:0.008438
            }

            ctx.body = global
        } catch (e) {
            console.error(tag,e)
            output.success = false
            output.error = e
            ctx.body = output
        }
    },
    status: async (ctx) => {
        let tag = TAG + ' | status | '
        let debug = true
        let output = {}
        try {
            log.debug(tag, 'body in: ', ctx.request.body)
            ctx.body = engine.status(ctx.params.orderId)
            log.debug(tag, 'body out: ', ctx.body)
        } catch (e) {
            output.success = false
            output.error = e
            ctx.body = output
        }
    },
    //
    limit: async (ctx) => {
        let tag = TAG + ' | limit | '
        let output = {}
        try {
            if(isOnline){
                // log.debug(tag, 'body: ', ctx.request.body)
                let quantity = ctx.request.body.quantity
                let price = ctx.request.body.price
                let id = ctx.request.body.id

                if (!quantity) throw Error(' quantity required')
                if (!price) throw Error('price required')
                if (!id) throw Error('id required')

                //TODO validate accounting before submission
                // let coins = market.split("_")
                // log.debug(tag,coins)
                //
                // let isValid = false
                // //TODO check balance of order
                // if(quantity < 0){
                //     //ask
                //
                //     let balance = await redis.hgetall(id,coins[0])
                //     log.debug(tag,"balance: ",balance)
                //
                //     if(Math.abs(quantity) === (balance/10000000)){
                //         isValid = true
                //     }
                // } else {
                //     //bid
                //     //enough BTC to cover bid?
                //     let balance = await redis.hgetall(id,coins[1])
                //     log.debug(tag,"balance: ",balance)
                //
                //     let amount = Math.abs(quantity) * price
                //
                // }

                log.debug(tag, 'body in: ', ctx.request.body)
                ctx.body = engine.submitOrder({ id, quantity, price })

                log.debug(tag, 'body out: ', ctx.body)
            } else {
                output.success = false
                output.error = "1: exchange is currently OFFLINE!"
                ctx.body = output
            }

        } catch (e) {
            output.success = false
            output.error = e
            ctx.body = output
        }
    },
    //
    cancel: async (ctx) => {
        let tag = TAG + ' | cancel | '
        let debug = true
        let output = {}
        try {
            // log.debug(tag, 'body: ', ctx.request.body)
            let orderId = ctx.request.body.orderId

            if (!orderId) throw Error('orderId required')

            ctx.body = engine.cancelOrder(orderId)

            log.debug(tag, 'orderId', orderId)
        } catch (e) {
            output.success = false
            output.error = e
            ctx.body = output
        }
    },
}

// endpoints
app.use(_.get('/globals', controler.globals))
app.use(_.get('/orderbook', controler.orderbook))
app.use(_.get('/lastprice', controler.lastprice))
app.use(_.get('/status/:orderId', controler.status))
app.use(_.post('/limit', controler.limit))
app.use(_.post('/cancel', controler.cancel))

// app.use(route.get('/orderbook', function *() {
//     this.set('Access-Control-Allow-Origin', '*');
//     //this.body = engine.getMarketData()
//     this.body = ["fee","fi"]
// }));
//
// app.use(route.get('/lastprice', function *() {
//     this.set('Access-Control-Allow-Origin', '*');
//     this.body = engine.lastPrice()
// }));
//
// app.use(route.get('/status/:orderId', function *(orderId) {
//     this.set('Access-Control-Allow-Origin', '*');
//     this.body = engine.getStatus(orderId)
// }));
//
// app.use(route.post('/limit', function *(next) {
//     if ('POST' != this.method) return yield next;
//     let body = yield parse(this, {limit: maxInputSize});
//     // if (debug) {
//     console.log(tag,"limit: ", body)
//     // }
//     //Validate call
//     //if (!body.pair) this.throw(400, '.pair required');
//     if (!body.quantity) this.throw(400, '.quantity required');
//     if (!body.price) this.throw(400, '.price required');
//     if (!body.id) this.throw(400, '.id required');
//     // expecting a promise after yield
//
//     //async
//     this.body = engine.submitOrder({id: body.id, quantity: body.quantity, price: body.price})
// }));
//
// app.use(route.post('/cancel', function *(next) {
//     if ('POST' != this.method) return yield next;
//     let body = yield parse(this, {limit: maxInputSize});
//     console.log(tag,"cancel: ", body)
//     if (!body.orderId) this.throw(400, '.orderId required');
//     //Validate call
//     let response = engine.cancelOrder(body.orderId)
//     this.body = response
//
// }));

// publish
engine.on('match', async function (restingOrder, aggressiveOrder, restingOrderPrice, matchQuantity) {
    let tag = TAG + ' | MATCH EVENT! | '
    try {
        let matchEvent = {
            engine: market,
            time: new Date().getTime(),
            restingOrder,
            aggressiveOrder,
            restingOrderPrice,
            matchQuantity,
        }

        let accountingEvents = []

        try {
            let balances = await accounting.match(matchEvent)
            log.debug(tag, 'balances: ', balances)
            // // Record history
            matchEvent.balances = balances
        } catch (e) {
            // TODO throw in production! never push trade with bad accounting
            // Best action is to shut down trading and audit
            console.error(tag, 'e: ', e)
            throw e
        }

        //lookup ownership
        let aggessiveInfoVerbose = await redis.hgetall(aggressiveOrder.id)
        let restingInfoVerbose = await redis.hgetall(restingOrder.id)
        log.debug(tag,"aggessiveInfoVerbose: ",aggessiveInfoVerbose)
        log.debug(tag,"restingInfoVerbose: ",restingInfoVerbose)
        matchEvent.restingInfoVerbose = restingInfoVerbose
        matchEvent.aggessiveInfoVerbose = aggessiveInfoVerbose

        // if LA
        // if LA
        if(aggessiveInfoVerbose.owner === "liquidityAgent"){
            //debit outgoing coin
            let debitAmount = aggessiveInfoVerbose[aggessiveInfoVerbose.coinOut]
            debitAmount = debitAmount / 100000000
            log.debug(tag,"debitAmount: ",debitAmount)


            let resultOrderBalanceLA

            //TODO wtf??? why if else? just make id/orderId consistiant???
            // id and orderId has the same info
            // (reply to above) yes, agreed. There seems to be cases where one order has id and not orderId, vise versa
            // but it has not been thoroughly tested, and currently this works for now, and not sure how much this will take
            // to clean up, def will need to clean up in the future
            if(aggressiveOrder.id)  {
                resultOrderBalanceLA = await accounting.debit(aggressiveOrder.id,debitAmount,aggessiveInfoVerbose.coinOut)
            }
            else if (aggressiveOrder.orderId)  {
                resultOrderBalanceLA = await accounting.debit(aggressiveOrder.orderId,debitAmount,aggessiveInfoVerbose.coinOut)
            }

            //credit account
            let accountingEvent = {
                account:aggessiveInfoVerbose.account,
                type:"CREDIT",
                asset:aggessiveInfoVerbose.coinOut,
                amount:debitAmount
            }
            accountingEvents.push(accountingEvent)

            let resultAccountBalanceLA = await accounting.credit(aggessiveInfoVerbose.account,debitAmount,aggessiveInfoVerbose.coinOut)
            matchEvent.resultOrderBalanceLAAggressive = resultOrderBalanceLA
            matchEvent.resultAccountBalanceLAAggressive = {coin:aggessiveInfoVerbose.coinOut,resultAccountBalanceLA}

            if (aggressiveOrder.quantity === 0) {
                try {
                    // remove the fulfilled LA order
                    await redis.srem(aggessiveInfoVerbose.account + ':orders', aggressiveOrder.id)
                    await redis.srem('live', aggressiveOrder.id)

                    log.debug('aggressive LA order fulfilled...')

                    let liveOrders = await redis.smembers('live')
                    log.debug('liveOrders...', liveOrders)
                } catch (e) {
                    log.error(tag, 'remove fulfilled LA order from LA account orders and redis live', e)
                }
            }

            log.debug('aggessiveInfoVerbose', aggessiveInfoVerbose)
            log.debug('aggressiveInfoVerbose.coinIn------', aggessiveInfoVerbose.coinIn)

            let message = {
                event:"accountUpdate",
                account:aggessiveInfoVerbose.account,
                asset:aggessiveInfoVerbose.coinOut,
                orderId: aggressiveOrder.id,
                quantity: aggressiveOrder.quantity,
                eventDescription:"Match Event!",
                eventSummary:" Bought " +debitAmount+ " ("+aggessiveInfoVerbose.coinOut+") at price: "+restingOrderPrice,
                newBalance:resultAccountBalanceLA,
                // newBalanceAccount: aggessiveInfoVerbose.type == 'bid' 
                //                         ? resultAccountBalanceLA / 100000000
                //                         : resultAccountBalanceLA,

                newBalanceAccount: resultAccountBalanceLA / 100000000,
                type: 'match',
                market: market,
                isBuy: aggessiveInfoVerbose.type,
                coinIn: aggessiveInfoVerbose.coinIn,
                coinOut: aggessiveInfoVerbose.coinOut                   
            }
            publisher.publish("publishToFront",JSON.stringify(message))
        }

        if(restingInfoVerbose.owner === "liquidityAgent"){
            //debit outgoing coin
            let debitAmount = restingInfoVerbose[restingInfoVerbose.coinOut]
            debitAmount = debitAmount / 100000000
            log.debug(tag,"debitAmount: ",debitAmount)

            let resultOrderBalanceLA

            // id and orderId has the same info
            if(restingOrder.id)  {
                resultOrderBalanceLA = await accounting.debit(restingOrder.id,debitAmount,restingInfoVerbose.coinOut)
            }
            else if (restingOrder.orderId)  {
                resultOrderBalanceLA = await accounting.debit(restingOrder.orderId,debitAmount,restingInfoVerbose.coinOut)
            }

            //credit account
            let accountingEvent = {
                account:restingInfoVerbose.account,
                type:"CREDIT",
                asset:aggessiveInfoVerbose.coinOut,
                amount:debitAmount
            }
            accountingEvents.push(accountingEvent)

            let resultAccountBalanceLA = await accounting.credit(restingInfoVerbose.account,debitAmount,restingInfoVerbose.coinOut)
            matchEvent.resultOrderBalanceLAResting = resultOrderBalanceLA
            matchEvent.resultAccountBalanceLAResting = {coin:restingInfoVerbose.coinOut,resultAccountBalanceLA}

            if (restingOrder.quantity === 0) {
                try {
                    // remove the fulfilled LA order
                    await redis.srem(restingInfoVerbose.account + ':orders', restingOrder.id)
                    await redis.srem('live', restingOrder.id)
                    
                    log.debug('restingOrder LA fulfilled...')
                    let liveOrders = await redis.smembers('live')
                    log.debug('liveOrders...', liveOrders)

                } catch (e) {
                    log.error(tag, 'remove fulfilled LA order from LA account orders and redis live', e)
                }
            }

            log.debug('restingInfoVerbose', restingInfoVerbose)
            log.debug('restingInfoVerbose.coinIn------', restingInfoVerbose.coinIn)


            let message = {
                event:"accountUpdate",
                account:restingInfoVerbose.account,
                asset:restingInfoVerbose.coinOut,
                orderId: restingOrder.id,
                quantity: restingOrder.quantity,
                eventDescription:"Match Event!",
                eventSummary:" Bought " +debitAmount+ " ("+restingInfoVerbose.coinOut+") at price: "+restingOrderPrice,
                newBalance:resultAccountBalanceLA,                                 
                newBalanceAccount: resultAccountBalanceLA / 100000000,
                type: 'match',
                market: market,
                isBuy: restingInfoVerbose.type,
                coinIn: restingInfoVerbose.coinIn,
                coinOut: restingInfoVerbose.coinOut              
            }
            publisher.publish("publishToFront",JSON.stringify(message))
        }

        // debit order
        // credit again


        // order x bought x coin at x rate
        // order y sold x coin at x rate

        // save to mongo
        // match.insert(matchEvent)
        // matchEvent.accounting = accounting
        matchEvent.market = market
        // publish
        log.debug(tag, 'match: ', matchEvent)

        await mongo['match-history'].insert(matchEvent)

        publisher.publish('match', JSON.stringify(matchEvent))
    } catch (e) {
        console.error(tag, 'E: ', e)
        throw e
    }
})

// publish
let persist_saved_orders = async function () {
    let tag = TAG + ' | persist_saved_orders | '
    try {
        // get all live orders
        let allOrders = await redis.smembers('live')
        log.debug(tag, 'allOrders: ', allOrders)
        log.debug(tag, 'orderCount: ', allOrders.length)

        for (let i = 0; i < allOrders.length; i++) {
            let order = allOrders[i]
            log.debug(tag, 'order: ', order)
            let orderInfo = await redis.hgetall(order)
            log.debug(tag, 'orderInfo: ', orderInfo)
            // if correct market
            let orderMarket = orderInfo.market
            log.debug(tag, 'orderMarket: ', orderMarket)
            if (market === orderMarket) {
                let id = orderInfo.orderId
                let quantity = orderInfo.quantity
                let price = orderInfo.price
                log.info(tag, ' submit: ', { id, quantity, price })
                let success = engine.submitOrder({ id, quantity, price })
                log.debug(tag, 'success: ', success)
            } else {
                // ignore
            }
        }
        return true
    } catch (e) {
        log.error(e)
    }
}

// persistience
let startup = async function (app) {
    try {

        //Global Shutdown
        let globalStatus = await redis.get("globalMarketStatus")

        //TODO unnerf
        globalStatus = "online"
        if(globalStatus === 'online'){
            isOnline = true
            let persistSuccess = await persist_saved_orders()
            if (!persistSuccess) throw Error('failed to persist orders!')
            app.listen(port)
            console.log(TAG, 'Match engine is now running at http://localhost:' + port)
        }else{
            throw Error("100: Global status is currently in emergency mode!")
        }
    } catch (e) {
        log.error(e)
    }
}
startup(app)
