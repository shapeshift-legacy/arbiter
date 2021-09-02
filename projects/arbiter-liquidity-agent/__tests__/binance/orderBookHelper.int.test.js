require('dotenv').config({ path: '../../../../.env' })


let helper = require('../../modules/binance/orderBookHelper')

let orderBook = require('../../modules/binance/orderBook')

// let arbiter = require('../../../modules/arbiter')
//
// let {queryCoinBal, getCoinNames, processOrders} = require('../../../modules/binance/orderBookHelper')

const { initialOrderbook, finalOrderbook, wsEvent, ResultOneWsEventReplayed, wsQue } = require('../../__mocks__/binance')

// jest.mock('then-redis')
// jest.mock('redis')

describe('orderBookHelper for Binance', () => {
    describe('main logic', () => {

        let helper = require('../../modules/binance/orderBookHelper')
        helper.getOrderBook = jest.fn()
        helper.getOrderBook.mockResolvedValue(initialOrderbook)

        // let wsEventQue =

        let arbiter = require('../../../modules/arbiter')
        arbiter.balance = jest.fn()
        arbiter.balance.mockResolvedValue(0.001)

        arbiter.orders = jest.fn()
        arbiter.orders.mockResolvedValue(
            {
                "bids": [
                    {
                        "quantity": 0.0015,
                        "price": "0.01025",
                        "orders": [
                            {
                                "id": "cdd8d263-d63d-4584-850b-67c623dd3467",
                                "qty": 0.0015
                            }
                        ]
                    }
                ],
                "offers": [
                    {
                        "quantity": 0.0015969,
                        "price": "0.01026",
                        "orders": [
                            {
                                "id": "ebb8d263-d63d-4584-850b-67c623dd3467",
                                "qty": 0.0015969
                            }
                        ]
                    }
                ]
            }
        )

        let signning = require('../../../modules/sign')
        signning.sign = jest.fn()
        signning.sign.mockResolvedValue('blah')

        let state = {
            wsEvent: {
                isFirstOrder: false,
                hasStarted: false,
                isRunning: false,
                queue: []
            },
            process: {
                isRunning: false,
                isNewProcessSpinnedUp: false,
                laOrderBookNewProcess: null
            },
            market: 'LTC_BTC'
        }

        test('test main logic', async () => {
            let result = await orderBook.main(state)
            console.log('### result', result)

        })

    })


    describe('processOrders update logic', () => {
        test('1 ws order -- bid -- ', async () => {
            let wsOrdersArr = [
                ['4', '4', []]
            ]
            let currentLaOrderBook = [
                ['6', '2', '111'],
                ['4', '2', '222'],
                ['2', '2', '333'],
                ['1', '4', '444']
            ]
            let type = 'bid'
            let market = 'LTC_BTC'

            let expectedResult = [
                ['6', '2', '111'],
                ['4', '4', 'test']
            ]

            let arbiter = require('../../../modules/arbiter')
            arbiter.balance = jest.fn()
            arbiter.balance.mockResolvedValue(0)

            let signning = require('../../../modules/sign')
            signning.sign = jest.fn()
            signning.sign.mockResolvedValue('blah')

            let result = await helper.processOrders(wsOrdersArr, currentLaOrderBook, market, type)

            console.log('resullllt', result)

            expect(result.length).toEqual(2)
            expect(result[0]).toEqual(expectedResult[0])
            expect(result[1][0]).toEqual(expectedResult[1][0])
            expect(result[1][1]).toEqual(expectedResult[1][1])
        })

        test('3 ws orders -- BIDS -- ', async () => {
            let wsOrdersArr = [
                ['4', '2', []],
                ['2', '3', []],
                ['1', '2', []]
            ]
            let currentLaOrderBook = [
                ['6', '2', '111'],
                ['4', '2', '222'],
                ['2', '2', '333'],
                ['1', '4', '444']
            ]
            let type = 'bid'
            let market = 'LTC_BTC'

            let expectedResult = [
                ['6', '2', '111'],
                ['4', '2', 'test'],
                ['2', '3', 'test1'],
                ['1', '2', 'test2']
            ]

            let arbiter = require('../../../modules/arbiter')
            arbiter.balance = jest.fn()
            arbiter.balance.mockResolvedValue(10)

            let signning = require('../../../modules/sign')
            signning.sign = jest.fn()
            signning.sign.mockResolvedValue('blah')

            let result = await helper.processOrders(wsOrdersArr, currentLaOrderBook, market, type)

            console.log('resullllt', result)

            expect(result.length).toEqual(4)
            expect(result[0]).toEqual(expectedResult[0])
            expect(result[1][0]).toEqual(expectedResult[1][0])
            expect(result[1][1]).toEqual(expectedResult[1][1])
            expect(result[2][0]).toEqual(expectedResult[2][0])
            expect(result[2][1]).toEqual(expectedResult[2][1])
            expect(result[3][0]).toEqual(expectedResult[3][0])
            expect(result[3][1]).toEqual(expectedResult[3][1])
        })

        test('1 ws order -- ASKS', async () => {
            let wsOrdersArr = [
                // ['1', '5', []],
                ['2', '4', []],
                // ['2.5', '0.00000000', []],
                // ['4', '2', []]
            ]
            let currentLaOrderBook = [
                ['1', '7', '444'],
                ['2', '2', '333'],
                ['4', '2', '222'],
                ['6', '2', '111']
            ]
            let type = 'ask'
            let market = 'LTC_BTC'

            let expectedResult = [
                ['1', '7', '444'],
                ['2', '4', 'test'],
                ['4', '2', '222'],
                ['6', '2', '111']
            ]

            let arbiter = require('../../../modules/arbiter')
            arbiter.balance = jest.fn()
            arbiter.balance.mockResolvedValue(2)

            let signning = require('../../../modules/sign')
            signning.sign = jest.fn()
            signning.sign.mockResolvedValue('blah')

            let result = await helper.processOrders(wsOrdersArr, currentLaOrderBook, market, type)

            console.log('resullllt', result)

            expect(result.length).toEqual(4)
            expect(result[0]).toEqual(expectedResult[0])
            expect(result[1][0]).toEqual(expectedResult[1][0])
            expect(result[1][1]).toEqual(expectedResult[1][1])
            expect(result[2][0]).toEqual(expectedResult[2][0])
            expect(result[2][1]).toEqual(expectedResult[2][1])
            expect(result[3][0]).toEqual(expectedResult[3][0])
            expect(result[3][1]).toEqual(expectedResult[3][1])

        })

        test('3 ws orders -- ASKS', async () => {
            let wsOrdersArr = [
                ['1', '5', []],
                ['2', '1', []],
                // ['2.5', '0.00000000', []],
                ['4', '2', []]
            ]
            let currentLaOrderBook = [
                ['1', '7', '444'],
                ['2', '2', '333'],
                ['4', '2', '222'],
                ['6', '2', '111']
            ]
            let type = 'ask'
            let market = 'LTC_BTC'

            let expectedResult = [
                ['1', '5', 'test'],
                ['2', '1', 'test'],
                ['4', '2', 'test1'],
                ['6', '2', 'test2']
            ]

            let arbiter = require('../../../modules/arbiter')
            arbiter.balance = jest.fn()
            arbiter.balance.mockResolvedValue(2)

            let signning = require('../../../modules/sign')
            signning.sign = jest.fn()
            signning.sign.mockResolvedValue('blah')

            let result = await helper.processOrders(wsOrdersArr, currentLaOrderBook, market, type)

            console.log('resullllt', result)

            expect(result.length).toEqual(4)
            expect(result[1][0]).toEqual(expectedResult[1][0])
            expect(result[1][1]).toEqual(expectedResult[1][1])
            expect(result[2][0]).toEqual(expectedResult[2][0])
            expect(result[2][1]).toEqual(expectedResult[2][1])
            expect(result[3][0]).toEqual(expectedResult[3][0])
            expect(result[3][1]).toEqual(expectedResult[3][1])
        })
    })


    describe('processOrders delete logic', () => {
        test('BIDS -- 1 ws order', async () => {
            let wsOrdersArr = [
                ['4', '0.00000000', []],
                // ['2', '3', []],
                // ['1', '2', []]
            ]
            let currentLaOrderBook = [
                ['6', '2', '111'],
                ['4', '2', '222'],
                ['2', '2', '333'],
                ['1', '12', '444']
            ]
            let type = 'bid'
            let market = 'LTC_BTC'

            let expectedResult = [
                ['6', '2', '111'],
                ['2', '2', '333'],
                ['1', '12', 'test1']
            ]

            let arbiter = require('../../../modules/arbiter')
            arbiter.balance = jest.fn()
            arbiter.balance.mockResolvedValue(0)

            let signning = require('../../../modules/sign')
            signning.sign = jest.fn()
            signning.sign.mockResolvedValue('blah')

            let result = await helper.processOrders(wsOrdersArr, currentLaOrderBook, market, type)

            console.log('resullllt', result)

            expect(result.length).toEqual(3)
            expect(result[0]).toEqual(expectedResult[0])
            expect(result[1][0]).toEqual(expectedResult[1][0])
            expect(result[1][1]).toEqual(expectedResult[1][1])
            expect(result[2][0]).toEqual(expectedResult[2][0])
            expect(result[2][1]).toEqual(expectedResult[2][1])
        })

        test('BIDS -- 3 ws orders', async () => {
            let wsOrdersArr = [
                ['6', '0.00000000', []],
                ['2', '0.00000000', []],
                ['1', '0.00000000', []]
            ]
            let currentLaOrderBook = [
                ['6', '2', '111'],
                ['4', '2', '222'],
                ['2', '2', '333'],
                ['1', '4', '444']
            ]
            let type = 'bid'
            let market = 'LTC_BTC'

            let expectedResult = [
                ['4', '2', '222'],
                // ['2', '2', 'test'],
                // ['1', '4', 'test1']
            ]

            let arbiter = require('../../../modules/arbiter')
            arbiter.balance = jest.fn()
            arbiter.balance.mockResolvedValue(2)

            let signning = require('../../../modules/sign')
            signning.sign = jest.fn()
            signning.sign.mockResolvedValue('blah')

            let result = await helper.processOrders(wsOrdersArr, currentLaOrderBook, market, type)

            console.log('resullllt', result)

            expect(result.length).toEqual(1)
            expect(result[0]).toEqual(expectedResult[0])
            expect(result[0][0]).toEqual(expectedResult[0][0])
            expect(result[0][1]).toEqual(expectedResult[0][1])
            // expect(result[0][2]).toEqual(expectedResult[0][2])

            // expect(result[2][0]).toEqual(expectedResult[2][0])
            // expect(result[2][1]).toEqual(expectedResult[2][1])
        })

        test('ASKS -- 1 ws order', async () => {
            let wsOrdersArr = [
                ['2', '0.00000000', []]
            ]
            let currentLaOrderBook = [
                ['1', '7', '444'],
                ['2', '2', '333'],
                ['4', '2', '222'],
                ['6', '2', '111']
            ]
            let type = 'ask'
            let market = 'LTC_BTC'

            let expectedResult = [
                ['1', '7', '444'],
                ['4', '2', '222'],
                ['6', '2', '111']
            ]


            let arbiter = require('../../../modules/arbiter')
            arbiter.balance = jest.fn()
            arbiter.balance.mockResolvedValue(0)

            let signning = require('../../../modules/sign')
            signning.sign = jest.fn()
            signning.sign.mockResolvedValue('blah')

            let result = await helper.processOrders(wsOrdersArr, currentLaOrderBook, market, type)

            console.log('resullllt', result)

            expect(result.length).toEqual(3)
            expect(result[0]).toEqual(expectedResult[0])
            expect(result[1][0]).toEqual(expectedResult[1][0])
            expect(result[1][1]).toEqual(expectedResult[1][1])
            expect(result[2][0]).toEqual(expectedResult[2][0])
            expect(result[2][1]).toEqual(expectedResult[2][1])
        })

        test('ASKS -- 3 ws orders', async () => {
            let wsOrdersArr = [
                ['1', '0.00000000', []],
                ['2', '0.00000000', []],
                // ['2.5', '0.00000000', []],
                ['6', '0.00000000', []]
            ]
            let currentLaOrderBook = [
                ['1', '7', '444'],
                ['2', '2', '333'],
                ['4', '4', '222'],
                ['6', '2', '111']
            ]
            let type = 'ask'
            let market = 'LTC_BTC'

            let expectedResult = [
                ['4', '4', '222']
            ]

            let arbiter = require('../../../modules/arbiter')
            arbiter.balance = jest.fn()
            arbiter.balance.mockResolvedValue(0)

            let signning = require('../../../modules/sign')
            signning.sign = jest.fn()
            signning.sign.mockResolvedValue('blah')

            let result = await helper.processOrders(wsOrdersArr, currentLaOrderBook, market, type)

            console.log('resullllt', result)

            expect(result.length).toEqual(1)
            // expect(result[0]).toEqual(expectedResult[0])
            expect(result[0][0]).toEqual(expectedResult[0][0])
            expect(result[0][1]).toEqual(expectedResult[0][1])
        })
    })

    describe('processOrders add logic', () => {
        test('1 ws order -- bid -- ', async () => {
            let wsOrdersArr = [
                ['2.5', '2', []]
            ]
            let currentLaOrderBook = [
                ['6', '2', '111'],
                ['4', '2', '222'],
                ['2', '2', '333'],
                ['1', '12', '444']
            ]
            let type = 'bid'
            let market = 'LTC_BTC'

            let expectedResult = [
                ['6', '2', '111'],
                ['4', '2', '222'],
                ['2.5', '2', 'test'],
                ['2', '2', '333'],
                ['1', '7', 'test3']

            ]

            let arbiter = require('../../../modules/arbiter')
            arbiter.balance = jest.fn()
            arbiter.balance.mockResolvedValue(0)

            let signning = require('../../../modules/sign')
            signning.sign = jest.fn()
            signning.sign.mockResolvedValue('blah')

            let result = await helper.processOrders(wsOrdersArr, currentLaOrderBook, market, type)

            console.log('resullllt', result)

            expect(result.length).toEqual(5)
            expect(result[0]).toEqual(expectedResult[0])
            expect(result[1][0]).toEqual(expectedResult[1][0])
            expect(result[1][1]).toEqual(expectedResult[1][1])
            expect(result[2][0]).toEqual(expectedResult[2][0])
            expect(result[2][1]).toEqual(expectedResult[2][1])
            expect(result[3][0]).toEqual(expectedResult[3][0])
            expect(result[3][1]).toEqual(expectedResult[3][1])
            expect(result[4][0]).toEqual(expectedResult[4][0])
            expect(result[4][1]).toEqual(expectedResult[4][1])
        })

        test('3 ws orders -- BIDS -- ', async () => {
            let wsOrdersArr = [
                ['8', '0.25', []], //2
                ['3', '1', []],      //3
                ['2.5', '2', []]    //5
            ]
            let currentLaOrderBook = [
                ['6', '2', '111'],
                ['4', '2', '222'],
                ['2', '2', '333'],
                ['1', '4', '444']
            ]
            let type = 'bid'
            let market = 'LTC_BTC'

            let expectedResult = [
                ['8', '0.25', 'test'],
                ['6', '2', '111'],
                ['4', '2', '222'],
                ['3', '1', 'test1'],
                ['2.5', '2', 'test2']
            ]

            let arbiter = require('../../../modules/arbiter')
            arbiter.balance = jest.fn()
            arbiter.balance.mockResolvedValue(2)

            let signning = require('../../../modules/sign')
            signning.sign = jest.fn()
            signning.sign.mockResolvedValue('blah')

            let result = await helper.processOrders(wsOrdersArr, currentLaOrderBook, market, type)

            console.log('resullllt', result)

            expect(result.length).toEqual(5)
            expect(result[0][0]).toEqual(expectedResult[0][0])
            expect(result[0][1]).toEqual(expectedResult[0][1])

            expect(result[1][0]).toEqual(expectedResult[1][0])
            expect(result[1][1]).toEqual(expectedResult[1][1])
            expect(result[2][0]).toEqual(expectedResult[2][0])
            expect(result[2][1]).toEqual(expectedResult[2][1])
            expect(result[3][0]).toEqual(expectedResult[3][0])
            expect(result[3][1]).toEqual(expectedResult[3][1])
            expect(result[4][0]).toEqual(expectedResult[4][0])
            expect(result[4][1]).toEqual(expectedResult[4][1])
        })

        test('1 ws order -- ASKS', async () => {
            let wsOrdersArr = [
                ['3', '1', []],
                // ['2', '1', []],
                // ['2.5', '0.00000000', []],
                // ['4', '2', []]
            ]
            let currentLaOrderBook = [
                ['1', '7', '444'],
                ['2', '2', '333'],
                ['4', '2', '222'],
                ['6', '2', '111']
            ]
            let type = 'ask'
            let market = 'LTC_BTC'

            let expectedResult = [
                ['1', '7', '444'],
                ['2', '2', '333'],
                ['3', '1', 'test'],
                ['4', '2', '222'],
                ['6', '1', 'test2']
            ]
            let arbiter = require('../../../modules/arbiter')
            arbiter.balance = jest.fn()
            arbiter.balance.mockResolvedValue(0)

            let signning = require('../../../modules/sign')
            signning.sign = jest.fn()
            signning.sign.mockResolvedValue('blah')

            let result = await helper.processOrders(wsOrdersArr, currentLaOrderBook, market, type)

            console.log('resullllt', result)

            expect(result.length).toEqual(5)
            expect(result[0]).toEqual(expectedResult[0])
            expect(result[1]).toEqual(expectedResult[1])

            expect(result[2][0]).toEqual(expectedResult[2][0])
            expect(result[2][1]).toEqual(expectedResult[2][1])
            expect(result[3][0]).toEqual(expectedResult[3][0])
            expect(result[3][1]).toEqual(expectedResult[3][1])

            expect(result[4][0]).toEqual(expectedResult[4][0])
            expect(result[4][1]).toEqual(expectedResult[4][1])
        })

        test('3 ws orders -- ASKS', async () => {
            let wsOrdersArr = [
                ['2.5', '1', []],
                ['3', '1', []],
                ['4', '2', []]
            ]
            let currentLaOrderBook = [
                ['1', '7', '444'],
                ['2', '2', '333'],
                ['4', '2', '222'],
                ['6', '2', '111']
            ]
            let type = 'ask'
            let market = 'LTC_BTC'

            let expectedResult = [
                ['1', '7', '444'],
                ['2', '2', '333'],
                ['2.5', '1', 'test3'],
                ['3', '1', 'test'],
                ['4', '2', '222']
            ]
            let arbiter = require('../../../modules/arbiter')
            arbiter.balance = jest.fn()
            arbiter.balance.mockResolvedValue(0)

            let signning = require('../../../modules/sign')
            signning.sign = jest.fn()
            signning.sign.mockResolvedValue('blah')

            let result = await helper.processOrders(wsOrdersArr, currentLaOrderBook, market, type)

            console.log('resullllt', result)

            expect(result.length).toEqual(5)
            expect(result[0]).toEqual(expectedResult[0])
            expect(result[1]).toEqual(expectedResult[1])

            expect(result[2][0]).toEqual(expectedResult[2][0])
            expect(result[2][1]).toEqual(expectedResult[2][1])
            expect(result[3][0]).toEqual(expectedResult[3][0])
            expect(result[3][1]).toEqual(expectedResult[3][1])

            expect(result[4][0]).toEqual(expectedResult[4][0])
            expect(result[4][1]).toEqual(expectedResult[4][1])
        })

    })


    describe('processOrders add-delete-update logic', () => {
        test('multiple ws orders -- BIDS -- ', async () => {
            let wsOrdersArr = [
                ['2.5', '2', []],
                ['2', '0.00000000', []],
                ['1', '3', []]
            ]
            let currentLaOrderBook = [
                ['6', '2', '111'],
                ['4', '2', '222'],
                ['2', '2', '333'],
                ['1', '7', '444']
            ]
            let type = 'bid'
            let market = 'LTC_BTC'

            let expectedResult = [
                ['6', '2', '111'],
                ['4', '2', '222'],
                ['2.5', '2', 'test'],
                ['1', '3', 'test1']
            ]

            let arbiter = require('../../../modules/arbiter')
            arbiter.balance = jest.fn()
            arbiter.balance.mockResolvedValue(2)

            let signning = require('../../../modules/sign')
            signning.sign = jest.fn()
            signning.sign.mockResolvedValue('blah')

            let result = await helper.processOrders(wsOrdersArr, currentLaOrderBook, market, type)

            console.log('resullllt', result)

            expect(result.length).toEqual(4)
            expect(result[0]).toEqual(expectedResult[0])
            expect(result[1][0]).toEqual(expectedResult[1][0])
            expect(result[1][1]).toEqual(expectedResult[1][1])
            expect(result[2][0]).toEqual(expectedResult[2][0])
            expect(result[2][1]).toEqual(expectedResult[2][1])
            expect(result[3][0]).toEqual(expectedResult[3][0])
            expect(result[3][1]).toEqual(expectedResult[3][1])
        })

        test('multiple ws orders -- ASKS', async () => {
            let wsOrdersArr = [
                ['1', '5', []],
                ['2', '0.00000000', []],
                ['2.5', '0.00000000', []],
                ['4', '10', []]
            ]
            let currentLaOrderBook = [
                ['1', '7', '444'],
                ['2', '2', '333'],
                ['4', '2', '222'],
                ['6', '2', '111']
            ]
            let type = 'ask'
            let market = 'LTC_BTC'

            let expectedResult = [
                ['1', '5', 'test0'],
                ['4', '8', 'test1']
            ]

            let arbiter = require('../../../modules/arbiter')
            arbiter.balance = jest.fn()
            arbiter.balance.mockResolvedValue(0)

            let signning = require('../../../modules/sign')
            signning.sign = jest.fn()
            signning.sign.mockResolvedValue('blah')

            let result = await helper.processOrders(wsOrdersArr, currentLaOrderBook, market, type)

            console.log('resullllt', result)

            expect(result.length).toEqual(2)
            expect(result[0][0]).toEqual(expectedResult[0][0])
            expect(result[0][1]).toEqual(expectedResult[0][1])
            expect(result[1][0]).toEqual(expectedResult[1][0])
            expect(result[1][1]).toEqual(expectedResult[1][1])

        })

    })

})
