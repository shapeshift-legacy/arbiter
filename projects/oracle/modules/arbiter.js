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
const when = require('when')
const config = require('../configs/env')
const log = require('@arbiter/dumb-lumberjack')()
const testnet = true
const { post_request, get_request } = require('./request')
let { btc,ltc,eth} = require('@arbiter/arb-daemons-manager').daemons
const {
  ARBITER_URL,
  ORACLE_URL,
  USER_BTC_SIGNING_ADDRESS,
  USER_ETH_ADDRESS
} = config


module.exports = {

    cancel:function(orderId){
        return cancel_order(orderId)
    },
}


/************************************
 //   Primary
 //***********************************/

var cancel_order = async function(orderId){
    var d = when.defer();
    var tag = " | cancel_order | "
    let debug = false
    ////Create User
    //var url = "http://localhost:5001/status/"+orderId
    var url = ARBITER_URL+"/cancel"
    //console.log(tag,"url" , url)

    //TODO sign
    let payload = {orderId}
    let dataS = JSON.stringify(payload)
    let signature = await btc.signMessage(USER_BTC_SIGNING_ADDRESS,dataS)

    let body = {
        account:USER_BTC_SIGNING_ADDRESS,
        payload:{orderId},
        signature:signature
    }
    log.debug(tag,"body: ",body)
    post_request(url,body)
        .then(function(resp){
            if(resp){
                log.debug(tag,"resp: ",resp)
                // if(typeof(resp)=="string"){
                //     resp = JSON.parse(resp)
                // }
                if(resp){
                    d.resolve(resp)
                }else{
                    d.resolve(resp)
                }

            }else{
                d.reject(false)
            }
        })
    return d.promise
}
