/**
 * Created by highlander on 3/2/17.
 */
const uuid = require('node-uuid')
const util = require('@arbiter/arb-redis')
const redis = util.redis
const publisher = util.publisher
// let subscriber = util.subscriber
const config = require("../configs/env")
const { btc,ltc,eth,gnt } = require('@arbiter/arb-daemons-manager').daemons
let wallets = { BTC:btc, LTC:ltc, ETH:eth, GNT:gnt }

let {reportARB, match,balances,credits,debits,orders,users} = require('./mongo.js')
// const collections = require('./../modules/mongo.js')
// let arbreport = collections.reportARB


const TAG = ' | arbiter | '
const txBuilder = require('./txBuilder.js')
const Accounting = require('@arbiter/arb-accounting')
const accounting = new Accounting(redis)
const hte = require('./hte.js')
const oracle = require('@arbiter/arb-oracle-client')
const markets = require('./markets.js')
// const fullfillment = require('./fullfillment2.js')
const rates = require('@arbiter/arb-rates')
const txDispatch = require('./txDispatch.js')
const signing = require('./signing.js')

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
    ETH: 60,
    GNT: 60
}

module.exports = {
    // start: function () {
    //     return initialize_match_engine()
    // },
    create: function (order) {
        return create_order(order)
    },
    fund: function (orderId, payment) {
        return fund_order(orderId, payment)
    },
    deposit: function (account, payment) {
        return credit_account_deposit(account, payment)
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

const credit_account_deposit = async function (account, payment) {
    // persistence
    let tag = ' | credit_account_deposit | '
    try {
        log.debug(tag,"input: ",{account, payment})

        //only credit txid ONCE
        let isNew = await redis.sadd("credits:txids",payment.txid)
        log.debug(tag,"isNew: ",isNew)
        if(isNew){
            // credit
            accounting.credit(account, payment.value, payment.coin)
            //publisher.publish("credits",JSON.stringify({account, value:payment.value, coin:payment.coin}))
            payment.account = account

            //save in mongo
            credits.insert(payment)
        }

    } catch (e) {
        console.error(tag, 'ERROR: ', e)
    }
}

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
        }
        // if(debug) console.log("orderbook: ",trade.getMarketData())
    } catch (e) {
        console.error(tag, 'ERROR: ', e)
    }
}

