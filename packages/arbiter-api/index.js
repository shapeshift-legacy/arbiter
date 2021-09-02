/*
    Arbiter Exchange  API


 */

const TAG = " | arbiter-api-client | "
require('dotenv').config()


const nonce = require('nonce')();
const uuidv4 = require('uuid/v4')

const https = require('https');
const Axios = require('axios')
const axios = Axios.create({
    httpsAgent: new https.Agent({
        rejectUnauthorized: false
    })
});

const log = require('@arbiter/dumb-lumberjack')()
const signing = require('@arbiter/arb-signing')
let URL = process.env['ARBITER_URL']
let ACCOUNT = process.env['AGENT_BTC_MASTER']
let PRIVKEY = process.env['AGENT_BTC_SIGNING_PRIVKEY']
let ARBITER_URL = process.env['ARBITER_URL']
let ORACLE_URL
ORACLE_URL=process.env['REACT_APP_ORACLE_URL'] || "https://127.0.0.1:5555/api/v1"

let TESTNET = process.env['REACT_APP_IS_TESTNET']
console.log(" | arbiter-api | ",TESTNET)

if(TESTNET === 'false') TESTNET = false
log.debug("TESTNET: ",TESTNET)

//client.js
var io = require('socket.io-client');
var socket = io.connect(ARBITER_URL, {reconnect: true, rejectUnauthorized: false});


module.exports = {
    init: function (url,account,privKey,isTestnet) {
        log.debug("isTestnet: ",isTestnet)
        if(isTestnet){
            TESTNET = isTestnet
        }
        URL = url
        ACCOUNT = account
        PRIVKEY = privKey
        ARBITER_URL = url
        signing.init(TESTNET, account, privKey)
        return true
    },
    signUp:function(ethAddress){
        return signup_user(ethAddress)
    },
    orderCreate:function(input){
        return create_order(input)
    },
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
    getOrderOracle:function(orderId){
        return get_order_oracle(orderId)
    },
}

/****************************************************
 // Primary Endpoints
 //****************************************************/

let signup_user = async function (ethAddress) {
    try {
        console.log("ethAddress: ",ethAddress)

        //build payload
        let payload = {
            action:"create",
            ethAddress
        }

        payload.nonce = nonce()

        let signature = await signing.sign(ACCOUNT, JSON.stringify(payload))
        log.debug(signature)


        let body = {
            account: ACCOUNT,
            payload,
            signature
        }

        let url = URL + '/api/v1/account'
        let result = await axios({
            url: url,
            method: 'POST',
            data: body,
            headers: { 'content-type': 'application/json' }
        })
        log.info('result: ', result.data)

        return result.data.payload
    } catch (error) {
        return error
    }
};

let get_order_oracle = async function (orderId) {
    let tag = TAG + ' | get_order | '
    try {
        let payload = { orderId }
        payload.nonce = nonce()

        let signature = await signing.sign(ACCOUNT, JSON.stringify(payload))
        log.debug(signature)


        let url = ORACLE_URL + '/status/'+orderId
        log.info(tag,"url: ",url)
        let result = await axios({
            url: url,
            method: 'GET'
        })

        log.info('result: ', result.data)

        // todo validate
        return result.data
    } catch (e) {
        console.error(tag, 'Error: ', e)
        throw e
    }
}

let create_order = async function(input){
    let tag = TAG+" | create_order | "
    try{
        log.debug(tag, "checkpoint1")
        log.debug(tag, "input: ",input)
        if(!input.pubkey)            throw Error("101: missing pubkey")
        if(!input.expiration)        throw Error("102: missing expiration")
        if(!input.pair)              throw Error("104: missing pair")
        if(!input.amountIn)          throw Error("105: missing amountIn")
        if(!input.rate)              throw Error("106: missing rate")
        if(!input.returnAddress)     throw Error("107: missing returnAddress")
        if(!input.withdrawalAddress) throw Error("108: missing withdrawalAddress")

        let url = ARBITER_URL+"/api/v1/limitorder"

        let data = {
            expiration: input.expiration,
            pubkey:input.pubkey,
            pair: input.pair,
            rate: input.rate,
            amountIn: input.amountIn,
            //amountOut: amountOut,
            returnAddress: input.returnAddress,
            withdrawalAddress: input.withdrawalAddress,
        }
        log.debug(tag, "data: ",data)

        let signature = await signing.sign(ACCOUNT, JSON.stringify(data))
        log.debug(tag, 'signature', signature)

        let body = {
            account: ACCOUNT,
            payload:data,
            signature
        }

        let result = await axios({
            url: url,
            method: 'POST',
            data: body,
            headers: { 'content-type': 'application/json' }
        })
        log.info('result: ', result.data)

        return result.data
    }catch(e){
        console.error(tag,"Error: ",e)
        throw e
    }
}




