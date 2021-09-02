let TAG = " | Oracle Engine | "

const config = require("./configs/env")
const util = require('@arbiter/arb-redis')
const redis = util.redis
const { daemons, getAddressInfo, normalizeCoin } = require('@arbiter/arb-daemons-manager')
const log = require('@arbiter/dumb-lumberjack')()

const rules = require("./modules/rules.js")
const arbiter = require("./modules/arbiter.js")
const oracle = require("./modules/oracle.js")
module.exports = {
    //Intake order, get new pubkey for cosign
    getNewPubkeyForOrder: function (order) {
        return get_pubkey(order)
    },
    //rules + sign tx
    sign: function (account,order,tx) {
        return sign_transaction(account,order,tx)
    },
    verify: function (address,signature,msg) {
        return verify_signature(address,signature,msg)
    },
    cancel: function (orderId) {
        return cancel_orderId(orderId)
    }
}



//get pubkey for order
const cancel_orderId = async function(orderId){
    let tag = TAG+" | get_pubkey | "
    let debug = true
    try {
        let output = false

        //TODO verify sig

        //ping arbiter on cancel
        try{
            let result = await arbiter.cancel(orderId)
            return result
        }catch(e){
            //handeld exception

            //return yourself

            let partialTx = await oracle.cancel(orderId)
            log.debug(tag,"partialTx: ",partialTx)
            return partialTx
        }

    }catch(e){
        console.error(tag,"Error: ",e)
        throw e
    }
}

//get pubkey for order
const verify_signature = async function(address,signature,msg){
    let tag = TAG+" | get_pubkey | "
    let debug = true
    try {
        let output = false

        let isValid = await daemons.btc.verifyMessage(address,signature,msg)
        if(debug) console.log(tag,"isValid: ",isValid)
        return output
    }catch(e){
        console.error(tag,"Error: ",e)
        throw e
    }
}

//get pubkey for order
const get_pubkey = async function(order){
    let tag = TAG+" | get_pubkey | "
    try {
        await redis.hmset(order.orderId,order)
        if(order.coinIn === "ETH"){
            return order.depositAddress
        }else{
            let coin = parseInt(order.coin, 10)
            let symbol = normalizeCoin(coin)
            let address = await daemons[symbol].getNewAddress()
            let addressInfo = await getAddressInfo(coin, address)

            log.debug(tag,"addressInfo: ",addressInfo)
            //save address info
            await redis.hmset(address,addressInfo)

            let cKey1 = order.arbiterPubKey
            let cKey2 = addressInfo.pubkey
            if(!cKey2) throw Error("105: unable to find pubkey of oracle server!")
            let cKey3 = order.userkey

            //Note: Order Matters!
            log.debug(tag,"(arbiter) Pubkey: ",cKey1)
            log.debug(tag,"(oracle) Pubkey: ",cKey2)
            log.debug(tag,"(customer) Pubkey: ",cKey3)

            let pubKeys = [cKey1, cKey2, cKey3]
            let msAddress = await daemons[symbol].addMultiSigAddress(2, pubKeys)

            if ( typeof msAddress === "object" ) {
              msAddress = msAddress.address || msAddress
            }

            let msInfo = await getAddressInfo(coin, msAddress.address || msAddress)

            log.debug(`saving pubkey info`, msInfo, msAddress)
            await redis.hmset(msAddress,msInfo)
            await redis.hmset(order.orderId,"depositAddress",msAddress)
            await redis.hmset(order.orderId,"pubkeyOracle",cKey2)

            return addressInfo.pubkey
        }
    }catch(e){
        console.error(tag,"Error: ",e)
        throw e
    }
}

//sign transaction
//TODO notice no account??? WTF????
const sign_transaction = async function(account,order,tx){
    let tag = TAG+" | sign_transaction | "
    try {
        //log.debug(tag,"account: ",account)
        log.debug(tag,"order: ",order)
        log.debug(tag,"tx: ",tx)

        let orderId = order.orderId
        if(!orderId) throw Error("102: invalid order payload!")
        //getRawTxInfo
        log.debug(tag,"order",order)
        let orderInfo = await redis.hgetall(orderId)
        if(!orderInfo) throw Error("100: Can Not find order!")
        log.debug(tag,"orderInfo:",orderInfo)

        let coin = order.coinIn
        log.info(tag,"Signing with coin: ",coin)

        let daemon = daemons[coin.toLowerCase()]

        //let isValid = await rules.validate(tx,order,orderInfo)
        //if(!isValid) throw Error("102: Invalid order!" )

        //getRawTxInfo
        if ( coin === "ETH" || coin === "GNT" ) {
          let { signature } = await daemon.signRawTransaction(tx)
          return signature
        } else {
          let rawTxInfo = await daemon.decodeRawTransaction(tx)
          log.debug(tag,"rawTxInfo:",rawTxInfo)

          let signedTx
          // if(coin === "BTC"){
          //     signedTx = await daemon.signRawTransactionWithWallet(tx)
          //     log.debug(tag,"signedTx: ",signedTx)
          // }else {
              signedTx = await daemon.signRawTransaction(tx)
              log.debug(tag,"signedTx: ",signedTx)
          // }


          let txid = await daemon.sendRawTransaction(signedTx.hex)
          if(!txid) throw Error("201: failed to send transaction!!")
          return txid
        }
    }catch(e){
        log.error(tag,"Error: ",e)
        throw e
    }
}
