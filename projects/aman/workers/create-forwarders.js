/*
    Creates forwarders based on list of actions to take from redis
 */

const { redis, newClient } = require('../modules/redis-manager')
const log = require('@arbiter/dumb-lumberjack')()
const pause = require('../modules/pause')
const Wallet = require('../modules/eth-multisig-wallet.js')
const {
  CREATE_FORWARDER_POLLING_SECONDS,
  MAX_CREATE_FORWARDER_RETRIES
} = require('../configs/env')
const { web3 } = require('../modules/web3-manager')
const { getMasterAddress } = require('../modules/address-manager')

const redisListener = newClient()

async function _retry(address) {
  let count = await redis.incr(`cfretrycount:${address}`)

  if ( count > 100 ) {
    log.error(`exceeded max retry count of ${MAX_CREATE_FORWARDER_RETRIES} for address ${address}, not putting back on queue`)
    return
  }

  // try again in 5s
  setTimeout(async () => {
    await redis.rpush("createforwarderqueue", address)
    log.info(`successfully put ${address} back on queue, retry count ${count}`)
  }, 5000)
}


async function pollForAddresses() {
  log.info(`polling createforwarderqueue...`)
  let address

  try {
    // read a contract address from the queue of addresses that need creating
    let item = await redisListener.blpop("createforwarderqueue", CREATE_FORWARDER_POLLING_SECONDS)

    if ( item && web3.utils.isAddress(item[1]) ) {
      address = item[1].toLowerCase()
      log.debug(`pulled ${address} from createforwarderqueue`)

      let wallet = new Wallet({
        atAddress: address,
        gasAddress: await getMasterAddress()
      })

      // attempt to create the forwarder
      let forwarderAddress = await wallet.createForwarder()
      log.info(`successfully created forwarder ${forwarderAddress} for wallet ${address}`)

      // add the forwarder address to the set of available addresses for this contract
      await redis.sadd(`forwarders:${address}`, forwarderAddress.toLowerCase())
      await redis.sadd(`eth:wallet`, forwarderAddress.toLowerCase())

      // clear the retry count if we're successful
      await redis.del(`cfretrycount:${address}`)
    } else {
      log.info('no address found, ho hum...')
    }
  } catch (e) {
    // it's possible wallet.createForwarder will throw for a variety of reasons,
    // so if we still have an address, push it back to the front of the queue
    try {
      if ( e.WALLET_CHECK_ERROR && web3.utils.isAddress(address) ) {
        log.info(`wallet check error for ${address}, will retry again in 5s (${e.message})`)
        _retry(address)
      } else {
        log.warn(`Unknown error attempting to create forwarder, address: ${address}`, e)
      }
    } catch (ex) {
      log.error(`error handling exception: `, ex)

      // probably means something bad happened, so enhance our calm
      await pause(5)
    }
  }

  setTimeout(pollForAddresses, 1)
}


pollForAddresses()
