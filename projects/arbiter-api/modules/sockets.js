/*

    Sub to "publish"

    normalize

    pub to "publishToFront"

   Goals:
   * groom What goes to socket.io

 */
require('dotenv').config({path:"../../../.env"});

let TAG = " | socket Router | "
const util = require('@arbiter/arb-redis')
const redis = util.redis
let publisher = util.publisher
let subscriber = util.subscriber
const log = require('@arbiter/dumb-lumberjack')()



subscriber.subscribe('publish')
subscriber.on('message', async function (channel, payloadS) {
    let tag = TAG + ' | publish | '
    try {
        let payload = JSON.parse(payloadS)
        log.debug(tag,"payload: ",payload)

        let event = payload.event
        if(!event) throw Error("102: invalid event!!!")

        let lastBlock

        switch (event) {
            case 'deposit':
                //
                let summary1 = summarize_deposit(payload)

                //push to web
                //TODO channels
                publisher.publish("publishToFront",JSON.stringify(summary1))

                break;
            case 'submit':

                //
                let summary2 = await summarize_submit(payload)

                log.debug(tag, 'submit, summary2', summary2)

                //push to web
                //TODO channels
                publisher.publish("publishToFront",JSON.stringify(summary2))

                break;
            case 'cancel':

                let summary3 = await summarize_cancel(payload)

                log.debug(tag, 'cancel, summary3', summary3)

                //push to web
                //TODO channels
                publisher.publish("publishToFront",JSON.stringify(summary3))


                break;
            case 'match':

                let summary4 = summarize_match(payload)

                //push to web
                //TODO channels
                publisher.publish("publishToFront",JSON.stringify(summary4))

                break;
            case 'withdrawal':

                let summary5 = summarize_deposit(payload)

                //push to web
                //TODO channels
                publisher.publish("publishToFront",JSON.stringify(summary5))

                break;
        }
    }catch(e){
        log.error(tag,e)
        throw e
    }
})
log.info(TAG," Socket router started! ")

/****************************************************
 // Library
 //****************************************************/

let summarize_match = function(matchEvent){
    try{
        let updates = []

        updates.push({orderId:matchEvent.restingOrder.id,qty:matchEvent.restingOrder.quantity})
        updates.push({orderId:matchEvent.restingOrder.id,qty:matchEvent.restingOrder.quantity})

        // updates[matchEvent.restingOrder.id] = matchEvent.restingOrder.quantity
        // updates[matchEvent.aggressiveOrder.id] = matchEvent.aggressiveOrder.quantity
        //
        let output = {
            event:"orderUpdate",
            market:matchEvent.engine,
            eventSummaries:matchEvent.balances.summary,
            newOrderStates:updates
        }


        return output
    }catch(e){
        throw e
    }
}

let summarize_cancel = async function(depositInfo){
    let tag = TAG + " | summarize_cancel | "
    try{
        let updates = []

        updates.push({orderId:depositInfo.orderId,qty:0})
        let orderInfo = await redis.hgetall(depositInfo.orderId)
        // updates[matchEvent.restingOrder.id] = matchEvent.restingOrder.quantity
        // updates[matchEvent.aggressiveOrder.id] = matchEvent.aggressiveOrder.quantity
        //

        let output = {
            event:"orderUpdate",
            market:orderInfo.market,
            eventSummaries:['order: '+depositInfo.orderId+' is cancelled!'],
            newOrderStates:updates
        }
        log.debug(tag,"output: ",output)

        return output
    }catch(e){
        throw e
    }
}


/*

    input:

    {
    event: 'submit',
    orderId: 'b2a0e397-da8e-481b-a0b1-072167a0e96a',
    status: 'live',
    payment:
    { value: 0.001,
        n: 1,
        scriptPubKey:
        { asm:
            'OP_HASH160 29093dcecbc1cf7ea4440ba364d86c3cf149df06 OP_EQUAL',
                hex: 'a91429093dcecbc1cf7ea4440ba364d86c3cf149df0687',
            reqSigs: 1,
            type: 'scripthash',
            addresses: [Array] },
        txid:
            '3d10292a8ae4e0a7091c2af5a38bea74828a70599a52437e35b6491c0f5e91ef',
                coin: 'btc' }
    }



    output:



 */

let summarize_submit = async function(depositInfo){
    let tag = TAG + " | summarize_submit | "
    try{
        let updates = []

        //
        let orderInfo = await redis.hgetall(depositInfo.orderId)
        log.debug(tag,"orderInfo: ",orderInfo)

        updates.push({orderId:depositInfo.orderId,qty:depositInfo.quantity,price:depositInfo.rate})

        // updates[matchEvent.restingOrder.id] = matchEvent.restingOrder.quantity
        // updates[matchEvent.aggressiveOrder.id] = matchEvent.aggressiveOrder.quantity
        //
        let output = {
            event:"orderUpdate",
            market:orderInfo.market,
            rate:depositInfo.price,
            eventSummaries:['order: '+depositInfo.orderId+' funded! new order status: live'],
            newOrderStates:updates
        }
        log.debug(tag,"output: ",output)

        return output
    }catch(e){
        throw e
    }
}


let summarize_deposit = function(depositInfo){
    try{
        let updates = []

        updates.push({orderId:matchEvent.restingOrder.id,qty:matchEvent.restingOrder.quantity})
        updates.push({orderId:matchEvent.restingOrder.id,qty:matchEvent.restingOrder.quantity})

        // updates[matchEvent.restingOrder.id] = matchEvent.restingOrder.quantity
        // updates[matchEvent.aggressiveOrder.id] = matchEvent.aggressiveOrder.quantity
        //
        let output = {
            event:"orderUpdate",
            market:matchEvent.engine,
            eventSummaries:matchEvent.balances.summary,
            newOrderStates:updates
        }


        return output
    }catch(e){
        throw e
    }
}

//
