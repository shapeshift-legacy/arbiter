const log = require('@arbiter/dumb-lumberjack')()
const TAG = " | rules | "

let { btc,ltc,eth} = require('@arbiter/arb-daemons-manager').daemons
let daemons = {btc,ltc,eth}

const util = require('@arbiter/arb-redis')
const redis = util.redis
const subscriber = util.subscriber
const publisher = util.publisher

const config = require('../configs/env')
/*
    Rules engine

    * verify send to customer as valid
    * verify sweep address is arbiter master
    * verify inputs are unspent
    * verify amounts

 */

module.exports = {
    validate: function(rawTx,orderInfoArbiter) {
        return verify_transaction(rawTx,orderInfoArbiter);
    },
    validateFullfillment: function(rawTx,orderInfoArbiter) {
        return verify_fullfillment_transaction(rawTx,orderInfoArbiter);
    },
    validateSweep: function(rawTx,orderInfoArbiter) {
        return verify_sweep_transaction(rawTx,orderInfoArbiter);
    },
    validateReturn: function(rawTx,orderInfoArbiter) {
        return verify_sweep_transaction(rawTx,orderInfoArbiter);
    },
}


/*******************************************************
// Primary
//*******************************************************/

const verify_fullfillment = async function(rawTx,orderInfoArbiter,orderInfoOracle){
    let tag = TAG+" | verify_fullfillment | "
    let debug = true
    try {
        let output = {}

        return output
    }catch(e){
        console.error(tag,"Error: ",e)
        throw e
    }
}


const verify_sweep = async function(rawTx,orderInfoArbiter,orderInfoOracle){
    let tag = TAG+" | verify_fullfillment | "
    let debug = true
    try {
        let output = {}

        return output
    }catch(e){
        console.error(tag,"Error: ",e)
        throw e
    }
}


/*******************************************************
 // Lib
 //*******************************************************/

//sign transaction
const verify_transaction = async function(rawTx,orderInfoArbiter){
    let tag = TAG+" | verify_transaction | "
    try {
        let output = false
        if(!rawTx) throw Error("101: missing rawTx")
        if(!orderInfoArbiter) throw Error("102: missing orderInfoArbiter")
        //if(!orderInfoOracle) throw Error("103: missing orderInfoOracle")

        let orderInfoOracle = await redis.hgetall(orderInfoArbiter.orderId)

        log.debug(tag,"rawTx: ",rawTx)
        log.debug(tag,"orderInfoArbiter: ",orderInfoArbiter)
        log.debug(tag,"orderInfoOracle: ",orderInfoOracle)

        let isReturn = false
        if(orderInfoArbiter.return) isReturn = true

        if(!isReturn){
            log.debug(tag," fullfillment tx detected")
            //TODO validate customer, arbiter and oracle agree with data

            //TODO validate sigs && customer info


            //todo confimations

            //decode transaction to customer
            // did customer get paid!!!

            let txidFullfillment = orderInfoArbiter.txidOut
            log.debug(tag,"txidFullfillment: ",txidFullfillment)

            let fullfillmentTxRaw = await daemons[orderInfoArbiter.coinOut.toLowerCase()].getRawTransaction(txidFullfillment)
            log.debug(tag,"fullfillmentTxRaw: ",fullfillmentTxRaw)

            let fullfillmentTxDecoded = await daemons[orderInfoArbiter.coinOut.toLowerCase()].decodeRawTransaction(fullfillmentTxRaw)

            //TODO validate from signed raw from customer!
            let validFullfillment = await verify_fullfillment_transaction(fullfillmentTxDecoded,orderInfoOracle)
            log.debug(tag,"validFullfillment: ",validFullfillment)


            // TODO validate sweep
            let validSweep = await verify_fullfillment_transaction(fullfillmentTxDecoded,orderInfoOracle)

            if(validFullfillment && validSweep){
                output = true
            }
        }else{
            log.debug(tag," return tx detected")

            //decode transaction to customer
            // did customer get paid!!!

            let returnTxDecoded = await daemons[orderInfoArbiter.coinIn.toLowerCase()].decodeRawTransaction(rawTx)


            // TODO validate sweep
            let validReturn = await verify_return_transaction(returnTxDecoded,orderInfoOracle)

            if(validReturn){
                output = true
            }
        }



        return output
    }catch(e){
        console.error(tag,"Error: ",e)
        throw e
    }
}


/*
    Rules:
        Is return to customers address

        is return full amount - fee

 */

