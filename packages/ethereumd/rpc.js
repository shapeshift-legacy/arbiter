
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
        * coin activation/deactivation/status maintatined via protocal level RPC
 */

const TAG = " | RPC | "
require('dotenv').config();
const log = require('@arbiter/dumb-lumberjack')()
let wallet = require('./modules/eth-wallet.js')
wallet.init()
let describe = require('./modules/describe.js')
const RpcServer = require('./support/index.js').Server;

const server = new RpcServer({
    protocol:'http',
    path:'/',
    port:4003,
    method:'GET'
});

//map module
const map = describe.map(wallet)
console.log("methods known: ",map)

Object.keys(map).forEach(function(key) {
    let tag = TAG + " | "+key+" | "
    server.addMethod(key.toLowerCase(),async function(parameters, id){
        let debug = true
        try{
            if(debug) console.log("parameters: ",parameters)

            //expected params
            let expectedParams = map[key]
            if(debug) console.log("expectedParams: ",expectedParams)

            /*
                Sanity check params
                right amount
                does address* look like an address*
                rules*
             */

            const result = await wallet[key].apply(this, parameters)
            return {id:id, error:null, result}
        }catch(e){
            console.error(e)
            return {id:id, error:e.toString(), result:false}
        }
    })

})
