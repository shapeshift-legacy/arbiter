const log = require('@arbiter/dumb-lumberjack')()
const wallet = require('../../modules/wallet')
const arbiter = require("./../../modules/client.js")
const helper = require('./e2e-helper')
const Big = require('big.js')

const {
  ARBITER_SIGNING_ADDRESS,
  ORACLE_SIGNING_ADDRESS
} = require("../../configs/env")
const { btc, ltc } = require('../../modules/daemons-manager')


describe('Arbiter End 2 End Test case 5b LTC (Completed Trade)', function ()
{
    let order = {
      expiration: 5,
      pair: "LTC_BTC",
      amountIn: 0.17
    }

    let responseArbiter
    let responseOracle

    it('Arbiter is online', async function (){
        //get coins
        //let coins = await(arbiter.coins())
        //expect(coins).to.not.be.undefined
    })

    let orderBook
    it('Arbiter Has markets', async function (){
        //get depth
        orderBook = await arbiter.orderbook("LTC_BTC")
        expect(orderBook.bids.length).to.be.greaterThan(0)
    })

    it('order RATE is fillable', () => {
      let bids = orderBook.bids.filter(b => b)
      bids.sort((a, b) => {
        return parseFloat(b.price) - parseFloat(a.price)
      })

      log.debug('sorted bids', bids)
      let highestBid = bids[0]
      let price = Big(highestBid.price)
      let markdown = price.times(0.03)
      order.rate = price.minus(markdown).toString()
      log.debug("order rate: ", order.rate)
      expect(+highestBid.price).to.be.greaterThan(+order.rate)
      expect(isNaN(parseFloat(order.rate))).to.be.equal(false)
      expect(parseFloat(order.rate)).to.be.greaterThan(0)
    })

    it('order AMOUNT is fillable', async function (){
        let bids = orderBook.bids.slice(0, 5) // only log the lowest 5 offers
        log.debug(`bids`, bids)
        let minQtyOnBooks = Big(order.amountIn).times(order.rate)

        // find highest bid
        let sum = orderBook.bids.reduce((total, bid) => {
          return +bid.price > +order.rate ? total + bid.quantity : total
        }, 0)

        log.debug(`minQtyOnBooks:`, minQtyOnBooks.toString(), 'actual amount on books below rate:', sum)
        expect(+sum).to.be.greaterThan(+minQtyOnBooks)
    })

    it('Master Account is set', async function (){
        const accountMaster = await wallet.info()
        expect(accountMaster).to.not.be.undefined
        order.pubkey = accountMaster.pubkey
    })

    it('Wallet Can Make New Address', async function (){
        this.timeout(1000 * 10);
        order.returnAddress = await ltc.getNewAddress()
        order.withdrawalAddress = await btc.getNewAddress()
        expect(order.returnAddress).to.not.be.undefined
        expect(order.withdrawalAddress).to.not.be.undefined
    })

    it('Arbiter can create a new order', async function (){
        this.timeout(1000 * 60 * 6);
        //Make Request!
        responseArbiter = await arbiter.orderCreate(order)
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

        log.debug('ARBITER_SIGNING_ADDRESS', ARBITER_SIGNING_ADDRESS)
        log.debug('responseArbiter', responseArbiter)
        log.debug('responseArbiter.signature', responseArbiter.signature)

        log.debug('JSON.stringify(responseArbiter.payload)', JSON.stringify(responseArbiter.payload))

        let validateRespArbiter = await btc.verifyMessage(arbiterPubkey,responseArbiter.signature,JSON.stringify(responseArbiter.payload))

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
        //
        let txid = await ltc.sendToAddress(order.depositAddress,order.amountIn)
        log.debug(txid)
        order.txidFunding = txid
        //TODO handle errors
        expect(txid).to.not.be.undefined
    })

    it('completes transaction', async function (){
        //change timeout ONLY for long test!
        //should find payment in less then 6 minutes
        this.timeout(1000 * 60 * 6);
        //for loop polling?
        const status = await helper.detectComplete(order.orderId)

        expect(status).to.be.equal("complete")
    })

    it('Arbiter Gives a valid fullment TXID', async function (){
        //change timeout ONLY for long test!
        this.timeout(1000 * 60 * 6);
        //for loop polling?
        const txidOut = await helper.detectFulfillment(order.orderId)

        expect(txidOut).to.not.be.undefined

        //TODO check block explorer that tx is valid
        //fee level check
    })

    it('Arbiter Gives a valid sweep TXID', async function (){
        //change timeout ONLY for long test!
        //should find payment in less then 6 minutes
        this.timeout(1000 * 60 * 6);
        //for loop polling?
        const sweepTx = await helper.detectSweepTx(order.orderId)

        expect(sweepTx).to.not.be.undefined

        //TODO check block explorer that tx is valid
        //fee level check


        //TODO sweep amount is correct
    })
})
