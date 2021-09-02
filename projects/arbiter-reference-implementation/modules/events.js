/**
 * Created by highlander on 3/6/17.
 */
const util = require('./arbiterUtil')
const redis = util.redis
let publisher = util.publisher
let subscriber = util.subscriber
const log = require('@arbiter/dumb-lumberjack')()
// const async = require('asyncawait/async')
// const await = require('asyncawait/await')
// const util = require('util')
// const EventEmitter = require('events').EventEmitter;
const events = require('events');
const eventEmitter = new events.EventEmitter();


/********************************
 //modules
 //********************************/
const orders = require('./orders.js')
const accounting   = require('./accounting.js')
const btc   = require('./bitcoin.js')
const txHandler   = require('./txHandler.js')

const debug = true

/****************************************************
 //   subscibe to orderbook changes
 //****************************************************/
var subscribe = function(){
    try{

        var publish = function(payload){
            var tag = TAG+ " | publish | "
            if(typeof(payload)== "string"){
                payload = {payload}
            }
            publisher.publish("publish",JSON.stringify(payload))
        }

        const TAG = " | engine | "

        const channels = [
            'status',
            'orders',
            'credit',
            'startup',
            'ethereum',
            'events',
            'received',
            'accounting',
            'blockchain',
            'market',
            'open',
            'coinbase',
            'poloniex',
            'done',
            'match',
            'ethOracleVerify'
        ]

        for (var i = 0; i < channels.length; i++) {
            subscriber.subscribe(channels[i]);
        }


        console.log(TAG,"Checkpoint1")
        subscriber.on("message", async function(channel, payloadS) {
            var tag = TAG+ " | subscriber | "
            console.log(tag,"channel")

            //emit test
            //eventEmitter.emit("event",{foo:"bar"})

            try{
                var debug = true
                var verbose = false
                log.debug("Message '" + payloadS.length + "' on channel '" + channel + "' arrived!")
                var time = new Date().getTime()
                try {
                    var payload = JSON.parse(payloadS)
                }catch(e){
                    console.error(tag," Bad payload! ",payloadS)
                }
                log.debug(tag,"payload: ",payload)
                log.debug(tag,"channel: ",channel)
                payload.type = channel

                //write to


                //handler

                switch(channel) {
                    case 'startup':
                        arbiter.initialize()
                        break
                    case 'orders':
                        // not used anymore?

                        break
                    case 'credit':
                        // not used anymore?
                        if(!payload || !payload.address || !payload.amount || !payload.txid) throw "ERROR:105 Invalid payload!"
                        orders.credit(payload.address,payload.amount,payload.txid)
                        break
                    case 'ethereum':
                        //address created
                        if(payload.event == "contractCreation" && payload.depositAddress){
                            //save stuff
                            console.log(tag,"depositAddress :",payload.depositAddress)
                            redis.sadd("orders:deposit",payload.orderId+":"+payload.depositAddress)
                            redis.sadd("eth:address",payload.depositAddress)
                            redis.hset(payload.orderId,"depositAddress",payload.depositAddress);
                            //redis.hset(payload.orderId,"totalAmount",input.amountIn);
                            //broadcast
                            var order = await(redis.hgetall(payload.orderId))

                            var output = {}
                            output.event = "orderUpdate"
                            output.order = order
                            output.order.orderId=payload.orderId
                            publish(output)
                        }
                        else {
                            console.error(tag, "bad payload : " ,payload)
                        }
                        //payment recieved

                        break
                    case 'match':
                        tag = tag + " | match | "
                        console.log(tag,"*************************************** checkpoint match!")
                        console.log(tag,"payload:",payload)


                        txHandler.digestMatch(payload)

                        //code replaced by txHandler!

                        //accounting!
                        //internal order settlement
                        // var matchAmountBase = payload.matchQuantity
                        // var matchAmountQuote = payload.matchQuantity * payload.restingOrderPrice
                        // log.debug(tag,"matchAmountBase:",matchAmountBase)
                        // log.debug(tag,"matchAmountQuote:",matchAmountQuote)
                        //
                        // let restingCoin, aggressiveCoin, restingAmount, aggressiveAmount
                        // if(payload.restingOrder.isBuy === true)
                        // {
                        //     restingCoin = "BTC"
                        //     restingAmount = matchAmountQuote
                        //     aggressiveCoin = "ETH"
                        //     aggressiveAmount = matchAmountBase
                        // }
                        // else
                        // {
                        //     restingCoin = "ETH"
                        //     restingAmount = matchAmountBase
                        //     aggressiveCoin = "BTC"
                        //     aggressiveAmount = matchAmountQuote
                        // }
                        // log.debug(tag," coin in resting order: ",restingCoin," coin in aggressive order: ",aggressiveCoin)
                        //
                        // //TODO Build txids for all orders
                        //
                        // //resting order
                        // console.log(tag,"DEBIT resting: ",payload.restingOrder.id,restingAmount,restingCoin)
                        // await( accounting.debit(payload.restingOrder.id,restingAmount,restingCoin))
                        //
                        // //credit BTC
                        // console.log(tag,"CREDIT resting: ",payload.restingOrder.id,aggressiveAmount,aggressiveCoin)
                        // await( accounting.credit(payload.restingOrder.id,aggressiveAmount,aggressiveCoin) )
                        //
                        // //build new fullfillment transaction
                        // // Build transaction with input from testing, to the output of the aggressive order
                        // let txRestingFullfillment = await([restingCoin].buildTransactionFullfillment(payload.aggressiveOrder.id,aggressiveAmount))
                        // //build new return transaction
                        // //amount return = amount left on order
                        // let txRestingReturn = await([restingCoin].buildTransactionReturn(payload.restingOrder.id,restingAmount))
                        //
                        //
                        // //credit ETH
                        // console.log(tag,"CREDIT aggresive: ",payload.aggressiveOrder.id,restingAmount,restingCoin)
                        // await( accounting.credit(payload.aggressiveOrder.id,restingAmount,restingCoin))
                        //
                        // //debit BTC
                        // console.log(tag,"DEBIT aggresive: ",payload.aggressiveOrder.id,aggressiveAmount,aggressiveCoin)
                        // await( accounting.debit(payload.aggressiveOrder.id,aggressiveAmount,aggressiveCoin))
                        //
                        // //build new fullfillment transaction
                        // // Build transaction with input from testing, to the output of the aggressive order
                        // let txAggressiveFullfillment = await([restingCoin].buildTransactionFullfillment(payload.aggressiveOrder.id,aggressiveAmount))
                        // //build new return transaction
                        // //amount return = amount left on order
                        // let txAggressiveReturn = await([restingCoin].buildTransactionReturn(payload.restingOrder.id,restingAmount))
                        //
                        //
                        // //TODO if any complete broadcast and update complete
                        //
                        //
                        //
                        // //TODO if completed This replaces all fullfillment code!
                        //


                        break
                    case 'close':
                        tag = tag + " | close | "
                        var debug = true
                        log.debug(tag," Order Finished! orderId: ",payload.orderId)
                        await( redis.sadd("orders_pending_fulfillment",payload.orderId))
                        //TODO arbiter.fulfill(payload.orderId)

                        break
                    case 'status':
                        //TODO check status vr redis or something?


                        break
                    case 'open':
                        //TODO check status vr redis or something?


                        break
                    case 'received':
                        tag = tag + " | received | "
                        //an order was recived
                        log.debug(tag,payload)
                        //create an order and insert it into the right engine



                        if(payload.orderType === "bid"){
                            // dont need to reverse pair
                            var pair = payload.pair
                            // quantity is positive
                            var quantity = payload.quantity
                            // price stays same?
                            var price = payload.price
                        } else if(payload.orderType === "ask"){
                            //ask, reverse pair
                            var coins = payload.pair.split("_")
                            var pair = coins[1]+"_"+coins[0]
                            //quantity is negitive
                            var quantity = payload.quantity * -1
                            // price stays same?
                            var price = payload.price
                        }




                        if(payload.orderId && pair && quantity && price){
                            log.debug(tag," inserting order into engine! pair: ",pair," price: ", price," quantity: ",quantity)
                            //trade.submitOrder(payload.orderId, quantity, price)
                            eventEmitter.emit('submitOrder',payload.orderId, quantity, price)

                            //redis.hset(payload.orderId,"matchId",internalId)
                            //redis.hset(internalId,"orderId",payload.orderId)
                        } else {
                            throw "ERROR:A133 unable to place trade!!!! payload: ", payload
                        }


                        break
                    case 'blockchain':
                        // if eth
                        log.debug(tag,": Blockchain: payload: ",payload)

                        /*
                         payload:  {
                         blockHash: '0x6f0a4f814b3bc70b20aa8269c2a4235b8becd63ef8fd0b384ceebfc13206602b',
                         blockNumber: 2056683,
                         creates: null,
                         from: '0xea674fdde714fd979de3edf0f56aa9716b898ec8',
                         gas: 90000,
                         gasPrice: '20000000000',
                         hash: '0x17c866cb116fed8cf587bb0c6311c6a37c43f63cb62d61553933336d266b4dc9',
                         input: '0x',
                         nonce: 395636,
                         raw: '0xf870830609748504a817c80083015f909495ffe91901207ddbcc3c9d1aefab87c87a4513c9880de344c2b2f0ca80801ba0b52623aedcb1cc3fe2a30d48198a70ba086053d66ee17ce1db751bb8e398e7d8a072a40a7c69fc26225b54d7cfe82b3ab3cbb13c2873f282658a3d2f614cdeaaee',
                         to: '0x95ffe91901207ddbcc3c9d1aefab87c87a4513c9',
                         transactionIndex: 14,
                         value: '1000719145222851200',
                         type: 'blockchain'
                         }


                         */
                        log.debug(tag," Checkpoint Funding Order")
                        //Indexing deposits vr orders. (could be optimized?)
                        var depositIndex = await(orders.updateDepositIndex())


                        //TODO how does this work???? can only get orderId on ETH>?
                        if(!payload.to){
                            //console.error(tag," UNABLE TO LOOKUP ORDER BY ADDRESS payload: ",payload)
                        } else {
                            var orderId = depositIndex[payload.to]
                            log.debug(tag,"orderId: ",orderId)
                            orders.fund(orderId, payload)
                        }
                        break
                    case 'accounting':
                        var tag = TAG+" | accounting | "
                        //log all account events
                        redis.sadd("accountingEvents",payloadS)

                        //balance change on coin
                        //time new balance
                        //redis.zadd("balances:historical",time,JSON.stringify(accounts.accountsGlobal()))
                        log.debug(tag,"checkpoint1")
                        var depositIndex = await( orders.updateDepositIndex())

                        //var depositIndex = accounts.depositIndex()
                        var deposit = payload.account
                        log.debug(tag,"deposit: ",deposit)
                        log.debug(tag,"depositIndex: ",depositIndex)

                        if(depositIndex[deposit]){
                            //fund order
                            // Broker submit orders funded
                            orders.fund(depositIndex[deposit],payload)
                            log.debug(tag,"FUNDING ORDER! ",depositIndex[deposit])
                            payload.event = " FUNDING ORDER! "


                        } else {
                            log.debug(tag,"Not Found!",deposit,depositIndex[deposit])
                        }


                    case 'events':
                        //publish
                        break
                    default:
                        console.error(tag,"Unhandled event!",payload)
                    //output.success = false
                }
                //TODO dont publish everything

                var output = {}
                output.event = channel
                output.payload = payloadS
                publish(output)
            }catch(e){
                console.error(tag," Attempted to digest pub/sub message and failed!",{channel, payloadS},e.message)
            }
        })

        //return emitter
        return eventEmitter;
    }catch(e){
        console.error(tag,"Failed to start subscriber! ",e)
    }
}



exports.subscribe = subscribe;
