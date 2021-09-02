


const util = require('@arbiter/arb-redis')
const redis = util.redis
const subscriber = util.subscriber
const publisher = util.publisher

let message = {
    event:"lastPrice",
    lastPrice:99999.99
}

// let message = {
//     event:"lowBid",
//     lowBid:99999.99
// }

// let message = {
//     event:"highAsk",
//     highAsk:99999.99
// }


publisher.publish("publishToFront",JSON.stringify(message))
