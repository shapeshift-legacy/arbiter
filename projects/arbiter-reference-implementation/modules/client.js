/**
 * Created by highlander on 12/25/16.
 */
/*
        Arbiters Reference client

        Features:
            * Maintain Example Full Node/wallets expecting standard RPC's
            * Generate, Build and maintain HD wallet
            * Associate HD wallet with account on arbiter
            * Query order history based on PubKeys
            * Build transaction log of local trades
            * Create new order on arbiter
            * Cancel order on arbiter
            * Retarget order rate on arbiter
            * Create automated trading pattern
            * Maintain records on all trade history
            * Export trade history in (xyz) format

        Overview of core Concepts

        API's

            * REST
            * JSON over WS
            * PROTO-buff over WS
            * (potential) FIX


       What is a HD wallet?
            * Generate random wordlist
            * Build a wallet
            * Display and burn secret*
            * Save and store public to file
            * (optional) store Sig Key for automated trading.

       Linking wallet with Arbiter's Account
            * store accountId locally
            *


 */
const TAG = " | Client | "
const wallet = require("./wallet.js")
const config = require('../configs/env')
const log = require('@arbiter/dumb-lumberjack')()
const { post_request, get_request } = require('./request')
// const { btc, ltc, eth, gnt } = require('./daemons-manager')
const {
  ARBITER_URL,
  ORACLE_URL
} = config


module.exports = {
    getAccount:function(){
        return get_account()
    },
    signUp:function(btcSigningPub, ethAddress,privKey){
        return sign_up(btcSigningPub, ethAddress,privKey)
    },
    broadCastOracle:function(coin,tx, orderId){
        return push_tx_oracle(coin,tx, orderId)
    },
    markets:function(){
        return get_markets()
    },

    coins:function(){
        return get_coins()
    },

    txid:function(txid){
        return get_txid(txid)
    },

    // trade:function(input){
    //     return create_order(input)
    // },

    trade:function(amountIn,coinIn,amountOut,coinOut){
        return make_trade(amountIn,coinIn,amountOut,coinOut)
    },

    ethWalletFactoryAddress: function() {
      return ethWalletFactoryAddress()
    },

    orderCreate:function(input){
        return create_order(input)
    },

    updateAccount: function(ethAddress, contractAddress) {
        return update_account(ethAddress, contractAddress)
    },

    pairs:function(){
        return get_pairs()
    },

    status:function(orderId){
        return get_order_status(orderId)
    },

    getOrder:function(orderId){
        return get_order(orderId, ARBITER_URL)
    },

    getOrderOracle:function(orderId){
        return get_order(orderId, ORACLE_URL)
    },

    statusOracle:function(orderId){
        return get_order_status_oracle(orderId)
    },

    retarget:function(orderId,rate){
        return retarget_order(orderId,rate)
    },

    orders:function(){
        return orders()
    },

    ordersLive:function(account){
        return get_all_orders_live(account)
    },

    ordersAll:function(account){
        return get_all_orders(account)
    },

    orderbook:function(pair){
        return get_orderbook(pair)
    },

    cancel:function(orderId){
        return cancel_order(orderId)
    },

    cancelOracle:function(orderId){
        return cancel_order_oracle(orderId)
    },

    broadcastOracle:function(tx){
        return push_tx_oracle(tx)
    },
}


/************************************
 //   Primary
 //***********************************/
var get_account = async  function(){
    var tag = " | get_account | "
    var url = ARBITER_URL + "/account"
    log.debug(tag,"url" , url)

    let { address } = await wallet.info()
    let payload = { action: "read" }
    let dataS = JSON.stringify(payload)

    log.debug(tag, `payload`, dataS, address)
    let signature = await wallet.sign(address,dataS)
    log.debug(tag, `response`, signature)

    let body = {account:address,payload,signature}

    return post_request(url,body)
}

var orders = async function(){
    var tag = " | orders | "
    var url = ARBITER_URL + "/account"
    let { address } = await wallet.info()
    let payload = { action: "orders" }

    //let signature = "this is a fake sig"
    let dataS = JSON.stringify(payload)

    log.debug(tag, `payload`, dataS, address)
    let signature = await wallet.sign(address,dataS)
    log.debug(tag, `response`, signature)

    let body = {account:address,payload,signature}

    return post_request(url,body)
}

