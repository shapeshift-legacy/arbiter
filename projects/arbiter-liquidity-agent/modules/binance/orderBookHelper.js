const TAG = 'orderBookHelper'
const log = require('@arbiter/dumb-lumberjack')()
const request = require('superagent')
const {redis} = require('@arbiter/arb-redis')

let config = require('../../configs/env')

const Big = require('big.js')
const liquidityBuffer = 0

let marketArr = config.MARKETS
    ? config.MARKETS
    : ['LTC_BTC', 'ETH_BTC']


let wsEventQue = []
let exchangeOrderBook
let isProcessRunning = false

let uuid = require('node-uuid')
const arbiter = require('@arbiter/arb-api-client')

let BTC = 100000000
let ETH = 100000000
let LTC = 100000000
let GNT = 100000000
let USD = 100

let precision = { BTC, ETH, USD, LTC, GNT }

module.exports = {
    clearOutData,
    getExchangeOrderBook,
    processWsQueForExchangeBook,
    replayWsEvents,
    formatPairForBinance,
    publishNewOrder,
    publishCancelOrder,
    getCoinNames,
    queryCoinBal,
    queryBtcMarketBal,
    getOrderBookFromArbiter,
    getDiff,
    publishDiff,
    delay,
    createNewLaOrders,
    delayBeforePublishNew,
    createOrdersAndPublish
}

async function clearOutData (market) {
    let currentLaOrders = await getOrderBookFromArbiter(market)

    let type
    let orderId

    currentLaOrders.bids.forEach(order => {
        type = 'bid'
        orderId = order[2]
        publishCancelOrder(market, type, orderId)
    })


    currentLaOrders.asks.forEach(order => {
        type = 'ask'
        orderId = order[2]
        publishCancelOrder(market, type, orderId)
    })
}

//  getExchangeOrderBook
async function getExchangeOrderBook (market) {
    let tag = TAG + ' |getExchangeOrderBook| ' + market

    let pair = formatPairForBinance(market)
    pair = pair.toUpperCase()

    try {
        // let result = await request.get('https://www.binance.com/api/v1/depth?symbol=BNBBTC&limit=' + n )

        let result = await request.get('https://www.binance.com/api/v1/depth?symbol=' + pair.toUpperCase())


        // check how the bids and asks are ordered
        // let bids = exchangeOrderbook[market].bids
        // let asks = exchangeOrderbook[market].asks

        // isBidsDescending = isDescending(bids)
        // isAsksDescending = isDescending(asks)

        // getOrderbookNum += 1
        // log.debug(tag, 'getOrderbookNum````````', getOrderbookNum)

        return result

    } catch (e) {
        log.error('err: ', e)
    }
}

function formatPairForBinance (market) {
    let tag = TAG + ' |formatPairForBinance | ' + market

    try {
        pair = market.split('_').join('')
        return pair
    } catch (e) {
        log.error(tag, e)
    }
}

function processWsQueForExchangeBook (wsEventQue, exchangeBook) {
    let tag = TAG + ' |processWsQueForExchangeBook| '
    let wsUpdate

    try {
        while (wsEventQue.length > 0) {
            wsUpdate = wsEventQue.shift()

            log.debug(tag, ' wsUpdate ', wsUpdate)

            if (wsUpdate.u > exchangeBook.lastUpdateId) {
                log.debug(tag, '--------- processWsQueForExchangeBook -------------------')

                let bids = replayWsEvents(wsUpdate.b, exchangeBook.bids, 'bid')
                let asks = replayWsEvents(wsUpdate.a, exchangeBook.asks, 'ask')

                exchangeBook.bids = bids
                exchangeBook.asks = asks

                exchangeBook.lastUpdateId = wsUpdate.u
                log.debug(tag, 'lastUpdateId', exchangeBook.lastUpdateId)
            }
        }

        return exchangeBook
    } catch (e) {
        log.error(tag, e)
    }
}

