

// require('dotenv').config("../env-staging");

let { btc, ltc, eth } = require('./../modules/daemons-manager')

const { web3 } = require('../modules/web3-manager')


web3.eth.getBlockNumber().then(res => {
  console.log(`res`, res)
}).catch(ex => console.log(ex))

web3.eth.getTransactionCount("0xA9789DAf0cd229B3f4Ca0783a1b74772dCDbd4FC").then(res => {
  console.log(`res`, res)
}).catch(ex => console.log(ex))

// ltc.getInfo()
//     .then(function(resp){
//         console.log(resp)
//     })
//
// btc.getInfo()
//     .then(function(resp){
//         console.log(resp)
//     })
//




//const coininfo = require('coininfo')

// const ledger = require('../modules/ledger.js')
// const commands = require('../modules/demo-commands.js')

// let signingAddress = "1GJKUFFR5YfzhmyEDHAdsVQYbmPhYQcLYJ"
// let ethereumAddress = "0x33b35c665496bA8E71B22373843376740401F106"
// let signingPrivKey = "<redacted>"

// commands.signUp(signingAddress,ethereumAddress,signingPrivKey)
//     .then(function(resp){
//         //console.log("btc resp: ",resp)
//     })

// ledger.init()
//     .then(function(resp){
//         //console.log("btc resp: ",resp)
//     })


// btc.getNewAddress()
//     .then(function(resp){
//         //console.log("btc resp: ",resp)
//     })
