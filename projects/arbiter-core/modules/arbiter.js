/**
 * Created by highlander on 3/2/17.
 */
const uuid = require('node-uuid')
const util = require('@arbiter/arb-redis')
const redis = util.redis
let publisher = util.publisher
// let subscriber = util.subscriber
const config = require("../configs/env")
let { btc,ltc,eth} = require('@arbiter/arb-daemons-manager').daemons

// const collections = require('./../modules/mongo.js')
// let arbreport = collections.reportARB


const TAG = ' | arbiter | '
const app = require('./txBuilder.js')
const Accounting = require('@arbiter/arb-accounting')
const accounting = new Accounting(redis)
const hte = require('./hte.js')
const oracle = require('@arbiter/arb-oracle-client')
const markets = require('./markets.js')
// const fullfillment = require('./fullfillment2.js')
const rates = require('@arbiter/arb-rates')
const txDispatch = require('./txDispatch.js')
const signing = require('./signing.js')

let {match,balances,credits,debits,orders,users} = require('./mongo.js')

// 1 market for each coin TODO more markets?
// Object.keys(config.daemons).forEach(function(coin) {
//     uwallet[coin] = new local_coin_client.Client(config.daemons[coin].daemon)
//
//     //markets
//     let market = coin+"-BTC"
//     //match engines
//     engines.push(match.createEngine(market))
// })

// logging
const log = require('@arbiter/dumb-lumberjack')()

// let homeAddress = {
//     LTC: 'mvMTsriz9LPCJeCCq4H245wcb7pJG1heb2',
//     BTC: 'mfrgm2JBCJigNvbQ2Pjorc2kSbvA211txc'
// }

// const market = "BTC-LTC";
// const market2 = "BTC-ETH";
// const market = "LTC-BTC";
// const market2 = "ETH-BTC";
// const trade = match.createEngine(market);
// const trade2 = match.createEngine(market2);

// const TAKERFEE = 0.2
// const MAKERFEE = 0.2


// TODO move this to config
const numOfCoins = {
    BTC: 0,
    BTC: 1,
    LTC: 2,
    LTC: 2.1,
    ETH: 60
}

module.exports = {
    start: function () {
        return initialize_match_engine()
    },
    create: function (order) {
        return create_order(order)
    },
    fund: function (orderId, payment) {
        return fund_order(orderId, payment)
    },
    cancel: function (orderId) {
        return return_order(orderId)
    },
    book: function (market) {
        return hte.getMarketData(market)
    },
    publish: function (object) {
        return publish(object)
    }
}

//* ***************************************************
// Primary
//* ***************************************************
const initialize_match_engine = async function () {
    // persistence
    let tag = ' | initialize_match_engine | '
    let debug = false
    try {
        let orders = await redis.smembers('live')
        log.debug(tag, 'orders: ', orders)

        // populate
        for (let i = 0; i < orders.length; i++) {
            log.debug(tag, 'order: ', orders[i])
            let orderId = orders[i]
            let orderInfo = await redis.hgetall(orderId)
            if(orderInfo){
                let tradeAmount = rates.getTradeAmount(orderInfo.amountIn, orderInfo)
                let id = await hte.submitOrder(orderInfo.market, orderId, tradeAmount, orderInfo.rate)
                log.info(tag,"id: ",id)
            }

        }
        // if(debug) console.log("orderbook: ",trade.getMarketData())
    } catch (e) {
        console.error(tag, 'ERROR: ', e)
    }
}

