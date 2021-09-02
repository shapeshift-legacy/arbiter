

/*
        Arbiter CLI Demo



    Steps
        1. Signup
            Notes: Generates a bitcoin keypair pub/priv this is the customers "username"

            Input: Requests users ETH address, BTC, LTC.

            hit api:

            Output: write to file/redis


        2. View coins/orderbooks/bla bla

        3. create order

            Input:
                Pair: BTC_LTC
                Withdrawal: Pre-populate with setup address LTC
                Return: Pre-populate with BTC return
                rate: Pre=populate current lowest ask/bid
                amountIn:
                expirates: pre-populate

            output:
                orderId

        4. monitor order:

            set intervial: seconds
                GetStatus:
                    unfunded/live/complete

                complete:
                    Links block explorer

        5. cancel order
            input: orderId:

            output: txid


        6. Order history
            View all orders: + status


 */


// global.CLI_MODE = true
//
// try {
//     require(process.env['HOME']+'/arbiter-setup.js')
//     global.USER_IS_SETUP = true
// } catch(e) {
//     global.USER_IS_SETUP = false
// }

const vorpal = require('vorpal')();
const TAG = " | demo - cli | "
const prompt = "arbiter-cli:"
// const ledger = require('./modules/ledger.js')
const commands = require('./modules/demo-commands.js')
const describe = require('./modules/describe.js')
const client = require('./modules/client.js')
const cliCommands = describe.map(commands)
const log = require('@arbiter/dumb-lumberjack')()
// console.log("\n methods known: ", walletFunctions)
log.info("ENV URL: ",process.env['ARBITER_URL'])

let help = {
    // testLedger: {
    //   text: "test your ledger device"
    // },
    setup: {
      text: "begin the setup process"
    },
    signUp: {
      text: "signUp: [btcSigningPub, ethAddress]"
    },
    getOrCreateUserAccount: {
      text: "getOrCreateUserAccount []"
    },
    createOrder: {
      text: "createOrder: [pair, expirationInMin, amountIn, rate]",
      extra: "\n`pair` should be [input-coin]_[output-coin]\nIE, to deposit BTC and receive LTC, use `BTC_LTC`\n"
    },
    markets: {
      text: "markets (no params)"
    },
    orders: {
      text: "orders (no params)"
    },
    getOrderInfoFromArbiter: {
      text: "getOrderInfoFromArbiter: [orderId]"
    },
    getOrderInfoFromOracle: {
      text: "getOrderInfoFromOracle [orderId]"
    },
    sendFund: {
      text: "sendFund [inputCoin, inAmount, depositAddress]"
    },
    getOrderBook: {
      text: "getOrderBook [pair]"
    },
    info: {
      text: "info (no params)"
    }
}


function addMainCommands() {
    let tag = TAG+" | demo-core | "

    console.log("\n type *help* for cli options \n")

    //view user info

    Object.keys(cliCommands).forEach(async function(key) {
        let tag = TAG + " | "+key+" | "
        let expectedParams = cliCommands[key]
        let helpString

        if (help[key]) {
          helpString = help[key].text
        }

        if (!helpString) helpString = key+": expected params: "+expectedParams

        // add all the commands from the wallet
        vorpal
          .command(key, helpString)
          .action(async function (args, cb) {
                let params = []

                // if there's extra info for a given command, print it here
                if ( help[key] && help[key].extra ) {
                  console.log( help[key].extra )
                }

                if(expectedParams.length > 0){
                    for(let i = 0; i < expectedParams.length; i++){
                        let param = {
                            type: 'input',
                            name: expectedParams[i],
                            message: "input "+expectedParams[i]+": "
                        }
                        params.push(param)
                    }
                }

                let answers = await this.prompt(params)

                let parameters = []
                Object.keys(answers).forEach(function(answer) {
                    parameters.push(answers[answer])
                })

                try {
                  let result = await commands[key].apply(this, parameters)

                  if ( result ) {
                    try {
                      log.debug(typeof result)
                      if ( typeof result === "string" ) {
                        result = JSON.parse(result)
                      }
                    } catch (ex) {}
                    console.log(JSON.stringify(result, false, '  '))
                  }
                } catch (ex) {
                  console.error(`Error: `, ex)
                }

                vorpal.delimiter(prompt).show();

                //return prompt
                cb();
            });


    })

}


// const testLedger = async function (args, cb) {
//     let tag = "testLedger"
//     let params = []
//
//     let expectedParams = []
//
//     if(expectedParams.length > 0){
//         for(let i = 0; i < expectedParams.length; i++){
//             let param = {
//                 type: 'input',
//                 name: expectedParams[i],
//                 message: "input "+expectedParams[i]+": "
//             }
//             params.push(param)
//         }
//     }
//
//     let answers = await this.prompt(params)
//     let debug = false
//     log.debug(tag,"answers: ",answers)
//
//     let resultLedger = await ledger.init()
//     console.log("\n resultLedger: ",resultLedger)
//     cb();
// }

const checkEthStatus = async () => {
  let account = await client.getAccount()

  log.debug(typeof account)

  if ( account.payload && !account.payload.contractAddress ) {
    console.log(`WARNING: you have not configured your ETH multisig wallet. Use 'ethWalletFactoryAddress' and 'updateAccount' to setup ETH deposits`)
  }

  return account
}

const run = async () => {
  try {
    addMainCommands()
    console.log(`checking eth status`)
    await checkEthStatus()
  } catch (ex) {
    console.error(`Error: `, ex)
  }

  vorpal.delimiter(prompt).show()
}

run().catch(console.error)