var sign_up = async function(btcSigningPub, ethAddress, privKey){
    var tag = " | sign_up | "
    var url = ARBITER_URL + "/account"
    log.debug(tag,"url" , url)
    log.debug(tag,"privKey" , privKey)

    let address
    let payload = {}

    if(btcSigningPub) {
        address = btcSigningPub
        payload.ethAddress = ethAddress
    } else {
        let info = await wallet.info()
        log.debug(`signup`, info)
        address = info.signingPub
        payload.ethAddress = info.eth.address
    }

    payload.action = "create"

    let dataS = JSON.stringify(payload)
    let signature

    if (privKey) {
        signature = await wallet.sign(address,dataS,privKey)
    } else {
        signature = await wallet.sign(address,dataS)
    }

    log.debug('!!! account', address, 'payload', payload, 'signature', signature)

    let body = {account:address,payload,signature}

    return post_request(url,body)
}

var push_tx_oracle = async function(coin,tx, orderId){
    var tag = " | cancel_order | "
    var url = ORACLE_URL+"/broadcast"

    //TODO sign
    //TODO multi-coin
    let payload
    if(coin === 'ETH' || coin === 'GNT'){
        payload = {coin,signature:tx,orderId}
    }else{
        payload = {coin,hex:tx}
    }
    let dataS = JSON.stringify(payload)
    let { address } = await wallet.info()
    let signature = await wallet.sign(address,dataS)

    let body = {
        account:address,
        payload:payload,
        signature:signature
    }
    log.debug(tag,"body: ",body)
    return post_request(url,body)
}

var cancel_order = async function(orderId){
    const url = ARBITER_URL+"/cancel"

    //TODO sign
    let payload = {orderId}
    let { address } = await wallet.info()
    let dataS = JSON.stringify(payload)
    let signature = await wallet.sign(address,dataS)

    let body = {
        account:address,
        payload:{orderId},
        signature:signature
    }
    log.debug('cancel_order',"body: ",body)
    return post_request(url,body)
}

var cancel_order_oracle = async function(orderId){
    var tag = " | cancel_order_oracle | "
    var url = ORACLE_URL+"/cancel"

    //TODO sign
    let payload = {orderId}
    let { address } = await wallet.info()
    let dataS = JSON.stringify(payload)
    let signature = await wallet.sign(address,dataS)

    let body = {
        account:address,
        payload:{orderId},
        signature:signature
    }
    log.debug(tag,"body: ",body)
    return post_request(url,body)
}

var get_markets = function(){
    var tag = " | get_market | "

    ////Create User
    var url = ARBITER_URL + "/markets"
    log.debug(tag,"url" , url)

    return get_request(url)
}

var get_pairs = function(){
    var tag = " | get_pairs | "
    ////Create User
    //var url = "http://localhost:5001/getcoins/"
    var url = ARBITER_URL + "/pairs"
    log.debug(tag,"url" , url)
    return get_request(url)
}

var get_coins = function(){
    var tag = " | get_coins | "
    ////Create User
    var url = ARBITER_URL + "/coins"
    log.debug(tag,"url" , url)
    return get_request(url)
}

var get_orderbook = async function(pair){
    var tag = " | get_orderbook | "
    var url = ARBITER_URL + "/orderbook/"+pair
    let output = await get_request(url)
    log.debug(tag,output)
    if(output.payload) output = output.payload
    return output
}

var get_order_status = async function(orderId){
    var url = ARBITER_URL+"/order/"+orderId
    let output = await get_request(url)
    log.debug(output)
    if(output.payload) output = output.payload
    return output
}

var get_order = function(orderId, url) {
    url = url+"/order/"+orderId

    return get_request(url)
}

var get_order_status_oracle = function(orderId){
    var tag = " | get_order_status_oracle | "
    ////Create User
    //var url = "http://localhost:5001/status/"+orderId
    var url = ORACLE_URL+"/status/"+orderId
    //console.log(tag,"url" , url)
    return get_request(url)
}

var get_txid = function(txid){
    var url = ARBITER_URL + "/txid/"+txid
    //console.log(tag,"url" , url)
    return get_request(url)
}


/************************************
 //   Lib
 //***********************************/

