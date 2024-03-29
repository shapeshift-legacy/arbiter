/**
 * Created by highlander on 4/12/17.
 */


/********************************************************

 // binance

 //                              - modularized Client
 //********************************************************/

/*


    Notes: Binance is really sensitive to market info. Min step size and tick size.

    It is recommended to validate every order being placed and adjust.




    Errors:
        "Filter failure: PRICE_FILTER"


    CoinInfo

    resp:  { symbol: 'TRXBTC',
      status: 'TRADING',
      baseAsset: 'TRX',
      baseAssetPrecision: 8,
      quoteAsset: 'BTC',
      quotePrecision: 8,
      orderTypes:
       [ 'LIMIT',
         'LIMIT_MAKER',
         'MARKET',
         'STOP_LOSS_LIMIT',
         'TAKE_PROFIT_LIMIT' ],
      icebergAllowed: true,
      filters:
       [ { filterType: 'PRICE_FILTER',
           minPrice: '0.00000001',
           maxPrice: '100000.00000000',
           tickSize: '0.00000001' },
         { filterType: 'LOT_SIZE',
           minQty: '1.00000000',
           maxQty: '90000000.00000000',
           stepSize: '1.00000000' },
         { filterType: 'MIN_NOTIONAL', minNotional: '0.00200000' } ] }
 */


/*********************************
 //        Requires
 //*********************************/

const api = require('binance');
const when = require('when');
const log = require('@arbiter/dumb-lumberjack')()
//console.log(api)

let TAG = " | binance-exchange | "
const config = require("../configs/env")

let client = new api.BinanceRest({
    key: config.BINANCE_PUBLIC, // Get this from your account on binance.com
    secret: config.BINANCE_PRIVATE, // Same for this
    timeout: 15000, // Optional, defaults to 15000, is the request time out in milliseconds
    recvWindow: 10000, // Optional, defaults to 5000, increase if you're getting timestamp errors
    disableBeautification: false
    /*
     * Optional, default is false. Binance's API returns objects with lots of one letter keys.  By
     * default those keys will be replaced with more descriptive, longer ones.
     */
});

//redis
const util = require('../modules/redis')
const redis = util.redis

//mongo
let {reportLA,credits,debits,trades} = require('../modules/mongo.js')


/*********************************
 //        Globals
 //*********************************/
const exchangeName = 'binance'

/*********************************
 //         Module
 //*********************************/


module.exports = {
    name: function() {
        return exchangeName;
    },
    coins: function() {
        return get_coins();
    },
    coinInfo: function(coin) {
        return get_coin_info(coin);
    },
    getTicker: function(market) {
        return get_ticker(market);
    },
    getSummary: function() {
        return get_Summary();
    },
    address: function(coin) {
        return get_new_address(coin);
    },
    addresses: function() {
        return get_addresses();
    },
    cancel: function(orderId, symbol, account) {
        return cancel_order(orderId, symbol, account);
    },
    balances: function() {
        return get_balances();
    },
    ordersOpen: function(account) {
        return get_open_orders(account);
    },
    getOrder: function(uuid) {
        return lookup_order(uuid);
    },
    withdrawal: function(account,coin,amount,destination) {
        return withdrawal_coin(account,coin,amount,destination);
    },
    transferHistory: function(coin) {
        return get_transfer_history(coin);
    },
    withdrawalHistory: function(coin) {
        return get_withdrawal_history(coin);
    },
    tradeHisory: function(market) {
        return get_trade_history(market);
    },
    depositHistory: function(coin) {
        return get_deposit_history(coin);
    },
    bid: function(pair, rate, amount) {
        return order_handler("BID", pair,  rate, amount);
    },
    ask: function(pair, rate,amount) {
        return order_handler("ASK", pair, rate, amount);
    },
    bidMarket: function(pair, amount) {
        return post_bid_market(pair,  amount);
    },
    askMarket: function(pair, amount) {
        return post_ask_market(pair, amount);
    }

};

/********************************
 //function primary
 //********************************/

