const { redis, publisher } = require('../modules/redis-manager')
const { web3, w3ws } = require('../modules/web3-manager')
const { TOKENS } = require("../configs/env")
const path = require('path')
const log = require('@arbiter/dumb-lumberjack')()
const EthereumMultiSigWallet = require('../modules/eth-multisig-wallet')
const ForwarderContract = require('../modules/forwarder-contract')
const { getMasterAddress } = require("../modules/address-manager")
const BigNumber = require('bignumber.js')
const socketMonitor = require('../modules/socket-monitor')


// token transfer event data:
// {
//   address: '0xd26114cd6EE289AccF82350c8d8487fedB8A0C07',
//   blockHash: '0x8a11043496c12bb76c5a7bf03c6c40d6b82438d045a71b0f54e6bf96bfe1b9f3',
//   blockNumber: 5820540,
//   logIndex: 3,
//   transactionHash: '0x26cc14f492720177f74cf820dd33b45ceeacfacd31e69c8301fad8f52dc3604c',
//   transactionIndex: 7,
//   transactionLogIndex: '0x0',
//   type: 'mined',
//   id: 'log_34cbadc7',
//   returnValues: Result {
//     '0': '0x0681d8Db095565FE8A346fA0277bFfdE9C0eDBBF',
//     '1': '0x787b69D42A890DE9Fc2Bac2e84937cb49072A6C3',
//     '2': '4640000000000000000',
//     from: '0x0681d8Db095565FE8A346fA0277bFfdE9C0eDBBF',
//     to: '0x787b69D42A890DE9Fc2Bac2e84937cb49072A6C3',
//     value: '4640000000000000000'
//   },
//   event: 'Transfer',
//   signature: '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
//   raw: {
//     data: '0x0000000000000000000000000000000000000000000000004064976a8dd00000',
//     topics: [
//       '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
//       '0x0000000000000000000000000681d8db095565fe8a346fa0277bffde9c0edbbf',
//       '0x000000000000000000000000787b69d42a890de9fc2bac2e84937cb49072a6c3'
//     ]
//   }
// }

const flushTokensToWallet = async (token, paymentAddress) => {
  let forwarder = new ForwarderContract({ atAddress: paymentAddress })
  let parent = await forwarder.parentAddress()
  let wallet = new EthereumMultiSigWallet({
    atAddress: parent,
    gasAddress: await getMasterAddress()
  })

  return wallet.flushForwarderTokens(token, paymentAddress)
}

const processTokenTransfer = async (token, data, base) => {
  try {
    let { '0': from, '1': to, '2': value } = data.returnValues
    // TODO: bigint math, dividing by base isn't exact
    // log.debug(`token transfer event data:`, data)

    let payment = {
      coin: token,
      txid: data.transactionHash.toLowerCase(),
      to: to.toLowerCase(),
      from: from.toLowerCase(),
      value: new BigNumber(value).dividedBy(base).toString()
    }

    let isToMe = await redis.sismember("eth:wallet", payment.to)

    if ( isToMe ) {
      log.info("******************* payment ", payment)

      try {
        await flushTokensToWallet(token, payment.to)
      } catch (ex) {
        log.warn(`error flushing token payment, assuming ${payment.to} is not a forwarder address and ignoring: `, ex.message || ex)
        log.warn(`erred flush payment: `, payment)
      }

      await redis.sadd('payments', payment.txid)
      await redis.sadd(`payments:${payment.txid}`, JSON.stringify(payment))
      await publisher.publish("aman-credits",JSON.stringify(payment))
    }
  } catch (ex) {
    log.error(`Error during token transfer processing: `, ex)
  }
}

const _getTokenInfo = token => {
    let abiPath = path.join(__dirname, "../coins/" + token + ".abi.js")
    let abiInfo = require(abiPath)

    return abiInfo
}

const watchTokenContract = async function(token) {
  try {
    let { metaData, ABI } = _getTokenInfo(token)
    let contract = new w3ws.eth.Contract(ABI, metaData.contractAddress)

    //watch for transfers
    contract.events.Transfer().on('data', async data => {
      processTokenTransfer(token, data, metaData.BASE)
    }).on('error', err => {
      log.error(`error listening for events`, token, err)
    }).on('changed', change => {
      log.warn(`token event changed!`, token, change)
    })

    log.info(`watching for ${token} payments on ${metaData.contractAddress}`)
  } catch (e) {
    log.error(`error setting up token listener for ${token}`, e)
  }
}

const checkForPriorPayments = async token => {
  let { metaData, ABI } = _getTokenInfo(token)
  let contract = new web3.eth.Contract(ABI, metaData.contractAddress)
  let rescanBlock = await redis.get(`RESCAN_${token}_FROM_BLOCK`)
  let lastBlock = await redis.zrevrange('eth:block:scanned', 0, 0, 'WITHSCORES')
  let [ hash, blockNumber ] = lastBlock

  /*
    `RESCAN_${token}_FROM_BLOCK` takes precedence over the last scanned block
    in redis, but we're otherwise assuming that we probably haven't received payments
    if we haven't scanned the block
  */
  let fromBlock = rescanBlock || blockNumber

  if ( fromBlock ) {
    log.info(`rescanning for payments on ${token} from block ${fromBlock}`)
    await redis.del(`RESCAN_${token}_FROM_BLOCK`)

    let events = await contract.getPastEvents('Transfer', { fromBlock })

    events.forEach(ev => {
      processTokenTransfer(token, ev, metaData.BASE)
    })
  } else {
    log.debug(`not checking for prior payments for ${token}`)
  }
}

function start() {
  if ( TOKENS.length ) {
    TOKENS.forEach(token => {
      token = token.toUpperCase()
      watchTokenContract(token)
      checkForPriorPayments(token).catch(ex => {
        log.error(`error checking ${token} for prior payments`, ex)
      })
    })
  } else {
    log.warn(`No tokens configured`)
  }
}

start()

socketMonitor(start)

module.exports = {
  processTokenTransfer,
  watchTokenContract
}
