/*
    Arbiter Exchange liquidity agent API

    (off chain settlement)

    Client side toolkit

    Create account (bitcoin message keysigning)

    get account info

    place order

    withdraw

    Module: schema

   Schema = {
    info: [ 'account' ],
    balance: [ 'account', 'coin' ],
    balances: [ 'account' ],
    address: [ 'account', 'coin' ],
    addresses: [ 'account' ],
    withdraw: [ 'account', 'address', 'amount' ]
   }

    Account = Bitcoin address (you must have private key to sign messages!)
    Coin = [supported coins]
    Address = cryptocurrency address

 */
// require('dotenv').config({ path: '../.env' })


// require('dotenv').config({ path: '../../.env' })
// const config = require('../configs/env')

require('dotenv').config()
const config = require('./config.js')


const nonce = require('nonce')();
const request = require('request')
const log = require('@arbiter/dumb-lumberjack')()
const util = require('@arbiter/arb-redis')
let publisher = util.publisher
let subscriber = util.subscriber
const Schema = {
    info: [ 'account' ],
    balance: [ 'account', 'coin' ],
    balances: [ 'account' ],
    address: [ 'account', 'coin' ],
    addresses: [ 'account' ],
    withdraw: [ 'account', 'coin', 'address', 'amount' ]
}

// if dev
let signatory
//TODO handle config keys signing for testnet
//HACK: if in dev use bitcoind for signing
if (config.NODE_ENV === 'dev' || config.NODE_ENV === 'test') {
    log.info('Dev detected!')
    signatory = require('./signing.js')
} else {
    signatory = require('@arbiter/arb-signing')
}
// const signatory = require("./signing.js")


// TODO auto build export module
// enforce typeing on params

let URL = 'http://' + config.ARBITER_CORE_IP + ':' + config.ARBITER_CORE_PORT

module.exports = {
    getInfo: function () {
        return get_account_info()
    },
    balance: function (coin) {
        return get_balance(coin)
    },
    balances: function (coin) {
        return get_balances(coin)
    },
    address: function (coin) {
        return get_address_coin(coin)
    },
    addresses: function () {
        return get_address_coin()
    },
    order: function (orderId) {
        return get_order(orderId)
    },
    orders: function () {
        return get_orders()
    },
    withdraw: function (coin, address, amount) {
        return withdrawal_coin(coin, address, amount)
    },
    cancel: function (orderId) {
        return cancel_order(orderId)
    },
    cancelSocket: function (orderId) {
        return cancel_order_socket(orderId)
    },
    limit: function (orderId, market, quantity, rate, type) {
        return place_limit_order(orderId, market, quantity, rate, type)
    },
    limitSocket: function (orderId, market, quantity, rate, type) {
        return place_limit_order_socket(orderId, market, quantity, rate, type)
    },
}

let cancel_order = async function (orderId) {
    let tag = ' | sign_message | '
    try {
        let payload = { orderId }
        payload.nonce = nonce()

        let signature = await signatory.sign(config.AGENT_BTC_MASTER, JSON.stringify(payload))
        log.debug(signature)


        let body = {
            account: config.AGENT_BTC_MASTER,
            payload,
            signature
        }

        let url = URL + '/cancel'
        let result = await post_request(url, body)
        log.debug('result: ', result)

        if (!result.payload) return result
        return result.payload
    } catch (e) {
        console.error(tag, 'Error: ', e)
        throw e
    }
}

let cancel_order_socket = async function (orderId) {
    let tag = ' | sign_message | '
    try {
        let payload = { orderId }
        payload.nonce = nonce()

        payload.event = 'cancel'
        let signature = await signatory.sign(config.AGENT_BTC_MASTER, JSON.stringify(payload))
        log.debug(signature)

        let body = {
            account: config.AGENT_BTC_MASTER,
            payload,
            signature
        }
        publisher.publish('tradeAgent', JSON.stringify(body))

        return true
    } catch (e) {
        console.error(tag, 'Error: ', e)
        throw e
    }
}

let get_order = async function (orderId) {
    let tag = ' | sign_message | '
    try {
        let payload = { orderId }
        payload.nonce = nonce()

        let signature = await signatory.sign(config.AGENT_BTC_MASTER, JSON.stringify(payload))
        log.debug(signature)

        let body = {
            account: config.AGENT_BTC_MASTER,
            payload,
            signature
        }

        let url = URL + '/order'
        let result = await post_request(url, body)
        log.debug('result: ', result)

        // todo validate
        return result.payload
    } catch (e) {
        console.error(tag, 'Error: ', e)
        throw e
    }
}

let get_orders = async function () {
    let tag = ' | sign_message | '
    try {
        let payload = {}
        payload.nonce = nonce()

        let signature = await signatory.sign(config.AGENT_BTC_MASTER, JSON.stringify(payload))
        log.debug(signature)

        let body = {
            account: config.AGENT_BTC_MASTER,
            payload,
            signature
        }

        let url = URL + '/orders'
        let result = await post_request(url, body)
        log.debug('result: ', result)

        return result.payload
    } catch (e) {
        console.error(tag, 'Error: ', e)
        throw e
    }
}

