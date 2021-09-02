
/*

        Admin commands
                - lc00
 */


let TAG = '| adminCommands |'
const util = require('@arbiter/arb-redis')
const redis = util.redis
const log = require('@arbiter/dumb-lumberjack')()
const hte = require('./hte')

module.exports = {
    coinsBalances: function ()
    {
        return get_coins_balances()
    },
    orders: function (account)
    {
        return get_orders(account)
    },
    users: function ()
    {
        return get_users()
    }
}

//TODO Build arbiter report


//Shutdown tradeing on x market
let shutdown_trading = async function(market) {
    let tag = TAG + ' | shutdown_trading | '
    try {

    } catch (e) {
        console.error(tag, e)
    }
}
//cancel all orders

//panic!
    // shutdown all markets
    // cancel all orders
    // fullfills cancels
    // maintenance mode


let get_coins_balances = async function() {
    let tag = TAG + ' | get_coins_balances | '
    let debug = false
    try {
        let result = await redis.hgetall('coinsBalances')
        if(debug) console.log(result)
    } catch (e) {
        console.error(tag, e)
    }
}

let get_orders = async function(account) {
    let tag = TAG + ' | get_orders | '
    let debug = false
    try {
        let result = await redis.smembers('accountOrders:' + account)
        if(debug) console.log(result)
    } catch (e) {
        console.error(tag, e)
    }
}


let get_users = async function () {
    let tag = TAG + ' | get_users | '
    let debug = false
    try{
        let result = await redis.smembers('allAccounts')
        if(debug) console.log(result)
    } catch (e) {
        console.error(tag, e)
    }
}
