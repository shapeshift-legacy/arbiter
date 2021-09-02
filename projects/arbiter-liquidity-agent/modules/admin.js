
const uuid = require('node-uuid')
const log = require('@arbiter/dumb-lumberjack')()
const util = require('@arbiter/arb-redis')
const redis = util.redis
let publisher = util.publisher
let subscriber = util.subscriber
const config = require('../configs/env')

const arbiter = require('@arbiter/arb-api-client')
log.debug("config: ",config)
arbiter.init(config.ARBITER_URL,config.AGENT_BTC_MASTER,config.AGENT_BTC_SIGNING_PRIVKEY, true)


let daemons = require('@arbiter/arb-daemons-manager').daemons

/************************************
// Module
//***********************************/

module.exports = {
    // init

    getInfo: function () {
        return get_account_info()
    },
    orders: function () {
        return arbiter.orders()
    },
    // create
    create: function (pair, amount) {
        return create_smart_order(pair, amount)
    },
    // cancel
    cancel: function (orderId) {
        return cancel_order(orderId)
    },
    // fund account
    fund: function (coin, amount) {
        return fund_agent(coin, amount)
    },
    // withdraw
    withdraw: function (coin, amount) {
        return withdraw_agent(coin, amount)
    }
}

/************************************
 // Primary
 //***********************************/


/*

 Withdraw Liquidity agent

 Get address from daemon

 send from arbiter to address

 */


let withdraw_agent = async function (coin, amount) {
    let tag = ' | fund_agent | '
    try {
        let output = {}
        coin = coin.toUpperCase()

        // get address arbiter
        let depositAddress = await daemons[coin.toLowerCase()].getNewAddress()

        let isValid = await daemons[coin.to]

        log.debug(tag, 'depositAddress: ', depositAddress)

        //
        log.debug(tag, 'coins: ', process.env['COINS'])
        log.debug(tag, 'daemons: ', daemons)
        if (daemons[coin.toLowerCase()]) {
            // send moniez
            let txid = await arbiter.withdraw(coin, depositAddress, amount)
            log.debug(tag, ' withdrew moniez!!! txid: ', txid)
            output.txid = txid
            output.msg = 'Withdrew Moniez!'
        } else {
            // display address and ask to send moniez
            return output.msg = 'You must figure out another way to withdraw'
        }

        return output
    } catch (e) {
        console.error(tag, 'Error: ', e)
        throw Error(e)
    }
}



/*
    Fund Liquidity agent

    Get address from arbiter

    send from local client to address

 */
let fund_agent = async function (coin, amount) {
    let tag = ' | fund_agent | '
    try {
        let output = {}
        coin = coin.toUpperCase()

        // get address arbiter
        let depositAddress = await arbiter.address(coin)
        log.debug(tag, 'depositAddress: ', depositAddress)

        //
        log.debug(tag, 'coins: ', process.env['COINS'])
        log.debug(tag, 'daemons: ', daemons)
        if (daemons[coin.toLowerCase()]) {
            // send moniez
            let txid = await daemons[coin.toLowerCase()].sendToAddress(depositAddress, amount)
            log.debug(tag, ' sent moniez!!! txid: ', txid)
            output.txid = txid
            output.msg = 'Moniez sent!'
        } else {
            // display address and ask to send moniez
            return output.msg = 'You must fund this address yourself! deposit Address: ' + depositAddress
        }

        return output
    } catch (e) {
        console.error(tag, 'Error: ', e)
        throw Error(e)
    }
}

/*
    Smart order creation

    get rate

    amount(optional)
    if !amount then amount = 1/5 available balance

 */
