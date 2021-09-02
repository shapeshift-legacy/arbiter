const TAG = `commands`
const client = require('./client')
const Spinner = require('cli-spinner').Spinner
const Table = require('cli-table');
const log = require('@arbiter/dumb-lumberjack')()
// const ledger = require('./ledger.js')
const wallet = require('./wallet')
const { btc, ltc, eth } = require('./daemons-manager')
const config = require('../configs/env')
const {
  ORACLE_SIGNING_ADDRESS,
  ARBITER_SIGNING_ADDRESS
} = config
const pause = require('./pause')
const { isToken } = require('./token-helpers')

/*
These functions can support the following tests
 - successful trade ltc->btc
 - successful trade eth->btc
 - cancel ltc->btc order
*/
module.exports = {
    signUp,
    getAccount,
    // getOrCreateUserAccount,
    createOrder,
    orders,
    getOrder,
    // sendFund,
    markets,
    book,
    ethWalletFactoryAddress,
    verifySigs,
    watchOrder,
    cancel,
    setup,
    updateAccount,
    retarget,
    info
}


const _getTxLink = (coin, txid) => {
  switch(coin) {
      case "ETH":
          return "https://etherscan.io/tx/"+txid
      case "BTC":
          return "https://blockchain.info/tx/"+txid
      case "LTC":
          return "https://live.blockcypher.com/ltc/tx/"+txid
      default:
          return txid
  }
}

async function setup(bitcoin, litecoin, ethereum) {
    let tag = "setup"
    // let params = []
    // let expectedParams = ["bitcoin address","litecoin address","ethereum address"]
    // console.log(`input the withdrawal addresses you would like to use for trading`)
    //
    // if(expectedParams.length > 0){
    //     for(let i = 0; i < expectedParams.length; i++){
    //         let param = {
    //             type: 'input',
    //             name: expectedParams[i],
    //             message: expectedParams[i]+": "
    //         }
    //         params.push(param)
    //     }
    // }
    //
    // let answers = await cli.prompt(params)
    // let signingPub
    // let signingPrivKey
    /*
        Detect ledger

        if found, use leger key as signing

        else generate new wallet
     */
    // try {
    //   let legerStart = await ledger.init()
    //   if(legerStart.success)  {
    //       log.debug(`ledgerStart`, legerStart)
    //       log.debug(tag,"legerStart: ",legerStart)
    //       // signingPub = legerStart.body.bitcoinAddress
    //       // signingPrivKey = "ledger"
    //   } else {
    //       log.debug("ledger device not found, using wallet!")
    //       //wallet create new wallet
    //       let info = await wallet.info()
    //       signingPub = info.signingPub
    //   }
    // } catch (ex) {
    //     console.error(`error init ledger`, ex)
    // }

    // let parameters = []
    // Object.keys(answers).forEach(function(answer) {
    //     parameters.push(answers[answer])
    // })
    // log.debug(tag,"parameters: ",parameters)

    // let bitcoinAddress  = parameters[0]
    // let litecoinAddress = parameters[1]
    // let ethereumAddress = parameters[2]

    try {
      // log.debug(`signup params`, signingPub, ethereumAddress, signingPrivKey)
      // let signupSuccess = await signUp(signingPub,ethereumAddress,signingPrivKey)
      // log.debug("signupSuccess: ",signupSuccess)

      wallet.setTradingAddress('btc', bitcoin)
      wallet.setTradingAddress('ltc', litecoin)
      wallet.setTradingAddress('eth', ethereum)

      // console.log(`setup complete! please restart the cli to begin interacting with arbiter.`)
      // process.exit(0)
    } catch (ex) {
      console.error(" FAILED TO SETUP ACCOUNT!!!! please try again, or bitch at Arbiter team for a fix. ", ex)
      // return cb();
    }
}


async function getAccount() {
  let result = await client.getAccount()
  return result
}

async function orders() {
  let result = await client.orders()
  return result
}

async function info() {
  // if (!global.USER_IS_SETUP) {
  //   return log.debug('Please run `setup` command to set up your account.')
  // }

  let w = await wallet.info()

  // const obj = Object.assign({}, require(process.env['HOME']+'/arbiter-setup.js'))
  // delete obj.USER_BTC_SIGNING_PRIVKEY

  console.log(JSON.stringify(w, null, 4))
}

async function markets() {
  try {
    let _markets = await client.markets()
    try {
      _markets = JSON.parse(_markets)
    } catch (ex) { /* noop */ }
    console.log(JSON.stringify(_markets, false, ' '))
  } catch (ex) {
    log.error(`Error: `, ex)
  }
}

async function ethWalletFactoryAddress() {
  return await client.ethWalletFactoryAddress()
}

function _displayOrderInTable(order) {
  let tableOrder = new Table();
  Object.keys(order).forEach(function(key) {
      let val = order[key];

      tableOrder.push({[key]:val})
  });
  log.debug("\n orderInfo: \n",tableOrder.toString())
}



