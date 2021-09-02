const log = require('@arbiter/dumb-lumberjack')()
const {web3} = require('../modules/web3-manager')
const {redis} = require('../modules/redis-manager')
const sender = require('../modules/sender')
const helpers = require('../modules/helpers')
var crypt = require('../modules/crypt')

jest.mock('../modules/web3-manager', () => {
  return {
    web3: {
      eth: {
        accounts: {
          signTransaction: jest.fn().mockResolvedValue('mockedAccountsSig')
        },
        signTransaction: jest.fn().mockResolvedValue('mockedSig'),
        getTransactionCount: jest.fn().mockResolvedValue(10),
        net: {
          getNetworkType: jest.fn().mockResolvedValue('main')
        }
      }
    }
  }
})

jest.mock('../modules/address-manager', () => {
  return {getMasterAddress: jest.fn().mockResolvedValue('testAddress')}
})

jest.mock('../modules/redis-manager')
jest.mock('../modules/crypt')

describe('sender', () => {
  beforeAll(() => {
    crypt.decrypt.mockReturnValue('encrypto')
    helpers.getGasPrice = jest.fn().mockResolvedValue(1)
    redis.incr = jest.fn().mockResolvedValue(1)
  })

  afterEach(() => {
    log.debug(`afterEach`)
    crypt.decrypt.mockClear()
  })

  beforeEach(() => {
    log.debug(`beforeEach`)
    redis.hgetall = jest.fn().mockResolvedValue({privKey: "somethingencrypted"})
  })

  test('uses the master address if none is passed in', async done => {
    let opts = await sender._normalizeTxOpts({ to: 'a' })

    expect(opts.from).toEqual('testAddress')

    done()
  })

  test('uses the from address if passed in', async done => {
    let opts = await sender._normalizeTxOpts({ from: 'abcd', to: 'a' })

    expect(opts.from).toEqual('abcd')

    done()
  })

  test('checks redis for the nonce', async done => {
    redis.incr.mockClear()

    let opts = await sender._normalizeTxOpts({ from: 'abcd', to: 'a' })

    expect(redis.incr.mock.calls[0][0]).toEqual('sending:next-nonce:abcd')

    done()
  })

  test('throws if no key is found in prod', async done => {
    redis.hgetall = jest.fn().mockResolvedValueOnce()
    let nodeEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'prod'

    try {
      await sender._sign({from: 'testAddress'})
      process.env.NODE_ENV = nodeEnv
    } catch (ex) {
      expect(ex.message).toEqual(`could not sign transaction with testAddress, unknown address`)

      // restore node_env
      process.env.NODE_ENV = nodeEnv
      done()
    }
  })

  test(`nonce returns the value from redis - 1`, async done => {
    redis.incr = jest.fn().mockResolvedValueOnce(10)

    let nonce = await sender._getNonce('xyz')
    expect(nonce).toEqual(9)
    done()
  })

  test(`if no nonce, return the value from getTransactionCount`, async done => {
    redis.incr = jest.fn().mockResolvedValueOnce(1)
    web3.eth.getTransactionCount = jest.fn().mockResolvedValueOnce(100)

    let nonce = await sender._getNonce('xyz')
    expect(nonce).toEqual(100)
    done()
  })

  test('calls decrypt with the privkey from redis', async done => {
    let res = await sender._sign({ test: "testjb", from: 'testAddress' })

    expect(crypt.decrypt).toHaveBeenCalledTimes(1)
    expect(crypt.decrypt.mock.calls[0][0]).toEqual('somethingencrypted')
    expect(web3.eth.accounts.signTransaction.mock.calls[0][1]).toEqual('0xencrypto')
    expect(res).toEqual('mockedAccountsSig')
    done()
  })
})
