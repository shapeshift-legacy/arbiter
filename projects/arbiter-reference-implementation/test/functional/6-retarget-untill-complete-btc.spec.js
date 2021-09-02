const Big = require('big.js')
const Wallet = require('../../modules/wallet')
const log = require('@arbiter/dumb-lumberjack')()
const arbiter = require("./../../modules/client.js")
const helper = require('./e2e-helper')

const {
  ARBITER_SIGNING_ADDRESS,
  ORACLE_SIGNING_ADDRESS
} = require("../../configs/env")
const { btc, ltc } = require('../../modules/daemons-manager')

describe('Arbiter End 2 End Test case 6 BTC (Retarget to Completed Trade)', function ()
{
    let wallet, fillableRate

    before('Require module', async () => {
        wallet = await Wallet.info()
        expect(arbiter).to.be.an('object')
    })

    //order
    let order = {
        //Min experation (10min)
        expiration: 200,
        pair: "BTC_LTC",
        amountIn: 0.001
    }

    let responseArbiter
    let responseOracle

    it('Arbiter is online', async function (){
        //get coins
        let coins = await arbiter.coins()
        expect(coins).to.not.be.undefined
    })

    let orderBook
    it('Arbiter Has markets', async function (){
        this.timeout(1000 * 60 * 10);
        //get depth
        orderBook = await arbiter.orderbook("BTC_LTC")
        log.debug("orderbook: ",orderBook)
        expect(orderBook.offers.length).to.be.greaterThan(0)
    })

    it('initial RATE is NOT fillable', async () => {
      let bids = orderBook.bids.filter(b => b)
      bids.sort((a, b) => {
        return parseFloat(b.price) - parseFloat(a.price)
      })

      log.debug('sorted bids', bids)
      let highestBid = bids[0]
      // 10x max bid should be sufficient
      order.rate = Big(highestBid.price).div(10).toString()
      log.debug("order rate: ", order.rate)
      expect(+order.rate).to.be.lessThan(+highestBid.price)
      expect(isNaN(parseFloat(order.rate))).to.be.equal(false)
      expect(parseFloat(order.rate)).to.be.greaterThan(0)
    })

    it('can determine a fillable rate', async function (){
        //find lowest offer
        let lowestOffer = orderBook.offers[0]
        log.debug("lowestOffer: ",lowestOffer)
        // make the price 3% higher than lowestOffer
        let price = Big(lowestOffer.price)
        let markup = price.times(0.03)
        fillableRate = price.plus(markup).toString()
        log.debug("order rate: ", order.rate)
        expect(+lowestOffer.price).to.be.lessThan(+fillableRate)
    })

    it('order AMOUNT is fillable', async function (){
        let offers = orderBook.offers.slice(0, 5) // only log the lowest 5 offers
        log.debug(`offers`, offers)
        let minQtyOnBooks = Big(order.amountIn).div(fillableRate)

        // find lowest offer
        let sum = orderBook.offers.reduce((total, offer) => {
          return +offer.price < +fillableRate ? total + offer.quantity : total
        }, 0)

        log.debug(`minQtyOnBooks:`, minQtyOnBooks.toString(), 'actual amount on books below rate:', sum)
        expect(+sum).to.be.greaterThan(+minQtyOnBooks)
    })

    it('Master Account is set', async function () {
        // get pubkey
        log.debug("wallet: ", wallet)
        expect(wallet).to.not.be.undefined
        order.pubkey = wallet.pubkey
    })

    it('Wallet Can Make New Address', async function (){
        //ETH is slowpoke at making addresses, 10sec
        this.timeout(1000 * 60);
        order.returnAddress = await btc.getNewAddress()
        order.withdrawalAddress = await ltc.getNewAddress()
        expect(order.returnAddress).to.not.be.undefined
        expect(order.withdrawalAddress).to.not.be.undefined
    })

    it('Arbiter can create a new order', async function () {
        this.timeout(1000 * 10);

        responseArbiter = await helper.createOrder(order)
        let { payload, account } = responseArbiter

        expect(payload).to.not.be.undefined
        expect(payload.orderId).to.not.be.undefined
        order.orderId = payload.orderId
        expect(payload.depositAddress).to.not.be.undefined
        order.depositAddress = payload.depositAddress
        expect(payload.coinIn).to.be.equal('BTC')
        expect(payload.coinOut).to.be.equal('LTC')
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
        this.timeout(1000 * 10);
        //
        let txid = await btc.sendToAddress(order.depositAddress,order.amountIn)
        log.debug(txid)
        order.txidFunding = txid
        //TODO handle errors
        expect(txid).to.not.be.undefined
    })

    it('Arbiter Detects payment', async function (){
        //change timeout ONLY for long test!
        //should find payment in less then 4 minutes
        this.timeout(1000 * 60 * 4);

        const status = await helper.detectPayment(order.orderId)

        let isValid = ( ["live","complete"].indexOf(status) > -1 )
        expect(isValid).to.be.equal(true)
    })

    //shows in orderbook
    it.skip('Arbiter shows live order in orderbook', async function (){
      this.timeout(1000 * 10);
      let orderbook = await arbiter.orderbook(order.pair)

      //This assumes empty order book!
      log.debug("orderbook: ",orderbook.payload)
      log.debug("Bids: ",orderbook.payload.bids)
      log.debug("Bids: ",orderbook.payload.bids[0])
      log.debug("asks: ",orderbook.payload.offers)
      log.debug("asks: ",orderbook.payload.offers[0])
      log.debug("asks: ",orderbook.payload.offers[0][0])
      expect(orderbook.payload).to.not.be.undefined
      //order should be in correct price tier of bids

      // TODO
      // expect(orderbook.bids[0].orders[0].id).to.be.equal(order.orderId)
      // expect(orderbook.bids[0].orders[0].price).to.be.equal(order.amountIn)
      // expect(orderbook.bids[0].orders[0].quantity).to.be.equal(order.orderId)
    })

    //retargets to fillable rate
    it('Order retargets to fillable rate', async function (){
        this.timeout(1000 * 20);

        let retargetResp = await arbiter.retarget(order.orderId,fillableRate)
        log.debug("retargetResp: " ,retargetResp)

        //expect success
        expect(retargetResp.success).to.be.equal(true)

        //expect new orderId
        expect(retargetResp.orderId).to.not.be.equal(order.orderId)

        //Set order for test to new orderId
        order.orderId = retargetResp.orderId

        //This assumes empty order book!
        //log.debug(orderbook)
        //expect(orderbook).to.not.be.undefined
        //order should be in correct price tier of bids

        //TODO live orderId pushed over socket in match event
    })

    it('completes transaction', async function (){
        //change timeout ONLY for long test!
        //should find payment in less then 6 minutes
        this.timeout(1000 * 60 * 6);

        const status = await helper.detectComplete(order.orderId)

        expect(status).to.be.equal("complete")
    })

    //TODO validate sweep

    it('Arbiter Gives a valid fullment TXID', async function (){
        //change timeout ONLY for long test!
        //should find payment in less then 6 minutes
        this.timeout(1000 * 60 * 6);

        const txidOut = await helper.detectFulfillment(order.orderId)

        expect(txidOut).to.not.be.undefined
    })

    it('Arbiter Gives a valid sweep TXID', async function () {
        //change timeout ONLY for long test!
        //should find payment in less then 6 minutes
        this.timeout(1000 * 60 * 6);

        const sweepTx = await helper.detectSweepTx(order.orderId)

        expect(sweepTx).to.not.be.undefined

        //TODO check block explorer that tx is valid
        //fee level check


        //TODO sweep amount is correct
    })
})
