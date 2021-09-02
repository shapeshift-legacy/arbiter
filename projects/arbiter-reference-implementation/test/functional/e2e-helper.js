
//globals
const TAG = "functional-helper"
const log = require('@arbiter/dumb-lumberjack')()
const arbiter = require("./../../modules/client.js")
const { btc, ltc , eth, gnt} = require('../../modules/daemons-manager')
let result
const WalletFactory = require('../../build/contracts/WalletFactory.json')
const Logger = require('../../build/contracts/Logger.json')
const pause = require('../../modules/pause')
const { web3 } = require('../../modules/web3-manager')
const Big = require('big.js')

module.exports = {
    checkArbiter,
    checkCoins,
    checkMarket,
    detectCancel,
    detectComplete,
    detectPayment,
    detectReturnTxid,
    detectFulfillment,
    detectSweepTx,
    // getMasterAccount,
    getAccount,
    getGasPrice,
    signUp,
    getNewAddress,
    checkEthAccount,
    createEthWallet,
    createOrder,
    getStatusFromOracle,
    validateSignature
}


async function createEthWallet(factoryAddress, signerAddress) {
  let factory = new web3.eth.Contract(WalletFactory.abi, factoryAddress, {
    data: WalletFactory.bytecode
  })

  let loggerAddress = await factory.methods.logger().call()

  let logger = new web3.eth.Contract(Logger.abi, loggerAddress, {
    data: Logger.bytecode
  })

  log.debug(`loggerAddress`, loggerAddress)

  return new Promise((resolve, reject) => {
    // send a 0-eth tx to create the wallet
    web3.eth.sendTransaction({
      from: signerAddress,
      to: factoryAddress,
      value: web3.utils.toWei("0", 'ether'),
      gas: 2000000
    }).on('error', reject)
    .once('receipt', async receipt => {
      log.debug(`receipt block number`, receipt.blockNumber)

      // with the receipt, we can check the logger to get the created wallet
      let events = await logger.getPastEvents('WalletCreated', {
        fromBlock: receipt.blockNumber,
        toBlock: receipt.blockNumber
      })

      let { wallet, signers, forwarders } = events[0].returnValues

      log.debug('new wallet', wallet, signers, forwarders)

      resolve({ address: wallet, signers, forwarders })
    }).catch(reject)
  })
}

async function checkArbiter()
{
    return arbiter
}

async function checkCoins()
{
    let coins = await arbiter.coins()
    log.debug("coins: ",coins)
    return coins
}

async function checkMarket(){
    let markets = await arbiter.markets()
    // log.debug("markets: ", markets)
    return markets
}

// async function getMasterAccount(){
//     result = await account.info()
//     return result
// }

async function getAccount() {
    return await arbiter.getAccount()
}

async function signUp() {
    return await arbiter.signUp()
}

function getCoinNode (coin) {
    let tag = TAG + ' |getCoinNode| '
    log.debug(tag, 'coin', typeof(coin), coin)

    try {
        coin = coin.toUpperCase()
        switch (coin) {
            case "BTC":
                return btc
            case "LTC":
                return ltc
            case "ETH":
                return eth
            case "GNT":
                return gnt
            default:
                return null
        }
    } catch (e) {
        console.error(tag, e)
    }
}


async function getNewAddress(coin) {
    let tag = TAG + '|getNewAddress|'
    coin = coin.toUpperCase()

    let coinNode = getCoinNode(coin)

    result = await coinNode.getNewAddress()
    log.debug(tag, result)
    return result
}

async function checkEthAccount() {
    let accountInfo = await getAccount()
    log.debug("accountInfo: ",accountInfo)


    //if no ETH
    if(accountInfo.error){
        log.debug("account not found! signing up!")
        //signup
        signUpResult = await helper.signUp()
        log.debug("signUpResult: ", signUpResult)
        return signUpResult
    }

    return accountInfo
}

async function createOrder(order) {
    result = await arbiter.orderCreate(order)
    return result
}

async function getStatusFromOracle(orderId) {
    result = await arbiter.statusOracle(orderId)
    return result
}

async function validateSignature(coin, pubKey, sig, mssg) {
    let tag = TAG + '|validateSignature|'
    let debug = false
    try {
        log.debug(tag, 'coin', coin)

        let coinNode = getCoinNode(coin)
        result = await coinNode.verifyMessage(pubKey, sig, mssg)
        log.debug(tag, result)
        return result
    } catch (e) {
        console.error(tag, e)
    }
}

