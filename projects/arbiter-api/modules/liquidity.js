

/*
    Liquidity agent API

    REDIS pub/sub api

    real time eventing

    Accounting!

    Build despot addresses

    send from hot

    credit deposits

    get balances
 */
let TAG = ' | Liquidty API | '
const uuid = require('node-uuid')
const util = require('@arbiter/arb-redis')
const redis = util.redis
let publisher = util.publisher
let subscriber = util.subscriber
const Big = require('big.js')

// logging
const log = require('@arbiter/dumb-lumberjack')()

// modules

const hte = require('./hte.js')

const Accounting = require('@arbiter/arb-accounting')
const accounting = new Accounting(redis)

const { daemons } = require('@arbiter/arb-daemons-manager')
let { match, balances, credits, debits, orders, users, ordersLA } = require('./mongo.js')
let mongo = require('@arbiter/arb-mongo')
const SATOSHI = 100000000

/*****************************************
 //   module
 //*****************************************/

module.exports = {
    info: function (account) {
        return account_info(account)
    },
    balance: function (account, coin) {
        return account_balance(account, coin)
    },
    balances: function (account) {
        return account_balances(account)
    },
    address: function (account, coin) {
        return account_address(account, coin)
    },
    addresses: function (account) {
        return account_addresses(account)
    },
    order: function (account, orderId) {
        return get_order(account, orderId)
    },
    validate: function (account, market, orderId, quantity, rate, type, owner) {
        return validate_order(account, market, orderId, quantity, rate, type, owner)
    },
    accounting: function (account, market, orderId, quantity, rate, type, owner) {
        return order_accounting(account, market, orderId, quantity, rate, type, owner)
    },
    submit: function (account, market, orderId, quantity, rate, type, owner) {
        return order_submission(account, market, orderId, quantity, rate, type, owner)
    },
    orders: function (account) {
        return get_orders(account)
    },
    withdraw: function (account, coin, address, amount) {
        return account_withdraw(account, coin, address, amount)
    },
    limit: function (account, orderId, market, quantity, rate, type, nonce) {
        return create_order(account, orderId, market, quantity, rate, type, nonce)
    },
    cancel: function (account, nonce, orderId) {
        return cancel_order(account, nonce, orderId)
    },
    // TODO history
}

/*****************************************
 //   PubSub
 //*****************************************/

// subscriber.subscribe('tradeAgent')
// subscriber.on('message', async function (channel, payloadS) {
//     let tag = TAG + ' | tradeAgent pub/sub | '
//     try {
//         log.debug(tag, 'payloadS: ', payloadS)

//         log.info(tag, 'typeof payloadS !!!', typeof payloadS)

//         let body = JSON.parse(payloadS)
//         //mongo['arbiterLa-queries'].insert(body)
//         log.info(tag, 'typeof body', typeof body, body)

//         let payload = body.payload
//         log.debug(tag, 'payload: ', payload)
//         let account = body.account
//         log.debug(tag, 'account: ', account)
//         if (!payload || !payload.event) {
//             log.error('invalid event!', payloadS)
//             throw Error('101: invalid event!')
//         }
//         let event = payload.event
//         let orderId
//         let nonce
//         //mongo['arbiterLa-queries'].insert(payload)

//         switch (event) {
//             case 'submit':
//                 log.debug(tag, 'payload: ', payload)
//                 // submit
//                 if (!payload.orderId) throw Error('102: missing orderId')
//                 if (!payload.market) throw Error('103: missing market')
//                 if (!payload.quantity) throw Error('103: missing quantity')
//                 if (!payload.rate) throw Error('104: missing rate')
//                 if (!payload.type) throw Error('105: missing type')

//                 let market = payload.market
//                 orderId = payload.orderId
//                 let quantity = payload.quantity
//                 let rate = payload.rate
//                 let type = payload.type
//                 nonce = payload.nonce

//                 let result = await create_order(account, orderId, market, quantity, rate, type, nonce)
//                 log.debug(tag, 'result: ', result)