const return_order = async function (orderId) {
    let tag = TAG + ' | return_order | '
    let override = true // only try once and remove!!

    try {
        // LOCK move out so cant process
        let moved = await redis.smove('live', 'cancelled', orderId)
        if (override) await redis.zrem('orders_by_expiration', orderId)
        if (!moved) throw Error('101: attempted to return order that is NOT LIVE! ')

        log.debug(tag, 'Checkpoint1')
        let output = {
            event: 'cancel',
            orderId
        }
        publisher.publish('publish', JSON.stringify(output))

        // let debug = false
        if (!orderId) throw Error('ERROR:102 can not return! Empty orderId ')
        log.debug(tag, 'Returning order: ', orderId)

        // Verify input is confirmed
        let orderInfo = await redis.hgetall(orderId)
        if (!orderInfo) throw Error('103 can not return! unknown order! ')
        if (orderInfo.txidOut) throw Error('104 can not return! unknown order! ')
        log.debug(tag, 'orderInfo: ', orderInfo)
        let accountInfo = await redis.hgetall(orderInfo.signingAddress)
        if (!accountInfo) throw Error('105 can not return! unknown account info! ')
        log.debug(tag, 'accountInfo: ', accountInfo)

        let successCancel = await hte.cancelOrder(orderInfo.market, orderId)
        log.debug(tag, 'successCancel: ', successCancel)

        let amount = orderInfo.amountIn

        //TODO iterate
        if (orderInfo.coinIn === 'ETH' || orderInfo.coinIn === 'GNT') {
            let txidReturn = await txDispatch.dispatchETH(orderInfo, accountInfo, amount, orderInfo.coinIn)

            let successEth = {
                orderId,
                status: 'cancelled',
                txid: txidReturn
            }
            return successEth
        } else {
            let broadcast = await txDispatch.dispatchUTXO(orderInfo, accountInfo, amount)


            let debit = {}
            debit.sweep = true
            debit.coin = orderInfo.coinOut
            debit.orderId = orderId
            debit.txid = broadcast
            debit.amount = amount
            debit.address = orderInfo.withdrawalAddress
            publisher.publish("debits",JSON.stringify(debit))

            let success = {
                orderId,
                status: 'cancelled',
                txid: broadcast
            }
            return success
        }
    } catch (e) {
        log.error(tag, 'ERROR:100 Returns Failed to return! order: ', orderId, e)
        await redis.hmset(orderId, "error", true, "returnError", e)
        let success
        if (!override) success = await redis.zincrby('orders_by_expiration', 5 * 60 * 1000, orderId)
        if (override) success = await redis.zrem('orders_by_expiration', orderId)
        if (!success) throw Error('ERROR:110 can not return! DANGER! Failed to try again bro! ')
        throw Error('ERROR:101 Failed to return ')
    }
}

const fund_order = async function (orderId, payment) {
    let tag = TAG + ' | fund_order | '
    try {
        log.info(tag, 'Checkpoint1')
        log.info(tag, 'payment: ', payment)
        if (!orderId) throw Error('100: Cant credit payment to empty orderId')
        let orderInfo = await redis.hgetall(orderId)
        validate_payment(payment)
        // if (!payment.value) throw Error('102: invalid payment! value')
        // if (!payment.txid) throw Error('103: invalid payment! txid')
        // if (payment.value <= 0) throw Error('104: invalid payment! amount: ' + payment.amount)
        log.info(tag, 'orderId: ', orderId)
        log.info(tag, 'orderInfo: ', orderInfo)

        let isValid = validate_fundable(orderInfo)
        // if(!isValid) throw Error("105: unable to validate order!")

        // undate orderInfo
        let liveStatus = await redis.sadd('live', orderId)
        let statusStatus = await redis.hset(orderId, 'status', 'live')
        orders.update({orderId:orderId},{$set:{status:"live",txidIn:payment.txid}})
        let txidInStatus = await redis.hset(orderId, 'txidIn', payment.txid)
        log.info(tag, 'liveStatus: ', liveStatus)
        log.info(tag, 'statusStatus: ', statusStatus)
        log.info(tag, 'txidInStatus: ', txidInStatus)

        if (orderInfo.amountIn > payment.value) {
            // to little sent! TODO return!
            console.error(tag, ' User Sent to little in! expecting: ', orderInfo.amountIn, ' actual: ', payment.amount)
            await return_order(orderId)
            throw Error('101: failed to fund~! too little sent!')
        }

        // credit
        accounting.credit(orderId, payment.value, payment.coin)
        // submit to market
        let tradeAmount = rates.getTradeAmount(payment, orderInfo)
        let id = await hte.submitOrder(orderInfo.market, orderId, tradeAmount, orderInfo.rate)
        log.debug(tag, 'orderId: ', orderId)
        log.debug(tag, 'id: ', id)

        let publish = {
            event: 'status',
            orderId,
            status: 'live',
            payment
        }
        publisher.publish('publish', JSON.stringify(publish))

        let output = {
            success: true,
            payment,
        }
        return output
    } catch (e) {
        console.error(tag, ' Unable to fund order!!! ', e)
        throw e
    }
}

