
/*
    Arbiter report builder

    listen to queue when to build reports

    dump all into hosted


    work object

    {
    start:
    end:
    type:
    }

    out:

    .csv




    Notes: orders do not fall into here untill AFTER completion


    Order ID	User ID	Timestamp	Status	Input Asset	Output Asset	Input Amount	Output Amount	Matched w/ Liquidity Agent?	Arbiter Fee	Maker / Taker Fee
 */



/*


        Build charts on demand


        types:

            pie balances

 */




require('dotenv').config();
//require('dotenv').config({path:"../.env"});

const TAG = " | audit-transfer-worker | "
const log = require('@arbiter/dumb-lumberjack')()
const config = require("../configs/env")

const fs = require('fs');

//chartData
const reports = require('../modules/reports')

//redis
const util = require('@arbiter/arb-redis')
//const redis = util.redis
// NOTE: we create NEW CONNECTION!
// these workers are BLOCKING! do not use on main thread!!
const Redis = require('then-redis')
const redis = Redis.createClient('redis://' + config.REDIS_IP + ':' + config.REDIS_PORT)
const publisher = util.publisher



//mongo

//mongo
// let {reportLA,credits,debits,trades,transfers} = require('@arbiter/arb-mongo')
// let transfersDB = transfers
// let tradesDB = trades


const build_report = async function(reportInfo){
    let tag = TAG + " | build_chart | "
    try{
        log.info(tag,"reportInfo: ",reportInfo)
        log.info(tag,"reportInfo: ",typeof(reportInfo))
        log.info(tag,"type: ",reportInfo.type)

        let chartData
        switch(reportInfo.type) {
            case "balanceSheet":

                await reports.balanceSheet(reportInfo.account)

                break;
            case "txs":

                //get data
                await reports.transactions(reportInfo.account)

                break;
            default:
                throw Error("101: unhandled type")
        }



        let type = reportInfo.type


        let filename = type+":"+ new Date().getTime()

        return 'Complete'



    }catch(e){
        log.error(e)
        throw e
    }
}


let do_work = async function () {
    let tag = TAG + ' | do_work | '
    try {
        let workLeft = await redis.llen('queue:reports')
        log.debug('orders left in queue: ', workLeft)
        let transfer = await redis.blpop('queue:reports',10)

        if (transfer){
            log.info(tag, 'transfer: ', transfer)
            transfer = JSON.parse(transfer[1])

            await build_report(transfer)
            let workLeft = await redis.llen('queue:reports')
            log.debug('orders left in queue: ', workLeft)
            do_work()
        } else {
            do_work()
        }
    } catch (e) {
        console.error(tag, 'e: ', e)
        console.error(tag, 'Bad action: ', e)
        do_work()
    }
}


do_work()
log.info(TAG+'worker started!')