function updateOrderQty(qty, coinBal) {
    let tag = TAG + '| updateOrderQty |'

    try {
        // todo fix this ??
        // if(qty > coinBal) {
        //     qty = coinBal
        //     coinBal = 0
        // } else {
        //     coinBal -= qty
        // }

        qty = Big(qty)
        coinBal = Big(coinBal)

        log.debug(tag, ' --- BEFORE COMPARING ---', 'qty', qty.toString())
        log.debug(tag, ' --- BEFORE COMPARING ---', 'coinBal', coinBal.toString())

        if(qty.gte(coinBal)) {
            qty = coinBal
            coinBal = 0
        } else {
            coinBal = coinBal.minus(qty)
        }


        log.debug(tag, '----- AFTER COMPARING --- ', 'qty', qty.toString())
        log.debug(tag, '----- AFTER COMPARING --- ', 'coinBal', coinBal.toString())

        qty = qty.toString()
        coinBal = coinBal.toString()

        return {
            qty,
            coinBal
        }
    } catch (e) {
        log.error(tag, e)
    }
}

function formatNumber (rate) {
    // for non-integer
    if(rate.indexOf('.') >= 0) {
        let rateArr = rate.split('.')
        let rateWholeNum = rateArr[0]
        let rateDecimalStr = rateArr[1]

        let rateDecimalArr = rateDecimalStr.split('')


        let length_rate = rateDecimalArr.length

        if(length_rate === 8)
        {
            return rate
        }
        else if(length_rate > 8) {
            let ninethDec = rateDecimalArr[8]

            if(ninethDec >= 5) {
                let result = Big(rate).toFixed(8)
                let result1 = Big(result)
                result1 = result1.minus(0.00000001).toString()

                // let length_result1 = result1.split('').length

                let result1Arr = result1.split('.')
                let result1WholeNum = result1Arr[0]
                let result1DecimalStr = result1Arr[1]

                let result1DecimalArr = result1DecimalStr.split('')
                let length_resultDecimal = result1DecimalArr.length

                if(length_resultDecimal < 8) {
                    let numOfTrailingZeros = 8 - length_resultDecimal
                    let trailingZeros = '0'

                    while (numOfTrailingZeros - 1) {
                        numOfTrailingZeros -= 1

                        trailingZeros += '0'
                    }

                    return result1 + trailingZeros
                }
                else {
                    return result1
                }
            }
            else {
                return Big(rate).toFixed(8)
            }
        }
        // length < 8
        else {
            let numOfTrailingZeros = 8 - length_rate
            let trailingZeros = '0'

            while (numOfTrailingZeros - 1) {
                numOfTrailingZeros -= 1

                trailingZeros += '0'
            }

            return rate + trailingZeros
        }
    }
    // for integer
    else {
        // check if there is '.'
        if(rate.indexOf('.') >= 0) {
            log.error('Something went wrong... this is supposed to be an integer, but it has decimal...')
        }

        // supposedly this is an integer since there's no '.'

        let numOfTrailingZeros = 8
        let trailingZeros = '.00000000'

        return rate + trailingZeros

    }
}

