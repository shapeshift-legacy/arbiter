const TAG = '| coinBal |'
const {redis, subscriber} = require('arb-redis')
const Big = require('big.js')
const log = require('dumb-lumberjack')()
const arbiter = require('arbiter-custodial')
const config = require('../../configs/env')
const btcAllocationForMarkets = config.BTC_ALLOCATION_FOR_MARKETS
const SATOSHI = 100000000
const orderBookHelper = require('./orderBookHelper')
const {getAndSaveCoinBalances, getBal, checkAllocation, allocateAndSaveBtcBal} = require('./coinBalHelper')

main(btcAllocationForMarkets)


/*
    cancel all orders
    get and save coin balances
    get btc balance
    check if the btc allocation overall is good
    allocate and save btc bal for all markets
*/
async function main(btcAllocationForMarkets) {
    let tag = TAG + ' |main| '

    try {
        if(btcAllocationForMarkets) {
            // cancel all orders
            for (let market in btcAllocationForMarkets) {
                await orderBookHelper.clearOutData(market)
            }

            await getAndSaveCoinBalances()

            let btcBal = await getBal('BTC')

            let isGood = checkAllocation(btcAllocationForMarkets)

            if(isGood)  await allocateAndSaveBtcBal(btcAllocationForMarkets, btcBal)    
        }
    } catch (e) {
        log.error(tag, e)
    }
}

subscriber.subscribe("match")       // arbiter-trade-engine/api.js
subscriber.subscribe("trade")       // arbiter-core/modules/match.js
subscriber.subscribe("debits")      // arbiter-core/modules/liquidity.js (inside of order_accounting, which gets called inside of create new order; also, in account_withdraw function)
// subscriber.subscribe("credits")     // arbiter-core/modules/liquidity.js (inside of order_accounting, which gets called inside of create new order)
subscriber.subscribe('arbiterLa')   // arbiter-api/modules/payment.js for deposits
                                    // arbiter-core/modules/liquidity.js for cancel
                                    // arbiter-core/modules/liquidity.js for accounting or new order (order_accounting function)

subscriber.on("message", async function (channel, payloadS){
    let tag = TAG + " | tradeAgent pub/sub | "
    let coin
    let bal
    let market

    try{
        payloadS = JSON.parse(payloadS)
        log.info(tag, "payloadS: ", payloadS)

        switch (payloadS.event)
        {
            case "trade":
                console.log('!!!!! TRADING EVENT !!!!!')
                break
            case "cancel":
                if (payloadS.cancel === 'true') {

                    let type = payloadS.orderInfo.type
                    coin = payloadS.orderInfo.coinIn 
                    bal = payloadS.newBalance
                    let market = payloadS.orderInfo.market

                    log.info(tag, 'cancel', coin, type)                

                    if (coin === 'BTC') {
                        let btcMarketBal = await redis.hget('laBtcPerMarketBalances', market)

                        log.info('btcMarketBal', btcMarketBal)

                        btcMarketBal = Big(btcMarketBal)
                        // minus the amount from btcMarketBal
                        btcMarketBal = btcMarketBal.plus(payloadS.orderInfo.amountQuote).toString()

                        log.info('btcMarketBal - after adding the cancelled order qty', btcMarketBal)
    
                        if(btcMarketBal < 0.0001 )    btcMarketBal = 0
                        await redis.hset('laBtcPerMarketBalances', market, btcMarketBal) 
    
                        await redis.hset('laCoinBalances', 'BTC', bal)

                    } 
                    else {            
                        await redis.hset('laCoinBalances', coin, bal)
                    }
                }

                // todo 
                // the above logic udpates coin balances
                // in orderBook or orderBookHelper, remove the order for the market

                break
            case "submit":
                let type = payloadS.type

                bal = payloadS.newBalanceAccount
                coin = payloadS.coinIn

                if (coin === 'BTC') {
                    // let btcBal = bal

                    let btcMarketBal = await redis.hget('laBtcPerMarketBalances', payloadS.market)

                    log.info('btcMarketBal', btcMarketBal)

                    btcMarketBal = Big(btcMarketBal)
                    // minus the amount from btcMarketBal


                    btcMarketBal = btcMarketBal.minus(payloadS.quantity).toString()

                    log.info('btcMarketBal - after subtracting the submitted order', btcMarketBal)

                    if(btcMarketBal < 0.0001 )    btcMarketBal = 0
                    await redis.hset('laBtcPerMarketBalances', payloadS.market, btcMarketBal)

                    await redis.hset('laCoinBalances', 'BTC', bal)
                }
                else {            
                    await redis.hset('laCoinBalances', coin, bal)
                }

                // todo 
                // the above logic udpates coin balances
                // in orderBook or orderBookHelper, add the order for the market


                break
            case "debits":
            case "deposits":
                bal = payloadS.newBalance
                coin = payloadS.coin    

                if (coin === 'BTC') {
                    let btcBal = bal
                    await redis.hset('laCoinBalances', coin, btcBal)
                    await allocateAndSaveBtcBal(btcAllocationForMarkets, btcBal)                    
                }
                else {            
                    await redis.hset('laCoinBalances', coin, bal)
                }
                break
            case 'match':
                let aggressiveCoin = payloadS.resultAccountBalanceLAAggressive.coin
                let aggressiveBal = payloadS.resultAccountBalanceLAAggressive.resultAccountBalanceLA / SATOSHI

                if(aggressiveCoin === 'BTC') {
                    let btcBal = aggressiveBal
                    coin = aggressiveCoin
                    await redis.hset('laCoinBalances', coin, btcBal)
                    await allocateAndSaveBtcBal(btcAllocationForMarkets, btcBal) 
                } 
                else {
                    let coin = aggressiveCoin
                    let bal = aggressiveBal
                    await redis.hset('laCoinBalances', coin, bal)
                }

                let restingCoin = payloadS.resultAccountBalanceLAResting.coin
                let restingBal = payloadS.resultAccountBalanceLAResting.resultAccountBalanceLA / SATOSHI

                if(restingCoin === 'BTC') {
                    let btcBal = restingBal
                    coin = restingCoin
                    await redis.hset('laCoinBalances', coin, btcBal)
                    await allocateAndSaveBtcBal(btcAllocationForMarkets, btcBal) 
                } 
                else {
                    let coin = restingCoin
                    let bal = restingBal
                    await redis.hset('laCoinBalances', coin, bal)
                }
                
                break
            default:
                log.debug(tag, 'default case, payloadS', payloadS )
                break
        }
    } catch (e)
    {
        log.error(tag, e)
    }
})