const get_coin_info = function(coin){
    let tag = TAG+" | get_coin_info | "
    return new Promise(function(resolve, reject) {
        let market = coin+"BTC"
        client.exchangeInfo(function(err, result) {
            if (err) {
                reject(err);
            }
            if(result){
                log.debug(tag,result)
                let info = result.symbols
                for (let i = 0; i < info.length; i++) {
                    if(market === info[i].symbol){
                        resolve(info[i]);
                    }
                }
            } else {
                resolve(result);
            }
        })
    })
}

// const get_coin_info = function(coin){
//     const tag = exchangeName+" | get_coins | "
//     const d = when.defer();
//     const debug = false
//     log.debug(tag,"checkpoint1")
//     let account = 'bithighlander'
//
//
//     let market = coin+"BTC"
//
//     client.exchangeInfo(function(err, result) {
//         if (err) {
//             return d.reject("balances|" + err)
//         }
//         if(result){
//             let output
//
//             log.debug(tag,result)
//             let info = result.symbols
//             for (let i = 0; i < info.length; i++) {
//                 if(market === info[i].symbol){
//                     d.resolve(info[i])
//                 }
//             }
//         } else {
//             console.error(tag," ERROR: ",result)
//         }
//     })
//
//     return d.promise
// }

const get_coins = function(){
    const tag = exchangeName+" | get_coins | "
    const d = when.defer();
    const debug = false
    log.debug(tag,"checkpoint1")
    let account = 'bithighlander'
    client = new api.BinanceRest({
        key: config.BINANCE_PUBLIC, // Get this from your account on binance.com
        secret: config.BINANCE_PRIVATE, // Same for this
        timeout: 15000, // Optional, defaults to 15000, is the request time out in milliseconds
        recvWindow: 10000, // Optional, defaults to 5000, increase if you're getting timestamp errors
        disableBeautification: false

        /*
         * Optional, default is false. Binance's API returns objects with lots of one letter keys.  By
         * default those keys will be replaced with more descriptive, longer ones.
         */
    });

    client.exchangeInfo(function(err, result) {
        if (err) {
            return d.reject("balances|" + err)
        }
        if(result){
            log.debug(tag,result)

            d.resolve(result)
        } else {
            console.error(tag," ERROR: ",result)
        }
    })

    return d.promise
}
//
const cancel_order = function(orderId, symbol, account){
    const tag = exchangeName+" | cancel_order | "
    const d = when.defer();
    const debug = true
    log.debug(tag,"checkpoint1")

    log.debug(tag,"orderId: ",orderId)
    log.debug(tag,"account: ",account)

    client = new api.BinanceRest({
        key: config.BINANCE_PUBLIC, // Get this from your account on binance.com
        secret: config.BINANCE_PRIVATE, // Same for this
        timeout: 15000, // Optional, defaults to 15000, is the request time out in milliseconds
        recvWindow: 10000, // Optional, defaults to 5000, increase if you're getting timestamp errors
        disableBeautification: false
        /*
         * Optional, default is false. Binance's API returns objects with lots of one letter keys.  By
         * default those keys will be replaced with more descriptive, longer ones.
         */
    });
    let order = {orderId,symbol}
    client.cancelOrder(order,function(err, result) {
        if (err) {
            return d.reject("balances|" + err)
        }
        if(result){
            log.debug(tag,result)
            let data = result.result
            //let output = {}
            //output.address = data.Address
            d.resolve(result)
        } else {
            console.error(tag," ERROR: ",result)
        }
    })

    return d.promise
}

//
const get_open_orders = function(account){
    const tag = exchangeName+" | get_open_orders | "
    const d = when.defer();
    const debug = false
    log.debug(tag,"checkpoint1")

    if(!config.api[account]) throw Error("invalid account!! "+account)

    client = new api.BinanceRest({
        key: config.BINANCE_PUBLIC, // Get this from your account on binance.com
        secret: config.BINANCE_PRIVATE, // Same for this
        timeout: 15000, // Optional, defaults to 15000, is the request time out in milliseconds
        recvWindow: 10000, // Optional, defaults to 5000, increase if you're getting timestamp errors
        disableBeautification: false
        /*
         * Optional, default is false. Binance's API returns objects with lots of one letter keys.  By
         * default those keys will be replaced with more descriptive, longer ones.
         */
    });

    let params = {
        timestamp: new Date().getTime()
    }


    client.openOrders(params,function(err, result) {
        if (err) {
            return d.reject("balances|" + err)
        }
        if(result){
            log.debug(tag,result)
            d.resolve(result)
        } else {
            console.error(tag," ERROR: ",result)
        }
    })

    return d.promise
}

