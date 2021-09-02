
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


let wallet = require('./mocks/golem.js')
// let client = require('./modules/eth-client.js')
let describe = require('./modules/describe.js')
//const RpcServer = require('node-json-rpc2').Server;

let port = 18303
let coin = "GNT"

const RpcServer = require('./support/index.js').Server;
const server = new RpcServer({
    protocol:'http',
    path:'/',
    port,
    method:'GET'
});

// const methods = Object.assign({}, wallet, client)
const map = describe.map(wallet)
console.log("methods known: ",map)

//wallet.init()

Object.keys(map).forEach(function(key) {
    let tag = TAG + " | "+key+" | "
    server.addMethod(key.toLowerCase(),async function(parameters, id){
        let debug = true
        try{
            if(debug) console.log(tag, "parameters: ",parameters)

            //expected params
            let expectedParams = map[key]
            if(debug) console.log(tag, "expectedParams: ",expectedParams)

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



server.addMethod('methods', async function(parameters, id){
    try{
        return {id:id, error:null, result:map}
    }catch(e){
        return {id:id, error:e.toString(), result:null}
    }
});

console.log(TAG, `rpc started for ${coin} on port ${port}`)
