/**
 * Created by highlander on 12/28/16.
 */

//Globals
const log = require('@arbiter/dumb-lumberjack')()
const helper = require("./e2e-helper.js")

//modules
const client = require("./../../modules/client.js")
const Wallet = require("../../modules/wallet.js")
const WalletFactory = require("../../modules/wallet-factory.js")
const { web3 } = require('../../modules/web3-manager')
const { TEST_NET } = require('../../configs/env')
const fs = require('fs')
const path = require('path')
const LoggerContract = JSON.parse(fs.readFileSync(path.join(__dirname, '../../build/contracts/Logger.json'), 'utf-8'))
const WalletFactoryContract = JSON.parse(fs.readFileSync(path.join(__dirname, '../../build/contracts/WalletFactory.json'), 'utf-8'))
const pause = require('../../modules/pause')


describe('0 - Pre tests. Setup + account settings + LA funding', function () {
    let wallet, account, ethWalletFactoryAddress, logger, walletFactory, ethWalletAddress

    before('Require module', async () => {
        wallet = await Wallet.info()

        try {
          let res = await client.getAccount()
          account = res.payload
        } catch (ex) {
          log.error(`Account not found, signing up: `, ex)

          let res = await client.signUp()
          account = res.payload
        }
    }, 5000)

    /**
     * E2E test scope
     *
     * Objects:
     *    Account:
     *          example
     *    Order:
     */

     it('has a live account', () => {
       expect(account.account).to.not.be.undefined
     })

    //tools
    it('client config is set', async function () {
        expect(wallet.address).to.not.be.undefined
        expect(wallet.addresses).to.not.be.undefined
        expect(wallet.addresses.btc).to.not.be.undefined
        expect(wallet.addresses.ltc).to.not.be.undefined
        expect(wallet.eth).to.not.be.undefined
    })

    it('can get a wallet factory address', async function (){
      let res = await client.ethWalletFactoryAddress()
      ethWalletFactoryAddress = res.payload.ethWalletFactoryAddress

      console.log(`wfAddr`, ethWalletFactoryAddress)
      expect(/^0x/.test(ethWalletFactoryAddress)).to.be.true
    })

    it('can read smart contract data from the wallet factory', async function() {
      walletFactory = new web3.eth.Contract(WalletFactoryContract.abi, ethWalletFactoryAddress)
      let loggerAddress = await walletFactory.methods.logger().call()
      logger = new web3.eth.Contract(LoggerContract.abi, loggerAddress)
      expect(/^0x/.test(loggerAddress)).to.be.true
      expect(logger.methods.loggers).to.not.be.undefined
    })

    it('has eth balance to create the wallet factory', async () => {
      log.debug(`checking balance for ${wallet.eth.address}`)
      let balance = await web3.eth.getBalance(wallet.eth.address)
      log.debug(`balance`, balance)
      expect(parseInt(balance, 10)).to.be.gt(0)
    })

    it('can create an account with a random wallet', async () => {
      let network = TEST_NET ? 'bitcoin-test' : 'bitcoin'
      let rando = WalletFactory.generate(network)

      let acct = await client.signUp(rando.signingPub, undefined, rando.signingPriv)

      expect(acct.account).to.not.be.undefined
      expect(acct.payload.account).to.not.be.undefined
      expect(acct.signature).to.not.be.undefined
    })

    it('can create an eth wallet via the wallet factory address', async function() {
      this.timeout(1000 * 120)

      let rcpt = await new Promise(async (resolve, reject) => {
        let tx = {
          from: wallet.eth.address,
          to: ethWalletFactoryAddress,
          value: "0x0",
          gasPrice: await helper.getGasPrice(),
          nonce: await web3.eth.getTransactionCount(wallet.eth.address, "pending"),
          gas: 2000000
        }
        log.debug(`tx`, tx)
        let { rawTransaction } = await Wallet.signTx('eth', tx)

        log.debug(`rawTransaction`, rawTransaction)

        web3.eth.sendSignedTransaction(rawTransaction).on('error', reject)
        .on('receipt', async receipt => {
          let events = await logger.getPastEvents('WalletCreated', {
            fromBlock: receipt.blockNumber,
            toBlock: receipt.blockNumber
          })

          log.debug(`events`, events)

          let vals = events[0].returnValues
          ethWalletAddress = vals.wallet
          let { signers, forwarders } = vals

          log.debug('new wallet', ethWalletAddress, signers, forwarders)

          expect(/^0x/.test(ethWalletAddress)).to.be.true
          expect(/^0x/.test(signers[2])).to.be.true
          expect(/^0x/.test(forwarders[4])).to.be.true
          expect(forwarders.length).to.equal(5)
          expect(signers.length).to.equal(3)

          let success = receipt.status === "0x1" || receipt.status === 1
          expect(success).to.be.true

          resolve()
        }).on('transactionHash', hash => {
          log.debug('0-eth wallet creation tx', hash)
          log.debug(`waiting on tx to confirm, hodl tight...`)
        })
        .catch(reject)
      })
    })

    it('can update the wallet address on an eth account', async () => {
      this.timeout(1000 * 5)

      let err, update
      do {
        err = undefined
        try {
          update = await client.updateAccount(wallet.eth.address, ethWalletAddress)
        } catch (ex) {
          log.warn(`update failed with `, ex)
          err = ex

          if ( err.includes("could not validate wallet") ) {
            await pause(1)
          }
        }
        // try again if it can't validate wallet
      } while (err && err.includes("could not validate wallet"))

      log.debug(`update`, update)
      expect(update).to.not.be.undefined
    })


    it.skip('Liquidity agent account is set', async function (){
        //get coins

    })

    it.skip('Liquidity agent account has funds', async function (){
        //get coins

    })

    it.skip('Liquidity agent account is placing orders', async function (){
        //get coins

    })
})