//                 //
//                 publisher.publish('submitEvents', JSON.stringify(result))

//                 break
//             case 'cancel':
//                 // cancel
//                 if (!payload.orderId) throw Error('112: missing orderId')
//                 if (!payload.nonce) throw Error('113: missing nonce')

//                 if (!account) {
//                     log.error(tag, 'invalid event missing account: ', payloadS)
//                     throw Error('102: missing account')
//                 }
//                 orderId = payload.orderId
//                 nonce = payload.nonce

//                 //
//                 let resultCancel = await cancel_order(account, nonce, orderId)
//                 log.debug(tag, 'resultCancel: ', resultCancel)

//                 //
//                 publisher.publish('cancelEvents', JSON.stringify(resultCancel))

//                 break
//             default:
//                 console.error(tag, ' unhandled event: ', event)
//         }
//     } catch (e) {
//         console.error(tag, 'Error: ', e)
//     }
// })

/*****************************************
 //   primary
 //*****************************************/

const get_order = async function (account, orderId) {
    let tag = TAG + ' | get_order | '
    try {
        let output = await redis.hgetall(orderId)
        return output
    } catch (e) {
        console.error(tag, e)
        log.error('ERROR: ', e)
        throw e
    }
}

const get_orders = async function (account) {
    let tag = TAG + ' | get_orders | '
    try {
        let output = []

        let orders = await redis.smembers(account + ':orders')

        // get order info on each
        for (let i = 0; i < orders.length; i++) {
            let orderInfo = await redis.hgetall(orders[i])
            output.push(orderInfo)
        }

        return output
    } catch (e) {
        console.error(tag, e)
        log.error('ERROR: ', e)
        throw e
    }
}
/*

        TODO atomic order

        (if failed DON'T STEEL MONIEZ BRO)


 */
const create_order = async function (account, orderId, market, quantity, rate, type, nonce) {
    let tag = TAG + ' | create_order | '
    try {
        log.debug(tag, 'inputs: ', { orderId, account, market, quantity, rate, type, nonce })
        let output = {}
        output.account = account
        log.debug(tag,"account: ",account)
        // submit
        if (!market) throw Error('103: missing market')
        if (!quantity) throw Error('103: missing quantity')
        if (!rate) throw Error('104: missing rate')
        if (!type) throw Error('105: missing type')

        if (!orderId) orderId = uuid.v4()
        output.orderId = orderId
        output.id = orderId

        //nonce
        if(!nonce) throw Error("106: missing nonce")
        let accountNonce = await redis.hget(account,"nonce")
        if(!accountNonce) accountNonce = 0

        if(nonce < accountNonce) throw Error("117: nonce too low! account: "+accountNonce+" given: "+nonce)
        await redis.hset(account,"nonce",parseInt(nonce))

        let coins = market.split('_')
        let coinIn
        let coinOut
        let amountQuote
        let coinFunding
        if (type === 'ask') {
            coinIn = coins[0]
            coinOut = coins[1]
            amountQuote = quantity * -1
            coinFunding = coinIn
        } else {
            coinIn = coins[1]
            coinOut = coins[0]

            quantity = quantity * rate
            amountQuote = quantity

            coinFunding = coins[1]
        }
        log.debug(tag, 'type: ', type)
        log.debug(tag, 'coinIn: ', coinIn)
        log.debug(tag, 'coinOut: ', coinOut)
        log.debug(tag, 'coinFunding: ', coinFunding)
        log.debug(tag, 'account: ', account)
        log.debug(tag, 'quantity: ', quantity)
        log.debug(tag, 'amountQuote: ', quantity)


        //
        let owner = 'liquidityAgent'
        log.info(tag, 'LA market: ' + market, ' type: ', type, ' quantity: ', amountQuote, ' ')
        let orderInfo = { account, market, orderId, amountQuote, rate, type, owner, coinIn, coinOut, coinFunding }
        if (!await redis.hmset(orderId, orderInfo)) throw Error('109 Failed to save in redis! ')

        let isValid = await validate_order(account, market, orderId, quantity, rate, type, owner)
        if (!isValid) throw Error('106: overdraft! can not submit order!')

        // moved
        let accountResp = await order_accounting(account, market, orderId, quantity, rate, type, owner)
        let isAccounted = accountResp.success
        if (!isAccounted) throw Error('108: accounting error! can not submit order!')

        let isSubmitted
        // moved
        if(type === 'ask') {
            isSubmitted = await order_submission(account, market, orderId, amountQuote, rate, type, owner)
        } else {
            isSubmitted = await order_submission(account, market, orderId, amountQuote/rate, rate, type, owner)
        }

        // if(!isValid) throw Error("108: Failed to submit order to engine!")
        // //TODO re-credit accounts that failed to submit

        // indexed by LA
        redis.sadd(account + ':orders', orderId)
        redis.sadd('live', orderId)

        let event = {
            event: "accountUpdate",
            account,
            type: 'submit', 
            status: 'live',
            orderId,
            rate,
            newBalanceAccount: accountResp.newBalance,
            market,
            eventSummary: "new order created! orderId "+ orderId,
            isBuy: type === 'bid'
                ? true
                : false,
            coinIn,
            coinOut,
            quantity: type === 'bid'
                ? quantity / rate 
                : quantity
        }

        log.info("**** pushing new order to front!")
        log.info('event', event)

        publisher.publish("publishToFront",JSON.stringify(event))

        output.isValid = isValid
        output.isAccounted = isAccounted
        output.isSubmitted = isSubmitted
        output.newBalance = accountResp.newBalance

        if (!isValid || !isAccounted || !isSubmitted) {
            log.error(tag, ' Failed to create order! ', output)
            //revert?
        }

        return output
    } catch (e) {
        log.error('ERROR: ', e)
        throw e
    }
}

