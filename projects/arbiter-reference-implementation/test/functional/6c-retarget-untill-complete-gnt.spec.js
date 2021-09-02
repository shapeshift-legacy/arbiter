const log = require('@arbiter/dumb-lumberjack')()
const wallet = require('../../modules/wallet')
const when = require('when')
const arbiter = require("./../../modules/client.js")
const account = require("../../modules/wallet.js")

const {
    ARBITER_SIGNING_ADDRESS,
    ORACLE_SIGNING_ADDRESS
} = require("../../configs/env")
const { btc, ltc, gnt } = require('../../modules/daemons-manager')

describe.skip('Arbiter End 2 End Test case 6c GNT (Retarget to Completed Trade)', function ()
{
    before('Require module', function ()
    {
        //rewire redis
        // arbiter.__set__('redis', redis)

        //turn on debug
        // arbiter.__set__('debug', true)
        // gnt.__set__('debug', true)
        // btc.__set__('debug', true)

        let  fakeConsole = {}
        fakeConsole.error = function(err){}
        fakeConsole.log = function(err){}
        //arbiter.__set__('console', fakeConsole)
        // gnt.__set__('console', fakeConsole)
        // btc.__set__('console', fakeConsole)


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
    let expiration = .6
    let rateUnfillable = 1.00005089
    let rateFillable = 0.00002087
    let rate = 0.00005089
    let amountIn = 10

    //order
    let order = {
        //Min experation (10min)
        expiration:expiration,
        pair:pair,
        amountIn:amountIn,
        //Unfillable rate
        //jlay
        rate:rateUnfillable,
        //rate:1000,
    }
    let responseArbiter
    let responseOracle
    //tools
    var pause = function(length){
        var d = when.defer();
        var done = function(){d.resolve(true)}
        setTimeout(done,length*1000)
        return d.promise
    }

    it('Arbiter is online', async function (){
        //get coins
        //let coins = await(arbiter.coins())
        //expect(coins).to.not.be.undefined
    })

    it('Arbiter Has coins', async function (){
        //get depth
        let coins = await arbiter.coins()
        log.debug("coins: ",coins)
        expect(coins.indexOf('GNT')).to.be.greaterThan(-1)

    })

    it('Master Account is set', async function (){
        this.timeout(1000 * 60 * 10);

        const accountMaster = await(account.info())
        expect(accountMaster).to.not.be.undefined
        order.pubkey = accountMaster.pubkey
        // order.signingPub = accountMaster.signingPub
        // order.signingPriv = accountMaster.signingPriv

        //get account
        let accountInfo = await arbiter.getAccount()
        log.debug("accountInfo: ",accountInfo)

        //if no GNT
        if(accountInfo.error){
            console.log("account not found! signing up!")
            //signup
            let sugnupSuccess = await arbiter.signUp()
            log.debug("sugnupSuccess: ",sugnupSuccess)
            accountInfo = sugnupSuccess
        }
        //expect to have an account
        expect(accountInfo.payload.contractAddress).to.not.be.undefined

    })

    it('Arbiter Has markets', async function (){
        //get depth
        let markets = await arbiter.markets()
        log.debug("markets: ",markets)
        //expect(coins.indexOf('gnt')).to.be.greaterThan(-1)

    })

    let orderBook
    it('Arbiter Has live orderbooks', async function (){
        //get depth
        orderBook = await arbiter.orderbook("BTC_GNT")
        log.debug("orderbook: ",orderBook)
        expect(orderBook.offers.length).to.be.greaterThan(0)
        //rate should match

        //

    })

    it('order rate is fillable', async function (){
        //find lowest offer
        let lowestOffer = orderBook.offers[0]
        log.debug("lowestOffer: ",lowestOffer)
        log.debug("order rate: ",rate)
        //expect(lowestOffer.price).to.be.greaterThan(rate)
        //rate should match

    })

    it('Master Account is set', async function (){
        const accountMaster = await(account.info())
        expect(accountMaster).to.not.be.undefined
        order.pubkey = accountMaster.pubkey
        order.signingPub = accountMaster.signingPub
        order.signingPriv = accountMaster.signingPriv
    })

    it('Wallet Can Make New Address', async function (){
        //GNT is slowpoke at making addresses, 10sec
        this.timeout(1000 * 60);
        order.returnAddress = await(gnt.getNewAddress())
        order.withdrawalAddress = await(btc.getNewAddress())
        expect(order.returnAddress).to.not.be.undefined
        expect(order.withdrawalAddress).to.not.be.undefined
    })

    it('Arbiter can create a new order', async function (){
        this.timeout(1000 * 1000);
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
        this.timeout(1000 * 10);
        //
        let txid = await(gnt.sendToAddress(order.depositAddress,amountIn))
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
        let status = null
        while(status != "live"){
            //log.debug("checkpoint1")
            //send txid (redundant)
            //TODO broke
            //let found = await(arbiter.txid(order.txidFunding))
            // log.debug("found:",found)
            //query status
            let orderInfo = await(arbiter.status(order.orderId))
            log.debug("orderInfo: ",orderInfo)
            status = orderInfo.status
            log.debug("status: ",status)
            //limit requests
            await(pause(3))
        }
        expect(status).to.be.equal("live")
    })

    //retargets to fillable rate
    it('Order retargets to fillable rate', async function (){
        this.timeout(1000 * 10);

        let retargetResp = await(arbiter.retarget(order.orderId,rateFillable))
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

    //shows in orderbook
    it('Arbiter shows live order in orderbook', async function (){
        this.timeout(1000 * 10);
        let orderbook = await(arbiter.orderbook(pair))

        //This assumes empty order book!
        //log.debug(orderbook)
        expect(orderbook).to.not.be.undefined
        //order should be in correct price tier of bids

        // TODO
        // expect(orderbook.bids[0].orders[0].id).to.be.equal(order.orderId)
        // expect(orderbook.bids[0].orders[0].price).to.be.equal(order.amountIn)
        // expect(orderbook.bids[0].orders[0].quantity).to.be.equal(order.orderId)
    })

    it('completes transaction', async function (){
        //change timeout ONLY for long test!
        //should find payment in less then 6 minutes
        this.timeout(1000 * 60 * 6);
        //for loop polling?
        let status = null
        let returnTx = null
        while(status != "complete"){
            log.debug("checkpoint1")
            //query status
            let orderInfo = await(arbiter.status(order.orderId))
            //expect(orderInfo.success).to.be.equal(true)
            log.debug("orderInfo: ",orderInfo)

            // var timeLeft = orderInfo.response.expiration - new Date().getTime()
            // log.debug("timeLeft:(seconds) ", timeLeft/1000)

            status = orderInfo.status
            //returnTx = orderInfo.response.txidReturn
            log.debug("status: ",status)

            //limit requests
            await(pause(1))
        }
        expect(status).to.be.equal("complete")
    })

    //TODO validate sweep

    it('Arbiter Gives a valid fullment TXID', async function (){
        //change timeout ONLY for long test!
        //should find payment in less then 6 minutes
        this.timeout(1000 * 60 * 6);
        //for loop polling?
        let status = null
        let txidOut = null
        while(!txidOut){
            log.debug("checkpoint2")
            //query status
            let orderInfo = await(arbiter.status(order.orderId))
            //expect(orderInfo.success).to.be.equal(true)

            var timeLeft = orderInfo.expiration - new Date().getTime()
            log.debug("timeLeft:(seconds) ", timeLeft/1000)

            if(orderInfo.txidOut && orderInfo.txidOut.length > 10) txidOut = orderInfo.txidOut
            log.debug("txidOut: ",txidOut)

            //limit requests
            await(pause(1))
        }
        expect(txidOut).to.not.be.undefined

        //TODO check block explorer that tx is valid
        //fee level check


        //TODO fullment amount is correct
    })

    it('Arbiter Gives a valid sweep TXID', async function (){
        //change timeout ONLY for long test!
        //should find payment in less then 6 minutes
        this.timeout(1000 * 60 * 6);
        //for loop polling?
        let status = null
        let sweepTx = null
        while(!sweepTx){
            log.debug("checkpoint3")
            //query status
            let orderInfo = await(arbiter.status(order.orderId))
            //expect(orderInfo.success).to.be.equal(true)

            var timeLeft = orderInfo.expiration - new Date().getTime()
            log.debug("timeLeft:(seconds) ", timeLeft/1000)

            if(orderInfo.sweepTx && orderInfo.sweepTx.length > 10) sweepTx = orderInfo.sweepTx
            log.debug("sweepTx: ",sweepTx)

            //limit requests
            await(pause(1))
        }
        expect(sweepTx).to.not.be.undefined

        //TODO check block explorer that tx is valid
        //fee level check


        //TODO sweep amount is correct
    })
})
