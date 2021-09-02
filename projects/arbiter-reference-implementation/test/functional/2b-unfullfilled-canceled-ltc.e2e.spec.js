const log = require('@arbiter/dumb-lumberjack')()
const wallet = require('../../modules/wallet')
const pause = require('../../modules/pause')
const arbiter = require("./../../modules/client.js")
const account = require("../../modules/wallet.js")
const helper = require('./e2e-helper')

const {
  ARBITER_SIGNING_ADDRESS,
  ORACLE_SIGNING_ADDRESS
} = require("../../configs/env")
const { btc, ltc } = require('../../modules/daemons-manager')

describe('Arbiter End 2 End Test case 2b LTC (unfulfilled + canceld)', function ()
{
    before('Require module', function ()
    {
        //rewire redis
        // arbiter.__set__('redis', redis)
        //
        // //turn on debug
        // arbiter.__set__('debug', true)
        // // ltc.__set__('debug', true)
        // // btc.__set__('debug', true)
        //
        // let  fakeConsole = {}
        // fakeConsole.error = function(err){}
        // fakeConsole.log = function(err){}
        //arbiter.__set__('console', fakeConsole)
        // ltc.__set__('console', fakeConsole)
        // btc.__set__('console', fakeConsole)


        //expect(arbiter).to.be.an('object')
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
    let pair = "LTC_BTC"
    //expiration in minutes
    let expiration = 2
    //let rate = 55.59
    let rate = 1.008
    let amountIn = .014

    //order
    let order = {
        //Min experation (10min)
        expiration:expiration,
        pair:pair,
        amountIn:amountIn,
        //Unfillable rate
        //jlay
        rate:rate,
        //rate:1000,
    }
    let responseArbiter
    let responseOracle

    it('Arbiter is online', async function (){
        //get coins
        //let coins = await(arbiter.coins())
        //expect(coins).to.not.be.undefined
    })

    it('Arbiter Has markets', function (){

    })

    it('Master Account is set', async function (){
        const accountMaster = await(account.info())
        expect(accountMaster).to.not.be.undefined
        order.pubkey = accountMaster.pubkey
        order.signingPub = accountMaster.signingPub
        order.signingPriv = accountMaster.signingPriv
    })

    it('Wallet Can Make New Address', async function (){
        //ETH is slowpoke at making addresses, 10sec
        this.timeout(1000 * 10);
        order.returnAddress = await(ltc.getNewAddress())
        order.withdrawalAddress = await(btc.getNewAddress())
        expect(order.returnAddress).to.not.be.undefined
        expect(order.withdrawalAddress).to.not.be.undefined
    })

    it('Arbiter can create a new order', async function (){
        this.timeout(1000 * 30);
        const accountMaster = await(account.info())

        //Make Request!
        responseArbiter = await(arbiter.orderCreate(order))
        let payload = responseArbiter.payload
        log.debug("response: ",payload)
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
        //debug = true
        //get order info from oracle
        responseOracle = await arbiter.statusOracle(order.orderId)

        log.debug("responseOracle: ",responseOracle)

        //valid sig arbiter
        let arbiterPubkey = ARBITER_SIGNING_ADDRESS
        expect(arbiterPubkey).to.not.be.undefined
        expect(responseArbiter.signature).to.not.be.undefined
        expect(responseArbiter.payload).to.not.be.undefined

        let validateRespArbiter = await wallet.verifyMessage(arbiterPubkey,responseArbiter.signature,JSON.stringify(responseArbiter.payload))

        //validate sig oracle
        let oraclePubkey = ORACLE_SIGNING_ADDRESS
        expect(oraclePubkey).to.not.be.undefined
        expect(responseOracle.signature).to.not.be.undefined
        expect(responseOracle.payload).to.not.be.undefined
        let validateRespOracle = await wallet.verifyMessage(oraclePubkey,responseOracle.signature,JSON.stringify(responseOracle.payload))

        //validate params
        log.debug("responseOracle: ",validateRespOracle)
        log.debug("validateRespArbiter: ",validateRespArbiter)

        //
        expect(validateRespArbiter).to.be.equal(true)
        expect(validateRespOracle).to.be.equal(true)

    })

    it('Wallet can fund the order', async function (){
        this.timeout(1000 * 30);

        let txid = await(ltc.sendToAddress(order.depositAddress,amountIn))
        log.debug(txid)
        order.txidFunding = txid
        //TODO handle errors
        expect(txid).to.not.be.undefined
    })

    it('Arbiter Detects payment', async function (){
        //change timeout ONLY for long test!
        //should find payment in less then 4 minutes
        this.timeout(1000 * 60 * 4);
        //for loop polling?
        let status = await helper.detectPayment(order.orderId)

        expect(status).to.be.equal("live")
    })

    //shows in orderbook
    it('Arbiter shows live order in orderbook', async function (){
        this.timeout(1000 * 15);

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

    it('Arbiter Cancels at request', async function (){
        //change timeout ONLY for long test!
        //should find payment in less then 6 minutes
        this.timeout(1000 * 60);

        // add a little pause here to make sure both nodes have the tx
        await pause(5)
        let res = await arbiter.cancel(order.orderId)
        log.debug(`res`, res)

        expect(res.payload.status).to.be.equal("cancelled")
    })

    it('Arbiter Gives a valid return TXID', async function (){
        //change timeout ONLY for long test!
        //should find payment in less then 6 minutes
        this.timeout(1000 * 60 * 6);
        //for loop polling?
        let returnTx = await helper.detectReturnTxid(order.orderId)

        expect(returnTx).to.not.be.undefined

        //TODO check block explorer that tx is valid
        //fee level check
    })
})
