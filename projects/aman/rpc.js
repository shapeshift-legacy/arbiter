
/*
        Aman JSON-RPC

            - Fully compatible with bitcoind's rpc

    Goals:
        * utilize bitcoin-promise as standerd client between ALL coins
        * maximize compatibility between methods
        * utilize bitcoin-cli with aman


    Compatiblity modes:
        Legacy shapeshift:
            * one coin per port (coin is assumed based on port configs)

    TODO
    Aman protocal 2.0:
        * Built in coin detection into the rpc protocal    ( uwallet = local_coin_client(daemon.configs), uwallet.coins = ["BTC"...], uwallet.btc.getNewAddress() )
        * method mapping and on the fly client expanding
        * coin support built into client (able to build uwallet object based on RPC-protocal params)
        * coin activation/deactivation/status maintained via protocal level RPC
        *
        *

*/

const TAG = " | RPC | "

const client = require('./modules/eth-client')
const ethWallet = require('./modules/eth-wallet')
const tokenWallet = require('./modules/token-wallet')
const describe = require('./modules/describe')
const { isToken } = require('./modules/token-manager')
const { COIN, RPC_PORT } = require('./configs/env')
const log = require('@arbiter/dumb-lumberjack')()
const RpcServer = require('./support/index.js').Server;


const server = new RpcServer({
    protocol:'http',
    path:'/',
    port: RPC_PORT,
    method:'GET'
});

let methods

// setup whether this is an eth rpc or a token rpcs
if ( isToken(COIN) ) {
  methods = Object.assign(client, tokenWallet)
} else if ( COIN === "ETH" ) {
  methods = Object.assign(client, ethWallet)
} else {
  throw Error(`unknown coin ${COIN}`)
}

const map = describe.map(methods)
log.debug("methods known: ",map)

Object.keys(map).forEach(function(key) {
    let tag = TAG + " | " + key + " | "
    server.addMethod(key.toLowerCase(),async function(parameters, id){
        try {
            log.debug(tag, "parameters: ", parameters)

            //expected params
            let expectedParams = map[key]
            log.debug(tag, "expectedParams: ", expectedParams)

            /*
                Sanity check params
                right amount
                does address* look like an address*
                rules*
             */

            const result = await methods[key].apply(this, parameters)
            log.debug(tag, result)

            return {id:id, error:null, result}
        } catch(e) {
            log.error(e)
            return {id:id, error:e.toString(), result:false}
        }
    })

})

server.addMethod('methods', async function(parameters, id){
    try{
        return {id:id, error:null, result:map}
    }catch(e){
        return {id:id, error:e.toString(), result:null}
    }
});

log.notice(TAG, `rpc started for ${COIN} on port ${RPC_PORT}`)
