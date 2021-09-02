/**
 * Created by highlander on 9/7/17.
 */
/**
 * Created by highlander on 9/4/17.
 */

/*
    Report module

        Add work to be done for report building worker

 */

const log = require('@arbiter/dumb-lumberjack')()

//redis
const util = require('@arbiter/arb-redis')
const redis = util.redis

let TAG = " | report-builder | "


module.exports = {
    balanceSheet: async function (account)
    {
        let tag = TAG + " | account | "
        let debug = true
        try{
            let output = []
            log.debug(tag,"account: ",account)

            let report = {
                type:"balanceSheet",
                account,
                time:"now"
            }
            redis.lpush("queue:reports",JSON.stringify(report))


            return {message:"added work to queue!"}
        }catch(e){
            console.error(tag,"e: ",e)
        }
    },
    transactions: async function (account)
    {
        let tag = TAG + " | account | "
        let debug = true
        try{
            let output = []
            log.debug(tag,"account: ",account)

            let report = {
                type:"txs",
                account,
                time:"now"
            }
            redis.lpush("queue:reports",JSON.stringify(report))


            return {message:"added work to queue!"}
        }catch(e){
            console.error(tag,"e: ",e)
        }
    },
    //users

    //match events

    //orders
}


const to_amount_usd = function(amountBTC){
    const d = when.defer();
    btc.fromBTC(amountBTC,"USD",function(err, amountUSD){
        console.log("amountUSD: ",amountUSD);
        d.resolve(amountUSD)
    });
    return d.promise
}
