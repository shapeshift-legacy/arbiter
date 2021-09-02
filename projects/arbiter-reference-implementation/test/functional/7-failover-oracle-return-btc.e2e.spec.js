const wallet = require('../../modules/wallet')
const TAG = " | failover | "
const proxyquire = require('proxyquire')
const rewire = require('rewire')
const moment = require('moment')
const when = require('when')
const log = require('@arbiter/dumb-lumberjack')()
//globals

//Flags
//const websocket = true
const ethTest = false
const btcTest = true
const testNetBtc = false
const testNetEth = false
const forceSocket = false
const forceREST = false
const noSend = false
const verbose = true
const orderId = false

//pm2 kill stuffs
const exec = require('child_process').exec;

//pm2 kill arbiter api
let execute = function(command){
    let d = when.defer();
    let tag = TAG+" | execute | "
    exec(command, function(error, stdout, stderr) {
        if(error) console.error(tag,"stderr: ",stderr)
        if(error) console.error(tag,"error: ",error)
        if(error) throw Error("101: Failed to execute!")
        log.debug(stdout)
        d.resolve(stdout)
    })

    return d.promise;
}



//modules
let arbiter = rewire("./../../modules/client.js")
const pause = rewire("./../../modules/pause.js")
const account = require("../../modules/wallet.js")
const { ARBITER_SIGNING_ADDRESS, ORACLE_SIGNING_ADDRESS } = require("../../configs/env")
const { btc, ltc, eth } = require('../../modules/daemons-manager')
const helper = require('./e2e-helper')


describe.skip('Arbiter End 2 End Test case 7 BTC (unfulfilled + arbiter fail +  cancel request to oracle)', function ()
{
    before('Require module', function ()
    {
        //rewire redis
        //arbiter.__set__('redis', redis)

        //turn on debug
        //arbiter.__set__('debug', true)
        // ltc.__set__('debug', true)
        // btc.__set__('debug', true)

        let  fakeConsole = {}
        fakeConsole.error = function(err){}
        fakeConsole.log = function(err){}

        // let  logFake = {}
        // logFake.error = function(err){}
        // logFake.log = function(err){}
        // arbiter.__set__('log', logFake)
        //arbiter.__set__('console', fakeConsole)
        // ltc.__set__('console', fakeConsole)
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
    let pair = "BTC_LTC"
    //expiration in minutes
    let expiration = 2
    let rate = 0.007
    let amountIn = .001

    //expected amount out
    let amountOut = amountIn * rate
    log.debug("**** amountOut: ",amountOut)

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
        //execute("pm2 start arb-api")

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
        this.timeout(1000 * 30);
        order.returnAddress = await(btc.getNewAddress())
        order.withdrawalAddress = await(ltc.getNewAddress())
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
        log.debug("orderId: ",order.orderId)
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
        //
        let txid = await(btc.sendToAddress(order.depositAddress,amountIn))
        log.debug("txid: ",txid)
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

    //arbiter fails
    it('arbiter get hacked', async function (){
        //change timeout ONLY for long test!
        //should find payment in less then 6 minutes
        this.timeout(1000 * 60 * 6);


        await execute("pm2 stop arb-api")

        //pause?
        await pause(1)

        //expect(status).to.be.equal("cancelled")
    })

    it('arbiter fails to cancel order', async function (){
        //change timeout ONLY for long test!
        //should find payment in less then 6 minutes
        this.timeout(1000 * 60 * 6);

        //TODO expect ip of error? for staging/prod?
        return expect(arbiter.cancel(order.orderId))
            .to.eventually.be.rejectedWith("connect ECONNREFUSED 127.0.0.1:3000")

    })


    let returnTx
    it('Oracle Cancels at request and gives partially signed tx', async function (){
        //change timeout ONLY for long test!
        //should find payment in less then 6 minutes
        this.timeout(1000 * 60 * 6);

        let responseOracle = await arbiter.cancelOracle(order.orderId)
        log.debug("responseOracle: ",responseOracle)
        returnTx = responseOracle.payload.tx

        //TODO expect signatures to be valid

        expect(returnTx).to.not.be.undefined
    })



    //customer signs tx
    let completeTx
    it('Customer signs TX', async function (){
        //change timeout ONLY for long test!
        //should find payment in less then 6 minutes
        this.timeout(1000 * 60 * 6);
        //for loop polling?
        // let signedTx = await btc.signRawTransactionWithWallet(returnTx)
        let signedTx = await btc.signRawTransaction(returnTx)
        log.debug("signedTx: ",signedTx)

        //expect complete = true

        expect(signedTx.hex).to.not.be.undefined
        expect(signedTx.complete).to.be.equal(true)
        completeTx = signedTx.hex
        //TODO check block explorer that tx is valid
        //fee level check
    })

    //oracle broadcasts tx
    it('Oracle broadcasts TX', async function (){
        this.timeout(1000 * 60 * 6);

        let broadcast = await arbiter.broadCastOracle("BTC",completeTx)
        log.debug("broadcast: ",broadcast)

        //TODO check block explorer that tx is valid
        //fee level check
        let finalTXID = broadcast.payload
        log.debug("final TXID: ",finalTXID)
        expect(broadcast.payload).to.not.be.undefined
    })

    //start api back up
    it('Start arbiter back up', async function (){
        //
        await execute("pm2 start arb-api")
        await pause(1)

    })

    //arbiter recognised the cancel happened

})
