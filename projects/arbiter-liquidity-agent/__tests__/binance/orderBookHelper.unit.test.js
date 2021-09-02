const log = require('@arbiter/dumb-lumberjack')()

describe.only('orderBookHelper for Binance', () => {
    describe('createNewLaOrders()', () =>
    {
        const market = 'LTC_BTC'
        const helper = require('../../modules/binance/orderBookHelper')

        let orderBook = {
            "lastUpdateId": 83338209,
            "bids": [
                [ '0.00211870', '1.00000000', [] ],
                [ '0.00211840', '8.71000000', [] ],
                [ '0.00211830', '57.58000000', [] ],
                [ '0.00211820', '517.13000000', [] ],
                [ '0.00211700', '1.01000000', [] ],
                [ '0.00211670', '5.35000000', [] ],
                [ '0.00211610', '0.48000000', [] ],
                [ '0.00211560', '7.93000000', [] ],
                [ '0.00211510', '24.00000000', [] ],
                [ '0.00211490', '15.06000000', [] ],
            ],
            "asks":[
                ["0.00212230","1"],
                ["0.00212231","1"]
            ]
        }

        test('bids', () => {
            const type = 'bid'

            let expectedResult = {
                bids: [
                    ['0.00211870', '1.00000000']
                ],
                asks: [
                    ["0.00212230","1"],
                    ["0.00212231","1"]
                ]
            }


            let coinBal = 0.002
            let minAmount = '0.001'
            let isFirstTime = true


            let result = helper.createNewLaOrders (market, type, orderBook.bids, coinBal, minAmount, isFirstTime)

            // expect(result.length).toEqual(1)
            // expect(result[0]).toEqual(expectedResult.bids[0])

            log.debug('bids', 'result', result)
        })

        test('asks', () => {
            let type = 'ask'

            let expectedResult = {
                bids: [
                    ['0.00211870', '1.00000000']
                ],
                asks: [
                    ["0.00212230","1"],
                    ["0.00212231","1"]                ]
            }


            let coinBal = 1.000001
            let minAmount = '0.001'
            let isFirstTime = true


            let result = helper.createNewLaOrders (market, type, orderBook.asks, coinBal, minAmount, isFirstTime)

            // expect(result.length).toEqual(1)
            // expect(result[0]).toEqual(expectedResult.bids[0])

            log.debug('asks',  'result', result)
        })


    })
})
