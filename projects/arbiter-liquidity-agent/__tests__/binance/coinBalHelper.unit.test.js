const { 
    getAndSaveCoinBalances, 
    getBal,
    checkAllocation,
    allocateAndSaveBtcBal} = require('../../modules/binance/coinBalHelper')
const {redis} = require('@arbiter/arb-redis')
const arbiter = require('@arbiter/arb-api-client')

describe('coinBal', () => {

    afterAll(() => {
        redis.kill()
    })



    describe('getAndSaveCoinBalances()', () =>{
        test('saves the coin balances', async () => {
            arbiter.balances = jest.fn().mockResolvedValueOnce({
                BTC: 0.3,
                LTC: 1,
                ETH: 2,
                GNT: 3
            })

            redis.hset = jest.fn().mockResolvedValueOnce('saved')

            let result = await getAndSaveCoinBalances()
            expect(result).toEqual(true)
        })
    })

    describe('getBal()', () => {
        test('gets coin bal', async () => {
            redis.hget = jest.fn().mockResolvedValueOnce('10.00000000')

            let result = await getBal('BTC')
            expect(result).toEqual('10.00000000')
        })
    })

    describe('checkAllocation()', () => {
        test('BTC allocation in all markets do not exceed 100%', () => {
            const btcAllocationForMarkets = {
                LTC_BTC: 30,
                ETH_BTC: 30,
                GNT_BTC: 30
            }

            let result = checkAllocation(btcAllocationForMarkets)
            expect(result).toEqual(true)
        })

        test('throws when BTC allocation is over 100%', () => {
            const btcAllocationForMarkets = {
                LTC_BTC: 35,
                ETH_BTC: 35,
                GNT_BTC: 35
            }
            const err = new Error('Total BTC allocated percentage for all markets exceeds 100%. Re-allocation required...')

            expect(() => {
                checkAllocation(btcAllocationForMarkets)
            }).toThrow(err)
        })
    })

    describe('allocateAndSaveBtcBal()', () => {
        test('allocates correctly', async () => {
            const btcAllocationForMarkets = {
                LTC_BTC: 30,
                ETH_BTC: 30,
                GNT_BTC: 30
            }
            const btcBal = 3
            redis.hset = jest.fn()

            let result = await allocateAndSaveBtcBal(btcAllocationForMarkets, btcBal)
            expect(result).toEqual(true)
        })
    })

    
})
