/*


    Get all entries

    sort by time

    play array

    for each

    nonce +1

    balances = balances

    sign checkpoint
        (only sign what you can validate from scratch)


    //TODO bignum
     | audit-trade-worker |  | do_work |  events:  { credits:
   [ { id: 776375,
       time: 1525850621003,
       tradeId: 4434885,
       coin: 'BTC',
       amount: 0.05172008000000001,
       account: 'master:binance' } ],
       Rabbel

 */

// Load the full build.
var _ = require('lodash');


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
let {reportLA,credits,debits,trades,transfers,txs} = require('../modules/mongo.js')



const do_work = async function(){
    let tag = TAG + " | do_work | "
    try{
        //get all trades
        let allTrades = await trades.find({},{sort:-1})
        log.info(tag,"allTrades: ",allTrades.length)
        log.debug(tag,"allTrades: ",allTrades)
        //let allTrades = []

        //get all transfers
        let allTransfers = await transfers.find({},{sort:-1})
        log.info(tag,"allTransfers: ",allTransfers.length)
        log.debug(tag,"allTransfers: ",allTransfers)

        //combine
        let allTX = _.concat(allTrades, allTransfers)
        log.info(tag,"allTX: ",allTX.length)

        allTX = allTX.sort((a, b) => {
            return a['time'] > b['time'];
        });

        log.info(tag,"(sorted) allTX: ",allTX.length)

        //RULE: chronologically enforced accounting

        for(let i = 0;i < allTX.length;i++){
            let tx = allTX[i]
            log.info(tag,"tx: ",tx)

            if(!tx.time){
                tx.transfer = true
                tx.time = tx.insertTime
                tx.coin = tx.asset
            }
            tx.txid = tx.txId
            //push to mongo
            let saveResult = await txs.insert(tx)
            log.info(tag,"saveResult: ",saveResult)
        }





        return true
    }catch(e){
        log.error(e)
    }
}
do_work()
