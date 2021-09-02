const request = require("request-promise")
const TAG = "rpc | "
let { ETH_DAEMON_HOST, ETH_HTTP_PORT } = require("../configs/env")

exports.rpcCall = async (method,params)=>{
    let tag = TAG + " | post_request | ";
    let debug = true
    try{
        let call_body = {
            "jsonrpc":"2.0",
            "method" : method,
            "params": params,
            "id": 1
        };
        let options = {
            method : "POST",
            url : "http://"+ETH_DAEMON_HOST+":"+ETH_HTTP_PORT,
            headers :{'content-type':'application/json'},
            body : JSON.stringify(call_body)
        };
        let result = await request(options);
        console.log(result,"No result from rpc call :"+method)
        result = JSON.parse(result);
        if(result.error) throw JSON.stringify(result.error)
        return result.result;
    }catch(err){
        throw new Error(err)
    }
};
// exports.getGasPrice = async()=>{
//
//     try{
//         let gas_price = await config.redis.get("gasPrice")
//         if(!gas_price){
//             let gas_price = await this.rpcCall("eth_getGasPrice",[])
//             await redis.setex("gasPrice", gas_price.toNumber(), config.CACHE_TIME)
//         }
//         return gas_price
//     }catch(e){throw e}
// }
