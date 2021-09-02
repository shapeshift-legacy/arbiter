require('dotenv').config({path:"../../../.env"});

let client = require("../modules/binance-client")
//let history = require("../modules/historical-price.js")
//let report = require("../modules/reporting.js")

// let signing = require('../../signing')
// let mongo = require('@arbiter/arb-mongo')
//view collections
//console.log(Object.keys(mongo))

/*
  [
  'binance-balances',
  'binance-credits',
  'binance-debits',
  'binance-transfers',
  'binance-trades',
  'binance-txs',
  'binance-history'
  ]
 */

//let app = require("../modules/liquidity.js")
//app.initialize()


// mongo['binance-balances'].find()
//     .then(function(resp){
//         console.log("resp: ",resp)
//     })

// signing.sign("14gRz6DgWHgvjLooXxihngj1YQbLiGbEFQ","foobar")
//     .then(function(resp){
//         console.log("resp: ",resp)
//     })


// let time = new Date().getTime()
// history.bestPrice("BTC",time)
//     .then(function(resp){
//         console.log("resp: ",resp)
//     })

//binance withdrawal
// client.withdrawal("BTC",0.001,"1E48AEtiAixcQi2cVgP1YYR2rEWPnqz8Vi")
//     .then(function(resp){
//         console.log("resp: ",resp)
//     })


// report.all()
//     .then(function(resp){
//         console.log("resp: ",resp)
//     })

// app.audit()
//     .then(function(resp){
//         console.log("resp: ",resp)
//     })


// client.currentUSDValue()
//     .then(function(resp){
//         console.log("resp: ",resp)
//     })

// client.coins()
//     .then(function(resp){
//         console.log("resp: ",resp)
//     })


// client.balances()
//     .then(function(resp){
//         console.log("resp: ",resp)
//     })


// let market = "LTC_BTC"
// let quantity = 0.01
// let rate = 0.01509611
//
//
// client.bid(market,rate, quantity)
//     .then(function(resp){
//         console.log("resp: ",resp)
//     })


//orderInfo
// client.getOrder("UJ3rcqb5b99dEXeKRSa1ea")
//     .then(function(resp){
//         console.log("resp: ",resp)
//     })

//trade history
// client.tradeHisory("LTCBTC")
//     .then(function(resp){
//         console.log("resp: ",resp)
//     })


// app.auditTransfers("BCC")
//     .then(function(resp){
//         console.log("resp: ",resp)
//     })

//transfer
// client.transferHistory("LTC")
//     .then(function(resp){
//         console.log("resp: ",resp)
//     })
