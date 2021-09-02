const log = require('@arbiter/dumb-lumberjack')()
const Wallet = require('../../modules/wallet')
const arbiter = require("../../modules/client.js")
const { ARBITER_SIGNING_ADDRESS, ORACLE_SIGNING_ADDRESS } = require("../../configs/env")
const { btc, ltc } = require('../../modules/daemons-manager')
const helper = require('./e2e-helper')
const Big = require('big.js')


describe('Arbiter End 2 End Test case 1b LTC (unfulfilled + timeout)', function ()
{
    let wallet

    before('Require module', async function () {
        wallet = await Wallet.info()
        expect(arbiter).to.be.an('object')
    })

    let pair = "LTC_BTC"
    let expiration = 0.1
    let amountIn = 0.1

    //order
    let order = {
        expiration,
        pair,
        amountIn
    }

    let responseArbiter
    let responseOracle

    it('Arbiter is online', async function (){
        //get coins
        this.timeout(1000 * 10);
        let coins = await arbiter.coins()
        log.debug("coins: ",coins)
        expect(coins).to.not.be.undefined
    })

    let orderBook
    it('orderbook has liquidity', async function (){
        //get depth
        orderBook = await arbiter.orderbook(order.pair)
        expect(orderBook.bids.length).to.be.greaterThan(0)
    })

    it('order RATE is NOT fillable', async () => {
      let bids = orderBook.bids.filter(b => b)
      bids.sort((a, b) => {
        return parseFloat(b.price) - parseFloat(a.price)
      })

      log.debug('sorted bids', bids)
      let highestBid = bids[0]
      // 10x max bid should be sufficient
      order.rate = Big(highestBid.price).times(10).toString()
      log.debug("order rate: ", order.rate)
      expect(+order.rate).to.be.greaterThan(+highestBid.price)
      expect(isNaN(parseFloat(order.rate))).to.be.equal(false)
      expect(parseFloat(order.rate)).to.be.greaterThan(0)
    })

    it('Master Account is set', async function () {
        // get pubkey
        log.debug("wallet: ", wallet)
        expect(wallet).to.not.be.undefined
        order.pubkey = wallet.pubkey
    })

    it('Wallet Can Make New Address', async function (){
        this.timeout(1000 * 10);
        order.returnAddress = await ltc.getNewAddress()
        order.withdrawalAddress = await btc.getNewAddress()
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
        expect(payload.coinIn).to.be.equal('LTC')
        expect(payload.coinOut).to.be.equal('BTC')
        expect(payload.pair).to.be.equal('LTC_BTC')
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
        let txid = await(ltc.sendToAddress(order.depositAddress,amountIn))
        log.debug("funding txid: ",txid)
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

    it('Arbiter Cancels at end of expiration', async function (){
        //change timeout ONLY for long test!
        //should find payment in less then 6 minutes
        this.timeout(1000 * 60 * 6);

        let status = await helper.detectCancel(order.orderId)

        expect(status).to.be.equal("cancelled")
    })

    it('Arbiter Gives a valid return TXID', async function (){
        //change timeout ONLY for long test!
        //should find payment in less then 6 minutes
        this.timeout(1000 * 60 * 6);

        let returnTx = await helper.detectReturnTxid(order.orderId)

        expect(returnTx).to.not.be.undefined

        //TODO check block explorer that tx is valid
        //fee level check
    })
    //return id
})
