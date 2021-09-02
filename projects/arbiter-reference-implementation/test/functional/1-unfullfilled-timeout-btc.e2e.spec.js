/**
 * Created by highlander on 12/28/16.
 */

//Globals
const log = require('@arbiter/dumb-lumberjack')()
const helper = require("./e2e-helper.js")
const wallet = require('../../modules/wallet')


//~normal rate
// 1LTC = 0.0175 BTC
// 1BTC = 56.14 LTC

//This is an unfillable rate for this test
let rate = 0.001
//let amountIn = .004
let amountIn = .001
let accountMaster

//Flags
const orderId = false

//modules
const arbiter = require("./../../modules/client.js")
const account = require("../../modules/wallet.js")
const { ARBITER_SIGNING_ADDRESS, ORACLE_SIGNING_ADDRESS } = require("../../configs/env")
const { btc, ltc } = require('../../modules/daemons-manager')


describe('Arbiter End 2 End Test case 1 BTC (unfulfilled + timeout)', function ()
{
    before('Require module', function ()
    {
        expect(arbiter).to.be.an('object')
    })
    //let amountOut = amountIn * rate
    //log.debug("**** amountOut: ",amountOut)

    /**
     * E2E test scope
     *
     * Objects:
     *    Account:
     *          example
     *    Order:
     */


    //pair
    let pair = "BTC_LTC"
    //expiration in minutes
    let expiration = 0.05
    //~normal rate
    // 1LTC = 0.0175 BTC
    // 1BTC = 56.14 LTC

    //expected amount out
    //let amountOut = amountIn * rate
    //log.debug("**** amountOut: ",amountOut)


    //order
    let order = {
        expiration,
        pair:pair,
        amountIn:amountIn,
        rate:rate
    }

    let responseArbiter
    let responseOracle

    //tools
    it('Arbiter is online', async function (){
        //get coins
        let coins = await arbiter.coins()
        log.debug("coins: ",coins)
        expect(coins).to.not.be.undefined
    })

    it('Arbiter Has markets', async function (){
        let markets = await arbiter.markets()
        log.debug("markets: ", markets)
        // expect(markets).to.not.be.undefined

    })

    it('Master Account is set', async function (){
        this.timeout(1000 * 60 * 10);

        // get pubkey
        accountMaster = await account.info()
        expect(accountMaster.pubkey).to.not.be.undefined

        //get account
        try {
          let accountInfo = await arbiter.getAccount()
          log.debug("accountInfo: ",accountInfo)
        } catch (ex) {
          console.log(`no account found, signing up!`)

          let signUpResult = await arbiter.signUp()
          log.debug("signUpResult: ",signUpResult)

          //expect to have an account
          expect(signUpResult.payload.account).to.not.be.undefined
        }
    })

    it('Wallet Can Make New Address', async function (){
        //ETH is slowpoke at making addresses, 10sec
        this.timeout(1000 * 10);
        order.returnAddress = await(btc.getNewAddress())
        order.withdrawalAddress = await(ltc.getNewAddress())
        expect(order.returnAddress).to.not.be.undefined
        expect(order.withdrawalAddress).to.not.be.undefined

        log.debug("order: ",order)
    })

    it('Arbiter can create a new order', async function (){
        this.timeout(1000 * 60 * 40);

        const accountMaster = await(account.info())

        //Make Request!
        order.pubkey = accountMaster.pubkey
        responseArbiter = await arbiter.orderCreate(order)
        let payload = responseArbiter.payload
        log.debug("responseArbiter.payload: ", responseArbiter.payload)
        //expect(output.success).to.be.equal(true)
        //let response = output.data

        expect(payload).to.not.be.undefined
        //expect(payload.pubkey).to.not.be.undefined
        //new
        //expect(payload.orderId).to.not.be.undefined
        order.orderId = payload.orderId
        //expect(payload.depositAddress).to.not.be.undefined
        order.depositAddress = payload.depositAddress
        // expect(payload.maxDeposit).to.not.be.undefined
        // expect(payload.minDeposit).to.not.be.undefined
        //
        // //confirmation
        // expect(payload.account).to.be.equal(accountMaster.account)
        // //TODO ambiguous refund/return
        // expect(payload.refundAddress).to.be.equal(order.returnAddress)
        // expect(payload.withdrawalAddress).to.be.equal(order.withdrawalAddress)
        // expect(payload.amountIn).to.be.equal(amountIn)
        // expect(payload.pair).to.be.equal(pair)
        //
        // //
        // expect(payload.coinIn).to.not.be.undefined
        // expect(payload.coinOut).to.not.be.undefined
        // expect(payload.amountOut).to.not.be.undefined
    })

    it('Signatures are valid', async function () {
        responseOracle = await arbiter.statusOracle(order.orderId)

        log.debug("responseOracle: ",responseOracle)
        log.debug("responseArbiter: ",responseArbiter)

        //valid sig arbiter
        let arbiterPubkey = ARBITER_SIGNING_ADDRESS

        expect(arbiterPubkey).to.not.be.undefined
        expect(responseArbiter.payload).to.not.be.undefined
        expect(responseArbiter.signature).to.not.be.undefined

        let validateRespArbiter = await wallet.verifyMessage(
          arbiterPubkey,
          responseArbiter.signature,
          JSON.stringify(responseArbiter.payload)
        )

        //validate sig oracle
        let oraclePubkey = ORACLE_SIGNING_ADDRESS
        expect(oraclePubkey).to.not.be.undefined
        expect(responseOracle.signature).to.not.be.undefined
        expect(responseOracle.payload).to.not.be.undefined
        let validateRespOracle = await wallet.verifyMessage(oraclePubkey, responseOracle.signature, JSON.stringify(responseOracle.payload))

        //validate params
        log.debug("responseOracle: ",validateRespOracle)
        log.debug("validateRespArbiter: ",validateRespArbiter)

        expect(validateRespArbiter).to.be.equal(true)
        expect(validateRespOracle).to.be.equal(true)

    })


    it('Wallet can fund the order', async function (){
        //
        let txid = await btc.sendToAddress(order.depositAddress, amountIn)
        log.debug("funding txid: ", txid)
        order.txidFunding = txid
        //TODO handle errors
        expect(txid).to.not.be.undefined
    })

    //TODO handle instant complete*
    it('Arbiter Detects payment', async function (){
        //change timeout ONLY for long test!
        //should find payment in less then 4 minutes
        this.timeout(1000 * 60 * 10);
        let status = await helper.detectPayment(order.orderId)

        expect(status).to.be.equal("live")
    })

    //shows in orderbook
    it('Arbiter shows live order in orderbook', async function (){
        this.timeout(1000 * 10);

        let orderbook = await arbiter.orderbook(pair)

        //This assumes empty order book!
        //console.log(orderbook)
        expect(orderbook).to.not.be.undefined

        //order should be in correct price tier of bids


        // find order
        // let allBidIds = []
        // for (let i = 0; i < orderbook.bids.length; i++) {
        //     let tier = orderbook.bids[i]
        //     for (let j = 0; j < tier.orders.length; j++) {
        //         allBidIds.push(tier.orders[j].id)
        //     }
        // }
        // log.debug("allBidIds: ",allBidIds)
        // let isInBook = allBidIds.indexOf(order.orderId)
        // log.debug("isInBook: ",isInBook)
        // expect(isInBook).to.be.greaterThan(-1)



        // TODO
        // expect(orderbook.bids[0].orders[0].id).to.be.equal(order.orderId)
        // expect(orderbook.bids[0].orders[0].price).to.be.equal(order.amountIn)
        // expect(orderbook.bids[0].orders[0].quantity).to.be.equal(order.orderId)
    })

    it('Arbiter Cancels at end of expirationInMinutes', async function (){
        //change timeout ONLY for long test!  should find payment in less then 6 minutes
        this.timeout(1000 * 60 * 6);

        let status = await helper.detectCancel(order.orderId)
        log.debug("status: ",status)
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
