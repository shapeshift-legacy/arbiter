require('dotenv').config({path:"../.env"})

const config = require('../configs/env')
//console.log(config)
const util = require('@arbiter/arb-redis')const redis = util.redis
let publisher = util.publisher
let subscriber = util.subscriber


const log = require('@arbiter/dumb-lumberjack')()

const TAG = " | trade module | "

//******************************************
// eventing
//******************************************


subscriber.subscribe("trade");
subscriber.on("message", async function (channel, payloadS)
{
    let tag = TAG + " | tradeAgent pub/sub | "
    try{
        let payload = JSON.parse(payloadS)

        log.debug("payload: ",payload)

        //if isMine

        //at to queue
        redis.lpush("queue:tradeing",payloadS)
    }catch(e){
        console.error(tag,"Error: ",e)
    }
})
