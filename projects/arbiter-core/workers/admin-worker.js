
/*
        Redis pub/sub

        1 message a second limited slack push api
 */
const TAG = " | Slack | "
require('dotenv').config();

const util = require('@arbiter/arb-redis')
const subscriber = util.subscriber
const publisher = util.publisher
const redis = util.redis
const log = require('@arbiter/dumb-lumberjack')()


const config = require("../configs/env")
//log.debug(configs)

//wallet
const { daemons } = require('@arbiter/arb-daemons-manager')
const { btc, ltc, eth } = daemons

/*
        Sub to slack, push to redis


 */

/****************************************************
 // Pub/Sub
 //****************************************************/
//TODO this is all fucked, events dont make sense cleanup
// subscriber.subscribe('credits')
// subscriber.subscribe('debits')
// subscriber.subscribe('match')
// subscriber.on('message', async function (channel, payloadS) {
//     let tag = TAG + ' | on-chain accounting | '
//     try {
//         //
//         log.debug(tag,"channel: ",channel)
//         log.debug(tag,"payloadS: ",payloadS)
//         let payload = JSON.parse(payloadS)
//
//         let body
//         let output
//
//         switch (channel) {
//             case "match":
//
//                 let coins = payload.market.split("_")
//
//                 //
//
//                 body = "trade event! :twisted_rightwards_arrows: market: :"+coins[0]+"::"+coins[1]+": aggressive: "+payload.aggressiveOrder.id+" resting: "+payload.restingOrder.id
//
//                 output = {view:{icon_emoji: ':rocket:'},msg:body,channel:config.SLACK_CHANNEL_EVENTS}
//                 publisher.publish("publish",JSON.stringify(output))
//
//                 break
//             case "credits":
//
//                 if(payload.realm && payload.account){
//                     //LA event on exchange
//
//                     //Log human reable events
//                     // if(payload.account === "mjFXrcSiNJZrpfy8MfagY3dH1mBMStoyr8:binance"){
//                     //     account = ":robot_face:"
//                     // }
//
//                     //account x sent x coin into arbiter
//                     body = "CREDIT: :heavy_plus_sign: :account: "+payload.account+" "+payload.amount+" ("+payload.coin+") ("+(await get_value(payload.amount,payload.coin)).toFixed(2)+") on :binance:! tradeId: "+payload.id
//                     output = {view:{icon_emoji: ':rocket:'},msg:body,channel:config.SLACK_CHANNEL_EVENTS}
//                     log.debug(tag,"output: ",output)
//                     publisher.publish("publish",JSON.stringify(output))
//
//                 }else{
//                     //Log human reable events
//                     let orderInfo = await redis.hgetall(payload.orderId)
//                     let account = orderInfo.account
//                     log.debug(tag,"orderInfo: ",orderInfo)
//                     log.debug(tag,"account: ",account)
//                     payload.account = account
//                     if(account === "mgeWf3udvKDhF6ndr8dXBpnUHKSWCUEBCx"){
//                         account = ":crossed_swords:"
//                     }
//
//                     //account x sent x coin into arbiter
//                     body = ":takemymoney: :account: "+account+" sent "+payload.value+" ("+payload.coin+") ("+(await get_value(payload.value,payload.coin)).toFixed(2)+") into arbiter! funding order: "+payload.orderId
//                     output = {view:{icon_emoji: ':rocket:'},msg:body,channel:config.SLACK_CHANNEL_EVENTS}
//                     log.debug(tag,"output: ",output)
//                     publisher.publish("publish",JSON.stringify(output))
//
//                 }
//
//                 break;
//             case "debits":
//                 if(payload.realm){
//                     //LA event on exchange
//                     let account = payload.account
//                     //Log human reable events
//                     if(payload.account === "mjFXrcSiNJZrpfy8MfagY3dH1mBMStoyr8:binance"){
//                         account = ":robot_face:"
//                     }
//
//                     //account x sent x coin into arbiter
//                     body = "DEBIT: :heavy_minus_sign: :account: "+account+" "+payload.amount+" ("+payload.coin+") ("+(await get_value(payload.amount,payload.coin)).toFixed(2)+") on :binance:! tradeId: "+payload.id
//                     output = {view:{icon_emoji: ':rocket:'},msg:body,channel:config.SLACK_CHANNEL_EVENTS}
//                     log.debug(tag,"output: ",output)
//                     publisher.publish("publish",JSON.stringify(output))
//
//                 }else {
//                     //Log human reable events
//                     if (payload.sweep) {
//                         //account x sent x coin into arbiter
//                         body = ":outbox_tray: returned " + payload.amount + "(" + payload.coin + ") (USD: " + (await get_value(payload.value, payload.coin)).toFixed(2) + ") Returning order: " + payload.orderId + " TXID: " + payload.txid
//                         output = {view: {icon_emoji: ':rocket:'}, msg: body, channel: config.SLACK_CHANNEL_EVENTS}
//                         log.debug(tag, "output: ", output)
//                         publisher.publish("publish", JSON.stringify(output))
//
//                     } else {
//                         //account x sent x coin into arbiter
//                         body = ":money_with_wings: Sent " + payload.amount + "(" + payload.coin + ") (USD:" + (await get_value(payload.value, payload.coin)).toFixed(2) + ") fullfilling order: " + payload.orderId + " TXID: " + payload.txid
//                         output = {view: {icon_emoji: ':rocket:'}, msg: body, channel: config.SLACK_CHANNEL_EVENTS}
//                         log.debug(tag, "output: ", output)
//                         publisher.publish("publish", JSON.stringify(output))
//
//                     }
//                 }
//                 break;
//             default:
//                 log.error(tag," unhandled channel: ",channel)
//                 break;
//         }
//
//         //arbiter sent x coin to account x fullfilling order x
//
//
//         //arbiter swept x coin into hot sweeping x order
//
//     }catch(e){
//         log.error(tag,e)
//     }
// })

/****************************************************
 // Lib
 //****************************************************/

let get_value = async function(amount,coin){
    try{
        coin = coin.toUpperCase()
        let rateBTC = await redis.hget("rates",coin)
        //console.log(rateBTC)

        return amount / (1/ rateBTC)
    }catch(e){
        console.error(e)
    }
}


const get_balances = async function(){
    let tag = TAG + " | get_balances | "
    try{
        //get all daemons from configs
        let wallets = Object.keys(uwallet)
        log.debug(tag,"wallets: ",wallets)

        //build balance object
        let balances = {}
        for (let i = 0; i < wallets.length; i++) {
            let wallet = wallets[i]
            let balance = await uwallet[wallet].getBalance()
            balances[wallet] = balance
        }
        return balances
    }catch(e){
        log.error(tag,e)
    }
}
