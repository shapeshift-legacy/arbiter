
/*



 */
const TAG = " | financial - tests | "
//require('dotenv').config({path: '../.env'});
require('dotenv').config();

const config = require("../configs/env")

const log = require('@arbiter/dumb-lumberjack')()
//let { btc } = require('../modules/daemons-manager')

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



    test('configs is required correctly', () => {

        //get account info
        //log.debug(configs)
        expect(config.REDIS_IP).toBeDefined()
        expect(config.MONGO_IP).toBeDefined()

    })

    /*
        Binance trade 1

     */

    let trade1 = {
        "symbol" : "TRXBTC",
        "id" : 5913777,
        "orderId" : 10229652,
        "price" : "0.00001266",
        "qty" : "7898.00000000",
        "commission" : "7.89800000",
        "commissionAsset" : "TRX",
        "time" : 1515103799615.0,
        "isBuyer" : true,
        "isMaker" : true,
        "isBestMatch" : true
    }

    test(' Trade case 1 ( MAKER ACQUISITION ) ', async () => {
        let result = await client.digestTrade(trade1)
        log.debug("trade1 result: ",result)
        //
    })


    /*
        Binance trade 2

     */

    let trade2 = {
        "symbol" : "TRXBTC",
        "id" : 7548658,
        "orderId" : 12702637,
        "price" : "0.00001028",
        "qty" : "7890.00000000",
        "commission" : "0.00008111",
        "commissionAsset" : "BTC",
        "time" : 1515215339431.0,
        "isBuyer" : false,
        "isMaker" : false,
        "isBestMatch" : true
    }

    test(' Trade case 2 ( TAKER DISPOSAL ) ', async () => {
        let result = await client.digestTrade(trade2)
        log.debug("trade2 result: ",result)
        //
    })

    /*
    Binance trade 2

 */

    let trade3 = {
        "symbol" : "TRXBTC",
        "id" : 5913777,
        "orderId" : 10229652,
        "price" : "0.00001266",
        "qty" : "7898.00000000",
        "commission" : "7.89800000",
        "commissionAsset" : "TRX",
        "time" : 1515103799615.0,
        "isBuyer" : true,
        "isMaker" : true,
        "isBestMatch" : true
    }

    test(' Trade case 3 ( MAKER ACQUISITION ) ', async () => {
        let result = await client.digestTrade(trade3)
        log.debug("trade2 result: ",result)
        //
    })

    /*
            Audit TX


     */
    let prevBlock
    test(' -- TEST USER DEPOSIT! -- ', async () => {

        let trade = {
            "insertTime" : 1515101785000.0,
            "amount" : 0.1,
            "address" : "14oDpyCjwbheDaHHh3ZUqkUbkTPVhQwCV9",
            "addressTag" : "",
            "txId" : "083e745f9ba3d82a6cd031f9bab3a8c7ec374d512e01c95706e9f57414cb9099",
            "asset" : "BTC",
            "status" : 1,
            "transfer" : true,
            "time" : 1515101785000.0,
            "coin" : "BTC",
            "txid" : "083e745f9ba3d82a6cd031f9bab3a8c7ec374d512e01c95706e9f57414cb9099"
        }
        let i = 0
        let balances = {}
        let balanceValuesBTC = {}
        let balanceValuesUSD = {}
        prevBlock = "TEST GENSIS TEST bro"

        let result = await client.auditEvent(trade, i, balances, balanceValuesBTC, balanceValuesUSD, prevBlock)
        log.info("BLOCK 1 : ",result)
        prevBlock = result
        //
    })

    test(' -- TRADE 1 ( MAKER ACQUISITION ) -- ', async () => {

        let trade = {
            "symbol" : "TRXBTC",
            "id" : 5913777,
            "orderId" : 10229652,
            "price" : "0.00001266",
            "qty" : "7898.00000000",
            "commission" : "7.89800000",
            "commissionAsset" : "TRX",
            "time" : 1515103799615.0,
            "isBuyer" : true,
            "isMaker" : true,
            "isBestMatch" : true,
            "txid" : null
        }
        let i = 1
        let balances = prevBlock.balances
        let balanceValuesBTC = prevBlock.balanceValuesBTC
        let balanceValuesUSD = prevBlock.balanceValuesUSD


        let result = await client.auditEvent(trade, i, balances, balanceValuesBTC, balanceValuesUSD, prevBlock.signature)
        log.info("BLOCK 2 : ",result)
        prevBlock = result
        //
    })

    test(' -- TRADE  2 (  ) -- ', async () => {

        let trade = {
            "symbol" : "TRXBTC",
            "id" : 7548658,
            "orderId" : 12702637,
            "price" : "0.00001028",
            "qty" : "7890.00000000",
            "commission" : "0.00008111",
            "commissionAsset" : "BTC",
            "time" : 1515215339431.0,
            "isBuyer" : false,
            "isMaker" : false,
            "isBestMatch" : true,
            "txid" : null
        }
        let i = 2
        let balances = prevBlock.balances
        let balanceValuesBTC = prevBlock.balanceValuesBTC
        let balanceValuesUSD = prevBlock.balanceValuesUSD


        let result = await client.auditEvent(trade, i, balances, balanceValuesBTC, balanceValuesUSD, prevBlock.signature)
        log.info("BLOCK 3 : ",result)
        prevBlock = result
        //
    })

    test(' -- TRADE  3 (  ) -- ', async () => {

        let trade = {
            "symbol" : "ETHBTC",
            "id" : 17326724,
            "orderId" : 47415337,
            "price" : "0.07366100",
            "qty" : "0.13600000",
            "commission" : "0.00013600",
            "commissionAsset" : "ETH",
            "time" : 1515375544477.0,
            "isBuyer" : true,
            "isMaker" : false,
            "isBestMatch" : true,
            "txid" : null
        }
        let i = 3
        let balances = prevBlock.balances
        let balanceValuesBTC = prevBlock.balanceValuesBTC
        let balanceValuesUSD = prevBlock.balanceValuesUSD


        let result = await client.auditEvent(trade, i, balances, balanceValuesBTC, balanceValuesUSD, prevBlock.signature)
        log.info("BLOCK 4 : ",result)
        prevBlock = result
        //
    })


    test(' -- TRADE  4 (  ) -- ', async () => {

        let trade = {
            "symbol" : "TNBBTC",
            "id" : 690344,
            "orderId" : 1631395,
            "price" : "0.00002250",
            "qty" : "1578.00000000",
            "commission" : "1.57800000",
            "commissionAsset" : "TNB",
            "time" : 1515454430687.0,
            "isBuyer" : true,
            "isMaker" : true,
            "isBestMatch" : true,
            "txid" : null
        }
        let i = 4
        let balances = prevBlock.balances
        let balanceValuesBTC = prevBlock.balanceValuesBTC
        let balanceValuesUSD = prevBlock.balanceValuesUSD


        let result = await client.auditEvent(trade, i, balances, balanceValuesBTC, balanceValuesUSD, prevBlock.signature)
        log.info("BLOCK 4 : ",result)
        prevBlock = result
        //
    })

})