const get_new_address = function(coin){
    let tag = TAG + " | get_new_address |  "
    return new Promise(function(resolve, reject) {
        coin = coin.toUpperCase()
        client.depositAddress(coin,function(err, result) {
            if (err) {
                reject(err)
            }
            if(result){
                log.debug(tag,result)
                resolve(result.address)
            } else {
                log.error(tag," ERROR: ",result)
            }
        })
    })
}

const get_addresses = function(){
    const tag = exchangeName+" | get_addresses | "
    const d = when.defer();
    const debug = false
    log.debug(tag,"checkpoint1")
    client.getbalances(function(err, result) {
        if (err) {
            return d.reject("balances|" + err)
        }
        if(result){
            log.debug(tag,result)
            let data = result.result
            let output = {}

            for(let i = 0; i < data.length; i++){
                let entry = data[i]
                output[entry.Currency] = entry.CryptoAddress
            }

            d.resolve(output)
        } else {
            console.error(tag," ERROR: ",result)
        }
    })

    return d.promise
}


const pause = function(length){
    const d = when.defer();
    const done = function(){d.resolve(true)}
    setTimeout(done,length*1000)
    return d.promise
}

const get_Summary = async function(){
    const tag = exchangeName+" | get_Summary | "
    const d = when.defer();
    const debug = true
    let account = 'bithighlander'
    try{
        client = new api.BinanceRest({
            key: config.BINANCE_PUBLIC, // Get this from your account on binance.com
            secret: config.BINANCE_PRIVATE, // Same for this
            timeout: 15000, // Optional, defaults to 15000, is the request time out in milliseconds
            recvWindow: 10000, // Optional, defaults to 5000, increase if you're getting timestamp errors
            disableBeautification: false
            /*
             * Optional, default is false. Binance's API returns objects with lots of one letter keys.  By
             * default those keys will be replaced with more descriptive, longer ones.
             */
        });

        //get all pairs
        let result = await client.allPrices()
        //log.debug(tag,"result: ",result)
        let allPairs = []
        for (let i = 0; i < result.length; i++) {
            let market = result[i].symbol
            //log.debug(tag,"market: ",market)
            //filer by btc base
            if(market.indexOf("BTC") >=0 && market != "BTCUSDT"){
                allPairs.push(market)
            }
        }
        log.debug(tag,"allPairs: ",allPairs.length)


        let output = []
        //get info on all pairs
        for (let i = 0; i < allPairs.length; i++) {
            log.debug(tag,"pair: "+allPairs[i]+" i: ",allPairs.length - i)
            let marketInfo = await client.ticker24hr(allPairs[i])
            //log.debug(tag,"marketInfo: ",marketInfo)
            output.push(marketInfo)
            await pause(.05)
        }
        // let result = await client.ticker24hr("ETHBTC")
        // log.debug(tag,"result: ",result)

        return output
    }catch(e){
        console.error(tag,e)
    }
}


//
const get_ticker = function(market){
    const tag = exchangeName+" | get_ticker | "
    const d = when.defer();
    const debug = true

    log.debug(tag,"market: ",market)
    let account = 'bithighlander'
    client = new api.BinanceRest({
        key: config.BINANCE_PUBLIC, // Get this from your account on binance.com
        secret: config.BINANCE_PRIVATE, // Same for this
        timeout: 15000, // Optional, defaults to 15000, is the request time out in milliseconds
        recvWindow: 10000, // Optional, defaults to 5000, increase if you're getting timestamp errors
        disableBeautification: false
        /*
         * Optional, default is false. Binance's API returns objects with lots of one letter keys.  By
         * default those keys will be replaced with more descriptive, longer ones.
         */
    });

    client.ticker24hr(market,function(err, result) {
        if (err) {
            console.error(tag,err, result)
            return d.reject(err)
        }
        if(result){
            log.debug(tag,result)
            let withdrawals = result.result
            // const output = {}
            // output.success = true
            // output.result = withdrawals
            d.resolve(result)
        } else {
            console.error(tag," ERROR: ",result)
        }
    })

    return d.promise
}


