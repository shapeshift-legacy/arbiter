// const helper = require('./orderBookHelper')
const request = require('superagent')
const market = 'LTC_BTC'
const log = require('@arbiter/dumb-lumberjack')()
let exchangeOrderBookArr = []
let { laOrdersNew } = require('../mongo.js')


setInterval(() => {
    test(market)
}, 5000)


async function test(market){
    let tag = '|test|'

    // todo temporarily adding this for checking if the orderbook is updating correctly
    let exchangeOrderbook = await getExchangeOrderBook(market)

    log.info('********* exchangeBook.body.lastUpdateId', exchangeOrderbook.body.lastUpdateId)
    log.info('********* exchangeBook.body.bids', exchangeOrderbook.body.bids.slice(0,10))
    log.info('********* exchangeBook.body.asks', exchangeOrderbook.body.asks.slice(0,10))

    exchangeOrderbook.bids = exchangeOrderbook.body.bids.slice(0, 10)
    exchangeOrderbook.asks = exchangeOrderbook.body.asks.slice(0, 10)
    exchangeOrderbook.lastUpdateId = exchangeOrderbook.body.lastUpdateId

    if(exchangeOrderBookArr.length >= 10) {
        exchangeOrderBookArr.shift()
    }

    exchangeOrderBookArr.push(exchangeOrderbook)


    // await exchangeBook.insert({ name: 'binance', market: market, book: exchangeOrderbook })
    let laOrderBookNew = await laOrdersNew.findOne({name: 'binance', market: market})

    let laBids = laOrderBookNew.book.bids
    let laAsks = laOrderBookNew.book.asks
    let id = laOrderBookNew.book.lastUpdateId

    exchangeOrderBookArr.forEach(exchangeOrderbook => {
        if (exchangeOrderbook.lastUpdateId == id && laBids && laBids.length > 0 ) {
            let eBids = exchangeOrderbook.bids

            let len = Math.min(laBids.length, 10)
            log.info('len: ', len)

            laBids.forEach(order => {
                console.log(tag, 'laBids:', order)
            })


            try
            {
                for (let i = 0; i < len; i++)
                {

                    log.info('@@@@@  laBids[i]', laBids[i], '@@@@@@@@@@@@@@@@')

                    if (Number(laBids[i][0]) != Number(eBids[i][0]))
                    {
                        console.error(tag, '**************   NOT THE SAME RATE **************, laBids[i]', laBids[i], 'eBids[i]', eBids[i])
                    } else
                    {
                        console.log(tag, '!!!! WOOT !!! BIDS !!! EVENT')
                    }
                }
            } catch (e) {
                console.error('blahh', e)
            }
        }

        if (exchangeOrderbook.lastUpdateId == id && laAsks && laAsks.length > 0) {
            let eAsks = exchangeOrderbook.asks

            let len = Math.min(laAsks.length, 10)

            log.info('len: ', len)

            laAsks.forEach(order => {
                console.log(tag, 'laAsks:', order)
            })

            try
            {
                for (let i = 0; i < len; i++)
                {
                    log.info('@@@@@  laAsks[i]', laAsks[i], '@@@@@@@@@@@@@@@@')


                    if (Number(laAsks[i][0]) != Number(eAsks[i][0]))
                    {
                        console.error(tag, '**************   NOT THE SAME RATE **************, laAsks[i]', laAsks[i], 'eAsks[i]', eAsks[i])
                    } else
                    {
                        console.log(tag, '!!!! WOOT !!! ASKS!!!   EVENT ')
                    }
                }
            } catch (e) {
                console.error('blahh', e)
            }




        }
    })

}


async function getExchangeOrderBook (market) {
    let tag = ' |getExchangeOrderBook| ' + market

    // let pair = formatPairForBinance(market)
    let pair = "LTCBTC"
    pair = pair.toUpperCase()

    try {
        let result = await request.get('https://www.binance.com/api/v1/depth?symbol=' + pair.toUpperCase())
        return result

    } catch (e) {
        log.error('err: ', e)
    }
}
