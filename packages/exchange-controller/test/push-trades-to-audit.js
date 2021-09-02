let trades = [
    { symbol: 'BCCBTC',
        id: 6730679,
        orderId: 36264411,
        price: '0.10248100',
        qty: '0.01500000',
        commission: '0.00001500',
        commissionAsset: 'BCC',
        time: 1524037891774,
        isBuyer: true,
        isMaker: false,
        isBestMatch: true },
    { symbol: 'BCCBTC',
        id: 4315331,
        orderId: 20196810,
        price: '0.15452700',
        qty: '0.12000000',
        commission: '0.00001854',
        commissionAsset: 'BTC',
        time: 1516496299613,
        isBuyer: false,
        isMaker: false,
        isBestMatch: true },
    { symbol: 'BCCBTC',
        id: 4315332,
        orderId: 20196810,
        price: '0.15452500',
        qty: '0.25000000',
        commission: '0.00003863',
        commissionAsset: 'BTC',
        time: 1516496299613,
        isBuyer: false,
        isMaker: false,
        isBestMatch: true },

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