async function watchOrder (orderId) {
    let tag = TAG+" | watchOrder | "
    try {
        let output = {}
        // dont return untill done
        let done = false

        let orderInfo = await client.status(orderId)
        //orderInfo = orderInfo.payload

        let status = orderInfo.status
        _displayOrderInTable(orderInfo)

        if ( status === "fulfilled" ) {
            log.debug(`order already fulfilled!`)
            return
        }

        //start spinner
        var spinner = new Spinner('order pending: .. %s');
        spinner.setSpinnerString('|/-\\');
        spinner.start();

        while(!done) {
            try {
              let orderInfo = await client.status(orderId)
              //orderInfo = orderInfo.payload

              if(status !== orderInfo.status) {
                  status = orderInfo.status
                  log.debug(" \n status: "+status)
              }

              //if txidOut
              let firstSeen = false
              if(orderInfo.txidOut && !firstSeen) {
                  log.debug("txidOut TXID link:", _getTxLink(orderInfo.coinOut, orderInfo.txidOut))
                  firstSeen = true
              }

              //if txidReturn
              let firstSeen1 = false
              if(orderInfo.txidReturn && !firstSeen1) {
                  log.debug("return TXID link:", _getTxLink(orderInfo.coinIn, orderInfo.txidReturn))
                  firstSeen1 = true
              }

              let firstSeen2 = false
              if(orderInfo.sweepTx && !firstSeen2) {
                  log.debug("sweep TXID link:", _getTxLink(orderInfo.coinIn, orderInfo.sweepTx))
                  firstSeen2 = true
              }


              //if complete
              if(status === 'complete' && orderInfo.txidOut && orderInfo.sweepTx){
                  log.debug("\n ******* COMPLETED TRADE SUCCESSFULL! *******")
                  output.traded = true
                  done = true

                  //stop spinnger
                  spinner.stop(true)
              } else if(status === 'cancelled' && orderInfo.txidReturn){
                  log.debug("\n ******* TRADE RETURNED!  (returned) *******")
                  output.returned = true
                  done = true

                  //stop spinnger
                  spinner.stop(true)
              } else {
                  log.debug(tag,"status: ",status)
                  log.debug(tag,"orderInfo.sweepTx: ",orderInfo.sweepTx)
                  log.debug(tag,"orderInfo.txidReturn: ",orderInfo.sweepTx)
              }

              await pause(3)
          } catch (ex) {
              log.debug(`error while checking order status, will try again shortly`, ex)
              await pause(3)
          }
        }


        let orderInfoFinal = await client.status(orderId)

        _displayOrderInTable(orderInfoFinal)

        return output
    }catch(e){
        log.error(tag, "error during watchOrder", e)
    }
}


async function verifySigs (responseArbiter,responseOracle) {
    let tag = TAG+" | verifySigs | "
    try{
        let output = {
            arbiter:false,
            oracle:false
        }

        //valid sig arbiter
        let arbiterPubkey = ARBITER_SIGNING_ADDRESS
        let validateRespArbiter = await wallet.verifyMessage(arbiterPubkey,responseArbiter.signature,JSON.stringify(responseArbiter.payload))

        //validate sig oracle
        let oraclePubkey = ORACLE_SIGNING_ADDRESS
        let validateRespOracle = await wallet.verifyMessage(oraclePubkey,responseOracle.signature,JSON.stringify(responseOracle.payload))

        //validate params
        log.debug("responseOracle: ",validateRespOracle)
        log.debug("validateRespArbiter: ",validateRespArbiter)

        output.arbiter = validateRespArbiter
        output.oracle = validateRespOracle
        return output
    }catch(e){
        log.error("error: ",e)
    }

}


async function statusOracle (orderId) {
    return await client.statusOracle(orderId)
}


// signUp
// signingPub, ethAddress, action
async function signUp (btcSigningPub, ethAddress, privKey) {
    log.debug("signUp: ",btcSigningPub, ethAddress, privKey)
    return await client.signUp(btcSigningPub, ethAddress, privKey)
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
            default:
                return null
        }
    } catch (e) {
        log.error(tag, e)
    }
}

async function updateAccount(ethAddress, contractAddress) {
  let spinner = new Spinner('creating order: .. %s');
  spinner.setSpinnerString('|/-\\');

  try {
      spinner.start();

      let result = await client.updateAccount(ethAddress, contractAddress)

      spinner.stop(true)

      return result
  } catch (e) {
      spinner.stop(true)
      throw e
  }
}

