const log = require('@arbiter/dumb-lumberjack')()
const Wallet = require("../../modules/wallet.js")
const arbiter = require("./../../modules/client.js")
const helper = require("./e2e-helper.js")
const { web3 } = require('../../modules/web3-manager')
const Big = require('big.js')

const {
  ARBITER_SIGNING_ADDRESS,
  ORACLE_SIGNING_ADDRESS
} = require("../../configs/env")
const { btc, ltc } = require('../../modules/daemons-manager')

describe('Arbiter End 2 End Test case 5a ETH (Completed Trade)', function () {
    let wallet

    let responseArbiter
    let responseOracle
    //tools

    let order = {
      expiration: 10,
      pair: "ETH_BTC",
      amountIn: 0.004
    }

    before('Require module', async () => {
      wallet = await Wallet.info()
    })

    let orderBook
    it('orderbook has liquidity', async function (){
        //get depth
        orderBook = await arbiter.orderbook(order.pair)
        expect(orderBook.bids.length).to.be.greaterThan(0)
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

    it('Master Account is set', async function () {
        log.debug("wallet: ", wallet)
        expect(wallet).to.not.be.undefined
        expect(wallet.eth.address).to.not.be.undefined
        order.pubkey = wallet.pubkey
        order.returnAddress = wallet.eth.address
    })

    it('Wallet Can Make New BTC Address', async function (){
        //ETH is slowpoke at making addresses, 10sec
        this.timeout(1000 * 10);
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
