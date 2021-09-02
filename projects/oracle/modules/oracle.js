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
const { daemons } = require('@arbiter/arb-daemons-manager')


const TAG = ' | arbiter | '
const txBuilder = require('./txBuilder.js')

// logging
const log = require('@arbiter/dumb-lumberjack')()



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
    cancel: function (orderId) {
        return return_order(orderId)
    }
}

//* ***************************************************
// Primary
//* ***************************************************



const return_order = async function (orderId) {
    let tag = TAG + ' | return_order | '
    let override = false // only try once and remove!!
    try {

        // LOCK move out so cant process
        // let moved = await redis.smove('live', 'cancelled', orderId)
        // if (!moved) throw Error('101: attempted to return order that is NOT LIVE! ')
        // if (override) await redis.zrem('orders_by_expiration', orderId)
        //
        // log.debug(tag, 'Checkpoint1')
        // let output = {
        //     event: 'cancel',
        //     orderId
        // }
        // publisher.publish('cancel', JSON.stringify(output))


        if (!orderId) throw Error('ERROR:102 can not return! Empty orderId ')
        log.debug(tag, 'Returning order: ', orderId)

        // Verify input is confirmed
        let orderInfo = await redis.hgetall(orderId)
        if (!orderInfo) throw Error('103 can not return! unknown order! ')
        if (orderInfo.txidOut) throw Error('104 can not return! unknown order! ')

        let accountInfo = await redis.hgetall(orderInfo.signingAddress)
        if (!accountInfo) throw Error('105 can not return! unknown account info! ')
        log.debug(tag, 'accountInfo: ', accountInfo)

        let amount = orderInfo.amountIn
        let origin = orderInfo.depositAddress
        let destination = orderInfo.returnAddress
        if (orderInfo.coinIn === 'ETH' || orderInfo.coinIn === 'GNT') {
            let txReturn = await build_eth_return(orderInfo, accountInfo, amount, orderInfo.coinIn)
            if(!txReturn) throw Error("105 Failed to build eth tx")
            let successEth = {
                orderId,
                status: 'cancelled',
                tx: txReturn
            }
            return successEth
        } else {
            let rawTx = await txBuilder.returnBuilder(origin, destination, amount)

            let partialSignedTx
            // if(orderInfo.coinIn === "BTC"){
            //     partialSignedTx = await wallets[orderInfo.coinIn].signRawTransactionWithWallet(rawTx)
            // }else{
                partialSignedTx = await wallets[orderInfo.coinIn].signRawTransaction(rawTx)
            // }


            let success = {
                orderId,
                status: 'cancelled',
                tx: partialSignedTx.hex
            }
            return success
        }
    } catch (e) {
        console.error(tag, 'ERROR:100 Returns Failed to return! order: ', orderId, e)
        throw e
    }
}


/****************************************************
 // Lib
 //****************************************************/

const build_eth_return = async function (orderInfo, accountInfo, amount, coin) {
    let tag = TAG + ' | send_eth_transaction | '
    try {
        let orderId = orderInfo.orderId
        let expireTime = orderInfo.expiration
        let daemon = daemons[coin.toLowerCase()]
        expireTime = parseInt(expireTime / 1000)
        expireTime = expireTime + 1000000
        let sequenceId = await daemon.getSequenceId(accountInfo.contractAddress)
        log.debug(tag, 'sequenceId: ', sequenceId)
        let payload = {
            toAddress: orderInfo.returnAddress,
            value: amount.toString(),
            data: '',
            sequenceId: sequenceId.sequenceId,
            expireTime: expireTime
        }
        log.debug('payload: ', payload)

        let tx = await daemon.createRawMultisigTransaction(payload)
        tx = tx.ophash


        return tx
    } catch (e) {
        log.error('ERROR: ', e)
        throw e
    }
}
