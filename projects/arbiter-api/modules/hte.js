/**
 * Created by highlander on 8/21/16.
 */

let request = require('request')
let when = require('when')
let exec = require('child_process').exec

const { get_request, post_request } = require('./request')
const config = require("./../configs/env")

// Markets
const markets = config.TRADE_PORTS
let apiPath = 'http://' + config.TRADE_IP + ':'

// export
module.exports = {
    getMarketData: function (market) {
        return market_info(market)
    },
    getStatus: function (market, orderId) {
        return order_status(market, orderId)
    },
    submitOrder: function (market, id, quantity, price) {
        return submit_order(market, id, quantity, price)
    },
    cancelOrder: function (market, orderId) {
        return cancel_order(market, orderId)
    }
}

/*****************************************
 //   Primary
 //*****************************************/

const market_info = async function (market) {
    let tag = ' | market_info | '
    market = market.replace('-', '_')
    //TODO iterate
    if (market === 'BTC_ETH') market = 'ETH_BTC'
    if (market === 'BTC_LTC') market = 'LTC_BTC'
    if (market === 'BTC_GNT') market = 'GNT_BTC'
    if (!markets[market]) throw Error('100: invalid market! ' + market)
    let url = apiPath + markets[market] + '/orderbook'
    let output = await get_request(url)
    if (typeof (output) === 'string') output = JSON.parse(output)
    return output
}

const order_status = function (market, orderId) {
    let tag = ' | order_status | '
    market = market.replace('-', '_')
    if (!markets[market]) throw Error('invalid market! ' + market)
    let url = apiPath + markets[market] + '/status/' + orderId
    return get_request(url)
}

const submit_order = async function (market, id, quantity, price) {
    let tag = ' | submit_order | '
    market = market.replace('-', '_')
    if (!markets[market]) throw Error('invalid market! ' + market)
    let url = apiPath + markets[market] + '/limit'
    let body = { market, id: id, quantity: quantity, price: price }
    return post_request(url, body)
}

const cancel_order = function (market, orderId) {
    let tag = ' | cancel_order | '
    market = market.replace('-', '_')
    if (!markets[market]) throw Error('invalid market! ' + market)
    let url = apiPath + markets[market] + '/cancel'
    let body = { orderId }
    return post_request(url, body)
}
