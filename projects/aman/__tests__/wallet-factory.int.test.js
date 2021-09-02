
const { web3 } = require('../modules/web3-manager')
const log = require('@arbiter/dumb-lumberjack')()
const LoggerContract = require('../modules/logger-contract')
const { getMasterAddress, _waitForMinAccounts } = require('../modules/address-manager')
const WalletFactory = require('../build/contracts/WalletFactory.json')
const deploy = require('../modules/deploy')
const Contract = require('../modules/contract')
const softUnlock = require('../modules/soft-unlock')

const HASH = expect.stringMatching(/^0x.+/)

// hard-coded address/pk combo for testing
const ORACLE = {
  address: "0xC079C31032a3a6A04AF58025DC1967504F39c078",
  pk: "e0f98b2b946e363e7b836d2b219560152f70b747441eec73d4f43a3c9ec094d9"
}

describe('wallet factory', async () => {
  describe('instantiates the factory', async () => {
    let factory, accounts, masterAddress, logger

    beforeAll(async () => {
      accounts = await _waitForMinAccounts(3)

      log.debug(`accounts`, accounts)

      let deployed = await deploy(ORACLE.address)
      let { walletFactory, logger: _logger } = deployed

      logger = new LoggerContract({ gasAddress: masterAddress, atAddress: _logger })

      // if mainnet, we need to use an address with eth
      masterAddress = await getMasterAddress()

      factory = new Contract({
        abi: WalletFactory.abi,
        address: walletFactory
      })
    }, 120000)

    test('has expected functions', () => {
      expect(typeof factory.createWallet).toBe("function")
    })

    test('can create a new wallet with an arbitrary address', async done => {
      let userAddress = accounts[1]
      let receipt = await factory.createWallet(userAddress).sendResolvesOnReceipt({ gas: 5000000 })

      // fetch the events to make sure it created like we expected
      let events = await logger.contract.getPastEvents('WalletCreated', {
        fromBlock: receipt.blockNumber,
        toBlock: receipt.blockNumber
      })

      let { wallet: _wallet, signers, forwarders } = events[0].returnValues

      log.debug('new wallet', _wallet, signers, forwarders)

      expect(_wallet).toEqual(HASH)
      expect(signers[2]).toEqual(HASH)
      expect(forwarders[4]).toEqual(HASH)
      expect(signers.length).toBe(3)
      expect(forwarders.length).toBe(5)
      done()
    })

    test('can create a new wallet with zero-eth tx', async done => {
      let userAddress = accounts[2]

      return new Promise(async (resolve, reject) => {
        let tx = {
          from: userAddress,
          to: factory.contract.options.address,
          value: web3.utils.toWei("0", 'ether'),
          gas: 2000000,
          gasPrice: 5
        }

        await softUnlock(tx.from)
        // note that this assumes we're running geth in dev mode
        // let signed = await web3.eth.signTransaction(tx, tx.from)
        const balance = await web3.eth.getBalance(tx.from)

        log.debug(`balance`, balance)

        web3.eth.sendTransaction(tx)
        .on('error', reject)
        .once('receipt', async receipt => {
          try {
            log.debug(`receipt`, receipt)

            let events = await logger.contract.getPastEvents('WalletCreated', {
              fromBlock: receipt.blockNumber,
              toBlock: receipt.blockNumber
            })

            log.debug(`events`, events)

            let { wallet: _wallet, signers, forwarders } = events[0].returnValues

            log.debug('new wallet', _wallet, signers, forwarders)

            expect(_wallet).toEqual(HASH)
            expect(signers[2]).toEqual(HASH)
            expect(forwarders[4]).toEqual(HASH)
            expect(signers.length).toBe(3)
            expect(forwarders.length).toBe(5)

            done()
          } catch (ex) {
            reject(ex)
          }
        }).catch(reject)
      })
    })
  })
})