const return_order = async function (orderId) {
    let tag = TAG + ' | return_order | '
    let override = false // only try once and remove!!
    try {
        // LOCK move out so cant process
        let moved = await redis.smove('live', 'cancelled', orderId)
        if (!moved) throw Error('101: attempted to return order that is NOT LIVE! ')
        if (override) await redis.zrem('orders_by_expiration', orderId)

        log.debug(tag, 'Checkpoint1')
        let output = {
            event: 'cancel',
            orderId
        }
        publisher.publish('publish', JSON.stringify(output))
        //TODO needed cancel? or delete?
        publisher.publish('cancel', JSON.stringify(output))

        // let debug = false
        if (!orderId) throw Error('ERROR:102 can not return! Empty orderId ')
        log.debug(tag, 'Returning order: ', orderId)

        // Verify input is confirmed
        let orderInfo = await redis.hgetall(orderId)
        if (!orderInfo) throw Error('103 can not return! unknown order! ')
        if (orderInfo.txidOut) throw Error('104 can not return! unknown order! ')
        log.debug(tag, 'orderInfo: ', orderInfo)
        let accountInfo = await redis.hgetall(orderInfo.account)
        if (!accountInfo) throw Error('105 can not return! unknown account info! ')
        log.debug(tag, 'accountInfo: ', accountInfo)

        let successCancel = await hte.cancelOrder(orderInfo.market, orderId)
        //TODO throw on failure
        log.debug(tag, 'successCancel: ', successCancel)

        //

        let amount = orderInfo.amountIn

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

            let success = {
                orderId,
                status: 'cancelled',
                txid: broadcast
            }
            return success
        }
    } catch (e) {
        log.error(tag, 'ERROR:100 Returns Failed to return! order: ', orderId, e)

        try {
          await redis.hset(orderId, 'returnError', e.message)
          log.debug(`updated ${orderId} with returnError message`)
        } catch (ex) {
          log.error(`failed to update ${orderId} with returnError`, ex)
        }

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
        log.info(tag, 'orderId: ', orderId)
        log.info(tag, 'orderInfo: ', orderInfo)

        let isValid = validate_fundable(orderInfo)
        // if(!isValid) throw Error("105: unable to validate order!")

        // undate orderInfo
        let liveStatus = await redis.sadd('live', orderId)
        let statusStatus = await redis.hset(orderId, 'status', 'live')
        let txidInStatus = await redis.hset(orderId, 'txidIn', payment.txid)
        log.debug(tag, 'liveStatus: ', liveStatus)
        log.debug(tag, 'statusStatus: ', statusStatus)
        log.debug(tag, 'txidInStatus: ', txidInStatus)

        if (orderInfo.amountIn > payment.value) {
            // to little sent! TODO return!
            log.error(tag, ' User Sent to little in! expecting: ', orderInfo.amountIn, ' actual: ', payment.amount)
            await return_order(orderId)
            throw Error('101: failed to fund~! too little sent!')
        }

        // credit
        accounting.credit(orderId, payment.value, payment.coin)

        publisher.publish("credits",JSON.stringify({orderId, value:payment.value, coin:payment.coin}))

        // submit to market
        let tradeAmount = rates.getTradeAmount(payment, orderInfo)
        if(!tradeAmount) throw Error("102: unable to calcuate trade amount!")
        redis.hset(orderId,"price",orderInfo.rate)
        redis.hset(orderId,"quantity",orderInfo.rate)

        log.debug(tag, 'order info: ', {market:orderInfo.market, orderId, tradeAmount, rate:orderInfo.rate})
        let id = await hte.submitOrder(orderInfo.market, orderId, tradeAmount, orderInfo.rate)
        log.debug(tag, 'orderId: ', orderId)
        log.debug(tag, 'id: ', id)

        let publish = {
            event: 'submit',
            quantity:tradeAmount,
            rate:orderInfo.rate,
            orderId,
            status: 'live',
            payment
        }
        log.debug(tag,"publish SUBMIT:",publish)
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

        await validate_addresses(order,coinIn,coinOut)

        let amountOut = rates.getAmountOutEst(order)
        log.debug(tag, 'amountOut: ', amountOut)
        log.debug(tag, 'dust: ', config.DUST[coinOut.toUpperCase()])

        validate_dust(coinOut, amountOut)

        let orderInfo = Object.assign(order, {
          market: markets.marketFromPair(order.pair),
          account,
          owner: 'customer',
          amountOut,
          coinIn,
          coinOut,
          orderId,
          status: 'unfunded',
          timeCreation: now,
          // NOTE: assume expiration is in minutes!
          expiration: now + (order.expiration * 1000 * 60)
        })

        log.debug(tag,"expiration: ",orderInfo.expiration)
        redis.zadd('orders_by_expiration', orderInfo.expiration, orderId)

        await redis.hmset(orderId, orderInfo)
        let address = await txBuilder.buildAddress(numOfCoins[coinIn], orderInfo)
        if (!address) throw Error('110: failed to build address!')

        log.debug('(deposit) depositAddress: ', address)
        await redis.hset(orderId, 'depositAddress', address)

        // get addressInfo
        let orderFullInfo = await redis.hgetall(orderId)
        log.debug('orderFullInfo: ', orderFullInfo)
        reportARB.insert(orderFullInfo)

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
        output.maxDeposit = null
        output.minDeposit = null
        output.coinIn = coinIn
        output.coinOut = coinOut
        output.amountIn = order.amountIn
        // output.amountOut = input.amountOut
        output.rate = order.rate
        output.pair = order.pair


        publisher.publish('created', JSON.stringify(output))
        orders.insert(output)
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

let validate_addresses = function (order,coinIn,coinOut) {
    let isValid
    //validate return
    let returnAddress = order.returnAddress
    isValid = wallets[coinIn].validateAddress(returnAddress)
    if(!isValid) throw Error("102: invalid return address!")
    //validate withdraw
    let withdrawalAddress = order.withdrawalAddress
    isValid = wallets[coinOut].validateAddress(withdrawalAddress)
    if(!isValid) throw Error("103: invalid withdrawal address!")

    return isValid
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
    // Dont fund old orders
    // TODO this should be more broad
    if (orderInfo.status === 'live') throw Error('201: already live!')
    if (orderInfo.complete === 'true') throw Error('202: already complete!')
    if (orderInfo.status === 'cancelled') throw Error('203: already status!')
    if (orderInfo.status === 'returned') throw Error('204: already status!')
    if (orderInfo.txidOut) throw Error('205: already fullfilled!')
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
