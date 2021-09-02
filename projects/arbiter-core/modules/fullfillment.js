let TAG = ' | fullfillment | '
const { redis, publisher } = require('@arbiter/arb-redis')
const config = require("../configs/env")
const { daemons } = require('@arbiter/arb-daemons-manager')
const Accounting = require('@arbiter/arb-accounting')
const accounting = new Accounting(redis)
let {match,balances,credits,debits,orders,users} = require('./mongo.js')
const log = require('@arbiter/dumb-lumberjack')()
const oracle = require('@arbiter/arb-oracle-client')
const { txBuilder, txBuilderPartial } = require('./txBuilder.js')
const trade = require('./hte.js')
const rates = require('@arbiter/arb-rates')
const CTI = require('@arbiter/coin-type-info')
const mongo = require("@arbiter/arb-mongo")

// constants
const SATOSHI = 100000000

//* *********************************
// Module
//* *********************************
module.exports = {
    // Intake order, get new pubkey for cosign
    fullfill: function (orderId) {
        return fullfill_order(orderId)
    },
    //Liquidity agent DB only!
    fullfillLA: function (orderId) {
        return fullfill_order_agent(orderId)
    },
    // rules + sign tx
    sweep: function (orderId) {
        return sweep_order(orderId)
    }
}

/**********************************
// Primary
//* *********************************/

let fullfill_order_agent = async function(orderId){
    let tag = TAG+" | fullfill_order_agent | "
    try{
        let orderInfo = await redis.hgetall(orderId)
        log.debug(tag,"orderInfo: ",orderInfo)

        //TODO validate complete
        //hte.orderInfo == complete

        //TODO validate order contains only ONE asset (coinOut) indicating truely complete

        //debit order
        let orderBalance = await accounting.debit(orderId,orderInfo[orderInfo.coinOut],orderInfo.coinOut)
        log.debug(tag,"orderBalance: ",orderBalance)

        //credit account
        let accountBalance = await accounting.credit(orderId,orderInfo[orderInfo.coinOut],orderInfo.coinOut)
        log.debug(tag,"accountBalance: ",accountBalance)


        //remove from orders
        redis.smove("live","complete",orderId)
        let account = orderInfo.account
        redis.srem(account+":orders",orderId)

        return {orderId,orderBalance,accountBalance}
    }catch(e){
        console.error()
    }
}

let sweep_order = async function (orderId) {
    let tag = TAG + `| sweep_order | ${orderId} `
    let orderInfo = await redis.hgetall(orderId)
    log.debug(tag, 'orderInfo: ', orderInfo)

    log.debug(tag, ' Attempting sweep! ')

    // build tx sweeping deposit to hot
    let { coinIn, returnAddress, depositAddress, amountIn, partial } = orderInfo
    let destination = config['MASTER_'+coinIn] // TODO hot home addresses

    // TODO bettter fees!
    const fee = _calculateFees(coinIn)

    let amount = parseFloat(amountIn) - fee
    amount = amount.toFixed(8)
    log.debug(tag, 'amount: ', amount)
    // TODO balance check contract, if low error!

    // if partial
    let sweepTx, returnAmount, txidSweep
    if (partial) {
        log.info(tag, 'Partial TX detected!')
        // 2 distinations hot + return
        amount = amountIn - (parseInt(orderInfo[coinIn],10) / SATOSHI) - fee

        amount = _cleanSats(amount)
        returnAmount = _cleanSats(parseInt(orderInfo[coinIn],10) / SATOSHI)
        log.info(tag, 'partial: amount', amount, 'returnAmount: ', returnAmount)

        if ( CTI.utils.isEthBased(coinIn) ) {
          let r1 = await _sweep_eth(config.MASTER_ETH, orderId, orderInfo, amount)
          // we have to manually up the sequenceId here cuz the first tx isn't on chain yet, so we have
          // to broadcast with a higher seqId cuz we know it'd fail if we didn't
          let r2 = await _sweep_eth(returnAddress, orderId, orderInfo, amount, parseInt(r1.sequenceId,10)+1)
          txidSweep = r1.txid
          redis.hset(orderId, 'txidReturn', r2.txid).catch(ex => {
            log.error(tag, `failed to set returnTxid to ${r2.txid} for ${orderId} during partial fulfillment`, ex)
          })
        } else {
          txidSweep = await _sweep_non_eth(orderInfo, partial, depositAddress, destination, amount, coinIn, returnAmount, returnAddress)
        }
    } else {
        if ( CTI.utils.isEthBased(coinIn) ) {
          // TODO do we support partial eth sweeps?
          txidSweep = await _sweep_eth(config.MASTER_ETH, orderId, orderInfo, amount)
        } else {
          txidSweep = await _sweep_non_eth(orderInfo, partial, depositAddress, destination, amount, coinIn)
        }
    }

    redis.hset(orderId, 'sweepTx', txidSweep).catch(ex => {
      log.error(tag, `failed to set sweepTxid to ${txidSweep} for ${orderId}`, ex)
    })

    return { orderId, txidSweep, fee, coinIn, amount, partial, returnAmount, sweepTx }
}