const cancel_order = async function (account, nonce, orderId) {
    let tag = TAG + ' | cancel_order | '
    try {
        if (!account) throw Error('101: missing account! ')
        if (!orderId) throw Error('101: missing orderId! ')

        //enforce nonce
        //nonce
        if(!nonce) throw Error("106: missing nonce")
        let accountNonce = await redis.hget(account,"nonce")
        if(!accountNonce) accountNonce = 0

        if(nonce < accountNonce) throw Error("117: nonce too low! account: "+accountNonce+" given: "+nonce)
        await redis.hset(account,"nonce",parseInt(nonce))

        let output = {}
        output.account = account
        output.orderId = orderId
        log.debug(tag, 'input: ', { account, orderId })
        // get orderInfo
        let orderInfo = await redis.hgetall(orderId)
        if (!orderInfo) throw Error('102: unknown order!')
        if (orderInfo.status === 'cancelled') throw Error('125: already cancelled!')
        output.orderInfo = orderInfo
        log.debug(tag, 'orderInfo: ', orderInfo)

        let type = orderInfo.type
        log.debug(tag, 'type', type)

        let cancelRedis = await redis.srem(account + ':orders', orderId)
        log.debug(tag, ' cancelRedis: ', cancelRedis)

        let cancel = await hte.cancelOrder(orderInfo.market, orderId)
        output.cancel = cancel
        log.debug(tag, ' cancel: ', cancel)

        //
        // update order
        redis.hset(orderId, 'status', 'cancelled')

        // remove from live
        redis.smove('live', 'cancelled', orderId)

        // get balance coinIn
        let balanceIn = await accounting.balance(orderId, orderInfo.coinIn)
        let balanceOut = await accounting.balance(orderId, orderInfo.coinOut)
        output.balanceIn = balanceIn
        output.balanceOut = balanceOut
        log.debug(tag,"balanceIn: ",balanceIn)
        log.debug(tag,"balanceOut: ",balanceOut)



        // debug balance before
        let balanceBefore = await accounting.balance(account, 'BTC')
        log.debug(tag, 'balanceBefore: ', balanceBefore)

        if (balanceIn > 0) {
            log.info(tag,"Balance found in deposit coin! moving to account")

            let debitSuccess = await accounting.debit(orderId, balanceIn, orderInfo.coinIn)
            log.debug(tag, 'debitSuccess: ', debitSuccess)

            // credit account
            let creditSuccess = await accounting.credit(account, balanceIn, orderInfo.coinIn)
            log.debug(tag, 'creditSuccess: ', creditSuccess)
            output.newBalance = creditSuccess / SATOSHI
        }

        if (balanceOut > 0) {
            log.error(tag,"Balance found in withdrawl coin! This should never happen! ")
            // let debitSuccess = await accounting.debit(orderId, balanceOut, orderInfo.coinOut)
            // log.debug(tag, 'debitSuccess: ', debitSuccess)
            //
            // // credit account
            // let creditSuccess = await accounting.credit(account, balanceOut, orderInfo.coinOut)
            // log.debug(tag, 'creditSuccess: ', creditSuccess)
        }

        // this is copied from order_accounting
        let event = {
            event: "accountUpdate",
            account,
            type: 'cancel', 
            status: 'cancelled',
            orderId,
            newBalanceAccount: output.newBalance,
            market: orderInfo.market,
            orderInfo,
            eventSummary : "order cancelled! orderId "+ orderId,
            isBuy: type === 'bid'
                ? true
                : false,
            coinIn: orderInfo.coinIn,
            coinOut: orderInfo.coinOut    
        }

        log.debug("**** pushing cancelled order to front!")

        publisher.publish("publishToFront",JSON.stringify(event))

        try{
            mongo['arbiterLa-cancels'].insert(output)
        }catch(e){
        }

        //
        // //publish results
        // publisher.publish("markets",JSON.stringify(output))

        log.debug(tag, 'output', output)
        return output
    } catch (e) {
        console.error(tag, e)
        log.error('ERROR: ', e)
        throw e
    }
}

