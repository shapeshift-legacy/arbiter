const request = require("request-promise")
//let configs = require("../configs/configMaster").configs();
const config = require("../configs/env")
const assert = require("chai").assert
const TAG = "rpc | "

/** native rpc client*/
exports.rpcCall = async (method,params)=>{
    let tag = TAG + " | post_request | ";
    try{
        let call_body = {
            "jsonrpc":"2.0",
            "method" : method,
            "params": params,
            "id": 1
        };
        let options = {
            method : "POST",
            url : "http://"+config.ETH_DAEMON.host+":"+config.ETH_DAEMON.port,
            headers :{'content-type':'application/json'},
            body : JSON.stringify(call_body)
        };
        let result = await request(options);
        assert(result,"No result from rpc call :"+method)
        result = JSON.parse(result);
        if(result.error) throw JSON.stringify(result.error)
        return result.result;
    }catch(err){
        throw new Error(err)
    }
};
exports.getGasPrice = async()=>{
    try{
        let gas_price = await config.redis.get("gasPrice")
        if(!gas_price){
            let gas_price = await this.rpcCall("eth_getGasPrice",[])
            await redis.setex("gasPrice", gas_price.toNumber(), config.CACHE_TIME)
        }
        return gas_price
    }catch(e){throw e}
}