const verify_return_transaction = function(txInfo,orderInfo){
    let tag = TAG+" | verify_sweep_transaction | "
    try {
        let output = false
        //
        log.debug(tag,"txInfo: ",txInfo)
        log.debug(tag,"orderInfo: ",orderInfo)

        //get customers address
        let addressOfCustomer = orderInfo.returnAddress

        //find output
        let outputs = txInfo.vout
        let input = txInfo.vin

        //is sweep to master address
        for (let i = 0; i < outputs.length; i++) {
            let outEvent = outputs[i]
            log.debug(tag,"outEvent: ",outEvent)
            let addresses = outEvent.scriptPubKey.addresses
            log.debug(tag,"addresses: ",addresses)
            //addresses
            for (let j = 0; j < addresses.length; j++) {
                let address = addresses[j]
                log.debug("address: ",address)
                //
                if(addressOfCustomer === address){
                    log.debug(tag,"address found! MATCH address",address)
                    output = true

                    // TODO validate amount = customer input - fee
                    // let amountSent = outEvent.value
                    // let amountExpected = orderInfo.amountOutMin
                    // log.debug(tag,"amountSent: ",amountSent)
                    // log.debug(tag,"amountExpected: ",amountExpected)
                    // if(amountSent >= amountExpected){
                    //     log.debug(tag," success!" )
                    //     output = true
                    // }
                }
            }
        }


        return output
    }catch(e){
        console.error(tag,"Error: ",e)
        throw e
    }
}


/*
    Rules:
        Is sweep to arbiters master address

        is sweep spending any inputs not sent by customer

 */

const verify_sweep_transaction = function(txInfo,orderInfo){
    let tag = TAG+" | verify_sweep_transaction | "
    try {
        let output = false
        //
        log.debug(tag,"txInfo: ",txInfo)
        log.debug(tag,"orderInfo: ",orderInfo)

        //get customers address
        let configName = "ARBITER_MASTER_"+orderInfo.coinIn.toUpperCase()
        let addressOfArbiter = config[configName]

        //find output
        let outputs = txInfo.vout
        let input = txInfo.vin

        //is sweep to master address
        for (let i = 0; i < outputs.length; i++) {
            let outEvent = outputs[i]
            log.debug(tag,"outEvent: ",outEvent)
            let addresses = outEvent.scriptPubKey.addresses
            log.debug(tag,"addresses: ",addresses)
            //addresses
            for (let j = 0; j < addresses.length; j++) {
                let address = addresses[j]
                log.debug("address: ",address)
                //
                if(addressOfArbiter === address){
                    log.debug(tag,"address found! MATCH address",address)
                    output = true
                    // TODO validate amount = customer input - fee
                    // let amountSent = outEvent.value
                    // let amountExpected = orderInfo.amountOutMin
                    // log.debug(tag,"amountSent: ",amountSent)
                    // log.debug(tag,"amountExpected: ",amountExpected)
                    // if(amountSent >= amountExpected){
                    //     log.debug(tag," success!" )
                    //     output = true
                    // }
                }
            }
        }


        return output
    }catch(e){
        console.error(tag,"Error: ",e)
        throw e
    }
}



/*
    Rules:
        Is paying customers address

        customer received correct amount


 */

const verify_fullfillment_transaction = function(txInfo,orderInfo){
    let tag = TAG+" | verify_fullfillment_transaction | "
    try {
        let output = false
        //
        log.debug(tag,"txInfo: ",txInfo)
        log.debug(tag,"orderInfo: ",orderInfo)

        //get customers address
        let addressOfCustomer = orderInfo.withdrawalAddress

        //find output
        let outputs = txInfo.vout

        for (let i = 0; i < outputs.length; i++) {
            let outEvent = outputs[i]
            log.debug(tag,"outEvent: ",outEvent)
            let addresses = outEvent.scriptPubKey.addresses
            log.debug(tag,"addresses: ",addresses)
            //addresses
            for (let j = 0; j < addresses.length; j++) {
                let address = addresses[j]
                log.debug("address: ",address)
                //
                if(addressOfCustomer === address){
                    log.debug(tag,"address found! MATCH address",address)
                    let amountSent = outEvent.value
                    let amountExpected = orderInfo.amountOutMin
                    log.debug(tag,"amountSent: ",amountSent)
                    log.debug(tag,"amountExpected: ",amountExpected)
                    if(amountSent >= amountExpected){
                        log.debug(tag," success!" )
                        output = true
                    }
                }
            }
        }


        return output
    }catch(e){
        console.error(tag,"Error: ",e)
        throw e
    }
}