const account_info = async function (account) {
    let tag = TAG + ' | account_info | '
    try {
        let output = {}

        // get balances
        let balances = await redis.hgetall(account)
        output.type = 'Liquidity agent'
        output.account = account
        output.nonce = balances.nonce
        delete balances.nonce
        delete balances.ethAddress
        delete balances.account
        delete balances.eth
        output.balances = balances

        return output
    } catch (e) {
        console.error(tag, e)
        log.error('ERROR: ', e)
        throw e
    }
}

const account_balance = async function (account, coin) {
    let tag = TAG + ' | account_balance | '
    try {
        coin = coin.toUpperCase()
        let balance = await accounting.balance(account, coin)

        log.info(tag, 'balance', balance)
        if (!balance) balance = 0.00
        return balance
    } catch (e) {
        console.error(tag, e)
        log.error('ERROR: ', e)
        throw e
    }
}

const account_balances = async function (account) {
    let tag = TAG + ' | account_balances | '
    try {
        let output = {}
        // get all coins
        //TODO coin from config
        let allCoins = ['BTC', 'LTC', 'ETH', 'GNT']

        for (let i = 0; i < allCoins.length; i++) {
            output[allCoins[i]] = await await accounting.balance(account, allCoins[i])
        }

        return output
    } catch (e) {
        console.error(tag, e)
        log.error('ERROR: ', e)
        throw e
    }
}

const account_address = async function (account, coin) {
    let tag = TAG + ' | account_address | '
    try {
        log.debug(tag, 'input: ', account, coin)
        coin = coin.toUpperCase()

        // get address from redis
        let address = await redis.hget('addresses:' + account, coin)
        if (!address) {
            // else get new
            log.debug(tag, 'daemons: ', daemons)
            log.debug(tag, 'coin: ', coin.toLowerCase())
            let newAddress = await daemons[coin.toUpperCase()].getNewAddress()
            log.debug(tag, 'newAddress: ', newAddress)
            await redis.hset('addresses:' + account, coin, newAddress)

            // save address info
            let addressInfo = await daemons[coin.toLowerCase()].validateAddress(newAddress)
            addressInfo.account = account
            addressInfo.agent = true
            let r1 = await redis.hmset(newAddress, addressInfo)
            let r2 = await redis.hset('addresses:' + account, coin, newAddress)
            log.debug(`new address ${newAddress} saved for ${coin} on ${account}`, r1, r2)

            address = newAddress
        }

        return address
    } catch (e) {
        console.error(tag, e)
        log.error('ERROR: ', e)
        throw e
    }
}

