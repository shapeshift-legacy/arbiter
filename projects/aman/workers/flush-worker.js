


let TAG = " | fullfillment | "

const ForwarderContract = require('../modules/forwarder-contract')
const { redis } = require('./../modules/redis-manager')
const pause = require('../modules/pause')
const { getMasterAddress } = require('../modules/address-manager')
const log = require('@arbiter/dumb-lumberjack')()

let do_work = async function(){
    let tag = TAG+" | do_work | "
    try {
        let address = await redis.spop("queue:eth:flush")

        if(address){

            let forwarder = new ForwarderContract({
                atAddress: address,
                gasAddress: await getMasterAddress()
            })

            let success = await forwarder.flush()
            log.debug(tag,"success: ",success)

            await pause(10)
        }else{
            console.log("idle!")
            await pause(1)
            do_work()
        }


    } catch(e){
        //if error try again

        console.error(tag,"e: ",e)
        console.error(tag,"Bad action: ",e)
        await pause(1)
        do_work()

    }
}

do_work()
