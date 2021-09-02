const log = require('@arbiter/dumb-lumberjack')()
const wallet = require('../../modules/wallet')
const arbiter = require("./../../modules/client.js")
const account = require("../../modules/wallet.js")
const Big = require('big.js')
const helper = require("./e2e-helper.js")

const {
  ARBITER_SIGNING_ADDRESS,
  ORACLE_SIGNING_ADDRESS
} = require("../../configs/env")
const { btc, ltc } = require('../../modules/daemons-manager')

describe('Arbiter End 2 End Test case 5 BTC (Completed Trade)', function ()
{
    before('Require module', function ()
    {
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
    let order = {
      expiration: 200,
      pair: "BTC_LTC",
      amountIn: 0.001
    }

    let responseArbiter
    let responseOracle
    //tools

    it('Arbiter is online', async function (){
        //get coins
        //let coins = await(arbiter.coins())
        //expect(coins).to.not.be.undefined
    })

    let orderBook
    it('Arbiter Has markets', async function (){
        this.timeout(1000 * 60 * 10);
        orderBook = await arbiter.orderbook("BTC_LTC")
        // log.debug(`orderBook`, orderBook)
        expect(orderBook.offers.length).to.be.greaterThan(0)
    })

    it('order RATE is fillable', async function (){
        //find lowest offer
        let lowestOffer = orderBook.offers[0]
        log.debug("lowestOffer: ",lowestOffer)
        // make the price 3% higher than lowestOffer
        let price = Big(lowestOffer.price)
        let markup = price.times(0.03)
        order.rate = price.plus(markup).toString()
        log.debug("order rate: ", order.rate)
        expect(+lowestOffer.price).to.be.lessThan(+order.rate)
    })

    it('order AMOUNT is fillable', async function (){
        let offers = orderBook.offers.slice(0, 5) // only log the lowest 5 offers
        log.debug(`offers`, offers)
        let minQtyOnBooks = Big(order.amountIn).div(order.rate)

        // find lowest offer
        let sum = orderBook.offers.reduce((total, offer) => {
          return +offer.price < +order.rate ? total + offer.quantity : total
        }, 0)

        log.debug(`minQtyOnBooks:`, minQtyOnBooks.toString(), 'actual amount on books below rate:', sum)
        expect(+sum).to.be.greaterThan(+minQtyOnBooks)
    })

    it('Master Account is set', async function (){
        this.timeout(1000 * 60 * 10);

        const accountMaster = await account.info()
        expect(accountMaster).to.not.be.undefined
        order.pubkey = accountMaster.pubkey
    })

    it('Wallet Can Make New Address', async function (){
        //ETH is slowpoke at making addresses, 10sec
        this.timeout(1000 * 60);
        order.returnAddress = await btc.getNewAddress()
        order.withdrawalAddress = await ltc.getNewAddress()
        expect(order.returnAddress).to.not.be.undefined
        expect(order.withdrawalAddress).to.not.be.undefined
    })

    //TODO USD in vr USD out (Logic bro)
    // it.skip('AmountOut is logical in USD', async function (){
    //
    // }))


    it('Arbiter can create a new order', async function (){
        this.timeout(1000 * 60 * 10);
        //Make Request!
        log.debug("order: ",order)
        responseArbiter = await(arbiter.orderCreate(order))
        let payload = responseArbiter.payload
        log.debug('responseArbiter', responseArbiter)
        log.debug("responseArbiter.payload: ",payload)
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
        this.timeout(1000 * 10);
        //
        let txid = await btc.sendToAddress(order.depositAddress,order.amountIn)
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

    let txidOut = null
    it('Arbiter Gives a valid fullment TXID', async function (){
        //change timeout ONLY for long test!
        this.timeout(1000 * 60 * 6);
        //for loop polling?
        const txidOut = await helper.detectFulfillment(order.orderId)

        expect(txidOut).to.not.be.undefined

        //TODO check block explorer that tx is valid
        //fee level check

    })


    //TODO
    it.skip('Fullfillment tx is amount expected! ', async function (){
        let txInfo = await ltc.getTransaction(txidOut)
        log.debug("txInfo: ",txInfo)


        //TODO fullment amount is correct
        //let amountOut = (amountOut * 100000000) / 100000000

        //expect()
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
