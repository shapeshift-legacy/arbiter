const TAG = ' | txBuilder | '
const util = require('@arbiter/arb-redis')
const redis = util.redis
const log = require('@arbiter/dumb-lumberjack')()
const config = require("../configs/env")
const { daemons, normalizeCoin, getAddressInfo } = require('@arbiter/arb-daemons-manager')
const { btc, ltc, eth } = daemons
const oracle = require('@arbiter/arb-oracle-client')
log.debug(TAG,"************ debug: ",oracle)

let dustOutput = {
    ltc: 0.001,
    btc: 0.00005460
}

/****************************************************
 // Module
 //****************************************************/

module.exports = {
    // ETH only
    // build multi-sig contract

    // Build address
    buildAddress: function (coin, order) {
        return build_multisig_address(coin, order)
    },
    // spend it
    txBuilder: function (origin, destination, amount, fee) {
        return build_raw_transaction(origin, destination, amount, fee)
    },
    txBuilderPartial: function (origin, destinations) {
        return build_raw_transaction_multi(origin, destinations)
    },
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
        let addressInfo = await redis.hgetall(origin)
        log.debug(tag, 'addressInfo: ', addressInfo)

        // get orderInfo
        let orderInfo = await redis.hgetall(addressInfo.orderId)
        log.debug(tag, 'orderInfo: ', orderInfo)

        let coin = orderInfo.coinIn.toUpperCase()

        log.debug(tag, 'coin: ', coin)

        if (coin === 'ETH') {
            tx = await build_eth_tx(orderInfo, destination, amount)
        } else {
            tx = await build_uxto_tx(orderInfo, coin, origin, destination)
        }
        // if (!tx) throw Error('104 Unable to make tx! ')
        return tx
    } catch (e) {
        log.error('ERROR: ', e)
        throw e
    }
}

const build_multisig_address = async function (coin, order) {
    let tag = TAG + ' | build_multisig_address | '
    try {
        if (coin === 60) {
            // NOTE this is NOT create multi-sig contract!
            // This is creating forwarder for an order!
            let address = await build_forwarder(order, coin)
            return address
        } else {
            let address = await build_ms_address(order, coin)
            return address
        }
    } catch (e) {
        log.error('ERROR: ', e)
        throw e
    }
}

const build_raw_transaction_multi = async function (origin, destinations, fee) {
    let tag = TAG + ' | build_raw_transaction_multi | '
    try {
        // all fields mandatory
        log.debug(tag, 'input: ', { origin, destinations, fee })
        // if(!origin || !destination || !amount || !fee) throw "ERROR:101 Missing params!"

        // get addressInfo
        let addressInfo = await (redis.hgetall(origin))
        log.debug(tag, 'addressInfo: ', addressInfo)
        if (!addressInfo) throw Error('100: Unknown origin address!')
        if (!addressInfo.orderId) throw Error('101: origin not associated with order!')

        // get orderInfo
        let orderInfo = await (redis.hgetall(addressInfo.orderId))
        log.debug(tag, 'orderInfo: ', orderInfo)

        let coin = orderInfo.coinIn
        if (!coin) throw Error('103: invalid order! ')
        let tx
        if (coin === 'ETH') {
            // sweep to arbiter
            // ask oracle to sign
            throw Error('101: this should never hit! nerfed ETH here for fullfillment')
        } else {
            log.debug(tag, 'coin: ', coin)

            let utxos = await (get_unspent_inputs(coin, origin))
            let inputs = []
            let totalAvaible = 0

            // Notice the 1!!
            for (let i = 0; i < 1; i++) {
                log.debug(tag, 'utxo: ', utxos[i])
                totalAvaible = totalAvaible + utxos[i].amount
                let input = {
                    txid: utxos[i].txid,
                    vout: utxos[i].vout,
                    scriptPubKey: utxos[i].scriptPubKey,
                    redeemScript: utxos[i].redeemScript
                }
                inputs.push(input)
            }
            log.debug(tag, 'totalAvaible:', totalAvaible)

            // TODO handle testnet/live
            // let profitAddress = "mrQLvLrSHfgXZNZkRcsHjNum7g9G9xBUbX"

            // TODO build change address
            // update deposit address in redis!

            let outputOne = Object.keys(destinations[0])[0]
            log.debug(tag, 'outputOne: ', outputOne)

            let outputTwo = Object.keys(destinations[1])[0]
            log.debug(tag, 'outputTwo: ', outputTwo)

            let outputs = {}
            // amount = (amount * 100000000)/100000000
            // amount = amount.toFixed(8)
            if (destinations[0][outputOne] > dustOutput[normalizeCoin(coin)]) outputs[outputOne] = destinations[0][outputOne]
            if (destinations[1][outputTwo] > dustOutput[normalizeCoin(coin)]) outputs[outputTwo] = destinations[1][outputTwo]
            // if(fee > 0.0009) outputs[profitAddress] = fee
            log.debug(tag, 'outputs: ', outputs)

            try {
                coin = normalizeCoin(coin)
                tx = await (daemons[coin].createRawTransaction(inputs, outputs))
            } catch (e) {
                log.error(' | createRawTransaction | e: ', e)
                throw e
            }

            log.debug(tag, 'tx: ', tx)
            if (!tx) throw Error('104 Unable to make tx! ')
        }

        return tx
    } catch (e) {
        log.error('ERROR: ', e)
        throw e
    }
}

