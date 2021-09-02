let TAG = ' | match | '
const util = require('@arbiter/arb-redis')
const redis = util.redis
let publisher = util.publisher
let subscriber = util.subscriber


const config = require("../configs/env")
let { btc,ltc,eth} = require('@arbiter/arb-daemons-manager').daemons
let wallets = { BTC:btc, LTC:ltc, ETH:eth }

let {match,balances,credits,debits,orders,users} = require('./mongo.js')
let mongo = require("@arbiter/arb-mongo")

// logging
const log = require('@arbiter/dumb-lumberjack')()

let homeAddress = {
    LTC: config.MASTER_LTC,
    BTC: config.MASTER_BTC,
    ETH: config.MASTER_ETH
}

log.debug('homeAddress', homeAddress)

// modules
//const oracle = require('./oracle.js')
const app = require('./txBuilder.js')
const trade = require('./hte.js')
const rates = require('@arbiter/arb-rates')





subscriber.subscribe('match')
subscriber.on('message', async function (channel, payloadS) {
    let tag = TAG + ' | match pub/sub | '
    try {
        if (channel === 'match') {
            //
            let matchData = JSON.parse(payloadS)
            log.debug(tag, 'matchData: ', matchData)

            // get trade status
            // TODO get this from payload
            let restingStatus = await trade.getStatus(matchData.engine, matchData.restingOrder.id)
            let aggressiveStatus = await trade.getStatus(matchData.engine, matchData.aggressiveOrder.id)
            log.debug(tag, 'restingStatus: ', restingStatus)
            log.debug(tag, 'aggressiveStatus: ', aggressiveStatus)

            let fullfillResting = false
            let fullfillAggressive = false
            // TODO why is this broke? always { state: 'pending' } LIES!!!!
            if (restingStatus.status == 'complete') fullfillResting = true
            if (aggressiveStatus.status == 'complete') fullfillAggressive = true

            if (matchData.restingOrder.status == 'complete') fullfillResting = true
            if (matchData.aggressiveOrder.status == 'complete') fullfillAggressive = true

            let restingInfo = await redis.hgetall(matchData.restingOrder.id)
            let aggressiveInfo = await redis.hgetall(matchData.aggressiveOrder.id)
            log.debug(tag, 'aggressiveInfo: ', aggressiveInfo)
            log.debug(tag, 'restingInfo: ', restingInfo)

            // hack removeme
            // if(restingInfo.userkey)    restingInfo.owner = 'customer'
            // if(aggressiveInfo.userkey) restingInfo.owner = 'customer'

            /*
                Phase2:  Liquidity agent revamp

                we do partials bro

                Liquidity agent DOES have partials

                *push partial to trade engine
                partial trades as pieces come in.

                only fullfill if customer order AND complete.
            */

            // if LA
            if (restingInfo.owner === 'liquidityAgent') {
                // publish trade request
                // let action = {}
                // action.event = 'trade'
                // action.type = 'bid'
                // action.quantity = matchData.matchQuantity
                // action.price = matchData.restingOrderPrice
                // publisher.publish('trade', JSON.stringify(action))
                push_trade_to_agent('bid', matchData)
            }

            if (aggressiveInfo.owner === 'liquidityAgent') {
                // publish trade request
                // let action = {}
                // action.event = 'trade'
                // action.type = 'ask'
                // action.quantity = matchData.matchQuantity
                // action.price = matchData.restingOrderPrice
                // publisher.publish('trade', JSON.stringify(action))
                push_trade_to_agent('ask', matchData)
            }

            // if customer && incomplete
            // do nothing

            /*
                If complete AND customer

                //NOTE: if BTC is coinIn BTC balance MUST be 0 (if not 0 resubmit) TODO fubar not doing this yet

                build tx from HOT to customer

                build tx from multi-sig to HOT

                ask oracle to sign

            */

            if (restingInfo.owner === 'customer' && fullfillResting) {
                log.info(tag," order: "+restingInfo.orderId+" is complete! adding to fullfillment queue")
                redis.rpush('queue:orders:fullfillment', restingInfo.orderId)
            }

            if (aggressiveInfo.owner === 'customer' && fullfillAggressive) {
                log.info(tag," order: "+aggressiveInfo.orderId+" is complete! adding to fullfillment queue")
                redis.rpush('queue:orders:fullfillment', aggressiveInfo.orderId)
            }


            if (restingInfo.owner === 'liquidityAgent' && restingStatus.status == 'complete') {
                fullfillment.fullfillLA(restingInfo.orderId)
            }


            if (aggressiveInfo.owner === 'liquidityAgent' && aggressiveInfo.status == 'complete') {
                fullfillment.fullfillLA(aggressiveInfo.orderId)
            }

            //save in mongo
            mongo['match-history'].insert(matchData)

            // TODO info for oracle? *
            //Push to websocket
            publisher.publish('publish', JSON.stringify(matchData))

            //push last price
            let message = {
                event:"lastPrice",
                lastPrice:matchData.restingOrderPrice
            }
            publisher.publish("publishToFront",JSON.stringify(message))


            //push account events



            //globals
            calculate_globals(matchData)

            //summarize
            //matchData.event = "match"
            //let summary = summarize_match(matchData)

            //push to front

            //Push to websocket
            //publisher.publish('publishToFront', JSON.stringify(summary))

            return matchData
        }
    } catch (e) {
        console.error(tag, 'Error: ', e)
    }
})


