let trades = [
    {
        "symbol" : "ETHBTC",
        "id" : 17326724,
        "orderId" : 47415337,
        "price" : "0.07366100",
        "qty" : "0.13600000",
        "commission" : "0.00013600",
        "commissionAsset" : "ETH",
        "time" : 1515375544477.0,
        "isBuyer" : true,
        "isMaker" : false,
        "isBestMatch" : true
    }
]


require('dotenv').config({path:"../.env"});
const TAG = " | audit-trade-worker | "
const log = require('@arbiter/dumb-lumberjack')()
const config = require("../configs/env")

//
const util = require('../modules/redis')
//const redis = util.redis
const Redis = require('then-redis')
const redis = Redis.createClient('redis://' + config.REDIS_IP + ':' + config.REDIS_PORT)
const publisher = util.publisher


const do_work = async function(){
    let tag = TAG + " | do_work | "
    try{
        //
        for(let i = 0; i < trades.length;i++){
            let trade = trades[i]
            //add to queue
            let isPushed = await redis.lpush('queue:trades:audit',JSON.stringify(trade))
            log.debug(tag,"isPushed",isPushed)
        }

    }catch(e){
        log.error(e)
    }
}
do_work()