async function sendFund(coin, address, amount) {
    let tag = TAG + '|sendFund|'

    try
    {
        let tag = TAG + '|sendFund|'
        let coinNode = getCoinNode(coin)
        return coinNode.sendToAddress(address, amount)
    } catch(e) {
        console.error(tag, e)
    }
}

async function detectPayment(orderId) {
  let status, orderInfo

  do {
      orderInfo = await arbiter.status(orderId)
      log.debug("orderInfo: ",orderInfo)
      status = orderInfo.status
      log.debug("status: ",status)
      log.debug("error: ",orderInfo.error)
      //limit requests

      if (orderInfo.error) {
        throw "detected error in order: " + orderInfo.returnError
      }

      if ( status === "unfunded" ) {
        await(pause(1))
      }
  } while (status === "unfunded")

  return status
}

async function detectCancel(orderId) {
  let status

  do {
      let orderInfo = await arbiter.status(orderId)
      let timeLeft = orderInfo.expiration - new Date().getTime()
      status = orderInfo.status
      log.debug("status:", status)
      log.debug("timeLeft:", timeLeft)

      if ( orderInfo.error ) {
        throw "detected order error: " + orderInfo.returnError
      }

      if ( status !== "cancelled" ) {
        await(pause(1))
      }
  } while(status !== "cancelled")

  return status
}

async function detectReturnTxid(orderId) {
  let returnTx

  do {
      let orderInfo = await(arbiter.status(orderId))

      var timeLeft = orderInfo.expirationInMinutes - new Date().getTime()
      log.debug("timeLeft:(seconds) ", timeLeft/1000)

      if(orderInfo.txidReturn && orderInfo.txidReturn.length > 10) {
          returnTx = orderInfo.txidReturn
          log.debug("returnTx: "+JSON.stringify(returnTx))
      }

      if ( orderInfo.error ) {
        throw "detected order error: " + orderInfo.returnError
      }

      if ( !returnTx ) {
        await(pause(1))
      }
  } while(!returnTx)

  return returnTx
}

async function detectComplete(orderId) {
  let status

  do {
      //query status
      let orderInfo = await arbiter.status(orderId)
      //expect(orderInfo.success).to.be.equal(true)
      log.debug("orderInfo: ",orderInfo)

      status = orderInfo.status
      //returnTx = orderInfo.response.txidReturn
      log.debug("status: ",status)

      if ( orderInfo.error ) {
        throw "detected order error: " + orderInfo.returnError
      }

      if ( status !== "complete" ) {
        await(pause(1))
      }
      //limit requests
  } while ( status !== "complete" )

  return status
}

async function detectFulfillment(orderId) {
  let txid

  do {
      //query status
      let orderInfo = await arbiter.status(orderId)
      //expect(orderInfo.success).to.be.equal(true)
      log.debug("orderInfo: ",orderInfo)

      txid = orderInfo.txidOut

      if ( orderInfo.error ) {
        throw "detected order error: " + orderInfo.returnError
      }

      if ( txid !== "complete" ) {
        await(pause(1))
      }
      //limit requests
  } while ( !txid )

  return txid
}

async function detectSweepTx(orderId) {
  let txid

  do {
      //query status
      let orderInfo = await(arbiter.status(orderId))
      //expect(orderInfo.success).to.be.equal(true)
      log.debug("orderInfo: ",orderInfo)

      txid = orderInfo.sweepTx

      if ( orderInfo.error ) {
        throw "detected order error: " + orderInfo.returnError
      }

      if ( txid !== "complete" ) {
        await(pause(1))
      }
      //limit requests
  } while ( !txid )

  return txid
}

async function getGasPrice(opts) {
  if ( opts && opts.gasPrice ) return opts.gasPrice

  let suggestedGasPrice = await web3.eth.getGasPrice()
  log.debug(`gas price from node`, suggestedGasPrice, '5')
  let suggGwei = web3.utils.fromWei(suggestedGasPrice, 'gwei')
  let suggGweiBN = new Big(suggGwei)
  let gasPrice = suggGweiBN.plus('5')
  log.debug(`calculated gas price`, gasPrice.toString(), suggGweiBN.toString())

  return web3.utils.toWei(gasPrice.toString(), "gwei")
}
