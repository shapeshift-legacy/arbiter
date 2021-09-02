
let uuid = require('node-uuid')
const proxyquire = require('proxyquire')
const rewire = require('rewire')
const moment = require('moment')
const clc = require('cli-color')
const util = require('../../modules/redis')
const redis = util.redis
const log = require('@arbiter/dumb-lumberjack')()

//require('dotenv').config({path:"../../../.env"})
require('dotenv').config()

let clock = null
let pair = 'ETH_BTC'
let debug = false
describe('Match Engine Data Module', function () {
    let engine
    let matchEngine
    let accounting
    // Does it exists
    beforeEach('Include accounting module', function () {
        const Accounting = require('@arbiter/arb-accounting')
        accounting = new Accounting(redis)
        expect(accounting).to.be.an('object')
    })

    beforeEach('Should be an object', function () {
        matchEngine = require('./../../modules/match.js')
        engine = matchEngine.createEngine(pair)
        expect(engine).to.be.an('object')
    })
    after(async function () {
        await (redis.flushdb())
    })

    it('submitBuyOrder', async function () {
        // make new UUID
        let idNew = uuid.v4()
        // fund order BTC
        accounting.credit(idNew, 3, 'BTC')
        let id = engine.submitOrder({ id: idNew, quantity: 3, price: 2.5 })
        expect(id).to.be.equal(idNew)

        let output = engine.getMarketData()
        if (debug) console.log('getMarketData: ', output)
        // expect(output.bids[0].orders[0].id).to.be.equal(idNew)
        // expect(output.bids[0].orders[0].qty).to.be.equal(3)
        let balance = await (accounting.balance(idNew, 'BTC'))
        expect(balance).to.be.equal(3)
        // await(redis.set("orderbook",JSON.stringify(output)))
        // let orderbook = await(redis.get("orderbook"))
        // console.log("**** ",orderbook) 333523fe-6fb4-46bd-8dd6-9d387d4be7f2
    })

    it('submitMultipleBuyOrders', async function () {
        // make new UUID
        let idNew1 = uuid.v4()
        accounting.credit(idNew1, 3, 'BTC')
        let idNew2 = uuid.v4()
        accounting.credit(idNew2, 3, 'BTC')
        let id1 = engine.submitOrder({ id: idNew1, quantity: 3, price: 2.5 })
        let id2 = engine.submitOrder({ id: idNew2, quantity: 3, price: 2.5 })
        expect(id1).to.be.equal(idNew1)
        expect(id2).to.be.equal(idNew2)
        expect(id2).to.not.be.equal(id1)
        let balance1 = await (accounting.balance(id1, 'BTC'))
        expect(balance1).to.be.equal(3)
        let balance2 = await (accounting.balance(id2, 'BTC'))
        expect(balance2).to.be.equal(3)
    })


    it('submitMultipleBuyOrders and cancel', async function () {
        // make new UUID
        let idNew1 = uuid.v4()
        accounting.credit(idNew1, 3, 'BTC')
        let idNew2 = uuid.v4()
        accounting.credit(idNew2, 3, 'BTC')
        let id1 = engine.submitOrder({ id: idNew1, quantity: 3, price: 2.5 })
        let id2 = engine.submitOrder({ id: idNew2, quantity: 3, price: 2.5 })
        expect(id1).to.be.equal(idNew1)
        expect(id2).to.be.equal(idNew2)
        expect(id2).to.not.be.equal(id1)
        let balance1 = await (accounting.balance(id1, 'BTC'))
        expect(balance1).to.be.equal(3)
        let balance2 = await (accounting.balance(id2, 'BTC'))
        expect(balance2).to.be.equal(3)

        let result = engine.cancelOrder(id1)
        expect(result).to.be.true

        //expect no nulls
        let orderbook = engine.getMarketData()
        log.debug("",orderbook)
        let bids = orderbook.bids
        expect(bids.length).to.be.equal(1)

        let result1 = engine.cancelOrder(id2)
        expect(result1).to.be.true

        //expect no nulls
        let orderbook2 = engine.getMarketData()
        log.debug("",orderbook2)
        let bids2 = orderbook2.bids
        expect(bids2.length).to.be.equal(0)

    })

    it('submitMultipleBuyOrders and cancel at new price levels', async function () {
        // make new UUID
        let idNew1 = uuid.v4()
        accounting.credit(idNew1, 3, 'BTC')
        let idNew2 = uuid.v4()
        accounting.credit(idNew2, 3, 'BTC')
        let idNew3 = uuid.v4()
        accounting.credit(idNew3, 3, 'BTC')

        let id1 = engine.submitOrder({ id: idNew1, quantity: 3, price: 2.5 })
        let id2 = engine.submitOrder({ id: idNew2, quantity: 3, price: 1.5 })
        let id3 = engine.submitOrder({ id: idNew3, quantity: 3, price: 3.5 })
        expect(id1).to.be.equal(idNew1)
        expect(id2).to.be.equal(idNew2)
        expect(id3).to.be.equal(idNew3)
        expect(id2).to.not.be.equal(id1)
        let balance1 = await (accounting.balance(id1, 'BTC'))
        expect(balance1).to.be.equal(3)
        let balance2 = await (accounting.balance(id2, 'BTC'))
        expect(balance2).to.be.equal(3)

        let result = engine.cancelOrder(id1)
        expect(result).to.be.true

        //expect no nulls
        let orderbook = engine.getMarketData()
        log.debug("",orderbook)
        let bids = orderbook.bids
        expect(bids.length).to.be.equal(2)

        let result1 = engine.cancelOrder(id2)
        expect(result1).to.be.true

        //expect no nulls
        let orderbook2 = engine.getMarketData()
        log.debug("",orderbook2)
        let bids2 = orderbook2.bids
        expect(bids2.length).to.be.equal(1)

    })


    it('zeroQuantityOrder', async function () {
        // make new UUID
        let idNew1 = uuid.v4()
        return expect(engine.submitOrder.bind(engine, ({ id: idNew1, quantity: 0, price: 2.5 })))
            .to.throw(Error)
    })

    it('checkUnknownOrderStatus', function () {
        let status = engine.getStatus('1')
        expect(status).to.be.undefined
    })

    it('canCancelOrder', function () {
        let idNew = uuid.v4()
        accounting.credit(idNew, 3, 'BTC')
        let id = engine.submitOrder({ id: idNew, quantity: 3, price: 2.5 })
        let result = engine.cancelOrder(id)
        expect(result).to.be.true
        let status = engine.getStatus(id)
        expect(status.status).to.be.equal('Cancelled')
    })

    it('noNullAfterCancelOrder', function () {
        let idNew = uuid.v4()
        accounting.credit(idNew, 3, 'BTC')
        let id = engine.submitOrder({ id: idNew, quantity: 3, price: 2.5 })
        let result = engine.cancelOrder(id)
        expect(result).to.be.true
        let status = engine.getStatus(id)
        expect(status.status).to.be.equal('Cancelled')
        // get orderbook
        // no nulls
        let orderbook = engine.getMarketData()
        expect(orderbook.bids.length).to.be.equal(0)
        expect(orderbook.offers.length).to.be.equal(0)
    })

    it('cancelOrderTwice', function () {
        let idNew = uuid.v4()
        accounting.credit(idNew, 3, 'BTC')
        let id = engine.submitOrder({ id: idNew, quantity: 3, price: 2.5 })
        let result = engine.cancelOrder(id)
        expect(result).to.be.true
        let status1 = engine.getStatus(id)
        expect(status1.status).to.be.equal('Cancelled')
        let result2 = engine.cancelOrder(id)
        expect(result2).to.be.false
    })

    // Can resubmit same orderId after cancel!
    it('cancelOrderReplace', function () {
        let idNew = uuid.v4()
        accounting.credit(idNew, 3, 'BTC')
        let id = engine.submitOrder({ id: idNew, quantity: 3, price: 2.5 })
        let result = engine.cancelOrder(id)
        expect(result).to.be.true
        //
        let newId2 = uuid.v4()
        let id2 = engine.submitOrder({ id: newId2, quantity: 3, price: 2.5 })
        expect(id2).to.be.equal(newId2)
    })

    it('cancelNonExistentOrder', function () {
        let idNew = uuid.v4()
        let result = engine.cancelOrder(idNew)
        expect(result).to.be.false
    })

    it('matchRaisesEvent', function () {
        let matched = false

        engine.on('match', function (restingOrder, aggressiveOrder, price, quantity) {
            let debug = false
            if (debug) console.log('restingOrder: ', restingOrder)
            if (debug) console.log('aggressiveOrder: ', aggressiveOrder)

            // TODO turn this on!!!!
            // expect(restingOrder.taker).to.not.equal(aggressiveOrder.taker)

            expect(restingOrder.id).to.be.equal(buyId)
            // assert.equal(restingOrder.id, buyId, "Resting order should be buy order");
            expect(price).to.be.equal(2.5)
            // assert.equal(price, "2.5");
            expect(quantity).to.be.equal(3)
            // assert.equal(quantity, 3);
            matched = true
        })

        let idNew1 = uuid.v4()
        accounting.credit(idNew1, 3, 'BTC')
        let idNew2 = uuid.v4()
        accounting.credit(idNew2, 7.5, 'ETH')

        let buyId = engine.submitOrder({ id: idNew1, quantity: 3, price: 2.5 })
        let sellId = engine.submitOrder({ id: idNew2, quantity: -3, price: 2.5 })

        expect(matched).to.be.true
        let buyStatus = engine.getStatus(buyId)
        expect(buyStatus.status).to.be.equal('complete')
        let sellStatus = engine.getStatus(sellId)
        expect(sellStatus.status).to.be.equal('complete')
    })

    it('cancelPreventsMatch', function () {
        let buyId = engine.submitOrder({ id: uuid.v4(), quantity: 3, price: 2.5 })

        let success = engine.cancelOrder(buyId)
        expect(success).to.equal(true)

        engine.submitOrder({ id: uuid.v4(), quantity: -3, price: 2.5 })

        // Should not match
        engine.on('match', function () {
            expect(true).to.equal(false)
        })
    })

    it('matchAfterCancelRaisesEvent', function () {
        let matched = false
        let buyOrder = { id: uuid.v4(), quantity: 3, price: 2.5 }
        let buyId = engine.submitOrder(buyOrder)
        let success = engine.cancelOrder(buyId)
        expect(success).to.be.equal(true)

        buyOrder.id = uuid.v4()
        buyId = engine.submitOrder(buyOrder)
        // expect(buyId).to.be.equal(buyOrder.id)
        let sellId = engine.submitOrder({ id: uuid.v4(), quantity: -3, price: 2.5 })

        engine.on('match', function (restingOrder, aggressiveOrder, price, quantity) {
            expect(restingOrder.id).to.be.equal(buyId)
            // assert.equal(restingOrder.id, buyId, "Resting order should be buy order");
            expect(price).to.be.equal(2.5)
            // assert.equal(price, "2.5");
            expect(quantity).to.be.equal(3)

            // assert.equal(restingOrder.id, buyId, "Resting order should be buy order");
            // assert.equal(price, "2.5");
            // assert.equal(quantity, 3);

            matched = true
        })

        // expect(matched).to.be.equal(true)
        // assert.ok(matched, "Match should have occurred.");

        let buyStatus = engine.getStatus(buyId)
        // assert.equal(buyStatus.status, "Complete");
        expect(buyStatus.status).to.be.equal('complete')
        let sellStatus = engine.getStatus(sellId)
        // assert.equal(sellStatus.status, "Complete");
        expect(sellStatus.status).to.be.equal('complete')

        let orderbook = engine.getMarketData()
        //console.log('orderbook: ', orderbook)
        expect(orderbook.bids.length).to.be.equal(0)
        expect(orderbook.offers.length).to.be.equal(0)
    })

    it('sweepRaisesEvents', function () {
        let buyId1 = engine.submitOrder({ id: uuid.v4(), quantity: 1, price: 2.7 })
        let buyId2 = engine.submitOrder({ id: uuid.v4(), quantity: 1, price: 2.6 })
        let buyId3 = engine.submitOrder({ id: uuid.v4(), quantity: 1, price: 2.5 })
        let restingIds = [buyId1, buyId2, buyId3]
        let prices = [2.7, 2.6, 2.5]
        let quantities = [1, 1, 1]
        let matchCount = 0
        engine.on('match', function (restingOrder, aggressiveOrder, matchPrice, matchQuantity) {
            let id = restingIds[matchCount]
            let price = prices[matchCount]
            let quantity = quantities[matchCount]
            // assert.equal(restingOrder.id, id, "Resting order should match expected");
            expect(restingOrder.id).to.be.equal(id)
            // assert.equal(price, matchPrice, "Prices should match");
            expect(price).to.be.equal(matchPrice)
            // assert.equal(quantity, matchQuantity, "Quantities should match");
            expect(quantity).to.be.equal(matchQuantity)

            matchCount = matchCount + 1
        })

        let sellId = engine.submitOrder({ id: uuid.v4(), quantity: -3, price: 2.5 })

        // assert.equal(matchCount, 3, "Three matches should have occurred.");
        expect(matchCount).to.be.equal(3)

        let buyStatus = engine.getStatus(buyId1)
        // assert.equal(buyStatus.status, "Complete");
        expect(buyStatus.status).to.be.equal('complete')

        buyStatus = engine.getStatus(buyId2)
        // assert.equal(buyStatus.status, "Complete");
        expect(buyStatus.status).to.be.equal('complete')

        buyStatus = engine.getStatus(buyId3)
        // assert.equal(buyStatus.status, "Complete");
        expect(buyStatus.status).to.be.equal('complete')

        let sellStatus = engine.getStatus(sellId)
        // assert.equal(sellStatus.status, "Complete");
        expect(buyStatus.status).to.be.equal('complete')
    })

    it('partialsRaiseEvents', function () {
        let debug = false
        let sellId = engine.submitOrder({ id: uuid.v4(), quantity: -3, price: 2.5 })
        let restingIds = [sellId, sellId, sellId]
        let prices = [2.5, 2.5, 2.5]
        let quantities = [1, 1, 1]
        let matchCount = 0
        engine.on('match', function (restingOrder, aggressiveOrder, matchPrice, matchQuantity) {
            let id = restingIds[matchCount]
            let price = prices[matchCount]
            let quantity = quantities[matchCount]

            if (debug) console.log(clc.red('resting: ' + JSON.stringify(restingOrder)))
            if (debug) console.log(clc.blue('aggressive: ' + JSON.stringify(aggressiveOrder)))
            if (debug) console.log(clc.red('price: ' + price))
            if (debug) console.log(clc.blue('quantity: ' + quantity))

            // assert.equal(restingOrder.id, id, "Resting order should match expected");
            expect(restingOrder.id).to.be.equal(id)
            // assert.equal(price, matchPrice, "Prices should match");
            expect(price).to.be.equal(matchPrice)
            // assert.equal(quantity, matchQuantity, "Quantities should match");
            expect(quantity).to.be.equal(matchQuantity)

            matchCount = matchCount + 1
        })

        let buyId1 = engine.submitOrder({ id: uuid.v4(), quantity: 1, price: 2.7 })
        let sellStatus = engine.getStatus(sellId)
        // assert.equal(sellStatus.status, "Working");
        expect(sellStatus.status).to.be.equal('Working')
        // assert.equal(sellStatus.workingQuantity, 2);
        expect(sellStatus.workingQuantity).to.be.equal(2)

        let buyId2 = engine.submitOrder({ id: uuid.v4(), quantity: 1, price: 2.7 })
        sellStatus = engine.getStatus(sellId)
        // assert.equal(sellStatus.status, "Working");
        expect(sellStatus.status).to.be.equal('Working')
        // assert.equal(sellStatus.workingQuantity, 1);
        expect(sellStatus.workingQuantity).to.be.equal(1)

        let buyId3 = engine.submitOrder({ id: uuid.v4(), quantity: 1, price: 2.5 })

        // assert.equal(matchCount, 3, "Three matches should have occurred.");
        expect(matchCount).to.be.equal(3)

        let buyStatus = engine.getStatus(buyId1)
        // assert.equal(buyStatus.status, "Complete");
        expect(buyStatus.status).to.be.equal('complete')
        buyStatus = engine.getStatus(buyId2)
        // assert.equal(buyStatus.status, "Complete");
        expect(buyStatus.status).to.be.equal('complete')
        buyStatus = engine.getStatus(buyId3)
        // assert.equal(buyStatus.status, "Complete");
        expect(buyStatus.status).to.be.equal('complete')
        sellStatus = engine.getStatus(sellId)
        // assert.equal(sellStatus.status, "Complete");
        expect(buyStatus.status).to.be.equal('complete')
    })

    it('cancelAfterPartialClearsBook', function () {
        let sellId = engine.submitOrder({ id: uuid.v4(), quantity: -3, price: 2.5 })

        engine.submitOrder({ id: uuid.v4(), quantity: 1, price: 2.7 })
        engine.submitOrder({ id: uuid.v4(), quantity: 1, price: 2.7 })

        let success = engine.cancelOrder(sellId)
        expect(success).to.equal(true)

        engine.on('match', function (restingOrder, aggressiveOrder, price, quantity) {
            // assert.fail("Should not match after cancel");
            expect(true).to.equal(false)
        })

        engine.submitOrder({ id: uuid.v4(), quantity: 1, price: 2.5 })
    })

    it('resubmitAfterMatchDoesNotMatch', function () {
        engine.submitOrder({ id: uuid.v4(), quantity: 3, price: 2.5 })
        engine.submitOrder({ id: uuid.v4(), quantity: -3, price: 2.5 })

        engine.on('match', function (restingOrder, aggressiveOrder, price, quantity) {
            // assert.fail("Should not match against empty book")
            expect(true).to.equal(false)
        })

        let sellId = engine.submitOrder({ id: uuid.v4(), quantity: -3, price: 2.5 })

        let sellStatus = engine.getStatus(sellId)
        // assert.equal(sellStatus.status, "Working");
        expect(sellStatus.status).to.equal('Working')
    })

    it('multipleLevelsOfMarketData', function () {
        engine.submitOrder({ id: uuid.v4(), quantity: 3, price: 2.5 })
        engine.submitOrder({ id: uuid.v4(), quantity: 3, price: 2.5 })
        engine.submitOrder({ id: uuid.v4(), quantity: 3, price: 2.5 })
        engine.submitOrder({ id: uuid.v4(), quantity: 2, price: 2.4 })
        engine.submitOrder({ id: uuid.v4(), quantity: -3, price: 2.6 })

        let marketData = engine.getMarketData()
        if (debug) console.log('marketData: ', marketData)

        let bids = marketData.bids
        let offers = marketData.offers

        // assert.equal(2, bids.length);
        expect(bids.length).to.equal(2)

        // assert.equal(1, offers.length);
        expect(offers.length).to.equal(1)

        // assert.equal(9, bids[0].quantity);
        expect(bids[0].quantity).to.equal(9)

        // assert.equal(2, bids[1].quantity);
        expect(bids[1].quantity).to.equal(2)

        // assert.equal(3, offers[0].quantity);
        expect(offers[0].quantity).to.equal(3)

        // assert.equal(2.5, bids[0].price);
        expect(bids[0].price).to.equal(2.5)

        // assert.equal(2.4, bids[1].price);
        expect(bids[1].price).to.equal(2.4)

        // assert.equal(2.6, offers[0].price);
        expect(offers[0].price).to.equal(2.6)
    })

    //
    it('marketDataStripsOrderInformation', function () {
        engine.submitOrder({ id: uuid.v4(), quantity: 3, price: 2.5 })

        let marketData = engine.getMarketData()
        let bids = marketData.bids

        // assert.ok(!bids[0].id);
        expect(bids[0].id).to.undefined
    })
})