const account_addresses = async function (account) {
    let tag = TAG + ' | account_addresses | '
    try {
        // get all coins

        //

        return true
    } catch (e) {
        console.error(tag, e)
        log.error('ERROR: ', e)
        throw e
    }
}

const account_withdraw = async function (account, coin, address, amount) {
    let tag = TAG + ' | account_withdraw | '
    try {
        coin = coin.toUpperCase()
        let output = { account, coin, address, amount }

        // create eventId
        let withdrawalId = uuid.v4()
        log.debug(tag, 'withdrawalId: ', withdrawalId)
        output.withdrawalId = withdrawalId

        // debit account
        let newBalance = await accounting.debit(account, amount, coin)
        log.debug(tag, 'newBalance: ', newBalance)
        output.newBalance = newBalance

        // validate address
        let isValid = await daemons[coin.toLowerCase()].validateAddress(address)
        log.debug(tag, 'isValid: ', isValid)
        if (!isValid.isvalid) throw Error('102: invalid withdrawal address!')

        // TODO balance check

        // sendToAddress
        let txidOut = await daemons[coin.toLowerCase()].sendToAddress(address, amount)
        log.debug(tag, 'txidOut: ', txidOut)
        output.txidOut = txidOut

        // publish event
        publisher.publish('debits', JSON.stringify(output))

        // save to mongo
        //debits.insert(output)
        await mongo['arbiterLa-transfers'].insert(output)

        return output
    } catch (e) {
        console.error(tag, e)
        log.error('ERROR: ', e)
        throw e
    }
}

/*****************************************
 //   lib
 //*****************************************/

const validate_order = async function (account, market, orderId, quantity, rate, type, owner) {
    let tag = TAG + ' | validate_order | '
    try {
        let output = false
        let amount = Math.abs(quantity)

        let coins = market.split('_')
        let coinIn
        let coinOut
        let amountQuote
        let coinFunding
        if (type === 'ask') {
            coinIn = coins[0]
            coinOut = coins[1]
            amountQuote = amount
            coinFunding = coinIn
        } else {
            coinIn = coins[1]
            coinOut = coins[0]
            amountQuote = amount / rate
            // TODO oppsite right.... right?
            coinFunding = coins[1]
        }
        log.debug(tag, 'type: ', type)
        log.debug(tag, 'coinIn: ', coinIn)
        log.debug(tag, 'coinOut: ', coinOut)
        log.debug(tag, 'coinFunding: ', coinFunding)
        log.debug(tag, 'amount: ', amount)
        log.debug(tag, 'amountQuote: ', amountQuote)
        log.debug(tag, 'account: ', account)

        //orderId not already live
        let isLive = await redis.sismember("live",orderId)
        if(isLive) throw Error(' 111: already live! ')

        // value of order

        // balance of global
        let balanceAccount = await accounting.balance(account, coinFunding)

        log.debug(tag, 'balanceAccount !!!', balanceAccount)

        // overdraft check?
        // NOTE: amountQuote is the amount in BASE! NOT the funding coin
        // amount IS the funding coin
        // you can buy or sell 1 ltc, on a LTC_BTC market, you cant buy/sell 1 btc.
        if (balanceAccount >= amount) {
            output = true
        }
        return output
    } catch (e) {
        console.error(tag, e)
        log.error('ERROR: ', e)
        throw e
    }
}

