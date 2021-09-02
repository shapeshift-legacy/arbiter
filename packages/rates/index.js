/*

        Order Adjustment rates/amount modules

 */
const TAG = ' | rates | '
const SATOSHI = 100000000

module.exports = {
    getTradeAmount: function (payment, orderInfo) {
        return get_trade_amount(payment, orderInfo)
    },
    //minOut
    getAmountOutMin: function (orderInfo) {
        return get_min_amount_out(orderInfo)
    },
    //
    getAmountOutEst: function (orderInfo) {
        return get_amount_out(orderInfo)
    },

    //
    getAmountLeft: function (orderInfo, rate) {
        return get_amount_left(orderInfo, rate)
    },

    getValueUSD: function (amount,coin,redis) {
        return get_value(amount,coin,redis)
    }
}

/*******************************************
 //primary
 //*******************************************/

const get_value = async function(amount,coin,redis) {
   coin = coin.toUpperCase()
   let rateBTC = await redis.hget("rates",coin)
   return amount / (1 / rateBTC)
}

//get_amount_left (retarget)
const get_amount_left = function (orderInfo, rate) {
    let quanitiy
    if (orderInfo.coinIn == 'BTC') {
        let amountLeft = orderInfo[orderInfo.coinIn] / SATOSHI
        amountLeft = (amountLeft * SATOSHI) / SATOSHI

        let amountOrder = amountLeft / rate
        quanitiy = amountOrder
    }

    if (orderInfo.coinIn == 'ETH') {
        //
        let amountLeft = orderInfo[orderInfo.coinIn] / SATOSHI
        amountLeft = (amountLeft * SATOSHI) / SATOSHI
        quanitiy = amountLeft * -1
    }

    if (orderInfo.coinIn == 'GNT') {
        //
        let amountLeft = orderInfo[orderInfo.coinIn] / SATOSHI
        amountLeft = (amountLeft * SATOSHI) / SATOSHI
        quanitiy = amountLeft * -1
    }

    if (orderInfo.coinIn == 'LTC') {
        // amount always in base!
        // inverted rate
        // tradeAmount = payment.value * orderInfo.rate
        // asks are negitive!

        let amountLeft = orderInfo[orderInfo.coinIn] / SATOSHI
        amountLeft = (amountLeft * SATOSHI) / SATOSHI
        quanitiy = amountLeft * -1
    }
    return quanitiy
}

const get_amount_out = function (order) {
    let tag = TAG + ' | get_min_amount_out | '
    let amountOut
    if (order.pair === 'LTC_BTC' || order.pair === 'ETH_BTC' || order.pair === 'GNT_BTC') {
        // inverted rate
        amountOut = order.amountIn * order.rate
    } else {
        //
        amountOut = order.amountIn / order.rate
    }
    return amountOut
}


const get_min_amount_out = function (orderInfo) {
    let tag = TAG + ' | get_min_amount_out | '
    try {
        let amountOutMin
        if (orderInfo.coinOut == 'ETH' || orderInfo.coinOut == 'LTC' || orderInfo.coinOut == 'GNT') {
            amountOutMin = parseFloat(orderInfo.amountIn) / parseFloat(orderInfo.rate)
            amountOutMin = Math.floor(SATOSHI * amountOutMin) / SATOSHI
            amountOutMin = amountOutMin - 0.000001
        } else {
            amountOutMin = parseFloat(orderInfo.amountIn) * parseFloat(orderInfo.rate)
            amountOutMin = Math.floor(SATOSHI * amountOutMin) / SATOSHI
            amountOutMin = amountOutMin - 0.000001
        }

        return amountOutMin
    } catch (e) {
        console.error(tag, 'Error: ', e)
        throw e
    }
}

const get_trade_amount = function (payment, orderInfo) {
    let tradeAmount
    // TODO hard coded coins? wtf????
    // TODO rate limits module
    if (orderInfo.coinIn === 'BTC') {
        // TODO This is fucked
        // we really want to bid on "unlimted" amounts of LTC
        // limited only by the quote (BTC)
        tradeAmount = payment.value / orderInfo.rate
    } else {
      tradeAmount = payment.value * -1
    }

    return tradeAmount
}
