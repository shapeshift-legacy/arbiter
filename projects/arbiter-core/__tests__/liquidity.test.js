/*
     Liquidity
        Custodial API tests


 */





/*
    TODO
        mock redis
        mock accounting
        mock trade engine
        mock daemons

*/

const TAG = " | liquidity - tests | "
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


let client = require("../modules/liquidity.js")



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
        validate order

     */



    test(' Trade case 1 ( DEPOSIT ) ', async () => {

        let result = await client.()
        log.debug("trade1 result: ",result)

        //

    })


    /*
    validate order invalid

    */


    // test(' Trade case 2 ( TRADE ) ', async () => {
    //
    //     let result = await client.auditEvent(deposit1, lastBlock.nonce, lastBlock.balances, lastBlock.balanceValuesBTC, lastBlock.balanceValuesUSD, lastBlock.prevBlock)
    //     log.debug("trade1 result: ",result)
    //
    //     //
    //     expect(result.balances.BTC).toEqual(0.01)
    // })





})