const create_order = async function (order) {
    let tag = TAG + ' | create_order | '
    try {
        let now = new Date().getTime()
        log.info(tag, 'order: ', order)
        let account = order.account


        let accountInfo = await redis.hgetall(account)
        if (!accountInfo) throw Error('99: Users MUST create an account first!')

        // Assign orderId
        let orderId = uuid.v4()
        redis.hset(orderId, 'orderId', orderId)
        redis.hset(orderId, 'signingAddress', account)
        redis.sadd('accountOrders:' + order.account, orderId)
        // get coinIn coinOut
        if (!order.pair) throw Error('100: Must send pair! ')

        validate_order(order)
        let coins = validate_coins(order)
        let coinIn = coins[0]
        let coinOut = coins[1]
        // check amounts

        let amountOut = rates.getAmountOutEst(order)
        log.debug(tag, 'amountOut: ', amountOut)
        log.debug(tag, 'dust: ', config.DUST[coinOut.toUpperCase()])

        // if (!config.dust[coinOut.toUpperCase()]) throw Error('109: dust levels not configured for coin! ' + coinOut)
        // if (amountOut < configs.dust[coinOut.toUpperCase()]) throw Error('110: Output amount too low! (dust) min:' + configs.dust[coinOut.toUpperCase()] + ' requested: ' + amountOut)

        validate_dust(coinOut, amountOut)

        //validate min/max
        let valueUSDIn = rates.getValueUSD(order.amountIn, coinIn, redis)
        if(valueUSDIn > 100) throw Error("101 Arbiter is not intended for large amounts untill out of BETA!")

        let orderInfo = {}

        orderInfo.market = markets.marketFromPair(order.pair)
        orderInfo.owner = 'customer'
        orderInfo.coinIn = order.pair
        orderInfo.rate = order.rate
        orderInfo.amountIn = order.amountIn
        orderInfo.amountOut = amountOut
        orderInfo.returnAddress = order.returnAddress
        orderInfo.withdrawalAddress = order.withdrawalAddress
        orderInfo.coinIn = coinIn
        orderInfo.coinOut = coinOut
        orderInfo.status = 'unfunded'
        // orderInfo.amountOut = amountOut //we cant know this??? right??
        orderInfo.timeCreation = now

        // NOTE: assume expiration is in minutes!
        orderInfo.expiration = now + (order.expiration * 1000 * 60)
        redis.zadd('orders_by_expiration', orderInfo.expiration, orderId)

        await redis.hmset(orderId, orderInfo)

        let address = await app.buildAddress(numOfCoins[coinIn], order.pubkey, orderId)
        // if (!address) throw Error('110: failed to build address!')
        await redis.hset(orderId, 'depositAddress', address)
        await redis.hset(address, 'orderId', orderId)
        console.log('(deposit) depositAddress: ', address)

        // get addressInfo
        let orderFullInfo = await redis.hgetall(orderId)
        log.debug('orderFullInfo: ', orderFullInfo)
        //arbreport.insert(orderFullInfo)

        // output
        let output = {}
        output.orderId = orderId
        output.pubkeyCustomer = order.pubkey
        output.pubkeyArbiter = orderFullInfo.pubkeyArbiter
        output.pubkeyOracle = orderFullInfo.pubkeyOracle
        // output.account = input.account
        output.depositAddress = address
        output.returnAddress = order.returnAddress
        output.withdrawalAddress = order.withdrawalAddress
        // output.maxDeposit = 'Not set'
        // output.minDeposit = 'Not set'
        output.coinIn = coinIn
        output.coinOut = coinOut
        output.amountIn = order.amountIn
        // output.amountOut = input.amountOut
        output.rate = order.rate
        output.pair = order.pair

        orders.insert(output)
        publisher.publish('created', JSON.stringify(output))
        return output
    } catch (e) {
        console.error(tag, 'Error: ', e)
        throw e
    }
}

