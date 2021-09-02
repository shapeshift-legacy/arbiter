/**
 * Created by highlander on 5/7/16.
 */

const TAG = ' | (modules/api) INTERFACE | '
const uuid = require('node-uuid')
const co = require('co')
// const async = require('asyncawait/async')
// const await = require('asyncawait/await')
// const Redis = require('promise-redis')();
// const redis = Redis.createClient();
const util = require('@arbiter/arb-redis')
const redis = util.redis

const when = require('when')
const _ = require('underscore')

let collections = require('./mongo.js')
let signup = collections.reportSignup

const config = require("../configs/env")
let { btc,ltc,eth} = require('@arbiter/arb-daemons-manager').daemons

// constants
const SATOSHI = 100000000

// logging
const log = require('@arbiter/dumb-lumberjack')()

// modules
const hte = require('./hte.js')
const arbiter = require('./arbiter.js')
const markets = require('./markets.js')
const Accounting = require('@arbiter/arb-accounting')
const accounting = new Accounting(redis)
const rates = require('@arbiter/arb-rates')
const signing = require('./signing.js')
const oracle = require('@arbiter/arb-oracle-client')

// export
module.exports = {
    retarget: function (account,orderId,rate) {
        return retarget_order(account,orderId,rate)
    },
    cancel: function (orderId) {
        return arbiter.cancel(orderId)
    },
    limitorder: function (account,expiration,pubkey,pair,rate,amountIn,returnAddress,withdrawalAddress) {
        let order = {
            account,
            expiration,
            pubkey,
            pair,
            rate,
            amountIn,
            returnAddress,
            withdrawalAddress
        }
        return arbiter.create(order)
    },
}

/*******************************************
 // Primary
 //*******************************************/
let get_orders = async function(body) {
    let tag = TAG + ' |get_orders| '
    try {
        let signature = body.signature
        let account = body.account
        let payload = body.payload

        await signing.validate(account, signature, JSON.stringify(payload))

        return await redis.smembers('accountOrders:' + account)
    } catch (e)
    {
        log.error(tag, e)
    }
}


let account_tools = async function (account,action,ethAddress) {
    let tag = TAG + ' | account_tools | '
    try {
        // required params
        // let account = body.account
        // let action = body.payload.action

        // await validate_account(account, action)
        if (!account) throw Error('101: account required!')
        if (!action) throw Error('102: action required! (CRUD)')
        //
        // // get account info
        console.log("account: ",account)
        let accountInfo = await redis.hgetall(account)
        log.debug(tag, 'accountInfo: ', accountInfo)
        if (!accountInfo && action !== 'create') throw Error('103: unknown account!')

        // if NOT account (sanity on redis keys)
        if (accountInfo && !accountInfo.account) throw Error('104: account invalid! ')

        // action
        switch (action) {
            case 'create':
                // let accountInfo = await create_account(body, account)
                // return accountInfo

                // if ETH address given
                if (ethAddress) {
                    // TODO debit token bucket for new signup
                    // TODO if ETH address valid

                    // checkpoint
                    let arbiterAddress = config.ARBITER_MASTER_ETH
                    let oracleAddress = config.ORACLE_MASTER_ETH
                    let addressArray = [arbiterAddress, oracleAddress, ethAddress]
                    let contractAddress
                    try {
                        contractAddress = await eth.addMultisigAddress(addressArray)
                    } catch (e) {
                        log.error(tag, 'Failed to create contract error: ', e)
                    }
                    if (!contractAddress) throw Error('105: failed to created multisig contract!')
                    log.debug(tag,"contractAddress: ",contractAddress)
                    log.debug(tag,"contractAddress: ",typeof (contractAddress))
                    if (typeof (contractAddress) === 'string') contractAddress = JSON.parse(contractAddress)
                    contractAddress = contractAddress.address
                    redis.sadd('contracts:eth:ms', contractAddress)

                    log.debug(tag, 'contractAddress: ', contractAddress)
                    let accountInfo = {}
                    accountInfo.account = account
                    accountInfo.eth = true
                    accountInfo.ethAddress = ethAddress
                    accountInfo.contractAddress = contractAddress
                    redis.hmset(account, accountInfo)

                    //signup.insert(accountInfo)

                    return accountInfo
                } else {
                    return 'account signup not needed for non-eth users!'
                }

                break
            case 'read':
                log.debug(tag," Checkpoint read")
                return accountInfo
                break
            case 'update':
                break
            case 'destroy':
                break
        }
    } catch (e) {
        log.error(tag, 'E: ', e)
        throw e
    }
}


