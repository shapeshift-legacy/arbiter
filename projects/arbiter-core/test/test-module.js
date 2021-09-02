
require('dotenv').config({path:"../../../.env"})

// let { btc,ltc,eth} = require('@arbiter/arb-daemons-manager').daemons
// let {match,balances,credits,debits,orders,users} = require('./../modules/mongo.js')
// const util = require('@arbiter/arb-redis')
// const redis = util.redis

//audit exchanges
const exchange = require('@arbiter/arbiter-exchange-controller')
exchange.initialize()

const reporting = require("../modules/reports.js")
// const custody = require("../modules/custody.js")
// custody.initialize()



//report
// reporting.match()
//     .then(function(resp){
//         console.log(resp)
//     })


// reporting.balanceSheet('binance')
//     .then(function(resp){
//         console.log(resp)
//     })

// reporting.balanceSheet('arbiterLa')
//     .then(function(resp){
//         console.log(resp)
//     })

// reporting.all()
//     .then(function(resp){
//         console.log(resp)
//     })

// reporting.arbiter()
//     .then(function(resp){
//         console.log(resp)
//     })

//orders.insert({orderId:"fooo",bar:"walked in"})

// let get_value = async function(amount){
//     try{
//         let rateBTC = await redis.hget("rates","BTC")
//         console.log(rateBTC)
//
//         return amount / (1/ rateBTC)
//     }catch(e){
//         console.error(e)
//     }
// }


// get_value("0.001")
//     .then(function(resp){
//         console.log(resp)
//     })

// btc.getNewAddress()
//     .then(function(resp){
//         console.log(resp)
//     })
//
// ltc.getNewAddress()
//     .then(function(resp){
//         console.log(resp)
//     })

// eth.getNewAddress()
//     .then(function(resp){
//         console.log(resp)
//     })
