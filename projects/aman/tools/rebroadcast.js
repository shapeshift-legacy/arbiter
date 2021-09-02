const { GAS_PRICE_GWEI, ETH_DAEMON_HOST, ETH_HTTP_PORT } = require("../configs/env")
const { web3 } = require('../modules/web3-manager')
const request = require('request')
const log = require('@arbiter/dumb-lumberjack')()
const softUnlock = require('../modules/soft-unlock')
const ARGV = require('minimist')(process.argv.slice(2))

/*
 Utility to view and rebroadcast "stuck" transactions in parity

 Usage: `source .env && node tools/rebroadcast.js [--send]`
*/

const getPendingLocalTx = () => {
  return new Promise((resolve, reject) => {
    request({
      method: "POST",
      url: `http://${ETH_DAEMON_HOST}:${ETH_HTTP_PORT}`,
      json: true,
      body: {
          method: "parity_localTransactions",
          id: 1,
          jsonrpc: "2.0"
      }
    }, function(error, response, body) {
      if (!error && response.statusCode === 200) {
        resolve(body)
      } else {
        log.error("error in request: ", error)
        reject(error)
      }
    })
  })
}

function cleanTx(tx) {
  delete tx.blockHash
  delete tx.blockNumber
  delete tx.condition
  delete tx.creates
  delete tx.hash
  delete tx.input
  delete tx.networkId
  delete tx.publicKey
  delete tx.r
  delete tx.raw
  delete tx.s
  delete tx.standardV
  delete tx.transactionIndex
  delete tx.v

  return tx
}

function send(tx) {
  return new Promise((resolve, reject) => {
    web3.eth.sendTransaction(tx).on('error', err => {
      log.error(`error sending transaction`, err)
      reject(err)
    }).on('receipt', receipt => {
      log.info(`receipt`, receipt)
      resolve(receipt)
    }).on('transactionHash', hash => {
      log.info(`hash`, hash)
    }).catch(er => {
      log.error(`er`, er)
      reject(er)
    })
  })
}

getPendingLocalTx().then(async ({ result }) => {
  let results = Object.keys(result)

  // only deal with "pending", other statuses include "mined" and "replaced"
  results = results.filter(res => result[res].status === "pending")
  let proms = []

  results.forEach(hash => {
    proms.push(web3.eth.getTransaction(hash))
  })

  let transactions = await Promise.all(proms)
  transactions = transactions.filter(tx => tx) // remove nulls

  // sort the list in nonce order
  transactions.sort((a, b) => {
    return a.nonce - b.nonce
  })

  console.log(`sorted tx`, transactions)

  if ( ARGV.send ) {
    console.log(`starting sending of ${transactions.length} transactions, this may take some time...`)
    for (let tx of transactions) {
      // let tx = transactions[idx]
      console.log(`rebroadcasting ${tx.hash} with gas price of ${GAS_PRICE_GWEI}...`)
      await softUnlock(tx.from)
      tx.gasPrice = web3.utils.toWei(GAS_PRICE_GWEI.toString(), "gwei")
      tx = cleanTx(tx)

      await send(tx)
    }
  } else {
    console.log(`by default, this tool only shows the pending transactions.`)
    console.log(`to actually force a rebroadcast, call 'node tools/rebroadcast.js --send'`)
  }
}).catch(ex => {
  console.log(`ex`, ex)
})
