let TAG = " | ETH - client | "
let when = require('when')
let Redis = require('promise-redis')();
let redis = Redis.createClient();
//let configs = require("../configs/configMaster").configs();
const config = require("../configs/env")
let crypto = require("crypto");
let fs = require("fs");
const log = require('@arbiter/dumb-lumberjack')()
let pubsub = require("redis")
    , subscriber = pubsub.createClient()
    , publisher  = pubsub.createClient();

//Globals
//let COINBASE =  config.daemons.ETH.shapeshiftAddress;

let request = require("request")
//let ETHORACLECCHANNEL = "ethOracleVerify"
let BASE = 1000000000000000000;

//let contractCreator = require("./contractCreator");
const BigNumber = require('bignumber.js');

const Promise = require("bluebird");

let Web3 = require('web3');
let web3 = new Web3();
log.debug(TAG,"config: ",config)
web3.setProvider(new Web3.providers.HttpProvider('http://'+config.ETH_DAEMON.host+":"+config.ETH_DAEMON.port));

// let promisify = require("./promisify.js")
// web3 = promisify.promisify(web3)

module.exports = {
    getCoinbase: function () {
        return get_coinbase()
    },
    getNewAddress: function () {
        return get_new_address()
    },
    getBalanceAddress: function (address) {
        return get_balance(address)
    },
    getBalanceToken: function (address,token) {
        return get_balance_token(address,token)
    },
    getBalanceTokens: function (address) {
        return get_balance_tokens(address)
    },
    getAccounts: function () {
        return list_accounts()
    },
    sendToAddress: function (address,amount) {
        return send_to_address(address,amount)
    },
    // getAccounts: function () {
    //     return send_to_address()
    // },
}

let get_gas_price = function(){
    var tag = TAG+ " | get_new_address | "
    var d = when.defer();
    var debug = false
    web3.eth.getGasPrice(function(error,result){
        if(!error){

            d.resolve(result)
        } else {
            console.error(error,result)
            d.reject(error)
        }
    });
    return d.promise
}

let get_new_address = function(){
    var tag = TAG+ " | get_new_address | "
    var d = when.defer();
    var debug = false
    web3.personal.newAccount(config.ETH_DAEMON.unlock,function(error,result){
        if(!error){
            if(debug) console.log(tag,"newaddress: ",result);
            redis.sadd("eth:address:internal",result)

            d.resolve(result)
        } else {
            console.error(error,result)
            d.reject(error)
        }
    });
    return d.promise
}

// var get_address_Balance = function (address){
//     var d = when.defer();
//     try
//     {
//         var contract = contractCreator.getContractFromAddress(address);
//         //console.log("contract: ",contract)
//         contract.getBalance.call(function(err,res){
//             if(err) d.reject(err);
//             else{
//                 d.resolve((""+res)/BASE);
//             }
//         })
//     }catch(err){
//         d.reject(err)
//     }
//     return d.promise;
// }

// get_address_Balance('0x94c995d790c79005f334e1699028d3fb571475b7')
//     .then(function (resp) {
//         console.log(resp)
//     })
//console.log(config.daemons.ETH)


//list accounts

//get balance

// get_new_address()
//     .then(function(resp){
//         console.log(resp)
//     })

//list accounts
let list_accounts = function(){
    var tag = TAG+ " | get_new_address | "
    var d = when.defer();
    var debug = false
    //console.log(web3)
    web3.personal.getListAccounts(function(error,result){
        if(!error){
            d.resolve(result)
        } else {
            console.error(error,result)
            d.reject(error)
        }
    });
    return d.promise
}

let get_coinbase = async function(){
    var tag = TAG+ " | get_new_address | "
    try{
        //Use redis
        let output = await redis.hget("coinbase","address")
        return output
    }catch(e){
        log.error(tag,"output: ",output)
    }
}

let get_balance = function(address){
    var tag = TAG+ " | get_new_address | "
    var d = when.defer();
    var debug = false
    //console.log(web3)
    web3.eth.getBalance(address,function(error,result){
        if(!error){
            d.resolve(result.toString()/BASE)
        } else {
            console.error(error,result)
            d.reject(error)
        }
    });
    return d.promise
}


let get_wallet_multisig = async function(){
    var tag = TAG+ " | get_wallet_multisig | "
    var d = when.defer();
    var debug = false
    //console.log(web3)
    try{
        //
        let abiInfo = require("../build/WalletSimple.abi.js")
        //let abiInfo = require("../coins/OMG.abi.js")
        //console.log(tag,"abiInfo: ",abiInfo)

        //
        let ABI = abiInfo.ABI
        //let metaData = abiInfo.metaData

        //
        let abiInterface = web3.eth.contract(ABI);
        console.log(tag,"abiInterface: ",abiInterface)



        let contract = abiInterface.at("0xa9fbcc3bbfdc38b09c35f3414645bb783841add9");
        console.log(tag,"contract: ",contract)


        return true
    }catch(e){
        console.error(tag,e)
    }

    return d.promise
}
//get_wallet_multisig()