/****************************************************
 // Library
 //****************************************************/


const calculate_globals = async function (matchInfo) {
    let tag = TAG + ' | push_trade_to_agent | '
    try {
        let currentGlobalinfo = await redis.hgetall(matchInfo.market+":globals")
        log.debug(tag,"currentGlobalinfo: ",currentGlobalinfo)


        //save last price
        // redis.hset(market+":globals","lastPrice",restingOrderPrice)

        //add volumes
        //let newVolume = currentGlobalinfo.



        return true
    } catch (e) {
        console.error(tag, e)
        log.error('ERROR: ', e)
        throw e
    }
}


// let summarize_match = function(matchEvent){
//     try{
//         let updates = []
//
//         updates.push({orderId:matchEvent.restingOrder.id,qty:matchEvent.restingOrder.quantity})
//         updates.push({orderId:matchEvent.restingOrder.id,qty:matchEvent.restingOrder.quantity})
//
//         // updates[matchEvent.restingOrder.id] = matchEvent.restingOrder.quantity
//         // updates[matchEvent.aggressiveOrder.id] = matchEvent.aggressiveOrder.quantity
//         //
//         let output = {
//             market:matchEvent.engine,
//             eventSummaries:matchEvent.balances.summary,
//             newOrderStates:updates
//         }
//
//
//         return output
//     }catch(e){
//         throw e
//     }
// }

const push_trade_to_agent = async function (type, matchData) {
    let tag = TAG + ' | push_trade_to_agent | '
    try {
        log.debug(tag,"matchData: ",matchData)

        let action = {}
        action.market = matchData.engine
        if(type === "bid"){
            action.orderId = matchData.restingOrder.id
            if(matchData.restingOrder.id.status === "working") action.partial = true
        }
        if(type === "ask"){
            action.orderId = matchData.aggressiveOrder.id
            if(matchData.aggressiveOrder.id.status === "working") action.partial = true
        }

        action.event = 'trade'
        action.time = matchData.time
        action.type = type
        action.quantity = matchData.matchQuantity
        action.price = matchData.restingOrderPrice
        //action.summary = matchData.balances.summary
        log.debug(tag,"action: ",action)
        publisher.publish('trade', JSON.stringify(action))

        return true
    } catch (e) {
        console.error(tag, e)
        log.error('ERROR: ', e)
        throw e
    }
}
