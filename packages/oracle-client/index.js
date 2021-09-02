let TAG = ' | oracle API | '
const config = require("./configs/env")
const { btc } = require('@arbiter/arb-daemons-manager').daemons
const oracleIp = config.ORACLE_IP
const oraclePort = config.ORACLE_PORT
const log = require('@arbiter/dumb-lumberjack')()
const { post_request } = require('./request')

//* *********************************
// Module
//* *********************************
module.exports = {
    // Intake order, get new pubkey for cosign
    getNewPubkeyForOrder: function (order) {
        return get_pubkey(order)
    },
    // rules + sign tx
    sign: function (order, tx) {
        return sign_transaction(order, tx)
    },
    retarget: function (body) {
        return retarget_order(body)
    }
}

//* *********************************
// Primary
//* *********************************

const retarget_order = async function (body) {
    let tag = TAG + ' | get_pubkey | '
    try {
        log.debug(tag,"body: ",body)

        let url = 'https://' + oracleIp + ':' + oraclePort + '/api/v1/retarget'

        let result = await post_request(url, body)

        return result
    } catch (e) {
        console.error(tag, 'Error: ', e)
        throw e
    }
}

// get pubkey for order
const get_pubkey = async function (order) {
    let tag = TAG + ' | get_pubkey | '
    try {
        log.debug(tag, 'order: ', order)
        let url = 'https://' + oracleIp + ':' + oraclePort + '/api/v1/pubkey'
        let address = config.ARBITER_SIGNING
        let orderS = JSON.stringify(order)
        log.debug(tag, 'orderS: ', orderS)
        log.debug(tag, 'address: ', address)
        let signature
        try {
            signature = await btc.signMessage(address, orderS)
        } catch (e) {
            console.error(tag, '(btc client) Error: ', e)
            throw e
        }

        let body = {
            account: address,
            payload: order,
            signature: signature
        }
        log.debug(tag, 'body: ', body)
        let result = await post_request(url, body)
        if (result.error) throw Error(result.error)
        return result
    } catch (e) {
        console.error(tag, 'Error: ', e)
        throw e
    }
}

// sign transaction
const sign_transaction = async function (order, tx) {
    let tag = TAG + ' | get_pubkey | '
    try {
        log.debug(tag, 'order: ', order)
        log.debug(tag, 'tx: ', tx)
        if(!tx) throw Error("101: cant sign if empty tx!! ")
        let url = 'https://' + oracleIp + ':' + oraclePort + '/api/v1/sign'
        let body = { order, tx }

        //TODO move this to signing module
        let signature
        try {
            signature = await btc.signMessage(config.ARBITER_SIGNING, JSON.stringify(body))
        } catch (e) {
            console.error(tag, '(btc client) Error: ', e)
            throw e
        }

        let output = {
            account: config.ARBITER_SIGNING,
            payload: body,
            signature: signature
        }
        log.debug(tag, 'output: ', output)
        let result = await (post_request(url, output))
        if(typeof(result) === 'string') result = JSON.parse(result)
        if (result.error) throw Error(result.error)
        return result.payload
    } catch (e) {
        console.error(tag, 'Error: ', e)
        throw e
    }
}
