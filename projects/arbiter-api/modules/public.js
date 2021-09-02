const TAG = ' | (modules/api) PUBLIC | '
const util = require('@arbiter/arb-redis')
const redis = util.redis
const { isClone } = require('./utils')
const { detectClonePayment, detectEthPayment } = require('./payments')
const log = require('@arbiter/dumb-lumberjack')()
const hte = require('./hte.js')
const arbiter = require('./arbiter.js')
const markets = require('./markets.js')
const signing = require('./signing.js')
const mongo = require('@arbiter/arb-mongo')


// export
module.exports = {
    coins: function () {
        return markets.coins()
    },
    order: function (orderId) {
        return get_order_info(orderId)
    },
    pairs: function () {
        return markets.pairs()
    },
    markets: function () {
        return markets.markets()
    },
    orderbook: function (pair) {
        return get_orderbook(pair)
    },
    marketInfo: function (pair) {
        return arbiter.book(pair)
    },
    txid: function (coin, txid) {
        return detect_payment(coin, txid)
    },
    orders: function (body) {
        return get_orders(body)
    },
    globals: function (pair) {
        return get_globals(pair)
    },
    history: function (pair) {
        return get_match_history(pair)
    },
}

/*******************************************
// Primary
//*******************************************/

let get_match_history = async function(pair, from, to) {
    let tag = TAG + ' | get_match_history | '
    try {
        //mongo
        //TODO timeframes
        let query = {
            engine:pair
        }

        //
        let results = await mongo['match-history'].find()
        log.debug(tag,"results: ",results)

        let output = normalize_history(results)

        return output
    } catch (e)
    {
        log.error(tag, e)
        throw e
    }
}


let get_globals = async function(pair, from, to) {
    let tag = TAG + ' | get_globals | '
    try {
        // get_globals
        return redis.hgetall("globals:"+pair)
    } catch (e)
    {
        log.error(tag, e)
        throw e
    }
}

let get_orderbook = async function(pair) {
    let output = await hte.getMarketData(pair)
    log.debug('output:', output)
    return output
}

let get_order_info = async function(orderId) {
    let tag = TAG + ' |get_orders| '
    try {
        let orderInfo = await redis.hgetall(orderId)

        let subtrades = await redis.smembers("subtrades:"+orderId)
        orderInfo.subtrades = subtrades

        return orderInfo
    } catch (e)
    {
        log.error(tag, e)
        throw e
    }
}

let get_orders = async function(body) {
    let tag = TAG + ' |get_orders| '
    try {
        let signature = body.signature
        let account = body.account
        let payload = body.payload

        await signing.validate(account, signature, JSON.stringify(payload))

        return await redis.smembers('accountOrders:' + account)
    } catch (e)
    {
        log.error(tag, e)
        throw e
    }
}


// get pubkey for order
let detect_payment = async function (coin, txid) {
    let tag = TAG+" | detect_payment | "
    try{
        if(!coin) throw Error("101 missing coin from detect payment~!")
        if(!txid) throw Error("102 missing txid from detect payment~!")
        log.debug(tag,"input: ",{coin, txid})
        txid = txid.replace('+', '')

        if ( isClone(coin) ) {
            return await detectClonePayment(coin, txid)
        } else {
            return await detectEthPayment(coin, txid)
        }
    }catch(e){
        log.error(tag,"error: ",e)
        throw e
    }
}

/*******************************************
 // Lib
 //*******************************************/

// Normalize for frontend
// TODO verbosity levels?
let normalize_history = function (results) {
    let tag = TAG+" | detect_payment | "
    try{
        let output = []

        for(let i = 0; i < results.length; i++){
            let result = results[i]
            let entry = {}
            entry.time = result.time
            entry.price = result.restingOrderPrice
            entry.amount = result.matchQuantity
            entry.amountQuote = result.matchQuantity * result.restingOrderPrice
            //
            output.push(entry)
        }

        return output
    }catch(e){
        log.error(tag,"error: ",e)
        throw e
    }
}
