/**
 * Created by highlander on 12/28/16.
 */

const proxyquire = require('proxyquire')
const rewire = require('rewire')
const moment = require('moment')
const when = require('when')
//globals

//Flags
//const websocket = true
const gntTest = false
const btcTest = true
const testNetBtc = false
const testNetEth = false
const forceSocket = false
const forceREST = false
const noSend = false
const verbose = true
const orderId = false

//modules
const arbiter = rewire("./../../modules/client.js")
const account = require("../../modules/wallet.js")
const helper = rewire("./e2e-helper.js")
const { ARBITER_SIGNING_ADDRESS, ORACLE_SIGNING_ADDRESS } = require("../../configs/env")
const { btc, ltc, eth, gnt } = require('../../modules/daemons-manager')


describe.skip('Arbiter End 2 End Test case 1c GNT (unfulfilled + timeout)', function () {
    before('Require module', function () {
        //rewire redis
        //arbiter.__set__('redis', redis)

        //turn on debug
        //arbiter.__set__('debug', true)
        //gnt.__set__('debug', true)
        //btc.__set__('debug', true)

        let fakeConsole = {}
        fakeConsole.error = function (err) {
        }
        fakeConsole.log = function (err) {
        }
        //arbiter.__set__('console', fakeConsole)
        //gnt.__set__('console', fakeConsole)
        //btc.__set__('console', fakeConsole)


        expect(arbiter).to.be.an('object')
    })

    /**
     * E2E test scope
     *
     * Objects:
     *    Account:
     *          example
     *    Order:
     */

    let debug = false

    //pair
    let pair = "GNT_BTC"
    //expiration in minutes
    //TODO time different by env
    //mainnet sloooowwwww
    let expiration = 0.1
    //~normal rate
    // 1GNT = 0.0175 BTC
    // 1BTC = 56.14 GNT
    let rate = 1.150
    let amountIn = 0.003

    //expected amount out
    let amountOut = amountIn / rate
    if (debug) console.log("amountOut: ", amountOut)

    //order
    let order = {
        //Min experation (10min)
        expiration: expiration,
        pair: pair,
        amountIn: amountIn,
        //Unfillable rate
        //jlay
        rate: rate,
        //rate:1000,
    }

    let responseArbiter
    let responseOracle

    //tools
    var pause = function (length) {
        var d = when.defer();
        var done = function () {
            d.resolve(true)
        }
        setTimeout(done, length * 1000)
        return d.promise
    }

    it('Arbiter is online', async function () {

        let coins = helper.checkCoins()
        expect(coins).to.not.be.undefined
    })

    it('Arbiter Has markets', function () {

    })

    it('Master Account is set', async function () {
        this.timeout(1000 * 60 * 10);

        // get pubkey
        accountMaster = await account.info()
        if (debug) console.log("accountMaster: ", accountMaster)
        expect(accountMaster).to.not.be.undefined
        order.pubkey = accountMaster.pubkey
    })

    it('Eth account is set', async function () {
        let accountInfo = await helper.checkEthAccount()
        expect(accountInfo.payload.contractAddress).to.not.be.undefined
    })

    it('Wallet Can Make New Address', async function () {
        //GNT is slowpoke at making addresses, 10sec
        this.timeout(1000 * 10);
        order.returnAddress = await helper.getNewAddress('gnt')
        // order.returnAddress = "0xfE22566EaEe332EDf9f1De7592AD80fb90788694"

        order.withdrawalAddress = await helper.getNewAddress('btc')

        if (debug) console.log(' order', order)
        expect(order.returnAddress).to.not.be.undefined
        expect(order.withdrawalAddress).to.not.be.undefined
    })

    it('Arbiter can create a new order', async function () {
        this.timeout(1000 * 1000);
        // let accountMaster = await helper.getMasterAccount()

        responseArbiter = await helper.createOrder(order)
        let payload = responseArbiter.payload
        if (debug) console.log("payload: ", payload)
        //expect(output.success).to.be.equal(true)
        //let response = output.data

        expect(payload).to.not.be.undefined
        //expect(response.pubkey).to.not.be.undefined
        //new
        //expect(response.orderId).to.not.be.undefined
        order.orderId = payload.orderId
        //expect(response.depositAddress).to.not.be.undefined
        order.depositAddress = payload.depositAddress
        // expect(response.maxDeposit).to.not.be.undefined
        // expect(response.minDeposit).to.not.be.undefined
        //
        // //confirmation
        // expect(response.account).to.be.equal(accountMaster.account)
        // //TODO ambiguous refund/return
        // expect(response.refundAddress).to.be.equal(order.returnAddress)
        // expect(response.withdrawalAddress).to.be.equal(order.withdrawalAddress)
        // expect(response.amountIn).to.be.equal(amountIn)
        // expect(response.pair).to.be.equal(pair)
        //
        // //
        // expect(response.coinIn).to.not.be.undefined
        // expect(response.coinOut).to.not.be.undefined
        // expect(response.amountOut).to.not.be.undefined


    })

    it('Signatures are valid', async function () {
        this.timeout(1000 * 1000);
        //debug = true
        //get order info from oracle
        responseOracle = await helper.getStatusFromOracle(order.orderId)

        if (debug) console.log("responseOracle: ", responseOracle)

        // //valid sig arbiter
        let arbiterPubkey = ARBITER_SIGNING_ADDRESS
        expect(arbiterPubkey).to.not.be.undefined
        expect(responseArbiter.signature).to.not.be.undefined
        expect(responseArbiter.payload).to.not.be.undefined

        let validateRespArbiter = await helper.validateSignature("btc", arbiterPubkey, responseArbiter.signature, JSON.stringify(responseArbiter.payload))

        //validate sig oracle
        let oraclePubkey = ORACLE_SIGNING_ADDRESS
        expect(oraclePubkey).to.not.be.undefined
        expect(responseOracle.signature).to.not.be.undefined
        expect(responseOracle.payload).to.not.be.undefined
        let validateRespOracle = await helper.validateSignature("btc", oraclePubkey, responseOracle.signature, JSON.stringify(responseOracle.payload))

        //validate params
        if (debug) console.log("validateRespOracle: ", validateRespOracle)
        if (debug) console.log("validateRespArbiter: ", validateRespArbiter)

        expect(validateRespArbiter).to.be.equal(true)
        expect(validateRespOracle).to.be.equal(true)

    })

    it('Wallet can fund the order', async function () {
        this.timeout(1000 * 1000);

        let txid = await gnt.sendToAddress(order.depositAddress, amountIn)
        if (debug) console.log("funding txid: ", txid)
        order.txidFunding = txid
        //TODO handle errors
        expect(txid).to.not.be.undefined
    })

    it('Arbiter Detects payment', async function () {
        //change timeout ONLY for long test!
        //should find payment in less then 4 minutes
        this.timeout(1000 * 60 * 20);
        //for loop polling?
        let status = null
        while (status != "live") {
            //console.log("checkpoint1")
            //send txid (redundant)
            //TODO broke
            //let found = await(arbiter.txid(order.txidFunding))
            // console.log("found:",found)
            //query status
            let orderInfo = await(arbiter.status(order.orderId))

            //expect(orderInfo.success).to.be.equal(true)
            if (debug) console.log("orderInfo: ", orderInfo)
            status = orderInfo.status
            if (debug) console.log("status: ", status)
            //limit requests
            await(pause(1))
        }
        expect(status).to.be.equal("live")
    })

    //shows in orderbook
    it('Arbiter shows live order in orderbook', async function () {
        let orderbook = await(arbiter.orderbook(pair))

        //This assumes empty order book!
        //console.log(orderbook)
        expect(orderbook).to.not.be.undefined
        //order should be in correct price tier of bids

        // TODO
        // expect(orderbook.bids[0].orders[0].id).to.be.equal(order.orderId)
        // expect(orderbook.bids[0].orders[0].price).to.be.equal(order.amountIn)
        // expect(orderbook.bids[0].orders[0].quantity).to.be.equal(order.orderId)
    })

    it('Arbiter Cancels at end of expiration', async function () {
        //change timeout ONLY for long test!
        //should find payment in less then 6 minutes
        this.timeout(1000 * 60 * 10);
        //for loop polling?
        let status = null
        let returnTx = null
        while (status != "cancelled") {
            //console.log("checkpoint1")
            //query status
            let orderInfo = await(arbiter.status(order.orderId))
            //expect(orderInfo.success).to.be.equal(true)

            var timeLeft = orderInfo.expiration - new Date().getTime()
            if (debug) console.log("timeLeft:(seconds) ", timeLeft / 1000)

            status = orderInfo.status
            returnTx = orderInfo.txidReturn
            if (debug) console.log("status: ", status)

            //limit requests
            await(pause(1))
        }
        expect(status).to.be.equal("cancelled")
    })

    it('Arbiter Gives a valid return TXID', async function () {
        //change timeout ONLY for long test!
        //should find payment in less then 6 minutes
        this.timeout(1000 * 60 * 6);
        //for loop polling?
        let status = null
        let returnTx = null
        while (!returnTx) {
            //console.log("checkpoint1")
            //query status
            let orderInfo = await(arbiter.status(order.orderId))

            var timeLeft = orderInfo.expiration - new Date().getTime()
            if (debug) console.log("timeLeft:(seconds) ", timeLeft / 1000)

            if (orderInfo.txidReturn && orderInfo.txidReturn.length > 10) {
                returnTx = orderInfo.txidReturn
                if (debug) console.log("returnTx: " + JSON.stringify(returnTx))
            }


            //limit requests
            await(pause(1))
        }
        expect(returnTx).to.not.be.undefined

        //TODO check block explorer that tx is valid
        //fee level check
    })

})
