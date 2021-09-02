/**
 * Created by highlander on 9/7/17.
 */
/**
 * Created by highlander on 9/4/17.
 */
const log = require('@arbiter/dumb-lumberjack')()

//redis
const util = require('@arbiter/arb-redis')
const redis = util.redis

let TAG = " | chart-builder | "


module.exports = {
    //liquidate entire position at market rate
    balanceChart: async function (user)
    {
        let tag = TAG + " | account | "
        let debug = true
        try{
            let output = []
            log.debug(tag,"user: ",user)

            let chart = {
                type:"balance",
                graph:"pie",
                account:"binance",
                time:"now"
            }
            redis.lpush("queue:charts",JSON.stringify(chart))


            return "added work to queue!"
        }catch(e){
            console.error(tag,"e: ",e)
        }
    },

    historyChart: async function (user)
    {
        let tag = TAG + " | account | "
        let debug = true
        try{
            let output = []
            log.debug(tag,"user: ",user)

            let chart = {
                type:"history",
                graph:"jump lines",
                account:"binance",
                time:"all"
            }
            redis.lpush("queue:charts",JSON.stringify(chart))


            return "added work to queue!"
        }catch(e){
            console.error(tag,"e: ",e)
        }
    },

    balancesChart: async function (user)
    {
        let tag = TAG + " | account | "
        let debug = true
        try{
            let output = []
            log.debug(tag,"user: ",user)

            let chart = {
                type:"balances",
                graph:"line",
                account:"binance",
                time:"all"
            }
            redis.lpush("queue:charts",JSON.stringify(chart))


            return "added work to queue!"
        }catch(e){
            console.error(tag,"e: ",e)
        }
    },

    //trades over time

    //credits

    //debits

    //lookup trade

    //balance on date

}


const to_amount_usd = function(amountBTC){
    const d = when.defer();
    btc.fromBTC(amountBTC,"USD",function(err, amountUSD){
        console.log("amountUSD: ",amountUSD);
        d.resolve(amountUSD)
    });
    return d.promise
}
