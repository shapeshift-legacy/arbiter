const Big = require('big.js')
const Wallet = require('../../modules/wallet')
const log = require('@arbiter/dumb-lumberjack')()
const arbiter = require("./../../modules/client.js")
const helper = require('./e2e-helper')
const { web3 } = require('../../modules/web3-manager')

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
        pair: "ETH_BTC",
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
        orderBook = await arbiter.orderbook("ETH_BTC")
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
      order.rate = Big(highestBid.price).times(10).toString()
      log.debug("order rate: ", order.rate)
      expect(+order.rate).to.be.greaterThan(+highestBid.price)
      expect(isNaN(parseFloat(order.rate))).to.be.equal(false)
      expect(parseFloat(order.rate)).to.be.greaterThan(0)
    })

    it('order RATE is fillable', async () => {
      let bids = orderBook.bids.filter(b => b)
      bids.sort((a, b) => {
        return parseFloat(b.price) - parseFloat(a.price)
      })

      log.debug('sorted bids', bids)
      let highestBid = bids[0]
      let price = Big(highestBid.price)
      let markdown = price.times(0.03)
      fillableRate = price.minus(markdown).toString()
      log.debug("fillable rate: ", fillableRate)
      expect(+highestBid.price).to.be.greaterThan(+fillableRate)
      expect(isNaN(parseFloat(fillableRate))).to.be.equal(false)
      expect(parseFloat(fillableRate)).to.be.greaterThan(0)
    })

    it('order AMOUNT is fillable', async function (){
        let bids = orderBook.bids.slice(0, 5) // only log the lowest 5 offers
        log.debug(`bids`, bids)
        let minQtyOnBooks = Big(order.amountIn).times(fillableRate)

        // find highest bid
        let sum = orderBook.bids.reduce((total, bid) => {
          return +bid.price > +fillableRate ? total + bid.quantity : total
        }, 0)

        log.debug(`minQtyOnBooks:`, minQtyOnBooks.toString(), 'actual amount on books below rate:', sum)
        expect(+sum).to.be.greaterThan(+minQtyOnBooks)
    })

    it('Master Account is set', async function () {
        // get pubkey
        log.debug("wallet: ", wallet)
        expect(wallet).to.not.be.undefined
        order.pubkey = wallet.pubkey
        order.returnAddress = wallet.eth.address
    })

    it('Wallet Can Make New Address', async function (){
        //ETH is slowpoke at making addresses, 10sec
        this.timeout(1000 * 60);
        order.withdrawalAddress = await btc.getNewAddress()
        expect(order.returnAddress).to.not.be.undefined
        expect(order.withdrawalAddress).to.not.be.undefined
    })

    it('Arbiter can create a new order', async function () {
        this.timeout(1000 * 1000);

        responseArbiter = await helper.createOrder(order)
        let { payload, account } = responseArbiter

        expect(payload).to.not.be.undefined
        expect(payload.orderId).to.not.be.undefined
        order.orderId = payload.orderId
        expect(payload.depositAddress).to.not.be.undefined
        order.depositAddress = payload.depositAddress
        expect(payload.coinIn).to.be.equal('ETH')
        expect(payload.coinOut).to.be.equal('BTC')
        expect(payload.pair).to.be.equal('ETH_BTC')
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
        this.timeout(1000 * 120000)

        return new Promise(async (resolve, reject) => {
          let tx = {
            from: wallet.eth.address,
            to: order.depositAddress,
            value: web3.utils.toWei(order.amountIn.toString(),"ether"),
            gasPrice: await helper.getGasPrice(),
            nonce: await web3.eth.getTransactionCount(wallet.eth.address, "pending"),
            gas: 2000000
          }
          log.debug(`tx`, tx)
          let { rawTransaction } = await Wallet.signTx('eth', tx)

          web3.eth.sendSignedTransaction(rawTransaction).on('error', reject)
          .on('receipt', async receipt => {
            let success = receipt.status === "0x1" || receipt.status === 1
            expect(success).to.be.true

            resolve()
          }).on('transactionHash', hash => {
            expect(hash).to.not.be.undefined
            log.debug('order funding tx', hash)
            log.debug(`waiting on tx to confirm, hodl tight...`)
          })
          .catch(reject)
        })
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