let create_smart_order = async function (pair, amount) {
    let tag = ' | create_smart_order | '
    try {
        let output = {}

        //
        let orderId = uuid.v4()
        let quantity
        let rate
        let type
        let market

        if (amount) quantity = amount

        switch (pair) {
            case 'BTC_LTC':
                market = 'LTC_BTC'
                if (!amount) quantity = 1
                rate = 0.012126
                type = 'bid'
                break
            case 'LTC_BTC':
                market = 'LTC_BTC'
                if (!amount) quantity = -1
                rate = 0.003
                type = 'ask'
                break
            case 'ETH_BTC':
                market = 'ETH_BTC'
                if (!amount) quantity = 0.1
                rate = 0.06415000
                type = 'ask'
                break
            case 'BTC_ETH':
                market = 'ETH_BTC'
                if (!amount) quantity = 0.1
                rate = 0.06215000
                type = 'bid'
                break
            case 'GNT_BTC':
                market = 'GNT_BTC'
                if (!amount) quantity = 100
                rate = 0.00004487
                type = 'ask'
                break
            case 'BTC_GNT':
                market = 'GNT_BTC'
                if (!amount) quantity = 100
                rate = 0.00004387
                type = 'bid'
                break
            default:
                log.error(tag, ' Unknown pair')
                break
        }
        if (amount && type === 'ask') {
            quantity = quantity * -1
        }

        // TODO get smart rate
        // let laOrderbookCurrent = await redis.hget('laOrderbookCurrent', market)
        // log.debug(tag,"laOrderbookCurrent: ",laOrderbookCurrent)
        // laOrderbookCurrent = JSON.parse(laOrderbookCurrent)
        //
        // //laOrderbookCurrent = laOrderbookCurrent[0]
        // //low Bid
        // let lowBid = laOrderbookCurrent.bids[0]
        // let highAsk = laOrderbookCurrent.asks[0]
        // log.debug(tag,"lowBid: ",lowBid)
        // log.debug(tag,"highAsk: ",highAsk)

        let result = await arbiter.limit(orderId, market, quantity, rate, type)
        log.debug(tag, '1result: ', result)
        log.debug(tag, '2result: ', typeof (result))

        //
        return output
    } catch (e) {
        console.error(tag, 'Error: ', e)
        throw Error(e)
    }
}

let get_account_info = async function () {
    let tag = ' | get_account_info | '
    try {
        let output = {}
        //account info
        let accountInfo = await arbiter.getInfo()
        log.info(tag,"accountInfo: ",accountInfo)
        output.account = accountInfo.account
        output.nonce = accountInfo.nonce

        // get open orders exchanges

        // get value of orders exchanges

        // get open orders arbiter
        let ordersArbiter = await arbiter.orders()
        output.ordersArbiter = ordersArbiter
        log.debug(tag, 'ordersArbiter: ', ordersArbiter.length)

        // get value of orders arbiter

        // get balances exchanges

        // get balances on arbiter
        let balancesArbiter = await arbiter.balances()
        output.balancesArbiter = balancesArbiter
        log.debug(tag, 'balancesArbiter: ', balancesArbiter)

        // get get value of all accounts

        return output
    } catch (e) {
        console.error(tag, 'Error: ', e)
        throw e
    }
}

let cancel_order = async function (orderId) {
    let tag = ' | cancel_order | '
    try {
        let output = {}

        // cancel all
        if (orderId === 'all') {
            let allOrderIds = []
            // get all orderId's
            let ordersArbiter = await arbiter.orders()
            log.debug(tag, 'ordersArbiter: ', ordersArbiter)

            for (let i = 0; i < ordersArbiter.length; i++) {
                allOrderIds.push(ordersArbiter[i].orderId)
            }
            log.debug(tag, 'allOrderIds: ', allOrderIds)

            // iterate order all and cancel
            for (let i = 0; i < allOrderIds.length; i++) {
                log.debug('cancel order: ', allOrderIds[i])
                let result = await arbiter.cancel(allOrderIds[i])
                log.debug(tag, 'resultCancel: ', result)
            }
        } else {
            let result = await arbiter.cancel(orderId)
            log.debug(tag, 'resultCancel: ', result)
        }

        return output
    } catch (e) {
        console.error(tag, 'Error: ', e)
        throw e
    }
}

/************************************
 // Lib
 //***********************************/