// only one side of the book
function  createNewLaOrders (market, type, orders, coinBal, minAmount, isFirstTime) {
    let tag = TAG + ' |createNewLaOrders | ' + market

    log.debug(tag, market, type, coinBal, minAmount)

    try
    {
        let newBook = []

        // it will be divided among the number of baseCoins or the number of markets so let's say when user wants
        // to do LTC -> BTC, then we'll have enough BTC amount for the LTC_BTC market
        // todo update

        // if (isFirstTime && type == 'bid') coinBal = coinBal / marketArr.length



        let {baseCoin, quoteCoin}= getCoinNames(market)
        let theCoin = type === 'bid'
            ? quoteCoin
            : baseCoin


        for (let i = 0; i < orders.length; i++)
        {
            let order = orders[i]
            let [rate, qty] = order

            coinBal = Big(coinBal)


            log.debug(tag, 'order', order)


            rate = Big(rate)
            rate = rate.plus(liquidityBuffer)

            log.debug(tag, type, 'qty', qty)

            if (type == 'bid') {
                qty = rate.times(qty)

                log.debug(tag, 'bid', 'qty', qty.toString())
                log.debug(tag, 'bid', 'coinBal', coinBal.toString())

                if ( qty.gte(minAmount ) && coinBal.gte(minAmount))
                {
                    let result = updateOrderQty(qty.toString(), coinBal.toString())

                    qty = result.qty
                    coinBal = result.coinBal

                    log.debug(tag, 'bid', 'qty', qty)
                    log.debug(tag, 'bid', 'coinBal', coinBal)

                    qty = Big(qty)

                    qty = qty.div(rate)

                    qty = formatNumber(qty.toString())
                    rate = formatNumber(rate.toString())

                    newBook.push([rate, qty])

                }


            }
            // asks
            else
            {
                qty = Big(qty)

                if ( qty.gte(minAmount) && coinBal.gte(minAmount)) {

                    let result = updateOrderQty(qty.toString(), coinBal.toString())

                    qty = result.qty
                    coinBal = result.coinBal

                    log.debug(tag, 'ask', 'qty', qty)
                    log.debug(tag, 'ask', 'coinBal', coinBal)
                    log.debug(tag, 'blahhh', 'ask', 'qty', qty)
                    log.debug(tag, 'blahhh', 'ask', 'coinBal', coinBal)

                    qty = formatNumber(qty)
                    rate = formatNumber(rate.toString())

                    newBook.push([rate, qty])

                }

            }

            log.debug(tag, 'coinBal', coinBal.toString())
            log.debug('-------------------------------------------------')
            if (coinBal <= minAmount) {
                log.debug(tag, 'coinBal <= minAmount, newBook', newBook)
                return newBook
            } else if (i == orders.length - 1) {
                log.debug('There is more coinBal than the book', "i: ", i)
                log.debug('newBook:', newBook)
                return newBook
            }
        }

        // this is the case where there's no newBook since the qty in each orders in the bids side are
        // less than the minAmount
        return []

    } catch (e) {
        log.error(tag, e)
    }
}


//  replayWsEvents
function replayWsEvents (wsOrders, exchangeOrders, type) {
    let tag = TAG + ' |replayWsEvents| '
    let laOrders = []
    try {
        let matchedIndex

        // log.debug(tag, wsOrders)
        for (let i = 0; i < wsOrders.length; i++) {

            let wsOrder = wsOrders[i]
            let wsOrderRate = wsOrder[0]
            let wsOrderQty = wsOrder[1]

            wsOrderRate = Number(wsOrderRate)

            let findMatchedIndex = (exOrder) =>
            {
                let exOrderRate = exOrder[0]

                exOrderRate = Number(exOrderRate)

                return wsOrderRate == exOrderRate
            }
            matchedIndex = exchangeOrders.findIndex(findMatchedIndex)

            // delete or update order
            if (matchedIndex >= 0)
            {
                // update using splice

                // todo add this back in once fixed the precision
                // if (wsOrderQty == '0.00000000') {

                if (wsOrderQty == '0' || wsOrderQty == '0.00000000')
                {
                    exchangeOrders.splice(matchedIndex, 1)
                }

                else
                {
                    exchangeOrders.splice(matchedIndex, 1, wsOrder)
                    //log.debug('---------------------- UPDATE -------------------- on exchangeOrderbook[market], wsOrder', wsOrder)
                }
            }
            // add order
            else
            {
                if (type == 'bid')
                {
                    for (let j = 0; j < exchangeOrders.length; j++)
                    {
                        let eBidRate = exchangeOrders[j][0]

                        eBidRate = Number(eBidRate)

                        if (wsOrderRate > eBidRate && wsOrder[1] != '0.00000000')
                        {
                            exchangeOrders.splice(j, 0, wsOrder)
                            //log.debug("------------------------- ADD----------------------------- bid, wsOrder:", wsOrder)
                            break
                        }
                    }
                } else
                {
                    for (let j = 0; j < exchangeOrders.length; j++)
                    {
                        let eBidRate = exchangeOrders[j][0]

                        eBidRate = Number(eBidRate)

                        if (wsOrderRate < eBidRate && wsOrder[1] != '0.00000000')
                        {
                            exchangeOrders.splice(j, 0, wsOrder)
                            //log.debug("------------------------- ADD----------------------------- ask, wsOrder:", wsOrder)
                            break
                        }
                    }
                }
            }

        }

        return exchangeOrders

    } catch (e) {
        log.error(tag, e)
    }
}

