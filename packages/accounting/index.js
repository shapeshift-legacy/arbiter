const Big = require('big.js')

// set current balances
const log = require('@arbiter/dumb-lumberjack')()

// innit global accounts
let accountsGlobal = {
    shapeshift: {
        BTC: 0,
        LTC: 0
    }
}

// allow balance calls to be synchronise

class Accounting {
    constructor(redis) {
      if ( !redis ) {
        throw Error("redis must be passed to Accounting constructor")
      }
      this.redis = redis
    }

    balance(account, coin) {
        return _balance(account, coin, this.redis)
    }

    credit(account, amount, coin) {
        return _credit(account, amount, coin, this.redis)
    }

    debit(account, amount, coin) {
        return _debit(account, amount, coin, this.redis)
    }

    match(_match) {
        return _digest_match(_match, this.redis)
    }
}

module.exports = Accounting

let TAG = ' | accounting | '
let BTC = 100000000
let ETH = 100000000
let LTC = 100000000
let GNT = 100000000
let USD = 100

let precision = { BTC, ETH, USD, LTC, GNT }
let debug = false

/****************************
// primary
//****************************/

const _digest_match = async function (match, redis) {
    let tag = ' |  digest_match | '
    let debug = true
    try {
        if (debug) console.log(tag, 'match: ', match)
        let matchAmountBase = match.matchQuantity
        let matchAmountQuote = match.matchQuantity * match.restingOrderPrice
        // TODO this has precision loss!
        matchAmountQuote = Math.floor(100000000 * matchAmountQuote) / 100000000
        if (debug) console.log(tag, 'matchAmountBase:', matchAmountBase)
        if (debug) console.log(tag, 'matchAmountQuote:', matchAmountQuote)

        let restingCoin, aggressiveCoin, restingAmount, aggressiveAmount
        let coins = match.engine.split('_')
        if (debug) console.log(tag, 'coins: ', coins)

        let summaryA
        let summaryR
        if (match.restingOrder.isBuy === true) {
            restingCoin = coins[1]
            restingAmount = matchAmountQuote
            aggressiveCoin = coins[0]
            aggressiveAmount = matchAmountBase

            summaryA = 'event: ' + match.time + ' order: ' + match.aggressiveOrder.id + ' sold ' + aggressiveAmount + ' (' + aggressiveCoin + ') at ' + match.restingOrderPrice
            redis.sadd('subtrades:' + match.aggressiveOrder.id, summaryA)

            summaryR = 'event: ' + match.time + ' order: ' + match.restingOrder.id + ' bought ' + restingAmount + ' (' + aggressiveCoin + ') at ' + match.restingOrderPrice
            redis.sadd('subtrades:' + match.restingOrder.id, summaryA)
        } else {
            restingCoin = coins[0]
            restingAmount = matchAmountBase
            aggressiveCoin = coins[1]
            aggressiveAmount = matchAmountQuote

            summaryA = 'event: ' + match.time + ' order: ' + match.aggressiveOrder.id + ' bought ' + aggressiveAmount + ' (' + restingCoin + ') at ' + match.restingOrderPrice
            redis.sadd('subtrades:' + match.aggressiveOrder.id, summaryA)

            summaryR = 'event: ' + match.time + ' order: ' + match.restingOrder.id + ' sold ' + restingAmount + ' (' + restingCoin + ') at ' + match.restingOrderPrice
            redis.sadd('subtrades:' + match.restingOrder.id, summaryA)
        }

        // TODO this NEEDS to handle any coin!
        // if(match.restingOrder.isBuy === true){
        //     restingCoin = "BTC"
        //     restingAmount = matchAmountQuote
        //     aggressiveCoin = "LTC"
        //     aggressiveAmount = matchAmountBase
        // }
        // else
        // {
        //     restingCoin = "LTC"
        //     restingAmount = matchAmountBase
        //     aggressiveCoin = "BTC"
        //     aggressiveAmount = matchAmountQuote
        // }

        // Balances prior should be whats expected
        let restingPreBTC = await _balance(match.restingOrder.id, 'BTC', redis)
        let restingPreLTC = await _balance(match.restingOrder.id, 'LTC', redis)
        if (debug) console.log('balance (pre) resting BTC: ', restingPreBTC)
        if (debug) console.log('balance (pre) resting LTC: ', restingPreLTC)

        let aggressivePreBTC = await _balance(match.aggressiveOrder.id, 'BTC', redis)
        let aggressivePreLTC = await _balance(match.aggressiveOrder.id, 'LTC', redis)
        if (debug) console.log('balance (pre) aggressive BTC: ', aggressivePreBTC)
        if (debug) console.log('balance (pre) aggressive LTC: ', aggressivePreLTC)

        if (debug) console.log(tag, ' coin in resting order: ', restingAmount, ' (', restingCoin, ')')
        if (debug) console.log(tag, ' coin in aggressive order: ', aggressiveAmount, ' (', aggressiveCoin, ')')

        let balanceResting = {}
        balanceResting.id = match.restingOrder.id
        let balanceAggresive = {}
        balanceAggresive.id = match.aggressiveOrder.id

        // resting order
        console.log(tag, 'DEBIT resting: ', match.restingOrder.id, restingAmount, restingCoin)
        balanceResting[restingCoin] = await _debit(match.restingOrder.id, restingAmount, restingCoin, redis)

        // credit BTC
        console.log(tag, 'CREDIT resting: ', match.restingOrder.id, aggressiveAmount, aggressiveCoin)
        balanceResting[aggressiveCoin] = await _credit(match.restingOrder.id, aggressiveAmount, aggressiveCoin, redis)

        // credit ETH
        console.log(tag, 'CREDIT aggresive: ', match.aggressiveOrder.id, restingAmount, restingCoin)
        balanceAggresive[restingCoin] = await _credit(match.aggressiveOrder.id, restingAmount, restingCoin, redis)

        // debit BTC
        console.log(tag, 'DEBIT aggresive: ', match.aggressiveOrder.id, aggressiveAmount, aggressiveCoin)
        balanceAggresive[aggressiveCoin] = await _debit(match.aggressiveOrder.id, aggressiveAmount, aggressiveCoin, redis)

        let output = {
            summary: [summaryA, summaryR],
            balanceResting,
            balanceAggresive,
        }
        if (debug) console.log(tag, 'output: ', output)
        return output
    } catch (e) {
        console.error(tag, 'ERROR: ', e)
        throw e
    }
}

