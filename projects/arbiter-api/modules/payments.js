const daemons = require('@arbiter/arb-daemons-manager').daemons
const log = require('@arbiter/dumb-lumberjack')()
const arbiter = require('./arbiter.js')
//const { redis } = require('@arbiter/arb-redis')
const mongo = require('@arbiter/arb-mongo')
const util = require('@arbiter/arb-redis')
const redis = util.redis
const publisher = util.publisher

const SATOSHI = 100000000

const TAG = " | payments | "


const detectClonePayment = async (coin, txid) => {
  let tag = TAG + " | detectClonePayment | "
  try{
      if(!coin) throw Error("101: coin not passed!")
      if(!txid) throw Error("101: txid not passed!")
      coin = coin.toLowerCase()
      const daemon = daemons[coin]

      // get raw txinfo
      let txScript = await daemon.getRawTransaction(txid)
      if(!txScript) throw Error("103: failed to lookup txid!")
      let txInfo = await daemon.decodeRawTransaction(txScript)
      if(!txInfo) throw Error("104: failed to decode script!")
      txInfo.coin = coin

      //handle confirm
      let isNew = await redis.sadd('txids',txid)
      log.debug(tag,"isNew: ",isNew)
      if(isNew){

          // digest transaction (look for payments!)
          let outputs = txInfo.vout
          // iterate over outputs
          for (let i = 0; i < outputs.length; i++) {
              let output = outputs[i]
              output.txid = txid
              output.coin = coin
              log.debug('output: ', output)
              log.debug('scriptPubKey: ', output.scriptPubKey)
              log.debug('addresses: ', output.scriptPubKey.addresses)
              if (output.scriptPubKey && output.scriptPubKey.addresses) {
                  for (let j = 0; j < output.scriptPubKey.addresses.length; j++) {
                      log.debug('output: ', output.scriptPubKey.addresses[j])
                      let address = output.scriptPubKey.addresses[j]
                      let addressInfo = await redis.hgetall(address)
                      log.debug('addressInfo: ', addressInfo)
                      if (addressInfo && addressInfo.orderId) {
                          let deposit = {}
                          deposit.order = addressInfo.orderId
                          deposit.custodial = false
                          deposit.time = new Date().getTime()
                          deposit.txid = output.txid
                          deposit.value = output.value
                          deposit.coin = output.coin.toUpperCase()
                          deposit.address = address
                          deposit.txInfo = output
                          deposit.addressInfo = addressInfo
                          mongo['order-deposits'].insert(deposit)

                          arbiter.fund(addressInfo.orderId, output)
                      } else if(addressInfo && addressInfo.account){
                          let deposit = {}
                          deposit.account = addressInfo.account
                          deposit.time = new Date().getTime()
                          deposit.custodial = true
                          deposit.event = 'deposits'
                          deposit.txid = output.txid
                          deposit.value = output.value
                          deposit.coin = output.coin.toUpperCase()
                          deposit.address = address
                          deposit.txInfo = output
                          deposit.addressInfo = addressInfo

                          mongo['arbiterLa-transfers'].insert(deposit)

                          await arbiter.deposit(addressInfo.account, output)


                          let bal = await redis.hget(addressInfo.account, output.coin.toUpperCase())
                          log.info(tag, 'coin:', coin, 'bal: ', bal)
                          if (!bal)
                              throw Error('ERROR: Unable to get balance with account:', addressInfo.account, ', coin:', coin)
                          else
                              deposit.newBalance = bal / SATOSHI

                          publisher.publish("arbiterLa",JSON.stringify(deposit))
                      }
                  }
              }
          }

      }else{
        // TODO handle confirms
        // Dont live/fullfill anything till confirms broooo
        log.error("not configured to handle confirms yet!")
      }

      // stringify arrays
      txInfo.vin = JSON.stringify(txInfo.vin)
      txInfo.vout = JSON.stringify(txInfo.vin)
      await redis.hmset(txid, txInfo)
      log.debug(tag,"txInfo: ",txInfo)
      return txInfo
  }catch(e){
      log.error(tag,"e: ",e)
      throw e
  }
}

// used for tokens as well
const detectEthPayment = async (coin, txid) => {
    let tag = TAG+" | detectEthPayment | "
    try{
        // TODO
        let txInfo = await daemons.eth.getTransaction(txid)
        log.debug(tag,"txInfo: ",txInfo)
        if ( !txInfo.payments || !txInfo.payments.length ) {
            throw `no payments found for txid ${txid}`
        }

        for (let payment of txInfo.payments) {
            log.debug(tag,"payment: ", payment)
            let addressInfo = await redis.hgetall(payment.to)

            if (!addressInfo) {
                log.info(`no orders found for coin ${coin} and address ${payment.to}`)
                payment.orderId = undefined
            } else {
                if (addressInfo && addressInfo.orderId) {
                    let deposit = {}
                    deposit.order = addressInfo.orderId
                    deposit.custodial = false
                    deposit.txid = payment.txid
                    deposit.value = payment.value
                    deposit.coin = payment.coin.toUpperCase()
                    deposit.address = payment.to
                    deposit.txInfo = payment
                    deposit.addressInfo = addressInfo
                    mongo['order-deposits'].insert(deposit)

                    arbiter.fund(addressInfo.orderId, payment)
                } else if(addressInfo && addressInfo.account){

                    let deposit = {}
                    deposit.account = addressInfo.account
                    deposit.custodial = true
                    deposit.time = new Date().getTime()
                    deposit.event = 'deposits'
                    deposit.txid = payment.txid
                    deposit.value = payment.value
                    deposit.coin = payment.coin.toUpperCase()
                    deposit.address = payment.to
                    deposit.txInfo = payment
                    deposit.addressInfo = addressInfo


                    mongo['arbiterLa-transfers'].insert(deposit)

                    await arbiter.deposit(addressInfo.account, payment)


                    let bal = await redis.hget(addressInfo.account, payment.coin.toUpperCase())
                    log.debug(tag, 'coin:', coin, 'bal: ', bal)
                    if (!bal)
                        throw Error('ERROR: Unable to get balance with account:', addressInfo.account, ', coin:', coin)
                    else
                        deposit.newBalance = bal / SATOSHI

                    publisher.publish("arbiterLa",JSON.stringify(deposit))
                }
            }
        }

        return txInfo
    }catch(e){
        log.error(tag,e)
        throw e
    }
}

module.exports = { detectClonePayment, detectEthPayment }