let fullfill_order = async function (orderId) {
    // TODO calculate average rate by volume
    // TODO amountLeft should always be 0 (ish dust)

    let tag = TAG + ' | fullfill_order | ' + orderId + ' | '

    log.info(tag, 'fullfilling order: ', orderId)
    const orderInfo = await redis.hgetall(orderId)
    if (!orderInfo) {
      throw Error('101: unknown order! order: ' + orderId)
    }
    log.debug(tag, 'orderInfo: ', orderInfo)

    let { coinOut, txidOut, coinIn, withdrawalAddress } = orderInfo

    // verify it wasnt already fullfilled
    if (txidOut) {
      throw Error(`attempt to fill ${orderId} which already has txidOut of ${txidOut}`)
    }

    // move out of live!
    let success = await redis.smove("live","fullfilled",orderId)
    if(!success) {
      throw Error("201: already fullfilled!")
    }

    let statusUpdate = await redis.hset(orderId, 'status', 'complete')
    log.debug(tag, 'statusUpdate: ', statusUpdate)

    // mark partial
    let partial = orderInfo[coinIn] > 0 ? true : false
    await redis.hset(orderId, 'partial', partial)
    orderInfo.partial = partial

    let amountOut = await _calculateAmounts(orderInfo)

    await _checkBalance(coinOut, amountOut, orderId)

    log.info('(Checkpoint 01 sending!) coin: ', coinOut, ' address: ', withdrawalAddress, ' amount: ', amountOut)
    // TODO are there other failure cases that should be expected here?

    /*
     critical to remove from expiration queue before
     fulfilling to prevent race condition where an order may fill
     at the same time it's being returned
     */
    await _removeFromExpirationQueue(orderId)
    let daemon = daemons[coinOut.toLowerCase()]
    let txid = await daemon.sendToAddress(withdrawalAddress, amountOut, coinOut)
    if ( typeof txid === "object" && txid.txid !== undefined ) { // eth
        txid = txid.txid
    }
    log.info(tag, 'txid of coin to user: ', txid)
    let updateSuccess = await redis.hset(orderId, 'txidOut', txid)
    log.debug(tag, 'updateSuccess: ', updateSuccess)

    if (!txid) {
      throw Error('103: missing txid! Failed to send!!')
    }

    return txid
}

/*******************************
// Lib
//*******************************/

const _sweep_eth = async (toAddress, orderId, orderInfo, amount, sequenceId) => {
    let tag = TAG + " | _sweepEth | "

    log.debug(tag,' Attempting ETH sweep! ')
    // build
    let accountInfo = await redis.hgetall(orderInfo.signingAddress)
    if (!accountInfo) throw Error('105 can not return! unknown signer account for customer! ')

    let { coinIn } = orderInfo
    let daemon = daemons[coinIn.toLowerCase()]
    let contractAddress = accountInfo.contractAddress

    // since this is an on-chain check and we know we have to send multiple tx in
    // short order for partials, we enable manually sending in a sequenceId
    if ( sequenceId === undefined ) {
      let res = await daemon.getSequenceId(contractAddress)
      sequenceId = res.sequenceId
    }

    let payload = {
        // toAddress: config.MASTER_ETH,
        toAddress,
        value: amount,
        sequenceId,
        expireTime: orderInfo.expiration
    }
    log.debug(tag,'payload: ', payload)

    let tx = await daemon.createRawMultisigTransaction(payload)
    tx = tx.ophash
    log.debug(tag,'tx: ', tx)
    orderInfo.return = false
    let signature = await oracle.sign(orderInfo, tx)

    // do sigs match
    log.debug(tag,'signature: ', signature)

    payload = Object.assign(payload, {
        contractAddress: contractAddress,
        gasAddress: config.ARBITER_MASTER_ETH,
        data: '0x',
        otherSig: signature
    })

    log.debug(tag,'payload: ', payload)

    // send
    let broadcast = await daemon.sendMultiSig(payload)
    log.debug(tag,'broadcast: ', broadcast)
    let { txid } = broadcast
    redis.hset(orderInfo.orderId, 'sweepTx', txid)
    return { txid, sequenceId }
}