async function createOrder(pair, amountIn, rate, expirationInMin) {
    let tag = TAG + ' |createOrder| '

    let spinner = new Spinner('creating order: .. %s');
    spinner.setSpinnerString('|/-\\');

    try {
        let pairArr
        if(pair.indexOf('-') >= 0)      pairArr = pair.split('-')
        else if(pair.indexOf('_') >=0)  pairArr = pair.split('_')

        // let userPubKey = config.ORDER_PUBKEY
        let coinIn = pairArr[0].toUpperCase()
        let coinOut = pairArr[1].toUpperCase()

        pair = coinIn.toUpperCase() + '_' + coinOut.toUpperCase()

        log.debug(tag, 'pair', pair)
        log.debug(tag,"setupInfo: ",config)

        let inKey = isToken(coinIn) ? "ETH" : coinIn
        let outKey = isToken(coinOut) ? "ETH" : coinOut

        let winfo = await wallet.info()
        let inputAddr = wallet.getTradingAddress(inKey)
        let outputAddr = wallet.getTradingAddress(outKey)

        let order = {
            expiration: expirationInMin,
            pubkey: winfo.pubkey,
            pair: pair,
            amountIn: amountIn,
            rate: rate,
            withdrawalAddress: outputAddr,
            returnAddress: inputAddr
        }
        log.debug('order', order)

        spinner.start();

        let resp = await client.orderCreate(order)

        spinner.stop(true)

        log.debug(tag, 'resp', resp)
        if(resp && resp.payload && resp.payload.orderId && resp.payload.depositAddress) {
            await _displayOrder(resp.payload, arguments)
        } else {
            throw "unable to create an order"
        }
    } catch (e) {
        spinner.stop(true)
        throw e
    }
}


async function _displayOrder(result, parameters) {
  let coins = parameters[0].split("_")
  // log.debug(tag," coins: ",coins)
  let inCoin = coins[0]
  // log.debug(tag,"inCoin: ",inCoin)
  console.log("\n ****** Confirm order params! ****** \n \n")

  let tableOrderArbiter = new Table();
  let payload = result
  //iterate over the first 5 bids
  log.debug(`Object.keys(payload)`, Object.keys(payload))
  Object.keys(payload).forEach(function(key) {
      let val = payload[key];

      tableOrderArbiter.push({[key]:val})
  });
  // console.log("(Arbiter) order params: \n"+tableOrderArbiter.toString());


  let tableOrderOracle = new Table();
  let resultOracle = await statusOracle(result.orderId)
  //iterate over the first 5 bids
  let payloadOracle = resultOracle.payload
  Object.keys(payloadOracle).forEach(function(key) {
      let val = payloadOracle[key];

      tableOrderOracle.push({[key]:val})
  });

  // console.log("(Oracle) order params: \n"+tableOrderOracle.toString());
  //
  // //verify signatures!
  // let verifiedSigs = await verifySigs(result, resultOracle)
  // log.debug(`verifiedSigs`, verifiedSigs)
  // console.log(" \n **** Verifing sigs! ***** \n")
  // let tableSigs = new Table({
  //   head: ['Source', 'Address', 'Verified', 'Signature']
  // })
  //
  // tableSigs.push([`Arbiter`, ARBITER_SIGNING_ADDRESS, verifiedSigs.arbiter, result.signature])
  // tableSigs.push([`Oracle`, ORACLE_SIGNING_ADDRESS, verifiedSigs.oracle, resultOracle.signature])
  // console.log("Signatures: \n"+tableSigs.toString())

  console.log(" \n **** Action Required! ***** \n")
  console.log(" Please send exactly amount: "+parameters[1]+" ("+inCoin+") to address: "+payload.depositAddress+" \n \n ")
}


async function getOrder(orderId) {
    let arbiter = await client.getOrder(orderId)
    let oracle = await client.getOrder(orderId)
    return { arbiter, oracle }
}


async function sendFund(inputCoin, inAmount, depositAddr) {
    let tag = TAG + " |sendFund| "
    let debug = false
    try
    {
        let coinNode = getCoinNode(inputCoin)
        let txid = await coinNode.sendToAddress(depositAddr, inAmount)
        if (txid)    return txid
        else        return new Error("unable to send fund...")
    } catch (e) {
        log.error(tag, e)
    }
}

function descendingOrder(a, b) {
  return parseFloat(b.price) - parseFloat(a.price)
}

async function book(pair) {
  //render as a table
  let tag = "book"
  let result = await client.orderbook(pair)
  //result = result.payload

  if ( !result.bids ) {
    log.debug(`could not find market for ${pair}`)
    return
  }

  let bids = result.bids.filter(b => b)
  let asks = result.offers.filter(a => a)

  asks.sort(descendingOrder)
  bids.sort(descendingOrder)

  let tableBids = new Table();
  let tableAsks = new Table();

  //iterate over the first 5 bids
  for (let i = 0; i < 5; i++){
    if (bids[i]) {
      tableBids.push({price:bids[i].price+" ("+bids[i].quantity+") "})
    }
  }

  //iterate over the first 5 asks
  for (let i = asks.length > 5 ? asks.length - 5 : 0; i < asks.length; i++){
    tableAsks.push({price:asks[i].price+" ("+asks[i].quantity+") "})
  }

  console.log("Asks: \n" + tableAsks.toString());
  console.log("Bids: \n" + tableBids.toString());
  console.log('showing the first 5 prices on each side of the book')
}


async function cancel(orderId) {
    return await client.cancel(orderId)
}

async function retarget(orderId,rate) {
    return await client.retarget(orderId,rate)
}

async function getHotBal() {
  let servers = { ltc, btc }

  Object.keys(servers).forEach(async coin => {
      let balance = await servers[coin].getBalance()
      log.debug(coin + `: `, balance)
  })
}