let place_limit_order = async function (orderId, market, quantity, rate, type) {
    let tag = ' | sign_message | '
    try {
        let payload = { orderId, market, quantity, rate, type }
        payload.nonce = nonce()

        let signature = await signatory.sign(config.AGENT_BTC_MASTER, JSON.stringify(payload))
        log.debug(signature)

        let body = {
            account: config.AGENT_BTC_MASTER,
            payload,
            signature
        }

        let url = URL + '/limit'
        let result = await post_request(url, body)
        log.debug('result: ', result)

        if (!result.payload) throw Error(result.error)
        return result.payload
    } catch (e) {
        console.error(tag, 'Error: ', e)
        throw e
    }
}

let place_limit_order_socket = async function (orderId, market, quantity, rate, type) {
    let tag = ' | sign_message | '
    try {
        let payload = { orderId, market, quantity, rate, type }
        payload.nonce = nonce()

        payload.event = 'submit'
        let signature = await signatory.sign(config.AGENT_BTC_MASTER, JSON.stringify(payload))
        log.debug(signature)

        let body = {
            account: config.AGENT_BTC_MASTER,
            payload,
            signature
        }
        publisher.publish('tradeAgent', JSON.stringify(body))

        return true
    } catch (e) {
        console.error(tag, 'Error: ', e)
        throw e
    }
}

let get_account_info = async function () {
    let tag = ' | sign_message | '
    try {
        let payload = {}
        payload.nonce = nonce()

        let signature = await signatory.sign(config.AGENT_BTC_MASTER, JSON.stringify(payload))
        log.debug(signature)

        let body = {
            account: config.AGENT_BTC_MASTER,
            payload,
            signature
        }

        let url = URL + '/info'
        let result = await post_request(url, body)
        log.debug('result: ', result)

        return result.payload
    } catch (e) {
        console.error(tag, 'Error: ', e)
        throw e
    }
}

let get_balance = async function (coin) {
    let tag = ' | sign_message | '
    try {
        let payload = { coin }
        payload.nonce = nonce()

        let signature = await signatory.sign(config.AGENT_BTC_MASTER, JSON.stringify(payload))
        log.debug(signature)

        let body = {
            account: config.AGENT_BTC_MASTER,
            payload,
            signature
        }

        let url = URL + '/balance'
        let result = await post_request(url, body)
        log.debug('result: ', result)

        return result.payload
    } catch (e) {
        console.error(tag, 'Error: ', e)
        throw e
    }
}

let get_balances = async function () {
    let tag = ' | sign_message | '
    try {
        let payload = {}
        payload.nonce = nonce()

        let signature = await signatory.sign(config.AGENT_BTC_MASTER, JSON.stringify(payload))
        log.debug(signature)

        let body = {
            account: config.AGENT_BTC_MASTER,
            payload,
            signature
        }

        let url = URL + '/balances'
        let result = await post_request(url, body)
        log.debug('result: ', result)

        return result.payload
    } catch (e) {
        console.error(tag, 'Error: ', e)
        throw e
    }
}

let get_address_coin = async function (coin) {
    let tag = ' | sign_message | '
    try {
        let payload = { coin }
        payload.nonce = nonce()

        let signature = await signatory.sign(config.AGENT_BTC_MASTER, JSON.stringify(payload))
        log.debug(signature)

        let body = {
            account: config.AGENT_BTC_MASTER,
            payload,
            signature
        }

        let url = URL + '/address'
        let result = await post_request(url, body)
        log.debug('result: ', result)

        return result.payload
    } catch (e) {
        console.error(tag, 'Error: ', e)
        throw e
    }
}

let withdrawal_coin = async function (coin, address, amount) {
    let tag = ' | sign_message | '
    try {
        let payload = { coin, address, amount }
        payload.nonce = nonce()

        let signature = await signatory.sign(config.AGENT_BTC_MASTER, JSON.stringify(payload))
        log.debug(signature)

        let body = {
            account: config.AGENT_BTC_MASTER,
            payload,
            signature
        }

        let url = URL + '/withdraw'
        let result = await post_request(url, body)
        log.debug('result: ', result)

        return result.payload
    } catch (e) {
        console.error(tag, 'Error: ', e)
        throw e
    }
}

// get_account_info()
// get_address_coin("BTC")
// get_address_coin("LTC")
// get_address_coin("ETH")

// attempt overdraft
// withdrawal_coin("BTC",config.AGENT_BTC_MASTER,0.001)
// get_balance("BTC")

// let market = "LTC_BTC"
// let quantity = 0.001
// let rate = "place_limit_order"
// let type = "bid"
// place_limit_order(market, quantity, rate, type)
// get_orders()

let post_request = function (url, body, method) {
    return new Promise((resolve, reject) => {
        let options = {
            method: method || 'POST',
            url: url,
            headers:
                { 'content-type': 'application/json' },
            body: JSON.stringify(body)
        }

        request(options, function (error, response, body) {
            // log.debug(`post_request`, error, response.status, body)
            if (error) {
                reject(error)
            } else {
                if (typeof body === 'string') {
                    try {
                        body = JSON.parse(body)
                    } catch (ex) {}
                }

                resolve(body)
            }
        })
    })
}