/*
    Get Trade history

resp:  [
    {
    id: 13668569,
    orderId: 52514636,
    price: '0.01313400',
    qty: '0.01000000',
    commission: '0.00001000',
    commissionAsset: 'LTC',
    time: 1530124289025,
    isBuyer: true,
    isMaker: false,
    isBestMatch: true
    }
]

*/
const get_trade_history = function(market){
    const tag = exchangeName+" | lookup_order | "
    const d = when.defer();

    //
    client.myTrades(market,function(err, result) {
        if (err) {
            return d.reject("balances|" + err)
        }
        if(result){
            log.debug(tag,result)
            d.resolve(result)
        } else {
            console.error(tag," ERROR: ",result)
        }
    })

    return d.promise
}

/*
{ symbol: 'LTCBTC',
  orderId: 52514636,
  clientOrderId: 'UJ3rcqb5b99dEXeKRSa1ea',
  price: '0.00000000',
  origQty: '0.01000000',
  executedQty: '0.01000000',
  status: 'FILLED',
  timeInForce: 'GTC',
  type: 'MARKET',
  side: 'BUY',
  stopPrice: '0.00000000',
  icebergQty: '0.00000000',
  time: 1530124289025,
  isWorking: true }

 */

const lookup_order = function(uuid,market){
    const tag = exchangeName+" | lookup_order | "
    const d = when.defer();
    const debug = true

    client.queryOrder({symbol:market,origClientOrderId:uuid},function(err, result) {
        if (err) {
            return d.reject("balances|" + err)
        }
        if(result){
            log.debug(tag,result)
            d.resolve(result)
        } else {
            console.error(tag," ERROR: ",result)
        }
    })

    return d.promise
}

const get_transfer_history = function(coin){
    const tag = exchangeName+" | lookup_order | "
    const d = when.defer();
    const debug = true

    client.depositHistory(coin,function(err, result) {
        if (err) {
            return d.reject("balances|" + err)
        }
        if(result){
            log.debug(tag,result)
            d.resolve(result)
        } else {
            console.error(tag," ERROR: ",result)
        }
    })

    return d.promise
}

