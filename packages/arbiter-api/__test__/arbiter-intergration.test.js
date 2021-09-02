/*
        Arbiter integration test
                    -Highlander

        Dependancy
            * coins
            * redis

        TODO mock dependiancies

        Goals:
            * get valid account info
            * generate valid addresses over API
            * fund account from coin wallet
            * Arbiter reconized deposit and credited for correct amount
            * Arbiter can trade as expected
            * Arbiter debits account apon order submission
            * Arbiter credits account apon order completions
            * Arbiter withdrawals funds to coin
            * Arbiter updates balances correctly after withdrawal

       Notes:
            * this integration test is intended to be run agienst TESTNET arbiter project
            * It has not been mocked and spends testnet coin for primary functions

 */

require('dotenv').config({ path: '../../../.env' })
// require('dotenv').config()
const config = require('../configs/env')
//console.log(config)
//let arbiter = require('../modules/arbiter.js')
let arbiter = require('@arbiter/arb-api-client')
const when = require('when')
const log = require('@arbiter/dumb-lumberjack')()
const uuid = require('node-uuid')
let { btc } = require('@arbiter/arb-daemons-manager').daemons
// console.log(config)

let pause = function (length) {
    let d = when.defer()
    let done = function () { d.resolve(true) }
    setTimeout(done, length * 1000)
    return d.promise
}