const build_raw_transaction = async function (origin, destination, amount, fee) {
    let tag = TAG + ' | build_raw_transaction | '
    let debug = true
    try {
        // all fields mandatory
        log.info(tag, 'input: ', { origin, destination, amount, fee })
        // if(!origin || !destination || !amount || !fee) throw "ERROR:101 Missing params!"

        // get addressInfo
        let addressInfo = await redis.hgetall(origin)
        log.info(tag, 'addressInfo: ', addressInfo)
        if (!addressInfo) throw Error('100: Unknown origin address!')
        if (!addressInfo.orderId) throw Error('101: origin not associated with order!')

        // get orderInfo
        let orderInfo = await redis.hgetall(addressInfo.orderId)
        log.info(tag, 'orderInfo: ', orderInfo)

        let coin = orderInfo.coinIn
        if (!coin) throw Error('103: invalid order! ')
        let tx
        if (coin === 'ETH') {
            throw Error('101: this should never hit! nerfed ETH here for fullfillment')
        } else {
            log.info(tag, 'coin: ', coin)

            let inputs = get_uxto_input(coin, origin)

            // TODO handle testnet/live
            // let profitAddress = "mrQLvLrSHfgXZNZkRcsHjNum7g9G9xBUbX"

            // TODO build change address
            // update deposit address in redis!

            let outputs = {}
            if (debug) console.log(tag, 'amount: ', amount)
            amount = (amount * 100000000) / 100000000
            amount = amount.toFixed(8)
            if (debug) console.log(tag, 'amount: ', amount)

            outputs[destination] = amount

            // if(fee > 0.0009) outputs[profitAddress] = fee
            log.info(tag, 'outputs: ', outputs)

            try {
                coin = normalizeCoin(coin)
                tx = await daemons[coin].createRawTransaction(inputs, outputs)
            } catch (e) {
                log.error(' | createRawTransaction | e: ', e)
                throw e
            }

            log.info(tag, 'tx: ', tx)
            if (!tx) throw Error('104 Unable to make tx! ')
        }

        return tx
    } catch (e) {
        log.error('ERROR: ', e)
        throw e
    }
}

/****************************************************
 // Library
 //****************************************************/
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

const build_ms_address = async function (order, coin) {
    let tag = TAG + ' | build_ms_address | '
    try {
        let { orderId } = order
        let pubKeys = await _gatherPubkeys(order, coin)
        let msAddress = await daemons[normalizeCoin(coin)].addMultiSigAddress(2, pubKeys)

        // TODO: coins should return consistent responses
        if ( typeof msAddress === "object" ) {
          msAddress = msAddress.address
        }

        let msInfo = await getAddressInfo(coin, msAddress)
        log.debug(tag,"msInfo: ",msInfo)
        if(msInfo && msInfo.pubkeys){
            msInfo.addresses = msInfo.pubkeys.toString()
        } else if(msInfo && msInfo.embedded){
            msInfo.addresses = msInfo.embedded.pubkeys.toString()
        } else if(msInfo.addresses){
            //do nothing (already on addresses
        }else{
            throw Error("901: unknown multi-sig address info format")
        }

        msInfo.orderId = orderId
        await redis.hmset(msAddress, msInfo)

        // watch
        let success = await watchNewAddress(coin, msAddress)
        log.debug(tag, 'success: ', success)

        // watch
        return msAddress
    } catch (e) {
        log.error('ERROR: ', e)
        throw e
    }
}

