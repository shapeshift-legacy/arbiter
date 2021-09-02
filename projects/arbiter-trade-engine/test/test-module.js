/**
 * Created by highlander on 3/2/17.
 */


//const Redis = require('promise-redis')()
//const redis = Redis.createClient()
const uuid = require('node-uuid');
const bytes = require('bytes');

//modules
const collections = require('../modules/mongo.js')
let match = collections.match

//console.log(match)

// let entry = { engine: 'LTC_BTC',
//     time: 1524516641795,
//     restingOrder:
//         { id: '7e15b574-bcd4-4d95-850d-41e9d6e1e3db',
//             price: '0.01700955',
//             quantity: 0,
//             status: 'complete',
//             isBuy: false },
//     aggressiveOrder:
//         { id: '579a294b-21af-4052-9df7-ddcbc470dab9',
//             price: '0.048',
//             quantity: 0.03385456333333333,
//             status: 'Working',
//             isBuy: true },
//     restingOrderPrice: '0.01700955',
//     matchQuantity: 0.04947877 }
//
// match.insert(entry)
//     .then(function(resp){
//         console.log(resp)
//     })


// const fullfillment = require('../modules/fullfillment2.js');
// const util = require('@arbiter/arb-redis')
// const redis = util.redis
//
// const local_coin_client = require('../@arbiter/aman-client');
//
// const configs = require("./../configs/configMaster").configs()
// const btc = new local_coin_client.Client(configs.daemons.BTC.daemon)
// const ltc = new local_coin_client.Client(configs.daemons.LTC.daemon)
// const eth = new local_coin_client.Client(configs.daemons.ETH.daemon)
// const coininfo = require('coininfo')


// btc.getNewAddress()
//     .then(function(resp){
//         console.log("btc resp: ",resp)
//     })

//deploy contract
// eth.addMultisigAddress(["0x1e937fd7c85ffd5bf6071b2ea8420a19a3f61f23","0xfd6d2028c11ee3b118416ee1e35f09ef2332face","0x2854274f8b3521310d0db099439c1821cfd10cd1"])
//     .then(function(resp){
//         console.log("LTC resp: ",resp)
//     })

//create forwarder
// eth.createForwarder({ "contractAddress": "0x1e1ecce3745b2957135d42cfa4d7dbe7944b5fef", "arbiterAddress": "0x1e937fd7c85ffd5bf6071b2ea8420a19a3f61f23", "oracleAddress": "0xfd6d2028c11ee3b118416ee1e35f09ef2332face" })
//     .then(function(resp){
//         console.log("ETH resp: ",resp)
//     })


// ltc.getInfo()
//     .then(function(resp){
//         console.log("LTC resp: ",resp)
//     })



//fullfillment
// let orderId = "9f0964d4-4daa-4e44-a89c-48c363c6fecf"
//
// fullfillment.fullfill(orderId)
//     .then(function(resp){
//         console.log("resp:",resp)
//     })



// const numOfCoins = {
//     0:"BTC",
//     1: "BTC-TEST",
//     2: "LTC",
//     2.1: "LTC-TESTS",
//     60 : "ETH"
// }
//
// btc.getNewAddress()
//     .then(function(resp){
//         console.log("BTC resp: ",resp)
//     })
//
//
// ltc.getNewAddress()
//     .then(function(resp){
//         console.log("LTC resp: ",resp)
//     })



// let address = "2NCBYEVbKS8HsV8K7N9qHBJY9CqdbhwpvaH"
// btc.listUnspent(0, 9999999, [address])
//     .then(function(resp){
//         console.log("resp:", resp)
//     })

// redis.get("")
//     .then(function(resp){
//         console.log("resp: ",resp)
//     })



//let orderId = "94b231df-c06a-48a7-a230-a17e111c6bf3"
//let orderId = ""

// fullfillment.fullfill(orderId)
//     .then(function(resp){
//         console.log(resp)
//     })



// let tx = "01000000014aabf3ab8a45cbfb2b36287d7ef3ac93c59e5590a75186c7766c536c6e9246000100000000ffffffff0230750000000000001976a914745dc6e1290d697476ab17a91eb785f1e346632888ac10270000000000001976a91477695bdd9d8fcfc2eaae9d1ec4f65303711f034788ac00000000"
// console.log(bytes(tx))
//
// btc.signRawTransaction(tx,"",)
//     .then(function(resp){
//         console.log(resp)
//     })
//     .catch(function(e){
//         console.error(e)
//     })



//console.log(coininfo(numOfCoins[1]))

// let inputs = [
//     {
//         txid:"a8ea3ebf8542993dab90e4e494d7b6f6ab60ebb4686463d37fe2ab2da4af3800",
//         vout:0,
//         scriptPubKey:"a91441703f057d1172bba5edc49973fe32ef50711e4b87",
//         redeemScript:"5221029da4aee89e3bbb298cfc762680921b145a1c0c9ccb4311ad2b41e6467bf870c02103004879404d05ce6ac98995a0a51f4c26ed599a65909e372692cb9293c831fa9f210253b555a12bfd75fa0b9a5b17f4c8e62df69cc246ecc239854f12b88ed29e41c553ae"
//     }
// ]
//
// let outputs = {mr8F239AWva5AZRVAMnfoLnf8VVDKWPTAG:0.0003,mffjs1PCMm13oEJrXfUJp1tfXk2bxyPeHe:0.0001}
//
// btc.createRawTransaction(inputs,outputs)
//     .then(function(resp){
//         console.log(resp)
//     })
//     .catch(function(e){
//         console.error(e)
//     })



//console.log(ltc)

// try{
//     pubkeys = [ "029da4aee89e3bbb298cfc762680921b145a1c0c9ccb4311ad2b41e6467bf870c0", "03004879404d05ce6ac98995a0a51f4c26ed599a65909e372692cb9293c831fa9f", "0253b555a12bfd75fa0b9a5b17f4c8e62df69cc246ecc239854f12b88ed29e41c5" ]
//     ltc.addMultiSigAddress(2, pubkeys)
//         .then(function(resp){
//             console.log(resp)
//         })
//         .catch(function(e){
//             console.error(e)
//         })
//
// }catch(e){console.error(e)}

// ltc.validateAddress("QSZzVmZBNEZMi7ZqApHo9qQhSqdmyWNzgT")
//     .then(function(resp){
//         console.log(resp)
//     })

// let orderId = uuid.v4()
// let input = {foo:"bar",what:"the","fuck":"yo"}
//console.log(Object.keys(input))

// Object.keys(o).forEach(function(key) {
//     var val = o[key];
//     logic();
// });

// redis.hmset(orderId,input)
//     .then(function(suc){
//         console.log(suc)
//         redis.hgetall(orderId)
//             .then(function(resp){
//                 console.log(resp)
//             })
//     })
