/*
    Exchange controler

    Mange all exchange functions


    Rip history
    audit balances
    return history balances in mongo

    socket/queue based interface


 */

require('dotenv').config();



require('dotenv').config()

const config = require('./configs/env')
//console.log(config)
const util = require('./modules/redis')
const redis = util.redis
let publisher = util.publisher
let subscriber = util.subscriber


const log = require('@arbiter/dumb-lumberjack')()

const TAG = " | trade module | "

let app = require("./modules/liquidity.js")
app.initialize()

/******************************************
 // eventing
 //******************************************/


subscriber.subscribe("trade");
subscriber.subscribe("trade-work");
subscriber.on("message", async function (channel, payloadS)
{
    let tag = TAG + " | tradeAgent pub/sub | "
    try{
        let payload = JSON.parse(payloadS)

        log.info("payload: ",payload)

        //if isMine



        //at to queue
        redis.lpush("queue:tradeing",payloadS)
    }catch(e){
        console.error(tag,"Error: ",e)
    }
})
