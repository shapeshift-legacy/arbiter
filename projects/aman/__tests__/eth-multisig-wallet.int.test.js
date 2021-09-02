
const EthereumMultiSigWallet = require('../modules/eth-multisig-wallet')
const config = require('../configs/env')
const {
  TEST_ACCOUNT,
  TEST_CONTRACT_ADDRESS
} = config
const { web3 } = require('../modules/web3-manager')
const util = require('ethereumjs-util');
const helpers = require('../modules/helpers')
const log = require('@arbiter/dumb-lumberjack')()
const pause = require('../modules/pause')
const { getMasterAddress, _waitForMinAccounts } = require('../modules/address-manager')
const deploy = require('../modules/deploy')
const Logger = require('../build/contracts/Logger.json')

const HASH = expect.stringMatching(/^0x.+/)

const ORACLE = {
  address: "0xC079C31032a3a6A04AF58025DC1967504F39c078",
  pk: "e0f98b2b946e363e7b836d2b219560152f70b747441eec73d4f43a3c9ec094d9"
}

describe('eth wallet', async () => {
  describe('instantiates the wallet', async () => {
    let wallet, sequenceId, accounts, masterAddress, forwarderAddress
    let withdrawalAmountInEth = '0.0001'

    beforeAll(async () => {
      accounts = await _waitForMinAccounts(2)

      // if mainnet, we need to use an address with eth
      masterAddress = await getMasterAddress()

      // deploy all the prerequisites
      let deployed = await deploy(ORACLE.address)
      let { walletFactory, logger } = deployed

      // create the wallet with a 0-eth transasction
      let fromBlock = await new Promise((resolve, reject) => {
        log.debug(`sending 0-eth tx`, masterAddress, walletFactory )
        web3.eth.sendTransaction({
          from: masterAddress,
          to: walletFactory,
          value: 0,
          gas: 2000000
        }).on('error', reject)
        .on('receipt', receipt => {
          // log.debug(`wallet creation receipt`, receipt)
          if ( !receipt.status === "0x1" || receipt.status === 1 ) {
            reject("wallet creation tx was unsuccessful!")
          } else {
            resolve(receipt.blockNumber)
          }
        }).on('transactionHash', hash => log.debug('0-eth hash', hash))
        .catch(reject)
      })

      let _logger = new web3.eth.Contract(Logger.abi, logger)
      let events = await _logger.getPastEvents('WalletCreated', { fromBlock })

      log.debug(`wallet created event`, events)

      wallet = new EthereumMultiSigWallet({
        atAddress: events[0].returnValues.wallet,
        gasAddress: masterAddress,
        loggerAddress: logger
      })
    }, 120000)

    test('can deploy a contract', async () => {
      expect(wallet.address).toEqual(expect.stringMatching(/^0x.+/))
      expect(wallet.getNextSequenceId).toBeDefined()
      expect(wallet.sendMultiSig).toBeDefined()
    })


    test('fails to create forwarder if wallet is not on chain', async () => {
      let badWallet = new EthereumMultiSigWallet({
        atAddress: "0xa0bad0bad0bad0bad0bad0bad000000000000add",
        gasAddress: masterAddress
      })

      let err = false

      try {
        await badWallet.createForwarder()
      } catch (ex) {
        log.debug(`fail ex`, ex)
        err = ex
      }

      expect(err.message).toEqual(expect.stringContaining("which is not on chain"))
    })

    test('can create a forwarding address', async () => {
      let found = false

      while ( !found ) {
        try {
          forwarderAddress = await wallet.createForwarder()
          found = true
        } catch (ex) {
          if ( ex.WALLET_CHECK_ERROR ) {
            log.info(`Attempt to create forwarder failed, assuming not on chain yet: `, ex)
            await pause(5)
          } else {
            found = true
            log.error(`Unexpected error creating forwarder`, ex)
          }
        }
      }

      expect(forwarderAddress).toEqual(HASH)
    }, 300000) // wait 5m

    test('can fetch sequenceId', async () => {
      sequenceId = await wallet.getNextSequenceId()

      expect(sequenceId).toEqual(1)
    })

    test('it can send funds', async () => {
      // deposit funds
      let depositAmountInEth = 0.0025

      await web3.eth.sendTransaction({
        from: masterAddress,
        to: forwarderAddress,
        value: web3.utils.toWei(depositAmountInEth.toString(), 'ether')
      })

      // const balance = web3.eth.getBalance(wallet.address).toString()
      const data = '0x'
      const expireTime = Math.floor((new Date().getTime()) / 1000) + 3600 * 24 // 24 hours

      // build opHash that needs signed by other party
      const operationHash = helpers.getSha3ForConfirmationTx(
        accounts[1],
        withdrawalAmountInEth,
        data,
        expireTime,
        sequenceId
      )

      let pk = Buffer.from(ORACLE.pk,'hex')
      let otherSig = helpers.serializeSignature(util.ecsign(operationHash, pk));

      let params = {
        toAddress: accounts[1],
        expireTime,
        value: withdrawalAmountInEth,
        data,
        sequenceId,
        otherSig
      }

      let hash = await wallet.sendMultiSig(params)
      let receipt

      do {
        await pause(2)
        log.debug(`waiting for send receipt`)
        receipt = await web3.eth.getTransactionReceipt(hash)
      } while ( !receipt )

      log.debug(`sendMultSig result`, hash, receipt)

      expect(hash).toEqual(HASH)
      expect(helpers.isReceiptSuccessful(receipt)).toEqual(true)
    }, 300000)

    test('broadcast malicious tx', async () => {
      const data = '0x'
      const expireTime = Math.floor((new Date().getTime()) / 1000) + 3600 * 24 // 24 hours
      const nextSequenceId = '10000' // malicious, even if only by a signer; would also have to be counter-signed

      // build opHash that needs signed by other party
      const operationHash = helpers.getSha3ForConfirmationTx(
        accounts[1],
        withdrawalAmountInEth,
        data,
        expireTime,
        nextSequenceId
      )

      let pk = Buffer.from(ORACLE.pk,'hex')
      let otherSig = helpers.serializeSignature(util.ecsign(operationHash, pk));

      let params = {
        toAddress: accounts[1],
        expireTime,
        value: withdrawalAmountInEth,
        data,
        sequenceId: nextSequenceId,
        otherSig
      }

      let hash = await wallet.sendMultiSig(params)
      let receipt

      do {
        await pause(2)
        log.debug(`waiting for send receipt`)
        receipt = await web3.eth.getTransactionReceipt(hash)
      } while ( !receipt )

      log.debug(`sendMultSig result`, hash, receipt)

      expect(hash).toEqual(HASH)
      expect(helpers.isReceiptSuccessful(receipt)).toEqual(true)
    })

    test('can spend using APIs after malicious tx', async () => {
      const data = '0x'
      const expireTime = Math.floor((new Date().getTime()) / 1000) + 3600 * 24 // 24 hours
      const nextSequenceId = await wallet.getNextSequenceId()
      expect(nextSequenceId).toEqual(2)

      let sids = []

      for (let i = 0; i < 10; i++) {
        sids[i] = await wallet.contract.recentSequenceIds(i).call()
      }

      log.debug(`next sequence id`, nextSequenceId, sids)
      expect(sids[1]).toEqual('10000')
      expect(sids[2]).toEqual('0')

      // build opHash that needs signed by other party
      const operationHash = helpers.getSha3ForConfirmationTx(
        accounts[1],
        withdrawalAmountInEth,
        data,
        expireTime,
        nextSequenceId
      )

      let pk = Buffer.from(ORACLE.pk,'hex')
      let otherSig = helpers.serializeSignature(util.ecsign(operationHash, pk));

      let params = {
        toAddress: accounts[1],
        expireTime,
        value: withdrawalAmountInEth,
        data,
        sequenceId: nextSequenceId,
        otherSig
      }

      let hash = await wallet.sendMultiSig(params)
      let receipt

      do {
        await pause(2)
        log.debug(`waiting for send receipt`)
        receipt = await web3.eth.getTransactionReceipt(hash)
      } while ( !receipt )

      log.debug(`sendMultSig result`, hash, receipt)

      let slot2 = await wallet.contract.recentSequenceIds(2).call()

      expect(hash).toEqual(HASH)
      expect(helpers.isReceiptSuccessful(receipt)).toEqual(true)
      expect(slot2).toEqual("2")
    })

    test('returns expected sequenceIds with a variety of used ids', async () => {
      const data = '0x'
      const expireTime = Math.floor((new Date().getTime()) / 1000) + 3600 * 24 // 24 hours
      // NOTE: at this point in the tests, sequenceIDs 1, 10000, and 2 have been used
      // however, we want to also force usage of all sequence IDs so we know the wrapping logic is used
      const sequenceIds = [30,3,100,40,4,8,5,6,7, 9,10,11,12]
      const expectedSIDs = [3,4,  4, 4,5,5,6,7,9,10,11,12,13]

      for (let i in sequenceIds) {
        // build opHash that needs signed by other party
        const operationHash = helpers.getSha3ForConfirmationTx(
          accounts[1],
          withdrawalAmountInEth,
          data,
          expireTime,
          sequenceIds[i]
        )

        let pk = Buffer.from(ORACLE.pk,'hex')
        let otherSig = helpers.serializeSignature(util.ecsign(operationHash, pk));

        let params = {
          toAddress: accounts[1],
          expireTime,
          value: withdrawalAmountInEth,
          data,
          sequenceId: sequenceIds[i],
          otherSig
        }

        let hash = await wallet.sendMultiSig(params)
        let receipt

        do {
          await pause(2)
          log.debug(`waiting for send receipt`)
          receipt = await web3.eth.getTransactionReceipt(hash)
        } while ( !receipt )

        log.debug(`sendMultSig result`, hash, receipt)

        let next = await wallet.getNextSequenceId()

        expect(hash).toEqual(HASH)
        expect(helpers.isReceiptSuccessful(receipt)).toEqual(true)
        expect(next).toEqual(expectedSIDs[i])

        let sids = []

        for (let i = 0; i < 10; i++) {
          sids[i] = await wallet.contract.recentSequenceIds(i).call()
        }

        log.debug(`sequenceIDs`, sids)
      }

    }, 60000)
  })


})

// console.log(`wallet`, wallet.address)
