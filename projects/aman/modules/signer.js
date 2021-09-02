const { web3 } = require('./web3-manager')
const log = require('@arbiter/dumb-lumberjack')()
const { redis } = require("./redis-manager")
const { decrypt } = require('./crypt')
const { getMasterAddress } = require("./address-manager")

module.exports = async function(tx) {
  if ( !tx.from ) {
    tx.from = await getMasterAddress()
  }

  let isProd = ['prod','production'].includes(process.env['NODE_ENV'])
  let info = await redis.hgetall(tx.from.toLowerCase())

  log.debug(`info`, info)

  if ( isProd && ( !info || !info.privKey ) ) {
    throw Error(`could not sign transaction with ${tx.from}, unknown address`)
  } else if ( !info || !info.privKey ) {
    log.warn(`pk not found redis, this will not be an option in production!! trying to sign from parity keystore`)
    let signed = await web3.eth.signTransaction(tx, tx.from)
    return signed.raw
  }

  log.debug(`signing with pk from redis for account`, tx.from)

  // otherwise, we have the pk in redis, sign it
  let decrypted = decrypt(info.privKey)
  let signedTx = await web3.eth.accounts.signTransaction(tx, '0x'+decrypted)

  log.debug(`signedTx`, signedTx)

  return signedTx
}