/****************************************************
// Custody Endpoints
//****************************************************/

let cancel_order = async function (orderId) {
    let tag = TAG + ' | cancel_order | '
    try {
        let payload = { orderId }
        payload.nonce = nonce()

        let signature = await signing.sign(ACCOUNT, JSON.stringify(payload))
        log.debug(signature)


        let body = {
            account: ACCOUNT,
            payload,
            signature
        }

        let url = URL + '/cancel'
        let result = await axios({
            url: url,
            method: 'POST',
            data: body,
            headers: { 'content-type': 'application/json' }
        })
        log.info('result: ', result.data)

        return result.data.payload
    } catch (e) {
        console.error(tag, 'Error: ', e)
        throw e
    }
}

let cancel_order_socket = async function (orderId) {
    let tag = TAG + ' | cancel_order_socket | '
    try {
        let payload = { orderId }
        payload.nonce = nonce()

        payload.event = 'cancel'
        let signature = await signing.sign(ACCOUNT, JSON.stringify(payload))
        log.debug(signature)

        let body = {
            account: ACCOUNT,
            payload,
            signature
        }
        // publisher.publish('tradeAgent', JSON.stringify(body))

        socket.emit('liquidityAgent', body, res => {
            log.debug(tag, 'res: ', res)
        })

        return true
    } catch (e) {
        console.error(tag, 'Error: ', e)
        throw e
    }
}

let get_order = async function (orderId) {
    let tag = TAG + ' | get_order | '
    try {
        let payload = { orderId }
        payload.nonce = nonce()

        let signature = await signing.sign(ACCOUNT, JSON.stringify(payload))
        log.debug(signature)


        let url = URL + '/api/v1/order/'+orderId
        log.info(tag,"url: ",url)
        let result = await axios({
            url: url,
            method: 'GET'
        })

        log.info('result: ', result.data)

        // todo validate
        return result.data.payload
    } catch (e) {
        console.error(tag, 'Error: ', e)
        throw e
    }
}

let get_orders = async function () {
    let tag = TAG + ' | get_orders | '
    try {
        let payload = {}
        payload.nonce = nonce()

        let signature = await signing.sign(ACCOUNT, JSON.stringify(payload))
        log.debug(signature)

        let body = {
            account: ACCOUNT,
            payload,
            signature
        }

        let url = URL + '/orders'
        let result = await axios({
            url: url,
            method: 'POST',
            data: body,
            headers: { 'content-type': 'application/json' }
        })
        log.info('result: ', result.data)

        return result.data.payload
    } catch (e) {
        console.error(tag, 'Error: ', e)
        throw e
    }
}

let place_limit_order = async function (orderId, market, quantity, rate, type) {
    let tag = TAG + ' | place_limit_order | '
    try {
        if(!orderId) orderId = uuidv4()
        let payload = { orderId, market, quantity, rate, type }
        payload.nonce = nonce()

        let signature = await signing.sign(ACCOUNT, JSON.stringify(payload))
        log.debug(signature)

        let body = {
            account: ACCOUNT,
            payload,
            signature
        }

        let url = URL + '/limit'
        let result = await axios({
            url: url,
            method: 'POST',
            data: body,
            headers: { 'content-type': 'application/json' }
        })
        log.info('result: ', result.data)

        return result.data.payload
    } catch (e) {
        console.error(tag, 'Error: ', e)
        throw e
    }
}

let place_limit_order_socket = async function (orderId, market, quantity, rate, type) {
    let tag = TAG + ' | place_limit_order_socket | '
    try {
        if(!orderId) orderId = uuidv4()
        let payload = { orderId, market, quantity, rate, type }
        payload.nonce = nonce()

        payload.event = 'submit'
        let signature = await signing.sign(ACCOUNT, JSON.stringify(payload))
        log.debug(signature)

        let body = {
            account: ACCOUNT,
            payload,
            signature
        }
        // publisher.publish('tradeAgent', JSON.stringify(body))

        socket.emit('liquidityAgent', body, res => {
            log.debug(tag, 'res: ', res)
        })

        return true
    } catch (e) {
        console.error(tag, 'Error: ', e)
        throw e
    }
}

