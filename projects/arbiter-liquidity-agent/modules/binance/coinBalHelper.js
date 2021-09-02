const TAG = 'coinBalHelper'
const {redis} = require('@arbiter/arb-redis')
const Big = require('big.js')
const log = require('@arbiter/dumb-lumberjack')()
const arbiter = require('@arbiter/arb-api-client')

module.exports = {
    getAndSaveCoinBalances,
    getBal,
    checkAllocation,
    allocateAndSaveBtcBal
}

async function getAndSaveCoinBalances () {
    let tag = TAG + ' |getAndSaveCoinBalances| '

    try {
        let coinBals = await arbiter.balances()

        for (let coin in coinBals) {
            log.debug('coin', coin)
            log.debug('coinBal', coinBals[coin])
            
            await redis.hset('laCoinBalances', coin, coinBals[coin])    
        }

        return true
    } catch (e) {
        log.error(tag, e)
    }
}

async function getBal (coin) {
    let tag = TAG + ' |getBal| '
    try {
        let coinBal = await redis.hget('laCoinBalances', coin)     
        log.debug('coin', coin)
        log.debug('coinBal', coinBal) 
        
        return coinBal
    } catch (e) {
        log.error(tag, e)
    }
    
}

function checkAllocation (btcAllocationForMarkets) {   
    let tag = TAG + ' |checkAllocation| '
    let totalPercentage = Big(0)
    for (let key in btcAllocationForMarkets) {
        totalPercentage = totalPercentage.plus(btcAllocationForMarkets[key])
    }
    
    log.debug('totalPercentage', totalPercentage.toString())
    
    if (totalPercentage.gt(100))  {
        throw new Error('Total BTC allocated percentage for all markets exceeds 100%. Re-allocation required...')
    }
    else    return true   
}


async function allocateAndSaveBtcBal(btcAllocationForMarkets, btcBal) {
    let tag = TAG + ' |allocateAndSaveBtcBal| '
    try {
        btcBal = Big(btcBal)

        for (let key in btcAllocationForMarkets) {
            let coinArr = key.split('_')
            let coin = coinArr[0]
            let marketPercentage = btcAllocationForMarkets[key]

            let bal = btcBal.times(marketPercentage).times(0.01)
            
            log.debug(tag, 'key', key)
            log.debug(tag, 'bal', bal.toString())

            await redis.hset('laBtcPerMarketBalances', key, bal.toString() )
        }

        return true
    } catch (e) {
        log.error(tag, e)
    }
}