const TAG = " | oracle-api | "
const log = require('@arbiter/dumb-lumberjack')()


const util = require('@arbiter/arb-redis')
const redis = util.redis
const subscriber = util.subscriber
const publisher = util.publisher

// Project module
const engine = require('../engine.js')
const rules = require('../modules/rules.js')
const daemons = require('@arbiter/arb-daemons-manager').daemons

/*****************************************
 //   module
 //*****************************************/

//NOTE ORDER MATTERS!!!
module.exports = {
    pubkey: function (account,coin,userkey,orderId,arbiterPubKey,depositAddress,coinIn) {
        return get_pubkey_for_order(account,coin,userkey,orderId,arbiterPubKey,depositAddress,coinIn)
    },
    retarget: function (account,orderInfo,orderIdNew) {
        return retarget_order(account,orderInfo,orderIdNew)
    },
    sign: function (account,order,tx) {
        return sign_order(account,order,tx)
    },
    cancel: function (account,orderId) {
        return cancel_order(account,orderId)
    },
    broadcast: function (account,coin,hex) {
        return broadcast_order(account,coin,hex)
    },
}



/*****************************************
 //   primary
 //*****************************************/
const broadcast_order = async function (account,coin,tx) {
    let tag = TAG + ' | get_pubkey_for_order | '
    try {
        //
        log.debug(tag,"account: ",account)
        log.debug(tag,"coin: ",coin)
        log.debug(tag,"tx: ",tx)

        //
        let broadcast
        //TODO multi-coins
        if(coin === 'ETH' || coin === 'GNT'){
            //TODO
            let signature = body.payload.signature
            let orderInfo = await redis.hgetall(body.payload.orderId)
            let accountInfo = await redis.hgetall(orderInfo.signingAddress)
            if (!accountInfo) throw Error('105 can not return! unknown account info! ')
            let daemon = daemons[coin.toLowerCase()]
            log.debug(tag, 'accountInfo: ', accountInfo)
            log.debug(tag,"orderInfo : ",orderInfo)
            let expireTime = orderInfo.expiration
            expireTime = parseInt(expireTime / 1000)
            expireTime = expireTime + 1000000
            let sequenceId = await daemon.getSequenceId(accountInfo.contractAddress)
            log.debug(tag, 'sequenceId: ', sequenceId)
            let contractAddress = accountInfo.contractAddress
            let amount = orderInfo.amountIn
            let payload = {
                contractAddress: contractAddress,
                gasAddress: config.ARBITER_MASTER_ETH,
                toAddress: accountInfo.ethAddress,
                expireTime: expireTime,
                value: amount.toString(),
                data: '0x',
                sequenceId: sequenceId.sequenceId,
                otherSig: signature
            }
            log.debug('payload: ', payload)
            broadcast =  await wallets[coin].sendMultiSig(payload)
        } else {
            //if utxo
            broadcast =  await daemons[coin.toLowerCase()].sendRawTransaction(tx)
        }
        log.debug(tag,"broadcast: ",broadcast)

        return broadcast
    } catch (e) {
        console.error(tag, 'Error: ', e)
        throw e
    }
}


const get_pubkey_for_order = async function (account,coin,userkey,orderId,arbiterPubKey,depositAddress,coinIn) {
    let tag = TAG + ' | get_pubkey_for_order | '
    try {
        log.debug(tag,"orderId: ",orderId)
        log.debug(tag,"userkey: ",userkey)
        log.debug(tag,"coin: ",coin)
        log.debug(tag,"coinIn: ",coinIn)
        log.debug(tag,"arbiterPubKey: ",arbiterPubKey)
        log.debug(tag,"depositAddress: ",depositAddress)
        let output = await engine.getNewPubkeyForOrder({orderId,userkey,coin,coinIn,arbiterPubKey,depositAddress})

        return output
    } catch (e) {
        console.error(tag, 'Error: ', e)
        throw e
    }
}

const retarget_order = async function (account, orderInfo, orderIdNew) {
    let tag = TAG + ' | retarget_order | '
    try {
        let output = {}

        //Update order
        redis.hmset(orderIdNew,orderInfo)

        return output
    } catch (e) {
        console.error(tag, 'Error: ', e)
        throw e
    }
}

const sign_order = async function (account, orderInfo, tx) {
    let tag = TAG + ' | sign_order | '
    try {
        log.debug(tag,"account: ",account)
        log.debug(tag,"orderInfo: ",orderInfo)
        log.debug(tag,"tx: ",tx)

        // let isValid = await rules.validate(tx,orderInfo)
        // log.debug(tag,"isValid: ",isValid)
        // if(!isValid) throw Error("666: unable to validate order!")
        let output = await engine.sign(account,orderInfo,tx)

        return output
    } catch (e) {
        console.error(tag, 'Error: ', e)
        throw e
    }
}

const cancel_order = async function (account,orderId) {
    let tag = TAG + ' | sign_order | '
    try {
        log.debug(tag,"account: ",account)
        log.debug(tag,"orderId: ",orderId)

        let output = {}
        let orderInfo = await redis.hgetall(orderId)
        if(account !== orderInfo.account) throw Error("104: signing cancel request with differn't account than owner!")

        let cancelInfo = await engine.cancel(orderId)


        return cancelInfo
    } catch (e) {
        console.error(tag, 'Error: ', e)
        throw e
    }
}