// const get_transfer_history = async function(coin){
//     const tag = exchangeName+" | get_transfer_history | "
//     let debug = true
//     try{
//         //
//         let output = []
//
//         let deposits = await get_deposit_history(coin)
//         let withdrawals = await get_withdrawal_history(coin)
//
//         log.debug(tag,"deposits: ", deposits)
//         log.debug(tag,"withdrawals: ", withdrawals)
//
//         //normalize
//         deposits    = deposits.result
//         withdrawals = withdrawals.result
//
//         if(deposits){
//             for (let i = 0; i < deposits.length; i++) {
//                 //normalize
//                 let entry = deposits[i]
//                 entry.deposit = true
//                 entry.coin = entry.Currency
//                 entry.txid = entry.TxId
//                 entry.id = entry.TxId
//                 entry.address = entry.CryptoAddress
//                 entry.amount = entry.Amount
//                 entry.timestamp = new Date(entry.LastUpdated).getTime()/1000
//                 if(entry.Confirmations > 0) entry.complete = true
//                 if(!entry.complete) entry.status = "incomplete"
//                 entry.exchange = exchangeName
//                 output.push(entry)
//             }
//         }
//
//         if(withdrawals){
//             for (let i = 0; i < withdrawals.length; i++) {
//                 let entry = withdrawals[i]
//                 entry.withdrawal = true
//                 entry.timestamp = new Date(entry.Opened).getTime()/1000
//                 entry.id = entry.PaymentUuid
//                 entry.coin = entry.Currency
//                 entry.txid = entry.TxId
//                 entry.address = entry.CryptoAddress
//                 entry.amount = entry.Amount
//                 if(entry.txid) entry.complete = true
//                 if(!entry.complete) entry.status = "incomplete"
//                 entry.exchange = exchangeName
//                 output.push(entry)
//             }
//         }
//
//
//         return output
//     }catch(e){
//         console.error(tag,"error: ",e)
//         throw(e)
//     }
// }
//
// const get_deposit_history = function(account,coin){
//     const tag = exchangeName+" | get_deposit_history | "
//     const d = when.defer();
//
//     if(coin)coin = coin.toLowerCase()
//     console.log(tag,"coin: ",coin)
//
//     client = new binance(configs.api['bithighlander'].binance.pub, configs.api['bithighlander'].binance.pri)
//     client.getdeposithistory(coin,10000,function(err, result) {
//         if (err) {
//             return d.reject("balances|" + err)
//         }
//         if(result){
//             let withdrawals = result.result
//             const output = {}
//             output.success = true
//             output.result = withdrawals
//             d.resolve(output)
//         } else {
//             console.error(tag," ERROR: ",result)
//         }
//     })
//
//     return d.promise
// }
//
// const get_withdrawal_history = function(coin){
//     const tag = exchangeName+" | get_withdrawal_history | "
//     const d = when.defer();
//
//     if(coin)coin = coin.toLowerCase()
//
//     client.getwithdrawalhistory(coin,100,function(err, result) {
//         if (err) {
//             return d.reject("balances|" + err)
//         }
//         if(result){
//             let withdrawals = result.result
//             const output = {}
//             output.success = true
//             output.result = withdrawals
//             d.resolve(output)
//         } else {
//             console.error(tag," ERROR: ",result)
//         }
//     })
//
//     return d.promise
// }
//
// //
const withdrawal_coin = function(coin, amount,address){
    const tag = exchangeName+" | submit_withdrawal | "
    const d = when.defer();
    const debug = false
    coin = coin.toUpperCase()
    if(coin === "BCH") coin = "BCC"


    log.debug(tag,"coin:",coin)
    log.debug(tag,"amount:",amount)
    log.debug(tag,"address:",address)

    let output = {}
    output.success = false

    coin = coin.toUpperCase()

    let withdraw = {
        timestamp: new Date().getTime(),
        asset:coin,
        amount,
        address,
        // recvWindow:5000,
        // name:"BTC Hot"
    }

    client.withdraw(withdraw, function(err,resp){
        if(err){
            console.error(tag,err,resp)
            output.error = err
            d.resolve(output)
        } else {
            console.error(tag,"Responce: ",resp)
            if(resp.success){
                output.success = true
                if(resp && resp.result && resp.result.uuid) output.id = resp.result.uuid
                else throw Error("unhandled response format!",resp)
                d.resolve(output)
            }else{
                output.error = resp.message
                d.resolve(output)
            }
        }
    })

    return d.promise
}
// //
// // const get_order_history = function(){
// //     const tag = exchangeName+" | get_order_history | "
// //     const d = when.defer();
// //     client.myTradeHistory(function(err, result) {
// //         if (err) {
// //             return d.reject("balances|" + err)
// //         }
// //         if(result){
// //             const output = {}
// //             output.success = true
// //             output.result = result
// //             d.resolve(output)
// //         } else {
// //             console.error(tag," ERROR: ",result)
// //         }
// //     })
// //     return d.promise
// // }
// //
//
// const post_bid_market = function(pair, amount){
//     const tag = exchangeName+" | post_bid_market | "
//     const d = when.defer();
//
//     //const binancePair = ["BTC","LTC"]
//     const binancePair = pair.split("_")
//     const binanceMarket = binancePair[0]+"-"+binancePair[1]
//     console.log(tag,"rate : ",rate)
//     console.log(tag,"binanceMarket : ",binanceMarket)
//
//
//     client.buymarket(binanceMarket, amount, function(error, result){
//         if(error){
//             console.error(tag," Error: ", error)
//         } else {
//             console.log(tag, " resp: ", result)
//             d.resolve(result)
//         }
//     });
//     return d.promise
// }
//
// const post_ask_market = function(pair, amount){
//     const tag = exchangeName+" | post_ask_market | "
//     const d = when.defer();
//     const binancePair = pair.split("_")
//     const binanceMarket = binancePair[0]+"-"+binancePair[1]
//
//     console.log(tag,"amount : ",amount)
//     console.log(tag,"binanceMarket : ",binanceMarket)
//
//     client.sellmarket(binanceMarket, amount, function(error, result) {
//         if (error) {
//             console.error(tag, " Error: ", error)
//         } else {
//             console.log(tag, " resp: ", result)
//             d.resolve(result)
//         }
//     });
//     return d.promise
// }
//


