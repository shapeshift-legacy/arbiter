


const util = require('@arbiter/arb-redis')
const redis = util.redis
const subscriber = util.subscriber
const publisher = util.publisher

let matchEvent = {
   engine: 'LTC_BTC',
   time: 1539980734611,
   restingOrder:
        { id: 'e4ba498d-8a72-4170-b20b-05224d09cbc5',
              price: '0.00825600',
          quantity: 0.9667441860465116,
          status: 'Working',
          isBuy: false },
   aggressiveOrder:
    { id: '8796c22c-3e9d-4e72-b288-467bf7a26a5f',
          price: '0.043',
      quantity: 0,
      status: 'complete',
      isBuy: true },
   restingOrderPrice: '0.00825600',
   matchQuantity: 0.023255813953488375,
   balances:
    { summary:
       [ 'event: 1539980734611 order: 8796c22c-3e9d-4e72-b288-467bf7a26a5f bought 0.000192 (LTC) at 0.00825600',
             'event: 1539980734611 order: e4ba498d-8a72-4170-b20b-05224d09cbc5 sold 0.023255813953488375 (LTC) at 0.00825600' ],
          balanceResting:
       { id: 'e4ba498d-8a72-4170-b20b-05224d09cbc5',
             LTC: 96674419,
         BTC: 19200 },
      balanceAggresive:
       { id: '8796c22c-3e9d-4e72-b288-467bf7a26a5f',
             LTC: 2325581,
         BTC: 80800 } },
   restingInfoVerbose:
    { account: 'mpJ19nmaDocEQdTBvh6jnD3pMFyp3rFYmL',
          market: 'LTC_BTC',
      orderId: 'e4ba498d-8a72-4170-b20b-05224d09cbc5',
      amountQuote: '-0.99',
      rate: '0.00825600',
      type: 'ask',
      owner: 'liquidityAgent',
      coinIn: 'LTC',
      coinOut: 'BTC',
      coinFunding: 'LTC',
      LTC: '96674419',
      price: '0.00825600',
      quantity: '-0.99',
      BTC: '19200' },
   aggessiveInfoVerbose:
    { amountIn: '0.001',
          price: '0.043',
      rate: '0.043',
      owner: 'customer',
      status: 'live',
      BTC: '80800',
      txidIn:
       '011334e9acc17d1d9cb456b06c90f7f2e5bd279c28d8f0141b5b35f2316a97e1',
      withdrawalAddress: 'QTS8oT9sfq7xNxJX5UcZRNcSDu8HD28p1t',
      signingAddress: 'mgeWf3udvKDhF6ndr8dXBpnUHKSWCUEBCx',
      returnAddress: 'n4DYeMYZmyTugRwUbb7R79VJkw5Dk77ZA7',
      coin: '1',
      LTC: '2325581',
      quantity: '0.043',
      expiration: '1539992734241',
      market: 'LTC_BTC',
      timeCreation: '1539980734241',
      pubkeyOracle:
       '038a5df3a56264239cba1b4033d8f4371c0a3f95f252146324798c6715d642cf11',
      arbiterPubKey:
       '02fb5ba919cdcf7bb1a6735b93a54c1764e8f8a28c5d1b1d7cee890e604da14505',
      amountOut: '0.023255813953488375',
      account: 'mgeWf3udvKDhF6ndr8dXBpnUHKSWCUEBCx',
      userkey:
       '0315073bacd5d6002c4aa6c4ed55e1f65865aa049e6a9043e4ea7baacb4dff9be0',
      depositAddress: '2NA3LPV4JxpXsEcVhJahXHF2TsjZgXqSryL',
      pubkeyArbiter:
       '02fb5ba919cdcf7bb1a6735b93a54c1764e8f8a28c5d1b1d7cee890e604da14505',
      coinOut: 'LTC',
      coinIn: 'BTC',
      orderId: '8796c22c-3e9d-4e72-b288-467bf7a26a5f' },
       market: 'LTC_BTC'
    }

let summarize_match = function(matchEvent){
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
