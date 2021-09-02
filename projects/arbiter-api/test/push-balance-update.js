


const util = require('@arbiter/arb-redis')
const redis = util.redis
const subscriber = util.subscriber
const publisher = util.publisher

let event1 = {
    type:"CREDIT",
    asset:"",
    amount:""
}

let event2 = {
    type:"DEBIT",
    asset:"",
    amount:""
}

let message = {
    event:"accountUpdate",
    account:"mpyF2zVQAiQ1ysaDqxhXhiCBV2kBLPdYra",
    eventDescription:"Match Event!",
    asset:"LTC",
    eventSummary:" Bought " +0.01+ " (LTC) at price: "+0.002,
    newBalance:8000000
}


publisher.publish("publishToFront",JSON.stringify(message))