/*
    Handler

        Round to nearest stepsize/lotzise

        add dropped amount to queue

        (or add from queue)




        BID: result:

        { symbol: 'LTCBTC',
          orderId: 52514636,
          clientOrderId: 'UJ3rcqb5b99dEXeKRSa1ea',
          transactTime: 1530124289025,
          price: '0.00000000',
          origQty: '0.01000000',
          executedQty: '0.01000000',
          status: 'FILLED',
          timeInForce: 'GTC',
          type: 'MARKET',
          side: 'BUY' }

 */

let order_handler = async function(type, pair, rate, amount){
    let tag = TAG + " | order_handler | "
    try{
        if(!type)   throw Error("101: missing type!")
        if(!pair)   throw Error("102: missing pair!")
        if(!rate)   throw Error("103: missing rate!")
        if(!amount) throw Error("104: missing amount!")
        let orderInfo = {}
        console.log(tag,"checkpoint1")
        //normalize market
        let coins = pair.split("_")
        let asset = coins[0]

        let market = coins[0]+coins[1]

        if(typeof(amount) === "string") amount = parseFloat(amount)

        //TODO get pending total from queue (at rate or worse*)

        //add to amount

        //get filters

        let coinInfo = await redis.get("binance:info:"+asset)
        coinInfo = JSON.parse(coinInfo)
        log.debug(tag,"1coinInfo: ",coinInfo)
        if(!coinInfo){
            log.debug(tag,"Getting coinInfo! ")
            coinInfo = await get_coin_info(asset)
            log.debug(tag,"2coinInfo: ",coinInfo)
            redis.set("binance:info:"+asset,JSON.stringify(coinInfo))
        }

        //apply filters
        for(let i = 0; i < coinInfo.filters.length; i++){
            let filter = coinInfo.filters[i]
            log.debug(tag,"filter: ",filter)
            switch(filter.filterType) {
                case "PRICE_FILTER":
                    //

                    break;
                case "LOT_SIZE":

                    if(amount < filter.minQty){
                        //mark for queue (dont trade)

                    }

                    //get lot size
                    let stepSize = parseFloat(filter.stepSize)
                    //round amount to lot
                    amount = amount.roundToDrop(stepSize)

                    //TODO add dropped amounts to queue

                    break;
                default:
                    console.error("unhandled filter: ",filter)
            }

        }

        log.debug(tag,"amount: ",amount)



        //perform action

        var result
        switch(type) {
            case "BID":
                orderInfo.acquisition = true


                //if MOCK
                result =  { symbol: 'LTCBTC',
                    orderId: 52539854,
                    clientOrderId: 'FAKE'+getRandomInt(1,1000000),
                    transactTime: 1530136924552,
                    price: '0.00000000',
                    origQty: '0.01000000',
                    executedQty: '0.01000000',
                    status: 'FILLED',
                    timeInForce: 'GTC',
                    type: 'MARKET',
                    side: 'BUY',
                    fills:
                        [ { price: '0.01308400',
                            qty: '0.01000000',
                            commission: '0.00001000',
                            commissionAsset: 'LTC',
                            tradeId: getRandomInt(1,1000000) } ]
                }




                result.input = {market, rate, amount}
                //trades.insert(result)

                log.debug(tag,"BID: result: ",result)

                //push fills to trade worker
                for(let i=0; i < result.fills.length; i++){
                    let trade = result.fills[i]
                    log.debug(tag,"trade: ",trade)
                    trade.orderId = result.orderId
                    trade.id = trade.tradeId
                    trade.time = new Date().getTime()
                    if(config.NODE_ENV === "prod") redis.lpush('queue:trades:audit',JSON.stringify(trade))
                }

                break
            case "ASK":
                orderInfo.disposal = true
                if(config.NODE_ENV === "prod"){
                    result = await post_ask(market, rate, amount)
                }else{
                    //if MOCK
                    result =  { symbol: 'LTCBTC',
                        orderId: 52539854,
                        clientOrderId: 'FAKE'+getRandomInt(1,1000000),
                        transactTime: 1530136924552,
                        price: '0.00000000',
                        origQty: '0.01000000',
                        executedQty: '0.01000000',
                        status: 'FILLED',
                        timeInForce: 'GTC',
                        type: 'MARKET',
                        side: 'BUY',
                        fills:
                            [ { price: '0.01308400',
                                qty: '0.01000000',
                                commission: '0.00001000',
                                commissionAsset: 'LTC',
                                tradeId: getRandomInt(1,1000000) } ]
                    }
                }
                //push fills to trade worker
                for(let i=0; i < result.fills.length; i++){
                    let trade = result.fills[i]
                    log.debug(tag,"trade: ",trade)
                    trade.orderId = result.orderId
                    trade.id = trade.tradeId
                    trade.time = new Date().getTime()
                    //only audit REAL trades
                    if(config.NODE_ENV === "prod") redis.lpush('queue:trades:audit',JSON.stringify(trade))
                }
                break

            //TODO market orders

            default:
                log.error("unhandles market type: ",type)
        }

        //handle errors

        //save result

        //push event accounting



    }catch(e){
        console.error(tag,"e: ",e)
        throw e
    }
}


