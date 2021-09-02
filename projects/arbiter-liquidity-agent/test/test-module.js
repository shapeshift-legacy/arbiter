
let client = require('@arbiter/arb-api-client')

// let account = "mrKpS83rotErnLApXs3h1z6GcHcRjzU4TK"
// let accountPriv = "<redacted>"
// let URL = "https://127.0.0.1:3000"
// client.init(URL,account,accountPriv, true)


let URL = process.env['ARBITER_URL']
let account = process.env['AGENT_BTC_MASTER']
let accountPriv = process.env['AGENT_BTC_SIGNING_PRIVKEY']
let testNet = process.env['TEST_NET']
client.init(URL,account,accountPriv, testNet)

// client.getInfo()
//     .then(function(resp){
//         console.log("getInfo resp: ",resp)
//         console.log('----------------------')    

//     })


client.orders()
    .then(function(resp){
        console.log("orders resp: ",resp)
        console.log('----------------------')    
})

// var n = require('nonce')();
// console.log(n());


// require('dotenv').config({path:"../.env"})
// let admin = require("../modules/admin.js")
//
// console.log()

// admin.fund("LTC",1)
//     .then(function(resp){
//         console.log("resp: ",resp)
//     })
//
// admin.create("LTC_BTC")
//     .then(function(resp){
//         console.log("resp: ",resp)
//     })

// admin.cancel("all")
//     .then(function(resp){
//         console.log("resp: ",resp)
//     })

// admin.balances()
//     .then(function(resp){
//         console.log("resp: ",resp)
//     })

// admin.getInfo()
//     .then(function(resp){
//         console.log("resp: ",resp)
//     })

// admin.getInfo()
//     .then(function(resp){
//         console.log("resp: ",resp)
//     })
