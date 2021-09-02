const TAG = ' | txBuilder | '
const util = require('@arbiter/arb-redis')
const redis = util.redis
const log = require('@arbiter/dumb-lumberjack')()
const config = require("../configs/env")
const { daemons } = require('@arbiter/arb-daemons-manager')
const { btc, ltc, eth } = daemons
const oracle = require('../modules/oracle')


let dustOutput = {
    ltc: 0.001,
    btc: 0.00005460
}

/****************************************************
 // Module
 //****************************************************/

module.exports = {
    // return it (user pays bitcoin fee, no match fee)
    returnBuilder: function (origin, destination, amount) {
        return build_raw_return(origin, destination, amount)
    }
}

/****************************************************
 // Primary
 //****************************************************/

const build_raw_return = async function (origin, destination, amount, fee) {
    let tag = TAG + ' | build_raw_return | '
    try {
        let tx
        // all fields mandatory
        log.debug(tag, 'input: ', { origin, destination, amount })
        if (!origin || !destination || !amount) throw Error('101 Missing params!')

        // get addressInfo
        let addressInfo = await (redis.hgetall(origin))
        log.debug(tag, 'addressInfo: ', addressInfo)

        // get orderInfo
        let orderInfo = await (redis.hgetall(addressInfo.orderId))
        log.debug(tag, 'orderInfo: ', orderInfo)

        let coin = orderInfo.coinIn.toUpperCase()

        log.debug(tag, 'coin: ', coin)

        if (coin === 'ETH') {
            tx = await build_eth_tx(orderInfo, destination, amount)
        } else {
            tx = await build_uxto_tx(orderInfo, coin, origin, destination)
        }

        //TODO paritially sign
        // if (!tx) throw Error('104 Unable to make tx! ')
        return tx
    } catch (e) {
        log.error('ERROR: ', e)
        throw e
    }
}


/****************************************************
 // Library
 //****************************************************/
const normalize_coin = function (coin) {
    switch (coin) {
        case 1:
            coin = 'btc'
            break
        case 0:
            coin = 'btc'
            break
        case 'BTC':
            coin = 'btc'
            break
        case 2.1:
            coin = 'ltc'
            break
        case 2:
            coin = 'ltc'
            break
        case 'LTC':
            coin = 'ltc'
            break
        default:
    }

    return coin
}

const get_uxto_input = async function (coin, origin) {
    let tag = TAG + ' | get_uxto_input | '
    try {
        let utxos = await get_unspent_inputs(coin, origin)
        let inputs = []
        let input = {
            txid: utxos[0].txid,
            vout: utxos[0].vout,
            scriptPubKey: utxos[0].scriptPubKey,
            redeemScript: utxos[0].redeemScript
        }
        inputs.push(input)
        return inputs
    } catch (e) {
        console.error(tag, e)
        log.error('ERROR: ', e)
        throw e
    }
}

const get_default_fee = function (coin) {
    let fee
    if (coin === 1 || coin === 0 || coin === 'BTC') fee = 0.0006704
    if (coin === 2.1 || coin === 2 || coin === 'LTC') fee = 0.0005
    return fee
}


const build_eth_tx = async function (orderInfo, destination, amount) {
    let tag = TAG + ' | build_eth_tx | '
    try {
        let tx
        let accountInfo = await redis.hgetall(orderInfo.signingAddress)
        let sequenceId = await eth.getSequenceId(accountInfo.contractAddress)
        log.debug(tag, 'sequenceId: ', sequenceId)

        let payload = {
            toAddress: destination,
            amountInEth: amount,
            data: '',
            sequenceId: sequenceId.sequenceId,
            expireTime: orderInfo.expiration
        }
        log.debug(tag, '(ms checkpoint 1) payload: ', payload)

        tx = await eth.createRawMultisigTransaction(payload)
        if (tx.ophash) tx = tx.ophash
        if (!tx) throw Error('101: unable to createRawMultisigTransaction')
        log.debug(tag, 'tx: ', tx)

        return tx
    } catch (e) {
        log.error('ERROR: ', e)
        throw e
    }
}

const build_uxto_tx = async function (orderInfo, coin, origin, destination) {
    let tag = TAG + ' | build_uxto_tx | '
    try {
        let tx
        let inputs = await get_uxto_input(coin, origin)
        // TODO dynamic fees!
        // get default
        let fee = get_default_fee(coin)
        let outputs = {}
        let amountToReturn = orderInfo.amountIn - fee
        amountToReturn = (amountToReturn * 100000000) / 100000000
        amountToReturn = amountToReturn.toFixed(8)
        log.debug(tag, 'amountToReturn: ', amountToReturn)
        outputs[destination] = amountToReturn

        log.debug(tag, 'inputs: ', inputs)
        log.debug(tag, 'outputs: ', outputs)
        if (coin === 1 || coin === 0 || coin === 'BTC') tx = await btc.createRawTransaction(inputs, outputs)
        if (coin === 2.1 || coin === 2 || coin === 'LTC') tx = await ltc.createRawTransaction(inputs, outputs)
        log.debug(tag, 'tx: ', tx)

        return tx
    } catch (e) {
        console.error(tag, e)
        log.error('ERROR: ', e)
        throw e
    }
}

const get_unspent_inputs = async function (coin, address) {
    let tag = TAG + ' | get_unspent_inputs | '
    try {
        if (!coin) throw Error('101 coin is undefined')
        if (!address) throw Error('101 address is undefined')
        log.debug(tag, ' address: ', address)

        let results
        results = await getUnspents(coin, address)
        log.debug(tag, ' results: ', results)
        if (!results || results.length < 1) {
            log.error('e: ', results)
            throw Error('201 No Unspent inputs found! ')
        }

        return results
    } catch (e) {
        log.error('ERROR: ', e, address)
        throw e
    }
}

function getUnspents (coin, address) {
    let output
    if (coin === 2.1 || coin === 'TLTC' || coin === 2 || coin === 'LTC') return ltc.listUnspent(0, 9999999, [address])
    if (coin === 1 || coin === 'BTC' || coin === 0 || coin === 'TBTC') return btc.listUnspent(0, 9999999, [address])
    throw Error('100 Unknown Coin: ' + coin)
}