const post_bid = function(pair, rate, amount){
    const tag = exchangeName+" | post_bid | "
    const d = when.defer();

    //get coin info

    //if < step size buffer

    //drop to step size

    //add dropped amount to queue

    /*
        Name 	Type 	Mandatory 	Description
        symbol 	STRING 	YES
        side 	ENUM 	YES
        type 	ENUM 	YES
        timeInForce 	ENUM 	NO
        quantity 	DECIMAL 	YES
        price 	DECIMAL 	NO
        newClientOrderId 	STRING 	NO 	A unique id for the order. Automatically generated if not sent.
        stopPrice 	DECIMAL 	NO 	Used with STOP_LOSS, STOP_LOSS_LIMIT, TAKE_PROFIT, and TAKE_PROFIT_LIMIT orders.
        icebergQty 	DECIMAL 	NO 	Used with LIMIT, STOP_LOSS_LIMIT, and TAKE_PROFIT_LIMIT to create an iceberg order.
        newOrderRespType 	ENUM 	NO 	Set the response JSON. ACK, RESULT, or FULL; default: RESULT.
        recvWindow 	LONG 	NO
        timestamp 	LONG 	YES
     */
    let type = "MARKET"
    let quantity = amount
    let price = parseFloat(rate)
    let side = "BUY"
    let symbol = pair
    let timestamp = new Date().getTime()
    let timeInForce = "GTC"

    //quantity = quantity.toFixed(3)

    let order = {newOrderRespType:"FULL",symbol,side,type, quantity,timestamp}
    console.log(tag,"order: ",order)
    client.newOrder(order, function(error, result){
        if(error){
            console.error(tag," Error: ", error)
        } else {
            console.log(tag, " resp: ", result)
            d.resolve(result)
        }
    });

    //MOCK
    //debit account BTC

    //credit account asset

    //generate fee's




    return d.promise
}

const post_ask = function(pair, rate,amount){
    const tag = exchangeName+" | post_ask | "
    const d = when.defer();
    let debug = true


    /*
        Name 	    Type 	Mandatory 	Description
        symbol 	    STRING 	YES
        side 	    ENUM 	YES
        type 	    ENUM 	YES
        timeInForce ENUM 	NO
        quantity 	DECIMAL 	YES
        price 	    DECIMAL 	NO
        newClientOrderId 	STRING 	NO 	A unique id for the order. Automatically generated if not sent.
        stopPrice 	DECIMAL 	NO 	Used with STOP_LOSS, STOP_LOSS_LIMIT, TAKE_PROFIT, and TAKE_PROFIT_LIMIT orders.
        icebergQty 	DECIMAL 	NO 	Used with LIMIT, STOP_LOSS_LIMIT, and TAKE_PROFIT_LIMIT to create an iceberg order.
        newOrderRespType 	ENUM 	NO 	Set the response JSON. ACK, RESULT, or FULL; default: RESULT.
        recvWindow 	LONG 	NO
        timestamp 	LONG 	YES
    */

    log.debug(tag," pair: ",pair)
    log.debug(tag," rate: ",rate)
    log.debug(tag," rate: ",typeof(rate))
    log.debug(tag," amount: ",amount)

    if(typeof(rate) === 'string') rate = parseFloat(rate)
    //precision
    rate = rate.toFixed(5)

    let type = "MARKET"
    let quantity = amount
    let price = rate
    let side = "SELL"
    let symbol = pair
    let timestamp = new Date().getTime()
    let timeInForce = "GTC"

    quantity = quantity.toFixed(3)

    let order = {symbol, side, type, quantity, timestamp}
    console.log("order: ",order)


    let totalAmount = amount * rate
    console.log("totalAmount: ",totalAmount)

    client.newOrder(order, function(error, result) {
        if (error) {
            console.error(tag, " Error: ", error)
            d.reject(error)
        } else {
            console.log(tag, " resp: ", result)
            d.resolve(result)
        }
    });


    // if(totalAmount >= 0.001){
    //     client.newOrder(order, function(error, result) {
    //         if (error) {
    //             console.error(tag, " Error: ", error)
    //             d.reject(error)
    //         } else {
    //             console.log(tag, " resp: ", result)
    //             d.resolve(result)
    //         }
    //     });
    // } else {
    //     let minAmount = 0.001 * rate
    //     d.reject('Too small an order! amount: '+totalAmount+' min:'+minAmount)
    // }


    return d.promise
}