let tempNum = 0

// for new order
function publishNewOrder (market, type, qty, rate) {
    let tag = TAG + ' | publishNewOrder | ' + market
    let orderId = uuid.v4()
    try {
        arbiter.limitSocket(orderId,market,qty,rate,type)
        // arbiter.limit(orderId,market,qty,rate,type)
        log.info('########## published NEW    ###########', market, type, rate, qty, orderId)

        return orderId
    } catch (e) {
        log.error(tag, e)
    }
}

// for cancel order
function publishCancelOrder (market, type, orderId) {
    let tag = TAG + '| publishCancelOrder |' + market

    try {
        let now = new Date().getTime()

        let event = {
            time: now,
            event: 'cancel',
            orderId: orderId,
            type: type,
            market: market
        }
        arbiter.cancelSocket(orderId)
        // // arbiter.cancel(orderId)
        log.info('########## published CANCEL ###########', market, type, event.orderId)

        log.info('just cancelled...')
    } catch (e) {
        log.error(tag, e)
    }
}

async function queryBtcMarketBal (market) {
    let tag = TAG + ' | queryBtcMarketBal | ' + market
    try {
        market = market.toUpperCase() 

        log.debug(tag, 'market', market)
        
        let result = await redis.hget('laBtcPerMarketBalances', market)

        log.debug(tag, 'result', result)

        if(result == null)  throw new Error('Coin is not in laCoinBalances or it could be other issues')

        
        
        return result
    } catch (e) {
        log.error(tag + e)
    }    
}


async function queryCoinBal (coin) {
    let tag = TAG + ' | queryCoinBal | ' + coin
    try {
        coin = coin.toUpperCase()

        log.debug(tag, 'coin', coin)
        
        let result = await redis.hget('laCoinBalances', coin)
 
        log.debug(tag, 'result', result)

        if(result == null)  throw new Error('Coin is not in laCoinBalances or it could be other issues')

        return result
    } catch (e) {
        log.error(tag + e)
    }
}

function getCoinNames (pair) {
    let tag = TAG + ' | getCoinNames | ' + pair

    log.debug(tag, 'pair', pair)
    try {
        pair = pair.split('_')
        let baseCoin = pair[0]
        let quoteCoin = pair[1]

        log.debug(tag, 'baseCoin', baseCoin)
        log.debug(tag, 'quoteCoin', quoteCoin)

        return {
            baseCoin,
            quoteCoin
        }
    } catch (e) {
        log.error(tag, e)
    }
}


function delay(market, type, submitArr, futureNewArr) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            publishDiff(market, type, submitArr, futureNewArr)
            resolve()
        }, 50) // 500ms is arbitrary, can be tweaked later
    })
}


function delayBeforePublishNew(market, type, submitArr, futureNewArr) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            publishDiff(market, type, submitArr, futureNewArr)
            resolve()
        }, 50) // 500ms is arbitrary, can be tweaked later
    })
}

// get LA's orders
async function getOrderBookFromArbiter (market) {
    let tag = TAG + ' |getOrderBookFromArbiter| '

    let orderBookFromArbiter = await arbiter.orders()


    let laOrderbookCurrent = {}
    laOrderbookCurrent.bids = []
    laOrderbookCurrent.asks = []

// filter orderBookFromArbiter for the market
    orderBookFromArbiter = orderBookFromArbiter.filter(order =>
    {
        return order.market == market
    })

    if (orderBookFromArbiter && orderBookFromArbiter.length > 0)
    {
        orderBookFromArbiter.forEach(order =>
        {
            if (order.type == 'bid')
            {
                laOrderbookCurrent.bids.push([order.price, order.quantity, order.orderId])
            } else
            {
                laOrderbookCurrent.asks.push([order.price, order.quantity * (-1), order.orderId])
            }
        })
    }

    // log.debug(tag, 'laOrderbookCurrent.bids', market, laOrderbookCurrent.bids)
    // log.debug(tag, 'laOrderbookCurrent.asks', market, laOrderbookCurrent.asks)
    return laOrderbookCurrent
}