const order_accounting = async function (account, market, orderId, quantity, rate, type, owner) {
    let tag = TAG + ' | order_accounting | '
    try {
        let output = false
        // get all coins
        let amount = Math.abs(quantity)

        let coins = market.split('_')
        let coinIn
        let coinOut
        let amountQuote
        let coinFunding
        let amountFunding
        if (type === 'ask') {
            coinIn = coins[0]
            coinOut = coins[1]
            amountQuote = amount
            coinFunding = coinIn
        } else {
            coinIn = coins[1]
            coinOut = coins[0]
            amountQuote = amount / rate
            // amountFunding =
            // TODO oppsite right.... right?
            coinFunding = coins[1]
        }
        log.debug(tag, 'type: ', type)
        log.debug(tag, 'coinIn: ', coinIn)
        log.debug(tag, 'coinOut: ', coinOut)
        log.debug(tag, 'coinFunding: ', coinFunding)
        log.debug(tag, 'amount: ', amount)
        log.debug(tag, 'amountQuote: ', amountQuote)
        log.debug(tag, 'account: ', account)

        //
        let newBalance = await accounting.debit(account, amount, coinFunding)
        if(newBalance < 0) throw Error("103: negitive balance!")
        if (newBalance === 0) newBalance = '0'
        log.debug(tag, 'newBalance: ', newBalance)

        // output.newBalance = newBalance / SATOSHI

        // then credit order
        let creditSuccess = await accounting.credit(orderId, amount, coinFunding)
        if (creditSuccess === 0) creditSuccess = '0'
        log.debug(tag, 'creditSuccess: ', creditSuccess)

        if (newBalance && creditSuccess) {
            output = true
            // record credit
            let credit = {
                realm: 'arbiter',
                account: orderId,
                coin: coinFunding,
                amount,
            }
            publisher.publish('credits', JSON.stringify(credit))
            credits.insert(credit)
            log.debug(tag, 'CREDIT: ', credit)

            // record debit
            let debit = {
                realm: 'arbiter',
                account,
                coin: coinFunding,
                amount,
            }
            publisher.publish('debits', JSON.stringify(debit))
            debits.insert(debit)
            log.debug(tag, 'DEBIT: ', debit)

            // report event
            let event = {
                realm: 'arbiter',
                event: 'submit',
                txid: orderId,
                time: new Date().getTime(),
                account,
                market,
                orderId,
                quantity,
                rate,
                type,
                coinIn,
                coinOut,
                coinFunding,
                debit,
                credit,
                newBalanceAccount: newBalance,
                newBalanceOrder: creditSuccess
            }
            publisher.publish("arbiterLa",JSON.stringify(event))

            try{
                await mongo['arbiterLa-trades'].insert(event)
            }catch(e){
            }
        }
        newBalance = newBalance / SATOSHI
        return { success: output, newBalance }
    } catch (e) {
        console.error(tag, e)
        log.error('ERROR: ', e)
        throw e
    }
}

const order_submission = async function (account, market, orderId, quantity, rate, type, owner) {
    let tag = TAG + ' | order_submission | '
    try {
        let output = false

        //
        redis.sadd('live', orderId)
        log.debug(tag, 'market: ', market)
        log.debug(tag, 'orderId: ', orderId)
        log.debug(tag, 'quantity: ', quantity)
        log.debug(tag, 'rate: ', rate)
        log.debug(tag, 'type: ', type)

        redis.hset(orderId, 'price', rate)
        redis.hset(orderId, 'quantity', quantity)

        if(type === "ask" && quantity > 0) quantity = quantity * -1 //fix
        //TODO really dont need this here??
        //if (type === 'ask' && quantity > 0) throw Error('101: invalid order! positive ask!') // error
        let id = await hte.submitOrder(market, orderId, quantity, rate)
        if (!id) throw Error('106:  failed to submit order')
        log.debug(tag, 'id: ', id)
        log.debug(tag, 'orderId: ', orderId)

        if (id !== orderId) throw Error('123: failed to insert order to match engine!')

        if (id === orderId) {
            output = true
        }

        return output
    } catch (e) {
        console.error(tag, e)
        log.error('ERROR: ', e)
        throw e
    }
}