const get_balances = function(coin){
    let tag = TAG + " | get_balances |  "
    return new Promise(function(resolve, reject) {
        //client = new binance(configs.BINANCE_PUBLIC, configs.api[account].binance.pri)
        client.account(function(err,resp){
            //console.error(tag,err,resp)
            if(err){
                console.error(tag,err,resp)
                reject()
            } else {
                //console.log(tag,"Response: ",resp)
                const output = {}
                let entries = resp.balances
                if(entries){
                    for (let j = 0; j < entries.length; j++) {
                        let entry = entries[j]
                        if(parseFloat(entry.free) > 0){
                            output[entry.asset] = parseFloat(entry.free)
                        }
                    }
                }

                resolve(output)
            }
        })
    })
}

// let get_balances = function(account){
//     const tag = exchangeName+" | get_balances | "
//     let debug = false
//     const d = when.defer();
//     //const binance = require('./../exchange-support/binance-api');
//     log.debug(tag,"account: ",account)
//     log.debug(tag,"account2: ",configs.api[account])
//
//
//     //client = new binance(configs.BINANCE_PUBLIC, configs.api[account].binance.pri)
//     client.account(function(err,resp){
//         //console.error(tag,err,resp)
//         if(err){
//             console.error(tag,err,resp)
//         } else {
//             //console.log(tag,"Response: ",resp)
//             const output = {}
//             let entries = resp.balances
//             if(entries){
//                 for (let j = 0; j < entries.length; j++) {
//                     let entry = entries[j]
//                     output[entry.asset] = parseFloat(entry.free)
//                 }
//             }
//
//
//             d.resolve(output)
//         }
//     })
//
//
//     return d.promise
// }

//
// const get_orderbook = function(pair){
//     const tag = exchangeName+" | get_orderbook | "
//     const d = when.defer();
//     const coins = pair.split("_")
//
//     //console.log(tag,'pair: ', pair)
//     //console.log(tag,'coins: ', coins)
//     const second = coins[0]
//     const prime = coins[1]
//     client.getOrderBook(second, prime,function(err, result){
//         //console.log(err,result)
//         if(err)
//         {
//             return d.reject("depth|"+err+' pair:'+pair)
//         }
//         else if(!result)
//         {
//             return d.reject("depth| No result returned for pair :" + pair)
//         }
//
//         //console.log(tag, result)
//         d.resolve(result)
//     })
//     return d.promise
// }
//
// const initialize_binance = co.wrap(function* () {
//     const tag = " | initialize_binance | "
//     const time = Date().getTime()
//
//     // sub to binance
//
//     // que events
//
//     // que api
//
//     // replay events
//
//
// })
//

//functions
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
}

Number.prototype.roundTo = function(num) {
    var resto = this%num;
    if (resto <= (num/2)) {
        return this-resto;
    } else {
        return this+num-resto;
    }
}

Number.prototype.roundToDrop = function(num) {
    var resto = this%num;
    console.log("resto: ",resto)
    if (resto <= (num/2)) {
        return this-resto;
    } else {
        return this-resto;
    }
}