let get_account_info = async function () {
    let tag = TAG + ' | get_account_info | '
    try {
        let payload = {}
        payload.nonce = nonce()

        let signature = await signing.sign(ACCOUNT, JSON.stringify(payload))
        log.debug(signature)

        let body = {
            account: ACCOUNT,
            payload,
            signature
        }

        let url = URL + '/info'
        log.info('url: ', url)
        log.info('body: ', body)
        let result = await axios({
            url: url,
            method: 'POST',
            data: body,
            headers: { 'content-type': 'application/json' }
        })
        log.info('result: ', result.data)

        return result.data.payload
    } catch (e) {
        console.error(tag, 'Error: ', e)
        throw e
    }
}

let get_balance = async function (coin) {
    let tag = TAG + ' | get_balance | '
    try {
        let payload = { coin }
        payload.nonce = nonce()

        let signature = await signing.sign(ACCOUNT, JSON.stringify(payload))
        log.debug(signature)

        let body = {
            account: ACCOUNT,
            payload,
            signature
        }

        let url = URL + '/balance'
        let result = await axios({
            url: url,
            method: 'POST',
            data: body,
            headers: { 'content-type': 'application/json' }
        })
        log.info('result: ', result.data)

        return result.data.payload
    } catch (e) {
        console.error(tag, 'Error: ', e)
        throw e
    }
}

let get_balances = async function () {
    let tag = TAG + ' | get_balances | '
    try {
        let payload = {}
        payload.nonce = nonce()

        let signature = await signing.sign(ACCOUNT, JSON.stringify(payload))
        log.debug(signature)

        let body = {
            account: ACCOUNT,
            payload,
            signature
        }

        let url = URL + '/balances'
        let result = await axios({
            url: url,
            method: 'POST',
            data: body,
            headers: { 'content-type': 'application/json' }
        })
        log.info('result: ', result.data)

        return result.data.payload
    } catch (e) {
        console.error(tag, 'Error: ', e)
        throw e
    }
}

let get_address_coin = async function (coin) {
    let tag = TAG + ' | get_address_coin | '
    try {
        let payload = { coin }
        payload.nonce = nonce()

        let signature = await signing.sign(ACCOUNT, JSON.stringify(payload))
        log.debug(signature)

        let body = {
            account: ACCOUNT,
            payload,
            signature
        }

        let url = URL + '/address'
        let result = await axios({
            url: url,
            method: 'POST',
            data: body,
            headers: { 'content-type': 'application/json' }
        })
        log.info('result: ', result.data)

        return result.data.payload
    } catch (e) {
        console.error(tag, 'Error: ', e)
        throw e
    }
}

let withdrawal_coin = async function (coin, address, amount) {
    let tag = TAG + ' | withdrawal_coin | '
    try {
        let payload = { coin, address, amount }
        payload.nonce = nonce()

        let signature = await signing.sign(ACCOUNT, JSON.stringify(payload))
        log.debug(signature)

        let body = {
            account: ACCOUNT,
            payload,
            signature
        }

        let url = URL + '/withdraw'
        let result = await axios({
            url: url,
            method: 'POST',
            data: body,
            headers: { 'content-type': 'application/json' }
        })
        log.info('result: ', result.data)

        return result.data.payload
    } catch (e) {
        console.error(tag, 'Error: ', e)
        throw e
    }
}


// Signing
let sign_message = async function(address,msg,privKey) {
    let tag = TAG + " | sign_message | "
    try {
        log.info(tag, "address: ", address)
        log.info(tag, "msg: ", msg)
        log.info(tag, "privKey: ", privKey)

        if (!privKey) privKey = PRIVKEY
        if (!privKey) throw Error("101: unable to sign! no privKey!")
        log.info(tag, 'privKey: ', privKey)

        const networks = require('bitcoinjs-lib').networks
        let keyPair
        if(TESTNET){
            keyPair = bitcoin.ECPair.fromWIF(privKey, networks.testnet)
        } else {
            keyPair = bitcoin.ECPair.fromWIF(privKey)
        }

        let message = msg

        let signature = bitcoinMessage.sign(message, keyPair.privateKey, keyPair.compressed)
        return signature.toString('base64')

    } catch (e) {
        console.error(tag, "Error: ", e)
        throw e
    }
}