let retarget_order = async function (account,orderId,rate,body) {
    let tag = TAG + ' | retarget_order | '
    try {
        let pubkey = account

        validate_order({account,orderId,rate})

        // get order info
        let orderInfo = await redis.hgetall(orderId)
        let order = orderInfo
        if (!orderInfo) throw Error('103: unknown order!')

        // does address match order
        if (orderInfo.account !== pubkey) throw Error('104: incorrect signing pubkey for order given:' + orderInfo.account + ' expected: ' + pubkey)

        await cancel_order(orderInfo)

        // create new order
        let newOrder = {}
        newOrder.quantity = ''
        newOrder.rate = rate
        newOrder.orderId = uuid.v4()
        await redis.hset(newOrder.orderId, 'orderId', newOrder.orderId)

        // Accounting
        // TODO make this atmoic?
        // fund new order
        await move_balance(orderInfo)

        // CLONE order into new orderId for properties in order
        for (property in order) {
            if (property !== 'orderId' && property !== 'amountOut') {
                await redis.hset(newOrder.orderId, property, order[property])
            }
        }

        // cancel order
        let successMove = await redis.hset(orderId, 'status', 'cancelled')
        log.debug(tag, '417 success: ', successMove)
        // if(!successMove) throw "108: Failed to update status cancelled"

        // push to live
        log.debug(tag, 'orderId: ', newOrder.orderId)
        log.debug(tag, 'amountIn: ', order.amountIn)
        log.debug(tag, 'rate: ', rate)

        //
        validate_replace_order(newOrder, order, rate)

        // update price
        redis.hset(newOrder.orderId, 'price', rate)
        await redis.hset(newOrder.orderId, 'rate', rate)

        // add to index
        await redis.sadd('accountOrders:' + order.account, newOrder.orderId)

        // add to live
        await redis.sadd('live', newOrder.orderId)

        let quanitiy = rates.getAmountLeft(orderInfo, rate)
        if(!quanitiy) throw Error("103: Rates module failed to give quanitity! ")
        // TODO Validate Amounts and Rates!!
        // var validOrder = orders.validateRateAndAmounts(order.amountIn, null, rate, isBuy)
        // if(!validOrder || !validOrder.amountOut) throw "ERROR:411: can not validate order rates"
        // if(debug) console.log(tag,"validOrder: ",validOrder)

        log.debug(tag, 'quanitiy: ', quanitiy)
        log.debug(tag, 'quanitiy: ', typeof (quanitiy))

        // update amountOut
        // build new amount out (Min)
        let amountOutNew
        let amountOutOld = orderInfo[orderInfo.coinOut]
        amountOutOld = parseFloat(amountOutOld)
        amountOutOld = (amountOutOld * SATOSHI) / SATOSHI
        log.debug(tag, 'amountOutOld: ', amountOutOld)
        log.debug(tag, 'amountOutOld: ', typeof (amountOutOld))

        if (isNaN(amountOutOld)) {
            amountOutOld = 0
        }

        amountOutNew = quanitiy + amountOutOld
        log.debug(tag, 'amountOutNew: ', amountOutNew)
        amountOutNew = Math.abs(amountOutNew)
        redis.hset(newOrder.orderId, 'amountOut', amountOutNew)

        order.rate = rate
        order.orderId = newOrder.orderId
        order.quanitiy = quanitiy

        // validate and update oracle
        let payloadOracle = {
            orderIdNew: newOrder.orderId,
            orderIdOld: orderId,
            orderInfo: order,
            requestCustomer: body
        }

        // sign data
        let outputS = JSON.stringify(payloadOracle)

        let bodyRequest = {
          account: config.ARBITER_SIGNING,
          payload: payloadOracle,
          signature: await signing.sign(config.ARBITER_SIGNING, outputS)
        }
        let oracleSuccess = await oracle.retarget(bodyRequest)

        if (!oracleSuccess) throw Error('110: Failed Oracle validation rules! ')
        log.debug(tag,"input hte: ",{market:order.market, orderId:newOrder.orderId, quanitiy, rate})
        let newOrderId = await hte.submitOrder(order.market, newOrder.orderId, quanitiy, rate)
        log.debug(tag, ' newOrderId: ', newOrderId)

        return {
          success:true,
          orderId:newOrder.orderId
        }
    } catch (e) {
        log.error(tag, 'e: ', e)
        throw e
    }
}

/*******************************************
 //lib
 //*******************************************/
let validate_account = async function (account, action) {
    let tag = TAG + ' | get_min_amount_out | '
    try {
        if (!account) throw Error('101: account required!')
        if (!action) throw Error('102: action required! (CRUD)')

        // get account info
        let accountInfo = await redis.hgetall(account)
        log.debug(tag, 'accountInfo: ', accountInfo)
        if (!accountInfo && action !== 'create') throw Error('103: unknown account!')

        // if NOT account (sanity on redis keys)
        if (accountInfo && !accountInfo.account) throw Error('104: account invalid! ')
        return true
    } catch (e) {
        log.error(tag, 'Error: ', e)
        throw e
    }
}

