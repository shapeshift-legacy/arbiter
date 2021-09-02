const _web3 = require('web3')
const { web3 } = require('../modules/web3-manager')
const { redis } = require('../modules/redis-manager')
const client = require('../modules/eth-client')

jest.mock('../modules/redis-manager')
jest.mock('../modules/web3-manager', () => {
  return {
    web3: {
      eth: {
        accounts: {
          signTransaction: jest.fn().mockResolvedValue('mockedAccountsSig')
        },
        signTransaction: jest.fn().mockResolvedValue('mockedSig'),
        getTransactionCount: jest.fn().mockResolvedValue(10),
        getTransaction: jest.fn(),
        getTransactionReceipt: jest.fn(),
        Contract: class TestContract {},
        net: {
          getNetworkType: jest.fn().mockResolvedValue('main')
        }
      }
    }
  }
})

jest.mock('../modules/address-manager', () => {
  return { getMasterAddress: jest.fn().mockResolvedValue('testAddress') }
})

describe('eth-client', () => {
  describe('getTransaction', () => {
    let txid = "abcd"

    beforeEach(() => {
      redis.smembers = jest.fn()

      redis.smembers.mockResolvedValue([])
      web3.utils = _web3.utils
    })

    test('attempts to collect appropriate data', async done => {
      web3.eth.getTransaction.mockResolvedValueOnce()
      web3.eth.getTransactionReceipt.mockResolvedValueOnce()

      try {
        await client.getTransaction(txid)
      } catch (ex) {
        expect(ex.message).toEqual(`no data available for txid ${txid}`)
      }

      expect(web3.eth.getTransaction).toBeCalledWith(txid);
      expect(web3.eth.getTransactionReceipt).toBeCalledWith(txid);
      expect(redis.smembers).toBeCalledWith(`payments:${txid}`);

      done()
    })

    test('it correctly calculates fees', async done => {
      web3.eth.getTransaction.mockResolvedValueOnce({ gasPrice: '20000000000' })
      web3.eth.getTransactionReceipt.mockResolvedValueOnce({ gasUsed: 36784 })

      let result = await client.getTransaction(txid)

      expect(result.fee).toEqual('0.00073568')

      done()
    })

    test('it resolves if tx exists but receipt is null', () => {
      web3.eth.getTransaction.mockResolvedValueOnce({ gasPrice: '20000000000' })
      web3.eth.getTransactionReceipt.mockResolvedValueOnce(null)

      return client.getTransaction(txid)
    })

    test('it parses event json returned from redis', async () => {
      redis.hgetall.mockResolvedValueOnce('{"a":123}')
      redis.hgetall.mockResolvedValueOnce('{"b":"xyz"}')
      web3.eth.getTransactionReceipt.mockResolvedValueOnce({ gasUsed: 12345 })

      let result = await client.getTransaction(txid)

      expect(result.event.a).toEqual(123)
      expect(result.params.b).toEqual("xyz")
    })

    test('merges tx and receipt objects', async () => {
      web3.eth.getTransaction.mockResolvedValueOnce({ a: 1, gasPrice: 10 })
      web3.eth.getTransactionReceipt.mockResolvedValueOnce({ b: 2, gasUsed: 100 })

      let result = await client.getTransaction(txid)

      expect(result.a).toEqual(1)
      expect(result.b).toEqual(2)
      expect(result.c).toBeUndefined()
    })

    test('it includes payments when found', async () => {
      web3.eth.getTransaction.mockResolvedValueOnce({})
      web3.eth.getTransactionReceipt.mockResolvedValueOnce()
      redis.smembers.mockResolvedValueOnce([
        JSON.stringify({ a: 1 }),
        JSON.stringify({ b: 2 })
      ])

      let result = await client.getTransaction(txid)

      expect(result.payments.length).toEqual(2)
      expect(result.payments[0].a).toEqual(1)
      expect(result.payments[1].b).toEqual(2)
    })
  })

})