let get_balance_token = async function(address,token){
    var tag = TAG+ " | get_balance_token | "
    var d = when.defer();
    var debug = false
    //console.log(web3)
    try{
        //
        let abiInfo = require("../coins/"+token.toUpperCase()+".abi.js")
        //console.log(tag,"abiInfo: ",abiInfo)

        //
        let ABI = abiInfo.ABI
        let metaData = abiInfo.metaData

        //
        let abiInterface = web3.eth.contract(ABI);
        if(debug) console.log(tag,"abiInterface: ",abiInterface)

        let contract = abiInterface.at(metaData.contractAddress);

        let getBalance = Promise.promisify(contract.balanceOf.call);


        let balance = await getBalance(address, "pending")
        //console.log(tag,"balance: ",balance)

        return balance.toNumber()/metaData.BASE
    }catch(e){
        console.error(tag,e)
    }

    return d.promise
}


let get_balance_tokens = async function(address){
    var tag = TAG+ " | get_balance_tokens | "
    var d = when.defer();
    var debug = false
    //console.log(web3)
    try{
        let output = {}
        //get dir of tokens
        let tokenListABI = fs.readdirSync("./coins/")
        if(debug) console.log(tag,"tokenListABI: ",tokenListABI)
        //return balance

        output.ETH = await get_balance(address)
        output.ETH = output.ETH.toNumber()/BASE

        for (let i = 0; i < tokenListABI.length; i++) {
            let token = tokenListABI[i]
            token = token.split(".")
            if(debug) console.log(tag,"tokenArray: ",token)
            token = token[0]
            let tokenBalance = await get_balance_token(address,token)
            if(tokenBalance > 0) output[token] = tokenBalance
        }
        return output
    }catch(e){
        console.error(tag,e)
    }

    return d.promise
}


var get_transaction_receipt = function(txid){
    var d = when.defer();
    var tag = TAG+" | get_transaction | "
    var debug = true
    if(debug) console.log(tag,"txid: ",txid)
    //console.log(tag," web3.eth: ", web3.eth)

    web3.eth.getTransactionReceipt(txid, function (err, result) {
        if (err) console.error(tag," ERROR: ",err)
        if (err) d.reject(err)
        if (!result) d.reject("tx not found ");

        if(debug) console.log(tag,"result: ",result)
        var tx = {}
        // tx.address = result.to
        // tx.amount = web3.fromWei(result.value);
        // tx.confirmations = 1; //confirmation is checked after the 25 hours in wallet monitor, this is when it's already included in the blockchain.
        // tx.txid = result.hash;
        // tx.source = result.from;
        // // tx.fee = web3.fromWei(result.gasPrice)
        // //tx.isOur = isOurBoolean(result.to)
        // //if(tx.isOur) tx.category = 'receive'
        // //tx.category = 'send'
        // if(debug) console.log(tag,"tx: ",tx)
        d.resolve(result)
    })

    return d.promise
}

var get_transaction = function(txid){
    var d = when.defer();
    var tag = TAG+" | get_transaction | "
    var debug = true
    console.log(tag,"txid: ",txid)
    console.log(tag," web3.eth: ", web3.eth)
    web3.eth.getTransactionByHash(txid, function (err, result) {
        if (err) console.error(tag," ERROR: ",err)
        if (err) d.reject(err)
        if (!result) d.reject("tx not found ");

        if(debug) console.log(tag,"result: ",result)
        var tx = {}
        tx.address = result.to
        tx.amount = web3.fromWei(result.value);
        tx.confirmations = 1; //confirmation is checked after the 25 hours in wallet monitor, this is when it's already included in the blockchain.
        tx.txid = result.hash;
        tx.source = result.from;
        // tx.fee = web3.fromWei(result.gasPrice)
        //tx.isOur = isOurBoolean(result.to)
        //if(tx.isOur) tx.category = 'receive'
        //tx.category = 'send'
        if(debug) console.log(tag,"tx: ",tx)
        d.resolve(tx)
    })

    return d.promise
}


//console.log(web3)

//if none found generate 10

//get balance of address

//sendtoaddress

