
/*
    TX dispatch.
        Publish's and verifies transactions to the blockchain

 */
const TAG = ' | txDispatch | '
const util = require('@arbiter/arb-redis')
const redis = util.redis
const oracle = require('@arbiter/arb-oracle-client')
const config = require("../configs/env")
const { daemons } = require('@arbiter/arb-daemons-manager')
const log = require('@arbiter/dumb-lumberjack')()
const app = require('./txBuilder.js')
let {match,balances,credits,debits,orders,users} = require('./mongo.js')
/****************************************************
 // Module
 //****************************************************/

module.exports = {
    // ETH only
    // build multi-sig contract

    // Build eth TX
    dispatchETH: function (orderInfo, accountInfo, amount, coin) {
        return send_eth_transaction(orderInfo, accountInfo, amount, coin)
    },
    // dispatch UTXO
    dispatchUTXO: function (orderInfo, accountInfo, amount) {
        return send_utxo_transaction(orderInfo, accountInfo, amount)
    }
}

/****************************************************
 // Primary
 //****************************************************/

const send_utxo_transaction = async function (orderInfo, accountInfo, amount) {
    let tag = TAG + ' | get_uxto_input | '
    try {
        // TODO handle non return tx's
        let orderId = orderInfo.orderId
        let origin = orderInfo.depositAddress
        let destination = orderInfo.returnAddress

        //
        let resultTx = await app.returnBuilder(origin, destination, amount)
        // Sign
        // sign as arbiter
        let coin = orderInfo.coinIn
        // let txSigned = await daemons[coin.toLowerCase()].signRawTransactionWithWallet(resultTx)
        let txSigned = await daemons[coin.toLowerCase()].signRawTransaction(resultTx)
        log.debug('txSigned: ', txSigned)

        // sign as oracle
        orderInfo.return = true
        let broadcast = await oracle.sign(orderInfo, txSigned.hex)
        log.debug(tag, 'broadcast: ', broadcast)

        if (!broadcast) throw Error('104: oracle failed to sign!!')
        await redis.hset(orderId, 'txidReturn', broadcast)
        await redis.hset(orderId, 'status', 'cancelled')

        return broadcast
    } catch (e) {
        console.error(tag, e)
        log.error('ERROR: ', e)
        throw e
    }
}

const send_eth_transaction = async function (orderInfo, accountInfo, amount, coin) {
    let tag = TAG + ' | send_eth_transaction | '
    try {
        let orderId = orderInfo.orderId
        let expireTime = orderInfo.expiration
        let daemon = daemons[coin.toLowerCase()]
        expireTime = parseInt(expireTime / 1000)
        expireTime = expireTime + 1000000
        let sequenceId = await daemon.getSequenceId(accountInfo.contractAddress)
        log.debug(tag, 'sequenceId: ', sequenceId)
        let contractAddress = accountInfo.contractAddress
        let payload = {
            toAddress: accountInfo.ethAddress,
            value: amount.toString(),
            data: '',
            sequenceId: sequenceId.sequenceId,
            expireTime: expireTime
        }
        log.debug('payload: ', payload)

        let tx = await daemon.createRawMultisigTransaction(payload)
        tx = tx.ophash
        log.debug('tx: ', tx)
        orderInfo.return = true
        let signature = await oracle.sign(orderInfo, tx)

        // do sigs match
        log.debug(tag, 'signature: ', signature)

        payload = {
            contractAddress: contractAddress,
            gasAddress: config.ARBITER_MASTER_ETH,
            toAddress: accountInfo.ethAddress,
            expireTime: expireTime,
            value: amount.toString(),
            data: '0x',
            sequenceId: sequenceId.sequenceId,
            otherSig: signature
        }
        log.debug('payload: ', payload)

        // send
        let broadcast = await daemon.sendMultiSig(payload)
        log.debug('broadcast: ', broadcast)
        let txidreturn = broadcast.txid
        await redis.hset(orderId, 'txidReturn', txidreturn)
        await redis.hset(orderId, 'status', 'cancelled')
        await redis.hset(orderId, 'complete', true)

        return txidreturn
    } catch (e) {
        log.error('ERROR: ', e)
        throw e
    }
}
