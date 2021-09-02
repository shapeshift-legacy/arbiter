/*
  
    Match engine is the heart of project Arbiter
    
*/

// modules
let uuid = require('node-uuid')

let engine
describe('Match Engine trade Module', () => {
    beforeEach(() => {
        // const matchEngine = require('./match.js')
        // engine = matchEngine.createEngine(pair);
    })
    // globals

    describe('trade', () => {
        beforeEach(() => {
            engine = matchEngine.createEngine(pair)
        })

        const matchEngine = require('./match.js')
        const accounting = require('./accounting.js')

        let pair = 'ETH_BTC'

        //
        // engine = matchEngine.createEngine(pair);

        test('submitBuyOrder', async () => {
            // make new UUID
            let idNew = uuid.v4()
            // fund order BTC
            accounting.credit(idNew, 3, 'BTC')
            let id = engine.submitOrder({ id: idNew, quantity: '3', price: '2.5' })
            expect(id).toBe(idNew)

            let output = engine.getMarketData()
            expect(output.bids[0].orders[0].id).toBe(idNew)
            expect(output.bids[0].orders[0].qty).toBe(3)
            let balance = await accounting.balance(idNew, 'BTC')
            expect(balance).toBe(3)
        })

        test('submitMultipleBuyOrders', async function () {
            // make new UUID
            let idNew1 = uuid.v4()
            accounting.credit(idNew1, 3, 'BTC')
            let idNew2 = uuid.v4()
            accounting.credit(idNew2, 3, 'BTC')
            let id1 = engine.submitOrder({ id: idNew1, quantity: '3', price: '2.5' })
            let id2 = engine.submitOrder({ id: idNew2, quantity: '3', price: '2.5' })
            expect(id1).toBe(idNew1)
            expect(id2).toBe(idNew2)
            // TODO expect(id2).to.not.be.equal(id1)
            let balance1 = await (accounting.balance(id1, 'BTC'))
            expect(balance1).toBe(3)
            let balance2 = await (accounting.balance(id2, 'BTC'))
            expect(balance2).toBe(3)
        })

        test('zeroQuantityOrder', async function () {
            // make new UUID
            let idNew1 = uuid.v4()
            return expect(engine.submitOrder.bind(engine, ({ id: idNew1, quantity: 0, price: '2.5' })))
                .toThrow(Error)
        })

        test('checkUnknownOrderStatus', function () {
            let status = engine.getStatus('1')
            expect(status).toBe(undefined)
        })

        test('canCancelOrder', function () {
            let idNew = uuid.v4()
            accounting.credit(idNew, 3, 'BTC')
            let id = engine.submitOrder({ id: idNew, quantity: '3', price: '2.5' })
            let result = engine.cancelOrder(id)
            expect(result).toBe(true)
            let status = engine.getStatus(id)
            expect(status.status).toBe('Cancelled')
        })

        test('cancelOrderTwice', function () {
            let idNew = uuid.v4()
            accounting.credit(idNew, 3, 'BTC')
            let id = engine.submitOrder({ id: idNew, quantity: '3', price: '2.5' })
            let result = engine.cancelOrder(id)
            expect(result).toBe(true)
            let status1 = engine.getStatus(id)
            expect(status1.status).toBe('Cancelled')
            let result2 = engine.cancelOrder(id)
            expect(result2).toBe(false)
        })

        test('cancelNonExistentOrder', function () {
            let idNew = uuid.v4()
            let result = engine.cancelOrder(idNew)
            expect(result).toBe(false)
        })

        test('matchRaisesEvent', function () {
            let matched = false

            engine.on('match', function (match) {
                // console.log("match: ",match)
                // TODO turn this on!!!!
                // expect(restingOrder.taker).to.not.equal(aggressiveOrder.taker)

                expect(match.restingOrder.id).toBe(buyId)
                // expect(match.aggressiveOrder.id).toBe(sellId)
                // assert.equal(restingOrder.id, buyId, "Resting order should be buy order");
                expect(match.restingOrderPrice).toBe(2.5)
                // assert.equal(price, "2.5");
                expect(match.matchQuantity).toBe(3)
                // assert.equal(quantity, 3);
                matched = true
            })

            let idNew1 = uuid.v4()
            accounting.credit(idNew1, 3, 'BTC')
            let idNew2 = uuid.v4()
            accounting.credit(idNew2, 7.5, 'ETH')

            let buyId = engine.submitOrder({ id: idNew1, quantity: '3', price: '2.5' })
            let sellId = engine.submitOrder({ id: idNew2, quantity: '-3', price: '2.5' })

            expect(matched).toBe(true)
            let buyStatus = engine.getStatus(buyId)
            expect(buyStatus.status).toBe('complete')
            let sellStatus = engine.getStatus(sellId)
            expect(sellStatus.status).toBe('complete')
        })

        test('cancelPreventsMatch', function () {
            let buyId = engine.submitOrder({ id: uuid.v4(), quantity: '3', price: '2.5' })

            let success = engine.cancelOrder(buyId)
            expect(success).toBe(true)

            engine.submitOrder({ id: uuid.v4(), quantity: '-3', price: '2.5' })

            // Should not match
            engine.on('match', function () {
                expect(true).toBe(false)
            })
        })

        test('matchAfterCancelRaisesEvent', function () {
            let matched = false
            let buyOrder = { id: uuid.v4(), quantity: '3', price: '2.5' }
            let buyId = engine.submitOrder(buyOrder)
            console.log('buyId: ', buyId)
            expect(buyId).toBe(buyOrder.id)

            let success = engine.cancelOrder(buyId)
            expect(success).toBe(true)
            buyId = engine.submitOrder(buyOrder)
            expect(buyId).toBe(buyOrder.id)
            let sellId = engine.submitOrder({ id: uuid.v4(), quantity: '-3', price: '2.5' })
            expect(buyId).toBeDefined()
            expect(sellId).toBeDefined()
            console.log('buyId: ', buyId)
            console.log('sellId: ', buyStatus)

            // engine.on("match", function(restingOrder, aggressiveOrder, price, quantity) {
            //     expect(restingOrder.id).toBe(buyId)
            //     // assert.equal(restingOrder.id, buyId, "Resting order should be buy order");
            //     expect(price).toBe(2.5)
            //     // assert.equal(price, "2.5");
            //     expect(quantity).toBe(3)
            //
            //     // assert.equal(restingOrder.id, buyId, "Resting order should be buy order");
            //     // assert.equal(price, "2.5");
            //     // assert.equal(quantity, 3);
            //
            //     matched = true;
            // });
            //
            //
            // //expect(matched).toBe(true)
            // //assert.ok(matched, "Match should have occurred.");
            //
            // let buyStatus = engine.getStatus(buyId);
            // //assert.equal(buyStatus.status, "Complete");
            // console.log("buyStatus: ",buyStatus)
            // expect(buyStatus.status).toBe("complete")
            // let sellStatus = engine.getStatus(sellId);
            // console.log("sellStatus: ",sellStatus)
            // //assert.equal(sellStatus.status, "Complete");
            // expect(sellStatus.status).toBe("complete")
        })

        /*
                            it.skip('sweepRaisesEvents', function ()
                            {
                                let buyId1 = engine.submitOrder({id:uuid.v4(),quantity: "1", price: "2.7"});
                                let buyId2 = engine.submitOrder({id:uuid.v4(),quantity: "1", price: "2.6"});
                                let buyId3 = engine.submitOrder({id:uuid.v4(),quantity: "1", price: "2.5"});
                                let restingIds = [buyId1, buyId2, buyId3];
                                let prices = [2.7, 2.6, 2.5];
                                let quantities = [1, 1, 1];
                                let matchCount = 0;
                                engine.on("match", function(restingOrder, aggressiveOrder, matchPrice, matchQuantity) {
                                    let id = restingIds[matchCount];
                                    let price = prices[matchCount];
                                    let quantity = quantities[matchCount];
                                    //assert.equal(restingOrder.id, id, "Resting order should match expected");
                                    expect(restingOrder.id).toBe(id)
                                    //assert.equal(price, matchPrice, "Prices should match");
                                    expect(price).toBe(matchPrice)
                                    //assert.equal(quantity, matchQuantity, "Quantities should match");
                                    expect(quantity).toBe(matchQuantity)

                                    matchCount = matchCount + 1;
                                });

                                let sellId = engine.submitOrder({id:uuid.v4(),quantity: "-3", price: "2.5"});

                                //assert.equal(matchCount, 3, "Three matches should have occurred.");
                                expect(matchCount).toBe(3)

                                let buyStatus = engine.getStatus(buyId1);
                                //assert.equal(buyStatus.status, "Complete");
                                expect(buyStatus.status).toBe("complete")

                                buyStatus = engine.getStatus(buyId2);
                                //assert.equal(buyStatus.status, "Complete");
                                expect(buyStatus.status).toBe("complete")

                                buyStatus = engine.getStatus(buyId3);
                                //assert.equal(buyStatus.status, "Complete");
                                expect(buyStatus.status).toBe("complete")

                                let sellStatus = engine.getStatus(sellId);
                                //assert.equal(sellStatus.status, "Complete");
                                expect(buyStatus.status).toBe("complete")
                            })

                            it.skip('partialsRaiseEvents', function ()
                            {
                                let sellId = engine.submitOrder({id:uuid.v4(),quantity: "-3", price: "2.5"});
                                let restingIds = [sellId, sellId, sellId];
                                let prices = [2.5, 2.5, 2.5];
                                let quantities = [1, 1, 1];
                                let matchCount = 0;
                                engine.on("match", function(restingOrder, aggressiveOrder, matchPrice, matchQuantity) {
                                    let id = restingIds[matchCount];
                                    let price = prices[matchCount];
                                    let quantity = quantities[matchCount];

                                    console.log(clc.red("resting: "+JSON.stringify(restingOrder)))
                                    console.log(clc.blue("aggressive: "+JSON.stringify(aggressiveOrder)))
                                    console.log(clc.red("price: "+price))
                                    console.log(clc.blue("quantity: "+quantity))

                                    //assert.equal(restingOrder.id, id, "Resting order should match expected");
                                    expect(restingOrder.id).toBe(id)
                                    //assert.equal(price, matchPrice, "Prices should match");
                                    expect(price).toBe(matchPrice)
                                    //assert.equal(quantity, matchQuantity, "Quantities should match");
                                    expect(quantity).toBe(matchQuantity)

                                    matchCount = matchCount + 1;
                                });

                                let buyId1 = engine.submitOrder({id:uuid.v4(),quantity: "1", price: "2.7"});
                                let sellStatus = engine.getStatus(sellId);
                                //assert.equal(sellStatus.status, "Working");
                                expect(sellStatus.status).toBe("Working")
                                //assert.equal(sellStatus.workingQuantity, 2);
                                expect(sellStatus.workingQuantity).toBe(2)

                                let buyId2 = engine.submitOrder({id:uuid.v4(),quantity: "1", price: "2.6"});
                                sellStatus = engine.getStatus(sellId);
                                //assert.equal(sellStatus.status, "Working");
                                expect(sellStatus.status).toBe("Working")
                                //assert.equal(sellStatus.workingQuantity, 1);
                                expect(sellStatus.workingQuantity).toBe(1)

                                let buyId3 = engine.submitOrder({id:uuid.v4(),quantity: "1", price: "2.5"});

                                //assert.equal(matchCount, 3, "Three matches should have occurred.");
                                expect(matchCount).toBe(3)

                                let buyStatus = engine.getStatus(buyId1);
                                //assert.equal(buyStatus.status, "Complete");
                                expect(buyStatus.status).toBe("complete")
                                buyStatus = engine.getStatus(buyId2);
                                //assert.equal(buyStatus.status, "Complete");
                                expect(buyStatus.status).toBe("complete")
                                buyStatus = engine.getStatus(buyId3);
                                //assert.equal(buyStatus.status, "Complete");
                                expect(buyStatus.status).toBe("complete")
                                sellStatus = engine.getStatus(sellId);
                                //assert.equal(sellStatus.status, "Complete");
                                expect(buyStatus.status).toBe("complete")
                            })

                            test('cancelAfterPartialClearsBook', function ()
                            {
                                let sellId = engine.submitOrder({id:uuid.v4(),quantity: "-3", price: "2.5"});

                                engine.submitOrder({id:uuid.v4(),quantity: "1", price: "2.7"});
                                engine.submitOrder({id:uuid.v4(),quantity: "1", price: "2.6"});

                                let success = engine.cancelOrder(sellId);
                                expect(success).to.equal(true)

                                engine.on("match", function(restingOrder, aggressiveOrder, price, quantity) {
                                    //assert.fail("Should not match after cancel");
                                    expect(true).to.equal(false)
                                });

                                engine.submitOrder({id:uuid.v4(),quantity: "1", price: "2.5"});

                            })

                            test('resubmitAfterMatchDoesNotMatch', function ()
                            {
                                engine.submitOrder({id:uuid.v4(),quantity: "3", price: "2.5"});
                                engine.submitOrder({id:uuid.v4(),quantity: "-3", price: "2.5"});

                                engine.on("match", function(restingOrder, aggressiveOrder, price, quantity) {
                                    //assert.fail("Should not match against empty book")
                                    expect(true).to.equal(false)
                                });

                                let sellId = engine.submitOrder({id:uuid.v4(),quantity: "-3", price: "2.5"});

                                let sellStatus = engine.getStatus(sellId);
                                //assert.equal(sellStatus.status, "Working");
                                expect(sellStatus.status).to.equal("Working")
                            })

                            test('multipleLevelsOfMarketData', function ()
                            {
                                engine.submitOrder({id:uuid.v4(),quantity: "3", price: "2.5"});
                                engine.submitOrder({id:uuid.v4(),quantity: "3", price: "2.5"});
                                engine.submitOrder({id:uuid.v4(),quantity: "3", price: "2.5"});
                                engine.submitOrder({id:uuid.v4(),quantity: "2", price: "2.4"});
                                engine.submitOrder({id:uuid.v4(),quantity: "-3", price: "2.6"});

                                let marketData = engine.getMarketData();
                                let bids = marketData.bids;
                                let offers = marketData.offers;

                                //assert.equal(2, bids.length);
                                expect(bids.length).to.equal(2)

                                //assert.equal(1, offers.length);
                                expect(offers.length).to.equal(1)

                                //assert.equal(9, bids[0].quantity);
                                expect(bids[0].quantity).to.equal(9)

                                //assert.equal(2, bids[1].quantity);
                                expect(bids[1].quantity).to.equal(2)

                                //assert.equal(3, offers[0].quantity);
                                expect(offers[0].quantity).to.equal(3)

                                //assert.equal(2.5, bids[0].price);
                                expect(bids[0].price).to.equal(2.5)

                                //assert.equal(2.4, bids[1].price);
                                expect(bids[1].price).to.equal(2.4)

                                //assert.equal(2.6, offers[0].price);
                                expect( offers[0].price).to.equal(2.6)
                            })

                            //
                            test('marketDataStripsOrderInformation', function ()
                            {
                                engine.submitOrder({id:uuid.v4(),quantity: "3", price: "2.5"});

                                let marketData = engine.getMarketData();
                                let bids = marketData.bids;

                                //assert.ok(!bids[0].id);
                                expect(bids[0].id).to.undefined
                            })
                            */
    })
})
