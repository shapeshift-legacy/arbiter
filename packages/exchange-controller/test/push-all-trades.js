

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

//mongo
let {reportLA,credits,debits,trades,transfers} = require('../modules/mongo.js')
let transfersDB = transfers
let tradesDB = trades

const do_work = async function(){
    let tag = TAG + " | do_work | "
    try{

        //get all trades
        let allTrades = await tradesDB.find()
        log.debug(tag,"allTrades: ",allTrades)

        for(let i = 0; i < allTrades.length;i++){
            let trade = allTrades[i]
            //add to queue
            let isPushed = await redis.lpush('queue:trades:audit',JSON.stringify(trade))
            log.debug(tag,"isPushed",isPushed)
        }




        let allTranfers = await transfersDB.find()
        log.debug(tag,"allTranfers: ",allTranfers)

        for(let i = 0; i < allTranfers.length;i++){
            let transfer = allTranfers[i]
            //add to queue
            let isPushed = await redis.lpush('queue:transfers:audit',JSON.stringify(transfer))
            log.debug(tag,"isPushed",isPushed)
        }

    }catch(e){
        log.error(e)
    }
}
do_work()
