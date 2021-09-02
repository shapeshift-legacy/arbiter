
const log = require('@arbiter/dumb-lumberjack')()
const { redis, publisher } = require('../modules/redis-manager')

const { w3ws, web3 } = require('../modules/web3-manager')
const fs = require('fs')
const path = require('path')
const {
  LOGGER_ADDRESS
} = require('../configs/env')

const filename = path.join(__dirname, '../build/contracts/Logger.json')
const CONTRACT_TEMPLATE = JSON.parse(fs.readFileSync(filename, 'utf-8'))
const contract = new w3ws.eth.Contract(CONTRACT_TEMPLATE.abi, LOGGER_ADDRESS, {
  // from: gasAddress,
  data: CONTRACT_TEMPLATE.bytecode
})
const socketMonitor = require('../modules/socket-monitor')

async function _handleDeposit(data) {
  log.warn("Handle deposit not yet implemented", data)
}

async function _handleForwarderDeposit(data) {
  // log events are only for eth payments, not tokens
  let { forwarder, from, value } = data.returnValues

  let payment = {
    coin: "ETH",
    txid: data.transactionHash.toLowerCase(),
    to: forwarder.toLowerCase(),
    from: from.toLowerCase(),
    value: web3.utils.fromWei(value, 'ether')
  }

  let isToMe = await redis.sismember("eth:wallet", payment.to)

  if ( isToMe ) {
    log.info("******************* payment ", payment)
    await redis.sadd('payments', payment.txid.toLowerCase())
    await redis.sadd(`payments:${payment.txid}`, JSON.stringify(payment))
    await publisher.publish("aman-credits",JSON.stringify(payment))
  }
}

async function _handleWalletCreated(data) {
  let { wallet, forwarders } = data.returnValues

  wallet = wallet.toLowerCase()
  forwarders = forwarders.map(f => f.toLowerCase())

  // TODO: should we validate that the signers are valid?

  // add the forwarders and wallet to our addresses
  let ares = await redis.sadd('eth:wallet', ...forwarders, wallet)
  let wres = await redis.sadd('wallets', wallet)

  // add the forwarders to the set for the wallet
  let fres = await redis.sadd(`forwarders:${wallet}`, ...forwarders)

  log.debug(`walletCreated results: `, wres, ares, fres)
}

async function main() {
  try {
    let lastBlock = await redis.zrevrange('eth:block:scanned', 0, 0, 'WITHSCORES')
    let [ hash, num ] = lastBlock
    let opts = {}

    if ( num ) {
      opts = { fromBlock: parseInt(num, 10) }
    }

    log.notice(`listening for log events since ${num} on logger contract`, LOGGER_ADDRESS)

    contract.events.allEvents(opts).on('data', async data => {
      try {
        log.info('received event', data)
        redis.set(`tx:${data.transactionHash.toLowerCase()}:event`, JSON.stringify(data)).catch(ex => {
          log.error(`could not save contract event for txid ${data.transactionHash}`, ex)
        })

        let actions = {
          ForwarderDeposited: _handleForwarderDeposit,
          Deposited: _handleDeposit,
          WalletCreated: _handleWalletCreated
        }

        let action = actions[data.event]

        if (typeof action === 'function') {
          await action(data)
        } else {
          log.error('unknown event', data)
        }
      } catch (ex) {
        log.error('error handling logger event', ex, data)
      }
    }).on('changed', function(event) {
      // remove event from local database
      log.warn('event changed', event)
    }).on('error', err => {
      log.error('error receiving event', err)
    })
  } catch (ex) {
    log.error(`error listening for contract events`, ex)
  }
}

main().catch(ex => {
  log.error(`error listening for contract events`, ex)
})

socketMonitor(main)
