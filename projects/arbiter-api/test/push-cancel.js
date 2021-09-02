


const util = require('@arbiter/arb-redis')
const redis = util.redis
const subscriber = util.subscriber
const publisher = util.publisher


let summarize_cancel = function(matchEvent){
    try{
        let updates = []

        updates.push({orderId:matchEvent.restingOrder.id,qty:matchEvent.restingOrder.quantity})
        updates.push({orderId:matchEvent.restingOrder.id,qty:matchEvent.restingOrder.quantity})
        //
        let output = {
            market:matchEvent.engine,
            eventSummaries:matchEvent.balances.summary,
            newOrderStates:updates
        }


        return output
    }catch(e){
        throw e
    }
}


let message = summarize_match(matchEvent)
message.event = "orderUpdate"
console.log("message: ",message)



// let message = {
//     event:"trade",
//     market:"LTC_BTC",
//
// }
//
// // let message = {
// //     event:"lowBid",
// //     lowBid:99999.99
// // }
//
// // let message = {
// //     event:"highAsk",
// //     highAsk:99999.99
// // }
//
//
publisher.publish("publishToFront",JSON.stringify(message))
