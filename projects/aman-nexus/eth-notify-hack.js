require('dotenv').config();
const TAG = " | wallet-notify | "
const request = require('request')
const { subscriber } = require('./modules/redis')
const config = require("./configs/env")
const log = require('@arbiter/dumb-lumberjack')()

var get_request = function(url){
    return new Promise((resolve, reject) => {
        var tag = TAG + " | get_request | "
        console.log(tag,"url:",url)
        request(url, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                resolve(body)
            } else {
                console.error(tag,"e: ",error)
                reject(error)
            }
        })
    })
}


subscriber.subscribe("credits");
subscriber.on("message", async function (channel, payloadS)
{
    var tag = TAG+ " | payments | "
    let debug = true
    try{
        log.debug(tag,"payloadS: ",payloadS)
        let payload = JSON.parse(payloadS)
        log.debug(tag,"payload: ",payload)

        //push coin

        //push txid
        if(payload.coin && payload.txid){
            //log.debug(tag,"valid!")
            let url = config.WALLET_NOTIFY_URL + "/api/v1/txid/"+payload.coin+"/" +payload.txid
            await get_request(url)
        }

    }catch(e){
        console.error(tag,"Error: ",e)
    }
})
