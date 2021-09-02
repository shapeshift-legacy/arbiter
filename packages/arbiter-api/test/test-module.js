

require('dotenv').config({path:"../.env"});
let client = require('../index')


let account = "<redacted>"
let accountPriv = "<redacted>"
let URL = "https://127.0.0.1:3000"
client.init(URL,account,accountPriv,true)


// let account = "<redacted>"
// let accountPriv = "<redacted>"
// let URL = "https://arb-oracle-api01.staging.redacted.example.com:3000"
// client.init(URL,account,accountPriv,false)





console.log('account', account)
console.log('accountPriv', accountPriv)

//public

//coins

//markets

//marketInfo

//orderbook

//getAccount

//orderCreate

// let order = {
//     expiration: 1000,
//     pubkey:"0273e9b70abce8233229a0c7afbeb9bfd240f9bfc524e7cb398f75868d4b17a42f",
//     pair: "LTC_BTC",
//     rate: 0.005,
//     amountIn: 0.1,
//     //amountOut: amountOut,
//     returnAddress: "n2pDLWwNyZMqfep51UtozskNuVnVorVvbC",
//     withdrawalAddress: "QWpP5D5NcQCAZi6EHZdhtZZyZmiXEvMTC8",
// }
//
// client.orderCreate(order)
//     .then(function(resp){
//         console.log("resp: ",resp)
//     })

//signUp

//statusOracle


// client.signUp("0xdf9bae14f4a6f27b69b35e2fbb166f3ad50d652b")
//     .then(function(resp){
//         console.log("resp: ",resp)
//     })


// let orderId = "5f9d6258-1009-4a8d-b767-20ba8fa5dd0c"
//
// client.getOrderOracle(orderId)
//     .then(function(resp){
//         console.log("resp: ",resp)
//     })




//multi-sig API



// Custody API

// client.orders()
//     .then(function(resp){
//         console.log(resp)
//     })

// client.order('96942b74-3a8b-40df-80e1-62e235af1b14')
//     .then(function(resp){
//         console.log(resp)
//     })

client.getInfo()
    .then(function(resp){
        console.log(resp)
    })





// get_account_info()
// get_address_coin("BTC")
// get_address_coin("LTC")
// get_address_coin("ETH")

// attempt overdraft
// withdrawal_coin("BTC",config.AGENT_BTC_MASTER,0.001)
// get_balance("BTC")

// let market = "LTC_BTC"
// let quantity = 0.001
// let rate = "place_limit_order"
// let type = "bid"
// place_limit_order(market, quantity, rate, type)
// get_orders()