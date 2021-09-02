const arbiter = require("./../../modules/client.js")
const Wallet = require("../../modules/wallet.js")
const { web3 } = require('../../modules/web3-manager')
const helper = require("./e2e-helper.js")
const { ARBITER_SIGNING_ADDRESS, ORACLE_SIGNING_ADDRESS } = require("../../configs/env")
const log = require('@arbiter/dumb-lumberjack')()

describe('Arbiter End 2 End Test case 1a ETH (unfulfilled + timeout)', function () {
    let wallet

    before('Require module', async () => {
      wallet = await Wallet.info()
    })

    /**
     * E2E test scope
     *
     * Objects:
     *    Account:
     *          example
     *    Order:
     */

    //pair
    let pair = "ETH_BTC"
    //expiration in minutes
    //TODO time different by env
    //mainnet sloooowwwww
    let expiration = 0.75
    //~normal rate
    // 1ETH = 0.0175 BTC
    // 1BTC = 56.14 ETH
    let rate = 1.150
    let amountIn = 0.003

    //order
    let order = {
        //Min experation (10min)
        expiration: expiration,
        pair: pair,
        amountIn: amountIn,
        //Unfillable rate
        //jlay
        rate: rate,
        //rate:1000,
    }

    let responseArbiter
    let responseOracle

    //tools
    it('Arbiter is online', async function () {
        let coins = helper.checkCoins()
        expect(coins).to.not.be.undefined
    })

    it('Arbiter Has markets', function () {

    })

    it('Master Account is set', async function () {
        log.debug("wallet: ", wallet)
        expect(wallet).to.not.be.undefined
        expect(wallet.eth.address).to.not.be.undefined
        order.pubkey = wallet.pubkey
        order.returnAddress = wallet.eth.address
    })

    it('Wallet Can Make New BTC Address', async function () {
        //ETH is slowpoke at making addresses, 10sec
        this.timeout(1000 * 10000);
        order.withdrawalAddress = await helper.getNewAddress('btc')

        log.debug(' order', order)
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
        expect(payload.coinIn).to.be.equal('ETH')
        expect(payload.coinOut).to.be.equal('BTC')
        expect(payload.pair).to.be.equal('ETH_BTC')
        expect(account).to.not.be.undefined
        //TODO ambiguous refund/return
        expect(payload.returnAddress).to.be.equal(order.returnAddress)
        expect(payload.withdrawalAddress).to.be.equal(order.withdrawalAddress)
    })

    it('Signatures are valid', async function () {
        this.timeout(1000 * 1000);

        //get order info from oracle
        responseOracle = await helper.getStatusFromOracle(order.orderId)

        // //valid sig arbiter
        let arbiterPubkey = ARBITER_SIGNING_ADDRESS
        expect(arbiterPubkey).to.not.be.undefined
        expect(responseArbiter.signature).to.not.be.undefined
        expect(responseArbiter.payload).to.not.be.undefined

        let validateRespArbiter = await helper.validateSignature("btc", arbiterPubkey, responseArbiter.signature, JSON.stringify(responseArbiter.payload))

        //validate sig oracle
        let oraclePubkey = ORACLE_SIGNING_ADDRESS
        expect(oraclePubkey).to.not.be.undefined
        expect(responseOracle.signature).to.not.be.undefined
        expect(responseOracle.payload).to.not.be.undefined
        let validateRespOracle = await helper.validateSignature("btc", oraclePubkey, responseOracle.signature, JSON.stringify(responseOracle.payload))

        expect(validateRespArbiter).to.be.equal(true)
        expect(validateRespOracle).to.be.equal(true)
    })

    it('Wallet can fund the order', async function (){
        this.timeout(1000 * 120000)

        return new Promise(async (resolve, reject) => {
          let tx = {
            from: wallet.eth.address,
            to: order.depositAddress,
            value: web3.utils.toWei(amountIn.toString(),"ether"),
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

    it('Arbiter Detects payment', async function () {
        //change timeout ONLY for long test!
        //should find payment in less then 4 minutes
        this.timeout(1000 * 60 * 20);
        //for loop polling?
        let status = await helper.detectPayment(order.orderId)

        expect(status).to.be.equal("live")
    })

    //shows in orderbook
    it('Arbiter shows live order in orderbook', async function () {
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

    it('Arbiter Cancels at end of expiration', async function () {
        //change timeout ONLY for long test!
        //should find payment in less then 6 minutes
        this.timeout(1000 * 60 * 10);
        //for loop polling?
        let status = await helper.detectCancel(order.orderId)

        expect(status).to.be.equal("cancelled")
    })

    it('Arbiter Gives a valid return TXID', async function () {
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