var retarget_order = async function(orderId,rate){
    var tag = TAG+" | retarget_order | "
    try{
        log.debug(tag, "checkpoint1")
        log.debug(tag, "orderId: ",orderId)
        log.debug(tag, "rate: ",rate)

        //if(!input.signingPub || !input.signingPriv) throw Error("102: Missing signing params! ")
        var url = ARBITER_URL+"/retarget"
        //console.log(tag, "checkpoint2")
        if(!orderId) throw Error("101: orderId required!")
        var data = {
            orderId,
            rate
        }
        log.debug(tag, "data: ",data)

        let { address } = await wallet.info()
        let dataS = JSON.stringify(data)
        log.debug(tag,"dataS: ",dataS)
        let signature = await wallet.sign(address,dataS)
        //let signature = "this is a fake sig"

        var body = {
            account:address,
            payload:data,
            signature:signature
        }

        //Post to Arbiter
        log.debug(tag,"body: ",body)
        let result = await(post_request(url, body))
        log.debug(tag,"result: ",result)

        if(typeof(result) == "string") result = JSON.parse(result)
        log.debug(tag,"result: ",result)

        //if(result.success === false) throw Error("Arbiter Returned:"+result.error)


        return result.payload
    }catch(e){
        console.error(tag,"Error: ",e)
        throw e
    }
}


var create_order = async function(input){
    var tag = TAG+" | create_order | "
    try{
        log.debug(tag, "checkpoint1")
        log.debug(tag, "input: ",input)
        if ( !input.pubkey
          || !input.expiration
          || !input.pair
          || !input.amountIn
          || !input.rate
          || !input.returnAddress
          || !input.withdrawalAddress) {
            throw Error("101: Invalid params!")
          }

        var url = ARBITER_URL+"/limitorder"

        var data = {
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

        let { address } = await wallet.info()
        let dataS = JSON.stringify(data)
        log.debug(tag,"dataS: ",dataS)
        let signature = await wallet.sign(address,dataS)
        //let signature = "this is a fake sig"

        log.debug(tag, 'url', url)
        log.debug(tag, 'address', address)
        log.debug(tag, 'signature', signature)
        log.debug(tag, 'dataS', dataS)

        let verifyMessage = await wallet.verifyMessage(address, signature, dataS)

        log.debug('verifyMessage.....', verifyMessage)

        let body = {
            account:address,
            payload:data,
            signature:signature
        }

        //Post to Arbiter
        log.debug(tag,"body: ",body)
        let result = await post_request(url, body)
        if(typeof(result) == "string") result = JSON.parse(result)
        log.debug(tag,"result: ",result)

        if(result.success === false) throw Error("Arbiter Returned:"+result.error)
        // if(!result) throw Error("103: Empty response from arbiter! ")
        // if(!result.success) console.error(tag,"Error making order! e: ",result)
        // if(!result.success) throw Error("104: Failed to make order! ")
        // log.debug(tag,"Arbiter Result: ",result)

        //Check Sig


        //Post to Oracle
        //old format
        // REMOVED release version 0.04 (newOrder) no longer supported
        // just use /status bro
        // var url = ORACLE_URL+"/newOrder"
        // log.debug(tag,"url: ", url)
        //
        // let bodyOracle = {
        //     order:body,
        //     arbiterData:result
        // }
        // log.debug(tag,"bodyOracle: ",bodyOracle)
        // let resultOracle = await(post_request(url, bodyOracle))
        // log.debug(tag,"resultOracle: ",resultOracle)
        // if(typeof(resultOracle) == "string") resultOracle = JSON.parse(resultOracle)


        //GET orderId (respec redundant)
        let orderId = result.payload.orderId
        log.debug(tag,"orderId: ",orderId)
        //Post to Oracle
        url = ORACLE_URL+"/status/"+orderId
        log.debug(tag,"url: ", url)

        let resultOracle = await get_request(url)
        log.debug(tag,"resultOracle: ",resultOracle)
        if(typeof(resultOracle) == "string") resultOracle = JSON.parse(resultOracle)
        log.debug(tag,"resultOracle: ",resultOracle)

        //Check Sig

        return result
    }catch(e){
        log.error(tag,"Error: ",e)
        throw e
    }
}

const ethWalletFactoryAddress = async () => {
    const url = ARBITER_URL+"/ethwalletfactoryaddress"

    return await get_request(url)
}

const update_account = async function(ethAddress, contractAddress) {
    var url = ARBITER_URL+"/account"

    var data = { ethAddress, contractAddress }

    let { address } = await wallet.info()

    let msg = JSON.stringify(data)
    let signature = await wallet.sign(address,msg)

    var body = {
        account: address,
        payload: data,
        signature: signature
    }

    //Post to Arbiter
    return post_request(url, body, 'PUT')
}