// replay ws orders into initialBook to get finalBook
function replayWs (wsOrders, currentBook, type) {
    let tag = TAG + ' |replayWs| '
    try {
        let matchedIndex
        for (let i = 0; i < wsOrders.length; i++) {
            let wsOrder = wsOrders[i]
            let wsOrderRate = wsOrder[0]
            let wsOrderQty = wsOrder[1]

            matchedIndex = currentBook.findIndex(exOrder => {
                let exOrderRate = exOrder[0]
                return wsOrderRate == exOrderRate
            })

            // delete or update order
            if (matchedIndex >= 0) {
                // update using splice
                if (wsOrderQty == '0.00000000') {
                    initialBook.splice(matchedIndex, 1)
                    log.debug('---------------------- DELETE ------------------- from currentBook[market], wsOrder', wsOrder)
                } else {
                    initialBook.splice(matchedIndex, 1, wsOrder)
                    log.debug('---------------------- UPDATE -------------------- on currentBook[market], wsOrder', wsOrder)
                }
            }
            // add order
            else {
                if (type == 'bid') {
                    for (let j = 0; j < initialBook.length; j++) {
                        let eBidRate = initialBook[j][0]

                        if (wsOrderRate > eBidRate && wsOrder[1] != '0.00000000') {
                            initialBook.splice(j, 0, wsOrder)
                            log.debug('------------------------- ADD----------------------------- bid, wsOrder:', wsOrder)
                            break
                        }
                    }
                } else {
                    for (let j = 0; j < initialBook.length; j++) {
                        let eBidRate = initialBook[j][0]

                        if (wsOrderRate < eBidRate && wsOrder[1] != '0.00000000') {
                            initialBook.splice(j, 0, wsOrder)
                            log.debug('------------------------- ADD----------------------------- ask, wsOrder:', wsOrder)
                            break
                        }
                    }
                }
            }
        }

        // this is actually the finalBook since the ws has been replayed
        return initialBook

    } catch (e) {
        log.error(tag, e)
    }
}

// diffArr between two books
function getDiff (newArr, oldArr) {
    let tag = TAG + ' |getDiff | '

    try {
        let newO
        let newORate
        let newOQty
        let oldO
        let oldORate
        let oldOQty
        let diffOrder
        let diffArr = []
        let futureNewArr = []

        for (let i = 0; i < newArr.length; i++)
        {
            newO = newArr[i]
            newORate = newO[0]
            newOQty = newO[1]
            let orderProcessed = false

            for (let j = 0; j < oldArr.length; j++)
            {
                oldO = oldArr[j]
                oldORate = oldO[0]
                oldOQty = oldO[1]

                if (newORate == oldORate)
                {
                    // same order
                    if (newOQty == oldOQty)
                    {
                        // splice returns an array of splice item
                        let sameO = oldArr.splice(j, 1)
                        sameO = sameO.shift()
                        futureNewArr.push(sameO)
                        orderProcessed = true
                        break
                    }
                    // update order
                    else {
                        diffOrder = oldArr.splice(j, 1)
                        diffArr.push(['cancel', oldO])
                        diffArr.push(['submit', newO])
                        orderProcessed = true
                        break
                    }
                }
            }

            // no match, it's a new order
            // log.debug('i', i, 'newO', newO)
            if (orderProcessed == false) diffArr.push(['submit', newO])
        }
        // remaining oldArr would be orders to be deleted
        if (oldArr.length > 0) {
            oldArr.forEach(oldO => {
                diffArr.push(['cancel', oldO])
            })
        }

    return {
            diffArr: diffArr,
            futureNewArr: futureNewArr
        }
    } catch (e) {
        log.error(tag, e)
    }
}

function publishDiff (market, type, diffArr, futureArr) {
    let tag = TAG + ' | publishDiff | ' + market

    try
    {
        diffArr.forEach(order =>
        {
            let rate = order[1][0]
            let qty = order[1][1]
            let eventType = order[0]
            let orderId

            switch (eventType)
            {
                case 'submit':
                    orderId = publishNewOrder(market, type, qty, rate)
                    order[1].push(orderId)
                    futureArr.push(order[1])
                    break

                case 'cancel':
                    orderId = order[1][2]
                    publishCancelOrder(market, type, orderId)
                    break

                default:
                    log.error('unhandled event: ', eventType)
            }
        })

        return futureArr
    } catch (e) {
        log.error(tag, e)
    }

}