const create_account = async function (body, account) {
    let tag = TAG + ' | get_min_amount_out | '
    try {
        let arbiterAddress = config.ARBITER_MASTER_ETH
        let oracleAddress = config.ORACLE_MASTER_ETH
        let addressArray = [arbiterAddress, oracleAddress, body.payload.ethAddress]
        let contractAddress
        try {
            contractAddress = await eth.addMultisigAddress(addressArray)
        } catch (e) {
            log.error(tag, 'Failed to create contract error: ', e)
        }
        if (!contractAddress) throw Error('105: failed to created multisig contract!')
        if (typeof (contractAddress) === 'string') contractAddress = JSON.parse(contractAddress)
        contractAddress = contractAddress.address
        redis.sadd('contracts:eth:ms', contractAddress)

        log.debug(tag, 'contractAddress: ', contractAddress)
        let accountInfo = {}
        accountInfo.account = account
        accountInfo.eth = true
        accountInfo.ethAddress = body.payload.ethAddress
        accountInfo.contractAddress = contractAddress
        let successUpdate = await redis.hmset(account, accountInfo)
        log.info(tag, 'accountInfo: ', accountInfo)
        return accountInfo
    } catch (e) {
        log.error(tag, 'Error: ', e)
        throw e
    }
}

const cancel_order = async function (orderInfo) {
    let tag = TAG + ' | get_min_amount_out | '
    try {
        let orderId = orderInfo.orderId
        let successCancel = await hte.cancelOrder(orderInfo.market, orderId)
        if (!successCancel) throw Error('105: failed to remove orderId from trade engine! orderId:' + orderId)

        // remove from live set
        let successRedis = await redis.smove('live', 'cancelled', orderId)
        if (!successRedis) throw Error('106: order not found in live set!')

        return true
    } catch (e) {
        log.error(tag, 'Error: ', e)
        throw e
    }
}

function isNaN (x) {
    // Coerce into number
    x = Number(x)
    // if x is NaN, NaN != NaN is true, otherwise it's false
    return x != x
}

const move_balance = async function (orderInfo) {
    let tag = TAG + ' | get_min_amount_out | '
    try {
        if (orderInfo[orderInfo.coinIn]) await accounting.credit(orderInfo.orderId, orderInfo[orderInfo.coinIn], orderInfo.coinIn)
        if (orderInfo[orderInfo.coinOut]) await accounting.credit(orderInfo.orderId, orderInfo[orderInfo.coinOut], orderInfo.coinOut)

        // defund old order
        if (orderInfo[orderInfo.coinIn]) await accounting.debit(orderInfo.orderId, orderInfo[orderInfo.coinIn], orderInfo.coinIn)
        if (orderInfo[orderInfo.coinOut]) await accounting.debit(orderInfo.orderId, orderInfo[orderInfo.coinOut], orderInfo.coinOut)

        return true
    } catch (e) {
        log.error(tag, 'Error: ', e)
        throw e
    }
}

let validate_replace_order = function (newOrder, order, rate) {
    if (!newOrder.orderId || !order.amountIn || !rate) throw Error('109: invalid replace order!')
    return true
}

let validate_order = function (body) {
    let pubkey = body.account
    let orderId = body.orderId
    let rate = body.rate

    if (!orderId) throw Error('98: orderId required!')
    if (!rate) throw Error('99: rate required!')
    if (!pubkey) throw Error('101: pubkey required!')
    return true
}

// if in redis respond public info
// var get_orders_by_pubkey = function (pubkey) {
//     let d = when.defer()
//     let tag = ' | get_orders_by_pubkey | '
//
//     console.log('look up existing for ' + pubkey)
//
//     let finalList = []
//
//     redis.smembers('pubKeyOrders:' + pubkey)
//         .then(function (orderList) {
//             // hmget limitOrder:d14ef6ec-15b4-4cb9-8ae7-01a119102373 depositAddress status
//
//             return when.iterate(function (x) {
//                 return x + 1
//             }, function (x) {
//                 // Stop when we've looped through all of items
//                 return !orderList || x > orderList.length - 1
//             }, function (x) {
//                 console.log('lookup ', orderList[x])
//
//                 // return get_order_info(orderList[x])
//                 //     .then(function(result){
//                 //         finalList[finalList.length] = result
//                 //     })
//                 return redis.hgetall(orderList[x])
//                     .then(function (results) {
//                         results.orderId = orderList[x]
//                         finalList[finalList.length] = results
//                     })
//
//                 // return redis.hmget("limitOrder:"+orderList[x], "depositAddress", "status")
//                 //     .then(function(results){
//                 //         finalList[finalList.length] = {shiftId:orderList[x], depositAddress:results[0], status:results[1]}
//                 //     })
//             }, 0) // 0 is what x starts at
//         })
//         .then(function () {
//             console.log('returning an existing list of ' + finalList.length + ' orders')
//
//             // console.log("",finalList)
//             d.resolve(finalList)
//         })
//     return d.promise
// }
