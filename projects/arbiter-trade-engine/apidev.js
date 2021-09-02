
/*
        Match engine API
                    -highlander

        Single threaded in memory match engine
        * High performance (1000+ trades per second)
        * multi-market scalable 1 thread per market

*/

const TAG = ' | MATCH | '

require('dotenv').config()
const parse = require('co-body')
const koa = require('koa')
const _ = require('koa-route')
const cors = require('kcors')
const bodyParser = require('koa-bodyparser')
const util = require('./modules/redis')
const redis = util.redis
const publisher = util.publisher
const log = require('@arbiter/dumb-lumberjack')()
//
const matchEngine = require('./modules/match.js')
const Accounting = require('@arbiter/arb-accounting')
const accounting = new Accounting(redis)

let params = process.argv
let port = 5000
let market = "LTC_BTC"

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

const controler = {
    //
    orderbook: async (ctx) => {
        let tag = TAG + ' | orderbook | '
        let debug = true
        let output = {}
        try {
            // if (debug) console.log(tag, 'body: ', ctx.request.body)

            ctx.body = engine.getMarketData()
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
            // if (debug) console.log(tag, 'body: ', ctx.request.body)

            ctx.body = engine.lastprice()
        } catch (e) {
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
            if (debug) console.log(tag, 'body in: ', ctx.request.body)
            ctx.body = engine.status(ctx.params.orderId)
            if (debug) console.log(tag, 'body out: ', ctx.body)
        } catch (e) {
            output.success = false
            output.error = e
            ctx.body = output
        }
    },
    //
    limit: async (ctx) => {
        let tag = TAG + ' | limit or injectTx | '
        let debug = true
        let output = {}
        try {
            // if (debug) console.log(tag, 'body: ', ctx.request.body)
            let quantity = ctx.request.body.quantity
            let price = ctx.request.body.price
            let id = ctx.request.body.id

            if (!quantity) throw Error(' quantity required')
            if (!price) throw Error('price required')
            if (!id) throw Error('id required')

            if (debug) console.log(tag, 'body in: ', ctx.request.body)
            ctx.body = engine.submitOrder({ id, quantity, price })

            if (debug) console.log(tag, 'body out: ', ctx.body)
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
            // if (debug) console.log(tag, 'body: ', ctx.request.body)
            let orderId = ctx.request.body.orderId

            if (!orderId) throw Error('orderId required')

            ctx.body = engine.cancelOrder(orderId)
        } catch (e) {
            output.success = false
            output.error = e
            ctx.body = output
        }
    },
}

// endpoints
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
    let tag = TAG + ' | match | '
    let debug = true
    try {
        let matchEvent = {
            engine: market,
            time: new Date().getTime(),
            restingOrder,
            aggressiveOrder,
            restingOrderPrice,
            matchQuantity
        }
        try {
            let balances = await accounting.match(matchEvent)
            if (debug) console.log(tag, 'balances: ', balances)
            // Record history
            matchEvent.balances = balances
        } catch (e) {
            // TODO throw in production! never push trade with bad accounting
            // Best action is to shut down trading and audit

            console.error(tag, 'e: ', e)
        }

        // order x bought x coin at x rate
        // order y sold x coin at x rate

        // save to mongo
        //match.insert(matchEvent)

        matchEvent.market = market
        // publish
        if (debug) console.log(tag, 'match: ', matchEvent)
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
        let persistSuccess = await persist_saved_orders()
        if (!persistSuccess) throw Error('failed to persist orders!')
        app.listen(port)
        console.log(TAG, 'Match engine is now running at http://localhost:' + port)
    } catch (e) {
        log.error(e)
    }
}
startup(app)
