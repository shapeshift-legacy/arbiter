const { DEFAULT_GAS_LIMIT, NOC_TIMEOUT_MINUTES } = require('../configs/env')
const helpers = require('./helpers')
const { web3 } = require('./web3-manager')
const log = require('@arbiter/dumb-lumberjack')()
const { redis } = require("./redis-manager")
const { decrypt } = require('./crypt')
const { getMasterAddress } = require("./address-manager")
const getNetworkType = require("./network-manager")

const WARN_TIMEOUT_MILLIS = NOC_TIMEOUT_MINUTES * 60 * 1000

module.exports = {
  /*
    IMPORTANT
    This file manages ALL gas, gas price, and nonce concerns

    @parameters (
      opts: txObject like https://web3js.readthedocs.io/en/1.0/web3-eth.html#sendtransaction,
      resolveOn: receipt|txid|transactionHash|success
      sendable: the result of something like contract.methods.doAThing({ args })
    )
  */
  async signAndSend(opts, resolveOn, sendable) {
    opts = await this._normalizeTxOpts(opts)
    let network = await getNetworkType()
    let promivent

    log.debug(`all systems calibrated, preparing to fire`, opts)

    if ( network !== "private" ) {
      log.debug(`signing and sending`)
      let signed = await this._sign(opts)
      promivent = web3.eth.sendSignedTransaction(signed.rawTransaction)
    } else if ( network === "private" && sendable !== undefined ) {
      log.debug(`sending sendable`)
      promivent = sendable.send(opts)
    } else {
      let msg = `Unsure of how to sign and send with network: ${network}`
      log.error(msg, opts, sendable)
      throw Error(`Unknown signing condition`)
    }

    return new Promise((resolve, reject) => {
      // TODO: add on-chain checking

      let nocTimeout

      promivent.on('receipt', receipt => {
        log.info(`transaction receipt`, receipt)

        // save the result
        // TODO: calculate fees of the tx
        redis.set(
          `tx:${receipt.transactionHash.toLowerCase()}:receipt`,
          JSON.stringify(receipt)
        ).catch(ex => {
          log.error(`could not store receipt for txid ${receipt.transactionHash}`, ex)
        })

        // clear the NOC check
        clearTimeout(nocTimeout)

        if ( resolveOn === 'receipt' ) {
          resolve(receipt)
        }

        if ( resolveOn === 'success' ) {
          if ( helpers.isReceiptSuccessful(receipt) ) {
            resolve(receipt)
          } else {
            reject(new Error(`unsuccessful status ${receipt.status}`))
          }
        }
      }).on('transactionHash', hash => {
        log.info(`sent transaction`, hash)

        // store the params of the original tx
        redis.set(`tx:${hash.toLowerCase()}:params`, JSON.stringify(opts)).catch(ex => {
          log.error(`could not store tx params for txid ${hash}`, JSON.stringify(opts), ex)
        })

        nocTimeout = setTimeout(() => {
          log.alert(`${hash} is not on chain after ${NOC_TIMEOUT_MINUTES} minutes`, opts)
        }, WARN_TIMEOUT_MILLIS)

        if ( ['transactionHash','txid'].includes(resolveOn) ) {
          resolve(hash)
        }
      }).on('error', async err => {
        log.alert(`error sending transaction`, err.message)

        if ( err.message.includes("nonce too low") ) {
          // clear the nonce and try again
          try {
            await this._clearNonce(opts.from)
            // try it again
            this.signAndSend(opts, resolveOn, sendable).then(resolve).catch(reject)
          } catch (ex) {
            reject(ex)
          }
        } else {
          // TODO: handle nonce errors "Transaction nonce is too low"

          reject(err)
        }

      })
    })
  },

  async _clearNonce(account) {
    let key = `sending:next-nonce:${account}`
    return redis.del(key)
  },

  async _getNonce(account) {
    account = account.toLowerCase()
    let key = `sending:next-nonce:${account}`
    let nonce = await redis.incr(key)

    // if no nonce previously existed, double-check
    if ( nonce === 1 ) {
      let count = await web3.eth.getTransactionCount(account, 'pending')
      if ( count !== 0 ) {
        await redis.set(key, count+1)
        return count;
      }
    }

    return nonce - 1
  },

  async _sign(tx) {
    let isProd = ['prod', 'production'].includes(process.env['NODE_ENV'])
    let info = await redis.hgetall(tx.from.toLowerCase())

    log.debug(`signing address info`, info)

    if (isProd && (!info || !info.privKey)) {
      throw Error(`could not sign transaction with ${tx.from}, unknown address`)
    } else if (!info || !info.privKey) {
      log.warn(`pk not found redis, this will not be an option in production!! trying to sign from parity keystore`)
      let signed = await web3.eth.signTransaction(tx, tx.from)
      return signed.raw
    }

    log.debug(`signing with pk from redis for account`, tx.from)

    // otherwise, we have the pk in redis, sign it
    let decrypted = decrypt(info.privKey)
    let signedTx = await web3.eth.accounts.signTransaction(tx, '0x' + decrypted)

    log.debug(`signedTx`, signedTx)

    return signedTx
  },

  async _normalizeTxOpts(opts) {
    if ( !opts || ( !opts.data && !opts.to ) ) {
      log.warn(`don't know what to sign here`, opts)
      throw Error("will not sign empty transaction")
    }

    opts = opts || {}
    opts.gasPrice = await helpers.getGasPrice(opts)
    opts.from = opts.from || await getMasterAddress()
    opts.value = opts.value || '0'
    opts.gas = opts.gas || DEFAULT_GAS_LIMIT || 100000
    opts.nonce = await this._getNonce(opts.from)

    return opts
  }

}