function delayBeforePublishNew(market, submitArrAll) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            submitArrAll.forEach(order => {
                let type = order[1][2]
                let qty = order[1][1]
                let rate = order[1][0]
                log.debug('----- ### submitArrAll order:', order)
                publishNewOrder(market, type, qty, rate)
            })

            resolve()

        }, 50) // 50ms is arbitrary, can be tweaked later
    })
}

function getMinAmount(coin) {
    let minAmount
    switch (coin)
    {
        case 'BTC':
            minAmount = 0.001
            break
        case 'LTC':
            minAmount = 0.001
            break
        case 'ETH':
            minAmount = 0.01
            break
        case 'GNT':
            minAmount = 10
            break
        default:
            minAmount = 1
            break
    }

    return minAmount
}

function createCancelArrAllAndSubmitArrAll (market, ordersNew, ordersCurrent, hotBal, minAmount, type, isFirstTime) {
    try
    {
        let tag = TAG + ' |createCancelArrAllAndSubmitArrAll| '
        let cancelArr = []
        let submitArr = []

        log.debug(tag, 'type', type)
        log.debug(tag, 'hotBal', hotBal)
        log.debug(tag, 'minAmount', minAmount)

        if (hotBal >= minAmount)
        {
            ordersNew = createNewLaOrders(market, type, ordersNew, hotBal, minAmount, isFirstTime)

            log.debug('ordersNew', type, ordersNew)

            if (ordersNew.length <= 0)
            {

            }

            let {diffArr, futureNewArr}= getDiff(ordersNew, ordersCurrent)

            log.debug('***** diffArr ******', type, diffArr)


            diffArr.forEach(order =>
            {
                if (order[0] == 'cancel')
                {
                    order[1].push(type)         // ['cancel', ['rate', 'qty', 'orderId', type]]
                    cancelArr.push(order)
                } else
                {
                    order[1].push(type)
                    submitArr.push(order)
                }
            })

            return {
                orders: ordersNew,
                cancelArr,
                submitArr
            }
        }

        log.debug('No new orders...', type)

        return {
            orders: ordersCurrent,
            cancelArr,
            submitArr
        }
    } catch (e) {
        log.error(tag, e)
    }
}

async function createOrdersAndPublish (market, ordersNew, ordersCurrent, quoteCoinHotBal, baseCoinHotBal, isFirstTime) {
    let cancelArrAll = []
    let submitArrAll = []
    let finalOrders = {}

    let { baseCoin, quoteCoin } = getCoinNames(market)

    // ordersNew and ordersCurrent have both bids and asks
    let minBaseAmount = getMinAmount(baseCoin)
    let minQuoteAmount = getMinAmount(quoteCoin)

    let { orders, cancelArr, submitArr }= createCancelArrAllAndSubmitArrAll (market, ordersNew.bids, ordersCurrent.bids, quoteCoinHotBal, minQuoteAmount, 'bid', isFirstTime)
    finalOrders.bids = orders
    cancelArrAll = cancelArr
    submitArrAll = submitArr

    let result = createCancelArrAllAndSubmitArrAll (market, ordersNew.asks, ordersCurrent.asks, baseCoinHotBal, minBaseAmount, 'ask', isFirstTime)
    finalOrders.asks = result

    result.cancelArr.forEach(order => {
        cancelArrAll.push(order)
    })

    result.submitArr.forEach(order => {
        submitArrAll.push(order)
    })

    // ['cancel', ['rate', 'qty', 'orderId', type]]
    cancelArrAll.forEach(order => {
        let type = order[1][3]
        let orderId = order[1][2]
        log.debug('----- ### cancelArrAll order:', order)
        publishCancelOrder(market, type, orderId)
    })

    await delayBeforePublishNew(market, submitArrAll)

    return finalOrders

}
