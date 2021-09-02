const TAG = '| orderBook |'
const log = require('@arbiter/dumb-lumberjack')()
const WebSocket = require('ws')
const Big = require('big.js')
const laAccount = process.env['AGENT_BTC_MASTER']
const helper = require('./orderBookHelper')
let laOrderBookCurrent_ws = {
    bids: [],
    asks: []
}

let laBal = {}
let marketGlobal

let openSocket = require('socket.io-client')
process.env.REACT_APP_API_HOST = process.env['ARBITER_URL']
const  socket = openSocket(process.env.REACT_APP_API_HOST,{reconnect: true, rejectUnauthorized: false});
// log.debug("SOCKET HOST: ",process.env.REACT_APP_API_HOST)

let baseCoinName
let quoteCoinName
let socketIoQue = []
let laAccountMarket

let config = require('dotenv').config()

let marketArr = config.MARKETS
    ? config.MARKETS
    : ['LTC_BTC', 'ETH_BTC']


let exchangeBookLocal
let isFirstTime = false

module.exports = {
    start,
    main
}

function start (state) {
    let tag = TAG + '| start |'
    try
    {
        log.info('--- Starting LA for ' + state.market + '---')
        setTimeout(async () => {
            await setupWs(state)
        }, 10000)

        setTimeout(() =>
        {
            main(state)

            socketOn(laAccountMarket)

        }, 15000)

        log.debug(tag, 'laAccountMarket', laAccountMarket)


    } catch (e) {
        console.error(tag, e)
    }
}


async function main (state) {
    let tag = TAG + ' |main| '
    try
    {
        isFirstTime = true

        // log.debug(tag, 'state', state)

        let {market, wsEvent, process} = state

        process.isRunning = true


        let wsEventQue = wsEvent.queue

        marketGlobal = market

        laAccountMarket = laAccount + ':' + marketGlobal

        log.debug('laAccountMarket', laAccountMarket)

        // clearOutData request
        await helper.clearOutData(market)

        let result = await helper.getExchangeOrderBook(market)

        // log.debug(tag, 'getExchangeOrderBook result', result.body.bids.length, result.body.asks.length)

        if (wsEventQue.length > 0 && result.body) {
            exchangeBookLocal = helper.processWsQueForExchangeBook(wsEventQue, result.body)
            // log.debug(tag, 'exchangeBookLocal', exchangeBookLocal.bids.length, exchangeBookLocal.asks.length)

        }

        let {baseCoin, quoteCoin}= helper.getCoinNames(market)

        baseCoinName = baseCoin
        quoteCoinName = quoteCoin

        laBal[quoteCoin] = Big(0)
        laBal[baseCoin] = Big(0)

        log.debug(tag, 'la[quoteCoin]', 'quoteCoin', quoteCoin, 'la[quoteCoin]', laBal[quoteCoin].toString())
        log.debug(tag, 'la[quoteCoin]', 'baseCoin', baseCoin, 'la[baseCoin]', laBal[baseCoin].toString())


        let quoteCoinBal = await helper.queryCoinBal(quoteCoin)
        let baseCoinBal = await helper.queryCoinBal(baseCoin)

        log.debug(tag, 'quoteCoinBal', quoteCoinBal)
        log.debug(tag, 'baseCoinBal', baseCoinBal)

        // bids
        let bids = exchangeBookLocal.bids

        //TODO multi-coin mins
        //TODO move this to configs!!!!
        let minAmountQuote
        switch (quoteCoin)
        {
            case 'BTC':
                minAmountQuote = 0.001
                break
            case 'LTC':
                minAmountQuote = 0.001
                break
            case 'ETH':
                minAmountQuote = 0.01
                break
            case 'GNT':
                minAmountQuote = 10
                break
            default:
                minAmountQuote = 1
                break
        }

        if (quoteCoinBal >= minAmountQuote)
        {
            //                              market, type, orders, coinBal, minAmount, isFirstTime
            bids = helper.createNewLaOrders(market, 'bid', bids, quoteCoinBal, minAmountQuote, isFirstTime)

            bids.forEach( order => {
                let rate = order[0]
                let qty = order[1]
                let orderId = helper.publishNewOrder(market, 'bid', qty, rate)
                order.push(orderId)      // [rate, qty, orderId]
            })
        }

        //TODO move this to configs!!!!
        let minAmountBase
        switch (baseCoin)
        {
            case 'BTC':
                minAmountBase = 0.001
                break
            case 'LTC':
                minAmountBase = 0.001
                break
            case 'ETH':
                minAmountBase = 0.01
                break
            case 'GNT':
                minAmountBase = 10
                break
            default:
                minAmountBase = 1
                break
        }

        // asks
        let asks = exchangeBookLocal.asks

        if (baseCoinBal >= minAmountBase)
        {
            //                              market, type, orders, coinBal, minAmount, isFirstTime
            asks = helper.createNewLaOrders(market, 'ask', asks, baseCoinBal, minAmountBase, isFirstTime)

            asks.forEach( order => {
                let rate = order[0]
                let qty = order[1]
                let orderId = helper.publishNewOrder(market, 'ask', qty, rate)
                order.push(orderId)     // [rate, qty, orderId]
            })
        }

        isFirstTime = false
        process.isRunning = false
        process.finishedFirstRound = true

        return {
            bids,
            asks
        }
    } catch (e) {
        log.error(tag, e)
    }

}