const _gatherPubkeys = async (order, coin) => {
  let tag = ' gather_pubkeys | '
  let { orderId } = order

  // get new address for order
  let normalizedCoin = normalizeCoin(coin)
  let daemon = daemons[normalizedCoin]
  let newAddress = await daemon.getNewAddress()
  let newAddressInfo = await getAddressInfo(coin, newAddress)
  newAddressInfo.orderId = orderId

  log.debug(tag, 'newAddress: ', newAddress)
  log.debug(tag, 'newAddressInfo: ', newAddressInfo)

  await redis.hmset(newAddress, newAddressInfo)
  await redis.hset(orderId, 'pubkeyArbiter', newAddressInfo.pubkey)
  order.pubkeyArbiter = newAddressInfo.pubkey
  log.debug(tag, 'newAddressInfo: ', newAddressInfo)
  let cKey1 = newAddressInfo.pubkey

  if(!cKey1) throw Error("102: unable to find pubkey for address!")

  let payload = {
    orderId,
    coin,
    arbiterPubKey: newAddressInfo.pubkey,
    userkey: order.pubkey
  }

  // let order = { coin, userkey, orderId, arbiterPubKey: cKey1 }
  let response = await oracle.getNewPubkeyForOrder(payload)
  log.debug(tag,"response: ",response, typeof response)
  if(typeof(response) === "string") response = JSON.parse(response)
  let cKey2 = response.payload
  await redis.hset(orderId, 'pubkeyOracle', cKey2)

  let cKey3 = order.pubkey
  if (!cKey3) throw Error('1007 Failed to derive key3! ')

  let pubKeys = [cKey1, cKey2, cKey3]

  // Note: Order Matters!
  log.debug(tag, '(arbiter) Pubkey: ', cKey1)
  log.debug(tag, '(oracle) Pubkey: ', cKey2)
  log.debug(tag, '(customer) Pubkey: ', cKey3)

  return pubKeys
}

const build_forwarder = async function (order, coin) {
    let tag = TAG + ' | build_forwarder | '
    try {
        // let orderInfo = await redis.hgetall(order)
        let accountInfo = await redis.hgetall(order.account)

        if (!accountInfo.contractAddress) throw Error('100: unable to get account contract address! ')
        let address = await eth.getForwarder({
            gasAddress: config.ARBITER_MASTER_ETH,
            contractAddress: accountInfo.contractAddress
        })
        if (typeof (address) === 'string') address = JSON.parse(address)
        log.debug(tag, 'address: ', address)
        address = address.address
        log.debug(tag, 'address: ', address)

        let addressInfo = {
          address,
          orderId: order.orderId
        }
        log.debug(tag, 'addressInfo: ', addressInfo)
        await redis.hmset(address, addressInfo)

        let payload = {
          orderId: order.orderId,
          coin,
          coinIn: order.coinIn,
          userkey: order.account,
          arbiterPubKey: 'required but ignored for eth',
          depositAddress: address
        }

        await oracle.getNewPubkeyForOrder(payload)

        return address
    } catch (e) {
        log.error('ERROR: ', e)
        throw e
    }
}

const build_eth_tx = async function (orderInfo, destination, amount) {
    let tag = TAG + ' | build_eth_tx | '
    try {
        let tx
        let accountInfo = await redis.hgetall(orderInfo.account)
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

const watchNewAddress = async function (coin, address) {
    let tag = TAG + ' | watchNewAddress | '
    try {
        if (!address) throw Error('Unable to watch address')
        log.debug(tag, coin, ' watchAddress: ', address)
        let resp = true
        if (coin === 1) resp = await btc.importAddress(address, '', false)
        if (coin === 2) resp = await ltc.importAddress(address, '', false)
        if (coin === 2.1) resp = await ltc.importAddress(address, '', false)
        return resp
    } catch (e) {
        log.error(address, ' ', coin, ' ERROR: ', e)
        throw Error('102 Unable to watch address!')
    }
}

function getUnspents (coin, address) {
    let output
    if (coin === 2.1 || coin === 'TLTC' || coin === 2 || coin === 'LTC') return ltc.listUnspent(0, 9999999, [address])
    if (coin === 1 || coin === 'BTC' || coin === 0 || coin === 'TBTC') return btc.listUnspent(0, 9999999, [address])
    throw Error('100 Unknown Coin: ' + coin)
}
