
/*
        TODO setIntervial on return orders

        Grabbed from old code!

 */
require('dotenv').config()
const TAG = ' | app | '
const arbiter = require('./modules/arbiter.js')

//audit exchanges
const exchange = require('@arbiter/arbiter-exchange-controller')
exchange.initialize()

//audit custodial API
const custody = require('./modules/custody.js')
//custody.initialize()

//TODO audit wallets


// Pub/Subs
const match = require('./modules/match.js')

// const Redis = require('promise-redis')();
// const redis = Redis.createClient();
const util = require('@arbiter/arb-redis')
const redis = util.redis
const log = require('@arbiter/dumb-lumberjack')()


const get_all_orders = async function () {
    let tag = TAG + ' | get_all_orders | '
    log.debug(tag, 'Checkpoint1')
    try {
        let now = new Date().getTime()
        log.debug(tag, 'now: ', now)
        let allOrders = await redis.zrevrangebyscore('orders_by_expiration', '+inf', '-inf', 'withscores')
        log.debug(tag, 'allOrders: ', allOrders)

        // expired orders
        for (let i = 0; i < allOrders.length; i++, i++) {
            log.debug(tag, 'order: ', allOrders[i])
            let time = allOrders[i + 1]
            log.debug(tag, 'time: ', time)
            log.debug(tag, 'now: ', now)
            if (time < now) {
                log.debug(' EXPIRED! ')
            } else {
                let timeLeft = time - now
                log.debug(allOrders[i] + ' NOT expired! left: ', timeLeft / 1000)
            }
        }
    } catch (e) {
        console.error(tag, ' ERROR: ', e)
        throw 'Failed to return orders'
    }
}
get_all_orders()

const processes_orders_expired = async function () {
    let tag = TAG + ' | processes_orders_expired | '

    log.debug(tag, 'Checkpoint1')
    try {
        get_all_orders()
        let now = new Date().getTime()
        let expiredOrders = await redis.zrevrangebyscore('orders_by_expiration', now, 0)
        log.debug(tag, 'expiredOrders: ', expiredOrders)

        if (expiredOrders && expiredOrders.length > 0) {
            log.debug(tag, 'orders expired length:', expiredOrders.length)
            for (let i = 0; i < expiredOrders.length; i++) {
                try {
                    let result = await arbiter.cancel(expiredOrders[i])
                    log.debug(tag, 'result: ', result)
                    redis.zrem('orders_by_expiration', expiredOrders[i])
                } catch (e) {
                    console.error(tag, 'e: ', e)
                }
            }
        } else {
            log.debug(tag, 'idle')
        }
    } catch (e) {
        console.error(tag, ' ERROR: ', e)
        throw 'Failed to return orders'
    }
}

log.info('Running arbiter engine')
// set intervial
processes_orders_expired()
setInterval(processes_orders_expired, 1000 * 5)
