

const WalletFactory = require('../build/contracts/WalletFactory.json')
const Contract = require('../modules/contract')
const { web3 } = require('../modules/web3-manager')
const log = require('@arbiter/dumb-lumberjack')()
const helpers = require('../modules/helpers')
const { signAndSend } = require('../modules/sender')
const EventEmitter = require('./mock-event-emitter')
const redis = require('../modules/redis-manager')

jest.mock('../modules/address-manager', () => {
  return {
    getMasterAddress: jest.fn().mockResolvedValue('0xfd6d2028c11ee3b118416ee1e35f09ef2332face')
  }
})

jest.mock('../modules/sender', () => {
  return { signAndSend: jest.fn().mockResolvedValue('signAndSendResponse') }
})

jest.mock('../modules/redis-manager')

describe('Contract', () => {
  let contract, address, from, emitter, signer, trigger
  let signTransaction, sendSignedTransaction
  let _helpers

  beforeAll(() => {
    address = '0xc2B8c37d4428a2845310E15f06Ae63Be29829eA9'
    from = '0xfd6d2028c11ee3b118416ee1e35f09ef2332face'
    signer = '0x81e5b55E95488eF63BE2aAdDd50374b6c8754627'
    trigger = () => {
      log.debug(`triggering`)
      emitter.emit('transactionHash', 'mockedHash')
    }

    // cache the original implementation
    _helpers = helpers

    contract = new Contract({
      abi: WalletFactory.abi,
      address
    })
  })

  beforeEach(() => {
    emitter = new EventEmitter()
    sendSignedTransaction = jest.fn().mockReturnValue(emitter)
    helpers.getGasPrice = jest.fn().mockResolvedValue(1)

    web3.eth = Object.assign(web3.eth, {
      getTransactionCount: jest.fn().mockResolvedValue(1),
      accounts: { signTransaction },  // signing when PK is defined
      signTransaction, // signing when no PK defined
      sendSignedTransaction,
      getAccounts: jest.fn().mockReturnValue([]),
      net: {
        getNetworkType: jest.fn().mockResolvedValue("main")
      }
    })
  })

  test('generally works', done => {
    let tx = contract.createWallet(signer)

    tx.sendResolvesOnTxid({ a: 'b' }).then(result => {
      let args = signAndSend.mock.calls[0][0]
      let sendable = signAndSend.mock.calls[0][2]

      log.debug(`args`, args)

      expect(result).toEqual('signAndSendResponse')
      expect(signAndSend).toHaveBeenCalledTimes(1)
      expect(args.a).toEqual('b')
      expect(args.to).toEqual(address)
      expect(signAndSend.mock.calls[0][1]).toEqual('txid')
      expect(sendable._method.name).toEqual('createWallet')
      done()
    }).catch(ex => {
      log.error(`ex`, ex)
    })
  })

  test('uses appropriate options that are passed in', done => {
    let opts = {
      from: 'random from',
      to: 'random to',
      gas: 321321,
      value: 100
    }

    contract.createWallet(signer).sendResolvesOnTxid(opts).then(result => {
      let args = signAndSend.mock.calls[1][0]

      expect(args.from).toEqual('random from')
      expect(args.to).toEqual('random to')
      expect(args.gas).toEqual(321321)
      expect(args.value).toEqual(100)
      done()
    })
  })

  test('exposes the method functions of the abi', done => {
    let functions = WalletFactory.abi.filter(m => {
      return m.type === 'function' && !m.constant
    })

    for (let f of functions) {
      let args = new Array(f.inputs.length)
      expect(typeof contract[f.name]).toEqual('function')
      expect(typeof contract[f.name](args).sendResolvesOnTxid).toEqual('function')
      expect(typeof contract[f.name](args).sendResolvesOnSuccess).toEqual('function')
      expect(typeof contract[f.name](args).sendResolvesOnReceipt).toEqual('function')
    }

    done()
  })

})