/****************************************************
 // Lib
 //****************************************************/

let validate_dust = function (coinOut, amountOut) {
    let tag = TAG + ' | validate_dust | '
    log.info(tag, 'coinOut: ', coinOut)
    if (!config.DUST[coinOut.toUpperCase()]) throw Error('109: dust levels not configured for coin! ' + coinOut)
    if (amountOut < config.DUST[coinOut.toUpperCase()]) throw Error('110: Output amount too low! (dust) min:' + config.DUST[coinOut.toUpperCase()] + ' requested: ' + amountOut)
    return true
}

let validate_coins = function (order) {
    let tag = TAG + ' | validate_coins | '
    let coins = order.pair.split('_')
    let coinIn = coins[0]
    let coinOut = coins[1]
    log.debug(tag, 'coins: ', coins)

    let pairs = markets.pairs()
    if (pairs.indexOf(order.pair) === -1) throw Error('120: invalid pair')

    if (!numOfCoins[coinIn]) throw Error('101: unknown coin! coin: ' + coinIn)
    if (!numOfCoins[coinOut]) throw Error('102: unknown coin! coin: ' + coinOut)
    return coins
}

let validate_order = function (order) {
    if (!order.pubkey) throw Error('103: Must Send pubkey! ')
    if (!order.amountIn) throw Error('105: Must Send amountIn! ')
    if (!order.returnAddress) throw Error('106: Must Send returnAddress! ')
    if (!order.withdrawalAddress) throw Error('107: Must Send withdrawalAddress! ')
    if (!order.expiration) throw Error('108: Must Send expiration! ')
    return true
}

let validate_payment = function (payment) {
    if (!payment.value) throw Error('102: invalid payment! value')
    if (!payment.txid) throw Error('103: invalid payment! txid')
    if (payment.value <= 0) throw Error('104: invalid payment! amount: ' + payment.amount)
    return true
}

let validate_fundable = function (orderInfo) {
    // if (!orderInfo) throw Error('101: unable to validate empty order! ')
    // Dont fund old orders
    let valid = true
    if (orderInfo.status === 'live') throw Error('201: already live!')
    if (orderInfo.complete === 'true') throw Error('202: already complete!')
    if (orderInfo.status === 'cancelled') throw Error('203: already status!')
    if (orderInfo.status === 'returned') throw Error('204: already status!')
    if (orderInfo.txidOut) throw Error('205: already fullfilled!')
    return valid
}

// const submit_order = async function (orderId) {
//     // persistence
//     let tag = ' | initialize_match_engine | '
//     try {
//         let orderInfo = await redis.hgetall(orderId)
//         log.debug(tag, 'orderInfo: ', orderInfo)
//
//         let quantity
//         // populate
//         if (orderInfo.isBuy === 'false') {
//             quantity = parseFloat(orderInfo.quantity) * -1
//         } else {
//             quantity = orderInfo.quantity
//         }
//         let market = orderInfo.market
//         if (!market) {
//             console.error(tag, 'invalid order!', orderInfo)
//             throw Error('101: invalid order! failed to persist!')
//         }
//         hte.submitOrder(market, orderId, quantity, orderInfo.price)
//     } catch (e) {
//         console.error(tag, 'ERROR: ', e)
//     }
// }
//
// let publish = async function (object) {
//     let tag = ' | get_unspent_inputs | '
//     let debug = false
//     try {
//         // if(!object) object = {"market":"BTC-LTC","id":"b5849505-d8cd-4812-afe8-5c86f3532cfc","price":0.001,"quantity":0.004,"type":"ask","sequence":37}
//
//         publisher.publish('publish', JSON.stringify(object))
//         return 'done'
//     } catch (e) {
//         console.error(tag, 'ERROR: ', e)
//         throw e
//     }
// }