var send_to_address = function(address,amount){
    var tag = TAG+" | send_to_address | "
    var d = when.defer();
    var sendObject = {
        from : web3.eth.coinbase,
        to:address.toString(),
        value : web3.toWei(amount,"ether"),
        gas : 250000 //higher gas
    }
    console.log(tag,"sendObject: ",sendObject)
    web3.eth.sendTransaction(sendObject,"latest",function(err,hash){
        if(!err){
            console.log("sent: ", hash)
            d.resolve(hash)
        } else {
            console.error(tag,"ERROR: ",err,hash)
        }
    })
    return d.promise
}
//console.log(web3)


let watch_token_contract = async function(token){
    var tag = TAG+ " | get_balance_token | "
    var d = when.defer();
    var debug = false
    //console.log(web3)
    try{
        //
        let abiInfo = require("../build/"+token.toUpperCase()+".abi.js")
        //console.log(tag,"abiInfo: ",abiInfo)

        //
        let ABI = abiInfo.ABI
        let metaData = abiInfo.metaData

        //
        let abiInterface = web3.eth.contract(ABI);
        console.log(tag,"abiInterface: ",abiInterface)



        let contract = abiInterface.at(metaData.contractAddress);

        //watch for transfers
        var filter = contract.Transfer()
        filter.watch(function(error,resp){
            console.log(tag,"error: ",error)
            console.log(tag,"resp: ",resp)
        })

    }catch(e){
        console.error(tag,e)
    }

    return d.promise
}

//watch_token_contract("BAT")


/*
************* [ '0xb1b359cb06b3a40c53b2fa5ec112214626bc187a',
  '0xbcbd7ec77f3f286bdafcde2a3720e39e93a726c6',
  '0x0bb0cb323c4db61aa1f7d569dbdaa773a21dac58',
  '0x6c2e32bedb4371c6a81336b3ed3c6e6beb7eeb41',
  '0x3cfe10dae5c8e87e300048fba197b6a80a17a882',
  '0xd2eff3c754ced98928ba88d9a203825563484a45',
  '0xacf2ed8a22d990bd9e6690f2ce9141df206f6a1c',
  '0x28f38990b1af6d3e5125a876a0aa0c7e7287e65c',
  '0xfaf1321b57adbecc5ebb6317bf03a6211b674d0b',
  '0xfa79424df07f2f22cc159881e05dc85f920daefa' ]

 */

// get_balance_tokens("0x33b35c665496bA8E71B22373843376740401F106")
//     .then(function(resp){
//         console.log("balance: ",resp)
//     })


// console.log("web3: ",web3)
// console.log("web3.eth: ",web3.eth)

// get_balance("0x5b8fce37cd787e8a55dfc8db87e732aab119eb2a")
//     .then(function(resp){
//         console.log("balance: ",resp.toFixed(8))
//     })

// get_balance_token("0x5b8fce37cd787e8a55dfc8db87e732aab119eb2a","OMG")
//     .then(function(resp){
//         console.log("balance: ",resp.toFixed(8))
//     })

// send_to_address("0x33b35c665496bA8E71B22373843376740401F106", 0.001)
//     .then(function(txid){
//         console.log(txid)
//     })
//


// list_accounts()
//     .then(function(resp){
//         console.log(resp)
//     })

//
// get_new_address()
//     .then(function(resp){
//         console.log(resp)
//     })

//
// get_coinbase()
//     .then(function(resp){
//         console.log(resp)
//     })


// get_gas_price()
//     .then(function(resp){
//         console.log(resp.toString())
//     })

//
// get_transaction('0x2d6d792ce6d267e55aaea1cc91f9edd3f656505c5596c780fb0ff776990e2b45')
//     .then(function(resp){
//         console.log(resp)
//     })


// get transaction recipt

//0x7669194d2fd1033197b549cbc81136906b2c7997baf7a2d776bc5303bbd7470e

//0x89a1053cd634ecd06d5eacebd1d17df5fd1f12065dc8eb2365a3f10b34240c6a

// get_transaction_receipt('0x89a1053cd634ecd06d5eacebd1d17df5fd1f12065dc8eb2365a3f10b34240c6a')
//     .then(function(resp){
//         console.log(resp)
//     })


//
// var send_to_arbiter_contract_exe = function(contract,amount){
//     var d = when.defer();
//     var tag = TAG+" | wrap_contract_promise | "
//     amount = .01
//     contract.sendToArbiterRequest.sendTransaction(amount*BASE,{from:COINBASE,gas: 250000},function(err,res){
//         console.log(tag + "resp  of multisig send: " + res)
//         if(err) d.reject(err);
//         else{
//             d.resolve(contract);
//         }
//     })
//
//     return d.promise;
// }
//