const _balance = async function (account, coin, redis) {
    let tag = TAG + ' | balance | '
    try {
        // var debug = false
        if (!account) throw Error('ERROR:BALANCE:101 missing account')
        if (!coin) throw Error('ERROR:BALANCE:102 missing coin type')
        coin = coin.toUpperCase()
        if (!precision[coin]) throw Error('ERROR:BALANCE:103 unknown asset!')
        log.debug(tag, 'coin: ', coin)

        let balance = await redis.hget(account, coin)
        log.debug(tag, 'balance: ', balance)
        if (!balance) return 0
        balance = parseInt(balance, 10) / precision[coin]
        return balance
    } catch (e) {
        console.error(tag, 'ERROR: ', e)
        throw Error('ERROR:BALANCE:100 failed to find balance')
    }
}

const _credit = async function (account, amount, coin, redis) {
    let tag = TAG + ' | credit | '
    let debug = false
    try {
        // let debug = false
        let timeStart = new Date().getTime()

        if (!account) throw Error('ERROR:CREDIT:201 missing account')
        if (!amount) throw Error('ERROR:CREDIT:202 missing amount')
        if (!coin) throw Error('ERROR:CREDIT:204 missing coin type')
        if (amount <= 0) throw Error('ERROR:CREDIT:203 attempted negative credit')
        coin = coin.toUpperCase()
        if (!precision[coin]) throw Error('ERROR:CREDIT:205 unknown asset!')
        log.debug(tag, 'coin: ', coin)

        // prescision
        let atomicicity = Big(precision[coin])
        let amountBig = Big(amount)

        amountBig = amountBig.times(atomicicity)
        log.debug(tag, 'amountBig: ', amountBig.toString())

        // atomic
        let amountCredit = parseInt(amountBig, 10)
        if (amountCredit != amountBig) console.error(tag, 'amountCredit: ', amountCredit, '  amount: ', amount)
        // if(amountCredit != amountBig) throw'ERROR:CREDIT:206 POTENTIAL PRECISION LOSS! '
        let timeEnd = new Date().getTime()
        log.debug(tag, 'benchmark Math: ', timeEnd - timeStart)

        let success = await redis.hincrby(account, coin, amountCredit)
        log.debug(tag, 'success: ', success)
        if (!success) throw Error('ERROR:CREDIT:205 missing account')

        let timeDone = new Date().getTime()
        log.debug(tag, 'benchmark Redis: ', timeEnd - timeDone)
        
        return success
    } catch (e) {
        console.error(tag, 'ERROR: ', e)
        throw Error('ERROR:CREDIT:200 failed to credit!')
    }
}