const _sweep_non_eth = async (orderInfo, isPartial, depositAddress, destination, amount, coinIn, returnAmount, returnAddress) => {
  let tag = `| _sweep_non_eth | ${orderInfo.orderId} |`
  let sweepTx

  if ( isPartial ) {
    let destinations = [
        { [destination]: amount },
        { [returnAddress]: returnAmount }
    ]
    log.info(tag, 'destinations: ', destinations)

    sweepTx = await txBuilderPartial(depositAddress, destinations)
    log.debug(tag, 'sweepTx: ', sweepTx)
  } else {
    sweepTx = await txBuilder(depositAddress, destination, amount)
  }

  log.debug(tag, 'sweepTx: ', sweepTx)

  // sign tx
  let sweepTxSigned = await daemons[coinIn.toLowerCase()].signRawTransaction(sweepTx)

  log.debug('sweepTxSigned: ', sweepTxSigned)

  // have oracle sign transaction
  orderInfo.return = false
  return oracle.sign(orderInfo, sweepTxSigned.hex)
}

const _calculateFees = coinIn => {
  if (coinIn === 'LTC') {
      return 0.001
  } else if (coinIn === 'BTC') {
      return 0.0001
  } else {
      log.info(`no fee set for ${coinIn}, using 0`)
      return 0
  }
}

const _cleanSats = amount => {
  amount = (amount * SATOSHI) / SATOSHI // TODO: why?
  return amount.toFixed(8)
}

/*
  _checkBalance must throw if balance check is unsuccessful
*/
const _checkBalance = async (coinOut, amount, orderId) => {
  let balance

  try {
    balance = await daemons[coinOut.toLowerCase()].getBalance()
  } catch (ex) {
    let msg = `error during balance check, queueing ${orderId} for retry`
    log.error(msg, ex)
    _queueForRetry(orderId)

    throw Error(msg)
  }

  if (balance > amount) {
    log.info(orderId, `balance of ${balance} is greater than amount out ${amount}, proceeding to fulfill`)
    // successful balance check
    return
  } else {
    let msg = `balance of ${balance} is LESS than amount out ${amount}, requeuing`
    log.warn(orderId, msg)
    _queueForRetry(orderId)

    throw Error(msg)
  }
}

const _calculateAmounts = async order => {
  // build tx from hot to customer
  let { orderId, coinOut, coinIn, amountIn } = order
  let tag = `| calculate_amounts | ${orderId} |`

  amountIn = parseFloat(order.amountIn)

  // bad math for ETH
  let amountOutMin = rates.getAmountOutMin(order)
  let amountOut = await accounting.balance(orderId,coinOut.toUpperCase())
  let amountLeft = await accounting.balance(orderId,coinIn.toUpperCase())
  let averageRate = amountIn / amountOut

  log.debug(tag, 'amountOut: ', amountOut)
  log.debug(tag, 'amountLeft: ', amountLeft)
  log.debug(tag, 'amountOutMin: ', amountOutMin)

  await redis.hset(orderId,
    'averageRate', averageRate,
    'amountOut', amountOut,
    'amountOutMin', amountOutMin
  )

  if (amountOut < amountOutMin) {
    throw Error('203: unable to determine accurate amount')
  }

  return amountOut
}

const _queueForRetry = orderId => {
  redis.rpush('queue:orders:fullfillment', orderId).then(res => {
    log.info(`successfully requeued ${orderId} after balance check failure`)
  }).catch(err => {
    log.error(`failed to requeue ${orderId} after balance check failure`, err)
  })
}

const _removeFromExpirationQueue = async orderId => {
  let removed = await redis.zrem('orders_by_expiration', orderId)
  if ( !removed === 1 ) {
    // throw because we don't want to risk double fulfill
    throw Error(`unexpeced result of ${removed} when removing order from expiration queue before fulfillment; expected 1`)
  }
}
