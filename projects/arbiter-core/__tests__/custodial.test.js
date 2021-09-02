/*
        Custodial API tests


 */


/*
    Events

    Create order

   {
   realm: 'arbiter',
   account: 'mpJ19nmaDocEQdTBvh6jnD3pMFyp3rFYmL',
   market: 'LTC_BTC',
   orderId: 'bbf0f40f-c00e-460a-97e2-db8e89e486e3',
   quantity: 0.00006063,
   rate: 0.012126,
   type: 'bid',
   coinIn: 'BTC',
   coinOut: 'LTC',
   coinFunding: 'BTC',
   debit:
    { realm: 'arbiter',
      account: 'mpJ19nmaDocEQdTBvh6jnD3pMFyp3rFYmL',
      coin: 'BTC',
      quantity: 0.00006063 },
   credit:
    { realm: 'arbiter',
      account: 'bbf0f40f-c00e-460a-97e2-db8e89e486e3',
      coin: 'BTC',
      quantity: 0.00006063 },
   newBalanceAccount: 1793937,
   newBalanceOrder: 6063
   }

    cancel order

    { account: 'mpJ19nmaDocEQdTBvh6jnD3pMFyp3rFYmL',
  orderId: '5c3ebda5-87d2-4772-b731-970ef5ad6a37',
  orderInfo:
   { account: 'mpJ19nmaDocEQdTBvh6jnD3pMFyp3rFYmL',
     market: 'LTC_BTC',
     orderId: '5c3ebda5-87d2-4772-b731-970ef5ad6a37',
     amountQuote: '0.01',
     rate: '0.012326',
     type: 'ask',
     owner: 'liquidityAgent',
     coinIn: 'LTC',
     coinOut: 'BTC',
     coinFunding: 'LTC',
     LTC: '1000000',
     price: '0.012326',
     quantity: '0.01' },
  cancel: 'true',
  balanceIn: 0.01,
  balanceOut: 0,
  newBalance: 0.01,
  event: 'cancel',
  _id: 5baa92a8520fa12ea7b1e774 }


   order match



   deposit

{
    "_id" : ObjectId("5baaa75a3df248e962c01357"),
    "account" : "mpJ19nmaDocEQdTBvh6jnD3pMFyp3rFYmL",
    "time" : 1537910618083.0,
    "custodial" : true,
    "event" : "deposit",
    "txid" : "046e41ed60b494fa7441a75ebe993533319b25f0ded0fc08cfee4e2ccbdbddb0",
    "value" : 0.01,
    "coin" : "BTC",
    "address" : "mqLn4fx3ATqVcGyawiWGqc6v8erj58RTvz",
    "txInfo" : {
        "value" : 0.01,
        "n" : 1,
        "scriptPubKey" : {
            "asm" : "OP_DUP OP_HASH160 6bc48edc1d602cef4dedd714b35ffb56e9425e2f OP_EQUALVERIFY OP_CHECKSIG",
            "hex" : "76a9146bc48edc1d602cef4dedd714b35ffb56e9425e2f88ac",
            "reqSigs" : 1,
            "type" : "pubkeyhash",
            "addresses" : [
                "mqLn4fx3ATqVcGyawiWGqc6v8erj58RTvz"
            ]
        },
        "txid" : "046e41ed60b494fa7441a75ebe993533319b25f0ded0fc08cfee4e2ccbdbddb0",
        "coin" : "btc"
    },
    "addressInfo" : {
        "iscompressed" : "true",
        "account" : "mpJ19nmaDocEQdTBvh6jnD3pMFyp3rFYmL",
        "hdkeypath" : "m/0'/0'/3641'",
        "address" : "mqLn4fx3ATqVcGyawiWGqc6v8erj58RTvz",
        "ismine" : "true",
        "pubkey" : "029829ebd1fb7120de9b024ce160057a390c048184d28f4b61f3401ffe6626fc42",
        "hdmasterkeyid" : "971c341b615edb6342990a8e456d557d33f3bd86",
        "isvalid" : "true",
        "iswitness" : "false",
        "scriptPubKey" : "76a9146bc48edc1d602cef4dedd714b35ffb56e9425e2f88ac",
        "isscript" : "false",
        "agent" : "true",
        "iswatchonly" : "false",
        "timestamp" : "1532040303"
    }
}


   withdrawal

 */