describe(' - Intergration test for project Arbiter liquidty agent - ', () => {
    let depositAddress
    let depositAmount = 0.001
    let txidDeposit
    let balanceStart
    let orderId = uuid.v4()
    test('config is required correctly', () => {
        // get account info
        // log.debug(config)
        expect(config.AGENT_BTC_SIGNING_PRIVKEY).toBeDefined()
        expect(config.AGENT_BTC_MASTER).toBeDefined()
    })

    test('authentation protocal enforced', async () => {
        // get account info
        let data = await arbiter.getInfo()
        log.debug('data: ', data)

        log.debug('balanceStart: ', balanceStart)
        // data = JSON.parse(data)
        expect(data.balances.BTC).toBeDefined()
        // set balanceStart
        balanceStart = data.balances.BTC
        log.debug('balanceStart: ', balanceStart)
        expect(balanceStart).toBeDefined()

        // TODO validate sig
    })

    test('gives valid account object', async () => {
        // get account info
        let payload = await arbiter.getInfo()
        log.debug('payload: ', payload)

        expect(payload).toBeDefined()
        expect(payload.type).toBeDefined()
    })

    test('acquire address', async () => {
        // get account info
        let payload = await arbiter.address('BTC')
        log.debug('payload: ', payload)

        expect(payload).toBeDefined()
        depositAddress = payload

        // TODO validate address
    })

    test('address is static', async () => {
        // get account info
        let address = await arbiter.address('BTC')
        log.debug('address: ', address)
        expect(address).toEqual(depositAddress)
    })

    test('can fund address from coin', async () => {
        txidDeposit = await btc.sendToAddress(depositAddress, depositAmount)
        expect(txidDeposit).toBeDefined()
        log.debug('txidDeposit: ', txidDeposit)
    })

    test('Arbiter detects deposit', async () => {
        await pause(1)
        // get balance coin
        // get account info
        let balance = await arbiter.balance('BTC')
        log.debug('(pre) balance: ', balance)

        log.debug('balance: ', balance)

        balance = balance * 100000000
        balance = parseInt(balance)
        log.debug('balance: ', balance)

        // expect it to equal startBalance + new
        let expectedBalance = parseInt(balanceStart) + 100000

        log.debug('balance: ', typeof (balance))
        log.debug('expectedBalance: ', typeof (expectedBalance))

        // TODO PAUSE, try again

        expect(balance).toEqual(expectedBalance)
    })

    test('agent can place limit order (BTC_LTC)', async () => {
        balanceStart = await arbiter.balance('BTC')
        log.debug('balanceStart: ', balanceStart)
        balanceStart = parseFloat(balanceStart) * 100000000

        let market = 'LTC_BTC'
        let quantity = 0.001
        let rate = '0.01509611'
        let type = 'bid'
        // let orderId = uuid.v4()
        let response = await arbiter.limit(orderId, market, quantity, rate, type)
        log.debug('response: ', response)
        expect(response.orderId).toBeDefined()
        expect(response.isValid).toBe(true)
        expect(response.isAccounted).toBe(true)

        // expect orderId
        expect(response.orderId).toBeDefined()
        // expect(response.account).toEqual(config.AGENT_BTC_MASTER)
        expect(response.newBalance).toBeDefined()
        // expect new balance to be correct
        let newBalance = response.newBalance
        newBalance = +parseFloat(newBalance) * 100000000
        log.debug('newBalance: ', newBalance)
        log.debug('newBalance: ', typeof (newBalance))

        log.debug('balanceStart: ', balanceStart)
        log.debug('balanceStart: ', typeof (balanceStart))
        let expectedBalance = balanceStart - 100000
        expect(newBalance).toEqual(expectedBalance)
    })

    test('agent can cancel limit order (BTC_LTC)', async () => {
        let tag = ' | cancel | '
        balanceStart = await arbiter.balance('BTC')
        log.debug('balanceStart: ', balanceStart)
        balanceStart = +parseFloat(balanceStart) * 100000000
        log.debug(tag, 'balanceStart: ', balanceStart)
        log.debug(tag, 'balanceStart: ', typeof (balanceStart))

        let response = await arbiter.cancel(orderId)
        // expect orderId
        expect(response.newBalance).toBeDefined()
        // //expect new balance to be correct
        let newBalance = response.newBalance
        newBalance = +parseFloat(newBalance) * 100000000

        let expectedBalance = balanceStart + 100000
        expect(newBalance).toEqual(expectedBalance)
    })

    // ASK

    // create one of each market bid/ask
    //ETH
    orderId = uuid.v4()
    log.debug('new orderId: ', orderId)
    test('agent can place limit order (BTC_ETH)', async () => {
        let tag = ' | limit BTC_ETH | '
        balanceStart = await arbiter.balance('BTC')
        log.debug(tag, 'balanceStart: ', balanceStart)
        balanceStart = parseFloat(balanceStart) * 100000000

        let market = 'ETH_BTC'
        let quantity = 0.001
        let rate = 0.06415000
        let type = 'bid'
        // let orderId = uuid.v4()
        let response = await arbiter.limit(orderId, market, quantity, rate, type)
        log.debug(tag, 'response: ', response)
        expect(response.isValid).toBe(true)
        expect(response.isAccounted).toBe(true)

        // expect orderId
        expect(response.orderId).toBeDefined()
        // expect(response.account).toEqual(config.AGENT_BTC_MASTER)
        expect(response.newBalance).toBeDefined()
        // expect new balance to be correct
        let newBalance = response.newBalance
        newBalance = +parseFloat(newBalance) * 100000000
        log.debug(tag, 'newBalance: ', newBalance)
        log.debug(tag, 'newBalance: ', typeof (newBalance))

        log.debug(tag, 'balanceStart: ', balanceStart)
        log.debug(tag, 'balanceStart: ', typeof (balanceStart))
        let expectedBalance = balanceStart - 100000
        expect(newBalance).toEqual(expectedBalance)
    })

    test('agent can cancel limit order (BTC_ETH)', async () => {
        let tag = ' | cancel (BTC_ETH) | '
        balanceStart = await arbiter.balance('BTC')
        log.debug('balanceStart: ', balanceStart)
        balanceStart = +parseFloat(balanceStart) * 100000000
        log.debug(tag, 'balanceStart: ', balanceStart)
        log.debug(tag, 'balanceStart: ', typeof (balanceStart))

        let response = await arbiter.cancel(orderId)
        // expect orderId
        expect(response.newBalance).toBeDefined()
        // //expect new balance to be correct
        let newBalance = response.newBalance
        newBalance = +parseFloat(newBalance) * 100000000

        let expectedBalance = balanceStart + 100000
        expect(newBalance).toEqual(expectedBalance)
    })

    // GNT
    orderId = uuid.v4()
    log.debug('new orderId: ', orderId)
    test('agent can place limit order (BTC_GNT)', async () => {
        let tag = ' | limit BTC_ETH | '
        balanceStart = await arbiter.balance('BTC')
        log.debug(tag, 'balanceStart: ', balanceStart)
        balanceStart = parseFloat(balanceStart) * 100000000

        let market = 'GNT_BTC'
        let quantity = 0.001
        let rate = 0.00004487
        let type = 'bid'
        // let orderId = uuid.v4()
        let response = await arbiter.limit(orderId, market, quantity, rate, type)
        log.debug(tag, 'response: ', response)

        // expect orderId
        expect(response.orderId).toBeDefined()
        // expect(response.account).toEqual(config.AGENT_BTC_MASTER)
        expect(response.newBalance).toBeDefined()
        // expect new balance to be correct
        let newBalance = response.newBalance
        newBalance = +parseFloat(newBalance) * 100000000
        log.debug(tag, 'newBalance: ', newBalance)
        log.debug(tag, 'newBalance: ', typeof (newBalance))

        log.debug(tag, 'balanceStart: ', balanceStart)
        log.debug(tag, 'balanceStart: ', typeof (balanceStart))
        let expectedBalance = balanceStart - 100000
        expect(newBalance).toEqual(expectedBalance)
    })

    test('agent can cancel limit order (GNT_ETH)', async () => {
        let tag = ' | cancel (BTC_ETH) | '
        balanceStart = await arbiter.balance('BTC')
        log.debug('balanceStart: ', balanceStart)
        balanceStart = +parseFloat(balanceStart) * 100000000
        log.debug(tag, 'balanceStart: ', balanceStart)
        log.debug(tag, 'balanceStart: ', typeof (balanceStart))

        let response = await arbiter.cancel(orderId)
        // expect orderId
        expect(response.newBalance).toBeDefined()
        // //expect new balance to be correct
        let newBalance = response.newBalance
        newBalance = +parseFloat(newBalance) * 100000000

        let expectedBalance = balanceStart + 100000
        expect(newBalance).toEqual(expectedBalance)
    })

    // ASKS ******
    //LTC
    let orderId2 = uuid.v4()
    log.debug('new orderId: ', orderId2)
    test('agent can place limit order (LTC_BTC) ask', async () => {
        let tag = ' | limit BTC_ETH | '
        balanceStart = await arbiter.balance('LTC')
        log.debug(tag, 'balanceStart: ', balanceStart)
        balanceStart = parseFloat(balanceStart) * 100000000

        let market = 'LTC_BTC'
        let quantity = 0.001
        let rate = 0.012326
        let type = 'ask'
        // let orderId = uuid.v4()
        let response = await arbiter.limit(orderId2, market, quantity, rate, type)
        log.debug(tag, 'response: ', response)

        // expect orderId
        expect(response.orderId).toBeDefined()
        // expect(response.account).toEqual(config.AGENT_BTC_MASTER)
        expect(response.newBalance).toBeDefined()
        // expect new balance to be correct
        let newBalance = response.newBalance
        newBalance = +parseFloat(newBalance) * 100000000
        log.debug(tag, 'newBalance: ', newBalance)
        log.debug(tag, 'newBalance: ', typeof (newBalance))

        log.debug(tag, 'balanceStart: ', balanceStart)
        log.debug(tag, 'balanceStart: ', typeof (balanceStart))
        let expectedBalance = balanceStart - 100000
        expect(newBalance).toEqual(expectedBalance)
    })

    test('agent can cancel limit order (LTC_BTC) ask', async () => {
        let tag = ' | cancel (BTC_ETH) | '
        balanceStart = await arbiter.balance('LTC')
        log.debug('balanceStart: ', balanceStart)
        balanceStart = +parseFloat(balanceStart) * 100000000
        log.debug(tag, 'balanceStart: ', balanceStart)
        log.debug(tag, 'balanceStart: ', typeof (balanceStart))

        let response = await arbiter.cancel(orderId2)
        // expect orderId
        expect(response.newBalance).toBeDefined()
        // //expect new balance to be correct
        let newBalance = response.newBalance
        newBalance = +parseFloat(newBalance) * 100000000

        let expectedBalance = balanceStart + 100000
        expect(newBalance).toEqual(expectedBalance)
    })

    //ETH
    let orderId3 = uuid.v4()
    log.debug('new orderId: ', orderId2)
    test('agent can place limit order (ETH_BTC) ask', async () => {
        let tag = ' | limit BTC_ETH | '
        balanceStart = await arbiter.balance('ETH')
        log.debug(tag, 'balanceStart: ', balanceStart)
        balanceStart = parseFloat(balanceStart) * 100000000

        let market = 'ETH_BTC'
        let quantity = 0.001
        let rate = 0.06415000
        let type = 'ask'
        // let orderId = uuid.v4()
        let response = await arbiter.limit(orderId3, market, quantity, rate, type)
        log.debug(tag, 'response: ', response)

        // expect orderId
        expect(response.orderId).toBeDefined()
        // expect(response.account).toEqual(config.AGENT_BTC_MASTER)
        expect(response.newBalance).toBeDefined()
        // expect new balance to be correct
        let newBalance = response.newBalance
        newBalance = +parseFloat(newBalance) * 100000000
        log.debug(tag, 'newBalance: ', newBalance)
        log.debug(tag, 'newBalance: ', typeof (newBalance))

        log.debug(tag, 'balanceStart: ', balanceStart)
        log.debug(tag, 'balanceStart: ', typeof (balanceStart))
        let expectedBalance = balanceStart - 100000
        expect(newBalance).toEqual(expectedBalance)
    })

    test('agent can cancel limit order (ETH_BTC) ask', async () => {
        let tag = ' | cancel (BTC_ETH) | '
        balanceStart = await arbiter.balance('ETH')
        log.debug('balanceStart: ', balanceStart)
        balanceStart = +parseFloat(balanceStart) * 100000000
        log.debug(tag, 'balanceStart: ', balanceStart)
        log.debug(tag, 'balanceStart: ', typeof (balanceStart))

        let response = await arbiter.cancel(orderId3)
        // expect orderId
        expect(response.newBalance).toBeDefined()
        // //expect new balance to be correct
        let newBalance = response.newBalance
        newBalance = +parseFloat(newBalance) * 100000000

        let expectedBalance = balanceStart + 100000
        expect(newBalance).toEqual(expectedBalance)
    })

    //GNT
    let orderId4 = uuid.v4()
    log.debug('new orderId: ', orderId2)
    test('agent can place limit order (GNT_BTC) ask', async () => {
        let tag = ' | limit GNT_BTC | '
        balanceStart = await arbiter.balance('GNT')
        log.debug(tag, 'balanceStart: ', balanceStart)
        balanceStart = parseFloat(balanceStart) * 100000000

        let market = 'GNT_BTC'
        let quantity = 1
        let rate = 0.00004487
        let type = 'ask'
        // let orderId = uuid.v4()
        let response = await arbiter.limit(orderId4, market, quantity, rate, type)
        log.debug(tag, 'response: ', response)

        // expect orderId
        expect(response.orderId).toBeDefined()
        // expect(response.account).toEqual(config.AGENT_BTC_MASTER)
        expect(response.newBalance).toBeDefined()
        // expect new balance to be correct
        let newBalance = response.newBalance
        newBalance = +parseFloat(newBalance) * 100000000
        log.debug(tag, 'newBalance: ', newBalance)
        log.debug(tag, 'newBalance: ', typeof (newBalance))

        log.debug(tag, 'balanceStart: ', balanceStart)
        log.debug(tag, 'balanceStart: ', typeof (balanceStart))
        let expectedBalance = balanceStart - 100000000
        expect(newBalance).toEqual(expectedBalance)
    })

    test('agent can cancel limit order (GNT_BTC) ask', async () => {
        let tag = ' | cancel (GNT_BTC) | '
        balanceStart = await arbiter.balance('GNT')
        log.debug('balanceStart: ', balanceStart)
        balanceStart = +parseFloat(balanceStart) * 100000000
        log.debug(tag, 'balanceStart: ', balanceStart)
        log.debug(tag, 'balanceStart: ', typeof (balanceStart))

        let response = await arbiter.cancel(orderId4)
        // expect orderId
        expect(response.newBalance).toBeDefined()
        // //expect new balance to be correct
        let newBalance = response.newBalance
        newBalance = +parseFloat(newBalance) * 100000000

        let expectedBalance = balanceStart + 100000000
        expect(newBalance).toEqual(expectedBalance)
    })

    // cancel all

    // verify balances return to normal

    test.skip('Arbiter withdrawals coin', async () => {
        // get balance coin
        // get account info
        let withdrawal = await arbiter.withdraw('BTC', config.AGENT_BTC_MASTER, depositAmount)
        log.debug('withdrawal: ', withdrawal)

        // expect txid

        // TODO audit amounts
    })
})
