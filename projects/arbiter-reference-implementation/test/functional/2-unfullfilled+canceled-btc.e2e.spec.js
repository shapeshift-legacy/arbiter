const log = require('@arbiter/dumb-lumberjack')()
const Wallet = require('../../modules/wallet')
const pause = require('../../modules/pause')
const arbiter = require("./../../modules/client.js")
const { ARBITER_SIGNING_ADDRESS, ORACLE_SIGNING_ADDRESS } = require("../../configs/env")
const { btc, ltc } = require('../../modules/daemons-manager')
const helper = require('./e2e-helper')


describe('Arbiter End 2 End Test case 2 BTC (unfulfilled + cancel request)', function ()
{
    let wallet

    before('Require module', async function () {
        wallet = await Wallet.info()
        expect(arbiter).to.be.an('object')
    })

    let pair = "BTC_LTC"
    let expiration = 200
    let rate = 0.002
    let amountIn = .001

    //expected amount out
    let amountOut = amountIn * rate
    log.debug("**** amountOut: ",amountOut)

    //order
    let order = {
        expiration,
        pair,
        rate,
        amountIn
    }

    let responseArbiter
    let responseOracle

    it('Arbiter is online', async function (){
        //get coins
        let coins = await arbiter.coins()
        expect(coins).to.not.be.undefined
    })

    it('Master Account is set', async function () {
        // get pubkey
        log.debug("wallet: ", wallet)
        expect(wallet).to.not.be.undefined
        order.pubkey = wallet.pubkey
    })

    it('Wallet Can Make New Address', async function (){
        //ETH is slowpoke at making addresses, 10sec
        this.timeout(1000 * 30);
        order.returnAddress = await btc.getNewAddress()
        order.withdrawalAddress = await ltc.getNewAddress()
        expect(order.returnAddress).to.not.be.undefined
        expect(order.withdrawalAddress).to.not.be.undefined
    })

    it('Arbiter can create a new order', async function () {
        this.timeout(1000 * 1000);

        responseArbiter = await helper.createOrder(order)
        let { payload, account } = responseArbiter

        expect(payload).to.not.be.undefined
        //expect(response.pubkey).to.not.be.undefined
        //new
        expect(payload.orderId).to.not.be.undefined
        order.orderId = payload.orderId
        expect(payload.depositAddress).to.not.be.undefined
        order.depositAddress = payload.depositAddress
        expect(payload.coinOut).to.be.equal('LTC')
        expect(payload.coinIn).to.be.equal('BTC')
        expect(payload.pair).to.be.equal('BTC_LTC')
        expect(account).to.not.be.undefined
        //TODO ambiguous refund/return
        expect(payload.returnAddress).to.be.equal(order.returnAddress)
        expect(payload.withdrawalAddress).to.be.equal(order.withdrawalAddress)
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

        let validateRespArbiter = await Wallet.verifyMessage(arbiterPubkey,responseArbiter.signature,JSON.stringify(responseArbiter.payload))

        //validate sig oracle
        let oraclePubkey = ORACLE_SIGNING_ADDRESS
        expect(oraclePubkey).to.not.be.undefined
        expect(responseOracle.signature).to.not.be.undefined
        expect(responseOracle.payload).to.not.be.undefined
        let validateRespOracle = await Wallet.verifyMessage(oraclePubkey,responseOracle.signature,JSON.stringify(responseOracle.payload))

        //validate params
        log.debug("responseOracle: ",validateRespOracle)
        log.debug("validateRespArbiter: ",validateRespArbiter)

        //
        expect(validateRespArbiter).to.be.equal(true)
        expect(validateRespOracle).to.be.equal(true)

    })

    it('Wallet can fund the order', async function (){
        //
        let txid = await btc.sendToAddress(order.depositAddress,amountIn)
        log.debug("txid: ",txid)
        order.txidFunding = txid
        //TODO handle errors
        expect(txid).to.not.be.undefined
    })

    //TODO handle fast order fullfillment
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

        let orderbook = await arbiter.orderbook(pair)

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
    //return id
})
