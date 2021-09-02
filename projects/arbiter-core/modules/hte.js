/**
 * Created by highlander on 8/21/16.
 */

let request = require('request')
let when = require('when')
let exec = require('child_process').exec

const log = require('@arbiter/dumb-lumberjack')()
const config = require("./../configs/env")

// Markets
const markets = config.TRADE_PORTS
let apiPath = 'http://' + config.TRADE_IP + ':'
let TAG = " | hte | "
// let marketStatus = {}
// let marketList = Object.keys(markets)
// for(let i = 0; i , marketList.length;i++){
//     marketStatus[marketList[i]] = false
// }

// export
module.exports = {
    init: function () {
        return init_markets()
    },
    health: function () {
        return get_health()
    },
    shutdown: function () {
        return shutdown_trading()
    },
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

// let init_markets = async function() {
//     let tag = TAG + ' | init_markets | '
//     try {
//         //check redis
//         let market
//         //if market live
//
//     } catch (e) {
//         console.error(tag, e)
//     }
// }
//
// let get_health = async function(market) {
//     let tag = TAG + ' | get_health | '
//     try {
//         //
//
//
//     } catch (e) {
//         console.error(tag, e)
//     }
// }
//
// let shutdown_trading = async function(market) {
//     let tag = TAG + ' | shutdown_trading | '
//     try {
//
//
//     } catch (e) {
//         console.error(tag, e)
//     }
// }

const market_info = async function (market) {
    let tag = ' | market_info | '
    market = market.replace('-', '_')
    if (market === 'BTC_ETH') market = 'ETH_BTC'
    if (market === 'BTC_LTC') market = 'LTC_BTC'
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

    return post_request(url, '', body)
}

const cancel_order = function (market, orderId) {
    let tag = ' | cancel_order | '
    market = market.replace('-', '_')
    if (!markets[market]) throw Error('invalid market! ' + market)
    let url = apiPath + markets[market] + '/cancel'
    let body = { orderId }
    return post_request(url, '', body)
}

/*****************************************
 //   Lib
 //*****************************************/

const get_request = function (url) {
    let d = when.defer()
    let tag = ' | get_request | '
    log.debug(tag, 'url:', url)
    request(url, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            // console.log(body) // Show the HTML for the Google homepage.
            d.resolve(body)
        } else {
            console.error(error)
        }
    })
    return d.promise
}

const post_request = function (url, param, body) {
    let d = when.defer()
    let tag = ' | post_request | '
    let options = {
        method: 'POST',
        url: url + '/' + param,
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        form: body
    }
    request(options, function (error, response, body) {
        if (error) {
            d.reject(error)
        }
        d.resolve(body)
    })
    return d.promise
}
