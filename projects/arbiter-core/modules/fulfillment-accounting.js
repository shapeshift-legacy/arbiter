const { redis, publisher } = require('@arbiter/arb-redis')
const { daemons } = require('@arbiter/arb-daemons-manager')
const { orders } = require('./mongo.js')
const log = require('@arbiter/dumb-lumberjack')()
const rates = require('@arbiter/arb-rates')
const CTI = require('@arbiter/coin-type-info')


//* *********************************
// Module
//* *********************************
module.exports = {
    accountForFulfillment: function(orderId, txid) {
      account_for_fulfillment(orderId, txid)
    },

    accountForSweep: function(orderId, data) {
      account_for_sweep(orderId, data)
    }
}


const account_for_sweep = async (orderId, data) => {
  let { fee, coinIn, amount, partial, returnAmount, sweepTx } = data

  let sweepTxFeeUSD = await rates.getValueUSD(fee, coinIn, redis)
  let sweepAmountUSD = await rates.getValueUSD(amount, coinIn, redis)

  let update = {
    swept: true,
    partial,
    sweepTx: sweepTx,
    sweepTxFee: fee,
    sweepTxFeeUSD,
    sweepAmount: amount,
    sweepAmountUSD
  }

  if ( partial ) {
    update.returnAmountUSD = await rates.getValueUSD(returnAmount, coinIn, redis)
    update.returnTxid = sweepTx
    update.returnAmount = returnAmount
    update.partial = true
  }

  return orders.update({ orderId }, { $set: update })
}

const account_for_fulfillment = async (orderId, txid) => {
  let order = await redis.hgetall(orderId)
  let { coinOut, amountOut, withdrawalAddress } = order
  let debit = {
    coin: coinOut,
    orderId: orderId,
    txid: txid,
    amount: amountOut,
    address: withdrawalAddress
  }

  publisher.publish("debits",JSON.stringify(debit))

  //get fee
  let txInfo = await daemons[coinOut.toLowerCase()].getTransaction(txid)
  let fullFillFee = Math.abs(txInfo.fee)

  if ( !txInfo.fee ) {
    throw Error('unknown fee or fee not yet available')
  }

  let feeCurrency = CTI.utils.isEthBased(coinOut) ? "ETH" : coinOut
  let fullFillFeeUSD = await rates.getValueUSD(fullFillFee, feeCurrency, redis)
  let fullFillAmountUSD = await rates.getValueUSD(amountOut, feeCurrency, redis)

  return orders.update({ orderId }, {
    $set: {
      status: "complete",
      txidOut: txid,
      fullFillFee,
      fullFillAmount: amountOut,
      fullFillAmountUSD,
      fullFillFeeUSD
    }
  })
}