let tempCount = 0

// setupWs
//  start ws
//  wsEventQue
async function setupWs (state) {
    try {
        let {market, wsEvent, process} = state

        let getMoreOrders = false


        let wsEventQue = wsEvent.queue
        log.debug('setupWs ---',  market)
        let tag = TAG + ' |setup| ' + market

        marketGlobal = market

        laAccountMarket = laAccount + ':' + marketGlobal

        log.info('laAccountMarket', laAccountMarket)


        let pair = formatPairForBinance(market)
        let pairLowerCase = pair.toLowerCase()

        // todo to be removed, temp, for testing
        let wsEventCount = 0

        // start ws
        const ws = new WebSocket('wss://stream.binance.com:9443/ws/' + pairLowerCase + '@depth', {
            perMessageDeflate: false
        })

        ws.on('close', function close() {
            log.info('More than 20 wsEvent not being processed. Stucked... ws disconnected');
        });


        ws.on('message', async function incoming(data) {

            // temp
            // tempCount += 1

            // if(tempCount > 20)  
            //     ws.terminate()


            log.debug('ws data: ', data)
            data = JSON.parse(data)

            // log.debug(tag, ' -------------------  WS EVENT COMES IN ----------------------------------------------  wsEventQue.length', wsEventQue.length)

            if(process.finishedFirstRound == true) {
                if(process.isRunning == true) {
                    log.debug(tag, 'process.isRunning', process.isRunning)
                    wsEventQue.push(data)
                    log.debug(tag, '-------------------- QUE PUSHING IN DATA ----------------------------------------------  wsEventQue.length', wsEventQue.length, data)

                    if(wsEventQue.length >= 20)
                        ws.terminate()

                } else {
                    process.isRunning = true


                    log.debug(' process.finishedFirstRound', process.finishedFirstRound)
                    log.debug(' SET -------- process.isRunning', process.isRunning)


                    let id
                    let laBids
                    let laAsks

                    // todo move these two lines down to the respective spot where the process or wsEvent isRunning
                    // todo experiment with which gets priority, ws event or code that's running
                    // todo may want to move the get orderBookFromArbiter call to a different node
                    //  process and store in database


                        wsEventQue.push(data)
                        // log.debug('--------------  PROCESS  EVENT | ADDED EVENT INTO QUE  -------------------- wsEventQue.length:', wsEventQue.length)


                        // get laBookFromArbiter
                        // let laOrderBookCurrent = await helper.getOrderBookFromArbiter(market)

                    log.debug('laOrderBookCurrent_ws ##########', laOrderBookCurrent_ws)


                    // if(laOrderBookCurrent_ws.bids.length > 0 && laOrderBookCurrent_ws.asks.length > 0) {

                        laOrderBookCurrent_ws.bids.sort((a, b) => {return Number(b[0]) - Number(a[0])})
                        laOrderBookCurrent_ws.asks.sort((a, b) => {return Number(a[0]) - Number(b[0])})

                        log.debug('PROCESS EVENT --- after sorted laOrderBookCurrent_ws.bids --------------', laOrderBookCurrent_ws.bids)
                        log.debug('PROCESS EVENT --- after sorted laOrderBookCurrent_ws.asks --------------', laOrderBookCurrent_ws.asks)


                        // let laOrderBookToBeProcessed = JSON.parse(JSON.stringify(laOrderBookCurrent_ws))


                        // log.debug('wsEventQue.length', wsEventQue.length)

                        if(laOrderBookCurrent_ws.bids.length == 0 && laOrderBookCurrent_ws.asks.length == 0) {
                            // log.debug('wsEventQue', wsEventQue)
                        }


                        let laOrderBookNew
                        // replayWsQue
                        if(getMoreOrders == false) {
                            let wsEventQueCopy = JSON.parse(JSON.stringify(wsEventQue))

                            exchangeBookLocal = helper.processWsQueForExchangeBook(wsEventQue, exchangeBookLocal)

                            if (exchangeBookLocal.bids.length <= 0 || exchangeBookLocal.asks.length <= 0) {
                                log.debug(' ------------------- exchangeBookLocal.bids or exchangeBookLocal.asks has ZERO length --------------------')
                                log.debug('exchangeBookLocal.bids.length', exchangeBookLocal.bids.length, 'exchangeBookLocal.asks.length', exchangeBookLocal.asks.length)


                                getMoreOrders = true
                                log.debug(' ^^^^^^^^ SET getMoreOrders ^^^^^^^^')

                                log.debug(' ------------------------ !!! GET MORE ORDERS, IN PROCESS EVENT  exchangeBookLocal.bids.length <= 0 || exchangeBookLocal.asks.length <= 0!!! -----------------------')


                                let exchangeOrderBook = await helper.getExchangeOrderBook(market)
                                exchangeBookLocal = helper.processWsQueForExchangeBook(wsEventQueCopy, exchangeOrderBook.body)

                                getMoreOrders = false
                                log.debug(' ^^^ RESET getMoreOrders ^^^')
                            }

                        } else {

                            log.debug(' ------------------------ !!! GET MORE ORDERS, IN PROCESS EVENT !!! -----------------------')

                            let exchangeOrderBook = await helper.getExchangeOrderBook(market)
                            exchangeBookLocal = helper.processWsQueForExchangeBook(wsEventQue, exchangeOrderBook.body)

                            getMoreOrders = false
                            log.debug(' ^^^ RESET getMoreOrders ^^^')
                        }


                        // query hotBal
                        let { baseCoin, quoteCoin } = helper.getCoinNames(market)

                        // let baseCoinHotBal = await helper.queryCoinBal(baseCoin)
                        // let quoteCoinHotBal = await helper.queryCoinBal(quoteCoin)
                        let baseCoinHotBal = laBal[baseCoin]
                        let quoteCoinHotBal = laBal[quoteCoin]

                        // log.debug('baseCoin', baseCoin)
                        // log.debug('quoteCoin', quoteCoin)

                        log.debug('baseCoinHotBal', baseCoinHotBal.toString())
                        log.debug('quoteCoinHotBal', quoteCoinHotBal.toString())

                        // if(baseCoinHotBal == NaN)     throw new Error('No baseCoinHotBal,', baseCoin)
                        // if(quoteCoinHotBal == NaN)    throw new Error('No quoteConHotBal,', quoteCoin)


                        // baseCoinHotBal = Number(baseCoinHotBal)
                        // quoteCoinHotBal = Number(quoteCoinHotBal)
                        // baseCoinHotBal = Big(baseCoinHotBal)
                        // quoteCoinHotBal = Big(quoteCoinHotBal)

                        // get total hotBal
                        // get total balance for baseCoin

                        // let baseCoinHotBalInExistingOrders = 0
                        // let quoteCoinHotBalInExistingOrders = 0
                        let baseCoinHotBalInExistingOrders = Big(0)
                        let quoteCoinHotBalInExistingOrders = Big(0)

                        // log.debug('baseCoinHotBalInExistingOrders', baseCoinHotBalInExistingOrders.toString())
                        // log.debug('quoteCoinHotBalInExistingOrders', quoteCoinHotBalInExistingOrders.toString())

                        // log.debug(tag, 'laOrderBookCurrent_ws.bids', laOrderBookCurrent_ws.bids)

                        // log.debug(tag, 'laOrderBookCurrent_ws.asks', laOrderBookCurrent_ws.asks)


                        laOrderBookCurrent_ws.asks.forEach(order => {
                            // baseCoinHotBalInExistingOrders += Number(order[1])

                            // log.debug('order', order)
                            // log.debug('order[0]', order[0])
                            // log.debug('order[1]', order[1])
                            // log.debug('order[2]', order[2])

                            baseCoinHotBalInExistingOrders = baseCoinHotBalInExistingOrders.plus(order[1])
                        })

                        laOrderBookCurrent_ws.bids.forEach(order => {
                            // quoteCoinHotBalInExistingOrders += Number(order[1]) * Number(order[0])

                            let rate = order[0]
                            rate = Big(rate)
                            let qty = order[1]
                            quoteCoinHotBalInExistingOrders = quoteCoinHotBalInExistingOrders.plus(rate.times(qty))
                        })

                        // log.debug('baseCoinHotBalInExistingOrders', baseCoinHotBalInExistingOrders.toString())
                        // log.debug('quoteCoinHotBalInExistingOrders', quoteCoinHotBalInExistingOrders.toString())


                        let baseCoinHotBalTotal = baseCoinHotBal.plus(baseCoinHotBalInExistingOrders)


                        let quoteCoinHotBalTotal = (quoteCoinHotBal.plus(quoteCoinHotBalInExistingOrders)).div(marketArr.length)

                        log.debug('baseCoinHotBalTotal', baseCoinHotBalTotal.toString())
                        log.debug('quoteCoinHotBalTotal', quoteCoinHotBalTotal.toString())

                        // if ( baseCoinHotBalInExistingOrders <=  baseCoinHotBalTotal * 0.5 || quoteCoinHotBalInExistingOrders <= quoteCoinHotBalTotal * 0.5) {

                        // check when baseCoinHotBalTotal < localExchangeBookTotalQty * 0.5
                        //            quoteCoinHotBalTotal < localExchangeBookTotalQty * 0.5
                        let localExchangeBookBaseCoinTotalQty = Big(0)
                        let localExchangeBookQuoteCoinTotalQty = Big(0)


                        exchangeBookLocal.bids.forEach(bid => {
                            let rate = Big(bid[0])
                            let qty = rate.times(bid[1])

                            localExchangeBookQuoteCoinTotalQty = localExchangeBookQuoteCoinTotalQty.plus(qty)
                        })

                        exchangeBookLocal.asks.forEach(ask => {
                            localExchangeBookBaseCoinTotalQty = localExchangeBookBaseCoinTotalQty.plus(ask[1])
                        })
/*
                        log.debug('baseCoinHotBalTotal', baseCoinHotBalTotal.toString())
                        log.debug('quoteCoinHotBalTotal', quoteCoinHotBalTotal.toString())
                        log.debug('localExchangeBookBaseCoinTotalQty', localExchangeBookBaseCoinTotalQty.toString())
                        log.debug('localExchangeBookQuoteCoinTotalQty', localExchangeBookQuoteCoinTotalQty.toString())
*/

                        if ( baseCoinHotBalTotal.gte(localExchangeBookBaseCoinTotalQty.times(0.3)) || quoteCoinHotBalTotal.gte(localExchangeBookQuoteCoinTotalQty.times(0.3))) {
                            getMoreOrders = true
                            log.debug(' ^^^^^^^^ SET getMoreOrders ^^^^^^^^')
                        }

                        let laOrderBookCurrent_ws_copy = JSON.parse(JSON.stringify(laOrderBookCurrent_ws))

                        laOrderBookNew = await helper.createOrdersAndPublish(market, exchangeBookLocal, laOrderBookCurrent_ws_copy, quoteCoinHotBalTotal.toString(), baseCoinHotBalTotal.toString(), isFirstTime)

                        process.isRunning = false

                        log.debug('process.finishedFirstRound', process.finishedFirstRound)
                        log.debug(' RESET -------- process.isRunning', process.isRunning)

                }
            }
            // for in the beginnning when process.finishedFirstRound = false
            else {
                wsEventQue.push(data)

            }

        })
    } catch (e) {
        log.error(tag, e)
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

// bids is ordered high to low
// asks is ordered high to low
function addOrder (currentOrders, order) {
    // let isInBook = isOrderInCurrentOrders(currentOrders, order)

    // if(isInBook) return currentOrders

    if(order.isBuy === true) {
        currentOrders.bids.push([order.rate, order.quantity, order.orderId])
    } else {
        currentOrders.asks.push([order.rate, order.quantity, order.orderId])
    }

    return currentOrders
}

function isOrderInCurrentOrders (currentOrders, order) {
    if(order.isBuy === true) {
        for (let i = 0; i < currentOrders.bids.length; i++) {
            if (currentOrders.bids[i][2] === order.orderId ) {
                return true
            }
        }
    } else {
        for (let i = 0; i < currentOrders.asks.length; i++) {
            if (currentOrders.asks[i][2] === order.orderId ) {
                return true
            }
        }
    }

    return false
}

function removeOrder (currentOrders, orderId) {
    let tag = TAG + '| removeOrder |'

    // log.info(tag, 'currentOrders BEFORE--- currentOrders:', currentOrders)
    // log.info(tag, 'currentOrders BEFORE--- order:', order)

    for(let i = 0; i < currentOrders.bids.length; i++) {
        // log.debug('currentOrders.bids[i]', currentOrders.bids[i])
        if(orderId === currentOrders.bids[i][2]) {
            currentOrders.bids.splice(i, 1)
            log.debug(tag, 'BIDS removed order.orderId', orderId)
            break
        }
    }

    for(let i = 0; i < currentOrders.asks.length; i++) {

        // log.debug('currentOrders.asls[i]', currentOrders.asks[i])

        if(orderId === currentOrders.asks[i][2]) {
            currentOrders.asks.splice(i, 1)
            log.debug(tag, 'ASKS removed order.orderId', orderId)
            break
        }
    }

    log.debug(tag, 'currentOrders AFTER---', currentOrders)

    return currentOrders
}

function updateOrder (currentOrders, order) {
    let tag = TAG + '|updateOrder|'
    log.debug(tag, 'currentOrders', currentOrders)
    log.debug(tag, 'order', order)

    for(let i = 0; i < currentOrders.bids.length; i++) {
        if(order.orderId === currentOrders.bids[i][2]) {
            currentOrders.bids[i][1] = order.quantity
            break
        }
    }

    for(let i = 0; i < currentOrders.asks.length; i++) {
        if(order.orderId === currentOrders.asks[i][2]) {
            currentOrders.asks[i][1] = order.quantity
            break
        }
    }
    return currentOrders
    
}

function socketOn (laAccountMarket) {
    socket.on(laAccountMarket, data => {
        // socket.on(laAccount, data => {
            log.debug('on laAccount !!!!!! ------------- laOrderBookCurrent_ws', laOrderBookCurrent_ws)
        
            // log.debug('on laAccount !!!!!!  laAccount', laAccount)
            log.info('on laAccount !!!!!!!!!!!!!!! data:', data)
        
            if(!data.event)  throw new Error('Required event')
            if(!data.type)  throw new Error('Required type')
            if(!data.market)  throw new Error('Required market')
            if(data.hasOwnProperty('newBalanceAccount') === false)  throw new Error('Required newBalanceAccount')
            if(!data.orderId)  throw new Error('Required orderId')
            if(data.hasOwnProperty('isBuy') === false) throw new Error('Required isBuy')
            if(!data.coinIn)  throw new Error('Required coinIn')
            if(!data.coinOut)  throw new Error('Required coinOut')
        
        
            let event = data.event
            let type = data.type
            let orderId = data.orderId
            let market = data.market
            let newBal = data.newBalanceAccount 
            let isBuy = data.isBuy
        
            log.debug('newBal --------', newBal)
        
            // todo data should pass whether it's a bid or ask
            switch (type) {
                case 'submit':
        
                    tag = TAG + '|socket.on laAccount|' + '|submit|'
        
                    // check if it's the correct market
                    
                        if (newBal < 0) {
                            log.error(`LA balance is less than 0!!!`)
                            throw new Error('LA balance is less than 0')
                        } 
        
                        newBal = Big(newBal)
        
                        if(isBuy === true) {
                            laBal[quoteCoinName] = newBal
                        } else {
                            laBal[baseCoinName] = newBal
                        }
        
                        log.debug(tag, 'laOrderBookCurrent_ws', laOrderBookCurrent_ws)
                        log.debug(tag, 'marketGlobal', marketGlobal)
                        log.debug(tag, 'market', market)
        
                        //  log.debug(tag, 'laOrderBookCurrent_ws.bids', laOrderBookCurrent_ws.bids)
        
                        laOrderBookCurrent_ws = addOrder(laOrderBookCurrent_ws, data)
        
                     break
                case 'cancel':
                    // tag = tag + '|cancel|'
                    tag = TAG + '|socket.on laAccount|' + '|cancel|'
        
                        if (newBal < 0) {
                            log.error(`LA balance is less than 0!!!`)
                            throw new Error('LA balance is less than 0')
                        } 
        
                        newBal = Big(newBal)
        
                        if(isBuy === true) {
                            laBal[quoteCoinName] = newBal
                        } else {
                            laBal[baseCoinName] = newBal
                        }
        
                        log.debug(tag, 'marketGlobal', marketGlobal)
                        log.debug(tag, 'market', market)
        
                        laOrderBookCurrent_ws = removeOrder(laOrderBookCurrent_ws, orderId)
        
                     break
                case 'match':
                    // tag = tag + '|match|'
                    tag = TAG + '|socket.on laAccount|' + '|match|'
        
                    // newBal
                    newBal = Big(newBal)
        
                    // update balance for the coinOut since it's a match event
                    if(isBuy === true) {
                        // LA receives output coin, therefore, it's baseCoin bal would be updated
                        laBal[baseCoinName] = newBal
                    } else {
                        laBal[quoteCoinName] = newBal
                    }
        
        
                    log.debug(tag, 'laOrderBookCurrent_ws', laOrderBookCurrent_ws)
                    log.debug(tag, 'marketGlobal', marketGlobal)
                    log.debug(tag, 'market', market)
        
                    // if (marketGlobal === market) {
                    if(data.quantity == 0) {
                        laOrderBookCurrent_ws = removeOrder(laOrderBookCurrent_ws, orderId)
                    } else {
                        laOrderBookCurrent_ws = updateOrder(laOrderBookCurrent_ws, data)
                    }
        
                    break
            }

            log.info(tag, 'laOrderBookCurrent_ws', laOrderBookCurrent_ws)
            log.info('socket.on laAccount, submit, laBal[quoteCoinName]', laBal[quoteCoinName].toString() )
            log.info('socket.on laAccount, submit, laBal[baseCoinName]', laBal[baseCoinName].toString() )
        })
}