const _debit = async function (account, amount, coin, redis) {
    let tag = TAG + ' | debit | '
    let debug = true
    const get_balance = async function (account, coin) {
        let tag2 = TAG + ' | get_balance | '
        try {
            // let debug = false
            if (!account) throw Error('ERROR:CREDIT:101 missing account')
            if (!coin) throw Error('ERROR:CREDIT:102 missing account')
            coin = coin.toUpperCase()
            if (!precision[coin]) throw Error('ERROR:CREDIT:204 unknown asset!')
            log.debug(tag2, 'coin: ', coin)

            let balance = await redis.hget(account, coin)
            log.debug(tag2, 'balance: ', balance)

            if (!balance) {
                // console.error(tag2,"no balance returned from redis for hget ", account, coin)
                return 0
            }
            balance = parseInt(balance, 10) / precision[coin]
            return balance
        } catch (e) {
            if (debug) console.error(tag2, 'ERROR: ', e)
            throw Error('ERROR:CREDIT:100 failed to credit! ')
        }
    }

    try {
        // let debug = false

        if (!account) throw Error('ERROR:CREDIT:301 missing account')
        if (!amount) throw Error('ERROR:CREDIT:302 missing amount')
        if (!coin) throw Error('ERROR:CREDIT:304 missing coin')

        coin = coin.toUpperCase()
        if (!precision[coin]) throw Error('ERROR:CREDIT:106 unknown asset!')

        // atomic
        amount = parseInt(amount * precision[coin], 10)
        log.debug(tag, coin + ' amount: ', amount)
        log.debug(tag, coin + ' account: ', account)
        let balance = await get_balance(account, coin)
        log.debug(tag, coin + ' balance: ', balance)
        balance = parseInt(balance * precision[coin], 10)
        log.debug(tag, coin + ' balance: ', balance)
        log.debug(tag, coin + ' amount: ', amount)
        if (balance < amount) console.error(account, ' ', coin + ' amount:', amount, 'balance: ', balance)
        if (balance < amount) throw Error('OVERDRAFT! balance: ' + balance + ' amount: ' + amount)

        // debit is negitive
        amount = amount * -1
        if (amount > 0) throw Error('ERROR:CREDIT:303 attempted positive debit')
        let amountCredit = parseInt(amount, 10)
        if (amountCredit != amount && debug) console.error(tag, 'amountCredit: ', amountCredit, '  amount: ', amount)
        if (amountCredit != amount) console.error(tag, 'POTENTIAL PRECISION LOSS! ')
        let success = await redis.hincrby(account, coin, amountCredit)
        if (success === 0) return 0
        log.debug(tag, 'success: ', success)
        if (!success) throw Error('ERROR:CREDIT:305 failed to update!')

        return success
    } catch (e) {
        console.error(tag, 'ERROR: ', e)
        throw Error('ERROR:CREDIT:300 failed to debit!')
    }
}