/*



 */
const TAG = " | custodial - audit - tests | "
require('dotenv').config({path: './../../../.env'});
//require('dotenv').config();

const config = require("../configs/env")

const log = require('@arbiter/dumb-lumberjack')()

const pause = function(length){
    return new Promise(function(resolve, reject) {
        var done = function(){resolve(true)}
        setTimeout(done,length*1000)
    })
}

/*

 */


let client = require("../modules/audit.js")



describe(' - financial toolkit - ', () => {

    let lastBlock = {}
    lastBlock.nonce = 0
    lastBlock.balances = {}
    lastBlock.balanceValuesBTC = {}
    lastBlock.balanceValuesUSD = {}
    lastBlock.prevBlock = "genesis"


    test('configs is required correctly', () => {

        //get account info
        //log.debug(configs)
        expect(config.REDIS_IP).toBeDefined()
        expect(config.MONGO_IP).toBeDefined()

    })

    /*
        Deposit

     */
    let deposit1 = {
        "account" : "mpJ19nmaDocEQdTBvh6jnD3pMFyp3rFYmL",
        "time" : 1537910618083.0,
        "custodial" : true,
        "transfer" : true,
        "event" : "deposit",
        "txid" : "046e41ed60b494fa7441a75ebe993533319b25f0ded0fc08cfee4e2ccbdbddb0",
        "value" : 0.01,
        "coin" : "BTC",
        "address" : "mqLn4fx3ATqVcGyawiWGqc6v8erj58RTvz",
        "txInfo" : {
        "value" : 0.01,
            "n" : 1,
            "scriptPubKey" : {
            "asm" : "OP_DUP OP_HASH160 6bc48edc1d602cef4dedd714b35ffb56e9425e2f OP_EQUALVERIFY OP_CHECKSIG",
                "hex" : "76a9146bc48edc1d602cef4dedd714b35ffb56e9425e2f88ac",
                "reqSigs" : 1,
                "type" : "pubkeyhash",
                "addresses" : [
                "mqLn4fx3ATqVcGyawiWGqc6v8erj58RTvz"
            ]
        },
        "txid" : "046e41ed60b494fa7441a75ebe993533319b25f0ded0fc08cfee4e2ccbdbddb0",
            "coin" : "btc"
    },
        "addressInfo" : {
        "iscompressed" : "true",
            "account" : "mpJ19nmaDocEQdTBvh6jnD3pMFyp3rFYmL",
            "hdkeypath" : "m/0'/0'/3641'",
            "address" : "mqLn4fx3ATqVcGyawiWGqc6v8erj58RTvz",
            "ismine" : "true",
            "pubkey" : "029829ebd1fb7120de9b024ce160057a390c048184d28f4b61f3401ffe6626fc42",
            "hdmasterkeyid" : "971c341b615edb6342990a8e456d557d33f3bd86",
            "isvalid" : "true",
            "iswitness" : "false",
            "scriptPubKey" : "76a9146bc48edc1d602cef4dedd714b35ffb56e9425e2f88ac",
            "isscript" : "false",
            "agent" : "true",
            "iswatchonly" : "false",
            "timestamp" : "1532040303"
        }
    }


    test(' Trade case 1 ( DEPOSIT ) ', async () => {

        let result = await client.auditEvent(deposit1, lastBlock.nonce, lastBlock.balances, lastBlock.balanceValuesBTC, lastBlock.balanceValuesUSD, lastBlock.prevBlock)
        log.debug("trade1 result: ",result)

        //
        expect(result.balances.BTC).toEqual(0.01)
    })




    // test(' Trade case 2 ( TRADE ) ', async () => {
    //
    //     let result = await client.auditEvent(deposit1, lastBlock.nonce, lastBlock.balances, lastBlock.balanceValuesBTC, lastBlock.balanceValuesUSD, lastBlock.prevBlock)
    //     log.debug("trade1 result: ",result)
    //
    //     //
    //     expect(result.balances.BTC).toEqual(0.01)
    // })





})
