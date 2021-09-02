
const EthereumMultiSigWallet = require('../modules/eth-multisig-wallet')
const config = require('../configs/env')
const {
  TEST_ACCOUNT,
  TEST_CONTRACT_ADDRESS
} = config
const { web3 } = require('../modules/web3-manager')
const util = require('ethereumjs-util');
const helpers = require('../modules/helpers')
const TokenManager = require('../modules/token-manager')
const ForwarderContract = require('../modules/forwarder-contract')
const Big = require('bignumber.js')
const pause = require('../modules/pause')
const { getMasterAddress, _waitForMinAccounts } = require('../modules/address-manager')
const softUnlock = require('../modules/soft-unlock')
const log = require('@arbiter/dumb-lumberjack')()
const deploy = require('../modules/deploy')
const HumanStandardToken = require('../build/contracts/HumanStandardToken.json')
const Logger = require('../build/contracts/Logger.json')

jest.mock('../modules/token-manager')

const HASH = expect.stringMatching(/^0x.+/)

// hard-coded address/pk combo for testing
const ORACLE = {
  address: "0xC079C31032a3a6A04AF58025DC1967504F39c078",
  pk: "e0f98b2b946e363e7b836d2b219560152f70b747441eec73d4f43a3c9ec094d9"
}

describe('eth multisig wallet', async () => {
  describe('instantiates the wallet', async () => {
    let wallet, user, sequenceId, accounts, masterAddress, forwarderAddress, tokenContract, tokenAddress

    beforeAll(async () => {
      accounts = await _waitForMinAccounts(2)

      // if mainnet, we need to use an address with eth
      masterAddress = await getMasterAddress()
      user = accounts[1]

      // deploy all the prerequisites
      let deployed = await deploy(ORACLE.address)
      let { walletFactory, logger } = deployed

      tokenContract = new web3.eth.Contract(HumanStandardToken.abi, undefined, {
        data: HumanStandardToken.bytecode
      })

      tokenAddress = await new Promise((resolve, reject) => {
        tokenContract.deploy({
          arguments: [1000000, "arbies", 10, "ZARBS"]
        }).send({
          from: masterAddress,
          gas: 5000000
        }).on('error', reject)
        .on('receipt', receipt => {
          log.debug(`token contract receipt`, receipt)
          if ( !receipt.status === "0x1" || receipt.status === 1 ) {
            reject("token creation was unsuccessful!")
          } else {
            resolve(receipt.contractAddress)
          }
        })
        .on('transactionHash', hash => log.debug(`hash`, hash))
        .catch(reject)
      })

      log.debug(`token address`, tokenAddress)
      tokenContract.options.address = tokenAddress

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
          log.debug(`wallet creation receipt`, receipt)
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

      wallet = new EthereumMultiSigWallet({
        atAddress: events[0].returnValues.wallet,
        gasAddress: masterAddress,
        loggerAddress: logger
      })
    }, 120000)

    test('can deploy a contract', async () => {
      expect(wallet.address).toEqual(expect.stringMatching(/^0x.+/))
      expect(wallet.getNextSequenceId).toBeDefined()
      expect(wallet.sendMultiSigToken).toBeDefined()
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
            await pause(15)
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

      expect(sequenceId > 0).toEqual(true)
    })

    test('can transfer tokens to wallet', async () => {
      let masterBalance = await tokenContract.methods.balanceOf(masterAddress).call()
      let walletBalance = await tokenContract.methods.balanceOf(wallet.address).call()
      let amt = 1000
      let bigamt = new Big(amt)

      await tokenContract.methods.transfer(wallet.address, amt).send({ from: masterAddress })
      let newMasterBalance = await tokenContract.methods.balanceOf(masterAddress).call()
      let newWalletBalance = await tokenContract.methods.balanceOf(wallet.address).call()

      expect(newMasterBalance).toEqual(new Big(masterBalance).minus(bigamt).toString())
      expect(newWalletBalance).toEqual(new Big(walletBalance).plus(bigamt).toString())
      // expect(walletBalance).toEqual("1000")
    })

    test('can flush tokens from forwarder', async () => {
      let amt = 1000
      let bigamt = new Big(amt)
      let forwarderBalance = await tokenContract.methods.balanceOf(forwarderAddress).call()
      let walletBalance = await tokenContract.methods.balanceOf(wallet.address).call()

      await tokenContract.methods.transfer(forwarderAddress, amt).send({ from: masterAddress })

      let newForwarderBalance = await tokenContract.methods.balanceOf(forwarderAddress).call()
      expect(newForwarderBalance).toEqual(new Big(forwarderBalance).plus(bigamt).toString())

      TokenManager.contractAddress = jest.fn().mockReturnValue(tokenAddress)
      TokenManager.contractForToken = jest.fn().mockReturnValueOnce({
        methods: { balanceOf: () => { return { call: () => { return 10 }}}}
      })
      let { txid } = await wallet.flushForwarderTokens('junk-token', forwarderAddress)

      log.debug(`flush txid`, txid)

      let receipt
      do {
        receipt = await web3.eth.getTransactionReceipt(txid)

        if ( !receipt ) {
          await pause(1)
        }
      } while (!receipt)

      let flushedForwarderBalance = await tokenContract.methods.balanceOf(forwarderAddress).call()
      let newWalletBalance = await tokenContract.methods.balanceOf(wallet.address).call()

      expect(newWalletBalance).toEqual(new Big(walletBalance).plus(bigamt).plus(new Big(forwarderBalance)).toString())
      expect(flushedForwarderBalance).toEqual("0")

      // let forwarder = new ForwarderContract({ atAddress: forwarder })
      // let parent = await forwarder.parentAddress()


      // let walletBalance = await tokenContract.methods.balanceOf(wallet.address).call()
      // expect(masterBalance).toEqual("999000")
      // expect(walletBalance).toEqual("1000")
    })

    test('can send funds from multisig', async () => {
      // deposit funds
      const amount = "6"
      const base = "100"
      const expireTime = Math.floor((new Date().getTime()) / 1000) + 3600 * 24 // 24 hours

      let value = new Big(amount).times(base).toString()

      TokenManager.baseForToken = jest.fn()
      TokenManager.baseForToken.mockReturnValueOnce(base)

      let preWalletBalance = await tokenContract.methods.balanceOf(wallet.address).call()
      let preUserBalance = await tokenContract.methods.balanceOf(user).call()

      // build opHash that needs signed by other party
      const operationHash = helpers.getSha3ForConfirmationTokenTx(
        user,
        value,
        tokenContract.options.address,
        expireTime,
        sequenceId
      )

      log.debug(`operationHash`, operationHash)

      let pk = Buffer.from(ORACLE.pk,'hex')
      let otherSig = helpers.serializeSignature(util.ecsign(operationHash, pk));

      log.debug(`otherSig`, otherSig)

      let params = {
        toAddress: user,
        expireTime,
        tokenContractAddress: tokenContract.options.address,
        value: amount,
        sequenceId,
        signature: otherSig
      }

      let hash = await wallet.sendMultiSigToken(params)
      let receipt

      do {
        await pause(2)
        log.debug(`waiting for send receipt`)
        receipt = await web3.eth.getTransactionReceipt(hash)
      } while ( !receipt )

      let walletBalance = await tokenContract.methods.balanceOf(wallet.address).call()
      let userBalance = await tokenContract.methods.balanceOf(user).call()

      log.debug(`sendMultSig result`, hash, receipt)
      log.debug(`balances`, walletBalance, userBalance)

      expect(hash).toEqual(HASH)
      expect(helpers.isReceiptSuccessful(receipt)).toEqual(true)
      expect(walletBalance).toEqual(new Big(preWalletBalance).minus(value).toString())
      expect(userBalance).toEqual(new Big(preUserBalance).plus(value).toString())
    }, 300000)
  })
})

// console.log(`wallet`, wallet.address)
